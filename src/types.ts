import { TLogLevelName } from 'tslog';
import { SiteScraperDebugInfo } from './pageScraper/types';

export type NODE_ENV = 'production' | 'development' | 'test';
export type EnvPrefix = 'test' | 'dev' | 'prod';

export const siteNames = ['rzeszowiak', 'olx', 'otodom', 'gethome'] as const;
export type SiteName = typeof siteNames[number];
export type DataDirectory = SiteName | 'analyzed' | 'visualization' | 'all_offers';

export interface SimplyFile {
	createTime: number;
	fileName: string;
}
export interface Config {
	NODE_ENV: NODE_ENV;
	isDev: boolean;
	envPrefix: EnvPrefix;
	scrapeSiteTimeout: number;
	startMaximized: boolean;
	logsLevel: TLogLevelName;
	appTemporaryDataFolder: string;
	dateTimeFormatParams: [string, Intl.DateTimeFormatOptions];
	dateFormatParams: [string, Intl.DateTimeFormatOptions];
	timeFormatParams: [string, Intl.DateTimeFormatOptions];
	urls: {
		[key in SiteName]: string;
	};
}

export interface Offer {
	site: SiteName;
	id: string;
	dt: string;
	_dt: Date;
	title: string;
	price: string;
	description: string;
	url: string;
	imgUrl: string;
	_debugInfo: SiteScraperDebugInfo;
}

export interface OfferTextFileData {
	site: SiteName;
	id: string;
	dt: string;
	_dt: string;
	title: string;
	price: string;
	description: string;
	url: string;
	imgUrl: string;
	_debugInfo: SiteScraperDebugInfo;
}

export interface DirectoryOffers {
	offers: Offer[];
	directory: DataDirectory;
	scrapedAt: Date;
}

export interface OffersInfo {
	date: Date;
	offers: Offer[];
}

export interface ReadTextFileData {
	date: string;
	offers: OfferTextFileData[];
}
