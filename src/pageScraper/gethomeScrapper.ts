import { url } from 'inspector';
import { Page } from 'puppeteer';
import { config } from '../config';
import { DAY_MS } from '../constants';
import l from '../logger';
import { SiteName, Announcement } from '../types';
import { ISiteScraperByObject, ScraperDataType, SiteScraperDebugInfo } from './types';

// export class GethomeScraper implements ISiteScraperHtml {
// 	_debugInfo: SiteScraperDebugInfo = {
// 		idx: -1,
// 		url: ''
// 	};
// 	serviceName: SiteName = 'gethome';
// 	getPageAds($page: cheerio.Root): [ads: Announcement[], isDone: boolean] {
// 		const $ads = $page('.css-gidrht > div > a');
// 		const [pageAds, isDone] = this.parsePageAds($page, $ads);
// 		return [pageAds, isDone];
// 	}
// 	parsePageAds(
// 		$page: cheerio.Root,
// 		$ads: cheerio.Cheerio
// 	): [ads: Announcement[], isDone: boolean] {
// 		const announcements: Announcement[] = [];
// 		let isDone = false;
// 		for (let i = 0, len = $ads.length; i < len; i++) {
// 			const announcement = {} as Announcement;

// 			const $ad = $page($ads[i]);
// 			const ad = $ad[0] as cheerio.TagElement;
// 			if (ad.attribs!.class.includes('OfferBoxWrapper') === false) {
// 				// @i: classes are dynamic and look like : "css-1our9ed-offerBoxWrapper"
// 				// @i: therefore we cannot use it to get $ads, and this check should filter unwanted elements
// 				continue;
// 			}

// 			const attribs = (ad as cheerio.TagElement).attribs;
// 			announcement.url = 'https://gethome.pl' + attribs.href;

// 			const idIdx = attribs.href.lastIndexOf('-');
// 			const id = attribs.href.slice(idIdx + 1, attribs.href.length - 1);
// 			announcement.id = id;

// 			const title = attribs.href.slice('/oferta/'.length, idIdx);
// 			announcement.title = title.replace(/-/g, ' ').replace('m2', 'm²');

// 			let [adDate, _isAddTooOld] = this.getAdTime($ad);
// 			// isDone = _isAddTooOld;
// 			// if (isDone === true) {
// 			// 	break;
// 			// }
// 			announcement.dt = adDate;
// 			let description = '';

// 			const addElements = ad.childNodes as cheerio.TagElement[];
// 			const elementWithAdImg = (addElements[2]
// 				.childNodes as cheerio.TagElement[])[1]
// 				.childNodes![0] as cheerio.TagElement;
// 			// get img url

// 			const detailsElements = addElements[3];

// 			/*
// 				detailsElements :
// 				[0]
// 				[1][0][0][...] - price
// 				[1][0][1][...] - price/m²
// 				[2][0][0] - location
// 				*/

// 			const pricePerSqrText = ((detailsElements.childNodes as cheerio.TagElement[])[1]
// 				.childNodes as cheerio.TagElement[])[1]
// 				.childNodes!.map((textEl) => {
// 					if (textEl.type === 'text') {
// 						const text = textEl.data!.trim();
// 						if (text.length === 0) {
// 							return '';
// 						}
// 						return textEl.data!.trim() + ' ';
// 					}
// 					return '';
// 				})
// 				.join('');
// 			description += pricePerSqrText.trim() + '²';

// 			const roomsCnt = (((detailsElements.childNodes as cheerio.TagElement[])[0]
// 				.childNodes as cheerio.TagElement[])[1]
// 				.childNodes as cheerio.TagElement[])[0].childNodes![0].data;

// 			const apartmentSize =
// 				(((detailsElements.childNodes as cheerio.TagElement[])[0]
// 					.childNodes as cheerio.TagElement[])[1]
// 					.childNodes as cheerio.TagElement[])[1]
// 					.childNodes!.map((node) => {
// 						if (node.type === 'text') {
// 							const text = node.data!.trim();
// 							if (text.length === 0) {
// 								return '';
// 							}
// 							return node.data!.trim() + ' ';
// 						}
// 						return '';
// 					})
// 					.join('') + '²';

// 			description += '\n' + apartmentSize;
// 			description += '\n' + roomsCnt;

// 			const priceText = ((detailsElements.childNodes as cheerio.TagElement[])[1]
// 				.childNodes as cheerio.TagElement[])[0].childNodes![0].data!.replace(
// 				/[^\d\.,]/gi,
// 				''
// 			);
// 			if (priceText !== +priceText + '') {
// 				l.debug(
// 					`[${this.serviceName}] Price "${priceText}" is not a number.`,
// 					announcement.url
// 				);
// 			}
// 			announcement.price = priceText;

// 			const adLocation = (((detailsElements.childNodes as cheerio.TagElement[])[2]
// 				.childNodes as cheerio.TagElement[])[0]!
// 				.childNodes as cheerio.TagElement[])[0]!.data!.trim();

// 			description += '\n' + adLocation;

// 			announcement.description = description;
// 			this._debugInfo.idx = i;
// 			announcement._debugInfo = { ...this._debugInfo };
// 			announcements.push(announcement);
// 		}
// 		return [announcements, isDone];
// 	}

// 	getAdTime($ad: cheerio.Cheerio): [adTime: string, isDone: boolean] {
// 		// @ i: not date in ads
// 		const currentDate = new Date();
// 		return [
// 			`~ ${new Date(currentDate.getTime() - 3 * DAY_MS).toLocaleString(
// 				...config.dateTimeFormatParams
// 			)} - ~${currentDate.toLocaleString(...config.dateTimeFormatParams)}`,
// 			false
// 		];
// 	}
// 	parseAdTime(scrapedTime: string): string | Date {
// 		return scrapedTime;
// 	}
// 	checkIfAdTooOld(adDate: Date, ...args: any[]): boolean {
// 		// @ i: not date in ads
// 		return false;
// 	}
// 	getUrlsToNextPages($page: cheerio.Root): string[] {
// 		const pagesUrls: string[] = [];
// 		const pagesLinkElements = $page('div>nav>ul>li>a');
// 		l.silly(pagesLinkElements.parent);
// 		// if (!parent.class.includes('PaginationNumbersHolder')){ throw 'not links'}
// 		const listItemsCount = pagesLinkElements.length;

// 		let greatestPagesNumber = 0;
// 		for (let i = 0; i < listItemsCount; i++) {
// 			const elementText = ((pagesLinkElements[i] as cheerio.TagElement)
// 				.firstChild as cheerio.TagElement).firstChild?.data?.trim();
// 			if (!elementText) {
// 				continue;
// 			}
// 			const pageNum = parseInt(elementText, 10);
// 			if (isNaN(pageNum) || pageNum + '' !== elementText) {
// 				continue;
// 			}
// 			if (greatestPagesNumber < pageNum) {
// 				greatestPagesNumber = pageNum;
// 			}
// 		}
// 		const serviceUrl = config.urls[this.serviceName];
// 		for (let i = 1; i < greatestPagesNumber; ) {
// 			const pageUrl = serviceUrl + '&page=' + ++i;
// 			pagesUrls.push(pageUrl);
// 		}
// 		l.debug(
// 			`${this.serviceName} pages number: ${pagesUrls.length} + 1 (first page).`
// 		);

// 		return pagesUrls;
// 	}
// }

interface GethomeAdsInfo {
	ads: Announcement[];
	pageNum: number;
	pageCount: number;
	isDone: boolean;
}

interface GethomeData {
	offerList: {
		offers: {
			offers: GethomeOffer[];
			page: number;
			pageCount: number;
		};
		[key: string]: any;
	};
	[key: string]: any;
}

interface GethomeOffer {
	id: string;
	agent: { id: string; name: string; last_name: string; phone_number: string };
	agency: Object | null;
	created_at: string;
	deal_type: string;
	market_type: string;
	property: {
		location: Object;
		address: string;
		floor: number;
		id: string;
		plan_img: any;
		room_number: number;
		size: number;
		type: string | 'apartment';
	};
	price: {
		old: number | null;
		per_month: null | number;
		per_sqm: number;
		total: number;
	};
	description: string;
	link: string;
	images: {
		link: string;
		thumbnail_306x171: string;
		thumbnail_612x342: string;
	}[];
	slug: string;
	investment: any;
	coordinates: { lat: number; lng: number; type: string | 'point' };
	name: string;
}

export class GethomeScraper implements ISiteScraperByObject {
	_debugInfo: SiteScraperDebugInfo = {
		idx: -1,
		url: ''
	};
	scrapperDataType: ScraperDataType.Object = ScraperDataType.Object;
	serviceName: SiteName = 'gethome';
	info = {
		pageCount: 1
	};

	async getPageAds(page: Page): Promise<[ads: Announcement[], isDone: boolean]> {
		const now = Date.now();
		const adsInfo = await this.getPageAdsInfo(page);
		this.info.pageCount = adsInfo.pageCount;

		return [adsInfo.ads, adsInfo.isDone];
	}

	async getPageDataObject(page: Page): Promise<GethomeData['offerList']> {
		const data: GethomeData = await page.evaluate(
			() => (window as any).__INITIAL_STATE__
		);
		return data.offerList;
	}

	async getPageAdsInfo(page: Page): Promise<GethomeAdsInfo> {
		const offerList = await this.getPageDataObject(page);
		const { offers: offersInfo } = offerList;
		const { offers } = offersInfo;

		const now = Date.now();
		// @todo: use link from offers
		const [announcements, isDone] = this.parsePageAds(offers, page.url());
		l.info(
			`[${this.serviceName}]->parsePageAds execution time: ${Date.now() - now} ms.`
		);

		const adsInfo: GethomeAdsInfo = {
			ads: announcements,
			pageNum: offersInfo.page,
			pageCount: offersInfo.pageCount,
			isDone: isDone
		} as GethomeAdsInfo;

		return adsInfo;
	}

	parsePageAds(
		offers: GethomeOffer[],
		pageUrl: string
	): [ads: Announcement[], isDone: boolean] {
		const announcements: Announcement[] = [];
		let isDone = false;
		for (let i = 0, offersCount = offers.length; i < offersCount; i++) {
			const offer = offers[i];
			const [dt, _isDone] = this.getAdTime(offer.created_at);
			if (_isDone === true) {
				isDone = true;
				break;
			}
			const announcement: Announcement = {
				dt,
				description:
					(offer.price.per_sqm ? offer.price.per_sqm + 'm2' : '') +
					'\nRozmiar: ' +
					offer.property.size +
					'\n' +
					offer.property.location +
					'\n' +
					offer.property.address +
					(offer.property.floor ? '\nPiętro: ' + offer.property.floor : '') +
					(offer.property.room_number
						? '\nPokoje: ' + offer.property.room_number
						: '') +
					'\n\n' +
					(offer.agent
						? '\nAgent: ' + offer.agent.name + ' ' + offer.agent.last_name
						: '') +
					(offer.market_type
						? '\nRynek: ' +
						  (offer.market_type === 'aftermarket' ? 'wtórny' : 'pierwotny')
						: '') + // @todo: check all market_type options.
					offer.description,
				title: offer.name,
				url: 'https://gethome.pl/oferta/' + offer.slug,
				imgUrl: offer.images[0].thumbnail_306x171,
				price: this.getAdPrice(offer.price.total),
				id: offer.id,
				_debugInfo: {
					idx: i,
					url: pageUrl
				}
			};
			announcements.push(announcement);
		}
		return [announcements, isDone];
	}

	getAdTime(offerTime: string): [adTime: string, isDone: boolean] {
		const adDate = this.parseAdTime(offerTime);
		const formattedDate = adDate.toLocaleString(...config.dateTimeFormatParams);
		const isDone = this.checkIfAdTooOld(adDate);
		return [formattedDate, isDone];
	}

	parseAdTime(offerTime: string): Date {
		const adDate = new Date(offerTime);
		return adDate;
	}

	getAdPrice(offerPrice: number): string {
		return '' + offerPrice;
	}

	getUrlsToNextPages(baseUrl: string): string[] {
		const pageUrls: string[] = [];

		for (let i = 2; i <= this.info.pageCount; i++) {
			pageUrls.push(baseUrl + '&page=' + i);
		}

		l.debug(
			`${this.serviceName} pages number: ${pageUrls.length} + 1 (first page).`
		);
		return pageUrls;
	}

	checkIfAdTooOld(adDate: Date): boolean {
		return adDate.getTime() < Date.now() - (1 * DAY_MS + 1000 * 30);
	}
}
