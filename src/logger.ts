import { Logger } from 'tslog';
import { config } from './config';

const l = new Logger({
	minLevel: config.logsLevel
});

l.setSettings({});

export function lTime(time: number): string {
	if (time < 1000) {
		return time + ' ms';
	}
	return time / 1000 + ' s';
}

export default l;
