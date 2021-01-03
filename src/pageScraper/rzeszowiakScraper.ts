import { config } from '../config';
import { DAY_MS } from '../constants';
import l from '../logger';
import { SiteName, Announcement } from '../types';
import { ISiteScraper, SiteScraperDebugInfo } from './types';

export class RzeszowiakScraper implements ISiteScraper {
	_debugInfo: SiteScraperDebugInfo = { idx: -1, url: '' };
	serviceName: SiteName = 'rzeszowiak';

	getPageAds($page: cheerio.Root): [ads: Announcement[], isDone: boolean] {
		const $ads = $page('.content-center .normalbox');
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
			const announcement = {} as Announcement;
			const $ad = $page($ads[i]);

			let [adDate, _isAddTooOld] = this.getAdTime($ad);
			isDone = _isAddTooOld;
			if (isDone === true) {
				break;
			}
			announcement.dt = adDate;

			const $titleLink = $ad.find('.offer-item-title');
			// @todo: remove index
			announcement.title = $titleLink.text().trim();
			announcement.url = $titleLink.attr('href')!;
			let priceText = $ad.find('.normalbox-title-left2 strong').text();
			priceText = priceText.replace(/[^\d\.,]/gi, '');
			if (priceText !== +priceText + '') {
				l.debug(
					`[Rzeszowiak] Price "${priceText}" is not a number.`,
					announcement.url
				);
			}
			announcement.price = priceText;

			const imgUrl = $ad.find('.normalbox-body-left img').attr('src')!;
			announcement.imgUrl = imgUrl;

			const description = $ad.find('.normalbox-body .normalbox-body-right').text();
			announcement.description = description;
			this._debugInfo.idx = i;
			announcement._debugInfo = { ...this._debugInfo };
			announcements.push(announcement);
		}
		return [announcements, isDone];
	}
	getAdTime($ad: cheerio.Cheerio): [adTime: string, isDone: boolean] {
		const scrapedDate = $ad.find('.normalbox-more .dodane b').text();
		const parsedDate = this.parseAdTime(scrapedDate);
		let adDate: string;

		if (typeof parsedDate === 'object') {
			if (this.checkIfAdTooOld(parsedDate)) {
				return [scrapedDate, true];
			}
			adDate = parsedDate.toLocaleString(...config.dateTimeFormatParams);
		} else {
			adDate = parsedDate;
		}
		return [adDate, false];
	}

	parseAdTime(scrapedTime: string): string | Date {
		if (scrapedTime.includes('dziś')) {
			return this.parseAdTimeWithTodayWord(scrapedTime);
		}
		const date = new Date(scrapedTime);
		return isFinite(date.getTime()) ? date : scrapedTime;
	}

	checkIfAdTooOld(parsedDate: Date): boolean {
		const oldestAllowedDate = Date.now() - (DAY_MS + 1000 * 30);
		const isTooOld = oldestAllowedDate > parsedDate.getTime();
		return isTooOld;
	}

	parseAdTimeWithTodayWord(scrapedTime: string): Date | string {
		const timeArr = scrapedTime.split(',').map((x) => x.trim());
		if (timeArr.length < 2) {
			l.silly(`[${this.serviceName}] Returning default time: "${scrapedTime}"`);
			return scrapedTime;
		}
		const [hour, minute] = timeArr[1].split(':').map((x) => x.trim());
		const date = new Date();
		date.setHours(parseInt(hour, 10), parseInt(minute, 10));
		return isFinite(date.getTime()) ? date : scrapedTime;
	}

	getUrlsToNextPages($page: cheerio.Root): string[] {
		const pagesUrls: string[] = [];
		const pagesLinkElements = $page('a.oDnn');
		const pagesCount = pagesLinkElements.length;

		for (let i = 0; i < pagesCount; i++) {
			const attr =
				'http://www.rzeszowiak.pl' +
				(pagesLinkElements[i] as cheerio.TagElement).attribs['href'];
			pagesUrls.push(attr);
		}

		l.debug(
			`${this.serviceName} pages number: ${pagesUrls.length} + 1 (first page).`
		);

		return pagesUrls;
	}
}
