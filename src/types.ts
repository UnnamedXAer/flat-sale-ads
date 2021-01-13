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

export interface Logger {
	silly: (...args: any[]) => void;
	trace: (...args: any[]) => void;
	debug: (...args: any[]) => void;
	info: (...args: any[]) => void;
	warn: (...args: any[]) => void;
	error: (...args: any[]) => void;
	fatal: (...args: any[]) => void;
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

export interface IOffer {
	site: SiteName;
	id: string;
	scrapedAt: Date;
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
	scrapedAt: string;
	_dt: string;
	title: string;
	price: string;
	description: string;
	url: string;
	imgUrl: string;
	_debugInfo: SiteScraperDebugInfo;
}

export interface DirectoryOffers {
	offers: IOffer[];
	directory: DataDirectory;
	scrapedAt: Date;
}

export interface OffersInfo {
	date: Date;
	offers: IOffer[];
}

export interface ReadTextFileData {
	date: string;
	offers: OfferTextFileData[];
}
