import { Worker, Job } from 'bullmq';
import fs from 'fs';
import mongoose from 'mongoose';
import IORedis from 'ioredis';

import Assignment from '../models/Assignment';
import GeneratedPaper from '../models/GeneratedPaper';
import { generateQuestionPaper } from '../services/geminiService';
import { wsService } from '../services/websocketService';

// ─── Core job processor (shared by BullMQ worker and direct runner) ──────────
async function processGenerationJob(assignmentId: string) {
  console.log(`🔧 Processing generation for assignment ${assignmentId}`);

  wsService.broadcast({
    type: 'job:progress', assignmentId, status: 'processing',
    progress: 10, message: 'Starting question paper generation...',
  });

  await Assignment.findByIdAndUpdate(assignmentId, { status: 'processing' });

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new Error(`Assignment ${assignmentId} not found`);

  // Read file content if it's a .txt upload
  let fileContent: string | undefined;
  if (assignment.filePath && fs.existsSync(assignment.filePath)) {
    try {
      if (assignment.filePath.endsWith('.txt')) {
        fileContent = fs.readFileSync(assignment.filePath, 'utf-8').substring(0, 3000);
      }
    } catch (e) {
      console.warn('Could not read file content:', e);
    }
  }

  wsService.broadcast({
    type: 'job:progress', assignmentId, status: 'processing',
    progress: 30, message: 'Sending to Gemini AI for generation...',
  });

  const rawPaper = await generateQuestionPaper({
    subject: assignment.subject,
    grade: assignment.grade,
    questionTypes: assignment.questionTypes,
    instructions: assignment.instructions,
    fileContent,
  });

  wsService.broadcast({
    type: 'job:progress', assignmentId, status: 'processing',
    progress: 70, message: 'Structuring and saving question paper...',
  });

  const generatedPaper = new GeneratedPaper({
    assignmentId: new mongoose.Types.ObjectId(assignmentId),
    schoolName: rawPaper.schoolName,
    subject: rawPaper.subject,
    grade: rawPaper.grade,
    timeAllowed: rawPaper.timeAllowed,
    examRules: rawPaper.examRules,
    totalMarks: rawPaper.totalMarks,
    totalQuestions: rawPaper.totalQuestions,
    sections: rawPaper.sections,
    answerKey: rawPaper.answerKey,
  });

  await generatedPaper.save();

  await Assignment.findByIdAndUpdate(assignmentId, {
    status: 'completed',
    generatedPaperId: generatedPaper._id,
  });

  wsService.broadcast({
    type: 'job:completed', assignmentId, status: 'completed',
    progress: 100, message: 'Question paper generated successfully!',
    paperId: generatedPaper._id.toString(),
  });

  console.log(`✅ Generation complete for assignment ${assignmentId}`);
}

// ─── BullMQ worker (used when Redis IS available) ────────────────────────────
export function startWorker() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const workerRedis = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  });

  const worker = new Worker(
    'assignment-generation',
    async (job: Job) => processGenerationJob(job.data.assignmentId),
    { connection: workerRedis, concurrency: 2 }
  );

  worker.on('failed', async (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);
    if (job?.data?.assignmentId) {
      await Assignment.findByIdAndUpdate(job.data.assignmentId, {
        status: 'failed', errorMessage: err.message,
      });
      wsService.broadcast({
        type: 'job:failed', assignmentId: job.data.assignmentId,
        status: 'failed', progress: 0, message: `Generation failed: ${err.message}`,
      });
    }
  });

  worker.on('error', (err) => console.error('Worker error:', err));
  console.log('🚀 BullMQ worker started');
  return worker;
}

// ─── Direct runner (used when Redis is NOT available) ────────────────────────
export async function runDirectJob(assignmentId: string, _data: object) {
  try {
    await processGenerationJob(assignmentId);
  } catch (err: any) {
    console.error('Direct job failed:', err.message);
    await Assignment.findByIdAndUpdate(assignmentId, {
      status: 'failed', errorMessage: err.message,
    }).catch(() => {});
    wsService.broadcast({
      type: 'job:failed', assignmentId, status: 'failed',
      progress: 0, message: `Generation failed: ${err.message}`,
    });
  }
}
