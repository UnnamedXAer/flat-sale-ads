import { assertSameOffers } from '../dataAnalyzer/compareOffers';
import { filterOutRecurredOffers } from '../dataAnalyzer/uniqueOffers';
import { IOffer } from '../types';

const json = `[{
	"url": "https://www.otodom.pl/pl/oferta/wyjatkowy-taras-na-dachu-2-pokoje-ID4bUcv.html?",
	"_dt": {
		"$date": {
			"$numberLong": "1637073840000"
		}
	},
	"description": "",
	"dt": "16 listopada 2021, 15:44",
	"offerId": "717499681",
	"imgUrl": "https://ireland.apollo.olxcdn.com:443/v1/files/u6zmf6m8trop-PL/image;s=644x461",
	"price": "294000",
	"scrapedAt": {
		"$date": {
			"$numberLong": "1637096204824"
		}
	},
	"site": "olx",
	"title": "Wyjątkowy Taras Na Dachu, 2 Pokoje"
},
{
	"url": "https://www.otodom.pl/pl/oferta/wyjatkowy-taras-na-dachu-2-pokoje-ID4bUcv.html?",
	"_dt": {
		"$date": {
			"$numberLong": "1637073780000"
		}
	},
	"description": "",
	"dt": "16 listopada 2021, 15:43",
	"offerId": "717499682",
	"imgUrl": "https://ireland.apollo.olxcdn.com:443/v1/files/92ctl2fm308r1-PL/image;s=644x461",
	"price": "294000",
	"scrapedAt": {
		"$date": {
			"$numberLong": "1637096204824"
		}
	},
	"site": "olx",
	"title": "Wyjątkowy Taras Na Dachu, 2 Pokoje"
}]`;

const data: IOffer[] = JSON.parse(json);

describe('compare', () => {
	it('assert equal offer', () => {
		const areSame = assertSameOffers(data[0], data[1]);
		expect(areSame).toBe(true);
	});

	it.only('filter out recurred offers', async () => {
		const unique = await filterOutRecurredOffers(data.reverse(), data);
		expect(unique).toHaveLength(0);
	});
});
