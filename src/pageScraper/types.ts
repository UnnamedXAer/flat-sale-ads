import { Browser, Page } from 'puppeteer';
import { Announcement, SiteName } from '../types';

export enum ScraperDataType {
	Html = 'html',
	Object = 'object'
}

export interface IScraper {
	scrapeAnnouncements(browser: Browser, sites: SiteName[]): Promise<void>;
}

export interface SiteScraperDebugInfo {
	url: string;
	idx: number;
	[key: string]: any;
}

export interface ISiteScraperBase {
	_debugInfo: SiteScraperDebugInfo;
	scrapperDataType: ScraperDataType;
	serviceName: SiteName;
	getPageAds(
		...args: any[]
	):
		| [ads: Announcement[], isDone: boolean]
		| Promise<[ads: Announcement[], isDone: boolean]>;
	getUrlsToNextPages($page: cheerio.Root): string[];
}

export interface ISiteScraperByObject extends ISiteScraperBase {
	getPageAds(page: Page): Promise<[ads: Announcement[], isDone: boolean]>;
	getPageDataObject(page: Page): Promise<Object>;
	getAdTime(offerTime: string): [adTime: string, isDone: boolean];
	parseAdTime(offerTime: string): Date;
	checkIfAdTooOld(adDate: Date, ...args: any[]): boolean;
}

export interface ISiteScraperByHtml extends ISiteScraperBase {
	parsePageAds(
		$page: cheerio.Root,
		$ads: cheerio.Cheerio
	): [ads: Announcement[], isDone: boolean];
	getPageAds($page: cheerio.Root): [ads: Announcement[], isDone: boolean];
	getAdTime($ad: cheerio.Cheerio): [adTime: string, isDone: boolean];
	parseAdTime(scrapedTime: string): Date | string;
	checkIfAdTooOld(adDate: Date, ...args: any[]): boolean;
}

export type ISiteScraper = ISiteScraperByHtml | ISiteScraperByObject;
