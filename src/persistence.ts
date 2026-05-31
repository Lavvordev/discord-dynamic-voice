import fs from 'fs';
import { StorageAdapter, StoredChannelData, UserPreferences } from './types';
import { JSONFileAdapter } from './storageAdapter';

export class PersistenceManager {
  private adapter: StorageAdapter;
  private dataCache: Map<string, StoredChannelData>;
  private prefsCache: Map<string, UserPreferences>;
  private filePath: string;

  constructor(adapter?: StorageAdapter, filePath?: string) {
    this.filePath = filePath ?? './dynamic-voice-state.json';
    this.adapter = adapter ?? new JSONFileAdapter(this.filePath);
    this.dataCache = new Map();
    this.prefsCache = new Map();
    this.loadSync();
  }

  private loadSync(): void {
    try {
      if (!fs.existsSync(this.filePath)) return;
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.channels)) {
        for (const entry of data.channels) {
          this.dataCache.set(entry.channelId, entry);
        }
      }
      if (data.userPreferences && typeof data.userPreferences === 'object') {
        for (const [userId, pref] of Object.entries(data.userPreferences)) {
          this.prefsCache.set(userId, pref as UserPreferences);
        }
      }
    } catch (err) {
      console.error('[PersistenceManager] Failed to load state:', err);
    }
  }

  private async saveToAdapter(): Promise<void> {
    await this.adapter.set('channels', Array.from(this.dataCache.values()));
    const prefsObj: Record<string, UserPreferences> = {};
    for (const [userId, pref] of this.prefsCache.entries()) {
      prefsObj[userId] = pref;
    }
    await this.adapter.set('userPreferences', prefsObj);
  }

  public async setChannel(channelId: string, data: StoredChannelData): Promise<void> {
    this.dataCache.set(channelId, data);
    await this.saveToAdapter();
  }

  public async getChannel(channelId: string): Promise<StoredChannelData | undefined> {
    return this.dataCache.get(channelId);
  }

  public async deleteChannel(channelId: string): Promise<boolean> {
    const deleted = this.dataCache.delete(channelId);
    if (deleted) await this.saveToAdapter();
    return deleted;
  }

  public async getAllChannels(): Promise<StoredChannelData[]> {
    return Array.from(this.dataCache.values());
  }

  public async hasChannel(channelId: string): Promise<boolean> {
    return this.dataCache.has(channelId);
  }

  public async setUserPreferences(userId: string, prefs: UserPreferences): Promise<void> {
    this.prefsCache.set(userId, prefs);
    await this.saveToAdapter();
  }

  public getUserPreferences(userId: string): UserPreferences | null {
    return this.prefsCache.get(userId) ?? null;
  }

  public async flush(): Promise<void> {
    await this.saveToAdapter();
  }
}