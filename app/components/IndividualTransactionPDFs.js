'use client'

import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Download, CheckCircle, AlertCircle, Building2, Hash, ChevronLeft, ChevronRight, DollarSign, Copy, Search, Tag } from 'lucide-react';
import SplitText from './SplitText';
import useDataProcessing from '../hooks/useDataProcessing';
import { generateProfessionalInvoiceHTML, formatCellValue, getMerchantConfig } from '../utils/invoiceConfig';

export default function IndividualTransactionPDFs() {
    const [file, setFile] = useState(null);
    const fileInputRef = useRef(null);
    const [showDuplicates, setShowDuplicates] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [generatingZip, setGeneratingZip] = useState(false);
    const [zipProgress, setZipProgress] = useState(0);
    const [jetpackInvoiceStart, setJetpackInvoiceStart] = useState('');
    const [auxfordInvoiceStart, setAuxfordInvoiceStart] = useState('');

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
    } = useDataProcessing(file);

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

    const getFilenameFromRRN = (rowData) => {
        if (!rrnColumn || !rowData[rrnColumn]) {
            return `${rowData._rowIndex}`;
        }
        const rrnValue = String(rowData[rrnColumn]);
        const cleanFilename = rrnValue.replace(/[^a-zA-Z0-9_-]/g, '_');
        return `${cleanFilename}` || `${rowData._rowIndex}`;
    };

    const calculateInvoiceNumber = (rowIndex) => {
        if (!preview || !merchantColumn) return null;
        
        const row = preview.data[rowIndex];
        const merchantName = row[merchantColumn] ? String(row[merchantColumn]).toLowerCase() : '';
        
        if (merchantName.includes('jetpack') && jetpackInvoiceStart) {
            const jetpackRows = preview.data.slice(0, rowIndex + 1).filter(r => {
                const m = r[merchantColumn] ? String(r[merchantColumn]).toLowerCase() : '';
                return m.includes('jetpack');
            });
            return parseInt(jetpackInvoiceStart) + jetpackRows.length - 1;
        } else if (merchantName.includes('auxford') && auxfordInvoiceStart) {
            const auxfordRows = preview.data.slice(0, rowIndex + 1).filter(r => {
                const m = r[merchantColumn] ? String(r[merchantColumn]).toLowerCase() : '';
                return m.includes('auxford');
            });
            return parseInt(auxfordInvoiceStart) + auxfordRows.length - 1;
        }
        
        return null;
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

    const downloadAsPDF = (htmlContent, filename = 'invoice') => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head>
                    <title>${filename}</title>
                </head>
                <body>
                    ${htmlContent}
                    <script>
                        setTimeout(() => {
                            window.print();
                            window.close();
                        }, 500);
                    </script>
                </body>
                </html>
            `);
            printWindow.document.close();
        } else {
            setError('Could not open print dialog. Please disable pop-up blockers.');
        }
    };

    const createInvoiceElement = (htmlContent) => {
        const tempDiv = document.createElement('div');
        tempDiv.style.width = '208mm';
        tempDiv.innerHTML = htmlContent;
        return tempDiv;
    };

    const downloadAllAsZip = async () => {
        if (!preview || !preview.data.length) return;

        if (!rrnColumn || !upiColumn || !amountColumn) {
            setError('Please select all required columns.');
            return;
        }

        if (!window.JSZip || !window.html2pdf) {
            setError('PDF or ZIP library not fully loaded. Please wait a moment and try again.');
            return;
        }

        setGeneratingZip(true);
        setZipProgress(0);
        setError(null);

        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'fixed';
        tempContainer.style.top = '0';
        tempContainer.style.left = '0';
        tempContainer.style.zIndex = '-1000';
        tempContainer.style.opacity = '0';
        tempContainer.style.pointerEvents = 'none';
        tempContainer.style.width = '208mm';
        document.body.appendChild(tempContainer);

        let jetpackInvoiceCounter = parseInt(jetpackInvoiceStart, 10) || 1;
        let auxfordInvoiceCounter = parseInt(auxfordInvoiceStart, 10) || 1;

        try {
            const zip = new window.JSZip();
            const totalRows = preview.data.length;

            for (let i = 0; i < totalRows; i++) {
                const rowData = preview.data[i];
                const merchantName = rowData[merchantColumn] ? String(rowData[merchantColumn]).toLowerCase() : '';

                let currentInvoiceNumber = null;
                if (merchantName.includes('jetpack')) {
                    currentInvoiceNumber = jetpackInvoiceCounter++;
                } else if (merchantName.includes('auxford')) {
                    currentInvoiceNumber = auxfordInvoiceCounter++;
                }

                const htmlContent = generateProfessionalInvoiceHTML(
                    rowData,
                    preview.headers,
                    currentInvoiceNumber,
                    rrnColumn,
                    upiColumn,
                    merchantColumn,
                    amountColumn,
                    null
                );
                const filename = getFilenameFromRRN(rowData);

                const element = createInvoiceElement(htmlContent);
                tempContainer.appendChild(element);

                const pdfBlob = await window.html2pdf()
                    .from(element)
                    .set({
                        margin: [1, 5, 1, 5],
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: {
                            scale: 2,
                            logging: false,
                            allowTaint: true,
                            useCORS: true
                        },
                        jsPDF: {
                            unit: 'mm',
                            format: 'a4',
                            orientation: 'portrait',
                            compress: true
                        },
                        pagebreak: { mode: 'none' }
                    })
                    .output('blob');

                zip.file(`${filename}.pdf`, pdfBlob);
                tempContainer.removeChild(element);
                setZipProgress(Math.round(((i + 1) / totalRows) * 100));

                if (i % 5 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }

            const zipBlob = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            });

            const url = URL.createObjectURL(zipBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Invoices_PDF_${new Date().toISOString().split('T')[0]}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            alert(`✅ Successfully created ZIP file with ${totalRows} PDF invoices!`);
        } catch (err) {
            console.error('ZIP/PDF generation error:', err);
            setError('Error creating ZIP file: ' + err.message);
        } finally {
            if (document.body.contains(tempContainer)) {
                document.body.removeChild(tempContainer);
            }
        }

        setGeneratingZip(false);
        setZipProgress(0);
    };

    const generateSinglePDF = async (index) => {
        if (!preview || !preview.data[startIndex + index]) return;

        if (!rrnColumn || !upiColumn || !amountColumn) {
            setError('Please select all required columns.');
            return;
        }

        setError(null);

        try {
            const rowData = preview.data[startIndex + index];
            const actualRowIndex = startIndex + index;
            const invoiceNumber = calculateInvoiceNumber(actualRowIndex);

            const htmlContent = generateProfessionalInvoiceHTML(
                rowData,
                preview.headers,
                invoiceNumber,
                rrnColumn,
                upiColumn,
                merchantColumn,
                amountColumn,
                null
            );

            downloadAsPDF(htmlContent, getFilenameFromRRN(rowData));
        } catch (err) {
            console.error('Single PDF generation error:', err);
            setError('Error generating PDF: ' + err.message);
        }
    };

    const clearFile = () => {
        setFile(null);
        setError(null);
        setRrnColumn('');
        setUpiColumn('');
        setMerchantColumn('');
        setAmountColumn('');
        setDuplicateColumn('');
        setShowDuplicates(false);
        setJetpackInvoiceStart('');
        setAuxfordInvoiceStart('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const isReadyToGenerate = rrnColumn && upiColumn && amountColumn;

    return (
        <div className="relative min-h-screen overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full object-cover">
                <video autoPlay loop muted playsInline className="w-full h-full object-cover" style={{ opacity: 0.4 }}>
                    <source src="/1.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-black" style={{ opacity: 0.2 }}></div>
            </div>

            <div className="relative z-10 pb-20">
                <div className="container mx-auto px-8 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <a href="/" className="cursor-pointer">
                                <div className="relative">
                                    <div className="absolute inset-0 rounded-xl blur-xl" style={{background: 'linear-gradient(135deg, #fff200, #4DA881)', opacity: 0.2}}></div>
                                    <img src="/logo hd.png" alt="Professional Logo" className="h-14 w-auto object-contain filter hover:brightness-110 transition-all duration-300" />
                                </div>
                            </a>
                        </div>
                        <div className="md:hidden flex items-center">
                            <div className="text-xs text-gray-600 font-medium">{new Date().toLocaleDateString()}</div>
                        </div>
                        <div className="hidden md:block w-40"></div>
                    </div>
                </div>

                <div className="text-center mb-10">
                    <div className="flex items-center justify-center mb-4 space-x-4">
                        <img src="/lemon.png" alt="Lemonpay Logo" className="w-16 h-16 object-contain" />
                        <SplitText text="Lemonpay Invoice Generator" tag="h2" className="text-4xl font-bold text-white" splitType="chars" delay={30} duration={0.3} from={{ opacity: 0 }} to={{ opacity: 1 }} textAlign="left" rootMargin="-100px" threshold={0.1} />
                    </div>
                </div>

                <div className="max-w-7xl mx-auto">
                    <div className="rounded-2xl shadow-2xl border border-white/40 overflow-hidden backdrop-blur-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                        <div className="p-8 bg-white/20">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-lg">
                                    <Upload className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-2xl font-semibold text-black">Upload Your Data File</h3>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                                    <div className="flex items-center">
                                        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                                        <p className="text-red-800 text-sm font-medium">{error}</p>
                                    </div>
                                </div>
                            )}

                            <div className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 ${file ? 'border-blue-300 bg-blue-50 shadow-inner' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'}`} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
                                {file ? (
                                    <div className="space-y-4">
                                        <div className="text-blue-600"><CheckCircle className="mx-auto h-16 w-16" /></div>
                                        <div>
                                            <p className="text-xl font-semibold text-blue-800">{file.name}</p>
                                            <p className="text-sm text-gray-600 mt-1">Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                        <button onClick={clearFile} className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors">Remove file</button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="text-black"><Upload className="mx-auto h-16 w-16" /></div>
                                        <div>
                                            <p className="text-2xl font-semibold text-black mb-2">Drop your data file here</p>
                                            <p className="text-black text-lg">or click to browse from your computer</p>
                                        </div>
                                        <p className="text-xm text-white-700">Supports Excel files (.xlsx, .xls) and CSV files</p>
                                        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" id="file-upload" />
                                        <label htmlFor="file-upload" className="inline-flex items-center px-8 py-3 border border-transparent text-base font-semibold rounded-xl shadow-lg text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 cursor-pointer transition-all transform hover:scale-105">
                                            <Upload className="w-5 h-5 mr-2" />Choose File
                                        </label>
                                    </div>
                                )}
                            </div>

                            {file && (
                                <div className="mt-8 flex justify-center">
                                    <button onClick={previewData} disabled={loading || isProcessing} className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none">
                                        {loading || isProcessing ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                                {isProcessing ? `Uploading... ${Math.round(uploadProgress)}%` : 'Loading...'}
                                            </>
                                        ) : (
                                            <>
                                                <FileText className="w-5 h-5 mr-2" />Preview Data
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        {preview && (
                            <div className="border-t border-white/50 bg-white/50 p-8">
                                <h3 className="text-xl font-semibold text-gray-900 mb-6">Configure Invoice Settings</h3>

                                <div className="mb-8 p-6 bg-white/80 rounded-xl border border-blue-200">
                                    <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center border-b pb-3">
                                        <Tag className="w-5 h-5 text-purple-500 mr-3" />Starting Invoice Numbers
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="jetpack-invoice-start" className="block text-sm font-medium text-gray-700 mb-2">
                                                <div className="flex items-center">
                                                    <Building2 className="w-4 h-4 mr-2" />Jetpack Merchant (Starting Invoice #)
                                                </div>
                                            </label>
                                            <input id="jetpack-invoice-start" type="number" min="1" value={jetpackInvoiceStart} onChange={(e) => setJetpackInvoiceStart(e.target.value)} placeholder="e.g., 101" className="w-full px-4 py-3 bg-purple-50 border-2 border-purple-200 rounded-lg text-purple-700 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:shadow-md" />
                                            <p className="mt-1 text-xs text-gray-500">Invoices for 'Jetpack' merchants will start from this number and increment.</p>
                                        </div>
                                        <div>
                                            <label htmlFor="auxford-invoice-start" className="block text-sm font-medium text-gray-700 mb-2">
                                                <div className="flex items-center">
                                                    <Building2 className="w-4 h-4 mr-2" />Auxford Merchant (Starting Invoice #)
                                                </div>
                                            </label>
                                            <input id="auxford-invoice-start" type="number" min="1" value={auxfordInvoiceStart} onChange={(e) => setAuxfordInvoiceStart(e.target.value)} placeholder="e.g., 5001" className="w-full px-4 py-3 bg-purple-50 border-2 border-purple-200 rounded-lg text-purple-700 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:shadow-md" />
                                            <p className="mt-1 text-xs text-gray-500">Invoices for 'Auxford' merchants will start from this number and increment.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                                        <Copy className="w-5 h-5 text-blue-500 mr-3" />Duplicate Detection:
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <div className="flex items-center">
                                                    <Search className="w-4 h-4 mr-2" />Select Column to Check for Duplicates
                                                </div>
                                            </label>
                                            <select value={duplicateColumn} onChange={(e) => setDuplicateColumn(e.target.value)} className="w-full px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-lg text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:shadow-md">
                                                <option value="">Select column to check duplicates</option>
                                                {preview.headers.filter(header => header !== '_rowIndex').map(header => (
                                                    <option key={header} value={header}>{header}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-end">
                                            {duplicates.length > 0 && (
                                                <button onClick={() => setShowDuplicates(!showDuplicates)} className="px-6 py-3 bg-white border-2 border-blue-200 text-blue-700 hover:bg-blue-50 rounded-lg font-medium transition-all hover:shadow-md">
                                                    {showDuplicates ? 'Hide' : 'Show'} {duplicates.length} Duplicate Groups
                                                </button>
                                            )}
                                            {duplicateColumn && duplicates.length === 0 && (
                                                <div className="px-6 py-3 bg-green-50 border-2 border-green-200 text-green-700 rounded-lg font-medium">No duplicates found</div>
                                            )}
                                        </div>
                                    </div>
                                    {showDuplicates && duplicates.length > 0 && (
                                        <div className="mt-6 bg-white/80 rounded-lg border border-blue-200 p-4">
                                            <h5 className="text-md font-semibold text-blue-800 mb-4">Found Duplicates:</h5>
                                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                                {duplicates.map((duplicate, index) => (
                                                    <div key={index} className="bg-white rounded-lg border border-blue-200 p-4">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h6 className="font-semibold text-gray-800">Value: "{duplicate.value}"</h6>
                                                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">{duplicate.count} occurrences</span>
                                                        </div>
                                                        <div className="grid gap-2">
                                                            {duplicate.rows.map((row, rowIndex) => (
                                                                <div key={rowIndex} className="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-2">
                                                                    <span>Row #{row._originalIndex + 1}</span>
                                                                    <div className="text-gray-600">
                                                                        {Object.entries(row).filter(([key]) => key !== '_rowIndex' && key !== '_originalIndex' && key !== duplicateColumn).slice(0, 2).map(([key, value]) => (
                                                                            <span key={key} className="ml-4">{key}: {String(value).substring(0, 20)}{String(value).length > 20 ? '...' : ''}</span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mb-8">
                                    <h4 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                                        <div className="w-3 h-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mr-3"></div>Select Required Columns:
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <div className="flex items-center">
                                                    <Building2 className="w-4 h-4 mr-2" />Merchant Column (Optional)
                                                </div>
                                            </label>
                                            <select value={merchantColumn} onChange={(e) => setMerchantColumn(e.target.value)} className="w-full px-4 py-3 bg-orange-50 border-2 border-orange-200 rounded-lg text-orange-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:shadow-md">
                                                <option value="">Select merchant column</option>
                                                {preview.headers.filter(header => header !== '_rowIndex').map(header => (
                                                    <option key={header} value={header}>{header}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <div className="flex items-center">
                                                    <DollarSign className="w-4 h-4 mr-2" />Amount Column (required)
                                                </div>
                                            </label>
                                            <select value={amountColumn} onChange={(e) => setAmountColumn(e.target.value)} className="w-full px-4 py-3 bg-green-50 border-2 border-green-200 rounded-lg text-green-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:shadow-md">
                                                <option value="">Select amount column (required)</option>
                                                {preview.headers.filter(header => header !== '_rowIndex').map(header => (
                                                    <option key={header} value={header}>{header}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <div className="flex items-center">
                                                    <Hash className="w-4 h-4 mr-2" />RRN Column (required)
                                                </div>
                                            </label>
                                            <select value={rrnColumn} onChange={(e) => setRrnColumn(e.target.value)} className="w-full px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-lg text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:shadow-md">
                                                <option value="">Select RRN column (required)</option>
                                                {preview.headers.filter(header => header !== '_rowIndex').map(header => (
                                                    <option key={header} value={header}>{header}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <div className="flex items-center">
                                                    <FileText className="w-4 h-4 mr-2" />UPI ID Column (required)
                                                </div>
                                            </label>
                                            <select value={upiColumn} onChange={(e) => setUpiColumn(e.target.value)} className="w-full px-4 py-3 bg-emerald-50 border-2 border-emerald-200 rounded-lg text-emerald-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:shadow-md">
                                                <option value="">Select UPI ID column (required)</option>
                                                {preview.headers.filter(header => header !== '_rowIndex').map(header => (
                                                    <option key={header} value={header}>{header}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="mt-6 p-4 bg-white/80 rounded-lg border border-gray-200">
                                        <div className="flex flex-wrap gap-4">
                                            <div className={`flex items-center px-3 py-1 rounded-full text-sm ${merchantColumn ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-500'}`}>
                                                <div className={`w-2 h-2 rounded-full mr-2 ${merchantColumn ? 'bg-orange-500' : 'bg-gray-400'}`}></div>
                                                Merchant: {merchantColumn || 'Optional'}
                                            </div>
                                            <div className={`flex items-center px-3 py-1 rounded-full text-sm ${amountColumn ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-600'}`}>
                                                <div className={`w-2 h-2 rounded-full mr-2 ${amountColumn ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                Amount: {amountColumn || 'Required'}
                                            </div>
                                            <div className={`flex items-center px-3 py-1 rounded-full text-sm ${rrnColumn ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-600'}`}>
                                                <div className={`w-2 h-2 rounded-full mr-2 ${rrnColumn ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                                                RRN: {rrnColumn || 'Required'}
                                            </div>
                                            <div className={`flex items-center px-3 py-1 rounded-full text-sm ${upiColumn ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-600'}`}>
                                                <div className={`w-2 h-2 rounded-full mr-2 ${upiColumn ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                                UPI ID: {upiColumn || 'Required'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {isReadyToGenerate && (
                                    <div className="mt-8 flex justify-center">
                                        <button onClick={downloadAllAsZip} disabled={generatingZip} className="inline-flex items-center px-10 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 rounded-xl font-bold text-lg shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none">
                                            <Download className="w-6 h-6 mr-3" />
                                            {generatingZip ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                                    {`Creating PDF ZIP... ${zipProgress}%`}
                                                </>
                                            ) : (
                                                `Download All ${preview.data.length} Invoices as ZIP`
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {preview && (
                            <div className="border-t border-white/50 bg-white/50 p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-semibold text-gray-900">Data Preview & Actions</h3>
                                    <div className="text-sm text-gray-600">Showing {startIndex + 1}-{Math.min(endIndex, preview.data.length)} of {preview.data.length} rows</div>
                                </div>

                                <div className="bg-white/80 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead className="bg-gradient-to-r from-slate-100 to-gray-100">
                                                <tr>
                                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b min-w-[4rem]">Row #</th>
                                                    {rrnColumn && (
                                                        <th className="px-6 py-4 text-left text-sm font-semibold text-blue-700 bg-blue-50 border-b border-blue-200 min-w-[10rem]">{rrnColumn}</th>
                                                    )}
                                                    {merchantColumn && (
                                                        <th className="px-6 py-4 text-left text-sm font-semibold text-orange-700 bg-orange-50 border-b border-orange-200 min-w-[8rem]">{merchantColumn} (Merchant)</th>
                                                    )}
                                                    {upiColumn && (
                                                        <th className="px-6 py-4 text-left text-sm font-semibold text-emerald-700 bg-emerald-50 border-b border-emerald-200 min-w-[12rem]">{upiColumn} (Bill To)</th>
                                                    )}
                                                    {amountColumn && (
                                                        <th className="px-6 py-4 text-left text-sm font-semibold text-green-700 bg-green-50 border-b border-green-200 min-w-[6rem]">{amountColumn} (Amount)</th>
                                                    )}
                                                    {preview.headers.filter(header =>
                                                        header !== '_rowIndex' && header !== rrnColumn && header !== upiColumn && header !== merchantColumn && header !== amountColumn && header !== duplicateColumn
                                                    ).slice(0, 2).map((header) => (
                                                        <th key={header} className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b min-w-[10rem]">{header}</th>
                                                    ))}
                                                    <th className="px-6 py-4 text-center text-sm font-semibold text-purple-700 bg-purple-50 border-b border-purple-200 min-w-[8rem]">Invoice No.</th>
                                                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 border-b min-w-[8rem]">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {currentRows.map((row, index) => {
                                                    const actualRowIndex = startIndex + index;
                                                    const invoiceNum = calculateInvoiceNumber(actualRowIndex);
                                                    
                                                    return (
                                                        <tr key={actualRowIndex} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-6 py-4 text-sm font-semibold text-blue-600 whitespace-nowrap">{actualRowIndex + 1}</td>
                                                            {rrnColumn && (
                                                                <td className="px-6 py-4 text-sm font-mono text-blue-800 bg-blue-50 whitespace-nowrap">{getFilenameFromRRN(row)}.pdf</td>
                                                            )}
                                                            {merchantColumn && (
                                                                <td className="px-6 py-4 text-sm font-mono text-orange-800 bg-orange-50">
                                                                    {formatCellValue(row[merchantColumn], merchantColumn).substring(0, 15)}
                                                                    {formatCellValue(row[merchantColumn], merchantColumn).length > 15 ? '...' : ''}
                                                                </td>
                                                            )}
                                                            {upiColumn && (
                                                                <td className="px-6 py-4 text-sm font-mono text-emerald-800 bg-emerald-50">
                                                                    {formatCellValue(row[upiColumn], upiColumn).substring(0, 25)}
                                                                    {formatCellValue(row[upiColumn], upiColumn).length > 25 ? '...' : ''}
                                                                </td>
                                                            )}
                                                            {amountColumn && (
                                                                <td className="px-6 py-4 text-sm font-mono text-green-800 bg-green-50 whitespace-nowrap">{formatCellValue(row[amountColumn], amountColumn)}</td>
                                                            )}
                                                            {preview.headers.filter(header =>
                                                                header !== '_rowIndex' && header !== rrnColumn && header !== upiColumn && header !== merchantColumn && header !== amountColumn && header !== duplicateColumn
                                                            ).slice(0, 2).map((header) => (
                                                                <td key={header} className="px-6 py-4 text-sm text-gray-900">
                                                                    {formatCellValue(row[header], header).substring(0, 25)}
                                                                    {formatCellValue(row[header], header).length > 25 ? '...' : ''}
                                                                </td>
                                                            ))}
                                                            <td className="px-6 py-4 text-center">
                                                                <div className="text-sm font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-full inline-block">
                                                                    {invoiceNum !== null ? invoiceNum : '-'}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                {isReadyToGenerate ? (
                                                                    <button onClick={() => generateSinglePDF(index)} className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white hover:from-emerald-600 hover:to-blue-600 rounded-lg text-sm font-medium transition-all transform hover:scale-105 shadow-md">
                                                                        <Download className="w-4 h-4 mr-1" />Generate
                                                                    </button>
                                                                ) : (
                                                                    <div className="text-xs text-red-400 text-center w-24">Missing config</div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-between">
                                    <div className="text-sm text-gray-600">Page {currentPage} of {totalPages} • Total: <span className="font-semibold text-gray-900">{preview.data.length} rows</span></div>
                                    <div className="flex items-center space-x-2">
                                        <button onClick={goToPreviousPage} disabled={currentPage === 1} className="flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
                                            <ChevronLeft className="w-4 h-4 mr-1" />Previous
                                        </button>
                                        <div className="flex items-center space-x-1">
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let pageNumber;
                                                if (totalPages <= 5) {
                                                    pageNumber = i + 1;
                                                } else if (currentPage <= 3) {
                                                    pageNumber = i + 1;
                                                } else if (currentPage >= totalPages - 2) {
                                                    pageNumber = totalPages - 4 + i;
                                                } else {
                                                    pageNumber = currentPage - 2 + i;
                                                }
                                                return (
                                                    <button key={pageNumber} onClick={() => goToPage(pageNumber)} className={`px-3 py-2 text-sm font-medium rounded-lg transition-all shadow-sm ${currentPage === pageNumber ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'}`}>
                                                        {pageNumber}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <button onClick={goToNextPage} disabled={currentPage === totalPages} className="flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
                                            Next<ChevronRight className="w-4 h-4 ml-1" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {generatingZip && (
                            <div className="border-t border-white/50 bg-white/50 p-8">
                                <div className="text-center mb-4">
                                    <h4 className="text-lg font-semibold text-purple-800">Creating PDF ZIP File...</h4>
                                    <p className="text-sm text-purple-600">Please wait while we process your data.</p>
                                </div>
                                <div className="flex items-center justify-center space-x-4">
                                    <div className="flex-1 max-w-md bg-purple-200 rounded-full h-4 shadow-inner">
                                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all duration-300 shadow-lg" style={{ width: `${zipProgress}%` }}></div>
                                    </div>
                                    <div className="text-lg font-bold text-purple-700 min-w-[4rem]">{zipProgress}%</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}