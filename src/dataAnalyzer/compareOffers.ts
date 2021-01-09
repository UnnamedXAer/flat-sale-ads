import { getDataDirLatestOffers } from '../files';
import l from '../logger';
import { DataDirectory, Offer } from '../types';

export function assertSameOffers(uniqueOffer: Offer, currentOffer: Offer): boolean {
	const siteEqual = assertEqualOfferProp(uniqueOffer, currentOffer, 'site');

	if (siteEqual && assertEqualOfferProp(uniqueOffer, currentOffer, 'id')) {
		return true;
	}

	if (assertEqualOfferProp(uniqueOffer, currentOffer, 'title')) {
		if (siteEqual) {
			if (assertEqualOfferProp(uniqueOffer, currentOffer, 'description')) {
				return true;
			}
			return false;
		}
		if (assertEqualOfferProp(uniqueOffer, currentOffer, 'price')) {
			return true;
		}
		return false;
	}

	return false;
}

export function assertEqualOfferProp(
	obj1: Offer,
	obj2: Offer,
	prop: keyof Offer
): boolean {
	let val1 = obj1[prop];
	let val2 = obj2[prop];
	if (typeof val1 === 'string') {
		val1 = val1.toLowerCase();
		val2 = (val2 as string).toLowerCase();
		if (prop === 'description') {
			val1 = (val1 as string).slice(0, 150);

			val2 = (val2 as string).slice(0, 150);
		}
	}
	let output = val1 === val2;
	if (!val1 && !val2) {
		output = false;
	}


	return output;
}
/**
 * `getOffersUnion` returns new array
 *
 * @export
 * @param {Offer[]} uniqueOffers
 * @param {Offer[]} currentOffers
 * @param {DataDirectory} dataDirectory
 * @returns {Promise<Offer[]>}
 */
export async function getOffersUnion(
	uniqueOffers: Offer[],
	currentOffers: Offer[],
	dataDirectory: DataDirectory
): Promise<Offer[]> {
	const offers = [...uniqueOffers];

	for (let j = 0; j < currentOffers.length; j++) {
		const currentOffer = currentOffers[j];
		const idx = offers.findIndex((uniqueOffer) =>
			assertSameOffers(uniqueOffer, currentOffer)
		);

		l.debug({
			dataDirectory: dataDirectory,
			title: currentOffer.title,
			_dt: currentOffer._dt,
			dt: currentOffer.dt,
			id: currentOffer.id,
			price: currentOffer.price
		});

		if (idx === -1) {
			offers.push(currentOffer);
			continue;
		}

		const offer = offers[idx];
		const differentProps: (keyof Offer)[] = [];
		const adKeys = (Object.keys(offer) as unknown) as typeof differentProps;
		adKeys.forEach((prop) => {
			if (offer[prop] !== currentOffer[prop]) {
				differentProps.push(prop);
			}
		});

		const currentOfferTime = new Date(currentOffer._dt).getTime();
		if (isFinite(currentOfferTime) === false) {
			break;
		}

		const uniqOfferTime = new Date(currentOffer._dt).getTime();
		if (isFinite(uniqOfferTime) === false) {
			break;
		}

		if (currentOfferTime < uniqOfferTime) {
			// @i: we assume that this is the same offer so we wont to save newer one.
			// @improvement: check if there is no missing data in fields and do not save if there are in currentOffer.
			offers[idx] = currentOffer;
		}
	}

	return offers;
}

export async function makeOffersUnion(
	previousOffersUnion: Offer[],
	dataDirectory: DataDirectory
) {
	const currentOffers = await getDataDirLatestOffers(dataDirectory);
	if (currentOffers === null) {
		return previousOffersUnion;
	}
	const currentOffersList = currentOffers.offers;
	const offersUnion = await getOffersUnion(
		previousOffersUnion,
		currentOffersList,
		dataDirectory
	);
	return offersUnion;
}
