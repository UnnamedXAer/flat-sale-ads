import { model, Document } from 'mongoose';
import { IOffer } from '../../types';
import { offerSchema } from './schema';

export type IOfferModel = IOffer & Document;

export const OfferModel = model<IOfferModel>('Offer', offerSchema);
// @i: temporaryOffersSchema - to temporarily keep scraped offers until they got merged into all offers (offersSchema)
export const TemporaryOfferModel = model<IOfferModel>('TemporaryOffer', offerSchema);
