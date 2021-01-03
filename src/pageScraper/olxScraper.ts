import { config } from '../config';
import { DAY_MS } from '../constants';
import l from '../logger';
import { SiteName, Announcement } from '../types';
import { ISiteScraperByHtml, ScraperDataType, SiteScraperDebugInfo } from './types';

export class OlxScraper implements ISiteScraperByHtml {
	_debugInfo: SiteScraperDebugInfo = {
		idx: -1,
		url: ''
	};
	serviceName: SiteName = 'olx';
	scrapperDataType = ScraperDataType.Html;

	getPageAds($page: cheerio.Root): [ads: Announcement[], isDone: boolean] {
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
	): [ads: Announcement[], isDone: boolean] {
		const announcements: Announcement[] = [];
		let isDone = false;
		for (let i = 0, len = $ads.length; i < len; i++) {
			const announcement = {} as Announcement;
			const $ad = $page($ads[i]);

			const [adTime, _isAddTooOld] = this.getAdTime($ad);
			isDone = _isAddTooOld;
			if (isDone === true) {
				break;
			}

			announcement.dt = adTime;
			const $titleLink = $ad.find('.title-cell a');
			announcement.title = $titleLink.text().replace(/[\n]/gi, '').trim();
			announcement.url = $titleLink.attr('href')!;
			let priceText = $ad.find('.td-price .price>strong').text();
			priceText = priceText.replace(/[^\d\.,]/gi, '').replace(/,/g, '.');
			if (isNaN(+priceText)) {
				l.debug(
					`[${this.serviceName}] Price "${priceText}" is not a number.`,
					announcement.url
				);
			}
			announcement.price = priceText;

			const imgUrl = $ad.find('.photo-cell > a > img').attr('src')!;
			announcement.imgUrl = imgUrl;

			// @i: there is no description in ad card, it would require to open details to gen desc.
			announcement.description = '';
			this._debugInfo.idx = i;
			announcement._debugInfo = { ...this._debugInfo };
			announcements.push(announcement);
		}

		return [announcements, isDone];
	}

	getAdTime($ad: cheerio.Cheerio): [adTime: string, isDone: boolean] {
		const scrapedDate = $ad
			.find('.bottom-cell .breadcrumb.x-normal>span > [data-icon*="clock"]')
			.parent()
			.text();
		const parsedDate = this.parseAdTime(scrapedDate);
		let adDate: string;

		if (typeof parsedDate === 'object') {
			let isTodayOrYesterday = /(dzisiaj|wczoraj)/.test(scrapedDate);

			if (this.checkIfAdTooOld(parsedDate, isTodayOrYesterday) === true) {
				return [scrapedDate, true];
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
		return [adDate, false];
	}

	parseAdTime(scrapedTime: string): string | Date {
		const scrapedTimeArr = scrapedTime.split(' ').filter((x) => x !== '');
		if (scrapedTimeArr.length > 2) {
			l.silly('1.	returning default time:', scrapedTime);
			return scrapedTime;
		}

		if (scrapedTimeArr[0] === 'dzisiaj' || scrapedTimeArr[0] === 'wczoraj') {
			return this.parseAdTimeWithTodayYesterdayWords(
				scrapedTimeArr[0],
				scrapedTimeArr[1]
			);
		}

		return this.parseAdDateWithMontPrefix(scrapedTimeArr[1], scrapedTimeArr[0]);
	}

	checkIfAdTooOld(parsedDate: Date, isTodayOrYesterday: boolean): boolean {
		// @i: now minus 24 hours with some padding (30s) for the program execution
		// @i: the padding also solves midnight dates.
		const oldestAllowedDate = Date.now() - (DAY_MS + 1000 * 30);
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

	getUrlsToNextPages($page: cheerio.Root): string[] {
		const pagesUrls: string[] = [];
		// @i: the first page does not have link
		const pagesCount = $page('div.pager.rel.clr').find(
			'a.block.br3.brc8.large.tdnone.lheight24'
		).length;
		// @i: olx just add &page=num to url so there is no need to read links from the elements
		// @i: pages starts from 1, skip first page
		for (let i = 2; i < pagesCount; i++) {
			pagesUrls.push(config.urls[this.serviceName] + '&page=' + i);
		}
		l.debug(
			`${this.serviceName} pages number: ${pagesUrls.length} + 1 (first page).`
		);

		return pagesUrls;
	}

	parseAdDateWithMontPrefix(monthPrefix: string, day: string): Date | string {
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
		const monthNum = this.mapMonthPrefixToMonth(monthPrefix, true) as number;
		if (monthNum === 11) {
			if (currentDate.getDate() < dayNum) {
				year = year - 1;
			}
		}

		const adDate = new Date(year, monthNum, dayNum);
		return adDate;
	}

	parseAdTimeWithTodayYesterdayWords(
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
}
