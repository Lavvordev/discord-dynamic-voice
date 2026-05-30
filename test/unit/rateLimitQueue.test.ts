import { RateLimitQueue } from '../../src/rateLimitQueue';

describe('RateLimitQueue', () => {
  test('executes tasks in order with delay', async () => {
    const queue = new RateLimitQueue(10); // small delay for testing
    const order: number[] = [];

    const task1 = async () => { order.push(1); };
    const task2 = async () => { order.push(2); };
    const task3 = async () => { order.push(3); };

    await Promise.all([
      queue.add(task1),
      queue.add(task2),
      queue.add(task3)
    ]);

    expect(order).toEqual([1, 2, 3]);
  });

  test('returns the value from the task', async () => {
    const queue = new RateLimitQueue(10);
    const result = await queue.add(async () => 'hello');
    expect(result).toBe('hello');
  });

  test('handles task rejection', async () => {
    const queue = new RateLimitQueue(10);
    const error = new Error('task failed');
    const promise = queue.add(async () => { throw error; });
    await expect(promise).rejects.toThrow('task failed');
  });

  test('size returns current queue length', async () => {
    const queue = new RateLimitQueue(100);
    queue.add(async () => { await new Promise(r => setTimeout(r, 50)); });
    queue.add(async () => {});
    // There might be a timing issue; approximate check
    expect(queue.size()).toBeGreaterThan(0);
  });

  test('clear removes pending tasks', () => {
    const queue = new RateLimitQueue(100);
    queue.add(async () => {});
    queue.add(async () => {});
    queue.clear();
    expect(queue.size()).toBe(0);
  });
});