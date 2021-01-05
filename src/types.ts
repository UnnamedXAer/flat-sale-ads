import { SiteScraperDebugInfo } from './pageScraper/types';

export type NODE_ENV = 'production' | 'development' | 'test';
export type EnvPrefix = 'test' | 'dev' | 'prod';

export const siteNames = ['rzeszowiak', 'olx', 'otodom', 'gethome'] as const;
export type SiteName = typeof siteNames[number];

export interface Config {
	NODE_ENV: NODE_ENV;
	isDev: boolean;
	envPrefix: EnvPrefix;
	scrapeSiteTimeout: number;
	startMaximized: boolean;
	logsLevel: number;
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
	_debugInfo?: SiteScraperDebugInfo;
}

export interface SiteOffers {
	offers: Offer[];
	siteName: SiteName;
	scrapedAt: Date;
}
