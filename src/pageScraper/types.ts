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
	readonly scrapperDataType: ScraperDataType;
	serviceName: SiteName;
	getPageAds(
		...args: any[]
	):
		| [ads: Announcement[], isDone: boolean]
		| Promise<[ads: Announcement[], isDone: boolean]>;
	getUrlsToNextPages(arg: cheerio.Root | string): string[];
}

export interface ISiteScraperByObject extends ISiteScraperBase {
	readonly scrapperDataType: typeof ScraperDataType.Object;
	getPageAds(page: Page): Promise<[ads: Announcement[], isDone: boolean]>;
	getPageDataObject(page: Page): Promise<Object>;
	getAdTime(offerTime: string): [adDateText: Date, adDateText: string, isDone: boolean];
	parseAdTime(offerTime: string): Date;
	checkIfAdTooOld(adDate: Date, ...args: any[]): boolean;
	getUrlsToNextPages(baseUrl: string): string[];
}

export interface ISiteScraperByHtml extends ISiteScraperBase {
	readonly scrapperDataType: ScraperDataType.Html;
	parsePageAds(
		$page: cheerio.Root,
		$ads: cheerio.Cheerio
	): [ads: Announcement[], isDone: boolean];
	getPageAds($page: cheerio.Root): [ads: Announcement[], isDone: boolean];
	getAdTime(
		$ad: cheerio.Cheerio
	): [adDateText: Date, adDateText: string, isDone: boolean];
	parseAdTime(scrapedTime: string, ...args: any[]): Date | string;
	checkIfAdTooOld(adDate: Date, ...args: any[]): boolean;
	getUrlsToNextPages($page: cheerio.Root): string[];
}

export type ISiteScraper = ISiteScraperByHtml | ISiteScraperByObject;
