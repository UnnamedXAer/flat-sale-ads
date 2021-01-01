import { Browser } from 'puppeteer';
import cheerio from 'cheerio';
import { Announcement } from '../types';
import l from '../logger';
import { DAY_MS } from '../constants';
import { config } from '../config';

let _debugInfo = { url: String(config.urls.olx), idx: 0 };

const sleep = (timeout: number) =>
	new Promise((resolve) =>
		setTimeout(() => {
			resolve(true);
		}, timeout)
	);

export async function getOlxAnnouncements(
	browser: Browser
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
			$currentPge = await getOlxPage(browser, url);
		} catch (err) {
			if (Date.now() - startTime > config.scrapeSiteTimeout) {
				return [
					announcements,
					new Error(`[Olx] Scraping exceeded ${config.scrapeSiteTimeout} min.`)
				];
			}
			retries++;
			const timeout = (retries < 15 ? retries : 15) * 1000;
			l.debug(`Setting retry #${retries} timeout: ${timeout}.`);
			await sleep(timeout);
			continue;
		}
		_debugInfo.url = url;
		[pageAnnouncements, isDone] = await getOlxPageAds($currentPge);
		announcements.push(...pageAnnouncements);
		scrapedPagesCount++;
		pageUrls.shift();
		if (isDone === false && scrapedPagesCount === 1) {
			pageUrls.push(...getOlxUrlsToNextPages($currentPge));
		}
	} while (isDone === false && pageUrls.length > 0);

	l.info(`[Olx] Scraped pages count: ${scrapedPagesCount}, retries count ${retries}.`);

	return [announcements, null];
}

export function getOlxUrlsToNextPages($page: cheerio.Root) {
	const pagesUrls: string[] = [];
	// @i: the first page does not have link
	const pagesCount = $page('div.pager.rel.clr').find(
		'a.block.br3.brc8.large.tdnone.lheight24'
	).length;
	// @i: olx just add &page=num to url so there is no need to read links from the elements
	// @i: pages starts from 1, skip first page
	for (let i = 2; i < pagesCount; i++) {
		pagesUrls.push(config.urls.olx + '&page=' + i);
	}
	l.debug(`Olx pages number: ${pagesUrls.length} + 1 (first page).`);

	return pagesUrls;
}

export async function getOlxPage(browser: Browser, url: string): Promise<cheerio.Root> {
	const now = Date.now();
	const page = await browser.newPage();
	l.debug('[Olx] browser.newPage execution time: ' + (Date.now() - now));

	try {
		const now1 = Date.now();
		const response = await page.goto(url);
		l.debug('[Olx] page.goto execution time: ' + (Date.now() - now1));
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

export async function getOlxPageAds(
	$page: cheerio.Root
): Promise<[ads: Announcement[], isDone: boolean]> {
	const $ads = $page('table#offers_table').find('div.offer-wrapper>table');
	const now = Date.now();
	const [pageAds, isDone] = parseOlxPageAds($page, $ads);
	l.info('--parseOlxPageAnnouncements execution time:', Date.now() - now, 'ms');

	return [pageAds, isDone];
}

export function parseOlxPageAds(
	$page: cheerio.Root,
	$ads: cheerio.Cheerio
): [ads: Announcement[], isDone: boolean] {
	const announcements: Announcement[] = [];
	for (let i = 0, len = $ads.length; i < len; i++) {
		const announcement = {} as Announcement;
		const $ad = $page($ads[i]);

		const dt = $ad
			.find('.bottom-cell .breadcrumb.x-normal>span > [data-icon*="clock"]')
			.parent()
			.text();
		const parsedDate = parseOlxAdTime(dt);
		let adDate: string;

		if (typeof parsedDate === 'object') {
			let isTodayOrYesterday = /(dzisiaj|wczoraj)/.test(dt);
			// @i: now minus 24 hours with some padding (30s) for the program execution
			// @i: the padding also solves midnight dates.
			const currentDate = Date.now() - (DAY_MS + 1000 * 30);
			// @info: for "dziś/wczoraj" we got the ad's hour and min therefore we can determine if is older then 24h
			// @info: for other cases like "29 gru" the time will be 00:00, so some more hours will be included
			if (currentDate > parsedDate.getTime() - (isTodayOrYesterday ? 0 : DAY_MS)) {
				return [announcements, true];
			}

			adDate = parsedDate.toLocaleString(
				...(isTodayOrYesterday
					? config.dateTimeFormatParams
					: config.dateFormatParams)
			);
		} else {
			// @i: type string means that service was not able to get/parse date.
			adDate = parsedDate;
		}

		announcement.dt = adDate;
		const $titleLink = $ad.find('.title-cell a');
		announcement.title = $titleLink.text().replace(/[\n]/gi, '').trim();
		announcement.url = $titleLink.attr('href')!;
		let priceText = $ad.find('.td-price .price>strong').text();
		priceText = priceText.replace(/[^\d\.,]/gi, '').replace(/,/g, '.');
		if (isNaN(+priceText)) {
			l.debug(`[Olx] Price "${priceText}" is not a number.`, announcement.url);
		}
		announcement.price = priceText;

		const imgUrl = $ad.find('.photo-cell > a > img').attr('src')!;
		announcement.imgUrl = imgUrl;

		// @i: there is no description in ad card, it would require to open details to gen desc.
		announcement.description = '';
		_debugInfo.idx = i;
		announcement._debugInfo = { ..._debugInfo };
		announcements.push(announcement);
	}

	return [announcements, false];
}

export function parseOlxAdTime(olxTime: string): Date | string {
	const olxTimeArr = olxTime.split(' ').filter((x) => x !== '');
	if (olxTimeArr.length > 2) {
		l.silly('1.	returning default time:', olxTime);
		return olxTime;
	}

	if (olxTimeArr[0] === 'dzisiaj' || olxTimeArr[0] === 'wczoraj') {
		return parseOlxAdTimeWithTodayYesterday(olxTimeArr[0], olxTimeArr[1]);
	}

	return parseOlxAdDateWithMontPrefix(olxTimeArr[1], olxTimeArr[0]);
}

export function parseOlxAdDateWithMontPrefix(
	monthPrefix: string,
	day: string
): Date | string {
	// @i: in this case the "olxTime" will be like 29 gru
	// @i: so we just need to map the mont prefix to full name
	monthPrefix = monthPrefix.substr(0, 3); // @i: not sure if all moth are represented as 3 chars
	const currentDate = new Date();
	let dayNum = parseInt(day, 10);

	if (isNaN(dayNum) || +day !== dayNum) {
		l.silly('2.	returning default time:', day + ' ' + monthPrefix);
		return day + ' ' + monthPrefix;
	}

	let year = currentDate.getFullYear();
	const monthNum = mapMonthPrefixToMonth(monthPrefix, true) as number;
	if (monthNum === 11) {
		if (currentDate.getDate() < dayNum) {
			year = year - 1;
		}
	}

	const adDate = new Date(year, monthNum, dayNum);
	return adDate;
}

export function parseOlxAdTimeWithTodayYesterday(
	daySynonym: 'dzisiaj' | 'wczoraj',
	time: string
): Date | string {
	const timeArr = time.split(':');
	const hour = parseInt(timeArr[0], 10);
	const minutes = parseInt(timeArr[1], 10);
	if (
		isNaN(hour) ||
		isNaN(minutes) ||
		hour !== +timeArr[0] ||
		minutes !== +timeArr[1]
	) {
		l.silly('3.	returning default time:', daySynonym + ' ' + time);

		return daySynonym + ' ' + time;
	}

	const currentDate = new Date();
	const adDate = new Date(
		currentDate.getFullYear(),
		currentDate.getMonth(),
		currentDate.getDate() + (daySynonym === 'wczoraj' ? -1 : 0),
		hour,
		minutes
	);
	return adDate;
}

export function mapMonthPrefixToMonth(
	monthPrefix: string,
	asNumber: boolean = true
): string | number {
	switch (monthPrefix) {
		case 'sty':
			return asNumber ? 0 : 'styczeń';
		case 'lut':
			return asNumber ? 1 : 'luty';
		case 'mar':
			return asNumber ? 2 : 'marzec';
		case 'kwi':
			return asNumber ? 3 : 'kwiecień';
		case 'maj':
			return asNumber ? 4 : 'maj';
		case 'cze':
			return asNumber ? 5 : 'czerwiec';
		case 'lip':
			return asNumber ? 6 : 'lipiec';
		case 'sie':
			return asNumber ? 7 : 'sierpień';
		case 'wrz':
			return asNumber ? 8 : 'wrzesień';
		case 'paź':
		case 'paz':
			return asNumber ? 9 : 'październik';
		case 'lis':
			return asNumber ? 10 : 'listopad';
		case 'gru':
			return asNumber ? 11 : 'grudzień';
		default:
			throw new Error('Unrecognized month prefix');
	}
}
