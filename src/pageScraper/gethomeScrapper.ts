import { Page } from 'puppeteer';
import { config } from '../config';
import { DAY_MS } from '../constants';
import globals from '../globals';
import l from '../logger';
import { SiteName, IOffer } from '../types';
import { ISiteScraperByObject, ScraperDataType, SiteScraperDebugInfo } from './types';

// export class GethomeScraper implements ISiteScraperHtml {
// 	_debugInfo: SiteScraperDebugInfo = {
// 		idx: -1,
// 		url: ''
// 	};
// 	serviceName: SiteName = 'gethome';
// 	getPageAds($page: cheerio.Root): [ads: Offer[], isDone: boolean] {
// 		const $ads = $page('.css-gidrht > div > a');
// 		const [pageAds, isDone] = this.parsePageAds($page, $ads);
// 		return [pageAds, isDone];
// 	}
// 	parsePageAds(
// 		$page: cheerio.Root,
// 		$ads: cheerio.Cheerio
// 	): [ads: Offer[], isDone: boolean] {
// 		const offers: Offer[] = [];
// 		let isDone = false;
// 		for (let i = 0, len = $ads.length; i < len; i++) {
// 			const offer = {} as Offer;

// 			const $ad = $page($ads[i]);
// 			const ad = $ad[0] as cheerio.TagElement;
// 			if (ad.attribs!.class.includes('OfferBoxWrapper') === false) {
// 				// @i: classes are dynamic and look like : "css-1our9ed-offerBoxWrapper"
// 				// @i: therefore we cannot use it to get $ads, and this check should filter unwanted elements
// 				continue;
// 			}

// 			const attribs = (ad as cheerio.TagElement).attribs;
// 			offer.url = 'https://gethome.pl' + attribs.href;

// 			const idIdx = attribs.href.lastIndexOf('-');
// 			const id = attribs.href.slice(idIdx + 1, attribs.href.length - 1);
// 			offer.id = id;

// 			const title = attribs.href.slice('/oferta/'.length, idIdx);
// 			offer.title = title.replace(/-/g, ' ').replace('m2', 'm²');

// 			let [adDate, _isAddTooOld] = this.getAdTime($ad);
// 			// isDone = _isAddTooOld;
// 			// if (isDone === true) {
// 			// 	break;
// 			// }
// 			offer.dt = adDate;
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
// 					offer.url
// 				);
// 			}
// 			offer.price = priceText;

// 			const adLocation = (((detailsElements.childNodes as cheerio.TagElement[])[2]
// 				.childNodes as cheerio.TagElement[])[0]!
// 				.childNodes as cheerio.TagElement[])[0]!.data!.trim();

// 			description += '\n' + adLocation;

// 			offer.description = description;
// 			this._debugInfo.idx = i;
// 			offer._debugInfo = { ...this._debugInfo };
// 			offers.push(offer);
// 		}
// 		return [offers, isDone];
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

interface GethomeOffersInfo {
  offers: IOffer[];
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
  offer_type: string[];
  property: {
    location: {
      path: {
        name: string;
        slug: string;
        type: string;
      }[];
      short_name: 'string';
    };
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
  description?: string;
  link: string;
  pictures: {
    o_img_306x171: string;
    o_img_360x171: string;
    o_img_414x171: string;
    o_img_500: string;
    o_img_639x171: string;
    o_img_800: string;
  }[];
  slug: string;
  investment: any;
  coordinates: { lat: number; lng: number; type?: string | 'point' };
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

  async getPageAds(page: Page): Promise<[ads: IOffer[], isDone: boolean]> {
    const adsInfo = await this.getPageAdsInfo(page);
    this.info.pageCount = adsInfo.pageCount;

    return [adsInfo.offers, adsInfo.isDone];
  }

  async getPageDataObject(page: Page): Promise<GethomeData['offerList']> {
    const data: GethomeData = await page.evaluate(
      () => (window as any).__INITIAL_STATE__
    );
    return data.offerList;
  }

  async getPageAdsInfo(page: Page): Promise<GethomeOffersInfo> {
    const offerList = await this.getPageDataObject(page);
    const { offers: offersInfo } = offerList;
    const { offers: offersData } = offersInfo;

    const now = Date.now();
    // @todo: use link from offers
    const [siteOffers, isDone] = this.parsePageAds(offersData, page.url());
    l.info(`[${this.serviceName}]->parsePageAds execution time: ${Date.now() - now} ms.`);

    const adsInfo: GethomeOffersInfo = {
      offers: siteOffers,
      pageNum: offersInfo.page,
      pageCount: offersInfo.pageCount,
      isDone: isDone
    } as GethomeOffersInfo;

    return adsInfo;
  }

  parsePageAds(
    offersData: GethomeOffer[],
    pageUrl: string
  ): [ads: IOffer[], isDone: boolean] {
    const offers: IOffer[] = [];
    let isDone = false;
    for (let i = 0, offersCount = offersData.length; i < offersCount; i++) {
      const offer = offersData[i];
      const [dt_, dt, _isDone] = this.getAdTime(offer.created_at);
      if (_isDone === true) {
        isDone = true;
        break;
      }

      // @improvement: find "stan wykończenia" in offer data.
      const description =
        (Number.isFinite(offer.price.per_sqm)
          ? 'Powierzchnia: ' + offer.price.per_sqm + 'm2'
          : '') +
        '\nRozmiar: ' +
        offer.property.size +
        '\nLokalizacja: ' +
        (offer.property.address
          ? offer.property.address.trim()
          : offer.property.location.short_name.trim()) +
        '\n' +
        (Number.isFinite(offer.property.floor)
          ? '\nPiętro: ' + offer.property.floor
          : '') +
        (Number.isFinite(offer.property.room_number)
          ? '\nPokoje: ' + offer.property.room_number
          : '') +
        '\n\n' +
        '\nOpis:\n' +
        (offer.description ? offer.description.trim() : '<empty>') +
        (offer.agent
          ? '\n\nAgent: ' + offer.agent.name.trim() + ' ' + offer.agent.last_name.trim()
          : '') +
        (offer.market_type.trim()
          ? '\nRynek: ' +
            (offer.market_type.trim() === 'aftermarket' ? 'wtórny' : 'pierwotny')
          : ''); // @todo: check all market_type options.

      const title = offer.name.trim();
      const url = 'https://gethome.pl/oferta/' + offer.slug;
      const imgUrl = offer.pictures[0].o_img_306x171;
      const price = this.getAdPrice(offer.price.total);
      const id = offer.id;

      const siteOffer: IOffer = {
        site: 'gethome',
        dt_: dt_,
        dt,
        scrapedAt: new Date(globals.programStartTime),
        title,
        price,
        offerId: id,
        url,
        description,
        imgUrl
      };
      offers.push(siteOffer);
    }
    return [offers, isDone];
  }

  getAdTime(offerTime: string): [adDate: Date, adDateText: string, isDone: boolean] {
    const adDate = this.parseAdTime(offerTime);
    const formattedDate = adDate.toLocaleString(...config.dateTimeFormatParams);
    const isDone = this.checkIfAdTooOld(adDate);
    return [adDate, formattedDate, isDone];
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

    l.debug(`${this.serviceName} pages number: ${pageUrls.length} + 1 (first page).`);
    return pageUrls;
  }

  checkIfAdTooOld(adDate: Date): boolean {
    return adDate.getTime() < globals.programStartTime - 1 * DAY_MS;
  }
}
