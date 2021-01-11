import { Offer, OffersInfo } from '../types';

export type RepositoryProvider = 'MONGO' | 'JSON-FILES';

export interface OffersRepository {
	createOffer(offer: Offer): Promise<string>;
	getOfferById(id: string): Promise<Offer | null>;
	saveOffersList(offersInfo: OffersInfo): Promise<string>;
	getOffersList(listId: string): Promise<OffersInfo | null>;
}
