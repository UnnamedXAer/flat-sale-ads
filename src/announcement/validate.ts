import { config } from '../config';
import l from '../logger';
import { Announcement, SiteName } from '../types';

export function validateAnnouncementsAndReturn(
	announcements: Announcement[],
	siteName: SiteName
): Announcement[] {
	if (config.isDev) {
		const withMissingData = announcements
			.map((x) => {
				if (
					x.title === '' ||
					x.price === '' ||
					x.url === '' ||
					x.dt === '' ||
					x.imgUrl === ''
				) {
					return x;
				}
				return null;
			})
			.filter((x) => x != null);

		if (withMissingData.length > 0) {
			l.warn(`[${siteName}] Some of the ads have missing data`, withMissingData);
		}
	}
	return announcements;
}
