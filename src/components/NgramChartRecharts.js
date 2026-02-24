import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { Chart, registerables } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { MIN_YEAR, MAX_YEAR } from '../services/ngramProcessor';
import { FaUndo } from 'react-icons/fa';

const AUTO_PERCENT_THRESHOLD = 0.01;
const PERCENT_SCALING = 100;
const PPM_SCALING = 1000000;
const TRACKER_ALPHA = 0.65;
const TRACKER_HOVER_RADIUS = 6;
const TRACKER_HIT_RADIUS = 10;
const DASH_PATTERNS = [
    [],
    [6, 3],
    [2, 2],
    [10, 3],
    [8, 2, 2, 2]
];
const POINT_STYLES = ['circle', 'rectRot', 'triangle', 'rect', 'cross'];
const clampYear = (value, min, max) => Math.min(max, Math.max(min, value));
const formatNumberNoGrouping = (value, maxDecimals = 6) => (
    new Intl.NumberFormat('no-NO', {
        useGrouping: false,
        maximumFractionDigits: maxDecimals
    }).format(value)
);
const withAlpha = (color, alpha = TRACKER_ALPHA) => {
    if (typeof color !== 'string') {
        return color;
    }

    const normalized = color.trim();
    if (!normalized.startsWith('#')) {
        return color;
    }

    let hex = normalized.slice(1);
    if (hex.length === 3) {
        hex = hex.split('').map((char) => char + char).join('');
    }
    if (hex.length !== 6) {
        return color;
    }

    const r = Number.parseInt(hex.slice(0, 2), 16);
    const g = Number.parseInt(hex.slice(2, 4), 16);
    const b = Number.parseInt(hex.slice(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Register Chart.js components and zoom plugin
Chart.register(...registerables, zoomPlugin);

const colorPalettes = {
    standard: [
        '#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8',
        '#6f42c1', '#fd7e14', '#20c997', '#6610f2', '#343a40'
    ],
    colorblind: [
        '#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2',
        '#D55E00', '#CC79A7', '#999999', '#000000', '#FFFFFF'
    ],
    bw: [
        '#000000', '#CCCCCC', '#AAAAAA', '#F5F5F5', '#888888',
        '#EEEEEE', '#DDDDDD', '#444444', '#222222', '#666666'
    ]
};

const NgramChartRecharts = ({ data, graphType = 'relative', settings = {
    capitalization: false, 
    smoothing: 4,
    zoomStart: MIN_YEAR,
    zoomEnd: MAX_YEAR
}, corpus: corpusType, onSettingsChange }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const zoomWindowRef = useRef(null);
    const previousHomeRangeRef = useRef({ zoomStart: settings.zoomStart, zoomEnd: settings.zoomEnd });
    const lastZoomOrPanAtRef = useRef(0);
    const [isZoomed, setIsZoomed] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedWord, setSelectedWord] = useState(null);
    const [showPeriodControl, setShowPeriodControl] = useState(false);
    const palette = settings.palette || 'standard';
    const colors = useMemo(() => colorPalettes[palette] || colorPalettes.standard, [palette]);
    const [isNarrow, setIsNarrow] = useState(false);
    // Add resize observer to detect container width
    useEffect(() => {
        const observedElement = chartRef.current ? chartRef.current.parentElement : null;
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const width = entry.contentRect.width;
                setIsNarrow(width < 992); // Bootstrap's lg breakpoint
            }
        });
        
        if (observedElement) {
            resizeObserver.observe(observedElement);
        }

        return () => {
            if (observedElement) {
                resizeObserver.unobserve(observedElement);
            }
        };
    }, []);

    const handleChartClick = useCallback((event) => {
        const chart = chartInstance.current;
        if (!chart) return;

        // Prevent click action immediately after zoom/pan drag end.
        if (Date.now() - lastZoomOrPanAtRef.current < 300) {
            return;
        }

        // Check if we're in the middle of a zoom operation
        if (event.native?.ctrlKey || event.native?.shiftKey) {
            return;  // Don't trigger search during zoom
        }

        const elements = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, false);
        if (elements.length === 0) return;

        const element = elements[0];
        const datasetIndex = element.datasetIndex;
        const dataIndex = element.index;
        
        const year = data.dates[dataIndex];
        const word = data.series[datasetIndex].name;
        
        setSelectedYear(year);
        setSelectedWord(word);
        setShowSearchModal(true);
    }, [data]);

    const openSearch = (period) => {
        if (!selectedWord || !selectedYear) return;

        let fromDate, toDate;
        const year = parseInt(selectedYear);
        
        switch(period) {
            case 'exact':
                fromDate = `${year}0101`;
                toDate = `${year}1231`;
                break;
            case 'range':
                fromDate = `${year - 5}0101`;
                toDate = `${year + 5}1231`;
                break;
            case 'open':
                fromDate = '';
                toDate = '';
                break;
            default:
                fromDate = '';
                toDate = '';
                break;
        }

        const mediatype = corpusType === 'avis' ? 'aviser' : 'bøker';
        const searchUrl = `https://www.nb.no/search?q="${encodeURIComponent(selectedWord)}"&mediatype=${mediatype}${fromDate ? `&fromDate=${fromDate}` : ''}${toDate ? `&toDate=${toDate}` : ''}`;
        window.open(searchUrl, '_blank');
        setShowSearchModal(false);
    };

    const resetZoom = () => {
        if (chartInstance.current) {
            chartInstance.current.resetZoom();
            zoomWindowRef.current = null;
            setIsZoomed(false);
        }
    };

    const handleHomeRangeStartChange = (nextValueRaw) => {
        if (!onSettingsChange) {
            return;
        }
        const nextValue = clampYear(Number.parseInt(nextValueRaw, 10), MIN_YEAR, settings.zoomEnd ?? MAX_YEAR);
        onSettingsChange({ zoomStart: nextValue });
    };

    const handleHomeRangeEndChange = (nextValueRaw) => {
        if (!onSettingsChange) {
            return;
        }
        const nextValue = clampYear(Number.parseInt(nextValueRaw, 10), settings.zoomStart ?? MIN_YEAR, MAX_YEAR);
        onSettingsChange({ zoomEnd: nextValue });
    };

    useEffect(() => {
        const previous = previousHomeRangeRef.current;
        if (
            previous.zoomStart !== settings.zoomStart ||
            previous.zoomEnd !== settings.zoomEnd
        ) {
            // Home range changed: clear preserved zoom so new period applies immediately.
            zoomWindowRef.current = null;
            setIsZoomed(false);
            previousHomeRangeRef.current = {
                zoomStart: settings.zoomStart,
                zoomEnd: settings.zoomEnd
            };
        }
    }, [settings.zoomStart, settings.zoomEnd]);

    useEffect(() => {
        if (!data || !data.series) return;

        const maxRelativePercent = data.series.reduce((maxValue, series) => {
            const seriesMax = series.data.reduce(
                (seriesValue, point) => Math.max(seriesValue, Number(point) || 0),
                0
            );
            return Math.max(maxValue, seriesMax);
        }, 0);

        const requestedScaling = settings.scaling ?? 'auto';
        const effectiveScaling = graphType !== 'relative'
            ? PERCENT_SCALING
            : (requestedScaling === 'auto'
                ? (maxRelativePercent >= AUTO_PERCENT_THRESHOLD ? PERCENT_SCALING : PPM_SCALING)
                : Number.parseInt(requestedScaling, 10) || PERCENT_SCALING);
        const scalingFactor = effectiveScaling / 100;
        const relativeUnitLabel = effectiveScaling === PPM_SCALING ? 'ppm' : '%';
        const lineAlpha = Math.max(0.05, Math.min(1, 1 - (settings.lineTransparency ?? 0)));


        // Transform data for Chart.js
        const labels = data.dates;
        const datasets = data.series.map((series, index) => {
            let values = [...series.data];
            const baseColor = settings?.curvePattern ? '#000000' : colors[index % colors.length];
            const patternIndex = index % DASH_PATTERNS.length;
            const variantCycle = Math.floor(index / DASH_PATTERNS.length);
            const withMarker = settings?.curvePattern && variantCycle > 0;
            const markerStyle = POINT_STYLES[(variantCycle - 1) % POINT_STYLES.length] || 'circle';
            
            // Apply smoothing if enabled
            if (settings.smoothing > 0) {
                const smoothed = [];
                for (let i = 0; i < values.length; i++) {
                    const start = Math.max(0, i - Math.floor(settings.smoothing / 2));
                    const end = Math.min(values.length - 1, i + Math.floor(settings.smoothing / 2));
                    const window = values.slice(start, end + 1);
                    const avg = window.reduce((sum, val) => sum + val, 0) / window.length;
                    smoothed.push(avg);
                }
                values = smoothed;
            }
            
            // Handle cumulative data
            if (graphType === 'cumulative') {
                let sum = 0;
                values = values.map(val => {
                    sum += val;
                    return sum;
                });
            }
            
            // Remove unnecessary absolute value conversion
            // The API already provides absolute counts in the 'f' field
            
            // Handle cohort data
            if (graphType === 'cohort') {
                // Calculate yearly totals across all words
                const yearlyTotals = data.series.reduce((totals, series) => {
                    series.data.forEach((value, index) => {
                        if (!totals[index]) totals[index] = 0;
                        totals[index] += value;
                    });
                    return totals;
                }, {});

                // Calculate proportions within each year
                values = values.map((value, index) => {
                    const yearTotal = yearlyTotals[index];
                    return yearTotal > 0 ? value / yearTotal : 0;
                });
            }

            // Legg til multiplikator for relativ visning
                if (graphType === 'relative') {
                    values = values.map(v => v * scalingFactor);
                }
            return {
                label: series.name,
                data: values,
                borderColor: withAlpha(baseColor, lineAlpha),
                backgroundColor: settings?.curvePattern ? 'rgba(0,0,0,0)' : baseColor,
                borderWidth: settings?.lineThickness || 2,
                pointRadius: withMarker ? 2 : 0,
                pointHoverRadius: TRACKER_HOVER_RADIUS,
                pointHitRadius: TRACKER_HIT_RADIUS,
                pointStyle: withMarker
                    ? markerStyle
                    : 'circle',
                tension: 0.4,
                showLine: true,
                borderDash: settings?.curvePattern
                    ? DASH_PATTERNS[patternIndex]
                    : [],
                pointBackgroundColor: withAlpha(baseColor, Math.min(0.55, lineAlpha)),
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            };
        });

        const ctx = chartRef.current.getContext('2d');

        // Destroy existing chart if it exists
        if (chartInstance.current) {
            const existingMin = Number(chartInstance.current.scales?.x?.min);
            const existingMax = Number(chartInstance.current.scales?.x?.max);
            if (Number.isFinite(existingMin) && Number.isFinite(existingMax) && existingMax > existingMin) {
                zoomWindowRef.current = { min: existingMin, max: existingMax };
            }
            chartInstance.current.destroy();
        }

        const lastYear = data?.dates?.length ? data.dates[data.dates.length - 1] : MAX_YEAR;
        const chartMaxYear = Math.min(settings.zoomEnd, lastYear);
        const savedZoom = zoomWindowRef.current;
        const initialXMin = savedZoom
            ? Math.max(settings.zoomStart, Math.floor(savedZoom.min))
            : settings.zoomStart;
        const initialXMax = savedZoom
            ? Math.min(chartMaxYear, Math.ceil(savedZoom.max))
            : chartMaxYear;

        // Create new chart
        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false, // Disable animations for better performance
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'x',
                            modifierKey: 'ctrl',
                            onPan: () => {
                                lastZoomOrPanAtRef.current = Date.now();
                                if (chartInstance.current?.scales?.x) {
                                    const min = Number(chartInstance.current.scales.x.min);
                                    const max = Number(chartInstance.current.scales.x.max);
                                    if (Number.isFinite(min) && Number.isFinite(max) && max > min) {
                                        zoomWindowRef.current = { min, max };
                                    }
                                }
                                setIsZoomed((prev) => (prev ? prev : true));
                            }
                        },
                        zoom: {
                            wheel: {
                                enabled: true,
                                modifierKey: 'ctrl',
                            },
                            pinch: {
                                enabled: true
                            },
                            drag: {
                                enabled: true,
                                backgroundColor: 'rgba(0,0,0,0.1)',
                                borderColor: 'rgba(0,0,0,0.3)',
                                borderWidth: 1
                            },
                            mode: 'x',
                            onZoom: ({ chart }) => {
                                lastZoomOrPanAtRef.current = Date.now();
                                const min = Number(chart?.scales?.x?.min);
                                const max = Number(chart?.scales?.x?.max);
                                if (Number.isFinite(min) && Number.isFinite(max) && max > min) {
                                    zoomWindowRef.current = { min, max };
                                }
                                setIsZoomed((prev) => (prev ? prev : true));
                            },
                            onZoomComplete: () => {
                                lastZoomOrPanAtRef.current = Date.now();
                                if (chartInstance.current?.scales?.x) {
                                    const min = Number(chartInstance.current.scales.x.min);
                                    const max = Number(chartInstance.current.scales.x.max);
                                    if (Number.isFinite(min) && Number.isFinite(max) && max > min) {
                                        zoomWindowRef.current = { min, max };
                                    }
                                }
                            }
                        },
                        limits: {
                            x: {
                                min: settings.zoomStart,
                                max: settings.zoomEnd,
                                minRange: 5
                            }
                        }
                    },
                    legend: {
                        position: isNarrow ? 'bottom' : 'right',
                        align: 'start',
                        labels: {
                            boxWidth: settings?.curvePattern ? 20 : 12,
                            padding: 15,
                            usePointStyle: !settings?.curvePattern,
                            pointStyle: 'circle',
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        enabled: true,
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(238, 238, 238, 0.96)',
                        titleColor: '#1f1f1f',
                        bodyColor: '#1f1f1f',
                        borderColor: '#d2d2d2',
                        borderWidth: 1,
                        callbacks: {
                            title: function(context) {
                                const point = context?.[0];
                                const parsedYear = Number(point?.parsed?.x);
                                if (Number.isFinite(parsedYear)) {
                                    return String(Math.round(parsedYear));
                                }

                                const fallbackLabel = String(point?.label ?? '').replace(/[^\d.-]/g, '');
                                const fallbackYear = Number(fallbackLabel);
                                return Number.isFinite(fallbackYear) ? String(Math.round(fallbackYear)) : '';
                            },
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += formatNumberNoGrouping(context.parsed.y);
                                    if (graphType === 'relative') {
                                        label += ` ${relativeUnitLabel}`;
                                    }
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        min: initialXMin,
                        max: initialXMax,
                        ticks: {
                            callback: function(value) {
                                return String(Math.round(value));
                            },
                            stepSize: 1,
                            autoSkip: true,         // Legg til denne
                            maxTicksLimit: 10       // begrenser antall ticks
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: graphType === 'relative',
                            text: graphType === 'relative' ? `Frekvens (${relativeUnitLabel})` : ''
                        },
                        ticks: {
                            callback: function(value) {
                                const formatted = formatNumberNoGrouping(value);
                                return graphType === 'relative' ? `${formatted} ${relativeUnitLabel}` : formatted;
                            }
                        }
                    }
                },
                onClick: handleChartClick
            }
        });

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [data, graphType, settings.smoothing, settings.lineThickness, settings.lineTransparency, settings.curvePattern, isNarrow, settings.zoomStart, settings.zoomEnd, settings.scaling, colors, handleChartClick]);

    return (
        <div className="d-flex flex-column flex-lg-row gap-3">
            <div className="flex-grow-1">
                <div style={{ minHeight: '400px', position: 'relative' }}>
                    <canvas ref={chartRef} style={{ touchAction: 'none', userSelect: 'none' }}></canvas>
                </div>
                {!isZoomed && (
                    <div className="text-center mt-2">
                        <small className="text-muted">
                            Klikk og dra for å zoome.
                        </small>
                    </div>
                )}
                {isZoomed && (
                    <div className="text-center mt-2">
                        <small className="text-muted">
                            Zoom aktiv. Klikk{' '}
                            <button
                                type="button"
                                onClick={resetZoom}
                                style={{
                                    border: 'none',
                                    background: 'none',
                                    padding: 0,
                                    margin: 0,
                                    color: 'inherit',
                                    textDecoration: 'underline',
                                    cursor: 'pointer'
                                }}
                                aria-label="Gå tilbake eller zoome ut"
                            >
                                her <FaUndo style={{ marginTop: '-2px' }} />
                            </button>{' '}
                            for å zoome ut.
                        </small>
                    </div>
                )}
                <div className="text-center mt-2">
                    <button
                        type="button"
                        className="btn btn-link p-0"
                        onClick={() => setShowPeriodControl((prev) => !prev)}
                        aria-expanded={showPeriodControl}
                    >
                        {showPeriodControl ? 'Skjul periodekontroll' : 'Vis periodekontroll'}
                    </button>
                </div>
                {showPeriodControl && (
                    <div
                        className="mt-2 p-3"
                        style={{
                            border: '1px solid var(--color-border-subtle)',
                            borderRadius: '8px',
                            backgroundColor: 'var(--color-bg-soft)'
                        }}
                    >
                        <div className="small help-muted mb-2">
                            Periodekontroll setter anker for start/slutt i zoom-home. Interaktiv zoom skjer innenfor dette intervallet.
                        </div>
                        <div className="mb-2">
                            <Form.Label className="mb-1">Startår: {settings.zoomStart}</Form.Label>
                            <Form.Range
                                min={MIN_YEAR}
                                max={settings.zoomEnd ?? MAX_YEAR}
                                value={settings.zoomStart ?? MIN_YEAR}
                                onChange={(e) => handleHomeRangeStartChange(e.target.value)}
                            />
                        </div>
                        <div>
                            <Form.Label className="mb-1">Sluttår: {settings.zoomEnd}</Form.Label>
                            <Form.Range
                                min={settings.zoomStart ?? MIN_YEAR}
                                max={MAX_YEAR}
                                value={settings.zoomEnd ?? MAX_YEAR}
                                onChange={(e) => handleHomeRangeEndChange(e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </div>
            <div className="d-flex flex-column justify-content-center">
                <div className="chart-legend"></div>
            </div>
            <Modal show={showSearchModal} onHide={() => setShowSearchModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        Søk i Nasjonalbiblioteket: {selectedWord ? `"${selectedWord}"` : ''}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        Velg tidsperiode for {selectedWord ? `"${selectedWord}"` : 'ordet'}{selectedYear ? ` (${selectedYear})` : ''}:
                    </p>
                    <div className="d-flex gap-2">
                        <Button variant="outline-primary" onClick={() => openSearch('exact')}>
                            Nøyaktig år
                        </Button>
                        <Button variant="outline-primary" onClick={() => openSearch('range')}>
                            ±5 år
                        </Button>
                        <Button variant="outline-primary" onClick={() => openSearch('open')}>
                            Hele perioden
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default NgramChartRecharts; 