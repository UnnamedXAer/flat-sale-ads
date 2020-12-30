import { Config, NODE_ENV } from './types';
import { getEnvPrefix } from './envPrefix';
import path from 'path';
import os from 'os';
const { name } = require('../package.json');

export const createConfig = (process: NodeJS.Process): Config => {
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
		)
	};
};

export const config = createConfig(process);