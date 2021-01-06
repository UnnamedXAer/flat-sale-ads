import { getDataDirLatestOffers } from '../files';
import l from '../logger';
import { DataDirectory, Offer } from '../types';

export function compareOffers(uniqueOffer: Offer, currentOffer: Offer) {
	const siteEqual = assertEqualOfferProp(uniqueOffer, currentOffer, 'site');
	if (assertEqualOfferProp(uniqueOffer, currentOffer, 'title')) {
		if (
			siteEqual &&
			assertEqualOfferProp(uniqueOffer, currentOffer, 'description') === false
		) {
			return false;
		}
		//true?
	}

	if (siteEqual && assertEqualOfferProp(uniqueOffer, currentOffer, 'id')) {
		return true;
	}
}

export function assertEqualOfferProp(
	obj1: Offer,
	obj2: Offer,
	prop: keyof Offer
): boolean {
	let val1 = obj1[prop];
	let val2 = obj2[prop];
	if (prop === 'description') {
		val1 = (val1 as string).slice(0, 150);

		val2 = (val2 as string).slice(0, 150);
	}
	let output = val1 === val2;
	if (!val1 && !val2) {
		output = false;
	}

	l.silly(
		`\n${output}\n1. ${val1
			?.toString()
			.replace(/\n/g, '|')}\n2. ${val2?.toString().replace(/\n/g, '|')}`
	);

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
			compareOffers(uniqueOffer, currentOffer)
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
		// @check if same page compare dates, if same day push it,
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
			// we assume that this is the same offer.
			offers[idx] = currentOffer;
		}
	}

	return offers;
}

export async function mergeUniqOffers(
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
