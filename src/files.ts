import { PathLike } from 'fs';
import path from 'path';
import { access, mkdir, readdir, readFile, stat } from 'fs/promises';
import l from './logger';
import {
	DataDirectory as DataDirectoryName,
	DirectoryOffers,
	Offer,
	SimplyFile,
	SiteName
} from './types';
import { timeStart } from './performance';
import { config } from './config';

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

export async function getDataDirLatestOffers(
	dataDirName: DataDirectoryName
): Promise<DirectoryOffers | null> {
	const [files, dataDirPath] = await getDirFiles(dataDirName);
	if (files.length === 0) {
		l.warn(`The "${dataDirName}" does not contain any data files.`);
		return null;
	}
	const youngestFile = files[files.length - 1];
	l.debug(
		`Youngest file for "${dataDirName}" is ${
			youngestFile.fileName
		}, created at: ${new Date(youngestFile.createTime).toLocaleString(
			...config.dateTimeFormatParams
		)}`
	);

	const offerList = await getFileData(dataDirPath, youngestFile.fileName);

	const directoryOffers: DirectoryOffers = {
		offers: offerList,
		scrapedAt: new Date(youngestFile.createTime),
		directory: dataDirName
	};

	return directoryOffers;
}

export async function getDirFiles(
	dataDirName: DataDirectoryName
): Promise<[files: SimplyFile[], dataDirPath: string]> {
	const dataDirPath = getDataDirPath(dataDirName);
	const dirNames = await readdir(dataDirPath);
	const files = await filterFiles(dataDirPath, dirNames);
	return [files, dataDirPath];
}

export function getDataDirPath(siteName: DataDirectoryName): string {
	const dataResourcePath = path.join(process.cwd(), 'data', siteName);
	return dataResourcePath;
}

export async function filterFiles(
	pathName: string,
	dirNames: string[]
): Promise<SimplyFile[]> {
	const files: SimplyFile[] = [];

	for (let i = 0; i < dirNames.length; i++) {
		const filePathName = path.join(pathName, dirNames[i]);
		const fileStat = await stat(filePathName);

		if (fileStat.isFile()) {
			files.push({
				createTime: fileStat.ctimeMs,
				fileName: dirNames[i]
			});
		}
	}
	return files;
}

export function sortFilesByDate(files: SimplyFile[]): SimplyFile[] {
	files.sort((a, b) => {
		if (a.createTime < b.createTime) {
			return -1;
		}
		if (a.createTime > b.createTime) {
			return 1;
		}
		if (a.fileName < b.fileName) {
			return -1;
		}
		return 1;
	});

	return files;
}

export async function getFileData(
	filePath: string,
	fileName: string
): Promise<Array<Offer>> {
	const filePathName = path.join(filePath, fileName);
	const timeStop = timeStart(`Reading data from: "${filePathName}" (async)`);
	const data = await readFile(filePathName, {
		encoding: 'utf-8'
	});
	const fileData = JSON.parse(data);
	timeStop();

	return fileData;
}
