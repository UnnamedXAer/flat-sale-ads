import { Config, NODE_ENV } from './types';
import { getEnvPrefix } from './envPrefix';
import path from 'path';
import os from 'os';
const { name } = require('../package.json');

export const createConfig = (process: NodeJS.Process): Config => {
	const lang = process.env.LOCALE_LANG || 'pl-PL';
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
		scrapeSiteTimeout: 1000 * 160,
		startMaximized: process.env.START_BROWSER_MAXIMIZED === 'TRUE',
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
		],
		urls: {
			rzeszowiak:
				process.env.URL_RZESZOWIAK ||
				'http://www.rzeszowiak.pl/Nieruchomosci-Sprzedam-agencje-2580011251?r=mieszkania',

			// location = Rzeszów +10km
			// price = 100k-400k
			// category = sell
			olx:
				process.env.URL_RZESZOWIAK ||
				'https://www.olx.pl/nieruchomosci/mieszkania/sprzedaz/rzeszow/?search%5Bfilter_float_price%3Afrom%5D=100000&search%5Bfilter_float_price%3Ato%5D=400000&search%5Bdist%5D=10'
		}
	};
};

export const config = createConfig(process);
