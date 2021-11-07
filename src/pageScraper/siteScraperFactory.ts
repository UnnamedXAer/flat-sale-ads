import { assertUnreachable } from '../assertUnreachable';
import { SiteName } from '../types';
import { GethomeScraper } from './gethomeScrapper';
import { OlxScraper } from './olxScraper';
import { OtodomScraper } from './otodomScraper';
import { RzeszowiakScraper } from './rzeszowiakScraper';
import { ISiteScraper } from './types';

export function makeSiteScraper(siteName: SiteName): ISiteScraper {
	switch (siteName) {
		case 'olx':
			return new OlxScraper();
		case 'rzeszowiakAgencje':
		case 'rzeszowiak':
			return new RzeszowiakScraper();
		case 'otodom':
			return new OtodomScraper();
		case 'gethome':
			return new GethomeScraper();
		default:
			return assertUnreachable(siteName);
	}
}
