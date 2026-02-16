import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { MIN_YEAR, MAX_YEAR } from '../services/ngramProcessor';

const AppHeader = ({ data, query, settings }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [copyStatus, setCopyStatus] = useState('');
    const dropdownRef = useRef(null);

    const shareUrl = useMemo(() => {
        const params = new URLSearchParams({
            terms: (query?.words || []).join(','),
            mode: query?.graphType || 'relative',
            corpus: query?.corpus || 'bok',
            lang: query?.lang || 'nob',
            case: settings?.capitalization ? '1' : '0',
            smooth: String(settings?.smoothing ?? 3),
            scale: String(settings?.scaling ?? 'auto'),
            from: String(settings?.zoomStart ?? MIN_YEAR),
            to: String(settings?.zoomEnd ?? MAX_YEAR)
        });

        const url = new URL(window.location.href);
        url.hash = `v2?${params.toString()}`;
        return url.toString();
    }, [query, settings]);

    const copyShareLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopyStatus('Lenke kopiert');
        } catch {
            setCopyStatus('Kunne ikke kopiere lenken');
        }
        setIsOpen(false);
        setTimeout(() => setCopyStatus(''), 2000);
    };

    const downloadChartImage = () => {
        const canvas = document.querySelector('canvas');
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `ngram_graph_${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        setIsOpen(false);
    };

    const downloadDataFrameExcel = () => {
        if (!data?.series || !data?.dates) return;

        const worksheetData = [
            ['Year', ...data.series.map((series) => series.name)],
            ...data.dates.map((year, index) => {
                const values = data.series.map((series) => series.data[index]);
                return [year, ...values];
            })
        ];

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Ngram Data');
        XLSX.writeFile(workbook, `ngram_data_${new Date().toISOString().split('T')[0]}.xlsx`);
        setIsOpen(false);
    };

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const onPointerDownOutside = (event) => {
            if (!dropdownRef.current?.contains(event.target)) {
                setIsOpen(false);
            }
        };

        const onEscape = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', onPointerDownOutside);
        document.addEventListener('touchstart', onPointerDownOutside);
        document.addEventListener('keydown', onEscape);

        return () => {
            document.removeEventListener('mousedown', onPointerDownOutside);
            document.removeEventListener('touchstart', onPointerDownOutside);
            document.removeEventListener('keydown', onEscape);
        };
    }, [isOpen]);

    return (
        <header className="header">
            <div className="header__wrapper">
                <div className="logo-title-container">
                    <a
                        href="https://www.nb.no/"
                        target="_blank"
                        rel="noreferrer"
                        className="brand-link"
                        aria-label="Ga tilbake til nb.no"
                    >
                        <span className="brand-main">Nasjonalbiblioteket</span>
                        <span className="brand-sub">N-gram</span>
                    </a>
                </div>

                <div className="search-dropdown-wrapper">
                    <div className="dropdown" ref={dropdownRef}>
                        <button
                            type="button"
                            className="custom-button no-border dropdown-button"
                            onClick={() => setIsOpen((prev) => !prev)}
                        >
                            Delingsalternativer
                        </button>
                        {isOpen && (
                            <div className="dropdown-content">
                                <button type="button" className="sharing-link" onClick={downloadDataFrameExcel} disabled={!data?.series}>
                                    Dataramme (.xlsx)
                                </button>
                                <button type="button" className="sharing-link" onClick={downloadChartImage}>
                                    Grafikk (.png)
                                </button>
                                <button type="button" className="sharing-link" onClick={copyShareLink}>
                                    Kopier lenken til n-grammet
                                </button>
                                {copyStatus && <span className="copy-status">{copyStatus}</span>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default AppHeader;
