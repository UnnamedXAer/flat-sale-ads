import { Browser } from 'puppeteer';
import pp from 'puppeteer';
import l from '../logger';
import { getRzeszowiakAnnouncements } from './rAnnouncements';
import { SiteName, Announcement } from '../types';
import { getOlxAnnouncements } from './oAnnouncements';
import { saveSiteAnnouncements } from '../files';

export async function scrapeAnnouncements() {
	const currentSite: SiteName = 'olx';

	const browser = await pp.launch({ headless: true });
	const todayAnnouncements = await getAnnouncements(browser, currentSite);
	l.info(
		`The number of today's "${currentSite}" announcements is: `,
		todayAnnouncements.length
	);
	await browser.close();
	await saveSiteAnnouncements(currentSite, todayAnnouncements);
}

export function getAnnouncements(
	browser: Browser,
	siteName: SiteName
): Promise<Announcement[]> {
	switch (siteName) {
		case 'rzeszowiak':
			return getRzeszowiakAnnouncements(browser);
		case 'olx':
			return getOlxAnnouncements(browser);
		default:
			throw new Error('Unrecognized site name: ' + siteName);
	}
}
