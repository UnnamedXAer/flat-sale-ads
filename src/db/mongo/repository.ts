import { Model, Document } from 'mongoose';
import { Offer, OffersInfo } from '../../types';
import { OffersRepository } from '../types';

export class MongoOffersRepository implements OffersRepository {
	constructor(private collection: Model<Document<Offer>>) {}

	async createOffer(offer: Offer): Promise<string> {
		const offerModel = new this.collection(offer);

		const offerDoc = await this.collection.create(offer);
		return 'not_implemented' + offerDoc.toObject().id;
	}
	async getOfferById(id: string): Promise<Offer | null> {
		const offer = await this.collection.findById(id);
		if (offer) {
			return {
				_dt: new Date()
			} as Offer;
		}
		return null;
	}
	saveOffersList(offersInfo: OffersInfo): Promise<string> {
		throw new Error('Method not implemented.');
	}
	getOffersList(listId: string): Promise<OffersInfo | null> {
		throw new Error('Method not implemented.');
	}
}
