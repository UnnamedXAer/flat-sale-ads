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

// export async function saveSiteAnnouncements(
// 	siteName: SiteName,
// 	announcements: Announcement[]
// ) {
// 	const dirPath = path.resolve(__dirname, '..', 'data', siteName);
// 	const pathName = path.join(dirPath, `${formatDateToFileName()}.json`);
// 	const text = JSON.stringify(announcements, null, config.isDev ? '\t' : 0);
// 	try {
// 		await ensurePathExists(dirPath);
// 		l.info(`About to save the ${siteName} announcements to "${pathName}".`);
// 		await writeFile(pathName, text);
// 	} catch (err) {
// 		l.error(`Fail to save the ${siteName} announcements to the file.`, err);
// 		throw err;
// 	}
// }
