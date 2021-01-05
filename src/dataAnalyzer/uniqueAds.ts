import path from 'path';
import { readdir, readFile, stat, writeFile } from 'fs/promises';
import { Offer, SiteName, SiteOffers } from '../types';
import l from '../logger';
import { config } from '../config';
import { timeStart } from '../performance';
import { formatDateToFileName } from '../formatDate';
import { ensurePathExists } from '../files';

async function readSiteDataFileNames(siteDataPath: string) {
	const dirNames = await readdir(siteDataPath);
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

	return youngest;
}

export async function analyzeData(siteNames: SiteName[]): Promise<Offer[]> {
	const dayUniqueAds: Offer[] = [];

	for (let i = 0; i < siteNames.length; i++) {
		const siteOffers = await getLastSiteAds(siteNames[i]);
		const sideOffersList = siteOffers.offers;

		for (let j = 0; j < sideOffersList.length; j++) {
			const currentSiteAd = sideOffersList[j];

			const idx = dayUniqueAds.findIndex(
				(x) =>
					assertEqualOfferProp(x, currentSiteAd, 'title') ||
					(assertEqualOfferProp(x, currentSiteAd, 'site') &&
						assertEqualOfferProp(x, currentSiteAd, 'id'))
			);

			l.debug({
				site: siteOffers.siteName,
				title: currentSiteAd.title,
				_dt: currentSiteAd._dt,
				dt: currentSiteAd.dt,
				id: currentSiteAd.id,
				price: currentSiteAd.price
			});

			if (idx === -1) {
				dayUniqueAds.push(currentSiteAd);
				continue;
			}
			// @check if same page compare dates, if same day push it,
			const uniqueAd = dayUniqueAds[idx];
			const differentProps: (keyof Offer)[] = [];
			const adKeys = (Object.keys(uniqueAd) as unknown) as typeof differentProps;
			adKeys.forEach((prop) => {
				if (uniqueAd[prop] !== currentSiteAd[prop]) {
					differentProps.push(prop);
				}
			});

			if (currentSiteAd.site === uniqueAd.site) {
			}

			const currentSiteAdTime = new Date(currentSiteAd._dt).getTime();
			if (isFinite(currentSiteAdTime) === false) {
				break;
			}

			const uniqAdTime = new Date(currentSiteAd._dt).getTime();
			if (isFinite(uniqAdTime) === false) {
				break;
			}

			if (currentSiteAdTime < uniqAdTime) {
				dayUniqueAds[idx] = currentSiteAd;
			}
		}
	}

	const analyzeDatePath = path.join(process.cwd(), 'data', 'analyzed');
	await ensurePathExists(analyzeDatePath);
	const analyzeDatePathName = path.join(
		analyzeDatePath,
		formatDateToFileName() + '_' + Date.now() + '.json'
	);
	const timeStop = timeStart(
		'Save day unique offers to: ' + '"' + analyzeDatePathName + '"'
	);
	await writeFile(analyzeDatePathName, JSON.stringify(dayUniqueAds, null, 4));
	timeStop();

	return dayUniqueAds;
}

export async function getLastSiteAds(siteName: SiteName): Promise<SiteOffers> {
	const siteDataPath = getSiteDataPath(siteName);
	const fileNames = await readSiteDataFileNames(siteDataPath);
	const youngestFile = await findYoungestFileName(siteDataPath, fileNames);
	l.debug(
		`Youngest file for "${siteName}" is ${
			youngestFile.fileName
		}, created at: ${new Date(youngestFile.createTime).toLocaleString(
			...config.dateTimeFormatParams
		)}`
	);
	const siteOffersList = await getFileData(siteDataPath, youngestFile.fileName);

	const siteOffers: SiteOffers = {
		offers: siteOffersList,
		scrapedAt: new Date(youngestFile.createTime),
		siteName: siteName
	};

	return siteOffers;
}

function getSiteDataPath(siteName: SiteName): string {
	const siteDataPath = path.join(process.cwd(), 'data', siteName);
	return siteDataPath;
}

async function getFileData(
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

function assertEqualOfferProp(
	obj1: Offer,
	obj2: Offer,
	prop: keyof Offer
): boolean {
	if (!obj2[prop] && !obj2[prop]) {
		return false;
	}

	return obj1[prop] !== obj2[prop];
}
