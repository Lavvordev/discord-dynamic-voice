import { UserPreferences, StorageAdapter } from './types';

export class PreferencesManager {
  private storage: StorageAdapter;
  private prefix = 'userPref:';

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  private getKey(userId: string): string {
    return `${this.prefix}${userId}`;
  }

  async get(userId: string): Promise<UserPreferences | null> {
    const prefs = await this.storage.get(this.getKey(userId));
    return prefs || null;
  }

  async set(userId: string, prefs: UserPreferences): Promise<void> {
    await this.storage.set(this.getKey(userId), prefs);
  }

  async update(userId: string, updates: Partial<UserPreferences>): Promise<void> {
    const existing = await this.get(userId);
    const merged = { ...existing, ...updates };
    await this.set(userId, merged);
  }

  async delete(userId: string): Promise<void> {
    await this.storage.delete(this.getKey(userId));
  }
}