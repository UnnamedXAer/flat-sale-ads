/**
 * `sleep` waits for given time
 *
 * @param {number} timeout - time in `ms`
 */
export const sleep = (timeoutMs: number) =>
	new Promise((resolve) =>
		setTimeout(() => {
			resolve(void 0);
		}, timeoutMs)
	);
