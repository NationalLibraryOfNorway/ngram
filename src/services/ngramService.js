import { fetchNgramData as fetchData, MIN_YEAR, MAX_YEAR } from './ngramProcessor';

// Constants
const SCHEMES = ['light', 'dark', 'ggplot2', 'seaborn'];
const LANGUAGES = ['nob', 'nno', 'sme', 'fkv'];
const MODES = [
    { label: 'Relativ', value: 'relative' },
    { label: 'Absolutt', value: 'absolute' },
    { label: 'Kumulativ', value: 'cumulative' },
    { label: 'Kohort', value: 'cohort' }
];
const CORPORA = [
    { label: 'Avis', value: 'avis' },
    { label: 'Bok', value: 'bok' }
];

// Process data based on selected mode
const processChartData = (data, mode, smooth) => {
    if (!data || !data.length) return null;

    let processedData = [...data];

    if (mode === 'cumulative') {
        processedData = processedData.map(series => {
            let sum = 0;
            return series.map(value => {
                sum += value;
                return sum;
            });
        });
    } else if (mode === 'cohort') {
        // Implement cohort calculation
        // This would need to be implemented based on your specific requirements
    }

    // Apply smoothing
    if (smooth > 1) {
        processedData = processedData.map(series => {
            return series.map((value, index) => {
                const start = Math.max(0, index - Math.floor(smooth / 2));
                const end = Math.min(series.length, index + Math.floor(smooth / 2) + 1);
                const window = series.slice(start, end);
                return window.reduce((a, b) => a + b, 0) / window.length;
            });
        });
    }

    return processedData;
};

// Fetch ngram data
const fetchNgramData = async (words, fromYear, toYear, doctype, lang, mode, smooth = 1) => {
    try {
        const wordsList = words.split(',').map(w => w.trim());
        return await fetchData(wordsList, fromYear, toYear, doctype, lang, mode, smooth);
    } catch (error) {
        console.error('Error fetching ngram data:', error);
        throw error;
    }
};

const normalizeNbSearchTerm = (name) => {
    const tokens = [];
    let current = '';
    const input = String(name);

    for (let index = 0; index < input.length; index += 1) {
        const character = input[index];
        const previous = input[index - 1];
        const next = input[index + 1];
        const isIsolatedPlusDelimiter = character === '+' && previous !== '+' && next !== '+';

        if (character === ',' || isIsolatedPlusDelimiter) {
            const trimmed = current.trim();
            if (trimmed) {
                tokens.push(trimmed);
            }
            current = '';
            continue;
        }

        current += character;
    }

    const trimmed = current.trim();
    if (trimmed) {
        tokens.push(trimmed);
    }

    return tokens.length > 0 ? tokens.join(' OR ') : input.trim();
};

// Create National Library search query URL
const makeNbQuery = (name, mediatype, startDate, endDate) => {
    const params = new URLSearchParams({
        q: `"${normalizeNbSearchTerm(name)}"`,
        mediatype: mediatype
    });
    if (startDate) {
        params.set('fromDate', startDate);
    }
    if (endDate) {
        params.set('toDate', endDate);
    }
    return `https://www.nb.no/search?${params.toString()}`;
};

export {
    SCHEMES,
    LANGUAGES,
    MODES,
    CORPORA,
    MIN_YEAR,
    MAX_YEAR,
    processChartData,
    fetchNgramData,
    makeNbQuery
}; 