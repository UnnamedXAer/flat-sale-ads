import { Browser, Page } from 'puppeteer';
import path from 'path';
import l from '../logger';
import { Announcement, SiteName } from '../types';
import cheerio from 'cheerio';
import { config } from '../config';
import { sleep } from '../sleep';
import {
	IScraper,
	ISiteScraper,
	ISiteScraperByHtml,
	ISiteScraperByObject,
	ScraperDataType
} from './types';
import { ensurePathExists } from '../files';
import { makeSiteScraper } from './siteScraperFactory';
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
			// @info: scrape up to two sites at a time.
			await Promise.all(promises);
		}
	}

	private async scrapeSiteAnnouncements(browser: Browser, siteName: SiteName) {
		const siteScraper = makeSiteScraper(siteName);
		// @todo: handle error
		const [todayAnnouncements, error] = await this.getSiteAnnouncements(
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

	private async getSiteAnnouncements(
		browser: Browser,
		siteScraper: ISiteScraper
	): Promise<[Announcement[], Error | null]> {
		const announcements: Announcement[] = [];
		const pageUrls: string[] = [config.urls[siteScraper.serviceName]];
		let isDone = false;
		let scrapedPagesCount = 0;
		do {
			let pageAnnouncements: Announcement[];
			let currentPage: Page;
			const url = pageUrls[0];

			siteScraper._debugInfo.url = url;
			try {
				currentPage = await this.getPage(browser, url, siteScraper);
			} catch (err) {
				return [announcements, err];
			}
			const $currentPage: cheerio.Root = await this.getPageContent(currentPage);

			[pageAnnouncements, isDone] = await this.getScraperPageAds(
				siteScraper,
				$currentPage,
				currentPage
			);
			announcements.push(...pageAnnouncements);
			scrapedPagesCount++;
			pageUrls.shift();
			if (isDone === false && scrapedPagesCount === 1) {
				pageUrls.push(
					...(siteScraper.scrapperDataType === ScraperDataType.Html
						? siteScraper.getUrlsToNextPages($currentPage)
						: siteScraper.getUrlsToNextPages(url))
				);
			}
		} while (isDone === false && pageUrls.length > 0);

		l.info(`[${siteScraper.serviceName}] Scraped pages count: ${scrapedPagesCount}.`);

		return [announcements, null];
	}

	private async getScraperPageAds(
		siteScraper: ISiteScraper,
		$currentPage: cheerio.Root,
		currentPage: Page
	): Promise<[ads: Announcement[], isDone: boolean]> {
		if (siteScraper.scrapperDataType === ScraperDataType.Html) {
			return siteScraper.getPageAds($currentPage);
		}
		return siteScraper.getPageAds(currentPage);
	}

	private async getPage(
		browser: Browser,
		url: string,
		siteScraper: ISiteScraper
	): Promise<Page> {
		let retries = 0;
		const startTime = Date.now();
		do {
			try {
				const page = await this.loadPage(browser, url, siteScraper);
				return page;
			} catch (err) {
				if (Date.now() - startTime > config.scrapeSiteTimeout) {
					new Error(
						`[${siteScraper.serviceName}] Scraping exceeded ${config.scrapeSiteTimeout} min.`
					);
				}
				retries++;
				const timeout = (retries < 15 ? retries : 15) * 1000;
				l.debug(
					`[${siteScraper.serviceName}] Setting retry #${retries} timeout: ${timeout}.`
				);
				await sleep(timeout);
			}
		} while (true);
	}

	private async loadPage(
		browser: Browser,
		url: string,
		siteScraper: ISiteScraper
	): Promise<Page> {
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
		return page;
	}

	private async getPageContent(page: Page): Promise<cheerio.Root> {
		const content = await page.content();
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
						x.id === '' ||
						x.title === '' ||
						x.price === '' ||
						x.url === '' ||
						x.dt === '' ||
						x.imgUrl === ''
					) {
						return x.id
							? x.id
							: x.url
							? x.url
							: x.title
							? x.title
							: JSON.stringify(x._debugInfo, null, 2);
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
