import { Browser } from 'puppeteer';
import { Announcement, SiteName } from '../types';

export interface IScraper {
	scrapeAnnouncements(browser: Browser, sites: SiteName[]): Promise<void>;
}

export interface SiteScraperDebugInfo {
	url: string;
	idx: number;
	[key: string]: any;
}

export interface ISiteScraper {
	_debugInfo: SiteScraperDebugInfo;
	serviceName: SiteName;
	getPageAds($page: cheerio.Root): [ads: Announcement[], isDone: boolean];
	parsePageAds(
		$page: cheerio.Root,
		$ads: cheerio.Cheerio
	): [ads: Announcement[], isDone: boolean];
	getAdTime($ad: cheerio.Cheerio): [adTime: string, isDone: boolean];
	parseAdTime(scrapedTime: string): Date | string;
	checkIfAdTooOld(adDate: Date, ...args: any[]): boolean;
	getUrlsToNextPages($page: cheerio.Root): string[];
}
