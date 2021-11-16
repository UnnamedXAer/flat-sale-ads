import path from 'path';
import { IOffer, IOffersInfo, IRepository } from '../types';
import { timeStart } from '../performance';
import { ensurePathExists, getDirFiles, mapFileData, readOffersFile } from '../files';
import { assertSameOffers } from './compareOffers';
import l from '../logger';
import globals from '../globals';

export async function analyzeData(storage: IRepository) {
	const timeStop = timeStart('Analyzing data');
	const newOffersInfos = await storage.getTmpOffers();

	if (newOffersInfos.length === 0) {
		l.warn('There are no new offers to filter.');
		return;
	}
	
	const allOffers = await storage.getAllOffers();
	const newFilteredOffers = (
		await Promise.all(
			newOffersInfos.map((newOffersInfo) =>
				filterOutRecurredOffers(allOffers, newOffersInfo.offerList)
			)
		)
	).flat(1);

	await storage.saveNewOffers(newFilteredOffers, new Date(globals.programStartTime));
	await storage.deleteTmpOffers();
	timeStop();
}

export async function filterOutRecurredOffers(
	previousOffers: IOffer[],
	dayOffers: IOffer[]
): Promise<IOffer[]> {
	const timeStop = timeStart('Filter out today offers that are recurred.');
	const uniqueNewOffers: IOffer[] = [];
	const previousOffersCount = previousOffers.length,
		dayOffersCount = dayOffers.length;

	for (let i = 0; i < dayOffersCount; i++) {
		const newOffer = dayOffers[i];
		let j = 0;
		// @TODO: if they are same offers in dayOffers they will not be filtered if in prev offers there is no such offer :()
		for (; j < previousOffersCount; j++) {
			if (assertSameOffers(previousOffers[j], newOffer)) {
				break;
			}
		}
		if (j === previousOffersCount) {
			uniqueNewOffers.push(newOffer);
		}
	}
	timeStop();
	return uniqueNewOffers;
}

export async function getAllOffers(): Promise<IOffersInfo[]> {
	const timeStop = timeStart('Read all previous offers.');
	const allOffersPath = path.join(process.cwd(), 'data', 'all_offers');
	await ensurePathExists(allOffersPath);

	const [files] = await getDirFiles('all_offers');

	const allOffersInfo: IOffersInfo[] = [];

	for (let i = 0; i < files.length; i++) {
		const fileData = await readOffersFile(allOffersPath, files[i].fileName);
		allOffersInfo.push(mapFileData(fileData));
	}
	timeStop();
	return allOffersInfo;
}

// export async function makeUnionOfDayOffers(siteNames: SiteName[]): Promise<IOffer[]> {
// 	// @improvement: do it only if there is at least one file younger then previous union
// 	const dayUniqueOffers = await getDayUniqueSitesOffers(siteNames);
// 	return dayUniqueOffers;
// }

// async function getDayUniqueSitesOffers(siteNames: SiteName[]): Promise<IOffer[]> {
// 	let offersUnion: IOffer[] = [];
// 	for (let i = 0; i < siteNames.length; i++) {
// 		offersUnion = await makeOffersUnion(offersUnion, siteNames[i]);
// 	}

// 	return offersUnion;
// }
