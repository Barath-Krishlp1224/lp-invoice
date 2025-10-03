'use client'

import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Download, CheckCircle, AlertCircle, Building2, Hash, ChevronLeft, ChevronRight, Edit3, DollarSign, Copy, Search } from 'lucide-react';
import useDataProcessing from '../hooks/useDataProcessing';
import { generateProfessionalInvoiceHTML, formatCellValue, getMerchantConfig } from '../utils/invoiceConfig'; 

export default function IndividualTransactionPDFs() {
    const [file, setFile] = useState(null);
    const [invoicePrefix, setInvoicePrefix] = useState('INV-');
    const fileInputRef = useRef(null);
    const [dateTime, setDateTime] = useState('');
    const [showDuplicates, setShowDuplicates] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [generatingZip, setGeneratingZip] = useState(false);
    const [zipProgress, setZipProgress] = useState(0);
    const [editingPrefixes, setEditingPrefixes] = useState(false);
    const [customPrefixes, setCustomPrefixes] = useState({
        auxford: 'AUX-',
        jetpack: 'JET-'
    });

    // Use custom hook for data logic
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

    // Load JSZip and html2pdf libraries from CDN
    useEffect(() => {
        // JSZip library
        const scriptZip = document.createElement('script');
        scriptZip.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        scriptZip.async = true;
        document.head.appendChild(scriptZip);

        // html2pdf library
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

    // Date/Time ticker
    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
            const options = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            };
            setDateTime(now.toLocaleDateString('en-US', options));
        };

        updateDateTime();
        const interval = setInterval(updateDateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleCustomPrefixChange = (merchant, newPrefix) => {
        setCustomPrefixes(prev => ({
            ...prev,
            [merchant]: newPrefix
        }));
    };

    const getFilenameFromRRN = (rowData) => {
        if (!rrnColumn || !rowData[rrnColumn]) {
            return `${rowData._rowIndex}`;
        }

        const rrnValue = String(rowData[rrnColumn]);
        const cleanFilename = rrnValue.replace(/[^a-zA-Z0-9_-]/g, '_');
        return `${cleanFilename}` || `${rowData._rowIndex}`;
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

    const downloadAsPDF = (htmlContent) => {
        // This is kept for the single PDF preview action, which opens a print dialog
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();
        } else {
            setError('Could not open print dialog. Please disable pop-up blockers.');
        }
    };
    
    // Helper function to create the isolated DOM element for PDF generation
    const createInvoiceElement = (htmlContent) => {
        // Increased width slightly closer to A4 width (210mm) to prevent overflow
        const tempDiv = document.createElement('div');
        tempDiv.style.width = '208mm'; 
        tempDiv.innerHTML = htmlContent;
        return tempDiv; 
    };


    // THE BATCH ZIP DOWNLOAD FUNCTION (FINAL FIXES)
    const downloadAllAsZip = async () => {
        if (!preview || !preview.data.length) return;

        if (!rrnColumn || !upiColumn || !amountColumn || (!merchantColumn && !invoicePrefix.trim() && !getMerchantConfig({}, merchantColumn, customPrefixes))) {
            setError('Please select all required columns and ensure an invoice prefix is set.');
            return;
        }

        // Check if libraries are loaded
        if (!window.JSZip || !window.html2pdf) {
            setError('PDF or ZIP library not fully loaded. Please wait a moment and try again.');
            return;
        }

        setGeneratingZip(true);
        setZipProgress(0);
        setError(null);

        // Create a temporary container that is visible to the renderer but invisible to the user
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'fixed'; 
        tempContainer.style.top = '0';         
        tempContainer.style.left = '0';        
        tempContainer.style.zIndex = '-1000';   
        tempContainer.style.opacity = '0';      
        tempContainer.style.pointerEvents = 'none'; 
        // Use the slightly increased width
        tempContainer.style.width = '208mm'; 
        document.body.appendChild(tempContainer);
        
        try {
            const zip = new window.JSZip();
            const totalRows = preview.data.length;

            for (let i = 0; i < totalRows; i++) {
                const rowData = preview.data[i];
                const htmlContent = generateProfessionalInvoiceHTML(
                    rowData,
                    preview.headers,
                    i + 1,
                    rrnColumn,
                    upiColumn,
                    merchantColumn,
                    amountColumn,
                    merchantColumn ? customPrefixes : { default: invoicePrefix }
                );
                const filename = getFilenameFromRRN(rowData);

                // Create temporary element and attach it to the hidden container
                const element = createInvoiceElement(htmlContent);
                tempContainer.appendChild(element);

                // Generate PDF using html2pdf.js with enhanced settings
                const pdfBlob = await window.html2pdf()
                    .from(element)
                    .set({
                        // CRITICAL FIX: Minimal vertical margins
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
                        // CRITICAL FIX: Prevent page breaks
                        pagebreak: { mode: 'none' } 
                    })
                    .output('blob');

                // Add the PDF Blob to the ZIP file
                zip.file(`${filename}.pdf`, pdfBlob);

                // Clean up the element immediately after processing
                tempContainer.removeChild(element);

                setZipProgress(Math.round(((i + 1) / totalRows) * 100));

                // Yield control for large batches
                if (i % 5 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }

            // Generate and download the final ZIP
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
            // Ensure the temporary container is removed even if an error occurred
            if (document.body.contains(tempContainer)) {
                document.body.removeChild(tempContainer);
            }
        }

        setGeneratingZip(false);
        setZipProgress(0);
    };

    const generateSinglePDF = async (index) => {
        if (!preview || !preview.data[startIndex + index]) return;

        if (!rrnColumn || !upiColumn || !amountColumn || (!merchantColumn && !invoicePrefix.trim() && !getMerchantConfig({}, merchantColumn, customPrefixes))) {
            setError('Please select all required columns and ensure an invoice prefix is set.');
            return;
        }

        setError(null);

        try {
            const rowData = preview.data[startIndex + index];
            const htmlContent = generateProfessionalInvoiceHTML(
                rowData,
                preview.headers,
                startIndex + index + 1,
                rrnColumn,
                upiColumn,
                merchantColumn,
                amountColumn,
                merchantColumn ? customPrefixes : { default: invoicePrefix }
            );

            downloadAsPDF(htmlContent);

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
        setInvoicePrefix('INV-');
        setShowDuplicates(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const isReadyToGenerate = rrnColumn && upiColumn && amountColumn && (merchantColumn || invoicePrefix.trim() || getMerchantConfig({}, merchantColumn, customPrefixes));

    return (
        <div className="relative min-h-screen overflow-hidden">
            {/* Background Video */}
            <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute top-0 left-0 w-full h-full object-cover"
            >
                <source src="/1.mp4" type="video/mp4" />
                <source src="your-video.webm" type="video/webm" />
            </video>
            {/* Header with Logo */}
            <div className="container mx-auto px-8 py-5">
                <div className="flex items-center justify-between">
                    {/* Enhanced Logo Section */}
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <div className="absolute inset-0 rounded-xl blur-xl" style={{ backgroundColor: '#fff200', opacity: 0.2 }}></div>

                                <img
                                    src="/logo hd.png"
                                    alt="Professional Logo"
                                    className="h-14 w-auto object-contain filter hover:brightness-110 transition-all duration-300"
                                />

                            </div>
                        </div>
                    </div>

                    {/* Professional Date & Time Display */}
                    <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-3 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                            <div className="text-right">
                                <div className="text-sm font-semibold text-white tracking-wide drop-shadow-lg">
                                    {dateTime.split(',')[0]}, {dateTime.split(',')[1]}
                                </div>
                                <div className="text-xs text-yellow-300 font-mono tracking-wider drop-shadow-lg">
                                    {dateTime.split(',')[2] || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Menu Indicator */}
                    <div className="md:hidden flex items-center">
                        <div className="text-xs text-gray-600 font-medium">
                            {new Date().toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative z-10 pb-20">
                {/* Main Title Section */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-4">
                        <FileText className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-4xl font-bold text-white mb-3">Lemonpay Invoice Generator</h2>
                </div>

                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">

                        {/* Upload Section */}
                        <div className="p-8 bg-gradient-to-r from-blue-50 to-blue-100">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-lg">
                                    <Upload className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-2xl font-semibold text-gray-900">Upload Your Data File</h3>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                                    <div className="flex items-center">
                                        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                                        <p className="text-red-800 text-sm font-medium">{error}</p>
                                    </div>
                                </div>
                            )}

                            <div
                                className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 ${
                                    file
                                        ? 'border-blue-300 bg-blue-50 shadow-inner'
                                        : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'
                                    }`}
                                onDragEnter={handleDragEnter}
                                onDragLeave={handleDragLeave}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                            >
                                {file ? (
                                    <div className="space-y-4">
                                        <div className="text-blue-600">
                                            <CheckCircle className="mx-auto h-16 w-16" />
                                        </div>
                                        <div>
                                            <p className="text-xl font-semibold text-blue-800">{file.name}</p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                        <button
                                            onClick={clearFile}
                                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            Remove file
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="text-gray-400">
                                            <Upload className="mx-auto h-16 w-16" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-semibold text-gray-900 mb-2">Drop your data file here</p>
                                            <p className="text-gray-600 text-lg">or click to browse from your computer</p>
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".xlsx,.xls,.csv"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="file-upload"
                                        />
                                        <label
                                            htmlFor="file-upload"
                                            className="inline-flex items-center px-8 py-3 border border-transparent text-base font-semibold rounded-xl shadow-lg text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 cursor-pointer transition-all transform hover:scale-105"
                                        >
                                            <Upload className="w-5 h-5 mr-2" />
                                            Choose File
                                        </label>
                                        <p className="text-sm text-gray-500">
                                            Supports Excel files (.xlsx, .xls) and CSV files
                                        </p>
                                    </div>
                                )}
                            </div>

                            {file && (
                                <div className="mt-8 flex justify-center">
                                    <button
                                        onClick={previewData}
                                        disabled={loading || isProcessing}
                                        className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                                    >
                                        {loading || isProcessing ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                                {isProcessing ? `Uploading... ${Math.round(uploadProgress)}%` : 'Loading...'}
                                            </>
                                        ) : (
                                            <>
                                                <FileText className="w-5 h-5 mr-2" />
                                                Preview Data
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Column Selection Section with Simple Dropdowns */}
                        {preview && (
                            <div className="border-t bg-white p-8">

                                <h3 className="text-xl font-semibold text-gray-900 mb-6">Configure Invoice Settings</h3>

                                {/* Duplicate Detection Section */}
                                <div className="mb-8">
                                    <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                                        <Copy className="w-5 h-5 text-blue-500 mr-3" />
                                        Duplicate Detection:
                                    </h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <div className="flex items-center">
                                                    <Search className="w-4 h-4 mr-2" />
                                                    Select Column to Check for Duplicates
                                                </div>
                                            </label>
                                            <select
                                                value={duplicateColumn}
                                                onChange={(e) => setDuplicateColumn(e.target.value)}
                                                className="w-full px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-lg text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:shadow-md"
                                            >
                                                <option value="">Select column to check duplicates</option>
                                                {preview.headers.filter(header => header !== '_rowIndex').map(header => (
                                                    <option key={header} value={header}>{header}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex items-end">
                                            {duplicates.length > 0 && (
                                                <button
                                                    onClick={() => setShowDuplicates(!showDuplicates)}
                                                    className="px-6 py-3 bg-white border-2 border-blue-200 text-blue-700 hover:bg-blue-50 rounded-lg font-medium transition-all hover:shadow-md"
                                                >
                                                    {showDuplicates ? 'Hide' : 'Show'} {duplicates.length} Duplicate Groups
                                                </button>
                                            )}
                                            {duplicateColumn && duplicates.length === 0 && (
                                                <div className="px-6 py-3 bg-green-50 border-2 border-green-200 text-green-700 rounded-lg font-medium">
                                                    No duplicates found
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Duplicates Display */}
                                    {showDuplicates && duplicates.length > 0 && (
                                        <div className="mt-6 bg-blue-50 rounded-lg border border-blue-200 p-4">
                                            <h5 className="text-md font-semibold text-blue-800 mb-4">Found Duplicates:</h5>
                                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                                {duplicates.map((duplicate, index) => (
                                                    <div key={index} className="bg-white rounded-lg border border-blue-200 p-4">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h6 className="font-semibold text-gray-800">
                                                                Value: "{duplicate.value}"
                                                            </h6>
                                                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                                                {duplicate.count} occurrences
                                                            </span>
                                                        </div>
                                                        <div className="grid gap-2">
                                                            {duplicate.rows.map((row, rowIndex) => (
                                                                <div key={rowIndex} className="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-2">
                                                                    <span>Row #{row._originalIndex + 1}</span>
                                                                    <div className="text-gray-600">
                                                                        {Object.entries(row)
                                                                            .filter(([key]) => key !== '_rowIndex' && key !== '_originalIndex' && key !== duplicateColumn)
                                                                            .slice(0, 2)
                                                                            .map(([key, value]) => (
                                                                                <span key={key} className="ml-4">
                                                                                    {key}: {String(value).substring(0, 20)}{String(value).length > 20 ? '...' : ''}
                                                                                </span>
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


                                {/* Custom Prefix Editor */}
                                <div className="mb-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-lg font-medium text-gray-800 flex items-center">
                                            <Edit3 className="w-5 h-5 text-blue-500 mr-3" />
                                            Custom Invoice Prefixes for Merchants:
                                        </h4>
                                        <button
                                            onClick={() => setEditingPrefixes(!editingPrefixes)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                                editingPrefixes
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                }`}
                                        >
                                            {editingPrefixes ? 'Save Prefixes' : 'Edit Prefixes'}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {Object.entries(customPrefixes).map(([merchant, prefix]) => (
                                            <div key={merchant} className="p-4 bg-white rounded-lg border-2 border-blue-200">
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="text-sm font-semibold text-blue-800 capitalize">
                                                        {merchant} Prefix:
                                                    </label>
                                                </div>
                                                {editingPrefixes ? (
                                                    <input
                                                        type="text"
                                                        value={prefix}
                                                        onChange={(e) => handleCustomPrefixChange(merchant, e.target.value)}
                                                        placeholder={`Enter ${merchant} prefix`}
                                                        className="w-full px-3 py-2 border border-blue-300 rounded-md text-sm font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                                                    />
                                                ) : (
                                                    <div className="text-sm font-mono text-blue-700 bg-blue-50 px-3 py-2 rounded-md">
                                                        {prefix}001, {prefix}002, {prefix}003...
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                </div>


                                {/* Simple Dropdowns Section */}
                                <div className="mb-8">
                                    <h4 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                                        <div className="w-3 h-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mr-3"></div>
                                        Select Required Columns:
                                    </h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {/* Merchant Column Dropdown */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <div className="flex items-center">
                                                    <Building2 className="w-4 h-4 mr-2" />
                                                    Merchant Column (Optional)
                                                </div>
                                            </label>
                                            <select
                                                value={merchantColumn}
                                                onChange={(e) => setMerchantColumn(e.target.value)}
                                                className="w-full px-4 py-3 bg-orange-50 border-2 border-orange-200 rounded-lg text-orange-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:shadow-md"
                                            >
                                                <option value="">Select merchant column</option>
                                                {preview.headers.filter(header => header !== '_rowIndex').map(header => (
                                                    <option key={header} value={header}>{header}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Amount Column Dropdown */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <div className="flex items-center">
                                                    <DollarSign className="w-4 h-4 mr-2" />
                                                    Amount Column (required)
                                                </div>
                                            </label>
                                            <select
                                                value={amountColumn}
                                                onChange={(e) => setAmountColumn(e.target.value)}
                                                className="w-full px-4 py-3 bg-green-50 border-2 border-green-200 rounded-lg text-green-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:shadow-md"
                                            >
                                                <option value="">Select amount column (required)</option>
                                                {preview.headers.filter(header => header !== '_rowIndex').map(header => (
                                                    <option key={header} value={header}>{header}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* RRN Column Dropdown */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <div className="flex items-center">
                                                    <Hash className="w-4 h-4 mr-2" />
                                                    RRN Column (required)
                                                </div>
                                            </label>
                                            <select
                                                value={rrnColumn}
                                                onChange={(e) => setRrnColumn(e.target.value)}
                                                className="w-full px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-lg text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:shadow-md"
                                            >
                                                <option value="">Select RRN column (required)</option>
                                                {preview.headers.filter(header => header !== '_rowIndex').map(header => (
                                                    <option key={header} value={header}>{header}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* UPI Column Dropdown */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <div className="flex items-center">
                                                    <FileText className="w-4 h-4 mr-2" />
                                                    UPI ID Column (required)
                                                </div>
                                            </label>
                                            <select
                                                value={upiColumn}
                                                onChange={(e) => setUpiColumn(e.target.value)}
                                                className="w-full px-4 py-3 bg-emerald-50 border-2 border-emerald-200 rounded-lg text-emerald-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:shadow-md"
                                            >
                                                <option value="">Select UPI ID column (required)</option>
                                                {preview.headers.filter(header => header !== '_rowIndex').map(header => (
                                                    <option key={header} value={header}>{header}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Status Indicators */}
                                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="flex flex-wrap gap-4">
                                            <div className={`flex items-center px-3 py-1 rounded-full text-sm ${merchantColumn ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-500'}`}>
                                                <div className={`w-2 h-2 rounded-full mr-2 ${merchantColumn ? 'bg-orange-500' : 'bg-gray-400'}`}></div>
                                                Merchant: {merchantColumn || 'Optional (uses default prefix)'}
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

                                {/* Invoice Prefix Input - Only show if no merchant column selected */}
                                {!merchantColumn && (
                                    <div className="mb-8">
                                        <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                                            <Hash className="w-5 h-5 text-purple-500 mr-3" />
                                            Default Invoice Number Prefix (if Merchant Column is empty):
                                        </h4>
                                        <div className="max-w-md">
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={invoicePrefix}
                                                    onChange={(e) => setInvoicePrefix(e.target.value)}
                                                    placeholder="Enter prefix (e.g., INV-, JETPACK-)"
                                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base font-medium focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all bg-white text-black"
                                                    autoComplete="off"
                                                />
                                                {invoicePrefix && (
                                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                        <span className="text-green-500 text-sm">✓</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                                                <p className="text-sm text-purple-700 font-medium">
                                                    Preview: {invoicePrefix || '[PREFIX]'}001, {invoicePrefix || '[PREFIX]'}002, {invoicePrefix || '[PREFIX]'}003
                                                </p>
                                            </div>
                                            {!invoicePrefix.trim() && (
                                                <p className="text-xs text-red-500 mt-2">
                                                    ⚠️ Invoice prefix is required if a merchant column is not selected.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Generate All PDFs as ZIP Button (Single Action) */}
                                {isReadyToGenerate && (
                                    <div className="mt-8 flex justify-center">
                                        <button
                                            onClick={downloadAllAsZip}
                                            disabled={generatingZip}
                                            className="inline-flex items-center px-10 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 rounded-xl font-bold text-lg shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                                        >
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

                        {/* Data Preview Section with Pagination */}
                        {preview && (
                            <div className="border-t bg-gray-50 p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-semibold text-gray-900">Data Preview & Actions</h3>
                                    <div className="text-sm text-gray-600">
                                        Showing {startIndex + 1}-{Math.min(endIndex, preview.data.length)} of {preview.data.length} rows
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead className="bg-gradient-to-r from-slate-100 to-gray-100">
                                                <tr>
                                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b min-w-[4rem]">
                                                        Row #
                                                    </th>
                                                    {rrnColumn && (
                                                        <th className="px-6 py-4 text-left text-sm font-semibold text-blue-700 bg-blue-50 border-b border-blue-200 min-w-[10rem]">
                                                            {rrnColumn}
                                                        </th>
                                                    )}
                                                    {merchantColumn && (
                                                        <th className="px-6 py-4 text-left text-sm font-semibold text-orange-700 bg-orange-50 border-b border-orange-200 min-w-[8rem]">
                                                            {merchantColumn} (Merchant)
                                                        </th>
                                                    )}
                                                    {upiColumn && (
                                                        <th className="px-6 py-4 text-left text-sm font-semibold text-emerald-700 bg-emerald-50 border-b border-emerald-200 min-w-[12rem]">
                                                            {upiColumn} (Bill To)
                                                        </th>
                                                    )}
                                                    {amountColumn && (
                                                        <th className="px-6 py-4 text-left text-sm font-semibold text-green-700 bg-green-50 border-b border-green-200 min-w-[6rem]">
                                                            {amountColumn} (Amount)
                                                        </th>
                                                    )}
                                                    {preview.headers.filter(header =>
                                                        header !== '_rowIndex' && header !== rrnColumn && header !== upiColumn && header !== merchantColumn && header !== amountColumn && header !== duplicateColumn
                                                    ).slice(0, 2).map((header) => (
                                                        <th key={header} className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b min-w-[10rem]">
                                                            {header}
                                                        </th>
                                                    ))}
                                                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 border-b min-w-[8rem]">
                                                        Action
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {currentRows.map((row, index) => (
                                                    <tr key={startIndex + index} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 text-sm font-semibold text-blue-600 whitespace-nowrap">
                                                            {startIndex + index + 1}
                                                        </td>
                                                        {rrnColumn && (
                                                            <td className="px-6 py-4 text-sm font-mono text-blue-800 bg-blue-50 whitespace-nowrap">
                                                                {getFilenameFromRRN(row)}.pdf
                                                            </td>
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
                                                            <td className="px-6 py-4 text-sm font-mono text-green-800 bg-green-50 whitespace-nowrap">
                                                                {formatCellValue(row[amountColumn], amountColumn)}
                                                            </td>
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
                                                            {isReadyToGenerate ? (
                                                                <button
                                                                    onClick={() => generateSinglePDF(index)}
                                                                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white hover:from-emerald-600 hover:to-blue-600 rounded-lg text-sm font-medium transition-all transform hover:scale-105 shadow-md"
                                                                >
                                                                    <Download className="w-4 h-4 mr-1" />
                                                                    Generate
                                                                </button>
                                                            ) : (
                                                                <div className="text-xs text-red-400 text-center w-24">
                                                                    Missing config
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Pagination Controls - Moved Below Table */}
                                <div className="mt-6 flex items-center justify-between">
                                    <div className="text-sm text-gray-600">
                                        Page {currentPage} of {totalPages} • Total: <span className="font-semibold text-gray-900">{preview.data.length} rows</span>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={goToPreviousPage}
                                            disabled={currentPage === 1}
                                            className="flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                        >
                                            <ChevronLeft className="w-4 h-4 mr-1" />
                                            Previous
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
                                                    <button
                                                        key={pageNumber}
                                                        onClick={() => goToPage(pageNumber)}
                                                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-all shadow-sm ${
                                                            currentPage === pageNumber
                                                                ? 'bg-blue-500 text-white shadow-lg'
                                                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {pageNumber}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <button
                                            onClick={goToNextPage}
                                            disabled={currentPage === totalPages}
                                            className="flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                        >
                                            Next
                                            <ChevronRight className="w-4 h-4 ml-1" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Progress Bar */}
                        {generatingZip && (
                            <div className="border-t bg-gradient-to-r from-purple-50 to-pink-50 p-8">
                                <div className="text-center mb-4">
                                    <h4 className="text-lg font-semibold text-purple-800">
                                        Creating PDF ZIP File...
                                    </h4>
                                    <p className="text-sm text-purple-600">Please wait while we process your data.</p>
                                </div>
                                <div className="flex items-center justify-center space-x-4">
                                    <div className="flex-1 max-w-md bg-purple-200 rounded-full h-4 shadow-inner">
                                        <div
                                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all duration-300 shadow-lg"
                                            style={{ width: `${zipProgress}%` }}
                                        ></div>
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