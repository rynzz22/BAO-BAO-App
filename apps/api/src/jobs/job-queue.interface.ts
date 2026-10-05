/**
 * Job Queue Interface
 * Defines contracts for background jobs (offer timeouts, ride TTL expiration, SMS delivery).
 * Per project specifications, BullMQ / pg-boss contract is defined here without wiring a live Redis queue in Phase 1.
 */

export interface Job<T = any> {
  id: string;
  name: string;
  data: T;
  timestamp: number;
  delay?: number;
}

export interface JobOptions {
  delayMs?: number;
  attempts?: number;
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
}

export interface IJobQueue {
  add<T = any>(jobName: string, data: T, options?: JobOptions): Promise<Job<T>>;
  process<T = any>(jobName: string, handler: (job: Job<T>) => Promise<void>): void;
}

export class InMemoryJobQueueStub implements IJobQueue {
  private handlers = new Map<string, (job: Job<any>) => Promise<void>>();

  async add<T = any>(jobName: string, data: T, options?: JobOptions): Promise<Job<T>> {
    const job: Job<T> = {
      id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: jobName,
      data,
      timestamp: Date.now(),
      delay: options?.delayMs,
    };

    // If a delay is set, optionally schedule it
    if (options?.delayMs && options.delayMs > 0) {
      setTimeout(() => {
        const handler = this.handlers.get(jobName);
        if (handler) {
          handler(job).catch((err) =>
            console.error(`[JobQueueStub] Error processing job ${jobName}:`, err),
          );
        }
      }, options.delayMs);
    } else {
      const handler = this.handlers.get(jobName);
      if (handler) {
        handler(job).catch((err) =>
          console.error(`[JobQueueStub] Error processing job ${jobName}:`, err),
        );
      }
    }

    return job;
  }

  process<T = any>(jobName: string, handler: (job: Job<T>) => Promise<void>): void {
    this.handlers.set(jobName, handler);
  }
}
