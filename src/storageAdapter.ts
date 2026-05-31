import fs from 'fs';
import path from 'path';
import { StorageAdapter } from './types';

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

  async get(key: string): Promise<unknown> {
    this.ensureDir();
    try {
      if (!fs.existsSync(this.filePath)) return null;
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      const data = JSON.parse(raw) as Record<string, unknown>;
      return data[key] ?? null;
    } catch (err) {
      console.error(`[JSONFileAdapter] Failed to read key ${key}:`, err);
      return null;
    }
  }

  async set(key: string, value: unknown): Promise<void> {
    this.ensureDir();
    try {
      let data: Record<string, unknown> = {};
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        data = JSON.parse(raw) as Record<string, unknown>;
      }
      data[key] = value;
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(`[JSONFileAdapter] Failed to write key ${key}:`, err);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      if (!fs.existsSync(this.filePath)) return;
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      const data = JSON.parse(raw) as Record<string, unknown>;
      delete data[key];
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(`[JSONFileAdapter] Failed to delete key ${key}:`, err);
    }
  }

  async getAll(prefix?: string): Promise<Map<string, unknown>> {
    const result = new Map<string, unknown>();
    try {
      if (!fs.existsSync(this.filePath)) return result;
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      const data = JSON.parse(raw) as Record<string, unknown>;
      for (const [key, value] of Object.entries(data)) {
        if (!prefix || key.startsWith(prefix)) {
          result.set(key, value);
        }
      }
    } catch (err) {
      console.error('[JSONFileAdapter] Failed to getAll:', err);
    }
    return result;
  }
}