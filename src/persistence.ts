import fs from 'fs';
import path from 'path';
import { StoredChannelData } from './types';
import { debounce } from './utils';

/**
 * Handles JSON file storage for channel-to-owner mappings.
 * This prevents orphaned channels when the bot restarts.
 * 
 * I've seen this break when the file directory doesn't exist or when
 * two writes happen simultaneously. The debouncer prevents race conditions.
 */
export class PersistenceManager {
  private filePath: string;
  private data: Map<string, StoredChannelData>;
  private saveDebounced: () => void;

  constructor(filePath: string = './dynamic-voice-state.json') {
    this.filePath = path.resolve(filePath);
    this.data = new Map();
    
    // Debounce saves to avoid hammering the disk on every small change
    this.saveDebounced = debounce(this.saveToDisk.bind(this), 500);
    this.loadFromDisk();
  }

  /**
   * Load stored channel data from JSON file.
   * If file doesn't exist, creates an empty map.
   */
  private loadFromDisk(): void {
    try {
      if (!fs.existsSync(this.filePath)) {
        this.data = new Map();
        return;
      }
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      const parsed = JSON.parse(raw) as StoredChannelData[];
      this.data.clear();
      for (const entry of parsed) {
        this.data.set(entry.channelId, entry);
      }
    } catch (err) {
      console.error(`[discord-dynamic-voice] Failed to load persistence file: ${(err as Error).message}`);
      this.data = new Map();
    }
  }

  /**
   * Write current data to disk.
   * This is debounced externally.
   */
  private saveToDisk(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const array = Array.from(this.data.values());
      fs.writeFileSync(this.filePath, JSON.stringify(array, null, 2));
    } catch (err) {
      console.error(`[discord-dynamic-voice] Failed to save persistence file: ${(err as Error).message}`);
    }
  }

  /**
   * Store or update a channel's metadata.
   */
  public set(channelId: string, data: StoredChannelData): void {
    this.data.set(channelId, data);
    this.saveDebounced();
  }

  /**
   * Retrieve channel metadata, or undefined if not found.
   */
  public get(channelId: string): StoredChannelData | undefined {
    return this.data.get(channelId);
  }

  /**
   * Delete a channel record.
   */
  public delete(channelId: string): boolean {
    const deleted = this.data.delete(channelId);
    if (deleted) this.saveDebounced();
    return deleted;
  }

  /**
   * Get all stored channels.
   */
  public getAll(): StoredChannelData[] {
    return Array.from(this.data.values());
  }

  /**
   * Check if a channel is managed by this persistence layer.
   */
  public has(channelId: string): boolean {
    return this.data.has(channelId);
  }

  /**
   * Force immediate save (useful before shutdown).
   */
  public flush(): void {
    this.saveToDisk();
  }
}