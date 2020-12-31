import {
	mapMonthPrefixToMonth,
	parseOlxAdTime,
	parseOlxAdTimeWithTodayYesterday
} from '../announcement/oAnnouncements';

const mockDate = (firstDayOfYear?: boolean) => {
	class MockDate extends Date {
		constructor(...args: any[]) {
			if (args.length > 0) {
				super(...(args as []));
			} else {
				// @i: add whatever date you'll expect to get as current date
				if (firstDayOfYear === true) {
					super(2021, 0, 1, 11, 1);
				} else {
					super(2020, 11, 31, 11, 1);
				}
			}
		}
	}

	// @ts-ignore
	global.Date = MockDate;
};

const _Date = global.Date;
beforeAll(() => {
	mockDate();
});

afterAll(() => {
	global.Date = _Date;
});

describe('Parse olx ads time', () => {
	test('should return month name for given prefix.', () => {
		expect(mapMonthPrefixToMonth('lut', false)).toBe<string>('luty');
	});

	test('should return month number for given prefix.', () => {
		expect(typeof mapMonthPrefixToMonth('lut', true)).toBe('number');
		expect(mapMonthPrefixToMonth('lut')).toBe<number>(1);
	});

	test('should return date in app standardized format - handle short date', () => {
		expect(parseOlxAdTime('29 gru')).toBe('29 grudnia 2020');

		expect(parseOlxAdTime('1 sty')).toBe('1 stycznia 2020');
	});

	test('should return date in app standardized format - handle today / yesterday', () => {
		expect(parseOlxAdTimeWithTodayYesterday('wczoraj', '12:22')).toBe(
			'30 grudnia 2020, 12:22'
		);
		expect(parseOlxAdTimeWithTodayYesterday('dzisiaj', '12:22')).toBe(
			'31 grudnia 2020, 12:22'
		);
	});

	test('should return date in app standardized format - handle today on new year', () => {
		mockDate(true);
		expect(parseOlxAdTimeWithTodayYesterday('dzisiaj', '12:22')).toBe(
			'1 stycznia 2021, 12:22'
		);
		mockDate(false);

	});

	test('should return date in app standardized format - handle yesterday on new year', () => {
		expect(parseOlxAdTimeWithTodayYesterday('wczoraj', '12:22')).toBe(
			'30 grudnia 2020, 12:22'
		);
	});

	test('should handle date with broken time - handle today / yesterday on new year', () => {
		expect(parseOlxAdTimeWithTodayYesterday('wczoraj', '1.2:22')).toBe(
			'wczoraj 1.2:12'
		);
	});

	test('should parse olx date to app standardized format - handle today / yesterday', () => {
		expect(parseOlxAdTime('wczoraj 12:22')).toBe('30 grudnia 2020, 12:22');
		expect(parseOlxAdTime('dzisiaj 12:22')).toBe('31 grudnia 2020, 12:22');
	});

	test('should parse olx date to app standardized format - handle today on new year', () => {
		expect(parseOlxAdTime('wczoraj 12:22')).toBe('30 grudnia 2020, 12:22');
		expect(parseOlxAdTime('dzisiaj 12:22')).toBe('1 stycznia 2021, 12:22');
	});

	test('should parse olx date to app standardized format - handle yesterday on new year', () => {
		expect(parseOlxAdTime('wczoraj 12:22')).toBe('30 grudnia 2020, 12:22');
		expect(parseOlxAdTime('dzisiaj 12:22')).toBe('1 stycznia 2021, 12:22');
	});
});
