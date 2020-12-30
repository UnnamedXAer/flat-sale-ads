import { Browser } from 'puppeteer';
import { getRzeszowiakAnnouncements } from './rAnnouncements';
import { SiteName, Announcement } from '../types';
import { getOlxAnnouncements } from './oAnnouncements';

export const getAnnouncements = (
	browser: Browser,
	siteName: SiteName
): Promise<Announcement[]> => {
	switch (siteName) {
		case 'rzeszowiak':
			return getRzeszowiakAnnouncements(browser);
		case 'olx':
			return getOlxAnnouncements(browser);
		default:
			throw new Error('Unrecognized site name: ' + siteName);
	}
};
