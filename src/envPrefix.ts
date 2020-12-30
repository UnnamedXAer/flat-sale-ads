import { EnvPrefix } from './types';

export function getEnvPrefix(): EnvPrefix {
	if (process.env.NODE_ENV === 'production') {
		return 'prod';
	}
	if (process.env.NODE_ENV === 'development') {
		return 'dev';
	}
	if (process.env.NODE_ENV === 'test') {
		return 'test';
	}
	return 'dev';
}
