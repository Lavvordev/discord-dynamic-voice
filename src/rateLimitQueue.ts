type AsyncFunction<T> = () => Promise<T>;

export class RateLimitQueue {
  private queue: Array<AsyncFunction<unknown>> = [];
  private processing = false;
  private delayMs: number;

  constructor(delayMs = 1000) {
    this.delayMs = delayMs;
  }

  public async add<T>(task: AsyncFunction<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
      void this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        await task();
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

  public size(): number {
    return this.queue.length;
  }

  public clear(): void {
    this.queue = [];
  }
}