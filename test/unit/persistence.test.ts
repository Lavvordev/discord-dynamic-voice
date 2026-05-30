import { PersistenceManager } from '../../src/persistence';
import fs from 'fs';
import path from 'path';

const TEST_FILE = path.join(__dirname, 'test-state.json');

describe('PersistenceManager', () => {
  let manager: PersistenceManager;

  beforeEach(() => {
    if (fs.existsSync(TEST_FILE)) fs.unlinkSync(TEST_FILE);
    manager = new PersistenceManager(TEST_FILE);
  });

  afterEach(() => {
    if (fs.existsSync(TEST_FILE)) fs.unlinkSync(TEST_FILE);
  });

  test('set and get channel data', () => {
    const data = {
      channelId: '123',
      creatorId: '456',
      guildId: '789',
      createdAt: Date.now(),
      lastActivityAt: Date.now()
    };
    manager.set('123', data);
    expect(manager.get('123')).toEqual(data);
    expect(manager.has('123')).toBe(true);
  });

  test('delete removes entry', () => {
    manager.set('123', { channelId: '123', creatorId: '456', guildId: '789', createdAt: 1, lastActivityAt: 1 });
    expect(manager.delete('123')).toBe(true);
    expect(manager.has('123')).toBe(false);
    expect(manager.delete('999')).toBe(false);
  });

  test('getAll returns all stored entries', () => {
    manager.set('1', { channelId: '1', creatorId: 'a', guildId: 'g', createdAt: 1, lastActivityAt: 1 });
    manager.set('2', { channelId: '2', creatorId: 'b', guildId: 'g', createdAt: 2, lastActivityAt: 2 });
    const all = manager.getAll();
    expect(all).toHaveLength(2);
  });

  test('loadFromDisk restores data after restart (simulated)', () => {
    const data = {
      channelId: '123',
      creatorId: '456',
      guildId: '789',
      createdAt: Date.now(),
      lastActivityAt: Date.now()
    };
    manager.set('123', data);
    // Flush to ensure disk write
    manager.flush();

    const newManager = new PersistenceManager(TEST_FILE);
    expect(newManager.get('123')).toEqual(data);
  });
});