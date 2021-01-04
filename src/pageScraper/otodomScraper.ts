import { config } from '../config';
import { DAY_MS } from '../constants';
import l from '../logger';
import { SiteName, Announcement } from '../types';
import { ISiteScraperByHtml, ScraperDataType, SiteScraperDebugInfo } from './types';

export class OtodomScraper implements ISiteScraperByHtml {
	_debugInfo: SiteScraperDebugInfo = {
		idx: -1,
		url: ''
	};
	serviceName: SiteName = 'otodom';
	scrapperDataType = ScraperDataType.Html;
	
	getPageAds($page: cheerio.Root): [ads: Announcement[], isDone: boolean] {
		const $ads = $page('.col-md-content.section-listing__row-content').find(
			'article.offer-item'
		);
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
			const attribs = ($ad[0] as cheerio.TagElement).attribs;
			if (attribs['data-featured-name'] === 'promo_top_ads') {
				continue;
			}
			let [adDate, _isAddTooOld] = this.getAdTime($ad);
			// isDone = _isAddTooOld;
			// if (isDone === true) {
			// 	break;
			// }
			announcement.dt = adDate;
			// @todo: search for better id
			announcement.id = attribs['data-item-id'];
			announcement.url = attribs['data-url'];
			const $adDetails = $ad.find('.offer-item-details');

			const $adTitle = $adDetails.find('H3 .offer-item-title');
			announcement.title = $adTitle.text().trim();

			const imgAttribs = ($ad.find(
				'figure > a > span.img-cover.lazy'
			)[0] as cheerio.TagElement).attribs;
			announcement.imgUrl = imgAttribs['data-src'];
			let description =
				($adDetails.find('header > p.text-nowrap')[0] as cheerio.TagElement)
					.childNodes![1].data || '';

			const $adParams = $adDetails.find('ul.params li');

			$adParams.map((_, el) => {
				if (el.type === 'text') {
					return;
					// do nothing
				} else if (el.attribs.class.includes('offer-item-price-per-m')) {
					description =
						el.firstChild!.data!.trim() +
						(description.length > 0 ? '\n' : '') +
						description;
				} else if (el.attribs.class.includes('offer-item-price')) {
					let priceText = el.firstChild!.data!;
					priceText = priceText.replace(/[^\d\.,]/gi, '');
					if (priceText !== +priceText + '') {
						l.debug(
							`[${this.serviceName}] Price "${priceText}" is not a number.`,
							announcement.url
						);
					}
					announcement.price = priceText;
				} else {
					description +=
						(description.length > 0 ? '\n' : '') +
						el.firstChild!.data!.trim();
				}
			});

			announcement.description = description;
			this._debugInfo.idx = i;
			announcement._debugInfo = { ...this._debugInfo };
			announcements.push(announcement);
		}
		return [announcements, isDone];
	}

	getAdTime($ad: cheerio.Cheerio): [adTime: string, isDone: boolean] {
		// @ i: not date in ads
		const currentDate = new Date();
		return [
			`~${new Date(currentDate.getTime() - 3 * DAY_MS).toLocaleString(
				...config.dateTimeFormatParams
			)} - ~${currentDate.toLocaleString(...config.dateTimeFormatParams)}`,
			false
		];
	}
	parseAdTime(scrapedTime: string): string | Date {
		return scrapedTime;
	}
	checkIfAdTooOld(adDate: Date, ...args: any[]): boolean {
		// @ i: not date in ads
		return false;
	}
	getUrlsToNextPages($page: cheerio.Root): string[] {
		// @improvement: there is an window.dataLayer object with information about the pages count.

		const pagesUrls: string[] = [];
		const pageList = $page('.after-offers.clearfix .pager');
		const pagesLinkElements = pageList.find('li > a');
		const listItemsCount = pagesLinkElements.length;

		let greatestPagesNumber = 0;
		for (let i = 0; i < listItemsCount; i++) {
			const elementText = (pagesLinkElements[
				i
			] as cheerio.TagElement).firstChild?.data?.trim();
			if (!elementText) {
				continue;
			}
			const pageNum = parseInt(elementText, 10);
			if (isNaN(pageNum) || pageNum + '' !== elementText) {
				continue;
			}
			if (greatestPagesNumber < pageNum) {
				greatestPagesNumber = pageNum;
			}
		}
		const serviceUrl = config.urls[this.serviceName];
		for (let i = 1; i < greatestPagesNumber; ) {
			const pageUrl = serviceUrl + '&page=' + ++i;
			pagesUrls.push(pageUrl);
		}
		l.debug(
			`${this.serviceName} pages number: ${pagesUrls.length} + 1 (first page).`
		);

		return pagesUrls;
	}
}
