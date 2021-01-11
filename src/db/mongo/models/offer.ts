import  {model} from 'mongoose';
import OfferSchema from '../schemas/offer';

export const OfferModel = model('Offer', OfferSchema)