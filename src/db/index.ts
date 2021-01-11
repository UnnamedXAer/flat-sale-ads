import { Logger } from 'tslog/dist/types/Logger';
import { assertUnreachable } from '../assertUnreachable';
import l from '../logger';
import { OffersService } from './mongo';
import OfferSchema from './mongo/schemas/offer';
import { MongoOffersRepository } from './mongo/repository';
import { RepositoryProvider } from './types';

export const db = ((
	logger: Logger
): {
	offers: OffersService;
} => {
	const provider = process.env.DB_PROVIDER as RepositoryProvider;
	switch (provider) {
		case 'MONGO': {
			return {
				offers: new OffersService(new MongoOffersRepository(OfferSchema), logger)
			};
		}
		case 'JSON-FILES':
			throw new Error('The "JSON-FILES" repository is implemented yet.');
		default:
			assertUnreachable(provider);
	}
})(l);
