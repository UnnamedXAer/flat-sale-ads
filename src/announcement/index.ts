import { Browser } from 'puppeteer';
import pp from 'puppeteer';
import l, { lTime } from '../logger';
import { getRzeszowiakAnnouncements } from './rAnnouncements';
import { SiteName, Announcement } from '../types';
import { getOlxAnnouncements } from './oAnnouncements';
import { saveSiteAnnouncements } from '../files';
import { validateAnnouncementsAndReturn } from './validate';

export async function scrapeAnnouncements() {
	const currentSite: SiteName = 'olx';
	const now = Date.now();
	const browser = await pp.launch({ headless: false });
	const nowAfterBrowserLaunch = Date.now();
	const todayAnnouncements = await getAnnouncements(browser, currentSite);
	const nowAfterGettingAnnouncements = Date.now();
	await saveSiteAnnouncements(currentSite, todayAnnouncements);
	const nowAfterSavingAnnouncements = Date.now();
	await browser.close();
	const nowAfterClosingBrowser = Date.now();
	validateAnnouncementsAndReturn(todayAnnouncements, currentSite);
	const nowAfterValidation = Date.now();

	l.info(
		`The number of today's "${currentSite}" announcements is: `,
		todayAnnouncements.length
	);

	l.info(`
	scrapeAnnouncements("${currentSite}")
	browser launch time: ${lTime(nowAfterBrowserLaunch - now)}
	scrape announcements time: ${lTime(nowAfterGettingAnnouncements - nowAfterBrowserLaunch)}
	save announcements time: ${lTime(
		nowAfterSavingAnnouncements - nowAfterGettingAnnouncements
	)}
	browser close time: ${lTime(nowAfterClosingBrowser - nowAfterSavingAnnouncements)}
	validation time: ${lTime(nowAfterValidation - nowAfterClosingBrowser)}
	*** total execution time: ${lTime(nowAfterClosingBrowser - now)}
	total execution with validation time: ${lTime(nowAfterValidation - now)}
	`);
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
