export const sleep = (timeout: number) =>
	new Promise((resolve) =>
		setTimeout(() => {
			resolve(void 0);
		}, timeout)
	);
