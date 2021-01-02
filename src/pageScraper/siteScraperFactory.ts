import { assertUnreachable } from '../assertUnreachable';
import { SiteName } from '../types';
import { OlxScraper } from './olxScraper';
import { RzeszowiakScraper } from './rzeszowiakScraper';
import { ISiteScraper } from './types';

export function getScraperByName(siteName: SiteName): ISiteScraper {
	switch (siteName) {
		case 'olx':
			return new OlxScraper();
		case 'rzeszowiak':
			return new RzeszowiakScraper();
		default:
			return assertUnreachable(siteName);
	}
}
