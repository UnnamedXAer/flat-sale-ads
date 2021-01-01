import { assertUnreachable } from '../assertUnreachable';
import { SiteName } from '../types';
import { OlxScrapper } from './olxScrapper';
import { RzeszowiakScrapper } from './rzeszowiakScrapper';
import { ISiteScrapper } from './types';

export function getScrapperByName(siteName: SiteName): ISiteScrapper {
	switch (siteName) {
		case 'olx':
			return new OlxScrapper();
		case 'rzeszowiak':
			return new RzeszowiakScrapper();
		default:
			return assertUnreachable(siteName);
	}
}
