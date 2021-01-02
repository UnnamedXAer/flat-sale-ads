import { Browser } from 'puppeteer';
import path from 'path';
import l from '../logger';
import { Announcement, SiteName } from '../types';
import cheerio from 'cheerio';
import { config } from '../config';
import { sleep } from '../sleep';
import { IScraper, ISiteScraper } from './types';
import { ensurePathExists } from '../files';
import { getScraperByName } from './siteScraperFactory';
import { formatDateToFileName } from '../formatDate';
import { writeFile } from 'fs/promises';

export class Scraper implements IScraper {
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
		const scraper = new Scraper();
		const siteScraper = getScraperByName(siteName);
		// @todo: handle error
		const [todayAnnouncements, error] = await scraper.getAnnouncements(
			browser,
			siteScraper
		);
		await this.saveSiteAnnouncements(siteScraper.serviceName, todayAnnouncements);
		this.validateAnnouncements(todayAnnouncements, siteScraper.serviceName);

		l.info(
			`The number of today's "${siteScraper.serviceName}" announcements is: `,
			todayAnnouncements.length
		);
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
		siteScraper: ISiteScraper
	): Promise<[Announcement[], Error | null]> {
		const announcements: Announcement[] = [];
		const pageUrls: string[] = [config.urls[siteScraper.serviceName]];
		const startTime = Date.now();
		let isDone = false;
		let scrapedPagesCount = 0;
		let retries = 0;
		do {
			let pageAnnouncements: Announcement[];
			const url = pageUrls[0];
			let $currentPge: cheerio.Root;
			try {
				$currentPge = await this.getPage(browser, url, siteScraper);
			} catch (err) {
				if (Date.now() - startTime > config.scrapeSiteTimeout) {
					return [
						announcements,
						new Error(
							`[${siteScraper.serviceName}] Scraping exceeded ${config.scrapeSiteTimeout} min.`
						)
					];
				}
				retries++;
				const timeout = (retries < 15 ? retries : 15) * 1000;
				l.debug(
					`[${siteScraper.serviceName}] Setting retry #${retries} timeout: ${timeout}.`
				);
				await sleep(timeout);
				continue;
			}
			siteScraper._debugInfo.url = url;
			[pageAnnouncements, isDone] = siteScraper.getPageAds($currentPge);
			announcements.push(...pageAnnouncements);
			scrapedPagesCount++;
			pageUrls.shift();
			if (isDone === false && scrapedPagesCount === 1) {
				pageUrls.push(...siteScraper.getUrlsToNextPages($currentPge));
			}
		} while (isDone === false && pageUrls.length > 0);

		l.info(
			`[${siteScraper.serviceName}] Scraped pages count: ${scrapedPagesCount}, retries count ${retries}.`
		);

		return [announcements, null];
	}

	private async getPage(
		browser: Browser,
		url: string,
		siteScraper: ISiteScraper
	): Promise<cheerio.Root> {
		const now = Date.now();
		const page = await browser.newPage();
		l.debug(
			`[${siteScraper!.serviceName}] browser.newPage execution time: ` +
				(Date.now() - now)
		);

		try {
			const now1 = Date.now();
			const response = await page.goto(url);
			l.debug(
				`[${siteScraper!.serviceName}] page.goto execution time: ` +
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
