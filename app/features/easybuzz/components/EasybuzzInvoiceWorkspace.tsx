// @ts-nocheck
'use client'

import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Download, CheckCircle, AlertCircle, Building2, Hash, ChevronLeft, ChevronRight, DollarSign, Copy, Search, Tag, Eye, Printer, ArrowUpRight, X, NotebookPen } from 'lucide-react';
import { APP_ASSETS } from '../../../constants/assets';
import useInvoiceDataProcessing from '../../file-processing/hooks/useInvoiceDataProcessing';
import { generateProfessionalInvoiceHTML, formatCellValue } from '../utils/easybuzzInvoiceTemplate'; 
import { detectRequiredColumns as detectPreviewColumns } from '../../file-processing/utils/columnDetection';
import { createUniqueFilenameTracker, generateMergedPdfBlobFromHtmlList, generatePdfBlobFromHtml, getUniquePdfBasename, openPdfBlobPreview, sanitizePdfPathSegment, triggerBlobDownload } from '../../file-processing/utils/pdfGeneration';
import { getMerchantCatalog, getMerchantConfigByKey, getMerchantKeyFromName } from '../utils/merchantConfigs';
import PrintSelectionModal from '../../file-processing/components/PrintSelectionModal';

export default function EasybuzzInvoiceWorkspace({ workspaceMode = 'easybuzz' }) {
    const [file, setFile] = useState(null);
    const fileInputRef = useRef(null);
    const [showDuplicates, setShowDuplicates] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [generatingZip, setGeneratingZip] = useState(false);
    const [isViewingInTabs, setIsViewingInTabs] = useState(false);
    const [zipProgress, setZipProgress] = useState(0);
    const [activePdfRowIndex, setActivePdfRowIndex] = useState<number | null>(null);
    const [activePdfFilename, setActivePdfFilename] = useState('');
    const [isPrinting, setIsPrinting] = useState(false);
    const [dateColumn, setDateColumn] = useState(''); 
    const [customerNameColumn, setCustomerNameColumn] = useState('');
    const [selectedMerchantFilters, setSelectedMerchantFilters] = useState([]);
    const [isMerchantFilterOpen, setIsMerchantFilterOpen] = useState(false);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [printSelectionMode, setPrintSelectionMode] = useState('all');
    const [selectedPrintMerchants, setSelectedPrintMerchants] = useState([]);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [tableKey, setTableKey] = useState(0);
    const [startingSequences, setStartingSequences] = useState({});
    const [tempSequences, setTempSequences] = useState({});
    const [isMerchantNotesOpen, setIsMerchantNotesOpen] = useState(false);
    const [selectedNoteMerchantKey, setSelectedNoteMerchantKey] = useState(null);
    const [merchantNotes, setMerchantNotes] = useState({});
    const [merchantNoteDrafts, setMerchantNoteDrafts] = useState({});
    const [merchantNoteEditModes, setMerchantNoteEditModes] = useState({});
    const [isSavingNote, setIsSavingNote] = useState(false);
    const [currentNoteTimestamp, setCurrentNoteTimestamp] = useState('');

    const {
        loading,
        preview,
        error, setError,
        rrnColumn, setRrnColumn,
        upiColumn, setUpiColumn,
        merchantColumn, setMerchantColumn,
        amountColumn, setAmountColumn,
        duplicateColumn, setDuplicateColumn,
        duplicates,
        currentPage, rowsPerPage, totalPages, startIndex, endIndex, currentRows,
        previewData,
        goToNextPage, goToPreviousPage, goToPage,
    } = useInvoiceDataProcessing(file);

    const isOthersWorkspace = workspaceMode === 'others';
    const merchantCatalog = getMerchantCatalog(workspaceMode);
    const configuredMerchantList = Object.values(merchantCatalog);
    const availableMerchantNames = merchantColumn && preview
        ? Array.from(
            new Set(
                preview.data
                    .map((row) => formatCellValue(row[merchantColumn], merchantColumn).trim())
                    .filter(Boolean)
            )
        ).sort((a, b) => a.localeCompare(b))
        : [];

    const filteredPreviewRows = preview ? preview.data.filter((row) => {
        if (!merchantColumn || selectedMerchantFilters.length === 0) {
            return true;
        }

        const merchantName = formatCellValue(row[merchantColumn], merchantColumn).trim();
        return selectedMerchantFilters.includes(merchantName);
    }) : [];

    const filteredTotalPages = preview ? Math.max(1, Math.ceil(filteredPreviewRows.length / rowsPerPage)) : 0;
    const filteredStartIndex = (currentPage - 1) * rowsPerPage;
    const filteredEndIndex = filteredStartIndex + rowsPerPage;
    const filteredCurrentRows = preview ? filteredPreviewRows.slice(filteredStartIndex, filteredEndIndex) : [];

    useEffect(() => {
        if (!preview) {
            return;
        }

        const detectedColumns = detectPreviewColumns(preview.headers);

        if (!dateColumn && detectedColumns.transactionDate) {
            setDateColumn(detectedColumns.transactionDate);
        }

        if (!customerNameColumn) {
            const detectedCustomerNameColumn = preview.headers.find((header) => {
                const lower = header.toLowerCase();
                return (
                    (lower.includes('customer') && lower.includes('name')) ||
                    (lower.includes('payer') && lower.includes('name')) ||
                    (lower.includes('user') && lower.includes('name')) ||
                    (lower.includes('client') && lower.includes('name')) ||
                    (lower === 'name')
                );
            });

            if (detectedCustomerNameColumn) {
                setCustomerNameColumn(detectedCustomerNameColumn);
            }
        }

        if (!duplicateColumn && rrnColumn) {
            setDuplicateColumn(rrnColumn);
        }
    }, [preview, dateColumn, customerNameColumn, duplicateColumn, rrnColumn, setDuplicateColumn]);

    useEffect(() => {
        if (currentPage > filteredTotalPages && filteredTotalPages > 0) {
            goToPage(1);
        }
    }, [currentPage, filteredTotalPages, goToPage]);

    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => {
                setToast({ ...toast, show: false });
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [toast.show]);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };

    const loadMerchantNotes = async () => {
        const response = await fetch(`/api/merchant-notes?workspaceMode=${encodeURIComponent(workspaceMode)}`, {
            cache: 'no-store',
        });
        const payload = await response.json();

        if (!response.ok) {
            throw new Error(payload?.error || 'Failed to load merchant notes.');
        }

        return payload?.notes || {};
    };

    const saveMerchantNote = async (merchantKey, note) => {
        const response = await fetch('/api/merchant-notes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                workspaceMode,
                merchantKey,
                note,
            }),
        });
        const payload = await response.json();

        if (!response.ok) {
            throw new Error(payload?.error || 'Failed to save merchant note.');
        }

        return payload;
    };

    const formatNoteTimestamp = (value) => {
        if (!value) {
            return '--';
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return '--';
        }

        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        });
    };

    useEffect(() => {
        const scriptZip = document.createElement('script');
        scriptZip.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        scriptZip.async = true;
        document.head.appendChild(scriptZip);

        const scriptPdf = document.createElement('script');
        scriptPdf.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        scriptPdf.async = true;
        document.head.appendChild(scriptPdf);

        return () => {
            if (document.head.contains(scriptZip)) {
                document.head.removeChild(scriptZip);
            }
            if (document.head.contains(scriptPdf)) {
                document.head.removeChild(scriptPdf);
            }
        };
    }, []);

    useEffect(() => {
        const saved = localStorage.getItem('lp_invoice_starting_sequences');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setStartingSequences(parsed);
                setTempSequences(parsed);
            } catch (e) {
                console.error('Failed to parse starting sequences', e);
            }
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        const hydrateNotes = async () => {
            try {
                const notes = await loadMerchantNotes();
                if (!isMounted) {
                    return;
                }

                setMerchantNotes(notes);
                setMerchantNoteDrafts(
                    Object.entries(notes).reduce((accumulator, [merchantKey, value]) => {
                        accumulator[merchantKey] = value?.note || '';
                        return accumulator;
                    }, {})
                );
                setMerchantNoteEditModes(
                    Object.entries(notes).reduce((accumulator, [merchantKey, value]) => {
                        accumulator[merchantKey] = !value?.note;
                        return accumulator;
                    }, {})
                );
            } catch (e) {
                console.error('Failed to load merchant notes', e);
            }
        };

        hydrateNotes();

        return () => {
            isMounted = false;
        };
    }, [workspaceMode]);

    const handleSequenceChange = (merchantKey, value) => {
        // Only allow digits, no length restriction
        const cleanValue = value.replace(/[^0-9]/g, '');
        setTempSequences(prev => ({
            ...prev,
            [merchantKey]: cleanValue
        }));
    };

    const saveSequence = (merchantKey) => {
        const value = tempSequences[merchantKey];
        if (!value || value === '') {
            showToast('Please enter a valid sequence number', 'error');
            return;
        }

        const newSequences = {
            ...startingSequences,
            [merchantKey]: parseInt(value, 10)
        };
        setStartingSequences(newSequences);
        setTempSequences(prev => {
            const next = { ...prev };
            delete next[merchantKey];
            return next;
        });

        // Always show success toast since memory state is updated
        showToast('Invoice sequence updated successfully', 'success');
        
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                const data = JSON.stringify(newSequences);
                window.localStorage.setItem('lp_invoice_starting_sequences', data);
            } catch (e) {
                console.warn('Silent localStorage failure:', e);
            }
        }
    };

    const getFilenameFromRRN = (rowData) => {
        if (!rrnColumn || !rowData[rrnColumn]) {
            return `${rowData._rowIndex}`;
        }
        const rrnValue = String(rowData[rrnColumn]);
        const cleanFilename = rrnValue.replace(/[^a-zA-Z0-9_-]/g, '_');
        return `${cleanFilename}` || `${rowData._rowIndex}`;
    };

    const getCurrentInvoiceDatePrefix = () => {
        const currentDate = new Date();
        const day = String(currentDate.getDate()).padStart(2, '0');
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const year = String(currentDate.getFullYear()).slice(-2);

        return `${day}${month}${year}`;
    };

    const getMerchantInvoicePrefix = (merchantKey) => {
        const merchantConfig = getMerchantConfigByKey(merchantKey, workspaceMode);
        const normalizedPrefix = String(merchantConfig?.receiptEntityName || merchantConfig?.displayName || '')
            .replace(/LP$/i, '')
            .replace(/[^a-z]/gi, '')
            .toUpperCase();

        return normalizedPrefix.slice(0, 2);
    };

    const buildInvoiceNumber = (merchantKey) => {
        const merchantConfig = getMerchantConfigByKey(merchantKey, workspaceMode);
        const merchantPrefix = getMerchantInvoicePrefix(merchantKey);
        return `${merchantPrefix}${getCurrentInvoiceDatePrefix()}${merchantConfig?.invoiceCode ?? ''}`;
    };

    const getRowMerchantKey = (rowData) => {
        if (!isOthersWorkspace) {
            return 'sparkleap';
        }

        return getMerchantKeyFromName(merchantColumn ? rowData?.[merchantColumn] : '', workspaceMode);
    };

    const getVisibleMerchantConfigs = () => {
        if (!isOthersWorkspace) {
            return [merchantCatalog.sparkleap];
        }

        if (!preview || !merchantColumn) {
            return configuredMerchantList;
        }

        const seenMerchantKeys = new Set();
        preview.data.forEach((row) => {
            seenMerchantKeys.add(getRowMerchantKey(row));
        });

        return configuredMerchantList.filter((config) => seenMerchantKeys.has(config.key));
    };

    const merchantNoteSuggestions = [...configuredMerchantList].sort((a, b) =>
        a.displayName.localeCompare(b.displayName)
    );

    const selectedNoteMerchantConfig = selectedNoteMerchantKey
        ? getMerchantConfigByKey(selectedNoteMerchantKey, workspaceMode)
        : merchantNoteSuggestions[0] || null;

    const selectedMerchantNoteRecord = selectedNoteMerchantConfig
        ? merchantNotes[selectedNoteMerchantConfig.key]
        : null;
    const selectedMerchantNoteText = selectedNoteMerchantConfig
        ? merchantNoteDrafts[selectedNoteMerchantConfig.key] ?? selectedMerchantNoteRecord?.note ?? ''
        : '';
    const isSelectedMerchantNoteEditing = selectedNoteMerchantConfig
        ? merchantNoteEditModes[selectedNoteMerchantConfig.key] ?? !selectedMerchantNoteRecord?.note
        : false;
    const selectedMerchantSavedAt = selectedMerchantNoteRecord?.updatedAt || null;

    const getActualRowIndex = (rowData) => preview ? preview.data.indexOf(rowData) : -1;

    const getMerchantLabel = (rowData) => {
        if (!isOthersWorkspace) {
            return merchantCatalog.sparkleap.displayName;
        }

        const merchantName = merchantColumn
            ? formatCellValue(rowData?.[merchantColumn], merchantColumn).trim()
            : '';

        if (merchantName) {
            return merchantName;
        }

        const merchantConfig = getMerchantConfigByKey(getRowMerchantKey(rowData), workspaceMode);
        return merchantConfig?.displayName || 'Merchant';
    };

    const getInvoiceDocument = (rowData, actualRowIndex = getActualRowIndex(rowData)) => {
        const invoiceNumber = calculateInvoiceNumber(actualRowIndex);
        const merchantLabel = getMerchantLabel(rowData);
        const htmlContent = generateProfessionalInvoiceHTML(
            rowData,
            invoiceNumber,
            rrnColumn,
            upiColumn,
            customerNameColumn,
            merchantColumn,
            amountColumn,
            dateColumn,
            workspaceMode
        );

        return {
            actualRowIndex,
            rowData,
            merchantLabel,
            filename: getFilenameFromRRN(rowData),
            htmlContent,
        };
    };

    const getMerchantNamesForPrint = () => {
        if (!preview) {
            return [];
        }

        return Array.from(new Set(preview.data.map((row) => getMerchantLabel(row)))).sort((a, b) => a.localeCompare(b));
    };

    const getRowsForPrintSelection = () => {
        if (!preview) {
            return [];
        }

        if (printSelectionMode === 'all') {
            return preview.data;
        }

        return preview.data.filter((row) => selectedPrintMerchants.includes(getMerchantLabel(row)));
    };

    const handleMerchantFilterToggle = (merchantName) => {
        setSelectedMerchantFilters((prev) => {
            if (merchantName === '') {
                return [];
            }

            if (prev.includes(merchantName)) {
                return prev.filter((item) => item !== merchantName);
            }

            return [...prev, merchantName];
        });
        goToPage(1);
    };

    const calculateInvoiceNumber = (rowIndex) => {
        if (!preview) {
            return null; 
        }

        const rowData = preview.data[rowIndex];
        const merchantKey = getRowMerchantKey(rowData);
        const merchantSequence = preview.data
            .slice(0, rowIndex + 1)
            .filter((row) => getRowMerchantKey(row) === merchantKey).length;

        const baseSequence = startingSequences[merchantKey] || 1;
        const finalSequence = baseSequence + (merchantSequence - 1);

        return `${buildInvoiceNumber(merchantKey)}${String(finalSequence).padStart(2, '0')}`;
    };


    const processFile = (selectedFile) => {
        if (selectedFile && (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            selectedFile.type === 'application/vnd.ms-excel' ||
            selectedFile.type === 'text/csv')) {
            setIsProcessing(true);
            setUploadProgress(0);
            setError(null);

            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(progressInterval);
                        setTimeout(() => {
                            setFile(selectedFile);
                            setIsProcessing(false);
                        }, 500);
                        return 100;
                    }
                    return prev + Math.random() * 15;
                });
            }, 100);
        } else {
            setError('Invalid file format. Please upload Excel (.xlsx, .xls) or CSV files only.');
            setTimeout(() => setError(null), 5000);
        }
    };

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        processFile(selectedFile);
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsDragging(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        processFile(droppedFile);
    };

    const generatePdfBlob = async (htmlContent) => {
        return generatePdfBlobFromHtml(htmlContent);
    };

    const previewInvoice = (htmlContent, windowName = '_blank') => {
        const previewWindow = window.open('', windowName);
        if (previewWindow) {
            previewWindow.document.write(htmlContent);
            previewWindow.document.close();
        } else {
            setError('Could not open preview. Please disable pop-up blockers.');
        }
    };
    
    const viewAllInTabs = () => {
        if (!preview || !filteredPreviewRows.length) return;
        if (!rrnColumn || !upiColumn || !amountColumn || !dateColumn || (isOthersWorkspace && !merchantColumn)) {
            setError('Please select all required columns.');
            return;
        }

        setIsViewingInTabs(true);
        setError(null);

        try {
            filteredPreviewRows.forEach((rowData, i) => {
                const invoiceDocument = getInvoiceDocument(rowData);
                
                const newWindow = window.open('about:blank', `invoice-${i}`, 'width=800,height=600');
                if (newWindow) {
                    newWindow.document.write(`
                        <html>
                        <head>
                            <title>${invoiceDocument.filename}.pdf</title>
                            <style>
                                @media print {
                                    @page { size: A4; margin: 0; }
                                    body { margin: 0; }
                                }
                            </style>
                        </head>
                        <body>
                            ${invoiceDocument.htmlContent}
                        </body>
                        </html>
                    `);
                    newWindow.document.close();
                }
            });
            
            showToast(`Opening ${filteredPreviewRows.length} invoices in new tabs. Please ensure pop-up blockers are disabled.`, 'info');

        } catch (err) {
            console.error('View in Tabs error:', err);
            setError('Error viewing invoices: ' + err.message);
        } finally {
            setIsViewingInTabs(false);
        }
    };

    const isPdfActionInProgress = generatingZip || isPrinting || activePdfRowIndex !== null;

    const downloadAllAsZip = async () => {
        if (!preview || !filteredPreviewRows.length) return;

        if (!rrnColumn || !upiColumn || !amountColumn || !dateColumn || (isOthersWorkspace && !merchantColumn)) {
            setError('Please select all required columns.');
            return;
        }

        if (!window.JSZip || typeof window.html2pdf !== 'function') {
            setError('PDF or ZIP library not fully loaded. Please wait a moment and try again.');
            return;
        }

        setGeneratingZip(true);
        setZipProgress(0);
        setError(null);

        try {
            const zip = new window.JSZip();
            const invoiceDocuments = filteredPreviewRows.map((rowData) => getInvoiceDocument(rowData));
            const totalRows = invoiceDocuments.length;
            const merchantTrackers = new Map();
            const merchantGroups = new Map();

            invoiceDocuments.forEach((document) => {
                const merchantKey = document.merchantLabel;
                if (!merchantGroups.has(merchantKey)) {
                    merchantGroups.set(merchantKey, []);
                    merchantTrackers.set(merchantKey, createUniqueFilenameTracker());
                }

                const tracker = merchantTrackers.get(merchantKey);
                const uniqueFilename = getUniquePdfBasename(document.filename, tracker);
                document.uniqueFilename = uniqueFilename;
                merchantGroups.get(merchantKey).push({
                    ...document,
                    uniqueFilename,
                });
            });

            for (let i = 0; i < invoiceDocuments.length; i += 1) {
                const invoiceDocument = invoiceDocuments[i];
                const pdfBlob = await generatePdfBlob(invoiceDocument.htmlContent);
                const merchantFolder = zip.folder(sanitizePdfPathSegment(invoiceDocument.merchantLabel, 'Merchant'));

                merchantFolder.file(`${invoiceDocument.uniqueFilename}.pdf`, pdfBlob);
                setZipProgress(Math.round(((i + 1) / totalRows) * 80));

                if (i % 5 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }

            const merchantEntriesList = Array.from(merchantGroups.entries());
            for (let index = 0; index < merchantEntriesList.length; index += 1) {
                const [merchantLabel, entries] = merchantEntriesList[index];
                const merchantFolder = zip.folder(sanitizePdfPathSegment(merchantLabel, 'Merchant'));
                const mergedPdfBlob = await generateMergedPdfBlobFromHtmlList(entries.map((entry) => entry.htmlContent));

                merchantFolder.file('Merged.pdf', mergedPdfBlob);
                setZipProgress(80 + Math.round(((index + 1) / (merchantEntriesList.length + 1)) * 20));
            }

            const mergedAllPdfBlob = await generateMergedPdfBlobFromHtmlList(invoiceDocuments.map((entry) => entry.htmlContent));
            zip.file('Merged_All.pdf', mergedAllPdfBlob);
            setZipProgress(100);

            const zipBlob = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            });

            triggerBlobDownload(zipBlob, `Invoices_PDF_${new Date().toISOString().split('T')[0]}.zip`);
            showToast(`Successfully created ZIP file with ${totalRows} PDF invoices and merged merchant files!`, 'success');
        } catch (err) {
            console.error('ZIP/PDF generation error:', err);
            setError('Error creating ZIP file: ' + err.message);
        } finally {
            setGeneratingZip(false);
            setZipProgress(0);
        }
    };

    const generateSinglePDF = async (index) => {
        if (!preview || !preview.data[startIndex + index]) return;

        if (!rrnColumn || !upiColumn || !amountColumn || !dateColumn || (isOthersWorkspace && !merchantColumn)) {
            setError('Please select all required columns.');
            return;
        }

        setError(null);

        try {
            const rowData = preview.data[startIndex + index];
            const invoiceDocument = getInvoiceDocument(rowData, startIndex + index);

            setActivePdfRowIndex(invoiceDocument.actualRowIndex);
            setActivePdfFilename(`${invoiceDocument.filename}.pdf`);

            const pdfBlob = await generatePdfBlob(invoiceDocument.htmlContent);
            triggerBlobDownload(pdfBlob, `${invoiceDocument.filename}.pdf`);
        } catch (err) {
            console.error('Single PDF generation error:', err);
            setError('Error generating PDF: ' + err.message);
        } finally {
            setActivePdfRowIndex(null);
            setActivePdfFilename('');
        }
    };

    const previewSingleInvoice = (index) => {
        if (!preview || !preview.data[startIndex + index]) return;

        if (!rrnColumn || !upiColumn || !amountColumn || !dateColumn || (isOthersWorkspace && !merchantColumn)) {
            setError('Please select all required columns.');
            return;
        }

        setError(null);

        try {
            const rowData = preview.data[startIndex + index];
            const invoiceDocument = getInvoiceDocument(rowData, startIndex + index);

            previewInvoice(invoiceDocument.htmlContent, `preview-${invoiceDocument.filename}`);
        } catch (err) {
            console.error('Single invoice preview error:', err);
            setError('Error opening preview: ' + err.message);
        }
    };

    const openPrintModal = () => {
        const merchants = getMerchantNamesForPrint();

        setPrintSelectionMode('all');
        setSelectedPrintMerchants(merchants.length === 1 ? merchants : []);
        setIsPrintModalOpen(true);
    };

    const handlePrintModeChange = (mode) => {
        setPrintSelectionMode(mode);

        if (mode === 'all') {
            setSelectedPrintMerchants([]);
            return;
        }

        setSelectedPrintMerchants([]);
    };

    const handlePrintMerchantToggle = (merchantName) => {
        setSelectedPrintMerchants((prev) => {
            if (prev.includes(merchantName)) {
                return prev.filter((item) => item !== merchantName);
            }

            return [...prev, merchantName];
        });
    };

    const handlePrintMerchantSelectAll = () => {
        const merchants = getMerchantNamesForPrint();
        setSelectedPrintMerchants((prev) => prev.length === merchants.length ? [] : merchants);
    };

    const handlePrintInvoices = async () => {
        if (!preview || !preview.data.length) {
            return;
        }

        const rowsToPrint = getRowsForPrintSelection();
        if (!rowsToPrint.length) {
            setError('Please select at least one merchant to print.');
            return;
        }

        setIsPrinting(true);
        setActivePdfFilename('Merged_Print.pdf');
        setError(null);

        try {
            const invoiceDocuments = rowsToPrint.map((row) => getInvoiceDocument(row));
            const mergedPdfBlob = await generateMergedPdfBlobFromHtmlList(invoiceDocuments.map((entry) => entry.htmlContent));
            openPdfBlobPreview(mergedPdfBlob, 'invoice-print-preview');
            setIsPrintModalOpen(false);
            showToast(`Preview opened for ${invoiceDocuments.length} invoice${invoiceDocuments.length > 1 ? 's' : ''} with current data.`, 'success');
        } catch (err) {
            console.error('Print generation error:', err);
            setError('Error preparing print file: ' + err.message);
        } finally {
            setIsPrinting(false);
            setActivePdfFilename('');
        }
    };

    const clearFile = () => {
        setFile(null);
        setError(null);
        setRrnColumn('');
        setUpiColumn('');
        setMerchantColumn('');
        setAmountColumn('');
        setDateColumn(''); 
        setCustomerNameColumn('');
        setSelectedMerchantFilters([]);
        setIsMerchantFilterOpen(false);
        setIsPrintModalOpen(false);
        setPrintSelectionMode('all');
        setSelectedPrintMerchants([]);
        setDuplicateColumn('');
        setShowDuplicates(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    useEffect(() => {
        if (!merchantNoteSuggestions.length) {
            setSelectedNoteMerchantKey(null);
            return;
        }

        if (!selectedNoteMerchantKey || !merchantNoteSuggestions.some((config) => config.key === selectedNoteMerchantKey)) {
            setSelectedNoteMerchantKey(merchantNoteSuggestions[0].key);
        }
    }, [workspaceMode, selectedNoteMerchantKey]);

    useEffect(() => {
        if (!selectedNoteMerchantKey) {
            setCurrentNoteTimestamp('');
            return;
        }

        setCurrentNoteTimestamp(formatNoteTimestamp(new Date().toISOString()));
    }, [selectedNoteMerchantKey, isMerchantNotesOpen]);

    const handleMerchantNoteChange = (merchantKey, value) => {
        setMerchantNoteDrafts((prev) => ({
            ...prev,
            [merchantKey]: value,
        }));
    };

    const handleMerchantNoteEdit = (merchantKey) => {
        setMerchantNoteDrafts((prev) => ({
            ...prev,
            [merchantKey]: prev[merchantKey] ?? merchantNotes[merchantKey]?.note ?? '',
        }));
        setMerchantNoteEditModes((prev) => ({
            ...prev,
            [merchantKey]: true,
        }));
        setCurrentNoteTimestamp(formatNoteTimestamp(new Date().toISOString()));
    };

    const handleMerchantNoteCancel = (merchantKey) => {
        setMerchantNoteDrafts((prev) => ({
            ...prev,
            [merchantKey]: merchantNotes[merchantKey]?.note ?? '',
        }));
        setMerchantNoteEditModes((prev) => ({
            ...prev,
            [merchantKey]: !(merchantNotes[merchantKey]?.note),
        }));
    };

    const handleMerchantNoteSave = async () => {
        if (!selectedNoteMerchantConfig) {
            return;
        }

        setIsSavingNote(true);

        try {
            const note = merchantNoteDrafts[selectedNoteMerchantConfig.key] ?? '';
            const savedNote = await saveMerchantNote(selectedNoteMerchantConfig.key, note);
            setMerchantNotes((prev) => ({
                ...prev,
                [selectedNoteMerchantConfig.key]: {
                    note,
                    updatedAt: savedNote?.updatedAt || new Date().toISOString(),
                },
            }));
            setMerchantNoteEditModes((prev) => ({
                ...prev,
                [selectedNoteMerchantConfig.key]: false,
            }));
            showToast('Merchant note saved to MongoDB', 'success');
        } catch (e) {
            console.error('Failed to save merchant note', e);
            showToast(e.message || 'Failed to save merchant note.', 'error');
        } finally {
            setIsSavingNote(false);
        }
    };
    
    const isReadyToGenerate = rrnColumn && upiColumn && amountColumn && dateColumn && (!isOthersWorkspace || merchantColumn);

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#f6f7f4]">
            {toast.show && (
                <div className="fixed top-6 right-6 z-50 animate-[slideIn_0.3s_ease-out]">
                    <div className={`flex items-center gap-3 px-6 py-4 rounded-full shadow-2xl border-2 ${
                        toast.type === 'success' ? 'bg-green-500 border-green-400' : 
                        toast.type === 'error' ? 'bg-red-500 border-red-400' : 
                        'bg-blue-500 border-blue-400'
                    }`}>
                        {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-white" />}
                        {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-white" />}
                        {toast.type === 'info' && <FileText className="w-5 h-5 text-white" />}
                        <p className="text-white font-medium text-sm">{toast.message}</p>
                    </div>
                </div>
            )}

            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c&display=swap');
                    * {
                        font-family: 'M PLUS Rounded 1c', sans-serif !important;
                    }
                    @keyframes slideIn {
                        from {
                            transform: translateX(100%);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }
                `}
            </style>
            
            <header className="relative z-20 px-5 pt-5 md:px-8 md:pt-6">
                <div className="mx-auto flex w-full max-w-7xl items-center">
                    <img
                        src={APP_ASSETS.branding.companyLogo}
                        alt="Company Logo"
                        className="h-11 w-auto object-contain md:h-12"
                    />
                </div>
            </header>

            <div className="relative z-10 pb-10 pt-4 md:pb-14">

                <div className="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-7xl items-start justify-center px-4 md:px-6">
                    <div className="w-full overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
                        <div className="p-5 md:p-7">
                            <div className="flex items-center space-x-2 mb-4">
                                <Upload className="w-5 h-5 text-green-600" />
                                <h3 className="text-lg font-semibold text-gray-900">Upload Your Data File</h3>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-center">
                                        <AlertCircle className="w-4 h-4 text-red-600 mr-2 flex-shrink-0" />
                                        <p className="text-red-800 text-sm">{error}</p>
                                    </div>
                                </div>
                            )}

                            <div className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'}`} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
                                {file ? (
                                    <div className="space-y-3">
                                        <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
                                        <div>
                                            <p className="text-base font-semibold text-gray-900">{file.name}</p>
                                            <p className="text-sm text-gray-600 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                        <button onClick={clearFile} className="text-sm font-medium text-red-600 hover:text-red-700">Remove file</button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                        <div>
                                            <p className="text-lg font-semibold text-gray-900">Drop your data file here</p>
                                            <p className="text-sm text-gray-600 mt-1">or click to browse</p>
                                        </div>
                                        <p className="text-xs text-gray-500">Supports Excel (.xlsx, .xls) and CSV files</p>
                                        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" id="file-upload" />
                                        <label htmlFor="file-upload" className="inline-flex items-center px-6 py-2 text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 cursor-pointer transition-colors">
                                            <Upload className="w-4 h-4 mr-2" />Choose File
                                        </label>
                                    </div>
                                )}
                            </div>

                            {file && (
                                <div className="mt-4 flex justify-center">
                                    <button onClick={previewData} disabled={loading || isProcessing} className="inline-flex items-center px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                        {loading || isProcessing ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                                {isProcessing ? `Uploading... ${Math.round(uploadProgress)}%` : 'Loading...'}
                                            </>
                                        ) : (
                                            <>
                                                <FileText className="w-4 h-4 mr-2" />Preview Data
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        {preview && (
                            <div className="border-t border-gray-200 bg-gray-50 p-5 md:p-7">
                                <h3 className="text-base font-semibold text-gray-900 mb-4">Configure Invoice Settings</h3>

                                <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
                                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                        <Tag className="w-4 h-4 text-green-600 mr-2" />Invoice Number Format
                                    </h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <p className="mb-2 text-xs text-gray-600">
                                                Invoice numbers are auto-generated as a 2-letter merchant prefix, today&apos;s date in `ddmmyy` format, the merchant code, and then a running order like `01`, `02`, `03`.
                                            </p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                                {getVisibleMerchantConfigs().map((config) => {
                                                    const prefix = buildInvoiceNumber(config.key);
                                                    const savedVal = String(startingSequences[config.key] ?? '01').padStart(2, '0');
                                                    const tempVal = tempSequences[config.key] !== undefined 
                                                        ? String(tempSequences[config.key]).padStart(2, '0') 
                                                        : savedVal;
                                                    const hasChanged = tempVal !== savedVal;

                                                    return (
                                                        <div key={config.key} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
                                                            <div className="text-xs font-medium text-gray-700 truncate" title={config.companyName}>
                                                                {config.companyName}
                                                            </div>
                                                            <div className="mt-2 flex items-center gap-2">
                                                                <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-green-500">
                                                                    <span className="pl-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-100 border-r border-gray-200 select-none">
                                                                        {prefix}
                                                                    </span>
                                                                    <input
                                                                        type="text"
                                                                        value={tempSequences[config.key] ?? savedVal}
                                                                        onChange={(e) => handleSequenceChange(config.key, e.target.value)}
                                                                        className="w-16 px-2 py-1.5 text-sm font-bold text-gray-900 focus:outline-none"
                                                                        placeholder="01"
                                                                    />
                                                                </div>
                                                                <button
                                                                    onClick={() => saveSequence(config.key)}
                                                                    disabled={!hasChanged}
                                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                                        hasChanged 
                                                                        ? 'bg-green-600 text-white shadow-sm hover:bg-green-700' 
                                                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                                    }`}
                                                                >
                                                                    Save
                                                                </button>
                                                            </div>
                                                            <div className="mt-2 flex items-center justify-between text-[10px] text-gray-500">
                                                                <span>Merchant Code: {config.invoiceCode || 'N/A'}</span>
                                                                {hasChanged && <span className="text-green-600 font-medium">Unsaved changes</span>}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">Select Required Columns</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                <FileText className="w-3 h-3 inline mr-1 text-green-600" />Transaction Date *
                                            </label>
                                            <select value={dateColumn} onChange={(e) => setDateColumn(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                                <option value="">Select</option>
                                                {preview.headers.filter(header => header !== '_rowIndex').map(header => (
                                                    <option key={header} value={header}>{header}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                <Building2 className="w-3 h-3 inline mr-1 text-green-600" />Merchant {isOthersWorkspace ? '*' : '(Optional)'}
                                            </label>
                                            <select value={merchantColumn} onChange={(e) => setMerchantColumn(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                                <option value="">Select</option>
                                                {preview.headers.filter(header => header !== '_rowIndex').map(header => (
                                                    <option key={header} value={header}>{header}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                <FileText className="w-3 h-3 inline mr-1 text-green-600" />Customer Name (Optional)
                                            </label>
                                            <select value={customerNameColumn} onChange={(e) => setCustomerNameColumn(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                                <option value="">Select</option>
                                                {preview.headers.filter(header => header !== '_rowIndex').map(header => (
                                                    <option key={header} value={header}>{header}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                <DollarSign className="w-3 h-3 inline mr-1" />Amount *
                                            </label>
                                            <select value={amountColumn} onChange={(e) => setAmountColumn(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                                <option value="">Select</option>
                                                {preview.headers.filter(header => header !== '_rowIndex').map(header => (
                                                    <option key={header} value={header}>{header}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                <Hash className="w-3 h-3 inline mr-1" />RRN/UTR *
                                            </label>
                                            <select value={rrnColumn} onChange={(e) => setRrnColumn(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                                <option value="">Select</option>
                                                {preview.headers.filter(header => header !== '_rowIndex').map(header => (
                                                    <option key={header} value={header}>{header}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                <FileText className="w-3 h-3 inline mr-1" />UPI ID *
                                            </label>
                                            <select value={upiColumn} onChange={(e) => setUpiColumn(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                                <option value="">Select</option>
                                                {preview.headers.filter(header => header !== '_rowIndex').map(header => (
                                                    <option key={header} value={header}>{header}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <p className="mt-3 text-xs text-gray-500">
                                        If Excel headers are not detected correctly, choose the correct column here and the preview boxes below will update immediately.
                                    </p>
                                </div>

                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                        <Copy className="w-4 h-4 text-green-600 mr-2" />Duplicate Detection
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Column to Check
                                            </label>
                                            <select value={duplicateColumn} onChange={(e) => setDuplicateColumn(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                                <option value="">Select column</option>
                                                {preview.headers.filter(header => header !== '_rowIndex').map(header => (
                                                    <option key={header} value={header}>{header}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-end">
                                            {duplicates.length > 0 && (
                                                <button onClick={() => setShowDuplicates(!showDuplicates)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors">
                                                    {showDuplicates ? 'Hide' : 'Show'} {duplicates.length} Duplicates
                                                </button>
                                            )}
                                            {duplicateColumn && duplicates.length === 0 && (
                                                <div className="px-4 py-2 bg-lime-50 border border-lime-200 text-lime-700 rounded-lg text-sm font-medium">No duplicates</div>
                                            )}
                                        </div>
                                        {showDuplicates && duplicates.length > 0 && (
                                            <div className="mt-3 bg-white rounded-lg border border-gray-200 p-3 max-h-80 overflow-y-auto col-span-full">
                                                <div className="space-y-2">
                                                    {duplicates.map((duplicate, index) => (
                                                        <div key={index} className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h6 className="font-medium text-sm text-gray-900">"{duplicate.value}"</h6>
                                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">{duplicate.count} times</span>
                                                            </div>
                                                            <div className="space-y-1">
                                                                {duplicate.rows.map((row, rowIndex) => (
                                                                    <div key={rowIndex} className="text-xs text-gray-600 bg-white rounded px-2 py-1">
                                                                        Row #{row._originalIndex + 1}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">Auto-Detected Columns</h4>
                                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                                        <div className="flex flex-wrap gap-2">
                                            <div className={`flex items-center px-2 py-1 rounded text-xs ${dateColumn ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dateColumn ? 'bg-green-600' : 'bg-red-500'}`}></div>
                                                Transaction Date: {dateColumn || 'Not found'}
                                            </div>
                                            <div className={`flex items-center px-2 py-1 rounded text-xs ${merchantColumn ? 'bg-green-50 text-green-700' : isOthersWorkspace ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${merchantColumn ? 'bg-green-600' : isOthersWorkspace ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                                                Merchant: {merchantColumn || (isOthersWorkspace ? 'Not found' : 'Not needed')}
                                            </div>
                                            <div className={`flex items-center px-2 py-1 rounded text-xs ${customerNameColumn ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${customerNameColumn ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                                                Customer Name: {customerNameColumn || 'Not found'}
                                            </div>
                                            <div className={`flex items-center px-2 py-1 rounded text-xs ${amountColumn ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${amountColumn ? 'bg-green-600' : 'bg-red-500'}`}></div>
                                                Amount: {amountColumn || 'Not found'}
                                            </div>
                                            <div className={`flex items-center px-2 py-1 rounded text-xs ${rrnColumn ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${rrnColumn ? 'bg-green-600' : 'bg-red-500'}`}></div>
                                                RRN/UTR: {rrnColumn || 'Not found'}
                                            </div>
                                            <div className={`flex items-center px-2 py-1 rounded text-xs ${upiColumn ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${upiColumn ? 'bg-green-600' : 'bg-red-500'}`}></div>
                                                UPI ID: {upiColumn || 'Not found'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {isReadyToGenerate && (
                                    <div className="mt-4 flex justify-center gap-3">
                                        <button onClick={viewAllInTabs} disabled={isViewingInTabs || isPdfActionInProgress} className="inline-flex items-center px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                            <Eye className="w-4 h-4 mr-2" />
                                            {isViewingInTabs ? `Opening ${filteredPreviewRows.length} Tabs...` : 'View All in Tabs'}
                                        </button>

                                        <button onClick={openPrintModal} disabled={isPdfActionInProgress || isViewingInTabs} className="inline-flex items-center px-6 py-2 bg-white text-green-700 border border-green-200 hover:bg-green-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                            <Printer className="w-4 h-4 mr-2" />
                                            Print
                                        </button>

                                        <button onClick={downloadAllAsZip} disabled={isPdfActionInProgress || isViewingInTabs} className="inline-flex items-center px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                            {generatingZip ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                                    {`Creating ZIP... ${zipProgress}%`}
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="w-4 h-4 mr-2" />
                                                    {`Download All (${filteredPreviewRows.length})`}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {preview && (
                            <div className="border-t border-gray-200 bg-white p-5 md:p-7">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-semibold text-gray-900">Data Preview</h3>
                                    <div className="text-xs text-gray-600">{filteredPreviewRows.length === 0 ? 0 : filteredStartIndex + 1}-{Math.min(filteredEndIndex, filteredPreviewRows.length)} of {filteredPreviewRows.length}</div>
                                </div>

                                {merchantColumn && availableMerchantNames.length > 0 && (
                                    <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                                        <div className="mb-2 flex items-center justify-between">
                                            <h4 className="text-sm font-medium text-gray-900">Filter by Merchant</h4>
                                            <div className="text-xs text-gray-500">
                                                {selectedMerchantFilters.length > 0 ? `${selectedMerchantFilters.length} selected` : 'All Merchants'}
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <button
                                                onClick={() => setIsMerchantFilterOpen((prev) => !prev)}
                                                className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:border-green-400"
                                            >
                                                <span>{selectedMerchantFilters.length > 0 ? selectedMerchantFilters.join(', ') : 'All Merchants'}</span>
                                                <span className="text-xs text-gray-500">{isMerchantFilterOpen ? '▲' : '▼'}</span>
                                            </button>
                                            {isMerchantFilterOpen && (
                                                <div className="absolute left-0 top-full z-20 mt-2 w-full rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                                                    <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedMerchantFilters.length === 0}
                                                            onChange={() => handleMerchantFilterToggle('')}
                                                            className="h-4 w-4 text-green-600"
                                                        />
                                                        <span>All Merchants</span>
                                                    </label>
                                                    {availableMerchantNames.map((merchantName) => (
                                                        <label key={merchantName} className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedMerchantFilters.includes(merchantName)}
                                                                onChange={() => handleMerchantFilterToggle(merchantName)}
                                                                className="h-4 w-4 text-green-600"
                                                            />
                                                            <span>{merchantName}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-b">Row</th>
                                                    {dateColumn && (
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-b">{dateColumn}</th>
                                                    )}
                                                    {rrnColumn && (
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-b">{rrnColumn}</th>
                                                    )}
                                                    {merchantColumn && (
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-b">{merchantColumn}</th>
                                                    )}
                                                    {upiColumn && (
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-b">{upiColumn}</th>
                                                    )}
                                                    {amountColumn && (
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-b">{amountColumn}</th>
                                                    )}
                                                    {preview.headers.filter(header =>
                                                        header !== '_rowIndex' && header !== rrnColumn && header !== upiColumn && header !== merchantColumn && header !== amountColumn && header !== duplicateColumn && header !== dateColumn
                                                    ).slice(0, 2).map((header) => (
                                                        <th key={header} className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-b">{header}</th>
                                                    ))}
                                                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 border-b">Invoice #</th>
                                                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 border-b">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-100">
                                                {filteredCurrentRows.map((row) => {
                                                    const actualRowIndex = getActualRowIndex(row);
                                                    const invoiceNum = calculateInvoiceNumber(actualRowIndex);
                                                    
                                                    return (
                                                        <tr key={actualRowIndex} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-4 py-2 text-xs font-medium text-gray-900">{actualRowIndex + 1}</td>
                                                            {dateColumn && (
                                                            <td className="px-4 py-2 text-xs text-gray-700">
                                                                    {formatCellValue(row[dateColumn], dateColumn)}
                                                                </td>
                                                            )}
                                                            {rrnColumn && (
                                                                <td className="px-4 py-2 text-xs text-gray-700">{getFilenameFromRRN(row)}.pdf</td>
                                                            )}
                                                            {merchantColumn && (
                                                                <td className="px-4 py-2 text-xs text-gray-700">
                                                                    {formatCellValue(row[merchantColumn], merchantColumn).substring(0, 15)}
                                                                    {formatCellValue(row[merchantColumn], merchantColumn).length > 15 ? '...' : ''}
                                                                </td>
                                                            )}
                                                            {upiColumn && (
                                                                <td className="px-4 py-2 text-xs text-gray-700">
                                                                    {formatCellValue(row[upiColumn], upiColumn).substring(0, 25)}
                                                                    {formatCellValue(row[upiColumn], upiColumn).length > 25 ? '...' : ''}
                                                                </td>
                                                            )}
                                                            {amountColumn && (
                                                                <td className="px-4 py-2 text-xs text-gray-700">{formatCellValue(row[amountColumn], amountColumn)}</td>
                                                            )}
                                                            {preview.headers.filter(header =>
                                                                header !== '_rowIndex' && header !== rrnColumn && header !== upiColumn && header !== merchantColumn && header !== amountColumn && header !== duplicateColumn && header !== dateColumn
                                                            ).slice(0, 2).map((header) => (
                                                                <td key={header} className="px-4 py-2 text-xs text-gray-700">
                                                                    {formatCellValue(row[header], header).substring(0, 25)}
                                                                    {formatCellValue(row[header], header).length > 25 ? '...' : ''}
                                                                </td>
                                                            ))}
                                                            <td className="px-4 py-2 text-center">
                                                                <span className="text-xs font-medium text-gray-700">
                                                                    {invoiceNum !== null ? invoiceNum : '-'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2 text-center">
                                                                {isReadyToGenerate ? (
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        <button
                                                                            onClick={() => previewSingleInvoice(actualRowIndex - startIndex)}
                                                                            disabled={isPdfActionInProgress}
                                                                            className="inline-flex items-center justify-center rounded p-1.5 text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                                            aria-label={`Preview invoice ${invoiceNum !== null ? invoiceNum : actualRowIndex + 1}`}
                                                                            title="Preview invoice"
                                                                        >
                                                                            <Eye className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => generateSinglePDF(actualRowIndex - startIndex)}
                                                                            disabled={isPdfActionInProgress}
                                                                            className="inline-flex items-center rounded bg-green-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                                        >
                                                                            {activePdfRowIndex === actualRowIndex ? (
                                                                                <>
                                                                                    <div className="mr-1 h-3 w-3 animate-spin rounded-full border border-white border-t-transparent"></div>
                                                                                    Generating...
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Download className="w-3 h-3 mr-1" />Generate
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-xs text-gray-400">Not ready</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    <div className="text-xs text-gray-600">Page {currentPage} of {filteredTotalPages}</div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={goToPreviousPage} disabled={currentPage === 1} className="flex items-center px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                            <ChevronLeft className="w-3 h-3 mr-1" />Previous
                                        </button>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.min(5, filteredTotalPages) }, (_, i) => {
                                                let pageNumber;
                                                if (filteredTotalPages <= 5) {
                                                    pageNumber = i + 1;
                                                } else if (currentPage <= 3) {
                                                    pageNumber = i + 1;
                                                } else if (currentPage >= filteredTotalPages - 2) {
                                                    pageNumber = filteredTotalPages - 4 + i;
                                                } else {
                                                    pageNumber = currentPage - 2 + i;
                                                }
                                                return (
                                                    <button key={pageNumber} onClick={() => goToPage(pageNumber)} className={`px-2 py-1 text-xs font-medium rounded transition-colors ${currentPage === pageNumber ? 'bg-green-600 text-white' : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'}`}>
                                                        {pageNumber}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <button onClick={goToNextPage} disabled={currentPage === filteredTotalPages} className="flex items-center px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                            Next<ChevronRight className="w-3 h-3 ml-1" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(generatingZip || isPrinting || activePdfRowIndex !== null) && (
                            <div className="border-t border-gray-200 bg-gray-50 p-5 md:p-7">
                                <div className="text-center mb-3">
                                    <h4 className="text-sm font-semibold text-gray-900">
                                        {generatingZip ? 'Creating PDF ZIP File' : isPrinting ? 'Preparing Print PDF' : 'Generating PDF'}
                                    </h4>
                                    <p className="text-xs text-gray-600 mt-1">
                                        {generatingZip
                                            ? 'Please wait while all invoices are rendered.'
                                            : isPrinting
                                                ? 'Please wait while the merged PDF is generated for printing.'
                                                : `Preparing ${activePdfFilename || 'invoice.pdf'} for download.`}
                                    </p>
                                </div>
                                <div className="flex items-center justify-center gap-3">
                                    <div className="flex-1 max-w-md bg-gray-200 rounded-full h-2">
                                        <div className="bg-green-600 h-2 rounded-full transition-all duration-300" style={{ width: `${generatingZip ? zipProgress : 100}%` }}></div>
                                    </div>
                                    <div className="text-sm font-semibold text-gray-900 min-w-[3rem]">{generatingZip ? `${zipProgress}%` : '...'}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <PrintSelectionModal
                isOpen={isPrintModalOpen}
                merchants={getMerchantNamesForPrint()}
                selectionMode={printSelectionMode}
                selectedMerchants={selectedPrintMerchants}
                onModeChange={handlePrintModeChange}
                onMerchantToggle={handlePrintMerchantToggle}
                onSelectAllMerchants={handlePrintMerchantSelectAll}
                onClose={() => !isPrinting && setIsPrintModalOpen(false)}
                onConfirm={handlePrintInvoices}
                isSubmitting={isPrinting}
            />
            <div className="fixed bottom-5 right-5 z-40 md:bottom-6 md:right-6">
                {isMerchantNotesOpen && (
                    <div className="mb-3 w-[520px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[28px] border border-[#d7dbc7] bg-[#fffef7] shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
                        <div className="flex items-center justify-between border-b border-[#e6e7d8] bg-[#f6f0cf] px-4 py-3">
                            <div className="flex items-center gap-2">
                                <NotebookPen className="h-4 w-4 text-[#6a5d1f]" />
                                <div>
                                    <p className="text-sm font-semibold text-[#4d4418]">Merchant Notes</p>
                                    <p className="text-[11px] text-[#7a7142]">Saved separately in MongoDB. This does not change the table.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsMerchantNotesOpen(false)}
                                className="rounded-full p-1 text-[#6a5d1f] transition-colors hover:bg-[#efe7bf]"
                                aria-label="Close merchant notes"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="p-5">
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a8157]">
                                Suggestions
                            </p>
                            <div className="mb-5 flex max-h-28 flex-wrap gap-2 overflow-y-auto">
                                {merchantNoteSuggestions.map((merchant) => {
                                    const isSelected = selectedNoteMerchantConfig?.key === merchant.key;

                                    return (
                                        <button
                                            key={merchant.key}
                                            onClick={() => {
                                                setSelectedNoteMerchantKey(merchant.key);
                                                setCurrentNoteTimestamp(formatNoteTimestamp(new Date().toISOString()));
                                            }}
                                            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                                                isSelected
                                                    ? 'border-[#d0b84f] bg-[#f7e8a6] text-[#5b4b10]'
                                                    : 'border-[#ddd9c2] bg-white text-[#6b6749] hover:border-[#d0b84f]'
                                            }`}
                                        >
                                            {merchant.displayName}
                                        </button>
                                    );
                                })}
                            </div>

                            {selectedNoteMerchantConfig && (
                                <div className="rounded-2xl border border-[#e4dfc5] bg-white p-4">
                                    <div className="mb-4 flex flex-col gap-3 border-b border-[#efecd7] pb-4 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <p className="text-base font-semibold text-gray-900">
                                                {selectedNoteMerchantConfig.displayName}
                                            </p>
                                            <p className="mt-1 text-[11px] text-gray-500">
                                                Write anything here. It is stored only as a note for this merchant.
                                            </p>
                                        </div>
                                        <div className="grid gap-2 text-left md:min-w-[220px]">
                                            <div className="rounded-xl bg-[#faf6df] px-3 py-2">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a8157]">
                                                    Current Date & Time
                                                </p>
                                                <p className="mt-1 text-xs font-medium text-[#4d4418]">
                                                    {currentNoteTimestamp || '--'}
                                                </p>
                                            </div>
                                            <div className="rounded-xl bg-gray-50 px-3 py-2">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                                                    Last Saved
                                                </p>
                                                <p className="mt-1 text-xs font-medium text-gray-700">
                                                    {selectedMerchantSavedAt ? formatNoteTimestamp(selectedMerchantSavedAt) : 'Not saved yet'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    {isSelectedMerchantNoteEditing ? (
                                        <textarea
                                            value={selectedMerchantNoteText}
                                            onChange={(e) => handleMerchantNoteChange(selectedNoteMerchantConfig.key, e.target.value)}
                                            rows={8}
                                            placeholder={`Write a note for ${selectedNoteMerchantConfig.displayName}...`}
                                            className="w-full resize-none rounded-2xl border border-[#dfdcc9] bg-[#fffdf4] px-4 py-3 text-sm text-gray-800 outline-none transition-colors focus:border-[#d0b84f] focus:ring-2 focus:ring-[#f7e8a6]"
                                        />
                                    ) : (
                                        <div className="min-h-[180px] whitespace-pre-wrap rounded-2xl border border-[#ece7ce] bg-[#fffdf4] px-4 py-3 text-sm leading-6 text-gray-800">
                                            {selectedMerchantNoteText || 'No note added for this merchant yet.'}
                                        </div>
                                    )}
                                    <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <p className="text-[11px] text-gray-500">
                                            Saved note stays separate from invoice numbering.
                                        </p>
                                        <div className="flex items-center justify-end gap-2">
                                            {!isSelectedMerchantNoteEditing && (
                                                <button
                                                    onClick={() => handleMerchantNoteEdit(selectedNoteMerchantConfig.key)}
                                                    className="rounded-full border border-[#d8d1b0] bg-white px-4 py-2 text-xs font-semibold text-[#5e5630] transition-colors hover:bg-[#faf6df]"
                                                >
                                                    Edit Note
                                                </button>
                                            )}
                                            {isSelectedMerchantNoteEditing && (
                                                <button
                                                    onClick={() => handleMerchantNoteCancel(selectedNoteMerchantConfig.key)}
                                                    className="rounded-full border border-[#d8d1b0] bg-white px-4 py-2 text-xs font-semibold text-[#5e5630] transition-colors hover:bg-[#faf6df]"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                            <button
                                                onClick={handleMerchantNoteSave}
                                                disabled={isSavingNote || !isSelectedMerchantNoteEditing}
                                                className="rounded-full bg-[#5f7c38] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#4f692f] disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {isSavingNote
                                                    ? 'Saving...'
                                                    : selectedMerchantSavedAt
                                                        ? 'Update Note'
                                                        : 'Save Note'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                <button
                    onClick={() => setIsMerchantNotesOpen((prev) => !prev)}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-green-600 to-emerald-500 text-white shadow-[0_18px_40px_rgba(22,163,74,0.35)] transition-transform hover:scale-105"
                    aria-label={isMerchantNotesOpen ? 'Close merchant notes' : 'Open merchant notes'}
                    title={isMerchantNotesOpen ? 'Close merchant notes' : 'Merchant notes'}
                >
                    {isMerchantNotesOpen ? <X className="h-6 w-6" /> : <ArrowUpRight className="h-6 w-6" />}
                </button>
            </div>
        </div>
    );
}
