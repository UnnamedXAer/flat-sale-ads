import { config } from '../config';
import { DAY_MS } from '../constants';
import globals from '../globals';
import l from '../logger';
import { SiteName, IOffer } from '../types';
import { ISiteScraperByHtml, ScraperDataType, SiteScraperDebugInfo } from './types';

export class OlxScraper implements ISiteScraperByHtml {
	_debugInfo: SiteScraperDebugInfo = {
		idx: -1,
		url: ''
	};
	serviceName: SiteName = 'olx';
	scrapperDataType: ScraperDataType.Html = ScraperDataType.Html;

	getPageAds($page: cheerio.Root): [ads: IOffer[], isDone: boolean] {
		const $ads = $page('table#offers_table').find('div.offer-wrapper>table');
		const now = Date.now();
		const [pageAds, isDone] = this.parsePageAds($page, $ads);
		l.info(
			`[${this.serviceName}]->parsePageAds execution time: ${Date.now() - now} ms.`
		);

		return [pageAds, isDone];
	}

	parsePageAds(
		$page: cheerio.Root,
		$ads: cheerio.Cheerio
	): [ads: IOffer[], isDone: boolean] {
		const offers: IOffer[] = [];
		let isDone = false;
		for (let i = 0, len = $ads.length; i < len; i++) {
			const $ad = $page($ads[i]);

			const [_dt, dt, _isAddTooOld] = this.getAdTime($ad);
			isDone = _isAddTooOld;
			if (isDone === true) {
				break;
			}

			const $titleLink = $ad.find('.title-cell a');
			const title = $titleLink.text().replace(/[\n]/gi, '').trim();
			const url = $titleLink.attr('href')!;
			let priceText = $ad.find('.td-price .price>strong').text();
			const price = priceText.replace(/[^\d\.,]/gi, '').replace(/,/g, '.');
			priceText;
			if (price !== +price + '') {
				l.debug(`[${this.serviceName}] Price "${price}" is not a number.`, url);
			}

			const imgUrl = $ad.find('.photo-cell > a > img').attr('src')!;

			const id = $ad.attr('data-id')!;

			// @i: there is no description in ad card, it would require to open details to generate description.
			const description = '';

			const offer: IOffer = {
				site: 'olx',
				dt_: _dt,
				dt,
				scrapedAt: new Date(globals.programStartTime),
				title,
				price,
				offerId: id,
				url,
				description,
				imgUrl
			};
			offers.push(offer);
		}

		return [offers, isDone];
	}

	getAdTime(
		$ad: cheerio.Cheerio
	): [adDateText: Date, adDateText: string, isDone: boolean] {
		const scrapedDate = $ad
			.find('.bottom-cell .breadcrumb.x-normal>span > [data-icon*="clock"]')
			.parent()
			.text();
		const isTodayOrYesterday =
			scrapedDate.includes('dzisiaj') || scrapedDate.includes('wczoraj');
		const parsedDate: Date = this.parseAdTime(scrapedDate, isTodayOrYesterday);
		let adDateText: string = scrapedDate;

		if (isFinite(parsedDate.getTime()) === true) {
			adDateText = parsedDate.toLocaleString(...config.dateTimeFormatParams);
			if (this.checkIfAdTooOld(parsedDate, isTodayOrYesterday)) {
				return [parsedDate, adDateText, true];
			}
		}
		return [parsedDate, adDateText, false];
	}

	parseAdTime(scrapedTime: string, isTodayOrYesterday: boolean): Date {
		const scrapedTimeArr = scrapedTime.split(' ').filter((x) => x !== '');

		if (isTodayOrYesterday) {
			return this.parseAdTimeWithTodayYesterdayWords(
				scrapedTimeArr[0] as 'dzisiaj' | 'wczoraj',
				scrapedTimeArr[1]
			);
		}

		return this.parseAdDateWithMontPrefix(scrapedTimeArr[1], scrapedTimeArr[0]);
	}

	parseAdDateWithMontPrefix(monthPrefix: string, day: string): Date {
		// @i: in this case the "olxTime" will be like 29 gru
		// @i: so we just need to map the mont prefix to full name
		monthPrefix = monthPrefix.substr(0, 3); // @i: not sure if all moth are represented as 3 chars
		const currentDate = new Date();
		let dayNum = parseInt(day, 10);

		let year = currentDate.getFullYear();
		const monthNum = this.mapMonthPrefixToMonth(monthPrefix, true) as number;
		if (monthNum === 11) {
			if (currentDate.getDate() < dayNum) {
				year = year - 1;
			}
		}

		const adDate = new Date(year, monthNum, dayNum);

		if (isNaN(dayNum) || +day !== dayNum) {
			// @i: the date object may not be "Invalid Date" but may be set to wrong date
			l.debug(
				`The date for "${monthPrefix + ' / ' + day}" may be invalid. Date: `,
				adDate
			);
		}

		return adDate;
	}

	parseAdTimeWithTodayYesterdayWords(
		daySynonym: 'dzisiaj' | 'wczoraj',
		time: string
	): Date {
		const timeArr = time.split(':');
		const hour = parseInt(timeArr[0], 10);
		const minutes = parseInt(timeArr[1], 10);

		const currentDate = new Date();
		const adDate = new Date(
			currentDate.getFullYear(),
			currentDate.getMonth(),
			currentDate.getDate() + (daySynonym === 'wczoraj' ? -1 : 0),
			hour,
			minutes
		);

		if (
			isNaN(hour) ||
			isNaN(minutes) ||
			hour !== +timeArr[0] ||
			minutes !== +timeArr[1]
		) {
			// @i: the date object may not be "Invalid Date" but may be set to wrong date
			l.debug(
				`The date for "${daySynonym + ' / ' + time}" may be invalid. Date: `,
				adDate
			);
		}

		return adDate;
	}

	checkIfAdTooOld(parsedDate: Date, isTodayOrYesterday: boolean): boolean {
		// @i: now minus 24 hours with some padding (30s) for the program execution
		// @i: the padding also solves midnight dates.
		const oldestAllowedDate = globals.programStartTime - (DAY_MS + 1000 * 30);
		// @info: for "dziś/wczoraj" we got the ad's hour and min therefore we can determine if is older then 24h
		// @info: for other cases like "29 gru" the time will be 00:00, so some more hours will be included
		if (
			oldestAllowedDate >
			parsedDate.getTime() - (isTodayOrYesterday ? 0 : DAY_MS)
		) {
			// @i: time doesn't matter ad will not be included in results
			return true;
		}
		return false;
	}

	mapMonthPrefixToMonth(
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

	getUrlsToNextPages($page: cheerio.Root): string[] {
		const pageUrls: string[] = [];
		// @i: the first page does not have link
		const pagesCount = $page('div.pager.rel.clr').find(
			'a.block.br3.brc8.large.tdnone.lheight24'
		).length;
		// @i: olx just add &page=num to url so there is no need to read links from the elements
		// @i: pages starts from 1, skip first page
		for (let i = 2; i < pagesCount; i++) {
			pageUrls.push(config.urls[this.serviceName] + '&page=' + i);
		}
		l.debug(`${this.serviceName} pages number: ${pageUrls.length} + 1 (first page).`);

		return pageUrls;
	}
}
