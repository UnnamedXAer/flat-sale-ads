import { Browser } from 'puppeteer';
import cheerio from 'cheerio';
import { Announcement } from '../types';
import l from '../logger';
import { config } from '../config';

export const getRzeszowiakAnnouncements = async (
	browser: Browser
): Promise<Announcement[]> => {
	const startPage = await browser.newPage();
	const response = await startPage.goto(config.urls.rzeszowiak);
	// @improvement: use getRzeszowiakPageContent
	if (!response) {
		throw new Error(`Unable to load "${config.urls.rzeszowiak}"`);
	}

	const content = await startPage.content();
	const $ = cheerio.load(content);
	const pagesUrls: string[] = [];
	const pagesLinkElements = $('a.oDnn');
	pagesLinkElements.map((_, el) => {
		const attr = (el as cheerio.TagElement).attribs['href'];
		pagesUrls.push(attr);
	});
	const now = Date.now();
	const promises = pagesUrls.map(async (url) => {
		const content = await getRzeszowiakPageContent(
			browser,
			'http://www.rzeszowiak.pl' + url
		);
		const $ = cheerio.load(content);
		const $ads = $('.normalbox');
		const now = Date.now();
		const pageAds = await parseRzeszowiakPageAnnouncements($, $ads);
		l.info(
			'--parseRzeszowiakPageAnnouncements execution time:',
			Date.now() - now,
			'ms'
		);

		return pageAds;
	});

	const announcements = await Promise.all(promises);
	l.info('--getRzeszowiakAnnouncements execution time:', Date.now() - now, 'ms');
	return announcements.flat(1);
};

const getRzeszowiakPageContent = async (
	browser: Browser,
	url: string
): Promise<string> => {
	const page = await browser.newPage();
	const response = await page.goto(url);
	if (!response) {
		throw new Error(`Unable to load "${url}"`);
	}
	const content = await page.content();
	await page.close({ runBeforeUnload: false });
	return content;
};

const parseRzeszowiakPageAnnouncements = async (
	$: cheerio.Root,
	$ads: cheerio.Cheerio
): Promise<Announcement[]> => {
	// @improvement - check if promoted ads should not be excluded.
	const adsElements = $ads.toArray();
	const announcements = adsElements.map((ad) => {
		const announcement = {} as Announcement;
		const $ad = $(ad);
		const $titleLink = $ad.find('.normalbox-title-left a');
		// @todo: remove index
		announcement.title = $titleLink.text().trim();
		announcement.url = $titleLink.attr('href')!;
		let priceText = $ad.find('.normalbox-title-left2 strong').text();
		priceText = priceText.replace(/[^\d\.,]/gi, '');
		if (priceText !== +priceText + '') {
			l.debug(`[Rzeszowiak] Price "${priceText}" is not a number.`, announcement.url);
		}
		announcement.price = priceText;

		const imgUrl = $ad.find('.normalbox-body-left img').attr('src')!;
		announcement.imgUrl = imgUrl;

		const description = $ad.find('.normalbox-body .normalbox-body-right').text();
		announcement.description = description;

		const dt = $ad.find('.normalbox-more .dodane b').text();
		// @todo: parse words like "dziś" to date
		announcement.dt = dt;
		return announcement;
	});
	return announcements;
};
