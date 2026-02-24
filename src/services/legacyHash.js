const DEFAULT_STATE = {
    words: [],
    graphType: 'relative',
    corpus: 'bok',
    lang: 'nob',
    capitalization: false,
    smoothing: 3,
    scaling: 'auto',
    curvePattern: false,
    zoomStart: null,
    zoomEnd: null
};
const MODE_BY_TOKEN_2 = {
    '1': 'relative',
    '2': 'absolute'
};
const CORPUS_BY_TOKEN_3 = {
    '1': 'bok',
    '2': 'avis'
};
const LANG_BY_TOKEN_5 = {
    '1': 'nob',
    '2': 'nno',
    '3': 'nob',
    '4': 'smj',
    '5': 'sma',
    '6': 'sme',
    '7': 'fkv'
};
const CASE_SENSITIVE_TOKEN_VALUES = new Set(['2', 'true']);
const isYearRangeToken = (token) => /^\d{4},\d{4}$/.test(token);
const toTokenMap = (tokens) => ({
    token1: tokens[0],
    token2: tokens[1],
    token3: tokens[2],
    token4: tokens[3],
    token5: tokens[4],
    token6: tokens[5],
    token7: tokens[6],
    token8: tokens[7],
    token9: tokens[8],
    token10: tokens[9]
});

export const parseLegacyHash = (hashValue) => {
    if (!hashValue || hashValue === '#') {
        return DEFAULT_STATE;
    }

    const raw = hashValue.startsWith('#') ? hashValue.slice(1) : hashValue;

    if (raw.startsWith('v2?')) {
        const params = new URLSearchParams(raw.slice(3));
        const words = (params.get('terms') || '')
            .split(',')
            .map((word) => word.trim())
            .filter(Boolean);
        const graphType = params.get('mode') || DEFAULT_STATE.graphType;
        const corpus = params.get('corpus') || DEFAULT_STATE.corpus;
        const lang = params.get('lang') || DEFAULT_STATE.lang;
        const capitalization = params.get('case') === '1';
        const smoothing = Number.parseInt(params.get('smooth') || '', 10);
        const scaling = params.get('scale') || DEFAULT_STATE.scaling;
        const curvePattern = params.get('pattern') === '1';
        const zoomStart = Number.parseInt(params.get('from') || '', 10);
        const zoomEnd = Number.parseInt(params.get('to') || '', 10);

        return {
            words,
            graphType,
            corpus,
            lang,
            capitalization,
            smoothing: Number.isFinite(smoothing) ? smoothing : DEFAULT_STATE.smoothing,
            scaling,
            curvePattern,
            zoomStart: Number.isFinite(zoomStart) ? zoomStart : DEFAULT_STATE.zoomStart,
            zoomEnd: Number.isFinite(zoomEnd) ? zoomEnd : DEFAULT_STATE.zoomEnd
        };
    }

    let decoded;
    try {
        decoded = decodeURIComponent(raw);
    } catch {
        decoded = raw;
    }

    const tokens = decoded.split('_').filter(Boolean);
    if (!tokens.length) {
        return DEFAULT_STATE;
    }

    const mapped = toTokenMap(tokens);
    const yearRangeToken = mapped.token8 && isYearRangeToken(mapped.token8) ? mapped.token8 : null;
    let zoomStart = null;
    let zoomEnd = null;
    if (yearRangeToken) {
        const [fromYear, toYear] = yearRangeToken.split(',').map((value) => parseInt(value, 10));
        if (Number.isFinite(fromYear) && Number.isFinite(toYear)) {
            zoomStart = fromYear;
            zoomEnd = toYear;
        }
    }

    const words = mapped.token4
        ? mapped.token4.split(',').map((word) => word.trim()).filter(Boolean)
        : [];

    const graphType = MODE_BY_TOKEN_2[mapped.token2] || 'relative';
    const corpus = CORPUS_BY_TOKEN_3[mapped.token3] || 'bok';
    const lang = corpus === 'avis' ? 'nob' : (LANG_BY_TOKEN_5[mapped.token5] || 'nob');
    const capitalization = CASE_SENSITIVE_TOKEN_VALUES.has((mapped.token6 || '').toLowerCase());
    const smoothing = Number.parseInt(mapped.token7, 10);

    return {
        words,
        graphType,
        corpus,
        lang,
        capitalization,
        smoothing: Number.isFinite(smoothing) ? smoothing : DEFAULT_STATE.smoothing,
        scaling: DEFAULT_STATE.scaling,
        curvePattern: DEFAULT_STATE.curvePattern,
        zoomStart,
        zoomEnd
    };
};
