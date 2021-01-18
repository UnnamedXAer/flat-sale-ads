import { Logger as ILogger } from '../types';

export class Logger implements ILogger {
	silly(...args: any[]): void {}
	trace(...args: any[]): void {}
	debug(...args: any[]): void {}
	info(...args: any[]): void {}
	warn(...args: any[]): void {}
	error(...args: any[]): void {}
	fatal(...args: any[]): void {}
}

export const l = new Logger();