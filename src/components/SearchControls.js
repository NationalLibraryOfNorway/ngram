import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Form, Button, ButtonGroup, InputGroup, Modal } from 'react-bootstrap';
import { FaSearch, FaTools, FaDownload } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { MIN_YEAR, MAX_YEAR } from '../services/ngramProcessor';
import { parseLegacyHash } from '../services/legacyHash';

const DEFAULT_START_TERM = 'demokrati';
const clampYear = (value, min, max) => Math.min(max, Math.max(min, value));
const sanitizeZoomRange = (startCandidate, endCandidate) => {
    const fallbackStart = Number.isFinite(startCandidate) ? startCandidate : MIN_YEAR;
    const fallbackEnd = Number.isFinite(endCandidate) ? endCandidate : MAX_YEAR;
    const clampedStart = clampYear(fallbackStart, MIN_YEAR, MAX_YEAR);
    const clampedEnd = clampYear(fallbackEnd, MIN_YEAR, MAX_YEAR);

    if (clampedStart <= clampedEnd) {
        return { start: clampedStart, end: clampedEnd };
    }

    return { start: clampedEnd, end: clampedStart };
};

const SearchControls = ({ onSearch, onGraphTypeChange, data, settings, onSettingsChange }) => {
    const legacyState = useMemo(() => parseLegacyHash(window.location.hash), []);
    const initialZoomRange = useMemo(
        () => sanitizeZoomRange(legacyState.zoomStart, legacyState.zoomEnd),
        [legacyState.zoomStart, legacyState.zoomEnd]
    );
    const initialWords = legacyState.words.length > 0 ? legacyState.words.join(', ') : '';
    const [words, setWords] = useState(initialWords);
    const [corpus, setCorpus] = useState(legacyState.corpus || 'bok');
    const [lang, setLang] = useState(legacyState.lang || 'nob');
    const [graphType, setGraphType] = useState(legacyState.graphType || 'relative');
    const [showModal, setShowModal] = useState(false);
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    const [showCorpusDropdown, setShowCorpusDropdown] = useState(false);
    const [showGraphTypeDropdown, setShowGraphTypeDropdown] = useState(false);
    const [showToolsModal, setShowToolsModal] = useState(false);
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [capitalization, setCapitalization] = useState(Boolean(legacyState.capitalization));
    const [smoothing, setSmoothing] = useState(legacyState.smoothing ?? 4);
    const [lineThickness, setLineThickness] = useState(3);
    const [lineTransparency, setLineTransparency] = useState(0.1);
    const [curvePattern, setCurvePattern] = useState(Boolean(legacyState.curvePattern));
    const [palette, setPalette] = useState('standard');
    const palettes = [
        { id: 'standard', label: 'Standard' },
        { id: 'colorblind', label: 'Fargeblindvennlig' },
        { id: 'bw', label: 'Svart/hvitt' }
    ];
    const [scaling, setScaling] = useState(legacyState.scaling || 'auto');
    const [zoomStart, setZoomStart] = useState(initialZoomRange.start);
    const [zoomEnd, setZoomEnd] = useState(initialZoomRange.end);

    useEffect(() => {
        const syncedRange = sanitizeZoomRange(settings?.zoomStart, settings?.zoomEnd);
        if (syncedRange.start !== zoomStart) {
            setZoomStart(syncedRange.start);
        }
        if (syncedRange.end !== zoomEnd) {
            setZoomEnd(syncedRange.end);
        }
    }, [settings?.zoomStart, settings?.zoomEnd, zoomStart, zoomEnd]);

    const emitSettings = useCallback((overrides = {}) => {
        onSettingsChange?.({
            capitalization,
            smoothing,
            lineThickness,
            lineTransparency,
            curvePattern,
            scaling,
            palette,
            zoomStart,
            zoomEnd,
            ...overrides
        });
    }, [onSettingsChange, capitalization, smoothing, lineThickness, lineTransparency, curvePattern, scaling, palette, zoomStart, zoomEnd]);
    const updateCapitalization = (newValue) => {
        setCapitalization(newValue);
        emitSettings({ capitalization: newValue });
        // Trigger a new search with updated capitalization setting
        if (words) {
            performSearch();
        }
    };

    const latestWordsRef = useRef(words);
    const onSearchRef = useRef(onSearch);
    const langDropdownRef = useRef(null);
    const corpusDropdownRef = useRef(null);
    const graphTypeDropdownRef = useRef(null);

    useEffect(() => {
        latestWordsRef.current = words;
    }, [words]);

    useEffect(() => {
        onSearchRef.current = onSearch;
    }, [onSearch]);

    useEffect(() => {
        if (!showLangDropdown && !showCorpusDropdown && !showGraphTypeDropdown) {
            return;
        }

        const handlePointerDownOutside = (event) => {
            const target = event.target;
            if (
                !langDropdownRef.current?.contains(target) &&
                !corpusDropdownRef.current?.contains(target) &&
                !graphTypeDropdownRef.current?.contains(target)
            ) {
                setShowLangDropdown(false);
                setShowCorpusDropdown(false);
                setShowGraphTypeDropdown(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setShowLangDropdown(false);
                setShowCorpusDropdown(false);
                setShowGraphTypeDropdown(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDownOutside);
        document.addEventListener('touchstart', handlePointerDownOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handlePointerDownOutside);
            document.removeEventListener('touchstart', handlePointerDownOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [showLangDropdown, showCorpusDropdown, showGraphTypeDropdown]);

    const performSearch = () => {
        const wordList = words.split(',')
            .map(w => w.trim())
            .filter(w => w.length > 0);
        
        if (wordList.length === 0) {
            return;
        }

        onSearchRef.current(wordList, corpus, lang, graphType);
    };

    // Trigger search when parameters change
    useEffect(() => {
        const currentWords = latestWordsRef.current;
        const wordList = currentWords
            .split(',')
            .map(w => w.trim())
            .filter(w => w.length > 0);

        if (wordList.length > 0) {
            onSearchRef.current(wordList, corpus, lang, graphType);
        }
    }, [corpus, lang, graphType]);

    useEffect(() => {
        if (legacyState.words.length === 0) {
            onSearchRef.current([DEFAULT_START_TERM], corpus, lang, graphType);
            return;
        }

        onGraphTypeChange(legacyState.graphType || 'relative');
        const hydratedZoomRange = sanitizeZoomRange(legacyState.zoomStart, legacyState.zoomEnd);
        emitSettings({
            capitalization,
            smoothing,
            lineThickness,
            lineTransparency,
            curvePattern,
            scaling,
            palette,
            zoomStart: hydratedZoomRange.start,
            zoomEnd: hydratedZoomRange.end
        });
        // Intentionally run once for legacy hash hydration.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        performSearch();
    };

    const handleGraphTypeSelect = (type) => {
        setGraphType(type);
        onGraphTypeChange(type);
        setShowModal(false);
    };

    const graphTypes = [
        { id: 'relative', label: 'Relative Frequency' },
        { id: 'absolute', label: 'Absolute Frequency' },
        { id: 'cumulative', label: 'Cumulative Frequency' },
        { id: 'cohort', label: 'Cohort Analysis' }
    ];

    const languages = [
        { code: 'nob', label: 'Bokmål', fullName: 'Norsk bokmål' },
        { code: 'nno', label: 'Nynorsk', fullName: 'Norsk nynorsk' },
        { code: 'sme', label: 'Nordsamisk', fullName: 'Davvisámegiella' },
        { code: 'sma', label: 'Sørsamisk', fullName: 'Åarjelsaemien gïele' },
        { code: 'smj', label: 'Lulesamisk', fullName: 'Julevsámegiella' },
        { code: 'fkv', label: 'Kvensk', fullName: 'Kainun kieli' }
    ];

    const handleHiResDownloadPNG = () => {
    if (!data?.series) return;
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const scale = 4; // Gir god kvalitet for publisering
    const hiResCanvas = document.createElement('canvas');
    hiResCanvas.width = canvas.width * scale;
    hiResCanvas.height = canvas.height * scale;
    const ctx = hiResCanvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.drawImage(canvas, 0, 0);

    const link = document.createElement('a');
    link.download = `ngram_graph_hires_${new Date().toISOString().split('T')[0]}.png`;
    link.href = hiResCanvas.toDataURL('image/png');
    link.click();
    setShowDownloadModal(false);
};

const handleHiResDownloadJPG = () => {
    if (!data?.series) return;
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const scale = 4; // Gir god kvalitet for publisering
    const hiResCanvas = document.createElement('canvas');
    hiResCanvas.width = canvas.width * scale;
    hiResCanvas.height = canvas.height * scale;
    const ctx = hiResCanvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.drawImage(canvas, 0, 0);

    const link = document.createElement('a');
    link.download = `ngram_graph_hires_${new Date().toISOString().split('T')[0]}.jpg`;
    link.href = hiResCanvas.toDataURL('image/jpeg', 1.0);
    link.click();
    setShowDownloadModal(false);
};

    const handleDownloadCSV = () => {
        if (!data?.series) return;
        // Create CSV content
        const headers = ['Year', ...data.series.map(s => s.name)];
        const rows = data.dates.map((year, i) => {
            const values = data.series.map(s => s.data[i]);
            return [year, ...values];
        });
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ngram_data_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShowDownloadModal(false);
    };

    const handleDownloadExcel = () => {
        if (!data?.series) return;
        // Create Excel workbook
        const wb = XLSX.utils.book_new();
        
        // Create worksheet data
        const wsData = [
            ['Year', ...data.series.map(s => s.name)],
            ...data.dates.map((year, i) => {
                const values = data.series.map(s => s.data[i]);
                return [year, ...values];
            })
        ];
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // Add metadata
        ws['!cols'] = [
            { wch: 10 }, // Year column width
            ...data.series.map(() => ({ wch: 15 })) // Data columns width
        ];
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'N-gram data');
        
        // Generate Excel file
        XLSX.writeFile(wb, `ngram_data_${new Date().toISOString().split('T')[0]}.xlsx`);
        setShowDownloadModal(false);
    };

    return (
        <div className="d-flex flex-column flex-md-row gap-3 align-items-start w-100">
            <div className="d-flex flex-column flex-md-row gap-3 align-items-start w-100">
                <Form onSubmit={handleSubmit} className="d-flex align-items-center gap-3 flex-grow-1">
                    <InputGroup className="flex-grow-1">
                        <Form.Control
                            type="text"
                            value={words}
                            onChange={(e) => setWords(e.target.value)}
                            placeholder={DEFAULT_START_TERM}
                            aria-label="Search words"
                            style={{ 
                                borderRight: 'none',
                                minWidth: '200px',
                                flex: '1 1 auto'
                            }}
                        />
                        <div className="dropdown" ref={langDropdownRef}>
                            <button
                                className="btn btn-outline-secondary dropdown-toggle"
                                type="button"
                                onClick={() => {
                                    setShowLangDropdown((prev) => !prev);
                                    setShowCorpusDropdown(false);
                                    setShowGraphTypeDropdown(false);
                                }}
                                style={{ 
                                    borderLeft: 'none',
                                    borderRadius: '0',
                                    borderTop: '1px solid #ced4da',
                                    borderBottom: '1px solid #ced4da',
                                    borderRight: '1px solid #ced4da'
                                }}
                                disabled={corpus === 'avis'}
                                title={languages.find(l => l.code === lang)?.fullName || lang}
                            >
                                {corpus === 'avis' ? 'nor' : lang}
                            </button>
                            {showLangDropdown && corpus !== 'avis' && (
                                <div className="dropdown-menu show">
                                    {languages.map(language => (
                                        <button
                                            key={language.code}
                                            className="dropdown-item"
                                            onClick={() => {
                                                setLang(language.code);
                                                setShowLangDropdown(false);
                                            }}
                                            title={language.fullName}
                                    >
                                            {language.label}
                                        </button>
                                ))}
                                </div>
                            )}
                        </div>
                        <Button 
                            variant="outline-secondary" 
                            type="submit"
                            title="Search"
                            style={{
                                backgroundColor: 'white',
                                border: '1px solid #ced4da',
                                borderLeft: 'none',
                                color: '#212529'
                            }}
                        >
                            <FaSearch />
                        </Button>
                    </InputGroup>
                </Form>

                    <div className="d-flex gap-2">
                    <ButtonGroup>
                        <div className="dropdown" ref={corpusDropdownRef}>
                            <button
                                className="btn btn-outline-secondary dropdown-toggle"
                                type="button"
                                onClick={() => {
                                    setShowCorpusDropdown((prev) => !prev);
                                    setShowLangDropdown(false);
                                    setShowGraphTypeDropdown(false);
                                }}
                                style={{ 
                                    border: 'none'
                                }}
                            >
                                {corpus}
                            </button>
                            {showCorpusDropdown && (
                                <div className="dropdown-menu show">
                                    <button
                                        className="dropdown-item"
                                        onClick={() => {
                                            setCorpus('bok');
                                            setShowCorpusDropdown(false);
                                        }}
                                    >
                                        bok
                                    </button>
                                    <button
                                        className="dropdown-item"
                                        onClick={() => {
                                            setCorpus('avis');
                                            setShowCorpusDropdown(false);
                                        }}
                                    >
                                        avis
                                    </button>
                                </div>
                            )}
                        </div>
                    </ButtonGroup>

                    <div className="dropdown" ref={graphTypeDropdownRef}>
                        <button
                            className="btn btn-outline-secondary dropdown-toggle d-flex align-items-center"
                            type="button"
                            onClick={() => {
                                setShowGraphTypeDropdown((prev) => !prev);
                                setShowLangDropdown(false);
                                setShowCorpusDropdown(false);
                            }}
                            style={{ 
                                border: 'none',
                                position: 'relative',
                                zIndex: 1001,
                                minWidth: '120px'
                            }}
                            >
                            {graphType === 'relative' ? 'relativ' :
                             graphType === 'absolute' ? 'absolutt' :
                             graphType === 'cumulative' ? 'kumulativ' :
                             graphType === 'cohort' ? 'kohort' :
                             'kohort'}
                        </button>
                        {showGraphTypeDropdown && (
                            <div className="dropdown-menu show d-flex flex-column" style={{ 
                                position: 'absolute',
                                zIndex: 1000,
                                top: '100%',
                                left: 0,
                                marginTop: '0.125rem',
                                minWidth: '120px'
                            }}>
                                <button className="dropdown-item" onClick={() => {
                                    handleGraphTypeSelect('relative');
                                    setShowGraphTypeDropdown(false);
                                }}>relativ</button>
                                <button className="dropdown-item" onClick={() => {
                                    handleGraphTypeSelect('absolute');
                                    setShowGraphTypeDropdown(false);
                                }}>absolutt</button>
                                <button className="dropdown-item" onClick={() => {
                                    handleGraphTypeSelect('cumulative');
                                    setShowGraphTypeDropdown(false);
                                }}>kumulativ</button>
                                <button className="dropdown-item" onClick={() => {
                                    handleGraphTypeSelect('cohort');
                                    setShowGraphTypeDropdown(false);
                                }}>kohort</button>
                            </div>
                        )}
                    </div>

                    <div className="d-flex gap-2">
                        <Button 
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => setShowDownloadModal(true)}
                            style={{ 
                                border: 'none',
                                backgroundColor: 'white'
                            }}
                        >
                            <FaDownload />
                        </Button>
                        <Button 
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => setShowToolsModal(true)}
                            style={{ 
                                border: 'none',
                                backgroundColor: 'white'
                            }}
                        >
                            <FaTools />
                        </Button>
                    </div>
                </div>
            </div>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Select Graph Type</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="d-grid gap-2">
                        {graphTypes.map(type => (
                            <Button
                                key={type.id}
                                variant={graphType === type.id ? 'primary' : 'outline-primary'}
                                onClick={() => handleGraphTypeSelect(type.id)}
                                className="text-start"
                            >
                                {type.label}
                            </Button>
                        ))}
                    </div>
                </Modal.Body>
            </Modal>

            <Modal show={showDownloadModal} onHide={() => setShowDownloadModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Last ned graf</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="d-grid gap-3">
                        <Button
                            variant="outline-primary"
                            onClick={handleHiResDownloadPNG}
                        >
                            Last ned høyoppløselig PNG
                        </Button>
                        <Button
                            variant="outline-primary"
                            onClick={handleHiResDownloadJPG}
                        >
                            Last ned høyoppløselig JPG
                        </Button>
                        <Button
                            variant="outline-primary"
                            onClick={handleDownloadCSV}
                        >
                            Last ned som CSV
                        </Button>
                        <Button
                            variant="outline-success"
                            onClick={handleDownloadExcel}
                        >
                            Last ned som Excel
                        </Button>
                    </div>
                    <div className="mt-3 text-muted help-muted" style={{fontSize: '0.95em'}}>
                        Bildene egner seg for bruk i publikasjoner og tidsskrifter.
                    </div>
                </Modal.Body>
            </Modal>

            <Modal show={showToolsModal} onHide={() => setShowToolsModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Verktøy</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="d-grid gap-3">
                        <div> 
                            <strong className="help-section-title">Grafinnstillinger</strong>
                            <div style={{ paddingLeft: '1em' }}>
                                <div className="settings-option-card">
                                    <Form.Label>Utjevning av kurve: {smoothing} år</Form.Label>
                                    <div style={{ paddingLeft: '1.1em' }}>
                                        <Form.Range
                                            min={0}
                                            max={20}
                                            value={smoothing}
                                            onChange={(e) => {
                                                const newValue = parseInt(e.target.value);
                                                setSmoothing(newValue);
                                                emitSettings({ smoothing: newValue });
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="settings-option-card">
                                    <Form.Label>Fargepalett</Form.Label>
                                    <Form.Select
                                        value={palette}
                                        onChange={e => {
                                            const newValue = e.target.value;
                                            setPalette(newValue);
                                            emitSettings({ palette: newValue });
                                        }}
                                    >
                                        {palettes.map(p => (
                                            <option key={p.id} value={p.id}>{p.label}</option>
                                        ))}
                                    </Form.Select>
                                </div>
                                <div className="settings-option-card">
                                    <Form.Label>Linjetykkelse: {lineThickness}px</Form.Label>
                                    <div style={{ paddingLeft: '1.1em' }}>
                                        <Form.Range
                                            min={1}
                                            max={10}
                                            value={lineThickness}
                                            onChange={(e) => {
                                                const newValue = parseInt(e.target.value);
                                                setLineThickness(newValue);
                                                emitSettings({ lineThickness: newValue });
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="settings-option-card d-flex align-items-center justify-content-between">
                                    <Form.Label className="mb-0">Kurvemønster</Form.Label>
                                    <Form.Check
                                        type="switch"
                                        id="curve-pattern-switch"
                                        checked={curvePattern}
                                        onChange={(e) => {
                                            const enabled = e.target.checked;
                                            setCurvePattern(enabled);
                                            emitSettings({ curvePattern: enabled });
                                        }}
                                    />
                                </div>

                                <div className="settings-option-card">
                                    <Form.Label>Transparens: {Math.round(lineTransparency * 100)}%</Form.Label>
                                    <div style={{ paddingLeft: '1.1em' }}>
                                        <Form.Range
                                            min={0}
                                            max={100}
                                            value={lineTransparency * 100}
                                            onChange={(e) => {
                                                const newValue = parseInt(e.target.value) / 100;
                                                setLineTransparency(newValue);
                                                emitSettings({ lineTransparency: newValue });
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <strong className="help-section-title">Akse og skala</strong>
                            <div style={{ paddingLeft: '1em' }}>
                                <div className="settings-option-card">
                                    <Form.Label>Skalering av y-aksen</Form.Label>
                                    <Form.Select
                                        value={scaling}
                                        onChange={e => {
                                            const value = e.target.value;
                                            setScaling(value);
                                            emitSettings({ scaling: value });
                                        }}
                                    >
                                        <option value="auto">Auto (% eller ppm)</option>
                                        <option value="100">Prosent (%)</option>
                                        <option value="1000000">PPM</option>
                                    </Form.Select>
                                    <div className="text-muted help-muted" style={{ fontSize: '0.9em', marginTop: '0.4rem' }}>
                                        Auto velger prosent eller ppm basert på datanivå.
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <strong className="help-section-title">Søk-innstillinger</strong>
                            <div style={{ paddingLeft: '1em' }}>
                                <div className="settings-option-card d-flex align-items-center justify-content-between">
                                    <Form.Label className="mb-0">Skill mellom stor og liten forbokstav</Form.Label>
                                    <Form.Check 
                                        type="switch"
                                        id="capitalization-switch"
                                        checked={capitalization}
                                        onChange={(e) => updateCapitalization(e.target.checked)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default SearchControls; 