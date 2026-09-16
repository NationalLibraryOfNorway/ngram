import { makeNbQuery } from './ngramService';

describe('makeNbQuery', () => {
    test('uses OR syntax for grouped series names from plus queries', () => {
        const plusUrl = new URL(makeNbQuery('and+kylling', 'bøker', '19000101', '19001231'));
        const url = new URL(makeNbQuery('and,kylling', 'bøker', '19000101', '19001231'));

        expect(plusUrl.searchParams.get('q')).toBe('and OR kylling');
        expect(url.origin + url.pathname).toBe('https://www.nb.no/search');
        expect(url.searchParams.get('q')).toBe('and OR kylling');
        expect(url.searchParams.get('mediatype')).toBe('bøker');
        expect(url.searchParams.get('fromDate')).toBe('19000101');
        expect(url.searchParams.get('toDate')).toBe('19001231');
    });

    test('preserves single-term searches', () => {
        const url = new URL(makeNbQuery('demokrati', 'aviser', '', ''));

        expect(url.searchParams.get('q')).toBe('"demokrati"');
        expect(url.searchParams.get('mediatype')).toBe('aviser');
        expect(url.searchParams.get('fromDate')).toBeNull();
        expect(url.searchParams.get('toDate')).toBeNull();
    });

    test('does not rewrite plus signs inside a single term', () => {
        const url = new URL(makeNbQuery('C++', 'bøker', '', ''));

        expect(url.searchParams.get('q')).toBe('"C++"');
    });

    test('keeps a single grouped term unquoted when surrounded by delimiters', () => {
        const plusUrl = new URL(makeNbQuery('+and+', 'bøker', '', ''));
        const commaUrl = new URL(makeNbQuery(',and,', 'bøker', '', ''));

        expect(plusUrl.searchParams.get('q')).toBe('and');
        expect(commaUrl.searchParams.get('q')).toBe('and');
    });

    test('falls back to the original trimmed input when no grouped terms are extracted', () => {
        const url = new URL(makeNbQuery(',', 'bøker', '', ''));

        expect(url.searchParams.get('q')).toBe('","');
    });

    test('escapes embedded quotes and backslashes in single-term searches', () => {
        const url = new URL(makeNbQuery('foo\\bar"baz', 'bøker', '', ''));

        expect(url.searchParams.get('q')).toBe('"foo\\\\bar\\"baz"');
    });

    test('escapes grouped terms only when needed', () => {
        const url = new URL(makeNbQuery('foo\\bar"baz,qux', 'bøker', '', ''));

        expect(url.searchParams.get('q')).toBe('"foo\\\\bar\\"baz" OR qux');
    });
});
