import path from 'path';
import { writeFile } from 'fs/promises';
import { Offer, SiteName } from '../types';
import { timeStart } from '../performance';
import { formatDateToFileName } from '../formatDate';
import { ensurePathExists } from '../files';
import { mergeUniqOffers } from './compareOffers';

export async function analyzeData(siteNames: SiteName[]): Promise<Offer[]> {
	const dayUniqueOffers = await getDayUniqueSitesOffers(siteNames);

	const analyzeDatePath = path.join(process.cwd(), 'data', 'analyzed');
	await ensurePathExists(analyzeDatePath);
	const analyzeDatePathName = path.join(
		analyzeDatePath,
		formatDateToFileName() + '_' + Date.now() + '.json'
	);
	const timeStop = timeStart(
		'Save day unique offers to: ' + '"' + analyzeDatePathName + '"'
	);
	await writeFile(analyzeDatePathName, JSON.stringify(dayUniqueOffers, null, 4));
	timeStop();

	return dayUniqueOffers;
}

async function getDayUniqueSitesOffers(siteNames: SiteName[]): Promise<Offer[]> {
	let offersUnion: Offer[] = [];
	for (let i = 0; i < siteNames.length; i++) {
		offersUnion = await mergeUniqOffers(offersUnion, siteNames[i]);
	}

	return offersUnion;
}
