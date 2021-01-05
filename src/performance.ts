import l from './logger';

/**
 * Measure the time between of calls of timeStart and returned timeStop functions
 * then log it to the console with given label
 *
 * @example
 *	async function getFileData(filePath: string, fileName: string): Promise<Object> {
 *		const filePathName = path.join(filePath, fileName);
 *		const timeStop = timeStart(`Reading data from: "${filePathName}`);
 *		const data = await readFile(filePathName);
 *		const fileData = Array.from(data.toString());
 *		timeStop();
 *		return fileData;
 * }
 *
 * @param {string} label
 * @returns {Function} timerStop - function to stop the timer and log it with label
 */
export const timeStart = (label: string = ''): Function => {
	const startTime = process.hrtime.bigint();
	return (stopLabel: string = label) => {
		let executionTime = Number(process.hrtime.bigint() - startTime);
		let executionTimeUnit = 'ns';
		if (executionTime > 100000000) {
			executionTime /= 1000000000;
			executionTimeUnit = 's';
		} else if (executionTime > 100000) {
			executionTime /= 1000000;
			executionTimeUnit = 'ms';
		}
		l.debug(stopLabel, `- execution time: ${executionTime} ${executionTimeUnit}`);
	};
};
