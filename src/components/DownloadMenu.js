import React, { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';

const DownloadMenu = ({
    data,
    shareUrl,
    trigger,
    buttonClassName = '',
    buttonTitle = 'Nedlasting og deling',
    menuAlign = 'left'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [copyStatus, setCopyStatus] = useState('');
    const menuRef = useRef(null);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handlePointerDownOutside = (event) => {
            if (!menuRef.current?.contains(event.target)) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
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
    }, [isOpen]);

    const closeMenu = () => {
        setIsOpen(false);
    };

    const getChartCanvas = () => document.querySelector('canvas');

    const downloadChartImage = ({ format = 'png', highResolution = false }) => {
        const canvas = getChartCanvas();
        if (!canvas) {
            return;
        }

        const exportCanvas = document.createElement('canvas');
        const scale = highResolution ? 4 : 1;
        exportCanvas.width = canvas.width * scale;
        exportCanvas.height = canvas.height * scale;

        const context = exportCanvas.getContext('2d');
        if (!context) {
            return;
        }

        context.scale(scale, scale);
        context.drawImage(canvas, 0, 0);

        const extension = format === 'jpeg' ? 'jpg' : format;
        const quality = format === 'jpeg' ? 1.0 : undefined;
        const link = document.createElement('a');
        link.download = `ngram_graph${highResolution ? '_hires' : ''}_${new Date().toISOString().split('T')[0]}.${extension}`;
        link.href = exportCanvas.toDataURL(`image/${format}`, quality);
        link.click();
        closeMenu();
    };

    const downloadCsv = () => {
        if (!data?.series || !data?.dates) {
            return;
        }

        const headers = ['Year', ...data.series.map((series) => series.name)];
        const rows = data.dates.map((year, index) => {
            const values = data.series.map((series) => series.data[index]);
            return [year, ...values];
        });
        const csvContent = [
            headers.join(','),
            ...rows.map((row) => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ngram_data_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        closeMenu();
    };

    const downloadExcel = () => {
        if (!data?.series || !data?.dates) {
            return;
        }

        const worksheetData = [
            ['Year', ...data.series.map((series) => series.name)],
            ...data.dates.map((year, index) => {
                const values = data.series.map((series) => series.data[index]);
                return [year, ...values];
            })
        ];

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        worksheet['!cols'] = [
            { wch: 10 },
            ...data.series.map(() => ({ wch: 15 }))
        ];
        XLSX.utils.book_append_sheet(workbook, worksheet, 'N-gram data');
        XLSX.writeFile(workbook, `ngram_data_${new Date().toISOString().split('T')[0]}.xlsx`);
        closeMenu();
    };

    const copyShareLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopyStatus('Lenke kopiert');
        } catch {
            setCopyStatus('Kunne ikke kopiere lenken');
        }

        closeMenu();
        window.setTimeout(() => setCopyStatus(''), 2000);
    };

    return (
        <div className="dropdown" ref={menuRef}>
            <button
                type="button"
                className={buttonClassName}
                title={buttonTitle}
                aria-label={buttonTitle}
                aria-expanded={isOpen}
                onClick={() => setIsOpen((prev) => !prev)}
            >
                {trigger}
            </button>
            {isOpen && (
                <div
                    className="dropdown-content"
                    style={menuAlign === 'right' ? { right: 0, left: 'auto' } : { left: 0, right: 'auto' }}
                >
                    <button type="button" className="sharing-link" onClick={() => downloadChartImage({ format: 'png' })} disabled={!data?.series}>
                        Grafikk (.png)
                    </button>
                    <button type="button" className="sharing-link" onClick={() => downloadChartImage({ format: 'png', highResolution: true })} disabled={!data?.series}>
                        Høyoppløselig PNG
                    </button>
                    <button type="button" className="sharing-link" onClick={() => downloadChartImage({ format: 'jpeg', highResolution: true })} disabled={!data?.series}>
                        Høyoppløselig JPG
                    </button>
                    <button type="button" className="sharing-link" onClick={downloadCsv} disabled={!data?.series}>
                        Data (.csv)
                    </button>
                    <button type="button" className="sharing-link" onClick={downloadExcel} disabled={!data?.series}>
                        Dataramme (.xlsx)
                    </button>
                    <button type="button" className="sharing-link" onClick={copyShareLink}>
                        Kopier lenken til N-gram
                    </button>
                    {copyStatus && <span className="copy-status">{copyStatus}</span>}
                </div>
            )}
        </div>
    );
};

export default DownloadMenu;
