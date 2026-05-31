import fs from 'fs';
import path from 'path';
import { StorageAdapter } from './types';

/**
 * Default JSON file adapter for persistence.
 * Used when no custom adapter is provided.
 * 
 * I've seen this fail when the directory doesn't exist – we create it recursively.
 */
export class JSONFileAdapter implements StorageAdapter {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = path.resolve(filePath);
  }

  private ensureDir(): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async get(key: string): Promise<any> {
    this.ensureDir();
    try {
      if (!fs.existsSync(this.filePath)) {
        return null;
      }
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      const data = JSON.parse(raw);
      return data[key] ?? null;
    } catch (err) {
      console.error(`[StorageAdapter] Failed to read key ${key}:`, err);
      return null;
    }
  }

  async set(key: string, value: any): Promise<void> {
    this.ensureDir();
    try {
      let data: Record<string, any> = {};
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        data = JSON.parse(raw);
      }
      data[key] = value;
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(`[StorageAdapter] Failed to write key ${key}:`, err);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      if (!fs.existsSync(this.filePath)) return;
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      const data = JSON.parse(raw);
      delete data[key];
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(`[StorageAdapter] Failed to delete key ${key}:`, err);
    }
  }

  async getAll(prefix?: string): Promise<Map<string, any>> {
    const result = new Map<string, any>();
    try {
      if (!fs.existsSync(this.filePath)) return result;
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      const data = JSON.parse(raw);
      for (const [key, value] of Object.entries(data)) {
        if (!prefix || key.startsWith(prefix)) {
          result.set(key, value);
        }
      }
    } catch (err) {
      console.error('[StorageAdapter] Failed to getAll:', err);
    }
    return result;
  }
}