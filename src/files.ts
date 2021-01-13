import { PathLike } from 'fs';
import path from 'path';
import { access, mkdir, readdir, readFile, stat, writeFile } from 'fs/promises';
import l from './logger';
import {
	DataDirectory,
	DirectoryOffers,
	IOffer,
	OffersInfo,
	OfferTextFileData,
	ReadTextFileData,
	SimplyFile
} from './types';
import { timeStart } from './performance';
import { config } from './config';
import { formatDateToFileName } from './formatDate';

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
	dataDirName: DataDirectory
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

	const fileData = await readOffersFile(dataDirPath, youngestFile.fileName);

	const offersInfo = mapFileData(fileData);

	const directoryOffers: DirectoryOffers = {
		offers: offersInfo.offers,
		scrapedAt: offersInfo.date,
		directory: dataDirName
	};

	return directoryOffers;
}

export function mapFileData(fileData: ReadTextFileData): OffersInfo {
	return {
		date: new Date(fileData.date),
		offers: mapOffersDataToOffers(fileData.offers)
	};
}

export function mapOffersDataToOffers(offersData: OfferTextFileData[]): IOffer[] {
	return offersData.map((offerData) => {
		return {
			_dt: new Date(offerData._dt),
			dt: offerData.dt,
			id: offerData.id,
			scrapedAt: new Date(offerData.scrapedAt),
			title: offerData.title,
			price: offerData.price,
			url: offerData.url,
			site: offerData.site,
			imgUrl: offerData.imgUrl,
			description: offerData.description,
			_debugInfo: { ...offerData._debugInfo }
		};
	});
}

export async function getDirFiles(
	dataDirName: DataDirectory
): Promise<[files: SimplyFile[], dataDirPath: string]> {
	const dataDirPath = getDataDirPath(dataDirName);
	const dirNames = await readdir(dataDirPath);
	const files = await filterFiles(dataDirPath, dirNames);
	return [files, dataDirPath];
}

export function getDataDirPath(siteName: DataDirectory): string {
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

export async function readOffersFile(
	filePath: string,
	fileName: string
): Promise<ReadTextFileData> {
	const filePathName = path.join(filePath, fileName);
	const timeStop = timeStart(`Reading offers from: "${filePathName}"`);
	const data = await readFile(filePathName, {
		encoding: 'utf-8'
	});
	const fileData = JSON.parse(data);
	timeStop();

	return fileData;
}

export async function saveOffersInfo(offers: IOffer[], directory: DataDirectory) {
	const dataPath = path.join(process.cwd(), 'data', directory);
	await ensurePathExists(dataPath);
	const dataFilePath = path.join(
		dataPath,
		formatDateToFileName() + '_' + Date.now() + '.json'
	);
	const timeStop = timeStart('Save offers info to: ' + '"' + dataFilePath + '"');
	const offersInfo: OffersInfo = {
		date: new Date(),
		offers: offers
	};
	await writeFile(dataFilePath, JSON.stringify(offersInfo, null, 4));
	timeStop();
}
