import { Browser } from 'puppeteer';
import { getRzeszowiakAnnouncements } from '../announcements';
import { SiteName, Announcement } from '../types';

export const getAnnouncements = (
	browser: Browser,
	siteName: SiteName
): Promise<Announcement[]> => {
	switch (siteName) {
		case 'rzeszowiak':
			return getRzeszowiakAnnouncements(browser);
		case 'olx':
			throw new Error('The "olx" site is not supported yet.');
		default:
			throw new Error('Unrecognized site name: ' + siteName);
	}
};
