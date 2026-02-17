import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Modal } from 'react-bootstrap';
import { MIN_YEAR, MAX_YEAR } from '../services/ngramProcessor';

const AppHeader = ({ data, query, settings }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showAbout, setShowAbout] = useState(false);
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
            pattern: settings?.curvePattern ? '1' : '0',
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
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 17 24"
                            height="22"
                            width="16"
                            aria-hidden="true"
                            className="brand-logo"
                        >
                            <path d="M1.4 7.8c.6 0 1.1-.5 1.1-1.1s-.5-1-1.1-1C.8 5.7.3 6.2.3 6.8c0 .5.5 1 1.1 1zM12.2 23.7c.6 0 1.1-.5 1.1-1.1 0-.6-.5-1.1-1.1-1.1-.6 0-1.1.5-1.1 1.1 0 .7.5 1.1 1.1 1.1zM4.1.3v19.8h12.6V.3H4.1zm2.7 7.5c-.6 0-1.1-.5-1.1-1.1s.5-1.1 1.1-1.1c.6 0 1.1.5 1.1 1.1s-.5 1.1-1.1 1.1zm5.3 10.6c-.6 0-1.1-.5-1.1-1.1s.5-1.1 1.1-1.1 1.1.5 1.1 1.1-.5 1.1-1.1 1.1zm0-5.3c-.6 0-1.1-.5-1.1-1.1s.5-1.1 1.1-1.1 1.1.5 1.1 1.1-.5 1.1-1.1 1.1zm0-5.3c-.6 0-1.1-.5-1.1-1.1s.5-1.1 1.1-1.1 1.1.5 1.1 1.1-.5 1.1-1.1 1.1z" />
                        </svg>
                        <span className="brand-main">Nasjonalbiblioteket</span>
                        <span className="brand-sub">N-gram</span>
                    </a>
                </div>

                <div className="search-dropdown-wrapper">
                    <div className="header-actions">
                        <button
                            type="button"
                            className="custom-button no-border dropdown-button"
                            onClick={() => setShowAbout(true)}
                        >
                            Om N-gram
                        </button>
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
            </div>
            <Modal show={showAbout} onHide={() => setShowAbout(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Om N-gram</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>N-gram viser hvordan ordbruk utvikler seg over tid i Nasjonalbibliotekets materialer.</p>

                    <div style={{ marginBottom: '0.75rem' }}>
                        <strong style={{ fontSize: '1.2em', color: 'rgba(190, 111, 20, 0.77)' }}>Søk-innstillinger</strong>
                        <div style={{ paddingLeft: '1em' }}>
                            Skriv inn ett eller flere ord (komma-separert), velg korpus, sprak og grafmodus.
                            Feltet viser "demokrati" som forslag ved oppstart.
                        </div>
                    </div>

                    <div style={{ marginBottom: '0.75rem' }}>
                        <strong style={{ fontSize: '1.2em', color: 'rgba(190, 111, 20, 0.77)' }}>Periodevelger (zoom-home)</strong>
                        <div style={{ paddingLeft: '1em' }}>
                            Start- og sluttar definerer standardvisning og hva som brukes nar du resetter zoom.
                            Zoom inn ved a klikke og dra i grafen.
                        </div>
                    </div>

                    <div style={{ marginBottom: '0.75rem' }}>
                        <strong style={{ fontSize: '1.2em', color: 'rgba(190, 111, 20, 0.77)' }}>Grafinnstillinger</strong>
                        <div style={{ paddingLeft: '1em' }}>
                            Juster utjevning, fargepalett, linjetykkelse, transparens og eventuelt kurvemonstrer.
                        </div>
                    </div>

                    <div style={{ marginBottom: '0.75rem' }}>
                        <strong style={{ fontSize: '1.2em', color: 'rgba(190, 111, 20, 0.77)' }}>Akse og skala</strong>
                        <div style={{ paddingLeft: '1em' }}>
                            Relativ visning bruker automatisk <code>%</code> eller <code>ppm</code> basert pa datanivaa.
                            <code> ppm</code> betyr <em>parts per million</em>, altsa forekomster per 1 000 000 ord.
                        </div>
                    </div>

                    <div>
                        <strong style={{ fontSize: '1.2em', color: 'rgba(190, 111, 20, 0.77)' }}>Delingsalternativer</strong>
                        <div style={{ paddingLeft: '1em' }}>
                            Last ned dataramme (Excel), lagre grafikk som PNG eller kopier delbar lenke.
                            Hoyopploselige figurer for publikasjon finnes under nedlastingsknappen i verktoyene.
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </header>
    );
};

export default AppHeader;
