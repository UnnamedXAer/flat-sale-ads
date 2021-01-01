export type NODE_ENV = 'production' | 'development' | 'test';
export type EnvPrefix = 'test' | 'dev' | 'prod';
export interface Config {
	NODE_ENV: NODE_ENV;
	isDev: boolean;
	envPrefix: EnvPrefix;
	logsLevel: number;
	appTemporaryDataFolder: string;
	dateTimeFormatParams: [string, Intl.DateTimeFormatOptions];
	dateFormatParams: [string, Intl.DateTimeFormatOptions];
	timeFormatParams: [string, Intl.DateTimeFormatOptions];
}

export interface Announcement {
	dt: string;
	title: string;
	price: string;
	description: string;
	url: string;
	imgUrl: string;
	_debugInfo?: any;
}

export type DayAnnouncements = {
	[key in SiteName]: Announcement[] | null;
};

export type SiteName = 'rzeszowiak' | 'olx';
