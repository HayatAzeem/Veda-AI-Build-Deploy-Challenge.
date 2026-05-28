import { Router, Request, Response } from 'express';
import { upload } from '../middleware/upload';
import Assignment from '../models/Assignment';
import GeneratedPaper from '../models/GeneratedPaper';
import { enqueueGeneration, redisConnection } from '../queues/assignmentQueue';

const router = Router();

// Helper: safely use Redis cache (no-op when Redis not available)
async function cacheGet(key: string): Promise<string | null> {
  try { return redisConnection ? await redisConnection.get(key) : null; } catch { return null; }
}
async function cacheSet(key: string, ttl: number, value: string) {
  try { if (redisConnection) await redisConnection.setex(key, ttl, value); } catch {}
}
async function cacheDel(key: string) {
  try { if (redisConnection) await redisConnection.del(key); } catch {}
}

// POST /api/assignments — Create assignment and queue generation
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { title, subject, grade, dueDate, questionTypes, instructions } = req.body;

    if (!title || !subject || !grade || !dueDate || !questionTypes) {
      res.status(400).json({ error: 'Missing required fields: title, subject, grade, dueDate, questionTypes' });
      return;
    }

    let parsedQuestionTypes = questionTypes;
    if (typeof questionTypes === 'string') {
      parsedQuestionTypes = JSON.parse(questionTypes);
    }

    if (!Array.isArray(parsedQuestionTypes) || parsedQuestionTypes.length === 0) {
      res.status(400).json({ error: 'questionTypes must be a non-empty array' });
      return;
    }

    for (const qt of parsedQuestionTypes) {
      if (!qt.type || qt.count < 1 || qt.marks < 1) {
        res.status(400).json({ error: 'Each question type must have type, count >= 1, marks >= 1' });
        return;
      }
    }

    const assignment = new Assignment({
      title, subject, grade,
      dueDate: new Date(dueDate),
      questionTypes: parsedQuestionTypes,
      instructions: instructions || '',
      filePath: req.file?.path,
      fileName: req.file?.originalname,
      status: 'pending',
    });

    await assignment.save();

    const jobId = await enqueueGeneration(assignment._id.toString(), {
      subject, grade, questionTypes: parsedQuestionTypes, instructions,
    });

    await Assignment.findByIdAndUpdate(assignment._id, { jobId });
    await cacheDel('assignments:list');

    res.status(201).json({
      message: 'Assignment created and generation queued',
      assignment: {
        _id: assignment._id,
        title: assignment.title,
        subject: assignment.subject,
        grade: assignment.grade,
        dueDate: assignment.dueDate,
        status: 'pending',
        jobId,
      },
    });
  } catch (err: any) {
    console.error('Create assignment error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// GET /api/assignments — List all (Redis-cached)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const cacheKey = 'assignments:list';
    const cached = await cacheGet(cacheKey);
    if (cached) { res.json(JSON.parse(cached)); return; }

    const assignments = await Assignment.find()
      .sort({ createdAt: -1 })
      .select('-__v')
      .lean();

    await cacheSet(cacheKey, 30, JSON.stringify(assignments));
    res.json(assignments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/assignments/:id — Get single assignment with paper
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id).lean();
    if (!assignment) { res.status(404).json({ error: 'Assignment not found' }); return; }

    let paper = null;
    if (assignment.generatedPaperId) {
      paper = await GeneratedPaper.findById(assignment.generatedPaperId).lean();
    }
    res.json({ assignment, paper });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/assignments/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) { res.status(404).json({ error: 'Assignment not found' }); return; }
    if (assignment.generatedPaperId) {
      await GeneratedPaper.findByIdAndDelete(assignment.generatedPaperId);
    }
    await cacheDel('assignments:list');
    res.json({ message: 'Assignment deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/assignments/:id/regenerate
router.post('/:id/regenerate', async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) { res.status(404).json({ error: 'Assignment not found' }); return; }

    if (assignment.generatedPaperId) {
      await GeneratedPaper.findByIdAndDelete(assignment.generatedPaperId);
    }

    await Assignment.findByIdAndUpdate(req.params.id, {
      status: 'pending',
      $unset: { generatedPaperId: 1, errorMessage: 1 },
    });

    const jobId = await enqueueGeneration(assignment._id.toString(), {
      subject: assignment.subject,
      grade: assignment.grade,
      questionTypes: assignment.questionTypes,
      instructions: assignment.instructions,
    });

    await Assignment.findByIdAndUpdate(assignment._id, { jobId });
    await cacheDel('assignments:list');

    res.json({ message: 'Regeneration queued', jobId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/assignments/:id/paper
router.get('/:id/paper', async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id).lean();
    if (!assignment) { res.status(404).json({ error: 'Assignment not found' }); return; }
    if (!assignment.generatedPaperId) { res.status(404).json({ error: 'Paper not yet generated' }); return; }
    const paper = await GeneratedPaper.findById(assignment.generatedPaperId).lean();
    res.json(paper);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
