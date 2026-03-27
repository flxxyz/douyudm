// eslint-disable-next-line @typescript-eslint/no-require-imports
const low = require('lowdb');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const FileSync = require('lowdb/adapters/FileSync');

import type { ILogger } from '../types';

export class NodeLogger implements ILogger {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private db: any;

  constructor(roomId: string | number) {
    const adapter = new FileSync(`${roomId}.json`);
    this.db = low(adapter);
    this.db.defaults({}).write();
  }

  write(type: string, message: string): void {
    if (!this.db.has(type).value()) {
      this.db.set(type, []).write();
    }
    this.db.get(type).push(message).write();
  }

  read(type: string): string[] {
    return this.db.get(type).value() ?? [];
  }
}
