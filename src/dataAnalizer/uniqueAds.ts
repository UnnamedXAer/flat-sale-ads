import path from 'path';
import { readdir, readFile, stat, writeFile } from 'fs/promises';
import { Announcement, SiteName, siteNames } from '../types';
import l from '../logger';
import { config } from '../config';
import { readFileSync } from 'fs';
import { timeStart } from '../performance';
import { formatDateToFileName } from '../formatDate';
import { ensurePathExists } from '../files';

async function readSiteDataFileNames(siteDataPath: string) {
	const dirNames = await readdir(siteDataPath);
	l.debug(dirNames);
	return dirNames;
}

async function findYoungestFileName(
	pathName: string,
	fileNames: string[]
): Promise<{ createTime: number; fileName: string }> {
	let youngest: { createTime: number; fileName: string } = {
		createTime: -1,
		fileName: ''
	};

	for (let i = 0; i < fileNames.length; i++) {
		const filePathName = path.join(pathName, fileNames[i]);
		const fileStat = await stat(filePathName);

		if (fileStat.isFile() && fileStat.ctimeMs > youngest.createTime) {
			youngest = {
				createTime: fileStat.ctimeMs,
				fileName: fileNames[i]
			};
		}
	}

	l.debug(
		`Youngest file in "${pathName}" is ${youngest.fileName}, created at: ${new Date(
			youngest.createTime
		).toLocaleString(...config.dateTimeFormatParams)}`
	);

	return youngest;
}

export async function analyzeData(siteNames: SiteName[]): Promise<Announcement[]> {
	const dayUniqAds: Announcement[] = [];

	for (let i = 0; i < siteNames.length; i++) {
		const siteAds = await getLastSiteAds(siteNames[i]);
		for (let j = 0; j < siteAds.length; j++) {
			const currentSiteAd = siteAds[j];
			const idx = dayUniqAds.findIndex(
				(x) => x.title === currentSiteAd.title || x.id === currentSiteAd.id
			);

			if (idx === -1) {
				dayUniqAds.push(currentSiteAd);
				continue;
			}

			const uniqAd = dayUniqAds[idx];
			const differentProps: (keyof Announcement)[] = [];
			const adKeys = (Object.keys(uniqAd) as unknown) as typeof differentProps;
			adKeys.forEach((prop) => {
				if (uniqAd[prop] !== currentSiteAd[prop]) {
					differentProps.push(prop);
				}
			});

			const currentSiteAdTime = new Date(currentSiteAd.dt).getTime();
			if (isFinite(currentSiteAdTime) === false) {
				break;
			}

			const uniqAdTime = new Date(currentSiteAd.dt).getTime();
			if (isFinite(uniqAdTime) === false) {
				break;
			}

			if (currentSiteAdTime < uniqAdTime) {
				dayUniqAds[idx] = currentSiteAd;
			}
		}
	}
	const analyzeDatePath = path.join(process.cwd(), 'data', 'analyzed');
	await ensurePathExists(analyzeDatePath);
	const analyzeDatePathName = path.join(
		analyzeDatePath,
		formatDateToFileName() + Date.now() + '.json'
	);
	const timeStop = timeStart('save day unique ' + '"' + analyzeDatePathName + '"');
	await writeFile(analyzeDatePathName, JSON.stringify(dayUniqAds, null, 4));
	timeStop();
	return dayUniqAds;
}

export async function getLastSiteAds(siteName: SiteName): Promise<Announcement[]> {
	const siteDataPath = getSiteDataPath(siteName);
	const fileNames = await readSiteDataFileNames(siteDataPath);
	const youngestFile = await findYoungestFileName(siteDataPath, fileNames);

	const siteData = getFileData(siteDataPath, youngestFile.fileName);
	return siteData;
}

function getSiteDataPath(siteName: SiteName): string {
	const siteDataPath = path.join(process.cwd(), 'data', siteName);
	return siteDataPath;
}

async function getFileData(
	filePath: string,
	fileName: string
): Promise<Array<Announcement>> {
	const filePathName = path.join(filePath, fileName);
	const timeStop = timeStart(`Reading data from: "${filePathName}" (async)`);
	const data = await readFile(filePathName, {
		encoding: 'utf-8'
	});
	const fileData = JSON.parse(data);
	timeStop();

	return fileData;
}
