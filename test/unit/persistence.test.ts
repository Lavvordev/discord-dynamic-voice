import { PersistenceManager } from '../../src/persistence';
import { JSONFileAdapter } from '../../src/storageAdapter';
import fs from 'fs';
import path from 'path';

const TEST_FILE = path.join(__dirname, 'test-state.json');

describe('PersistenceManager', () => {
  let manager: PersistenceManager;

  beforeEach(async () => {
    if (fs.existsSync(TEST_FILE)) fs.unlinkSync(TEST_FILE);
    const adapter = new JSONFileAdapter(TEST_FILE);
    manager = new PersistenceManager(adapter, TEST_FILE);
  });

  afterEach(async () => {
    if (fs.existsSync(TEST_FILE)) fs.unlinkSync(TEST_FILE);
  });

  test('setChannel and getChannel', async () => {
    const data = {
      channelId: '123',
      creatorId: '456',
      guildId: '789',
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
      cohosts: []
    };
    await manager.setChannel('123', data);
    const retrieved = await manager.getChannel('123');
    expect(retrieved).toEqual(data);
    expect(await manager.hasChannel('123')).toBe(true);
  });

  test('deleteChannel removes entry', async () => {
    await manager.setChannel('123', {
      channelId: '123',
      creatorId: '456',
      guildId: '789',
      createdAt: 1,
      lastActivityAt: 1,
      cohosts: []
    });
    expect(await manager.deleteChannel('123')).toBe(true);
    expect(await manager.hasChannel('123')).toBe(false);
    expect(await manager.deleteChannel('999')).toBe(false);
  });

  test('getAllChannels returns all stored entries', async () => {
    await manager.setChannel('1', { channelId: '1', creatorId: 'a', guildId: 'g', createdAt: 1, lastActivityAt: 1, cohosts: [] });
    await manager.setChannel('2', { channelId: '2', creatorId: 'b', guildId: 'g', createdAt: 2, lastActivityAt: 2, cohosts: [] });
    const all = await manager.getAllChannels();
    expect(all).toHaveLength(2);
  });

  test('persistence survives restart', async () => {
    const data = {
      channelId: '123',
      creatorId: '456',
      guildId: '789',
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
      cohosts: []
    };
    await manager.setChannel('123', data);
    await manager.flush();

    const newAdapter = new JSONFileAdapter(TEST_FILE);
    const newManager = new PersistenceManager(newAdapter, TEST_FILE);
    const retrieved = await newManager.getChannel('123');
    expect(retrieved).toEqual(data);
  });
});