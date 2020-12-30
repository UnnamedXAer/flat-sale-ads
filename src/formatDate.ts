/**
 * Returns date in file name friendly string
 * @param {Date | number | undefined} date
 * @returns date in format: "YYYY-MM-DD"
 */
export function formatDateToFileName(date?: Date | number) {
	const d =
		date instanceof Date
			? date
			: typeof date === 'number'
			? new Date(date)
			: new Date();
	const dayNum = d.getDate();
	const monthNum = d.getMonth() + 1;
	const yearNum = d.getFullYear();
	const hourNum = d.getHours();
	const minutesNum = d.getMinutes();
	const day = dayNum < 10 ? '0' + dayNum : '' + dayNum;
	const month = monthNum < 10 ? '0' + monthNum : '' + monthNum;
	const hours = hourNum < 10 ? '0'+hourNum : ''+hourNum
	const minutes = minutesNum < 10 ? '0'+minutesNum : ''+minutesNum
	return `${yearNum}-${month}-${day}-${hours}-${minutes}`;
}
