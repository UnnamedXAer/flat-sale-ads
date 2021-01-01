import { Browser } from 'puppeteer';
import path from 'path';
import l, { lTime } from '../logger';
import { Announcement, SiteName } from '../types';
import cheerio from 'cheerio';
import { config } from '../config';
import { sleep } from '../sleep';
import { IScrapper, ISiteScrapper } from './types';
import { ensurePathExists } from '../files';
import { getScrapperByName } from './siteScrapperFactory';
import { formatDateToFileName } from '../formatDate';
import { writeFile } from 'fs/promises';

export class Scrapper implements IScrapper {
	async scrapeAnnouncements(browser: Browser, sites: SiteName[]) {
		let siteIndex = 0;
		while (siteIndex < sites.length) {
			const promises: Promise<void>[] = [];
			promises.push(this.scrapeSiteAnnouncements(browser, sites[siteIndex]));
			if (++siteIndex < sites.length) {
				promises.push(this.scrapeSiteAnnouncements(browser, sites[siteIndex]));
			}

			await Promise.all(promises);
		}
	}

	private async scrapeSiteAnnouncements(browser: Browser, siteName: SiteName) {
		const now = Date.now();
		const nowAfterBrowserLaunch = Date.now();
		const scrapper = new Scrapper();
		const siteScrapper = getScrapperByName(siteName);
		// @todo: handle error
		const [todayAnnouncements, error] = await scrapper.getAnnouncements(
			browser,
			siteScrapper
		);
		const nowAfterGettingAnnouncements = Date.now();
		await this.saveSiteAnnouncements(siteScrapper.serviceName, todayAnnouncements);
		const nowAfterSavingAnnouncements = Date.now();
		this.validateAnnouncements(todayAnnouncements, siteScrapper.serviceName);
		const nowAfterValidation = Date.now();

		l.info(
			`The number of today's "${siteScrapper.serviceName}" announcements is: `,
			todayAnnouncements.length
		);

		l.info(`
		scrapeAnnouncements("${siteScrapper.serviceName}")
		browser launch time: ${lTime(nowAfterBrowserLaunch - now)}
		scrape announcements time: ${lTime(nowAfterGettingAnnouncements - nowAfterBrowserLaunch)}
		save announcements time: ${lTime(
			nowAfterSavingAnnouncements - nowAfterGettingAnnouncements
		)}
		**total execution with validation time: ${lTime(nowAfterValidation - now)}
		`);
	}

	private async saveSiteAnnouncements(
		siteName: SiteName,
		announcements: Announcement[]
	) {
		const dirPath = path.resolve(__dirname, '..', '..', 'data', siteName);
		const pathName = path.join(dirPath, `${formatDateToFileName()}.json`);
		const text = JSON.stringify(announcements, null, config.isDev ? '\t' : 0);
		try {
			await ensurePathExists(dirPath);
			l.info(`About to save the ${siteName} announcements to "${pathName}".`);
			await writeFile(pathName, text);
		} catch (err) {
			l.error(`Fail to save the ${siteName} announcements to the file.`, err);
			throw err;
		}
	}

	private async getAnnouncements(
		browser: Browser,
		siteScrapper: ISiteScrapper
	): Promise<[Announcement[], Error | null]> {
		const announcements: Announcement[] = [];
		const pageUrls: string[] = [config.urls.olx];
		const startTime = Date.now();
		let isDone = false;
		let scrapedPagesCount = 0;
		let retries = 0;
		do {
			let pageAnnouncements: Announcement[];
			const url = pageUrls[0];
			let $currentPge: cheerio.Root;
			try {
				$currentPge = await this.getPage(browser, url, siteScrapper);
			} catch (err) {
				if (Date.now() - startTime > config.scrapeSiteTimeout) {
					return [
						announcements,
						new Error(
							`[${siteScrapper.serviceName}] Scraping exceeded ${config.scrapeSiteTimeout} min.`
						)
					];
				}
				retries++;
				const timeout = (retries < 15 ? retries : 15) * 1000;
				l.debug(
					`[${siteScrapper.serviceName}] Setting retry #${retries} timeout: ${timeout}.`
				);
				await sleep(timeout);
				continue;
			}
			siteScrapper._debugInfo.url = url;
			[pageAnnouncements, isDone] = await siteScrapper.getPageAds($currentPge);
			announcements.push(...pageAnnouncements);
			scrapedPagesCount++;
			pageUrls.shift();
			if (isDone === false && scrapedPagesCount === 1) {
				pageUrls.push(...siteScrapper.getUrlsToNextPages($currentPge));
			}
		} while (isDone === false && pageUrls.length > 0);

		l.info(
			`[${siteScrapper.serviceName}] Scraped pages count: ${scrapedPagesCount}, retries count ${retries}.`
		);

		return [announcements, null];
	}

	private async getPage(
		browser: Browser,
		url: string,
		siteScrapper: ISiteScrapper
	): Promise<cheerio.Root> {
		const now = Date.now();
		const page = await browser.newPage();
		l.debug(
			`[${siteScrapper!.serviceName}] browser.newPage execution time: ` +
				(Date.now() - now)
		);

		try {
			const now1 = Date.now();
			const response = await page.goto(url);
			l.debug(
				`[${siteScrapper!.serviceName}] page.goto execution time: ` +
					(Date.now() - now1)
			);
			if (!response) {
				throw Error('Could not get response the page.');
			}
			const responseStatus = response ? response.status() : null;
			if (responseStatus !== 200) {
				throw Error(`Wrong response status ( ${responseStatus} ) .`);
			}
		} catch (err) {
			await page.close({ runBeforeUnload: true });
			throw new Error(
				`Unable to correctly load page:\n"${url}"\ndue to following error: \n ${err.message}`
			);
		}
		const content = await page.content();
		await page.close({ runBeforeUnload: false });
		const $page = cheerio.load(content);
		return $page;
	}

	private validateAnnouncements(
		announcements: Announcement[],
		siteName: SiteName
	): Announcement[] {
		if (config.isDev) {
			const withMissingData = announcements
				.map((x) => {
					if (
						x.title === '' ||
						x.price === '' ||
						x.url === '' ||
						x.dt === '' ||
						x.imgUrl === ''
					) {
						return x;
					}
					return null;
				})
				.filter((x) => x != null);

			if (withMissingData.length > 0) {
				l.warn(
					`[${siteName}] Some of the ads have missing data`,
					withMissingData
				);
			}
		}
		return announcements;
	}
}
