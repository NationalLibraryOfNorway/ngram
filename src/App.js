import React, { useRef, useState } from 'react';
import { Container } from 'react-bootstrap';
import SearchControls from './components/SearchControls';
import NgramChartRecharts from './components/NgramChartRecharts';
import AppHeader from './components/AppHeader';
import { fetchNgramData } from './services/ngramProcessor';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [graphType, setGraphType] = useState('relative');
    const [settings, setSettings] = useState({
        capitalization: false,
        smoothing: 4,
        scaling: 'auto',
        curvePattern: false
    });
    const [corpus, setCorpus] = useState('');
    const [lastQuery, setLastQuery] = useState({
        words: [],
        corpus: 'bok',
        lang: 'nob',
        graphType: 'relative'
    });
    const lastRequestKeyRef = useRef('');

    const handleSearch = async (words, corpus, lang, graphType) => {
        const requestKey = JSON.stringify({
            words,
            corpus,
            lang,
            graphType,
            capitalization: settings?.capitalization ?? false
        });

        if (lastRequestKeyRef.current === requestKey) {
            return;
        }

        lastRequestKeyRef.current = requestKey;
        setError(null);
        setLastQuery({
            words,
            corpus,
            lang,
            graphType
        });
        try {
            const result = await fetchNgramData(words, corpus, lang, graphType, settings);
            setData(result);
            setCorpus(corpus);
        } catch (err) {
            // Allow retry of same query if the previous attempt failed.
            lastRequestKeyRef.current = '';
            setError(err.message);
        }
    };

    const handleSettingsChange = (nextSettings) => {
        setSettings((prev) => ({
            ...prev,
            ...nextSettings
        }));
    };

    return (
        <>
            <AppHeader data={data} query={lastQuery} settings={settings} />
            <Container fluid className="app-main-content">
            <div className="app-search-row mb-4">
                    <SearchControls 
                        onSearch={handleSearch}
                        onGraphTypeChange={setGraphType}
                    data={data}
                    onSettingsChange={handleSettingsChange}
                    />
            </div>
                    
            <div className="chart-container" style={{ height: 'calc(100vh - 120px)' }}>
                        {error && <div className="text-danger">{error}</div>}
                {data && <NgramChartRecharts 
                    data={data} 
                    graphType={graphType}
                    settings={settings}
                    corpus={corpus}
                />}
                </div>
            </Container>
        </>
    );
}

export default App; 