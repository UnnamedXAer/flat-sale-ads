import { model, Document } from 'mongoose';
import { IOffersInfo } from '../../types';
import { offersInfoSchema } from './schema';

export interface IOffersInfoDocument extends IOffersInfo, Document {}

export const OfferModel = model<IOffersInfoDocument>('AllOffer', offersInfoSchema);

// @i: temporaryOffersSchema - to temporarily keep scraped offers until they got merged into all offers (offersSchema)
export const TemporaryOfferModel = model<IOffersInfoDocument>(
	'TemporaryOffer',
	offersInfoSchema
);
