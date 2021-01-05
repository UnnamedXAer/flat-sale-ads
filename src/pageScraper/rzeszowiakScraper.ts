import { config } from '../config';
import { DAY_MS } from '../constants';
import l from '../logger';
import { SiteName, Announcement } from '../types';
import { ISiteScraperByHtml, ScraperDataType, SiteScraperDebugInfo } from './types';

export class RzeszowiakScraper implements ISiteScraperByHtml {
	_debugInfo: SiteScraperDebugInfo = { idx: -1, url: '' };
	serviceName: SiteName = 'rzeszowiak';
	scrapperDataType: ScraperDataType.Html = ScraperDataType.Html;

	getPageAds($page: cheerio.Root): [ads: Announcement[], isDone: boolean] {
		const $ads = $page('#content-center .normalbox');
		const [pageAds, isDone] = this.parsePageAds($page, $ads);
		return [pageAds, isDone];
	}

	parsePageAds(
		$page: cheerio.Root,
		$ads: cheerio.Cheerio
	): [ads: Announcement[], isDone: boolean] {
		const announcements: Announcement[] = [];
		let isDone = false;
		for (let i = 0, len = $ads.length; i < len; i++) {
			const $ad = $page($ads[i]);

			let [_dt, dt, _isAddTooOld] = this.getAdTime($ad);
			isDone = _isAddTooOld;
			if (isDone === true) {
				break;
			}

			const $titleLink = $ad.find('.normalbox-title-left a');
			const adTitle = $titleLink.text();
			const title = adTitle.slice(adTitle.indexOf('.') + 1).trim();

			const url = 'http://www.rzeszowiak.pl' + $titleLink.attr('href');

			let id = url.slice(url.lastIndexOf('-') + 1);
			if (/\d/.test(id) === false) {
				id = '';
			}

			let priceText = $ad.find('.normalbox-title-left2 strong').text();
			let price = priceText.replace(/[^\d\.,]/gi, '');
			if (price !== +price + '') {
				l.debug(`[Rzeszowiak] Price "${price}" is not a number.`, url);
			}

			const imgUrl =
				'http://www.rzeszowiak.pl' +
				$ad.find('.normalbox-body-left img').attr('src')!;

			const description = $ad.find('.normalbox-body .normalbox-body-right').text().trim();

			const announcement: Announcement = {
				id,
				dt,
				_dt,
				description,
				imgUrl,
				price,
				title,
				url,
				_debugInfo: { ...this._debugInfo, idx: i }
			};
			announcements.push(announcement);
		}
		return [announcements, isDone];
	}

	getAdTime(
		$ad: cheerio.Cheerio
	): [adDateText: Date, adDateText: string, isDone: boolean] {
		const scrapedDate = $ad.find('.normalbox-more .dodane b').text();
		const parsedDate: Date = this.parseAdTime(scrapedDate);
		let adDateText: string = scrapedDate;

		if (isFinite(parsedDate.getTime()) === true) {
			adDateText = parsedDate.toLocaleString(...config.dateTimeFormatParams);
			if (this.checkIfAdTooOld(parsedDate)) {
				return [parsedDate, adDateText, true];
			}
		}
		return [parsedDate, adDateText, false];
	}

	parseAdTime(scrapedTime: string): Date {
		if (scrapedTime.includes('dziś')) {
			return this.parseAdTimeWithTodayWord(scrapedTime);
		}
		const date = new Date(scrapedTime);
		return date;
	}

	parseAdTimeWithTodayWord(scrapedTime: string): Date {
		const timeArr = scrapedTime.split(',').map((x) => x.trim());
		if (timeArr.length < 2) {
			const date = new Date(scrapedTime);
			l.silly(
				`[${this.serviceName}] "${scrapedTime}" is in unsupported date format. To date resolvers to:`,
				date
			);
			// @i: most likely 'Invalid Date',
			// @i: maybe would be better to return "Invalid Date" explicitly to avoid strange results
			return date;
		}
		const [hour, minute] = timeArr[1].split(':').map((x) => x.trim());
		const date = new Date();
		date.setHours(parseInt(hour, 10), parseInt(minute, 10));
		return date;
	}

	checkIfAdTooOld(parsedDate: Date): boolean {
		const oldestAllowedDate = Date.now() - (DAY_MS + 1000 * 30);
		const isTooOld = oldestAllowedDate > parsedDate.getTime();
		return isTooOld;
	}

	getUrlsToNextPages($page: cheerio.Root): string[] {
		const pagesUrls: string[] = [];
		const pagesInfo = $page('#oDn > #oDnns').text();
		const pagesCount = +pagesInfo.split(' z ')[1].trim();

		const baseUrl = config.urls.rzeszowiak;

		const staticUrlParts = baseUrl.split(/\d{10,}/);
		const searchNumbers = baseUrl.slice(
			staticUrlParts[0].length,
			baseUrl.indexOf(staticUrlParts[1])
		);
		const staticSearchNumbersParts = [
			searchNumbers.slice(0, 4),
			searchNumbers.slice(6)
		];

		for (let i = 2; i <= pagesCount; i++) {
			pagesUrls.push(
				staticUrlParts[0] +
					staticSearchNumbersParts[0] +
					(i < 10 ? '0' + i : i) +
					staticSearchNumbersParts[1] +
					staticUrlParts[1]
			);
		}

		l.debug(
			`${this.serviceName} pages number: ${pagesUrls.length} + 1 (first page).`
		);

		return pagesUrls;
	}
}
