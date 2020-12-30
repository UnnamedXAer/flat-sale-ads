import { Browser } from 'puppeteer';
import cheerio from 'cheerio';
import { Announcement } from '../types';
import l from '../logger';
import { Urls } from '../constants';
import { config } from '../config';

export const getOlxAnnouncements = async (browser: Browser): Promise<Announcement[]> => {
	const startPage = await browser.newPage();
	const response = await startPage.goto(Urls.Olx);

	if (!response) {
		throw new Error(`Unable to load "${Urls.Olx}"`);
	}

	const content = await startPage.content();
	const $ = cheerio.load(content);
	const pagesUrls: string[] = [];

	const pagesLinkElements = $('div.pager.rel.clr').find(
		'a.block.br3.brc8.large.tdnone.lheight24'
	);
	if (pagesLinkElements.length === 0) {
		l.warn('[Olx] Unable to read the links to the next pages.');
	}

	pagesLinkElements.map((idx, _el) => {
		// @improvement: olx just add &page=num to url so there is no need to read in from elements
		// @i: if we switch to used attr remember the current page does not have link
		// const attr = (el as cheerio.TagElement).attribs['href'];
		// pagesUrls.push(attr);
		pagesUrls.push(Urls.Olx + '&page=' + (idx + 1));
	});
	const now = Date.now();
	const promises = pagesUrls.map<Promise<Announcement[]>>(async (url) => {
		const content = await getOlxPageContent(browser, url);
		const $ = cheerio.load(content);
		// // @i: remove fixed promoted offers, because the are also included in normal offers list
		// $('table.fixed.offers.breakword.offers--top.redesigned').remove();
		// const fixedOffers = $('table.fixed.offers.breakword.offers--top.redesigned');
		// if (fixedOffers.length > 0) {
		// 	throw new Error('Fixed offers where not removed!');
		// }
		// const $ads = $('table.fixed.offers.breakword.redesigned').find(
		const $ads = $('table#offers_table').find('div.offer-wrapper>table');
		const now = Date.now();
		const pageAds = await parseOlxPageAnnouncements($, $ads);
		l.info('--parseOlxPageAnnouncements execution time:', Date.now() - now, 'ms');

		return pageAds;
	});

	const announcements = await Promise.all(promises);
	l.info('--getOlxAnnouncements execution time:', Date.now() - now, 'ms');
	const flatted = announcements.flat(1);
	if (config.isDev) {
		const withMissingData = flatted
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
			l.warn('[Olx] Some of the ads have missing data', withMissingData);
		}
	}
	return flatted;
};

const getOlxPageContent = async (browser: Browser, url: string): Promise<string> => {
	const page = await browser.newPage();
	const response = await page.goto(url);
	if (!response) {
		throw new Error(`Unable to load "${url}"`);
	}
	const content = await page.content();
	await page.close({ runBeforeUnload: false });
	return content;
};

const parseOlxPageAnnouncements = async (
	$: cheerio.Root,
	$ads: cheerio.Cheerio
): Promise<Announcement[]> => {
	const adsElements = $ads.toArray();
	const announcements = adsElements.map((ad) => {
		const announcement = {} as Announcement;
		const $ad = $(ad);
		const $titleLink = $ad.find('.title-cell a');

		announcement.title = $titleLink.text().replace(/[\n]/gi, '').trim();
		announcement.url = $titleLink.attr('href')!;
		let priceText = $ad.find('.td-price .price>strong').text();
		priceText = priceText.replace(/[^\d\.,]/gi, '');
		if (priceText !== +priceText + '') {
			l.debug(`[Olx] Price "${priceText}" is not a number.`, announcement.url);
		}
		announcement.price = priceText;

		const imgUrl = $ad.find('.photo-cell > a > img').attr('src')!;
		announcement.imgUrl = imgUrl;

		// @i: there is no description in ad card, it would require to open details to gen desc.
		announcement.description = '';

		// @todo: break when older then 24h
		const dt = $ad
			.find('.bottom-cell .breadcrumb.x-normal>span > [data-icon*="clock"]')
			.parent()
			.text();
		// @todo: parse words like "dziś" to date
		announcement.dt = dt;
		return announcement;
	});
	return announcements;
};
