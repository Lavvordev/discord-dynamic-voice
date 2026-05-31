import { UserPreferences } from './types';
import { PersistenceManager } from './persistence';

export class PreferencesManager {
  private persistence: PersistenceManager;

  constructor(persistence: PersistenceManager) {
    this.persistence = persistence;
  }

  public async get(userId: string): Promise<UserPreferences | null> {
    return this.persistence.getUserPreferences(userId);
  }

  public async set(userId: string, prefs: UserPreferences): Promise<void> {
    await this.persistence.setUserPreferences(userId, prefs);
  }
}