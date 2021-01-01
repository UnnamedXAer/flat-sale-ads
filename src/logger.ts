import { Logger } from 'tslog';

const l = new Logger({});

export function lTime(time: number): string {
	if (time < 1000) {
		return time + ' ms';
	}
	return time / 1000 + ' s';
}

export default l;
