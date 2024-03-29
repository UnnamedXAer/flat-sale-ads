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
	"offerId": "71749968",
	"imgUrl": "https://ireland.apollo.olxcdn.com:443/v1/files/u6zmf6m8trop-PL/image;s=644x461",
	"price": "294000",
	"scrapedAt": {
		"$date": {
			"$numberLong": "1637096204824"
		}
	},
	"site": "olx",
	"title": "Wyjątkowy Taras Na Dachu, 2 Pokoje"
},{
	"url": "https://www.otodom.pl/pl/oferta/-1.wyjatkowy-taras-na-dachu-2-pokoje-ID4bUcv.html?",
	"_dt": {
		"$date": {
			"$numberLong": "1637073840000"
		}
	},
	"description": "",
	"dt": "16 listopada 2021, 15:44",
	"offerId": "71749967",
	"imgUrl": "https://ireland.apollo.olxcdn.com:443/v1/files/u6zmf6m8trop-PL/image;s=644x461",
	"price": "294000",
	"scrapedAt": {
		"$date": {
			"$numberLong": "1637096204824"
		}
	},
	"site": "olx",
	"title": "-1Wyjątkowy Taras Na Dachu, 2 Pokoje"
},{
	"url": "https://www.otodom.pl/pl/oferta/wyjatkowy-taras-na-dachu-2-pokoje-ID4bUcv.html?",
	"_dt": {
		"$date": {
			"$numberLong": "1637073780000"
		}
	},
	"description": "",
	"dt": "16 listopada 2021, 15:43",
	"offerId": "71749968",
	"imgUrl": "https://ireland.apollo.olxcdn.com:443/v1/files/92ctl2fm308r1-PL/image;s=644x461",
	"price": "294000",
	"scrapedAt": {
		"$date": {
			"$numberLong": "1637096204824"
		}
	},
	"site": "olx",
	"title": "Wyjątkowy Taras Na Dachu, 2 Pokoje"
},{
	"url": "https://www.otodom.pl/pl/oferta/2.wyjatkowy-taras-na-dachu-2-pokoje-ID4bUcv.html?",
	"_dt": {
		"$date": {
			"$numberLong": "1637073780000"
		}
	},
	"description": "",
	"dt": "16 listopada 2021, 15:43",
	"offerId": "717499682",
	"imgUrl": "https://ireland.apollo.olxcdn.com:443/v1/files/92ctl2fm308r1-PL/image;s=644x461",
	"price": "294990",
	"scrapedAt": {
		"$date": {
			"$numberLong": "1637096204824"
		}
	},
	"site": "olx",
	"title": "2. Wyjątkowy Taras Na Dachu, 2 Pokoje"
},{
	"url": "https://www.otodom.pl/pl/oferta/2.wyjatkowy-taras-na-dachu-2-pokoje-ID4bUcv.html?",
	"_dt": {
		"$date": {
			"$numberLong": "1637073780000"
		}
	},
	"description": "",
	"dt": "16 listopada 2021, 15:43",
	"offerId": "717499682",
	"imgUrl": "https://ireland.apollo.olxcdn.com:443/v1/files/92ctl2fm308r1-PL/image;s=644x461",
	"price": "294990",
	"scrapedAt": {
		"$date": {
			"$numberLong": "1637096204824"
		}
	},
	"site": "olx",
	"title": "2. Wyjątkowy Taras Na Dachu, 2 Pokoje"
},{
	"url": "https://www.otodom.pl/pl/oferta/3.wyjatkowy-taras-na-dachu-2-pokoje-ID4bUcv.html?",
	"_dt": {
		"$date": {
			"$numberLong": "1637073780000"
		}
	},
	"description": "",
	"dt": "16 listopada 2021, 15:43",
	"offerId": "717499683",
	"imgUrl": "https://ireland.apollo.olxcdn.com:443/v1/files/92ctl2fm308r1-PL/image;s=644x461",
	"price": "294993",
	"scrapedAt": {
		"$date": {
			"$numberLong": "1637096204824"
		}
	},
	"site": "olx",
	"title": "3. Wyjątkowy Taras Na Dachu, 2 Pokoje"
}]`;

const data: IOffer[] = JSON.parse(json);

describe('compare', () => {
	it('assert equal offer', () => {
		const areSame = assertSameOffers(data[1], data[2]);
		expect(areSame).toBe(true);
	});

	it('filter out recurred offers', async () => {
		const prevOffers = data.reverse().slice(0, 2);
		const newOffers = data;

		const expectedTitles = [
			'Wyjątkowy Taras Na Dachu, 2 Pokoje',
			'-1Wyjątkowy Taras Na Dachu, 2 Pokoje'
		];

		const got = await filterOutRecurredOffers(prevOffers, newOffers);

		const gotTitles = got.map((x) => x.title);
		const expectedNumberOfUniqueOffers = expectedTitles.length
		expect(got).toHaveLength(expectedNumberOfUniqueOffers);
		expect(gotTitles).toEqual(expectedTitles);
	});
});
