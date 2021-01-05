import { PathLike } from 'fs';
import { access, mkdir } from 'fs/promises';
import l from './logger';

export async function ensurePathExists(dir: PathLike) {
	try {
		await access(dir);
	} catch (err) {
		l.warn(`The "${dir}" directory does not exits. About to create.`);
		await mkdir(dir, { recursive: true });
		l.info(`The "${dir}" directory created.`);
	}

	return dir;
}
