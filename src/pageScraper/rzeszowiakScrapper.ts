import { SiteName, Announcement } from '../types';
import { ISiteScrapper, SiteScrapperDebugInfo } from './types';

export class RzeszowiakScrapper implements ISiteScrapper {
	_debugInfo: SiteScrapperDebugInfo = { idx: -1, url: '' };
	serviceName: SiteName = 'rzeszowiak';
	getPageAds($page: cheerio.Root): Promise<[ads: Announcement[], isDone: boolean]> {
		throw new Error('Method not implemented.');
	}
	parsePageAds(
		$page: cheerio.Root,
		$ads: cheerio.Cheerio
	): [ads: Announcement[], isDone: boolean] {
		throw new Error('Method not implemented.');
	}
	parseAdTime(olxTime: string): string | Date {
		throw new Error('Method not implemented.');
	}
	getUrlsToNextPages($page: cheerio.Root): string[] {
		throw new Error('Method not implemented.');
	}
}
