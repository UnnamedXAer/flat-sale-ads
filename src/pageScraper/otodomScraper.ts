import { config } from '../config';
import { DAY_MS } from '../constants';
import globals from '../globals';
import l from '../logger';
import { SiteName, IOffer } from '../types';
import { ISiteScraperByHtml, ScraperDataType, SiteScraperDebugInfo } from './types';

export class OtodomScraper implements ISiteScraperByHtml {
	_debugInfo: SiteScraperDebugInfo = {
		idx: -1,
		url: ''
	};
	serviceName: SiteName = 'otodom';
	scrapperDataType: ScraperDataType.Html = ScraperDataType.Html;

	getPageAds($page: cheerio.Root): [ads: IOffer[], isDone: boolean] {
		const $ads = $page('.col-md-content.section-listing__row-content').find(
			'article.offer-item'
		);
		const [pageAds, isDone] = this.parsePageAds($page, $ads);
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
			const attribs = ($ad[0] as cheerio.TagElement).attribs;
			if (attribs['data-featured-name'] === 'promo_top_ads') {
				continue;
			}
			let [_dt, dt, _isAddTooOld] = this.getAdTime($ad);
			// isDone = _isAddTooOld;
			// if (isDone === true) {
			// 	break;
			// }
			// @todo: search for better id
			const id = attribs['data-item-id'];
			const url = attribs['data-url'];
			const $adDetails = $ad.find('.offer-item-details');

			const $adTitle = $adDetails.find('H3 .offer-item-title');
			const title = $adTitle.text().trim();

			const imgAttribs = ($ad.find(
				'figure > a > span.img-cover.lazy'
			)[0] as cheerio.TagElement).attribs;
			const imgUrl = imgAttribs['data-src'];
			let description = (
				($adDetails.find('header > p.text-nowrap')[0] as cheerio.TagElement)
					.childNodes![1].data || ''
			).trim();

			const $adParams = $adDetails.find('ul.params li');
			let price = '';
			// @refactor: to for loop
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
					price = priceText.replace(/[^\d\.,]/gi, '');
					if (price !== +price + '') {
						l.debug(
							`[${this.serviceName}] Price "${price}" is not a number.`,
							url
						);
					}
				} else {
					description +=
						(description.length > 0 ? '\n' : '') +
						el.firstChild!.data!.trim();
				}
			});

			const offer: IOffer = {
				site: 'otodom',
				_dt,
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
		const currentDate = new Date();
		// @thought: it is probably  more useful to return "earliest" date,
		// @thought: in this case it would be 3 days back.
		// @thought: instead of null, it may have some value in comparison
		const adDate = this.parseAdTime('workaround missing ad time');
		return [
			// @i: we do not have a date in any format in the ad
			adDate,
			`~${new Date(currentDate.getTime() - 3 * DAY_MS).toLocaleString(
				...config.dateTimeFormatParams
			)} - ~${currentDate.toLocaleString(...config.dateTimeFormatParams)}`,
			this.checkIfAdTooOld(adDate)
		];
	}

	parseAdTime(scrapedTime: string): Date {
		return new Date(new Date(globals.programStartTime - 3 * DAY_MS));
	}

	checkIfAdTooOld(adDate: Date): boolean {
		return adDate.getTime() > globals.programStartTime - 3 * DAY_MS;
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
