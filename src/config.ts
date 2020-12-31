import { Config, NODE_ENV } from './types';
import { getEnvPrefix } from './envPrefix';
import path from 'path';
import os from 'os';
const { name } = require('../package.json');

export const createConfig = (process: NodeJS.Process): Config => {
	const lang = 'pl-PL';
	const timeFormatOptions: Intl.DateTimeFormatOptions = {
		hour12: false,
		hour: '2-digit',
		minute: '2-digit'
	};
	const dateFormatOptions: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	};

	return {
		NODE_ENV: (process.env.NODE_ENV as NODE_ENV) || 'development',
		isDev: process.env.NODE_ENV !== 'production',
		envPrefix: getEnvPrefix(),
		logsLevel: +(process.env.LOGS_LEVEL || 1),
		appTemporaryDataFolder: path.join(
			process.env.LOCALAPPDATA
				? process.env.LOCALAPPDATA
				: path.join(os.homedir(), 'AppData', 'Local'),
			name
		),
		timeFormatParams: [lang, timeFormatOptions],
		dateFormatParams: [lang, dateFormatOptions],
		dateTimeFormatParams: [
			lang,
			{
				...dateFormatOptions,
				...timeFormatOptions
			}
		]
	};
};

export const config = createConfig(process);
