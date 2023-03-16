import { globals } from './global';
import l from './logger';
import { Server } from 'http';

function normalizePort(val: any) {
	const port = parseInt(val, 10);
	if (isNaN(port)) {
		return val;
	}
	if (port >= 0) {
		return port;
	}
	return false;
}

export const PORT = normalizePort(process.env.PORT || '3000');

export function serverListenHandler(this: Server) {
	globals.SERVER_UP = true;
	const addr = this.address()!;
	const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
	l.info(`Listening on ${bind}`);
}

export function onError(err: any) {
	l.error(err);
	if (err.syscall !== 'listen') {
		throw err;
	}
	const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

	switch (err.code) {
		case 'EACCES':
			l.error(`${bind} requires elevated privileges`);
			process.exit(0);
			break;
		case 'EADDRINUSE':
			l.error(`${bind} is already in use`);
			process.exit(1);
			break;
		case 'ENOTESSTORE':
			l.error(`Notes data store initialization failure because `, err.error);
			process.exit(1);
			break;
		default:
			throw err;
	}
}
