import { Browser } from 'puppeteer';
import { Announcement, SiteName } from '../types';

export interface IScrapper {
	scrapeAnnouncements(browser: Browser, sites: SiteName[]): Promise<void>;
}

export interface SiteScrapperDebugInfo {
	url: string;
	idx: number;
	[key: string]: any;
}

export interface ISiteScrapper {
	_debugInfo: SiteScrapperDebugInfo;
	serviceName: SiteName;
	getPageAds($page: cheerio.Root): Promise<[ads: Announcement[], isDone: boolean]>;
	parsePageAds(
		$page: cheerio.Root,
		$ads: cheerio.Cheerio
	): [ads: Announcement[], isDone: boolean];
	parseAdTime(olxTime: string): Date | string;
	getUrlsToNextPages($page: cheerio.Root): string[];
}
