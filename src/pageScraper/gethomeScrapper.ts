import { config } from '../config';
import { DAY_MS } from '../constants';
import l from '../logger';
import { SiteName, Announcement } from '../types';
import { ISiteScraper, SiteScraperDebugInfo } from './types';

export class GethomeScraper implements ISiteScraper {
	_debugInfo: SiteScraperDebugInfo = {
		idx: -1,
		url: ''
	};
	serviceName: SiteName = 'gethome';
	getPageAds($page: cheerio.Root): [ads: Announcement[], isDone: boolean] {
		const $ads = $page('.css-gidrht > div > a');
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
			const ad = $ad[0] as cheerio.TagElement;
			if (ad.attribs!.class.includes('OfferBoxWrapper') === false) {
				// @i: classes are dynamic and look like : "css-1our9ed-offerBoxWrapper"
				// @i: therefore we cannot use it to get $ads, and this check should filter unwanted elements
				continue;
			}

			const attribs = (ad as cheerio.TagElement).attribs;
			announcement.url = 'https://gethome.pl' + attribs.href;

			const idIdx = attribs.href.lastIndexOf('-');
			const id = attribs.href.slice(idIdx + 1, attribs.href.length - 1);
			announcement.id = id;

			const title = attribs.href.slice('/oferta/'.length, idIdx);
			announcement.title = title.replace(/-/g, ' ').replace('m2', 'm²');

			let [adDate, _isAddTooOld] = this.getAdTime($ad);
			// isDone = _isAddTooOld;
			// if (isDone === true) {
			// 	break;
			// }
			announcement.dt = adDate;
			let description = '';

			const addElements = ad.childNodes as cheerio.TagElement[];
			const elementWithAdImg = (addElements[2]
				.childNodes as cheerio.TagElement[])[1]
				.childNodes![0] as cheerio.TagElement;
			// get img url

			const detailsElements = addElements[3];

			/*
				detailsElements :
				[0]
				[1][0][0][...] - price
				[1][0][1][...] - price/m²
				[2][0][0] - location
				*/

			const pricePerSqrText = ((detailsElements.childNodes as cheerio.TagElement[])[1]
				.childNodes as cheerio.TagElement[])[1]
				.childNodes!.map((textEl) => {
					if (textEl.type === 'text') {
						const text = textEl.data!.trim();
						if (text.length === 0) {
							return '';
						}
						return textEl.data!.trim() + ' ';
					}
					return '';
				})
				.join('');
			description += pricePerSqrText.trim() + '²';

			const roomsCnt = (((detailsElements.childNodes as cheerio.TagElement[])[0]
				.childNodes as cheerio.TagElement[])[1]
				.childNodes as cheerio.TagElement[])[0].childNodes![0].data;

			const apartmentSize =
				(((detailsElements.childNodes as cheerio.TagElement[])[0]
					.childNodes as cheerio.TagElement[])[1]
					.childNodes as cheerio.TagElement[])[1]
					.childNodes!.map((node) => {
						if (node.type === 'text') {
							const text = node.data!.trim();
							if (text.length === 0) {
								return '';
							}
							return node.data!.trim() + ' ';
						}
						return '';
					})
					.join('') + '²';

			description += '\n' + apartmentSize;
			description += '\n' + roomsCnt;

			const priceText = ((detailsElements.childNodes as cheerio.TagElement[])[1]
				.childNodes as cheerio.TagElement[])[0].childNodes![0].data!.replace(
				/[^\d\.,]/gi,
				''
			);
			if (priceText !== +priceText + '') {
				l.debug(
					`[${this.serviceName}] Price "${priceText}" is not a number.`,
					announcement.url
				);
			}
			announcement.price = priceText;

			const adLocation = (((detailsElements.childNodes as cheerio.TagElement[])[2]
				.childNodes as cheerio.TagElement[])[0]!
				.childNodes as cheerio.TagElement[])[0]!.data!.trim();

			description += '\n' + adLocation;

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
			`~ ${new Date(currentDate.getTime() - 3 * DAY_MS).toLocaleString(
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
		const pagesUrls: string[] = [];
		const pagesLinkElements = $page('div>nav>ul>li>a');
		l.silly(pagesLinkElements.parent);
		// if (!parent.class.includes('PaginationNumbersHolder')){ throw 'not links'}
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
