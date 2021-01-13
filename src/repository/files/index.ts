//  async function  _saveSiteOffers(siteName: SiteName, dataToSave: OffersInfo) {
// 	const dirPath = path.resolve(__dirname, '..', '..', 'data', siteName);
// 	const pathName = path.join(dirPath, `${formatDateToFileName()}.json`);
// 	const text = JSON.stringify(dataToSave, null, config.isDev ? '\t' : 0);
// 	try {
// 		await ensurePathExists(dirPath);
// 		l.info(`About to save the ${siteName} offers to "${pathName}".`);
// 		await writeFile(pathName, text);
// 	} catch (err) {
// 		l.error(`Fail to save the ${siteName} offers to the file.`, err);
// 		throw err;
// 	}
// }