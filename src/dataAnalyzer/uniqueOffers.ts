import path from 'path';
import { Offer, OffersInfo, SiteName } from '../types';
import { timeStart } from '../performance';
import {
	ensurePathExists,
	getDirFiles,
	mapFileData,
	readOffersFile,
	saveOffersInfo
} from '../files';
import { assertSameOffers, makeOffersUnion } from './compareOffers';

export async function analyzeData(siteNames: SiteName[]) {
	const timeStop = timeStart('Analyzing data');
	const dayOffers = await makeUnionOfDayOffers(siteNames);
	await saveOffersInfo(dayOffers, 'analyzed');

	const allOffers = await getAllOffers();
	const newOffers = await filterOutRecurredOffers(
		allOffers.flatMap((x) => x.offers),
		dayOffers
	);
	await saveOffersInfo(newOffers, 'all_offers');
	timeStop();
}

export async function filterOutRecurredOffers(
	previousOffers: Offer[],
	dayOffers: Offer[]
): Promise<Offer[]> {
	const timeStop = timeStart('Filter out today offers that are recurred.');
	const uniqueNewOffers: Offer[] = [];
	const previousOffersCount = previousOffers.length,
		dayOffersCount = dayOffers.length;

	for (let i = 0; i < dayOffersCount; i++) {
		const newOffer = dayOffers[i];
		let j = 0;
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

export async function getAllOffers(): Promise<OffersInfo[]> {
	const timeStop = timeStart('Read all previous offers.');
	const allOffersPath = path.join(process.cwd(), 'data', 'all_offers');
	await ensurePathExists(allOffersPath);

	const [files] = await getDirFiles('all_offers');

	const allOffersInfo: OffersInfo[] = [];

	for (let i = 0; i < files.length; i++) {
		const fileData = await readOffersFile(allOffersPath, files[i].fileName);
		allOffersInfo.push(mapFileData(fileData));
	}
	timeStop();
	return allOffersInfo;
}

export async function makeUnionOfDayOffers(siteNames: SiteName[]): Promise<Offer[]> {
	// @improvement: do it only if there is at least one file younger then previous union
	const dayUniqueOffers = await getDayUniqueSitesOffers(siteNames);
	return dayUniqueOffers;
}

async function getDayUniqueSitesOffers(siteNames: SiteName[]): Promise<Offer[]> {
	let offersUnion: Offer[] = [];
	for (let i = 0; i < siteNames.length; i++) {
		offersUnion = await makeOffersUnion(offersUnion, siteNames[i]);
	}

	return offersUnion;
}
