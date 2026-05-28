import IORedis from 'ioredis';
import { Queue } from 'bullmq';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export let redisConnection: IORedis | null = null;
export let assignmentQueue: Queue | null = null;

export async function initQueue(): Promise<boolean> {
  try {
    const client = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: true,
      connectTimeout: 3000,
      retryStrategy: () => null, // don't reconnect — fail fast
    });

    // Suppress unhandled error events (connection refused spam)
    client.on('error', () => {});

    await client.connect();
    await client.ping(); // verify it's actually up

    redisConnection = client;
    assignmentQueue = new Queue('assignment-generation', {
      connection: client,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    });

    process.env.REDIS_AVAILABLE = 'true';
    return true;
  } catch (err) {
    console.warn('⚠️  Redis not available:', (err as Error).message);
    process.env.REDIS_AVAILABLE = 'false';
    return false;
  }
}

export async function enqueueGeneration(assignmentId: string, data: object): Promise<string> {
  if (assignmentQueue) {
    // BullMQ path
    const job = await assignmentQueue.add(
      'generate-paper',
      { assignmentId, ...data },
      { jobId: `gen-${assignmentId}-${Date.now()}` }
    );
    return job.id!;
  } else {
    // Direct in-process path — trigger async without blocking the response
    const jobId = `direct-${assignmentId}-${Date.now()}`;
    // Delay slightly so the HTTP response goes out first
    setImmediate(() => {
      import('../workers/generationWorker').then(({ runDirectJob }) => {
        runDirectJob(assignmentId, data).catch(console.error);
      });
    });
    return jobId;
  }
}
