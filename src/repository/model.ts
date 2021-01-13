import { model, Document } from 'mongoose';
import { IOffer } from '../types';
import { offerSchema } from './schema';

export const OfferModel = model<IOfferModel>('Offer', offerSchema);
export type IOfferModel = IOffer & Document;
