/**
 * A simple promise queue to prevent hitting Discord's rate limits (429).
 * 
 * If 20 users join the lobby at the same second, Discord will start rejecting
 * channel creation requests. This queue spaces them out.
 */
export class RateLimitQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private delayMs: number;

  constructor(delayMs: number = 1000) {
    this.delayMs = delayMs;
  }

  /**
   * Add a task to the queue.
   * Returns a promise that resolves when the task completes.
   */
  public async add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        await task();
        // Wait between requests to respect rate limits
        if (this.queue.length > 0) {
          await this.sleep(this.delayMs);
        }
      }
    }
    this.processing = false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current queue length.
   */
  public size(): number {
    return this.queue.length;
  }

  /**
   * Clear the queue (useful on bot shutdown).
   */
  public clear(): void {
    this.queue = [];
  }
}