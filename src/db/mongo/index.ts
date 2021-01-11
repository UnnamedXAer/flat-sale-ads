import { Logger } from 'tslog';
import { Offer, OffersInfo } from '../../types';
import { OffersRepository } from '../types';

export class OffersService implements OffersRepository {
	private repository: OffersRepository;
	private l: Logger;
	constructor(repository: OffersRepository, logger: Logger) {
		this.l = logger;
		this.repository = repository;
	}

	saveOffersList(offersInfo: OffersInfo): Promise<string> {
		throw new Error('Method not implemented.');
	}

	getOffersList(listId: string): Promise<OffersInfo | null> {
		throw new Error('Method not implemented.');
	}

	getOfferById(id: string): Promise<Offer| null> {
		this.l.debug(`about to get offer by id: "${id}"`);
		return this.repository.getOfferById(id);
	}

	createOffer(offer: Offer): Promise<string> {
		this.l.debug(`about to create offer: ${offer}`);
		return this.repository.createOffer(offer);
	}
}
