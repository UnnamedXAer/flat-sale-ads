import { Response } from 'express';
import { assertUnreachable } from './assertUnreachable';
import l from './logger';

export class ScrapeEmitter {
	private subscribers: Response[] = [];

	subscribe(res: Response) {
		l.debug('subscribe', res.req.path, res.req.headers.origin);
		this.subscribers.push(res);
	}

	unsubscribe(res: Response) {
		l.debug('unsubscribing', res.req.path, res.req.headers.origin);
		var idx = this.subscribers.findIndex((r) => r === res);
		if (idx > -1) {
			this.subscribers.splice(idx, 1);
		}
	}

	emit(eventName: 'done' | 'error', payload?: any) {
		switch (eventName) {
			case 'done':
				this.doneHandler();
				break;
			case 'error':
				this.errorHandler(payload);
				break;
			default:
				assertUnreachable(eventName);
		}
	}

	private doneHandler() {
		const subers = [...this.subscribers];
		this.subscribers = [];

		l.debug(`done - redirecting ${subers.length} requests to /data`);

		subers.forEach((r) => {
			r.redirect('/data');
		});
	}

	private errorHandler(err: unknown) {
		const subers = [...this.subscribers];
		this.subscribers = [];

		l.info(`error - sending error to ${subers.length} requests error: ${err}`);

		const msg = (err as Error).toString();
		subers.forEach((r) => {
			r.status(500).send(msg);
		});
	}
}
