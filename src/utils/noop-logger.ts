import type { ILogger } from '../types';

export class NoOpLogger implements ILogger {
  write(_type: string, _message: string): void {
    // no-op: used in browser builds where fs is unavailable
  }
}
