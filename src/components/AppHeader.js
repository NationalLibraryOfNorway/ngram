import React, { useState } from 'react';
import { Modal } from 'react-bootstrap';
import { FiDownload, FiInfo } from 'react-icons/fi';
import DownloadMenu from './DownloadMenu';

const AppHeader = ({ data, shareUrl }) => {
    const [showAbout, setShowAbout] = useState(false);

    return (
        <header className="header">
            <div className="header__wrapper">
                <div className="logo-title-container">
                    <a
                        href="https://www.nb.no/"
                        target="_blank"
                        rel="noreferrer"
                        className="brand-link"
                        aria-label="Gå tilbake til nb.no"
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
                            className="icon-button icon-button--header"
                            onClick={() => setShowAbout(true)}
                            title="Om N-gram"
                            aria-label="Om N-gram"
                        >
                            <FiInfo aria-hidden="true" />
                        </button>
                        <DownloadMenu
                            data={data}
                            shareUrl={shareUrl}
                            buttonClassName="icon-button icon-button--header"
                            buttonTitle="Nedlasting og deling"
                            menuAlign="right"
                            trigger={<FiDownload aria-hidden="true" />}
                        />
                    </div>
                </div>
            </div>
            <Modal show={showAbout} onHide={() => setShowAbout(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Om N-gram</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>NB N-gram viser bruk av ord over tid. Tjenesten bygger på digitaliserte bøker og aviser fra Nasjonalbibliotekets samling.</p>

                    <div style={{ marginBottom: '0.75rem' }}>
                        <strong className="help-section-title">Søk</strong>
                        <div className="help-section-body">
                            Ved siden av enkeltord er det mulig å søke på sekvenser av opptil tre ord, f. eks. navn: Gro Harlem Brundtland eller Mo i Rana. Ved bruk av komma kan man søke på inntil ti enkeltord eller ordsekvenser samtidig.

                            <p>Eksempler:</p>
                            <ul>
                                <li>*dag gir de ti mest frekvente ordene som slutter på -dag.</li>
                                <li>* dag gir de ti mest frekvente to-ordssekvensene der dag er det siste ordet.</li>
                                <li>bil+bilen+biler+bilene gir én samlet graf.</li>
                                <li>(i på) (Hamar Gjøvik) gir søk for disse fire kombinasjonene.</li>
                            </ul>
                        </div>
                    </div>

                    <div style={{ marginBottom: '0.75rem' }}>
                        <strong className="help-section-title">Verktøy</strong>
                        <div className="help-section-body">
                            Utjevning av kurve: fire år summerer fire år før og fire år etter det aktuelle året og deler på ni (antall år totalt).
                        </div>
                    </div>

                    <div style={{ marginBottom: '0.75rem' }}>
                        <strong className="help-section-title">Akse og skala</strong>
                        <div className="help-section-body">
                            Relativ visning bruker automatisk <code>%</code> eller <code>ppm</code> basert på datanivå.
                            <code> ppm</code> betyr <em>parts per million</em>, altså forekomster per 1 000 000 ord.
                        </div>
                    </div>

                    <div>
                        <strong className="help-section-title">Delingsalternativer</strong>
                        <div className="help-section-body">
                            Last ned tabell (Excel), lagre grafikk som PNG eller kopier delbar lenke.
                            Høyoppløselige figurer for publikasjon finnes under nedlastingsknappen i verktøyene.
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </header>
    );
};

export default AppHeader;
