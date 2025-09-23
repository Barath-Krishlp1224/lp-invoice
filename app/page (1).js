'use client'

import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Download, CheckCircle, AlertCircle, Building2, Hash, ChevronLeft, ChevronRight, Edit3, DollarSign, Copy, Search, Cloud, File, X, Monitor, Zap, Shield, Package } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function IndividualTransactionPDFs() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [generatingPDFs, setGeneratingPDFs] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [rrnColumn, setRrnColumn] = useState('');
  const [upiColumn, setUpiColumn] = useState('');
  const [merchantColumn, setMerchantColumn] = useState('');
  const [amountColumn, setAmountColumn] = useState('');
  const [duplicateColumn, setDuplicateColumn] = useState('');
  const [invoicePrefix, setInvoicePrefix] = useState('INV-');
  const fileInputRef = useRef(null);
  const [dateTime, setDateTime] = useState('');
  const [duplicates, setDuplicates] = useState([]);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatingZip, setGeneratingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  
  const [editingPrefixes, setEditingPrefixes] = useState(false);
  const [customPrefixes, setCustomPrefixes] = useState({
    auxford: 'AUX-',
    jetpack: 'JET-'
  });

  // JSZip library - load from CDN
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    script.async = true;
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const getMerchantConfig = (rowData) => {
    const merchantConfig = {
      'auxford': {
        companyName: 'AUXFORD PRIVATE LIMITED',
        address: 'NO 15 11 CROSS POONGAVANAM GARDEN MANAVELY KARIKALAMBAKAM PONDICHERRY - 605007 IN GST: 34AAYCA4056H1ZD',
        invoicePrefix: customPrefixes.auxford
      },
      'jetpack': {
        companyName: 'JETPACK PAMNETWORK PRIVATE LIMITED',
        address: 'No.195A Vinayagar koil St Eraiyur Tindivanam, Villupuram Tamil Nadu-604304 IN GST:33AAFCJ9470R1ZS',
        invoicePrefix: customPrefixes.jetpack
      }
    };

    if (!merchantColumn || !rowData[merchantColumn]) {
      return merchantConfig['jetpack']; 
    }
    
    const merchantName = String(rowData[merchantColumn]).toLowerCase().trim();
    
    if (merchantName.includes('auxford')) {
      return merchantConfig['auxford'];
    } else if (merchantName.includes('jetpack')) {
      return merchantConfig['jetpack'];
    }
    
    return merchantConfig[merchantName] || merchantConfig['jetpack'];
  };

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

  const findDuplicates = (data, columnName) => {
    if (!columnName || !data.length) return [];
    
    const valueMap = {};
    const duplicateRows = [];
    
    data.forEach((row, index) => {
      const value = String(row[columnName] || '').trim();
      if (value) {
        if (!valueMap[value]) {
          valueMap[value] = [];
        }
        valueMap[value].push({ ...row, _originalIndex: index });
      }
    });
    
    Object.entries(valueMap).forEach(([value, rows]) => {
      if (rows.length > 1) {
        duplicateRows.push({
          value,
          count: rows.length,
          rows: rows
        });
      }
    });
    
    return duplicateRows;
  };

  useEffect(() => {
    if (preview && duplicateColumn) {
      const foundDuplicates = findDuplicates(preview.data, duplicateColumn);
      setDuplicates(foundDuplicates);
    } else {
      setDuplicates([]);
    }
  }, [preview, duplicateColumn]);

  const totalPages = preview ? Math.ceil(preview.data.length / rowsPerPage) : 0;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentRows = preview ? preview.data.slice(startIndex, endIndex) : [];

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleCustomPrefixChange = (merchant, newPrefix) => {
    setCustomPrefixes(prev => ({
      ...prev,
      [merchant]: newPrefix
    }));
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
              setPreview(null);
              setRrnColumn('');
              setUpiColumn('');
              setMerchantColumn('');
              setAmountColumn('');
              setDuplicateColumn('');
              setDuplicates([]);
              setShowDuplicates(false);
              setCurrentPage(1);
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

  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            raw: false,
            dateNF: 'yyyy-mm-dd'
          });
          
          let headers, rows;
          
          if (jsonData.length > 0) {
            const firstRow = jsonData[0];
            const hasStringHeaders = firstRow.some(cell => 
              typeof cell === 'string' && isNaN(parseFloat(cell))
            );
            
            if (hasStringHeaders) {
              headers = jsonData[0];
              rows = jsonData.slice(1);
            } else {
              headers = jsonData[0].map((_, index) => `Column ${index + 1}`);
              rows = jsonData;
            }
          } else {
            headers = [];
            rows = [];
          }
          
          const formattedData = rows.map((row, rowIndex) => {
            const obj = { _rowIndex: rowIndex + 1 };
            headers.forEach((header, index) => {
              let value = row[index] || '';
              
              const headerLower = header.toString().toLowerCase();
              if (headerLower.includes('date') || headerLower.includes('time')) {
                if (typeof value === 'number') {
                  const excelDate = new Date((value - 25569) * 86400 * 1000);
                  if (headerLower.includes('time') && !headerLower.includes('date')) {
                    value = excelDate.toTimeString().split(' ')[0];
                  } else {
                    value = excelDate.toISOString().split('T')[0];
                  }
                } else if (typeof value === 'string' && value.includes('/')) {
                  try {
                    const parsedDate = new Date(value);
                    if (!isNaN(parsedDate.getTime())) {
                      value = parsedDate.toISOString().split('T')[0];
                    }
                  } catch (e) {
                   
                  }
                }
              }
              
              obj[header] = value;
            });
            return obj;
          });
          
          resolve({ data: formattedData, headers });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  const readCSVFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length === 0) {
            reject(new Error('Empty CSV file'));
            return;
          }
          
          const parseCSVLine = (line) => {
            const result = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            result.push(current.trim());
            return result;
          };
          
          const firstLine = parseCSVLine(lines[0]);
          const hasStringHeaders = firstLine.some(cell => 
            typeof cell === 'string' && isNaN(parseFloat(cell))
          );
          
          let headers, dataLines;
          if (hasStringHeaders && lines.length > 1) {
            headers = firstLine;
            dataLines = lines.slice(1);
          } else {
            headers = firstLine.map((_, index) => `Column ${index + 1}`);
            dataLines = lines;
          }
          
          const data = [];
          
          dataLines.forEach((line, rowIndex) => {
            const values = parseCSVLine(line);
            const row = { _rowIndex: rowIndex + 1 };
            headers.forEach((header, index) => {
              let value = values[index] || '';
              if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
              }
              if (!isNaN(value) && value !== '') {
                value = parseFloat(value);
              }
              row[header.trim()] = value;
            });
            data.push(row);
          });
          
          resolve({ data, headers });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  };

  const formatCellValue = (value, header) => {
    const headerLower = header?.toLowerCase() || '';
    
    if (typeof value === 'number') {
      if (headerLower.includes('amount') || headerLower.includes('txnamount')) {
        return `₹${value.toLocaleString()}`;
      } 
      else if (headerLower.includes('date') && value > 40000 && value < 60000) {
        const excelDate = new Date((value - 25569) * 86400 * 1000);
        return excelDate.toISOString().split('T')[0];
      }
      else if (headerLower.includes('time') && value < 1) {
        return new Date(value * 24 * 60 * 60 * 1000).toTimeString().split(' ')[0];
      }
      else {
        return value.toString();
      }
    }
    
    return String(value || '');
  };

  const detectUpiColumn = (headers, sampleData) => {
    const upiPatterns = [
      'upi', 'upiid', 'upi_id', 'vpa', 'vba', 'payeevpa', 'payervpa', 'payee_vpa', 'payer_vpa',
      'payee_upi', 'payer_upi', 'upivirtualpaymentaddress'
    ];
    
    for (const header of headers) {
      const headerLower = header.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (upiPatterns.some(pattern => headerLower.includes(pattern))) {
        return header;
      }
    }
    
    if (sampleData && sampleData.length > 0) {
      for (const header of headers) {
        if (header === '_rowIndex') continue;
        
        const sampleValues = sampleData.slice(0, Math.min(5, sampleData.length))
          .map(row => String(row[header] || ''))
          .filter(val => val.length > 0);
        
        if (sampleValues.length > 0) {
          const upiLikeCount = sampleValues.filter(val => {
            return val.includes('@') && 
                   val.split('@').length === 2 && 
                   val.split('@')[0].length > 0 && 
                   val.split('@')[1].length > 0 &&
                   !val.includes(' ') && 
                   val.length < 100;
          }).length;
          
          if (upiLikeCount / sampleValues.length > 0.7) {
            return header;
          }
        }
      }
    }
    
    return null;
  };

  const detectRequiredColumns = (headers, sampleData) => {
    const detectedColumns = {};
    
    detectedColumns.transactionDate = headers.find(h => {
      const lower = h.toLowerCase();
      return lower.includes('transaction') && lower.includes('date') || 
             lower.includes('txn') && lower.includes('date') ||
             lower.includes('date');
    });
    
    detectedColumns.transactionTime = headers.find(h => {
      const lower = h.toLowerCase();
      return lower.includes('transaction') && lower.includes('time') || 
             lower.includes('txn') && lower.includes('time') ||
             lower.includes('time');
    });
    
    detectedColumns.merchantName = headers.find(h => {
      const lower = h.toLowerCase();
      return lower.includes('merchant') && lower.includes('name') ||
             lower.includes('merchant') ||
             lower.includes('business') ||
             lower.includes('store');
    });
    
    detectedColumns.amount = headers.find(h => {
      const lower = h.toLowerCase();
      return lower.includes('amount') ||
             lower.includes('value') ||
             lower.includes('txnamount') ||
             lower.includes('transaction_amount');
    });
    
    detectedColumns.vpa = headers.find(h => {
      const lower = h.toLowerCase();
      return lower.includes('vpa') ||
             lower.includes('vba') ||
             lower.includes('virtual') && lower.includes('payment') ||
             lower.includes('payee') && (lower.includes('vpa') || lower.includes('upi'));
    });
    
    detectedColumns.utr = headers.find(h => {
      const lower = h.toLowerCase();
      return lower.includes('utr') ||
             lower.includes('unique') && lower.includes('transaction') ||
             lower.includes('transaction') && lower.includes('reference') ||
             lower.includes('txn') && lower.includes('ref');
    });
    
    detectedColumns.remarks = headers.find(h => {
      const lower = h.toLowerCase();
      return lower.includes('remark') ||
             lower.includes('comment') ||
             lower.includes('description') ||
             lower.includes('note');
    });
    
    return detectedColumns;
  };

  const previewData = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let result;
      
      if (file.type === 'text/csv') {
        result = await readCSVFile(file);
      } else {
        result = await readExcelFile(file);
      }
      
      setPreview(result);
      setCurrentPage(1); 
      
      const detectedCols = detectRequiredColumns(result.headers, result.data);
      
      const possibleRrnColumns = result.headers.filter(header => {
        const headerLower = header.toLowerCase();
        return headerLower.includes('rrn') || 
               headerLower.includes('reference') || 
               headerLower.includes('ref') ||
               headerLower.includes('transaction_id') ||
               headerLower.includes('txn_id') ||
               headerLower.includes('transactionid');
      });
      
      if (possibleRrnColumns.length > 0) {
        setRrnColumn(possibleRrnColumns[0]);
      }
      
      const detectedUpiColumn = detectUpiColumn(result.headers, result.data);
      if (detectedUpiColumn) {
        setUpiColumn(detectedUpiColumn);
      }
      
      if (detectedCols.amount) {
        setAmountColumn(detectedCols.amount);
      }
      
      console.log('Detected columns:', detectedCols);
      
    } catch (error) {
      console.error('Preview error:', error);
      setError('Error reading file: ' + error.message);
    }
    
    setLoading(false);
  };

  const getFilenameFromRRN = (rowData) => {
    if (!rrnColumn || !rowData[rrnColumn]) {
      return `Invoice_${rowData._rowIndex}`;
    }
    
    const rrnValue = String(rowData[rrnColumn]);
    const cleanFilename = rrnValue.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `Invoice_${cleanFilename}` || `Invoice_${rowData._rowIndex}`;
  };

  const generateProfessionalInvoiceHTML = (rowData, headers, rowIndex, totalRows) => {
    const currentDate = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    const merchantInfo = getMerchantConfig(rowData);
    const detectedCols = detectRequiredColumns(headers, [rowData]);
    
    const transactionDateValue = detectedCols.transactionDate && rowData[detectedCols.transactionDate] ? 
      formatCellValue(rowData[detectedCols.transactionDate], detectedCols.transactionDate) : 
      currentDate.split(',')[0];
    
    const transactionTimeValue = detectedCols.transactionTime && rowData[detectedCols.transactionTime] ? 
      formatCellValue(rowData[detectedCols.transactionTime], detectedCols.transactionTime) : 
      '00:23';
    
    const merchantNameValue = detectedCols.merchantName && rowData[detectedCols.merchantName] ? 
      formatCellValue(rowData[detectedCols.merchantName], detectedCols.merchantName) :
      (merchantColumn && rowData[merchantColumn] ? formatCellValue(rowData[merchantColumn], merchantColumn) : 'N/A');
    
    let amountValue = 0;
    if (amountColumn && rowData[amountColumn] !== undefined && rowData[amountColumn] !== null && rowData[amountColumn] !== '') {
      const rawValue = String(rowData[amountColumn]).replace(/[₹,\s]/g, ''); 
      amountValue = parseFloat(rawValue) || 0;
    } else if (detectedCols.amount && rowData[detectedCols.amount] !== undefined && rowData[detectedCols.amount] !== null && rowData[detectedCols.amount] !== '') {
      const rawValue = String(rowData[detectedCols.amount]).replace(/[₹,\s]/g, '');
      amountValue = parseFloat(rawValue) || 0;
    }
    const formattedAmount = amountValue.toLocaleString('en-IN', { minimumFractionDigits: 2 });

    const vpaValue = detectedCols.vpa && rowData[detectedCols.vpa] ? 
      formatCellValue(rowData[detectedCols.vpa], detectedCols.vpa) :
      (upiColumn && rowData[upiColumn] ? formatCellValue(rowData[upiColumn], upiColumn) : 'N/A');
    
    const utrValue = detectedCols.utr && rowData[detectedCols.utr] ? 
      formatCellValue(rowData[detectedCols.utr], detectedCols.utr) :
      (rowData[rrnColumn] || 'N/A');
    
    const remarksValue = detectedCols.remarks && rowData[detectedCols.remarks] ? 
      formatCellValue(rowData[detectedCols.remarks], detectedCols.remarks) : 
      'Wallet loading transaction';
    
    const dateTimeValue = `${transactionDateValue} ${transactionTimeValue}`;
    const upiIdValue = upiColumn && rowData[upiColumn] ? formatCellValue(rowData[upiColumn], upiColumn) : vpaValue;
    const invoiceNumber = `${merchantInfo.invoicePrefix}${String(rowIndex).padStart(3, '0')}`;
    const pdfFilename = getFilenameFromRRN(rowData);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${rowData[rrnColumn] || `TXN${rowIndex}`}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.4;
            color: #374151;
            background-color: white;
            padding: 0;
            font-size: 12px;
            height: 100vh;
            overflow: hidden;
        }
        
        .container {
            max-width: 100%;
            margin: 0;
            height: 100vh;
        }
        
        .invoice {
            background: white;
            padding: 1.5rem;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        
        .header {
            text-align: center;
            margin-bottom: 2rem;
            flex-shrink: 0;
        }
        
        .invoice-title {
            font-size: 1.25rem;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 1rem;
        }
        
        .logo-container {
            display: flex;
            justify-content: center;
            margin-bottom: 1rem;
        }
        
        .company-details {
            max-width: 400px;
            margin: 0 auto;
            text-align: left;
        }
        
        .company-name {
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 0.25rem;
            font-size: 0.9rem;
        }
        
        .company-address {
            font-size: 0.7rem;
            color: #6b7280;
            line-height: 1.3;
        }
        
        .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 0;
        }
        
        .upper-section {
            flex-shrink: 0;
        }
        
        .middle-spacer {
            flex: 1;
            background-color: white;
            min-height: 100px;
        }
        
        .lower-section {
            flex-shrink: 0;
        }
        
        .table-container {
            margin-bottom: 1rem;
            overflow-x: auto;
        }
        
        .invoice-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #FFDA64;
            font-size: 0.7rem;
        }
        
        .invoice-table th,
        .invoice-table td {
            border: 1px solid #FFDA64;
            padding: 0.5rem;
            text-align: left;
        }
        
        .invoice-table th {
            background-color: #FFDA64;
            font-weight: 600;
            font-size: 0.7rem;
        }
        
        .invoice-table td {
            font-size: 0.7rem;
        }
        
        .center {
            text-align: center;
        }
        
        .right {
            text-align: right;
        }
        
        .total-row {
            background-color: #f9fafb;
            font-weight: 600;
        }
        
        .total-label {
            font-weight: 600;
        }
        
        .terms {
            margin-top: 1rem;
        }
        
        .terms h3 {
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 0.5rem;
            font-size: 0.8rem;
        }
        
        .terms-content {
            font-size: 0.6rem;
            color: #6b7280;
            line-height: 1.3;
        }
        
        .terms-content p {
            margin-bottom: 0.2rem;
        }
        
        .print-button-container {
            display: flex;
            justify-content: center;
            margin-top: 1rem;
            flex-shrink: 0;
        }
        
        .print-button {
            background-color: #2563eb;
            color: white;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 0.5rem;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            transition: background-color 0.2s ease;
        }
        
        .print-button:hover {
            background-color: #1d4ed8;
        }
        
        @media print {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
            
            body {
                background: white;
                padding: 0;
                font-size: 10px;
                height: 100vh;
                overflow: hidden;
            }
            
            .container {
                max-width: none;
                padding: 0;
                margin: 0;
                height: 100vh;
            }
            
            .print-button-container {
                display: none;
            }
            
            .invoice {
                box-shadow: none;
                border-radius: 0;
                padding: 0.5rem;
                height: 100vh;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
            }
            
            .invoice-table {
                page-break-inside: avoid;
                font-size: 0.6rem;
                border: 1px solid #9ca3af !important;
            }
            
            .invoice-table th {
                background-color: #FFDA64 !important;
                color: #1f2937 !important;
                font-weight: 600;
            }
            
            .invoice-table th,
            .invoice-table td {
                padding: 0.3rem;
                font-size: 0.6rem;
                border: 1px solid #9ca3af !important;
                color: #374151 !important;
            }
            
            .total-row {
                background-color: #f9fafb !important;
                font-weight: 600;
            }
            
            .total-row td {
                background-color: #f9fafb !important;
                color: #1f2937 !important;
                font-weight: 600;
            }
            
            @page {
                size: A4 portrait;
                margin: 0.5in;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="invoice">
            <div class="header">
                <h1 class="invoice-title">INVOICE</h1>
                <div class="logo-container">
                  <div class="gamepad-icon">
  <img 
    src="/logo.png" 
    alt="Logo" 
    style="width: 100px; height: 100px; border-radius: 12px; object-fit: cover;"
  />
</div>
                </div>
                <div class="company-details">
                    <h2 class="company-name">${merchantInfo.companyName}</h2>
                    <p class="company-address">${merchantInfo.address}</p>
                </div>
            </div>
            
            <div class="main-content">
                <div class="upper-section">
                    <div class="table-container">
                        <table class="invoice-table">
                            <thead>
                                <tr>
                                    <th>Bill to</th>
                                    <th>Transaction Date & Time</th>
                                    <th>Wallet loaded Date & Time</th>
                                    <th>RRN No.</th>
                                    <th>Invoice No.</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>${upiIdValue}</td>
                                    <td>${transactionDateValue} ${transactionTimeValue}</td>
                                    <td>${transactionDateValue} ${transactionTimeValue}</td>
                                    <td>${rowData[rrnColumn] || 'N/A'}</td>
                                    <td>${invoiceNumber}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="table-container">
                        <table class="invoice-table">
                            <thead>
                                <tr>
                                    <th>Sl No.</th>
                                    <th>Description</th>
                                    <th>Quantity</th>
                                    <th>Unit Price</th>
                                    <th>Gross Amount</th>
                                    <th>Tax Amount</th>
                                    <th>Net Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td class="center">1</td>
                                    <td>Wallet loading</td>
                                    <td class="center">1</td>
                                    <td class="right">₹ ${formattedAmount}</td>
                                    <td class="right">₹ ${formattedAmount}</td>
                                    <td class="center">-</td>
                                    <td class="right">₹ ${formattedAmount}</td>
                                </tr>
                                <tr class="total-row">
                                    <td colspan="4" class="right total-label">Total</td>
                                    <td class="right">₹ ${formattedAmount}</td>
                                    <td class="center">0</td>
                                    <td class="right">₹ ${formattedAmount}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="middle-spacer"></div>
                
                <div class="lower-section">
                    <div class="terms">
                        <h3>Terms</h3>
                        <div class="terms-content">
                            <p>1. By receiving this invoice, the user has paid the appropriate fees to JPPL through Payment Gate and accepts the company's terms and conditions in connection with the transaction.</p>
                            <p>2. All the invoices are raised against the UPI id through which the payment is collected</p>
                            <p>3. This is computer generated invoice and doesn't require a seal and signature.</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="print-button-container">
                <button onclick="downloadPDF()" class="print-button">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 17H15L12 14L9 17Z" fill="currentColor"/>
                        <path d="M20 6H16V4C16 2.89 15.11 2 14 2H10C8.89 2 8 2.89 8 4V6H4C2.89 6 2 6.89 2 8V16C2 17.11 2.89 18 4 18H8V20C8 21.11 8.89 22 10 22H14C15.11 22 16 21.11 16 20V18H20C21.11 18 22 17.11 22 16V8C22 6.89 21.11 6 20 6ZM10 4H14V6H10V4ZM14 20H10V16H14V20ZM20 16H16V14H8V16H4V8H20V16Z" fill="currentColor"/>
                    </svg>
                    Print Invoice
                </button>
            </div>
        </div>
    </div>
    
    <script>
        function downloadPDF() {
            const filename = '${pdfFilename}.pdf';
            
            const printButton = document.querySelector('.print-button-container');
            const originalDisplay = printButton.style.display;
            printButton.style.display = 'none';
            
            window.print();
            
            setTimeout(() => {
                printButton.style.display = originalDisplay;
            }, 1000);
        }
        
        window.onload = function() {
            document.addEventListener('keydown', function(e) {
                if (e.ctrlKey && e.key === 'p') {
                    e.preventDefault();
                    downloadPDF();
                }
            });
        }
    </script>
</body>
</html>`;
  };

 const downloadAsPDF = (htmlContent, filename) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    
    printWindow.onload = function() {
      
      console.log('Invoice window opened successfully');
    };
  };

  const generateAllPDFs = async () => {
    if (!preview || !preview.data.length) return;
    
    if (!rrnColumn) {
      setError('Please select an RRN column first');
      return;
    }
    
    if (!upiColumn) {
      setError('Please select a UPI ID column first');
      return;
    }

    if (!amountColumn) {
      setError('Please select an Amount column first');
      return;
    }

    if (!merchantColumn && !invoicePrefix.trim()) {
      setError('Please either select a merchant column or enter an invoice prefix');
      return;
    }
    
    setGeneratingPDFs(true);
    setPdfProgress(0);
    setError(null);
    
    try {
      const totalRows = preview.data.length;
      
      for (let i = 0; i < totalRows; i++) {
        const rowData = preview.data[i];
        const htmlContent = generateProfessionalInvoiceHTML(rowData, preview.headers, i + 1, totalRows);
        const filename = getFilenameFromRRN(rowData);
        
        downloadAsPDF(htmlContent, filename);
        
        setPdfProgress(Math.round(((i + 1) / totalRows) * 100));
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      alert(`Successfully opened ${totalRows} print dialogs. Use "Save as PDF" in each dialog to save with RRN-based filenames.`);
      
    } catch (error) {
      console.error('PDF generation error:', error);
      setError('Error generating PDFs: ' + error.message);
    }
    
    setGeneratingPDFs(false);
    setPdfProgress(0);
  };

  const generateSinglePDF = async (index) => {
    if (!preview || !preview.data[startIndex + index]) return;
    
    if (!rrnColumn) {
      setError('Please select an RRN column first');
      return;
    }
    
    if (!upiColumn) {
      setError('Please select a UPI ID column first');
      return;
    }

    if (!amountColumn) {
      setError('Please select an Amount column first');
      return;
    }

    if (!merchantColumn && !invoicePrefix.trim()) {
      setError('Please either select a merchant column or enter an invoice prefix');
      return;
    }
    
    setError(null);
    
    try {
      const rowData = preview.data[startIndex + index];
      const htmlContent = generateProfessionalInvoiceHTML(rowData, preview.headers, startIndex + index + 1, preview.data.length);
      const filename = getFilenameFromRRN(rowData);
      
      downloadAsPDF(htmlContent, filename);
      
    } catch (error) {
      console.error('Single PDF generation error:', error);
      setError('Error generating PDF: ' + error.message);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setRrnColumn('');
    setUpiColumn('');
    setMerchantColumn('');
    setAmountColumn('');
    setDuplicateColumn('');
    setInvoicePrefix('INV-');
    setDuplicates([]);
    setShowDuplicates(false);
    setCurrentPage(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header with Logo */}
     <div className="container mx-auto px-8 py-5">
        <div className="flex items-center justify-between">
          {/* Enhanced Logo Section */}
          <div className="flex items-center space-x-4">
           <div className="flex items-center space-x-4">
  <div className="relative">
    <div className="absolute inset-0 rounded-xl blur-xl" style={{backgroundColor: '#fff200', opacity: 0.2}}></div>
    
    <img 
      src="/logo hd.png" 
      alt="Professional Logo" 
      className="h-14 w-auto object-contain filter hover:brightness-110 transition-all duration-300"
    />
    
  </div>
</div>
          </div>

          {/* Professional Date & Time Display */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-800 tracking-wide">
                  {dateTime.split(' at ')[0]}
                </div>
                <div className="text-xs text-gray-500 font-mono tracking-wider">
                  {dateTime.split(' at ')[1] || new Date().toLocaleTimeString()}
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

      <div className="container mx-auto px-6 py-8">
        {/* Main Title Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-3">Lemonpay Invoice Generator</h2>
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
                      Supports Excel files (.xlsx, .xls) and CSV files with or without headers
                    </p>
                  </div>
                )}
              </div>

              {file && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={previewData}
                    disabled={loading}
                    className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Loading...
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
                
                {/* Column Detection Info */}
 
                {/* Duplicate Detection Section */}
                {preview && (
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
                          <div className="px-6 py-3 bg-blue-50 border-2 border-blue-200 text-blue-700 rounded-lg font-medium">
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
                                        .filter(([key]) => key !== '_rowIndex' && key !== '_originalIndex')
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
                )}

                {/* Custom Prefix Editor */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-800 flex items-center">
                      <Edit3 className="w-5 h-5 text-blue-500 mr-3" />
                      Custom Invoice Prefixes for All Merchants:
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
                          Merchant Column
                        </div>
                      </label>
                      <select
  value={merchantColumn}
  onChange={(e) => setMerchantColumn(e.target.value)}
  required
  className="w-full px-4 py-3 bg-orange-50 border-2 border-orange-200 rounded-lg text-orange-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:shadow-md"
>
  <option value="">Select merchant column </option>
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
                        className="w-full px-4 py-3 bg-white-50 border-2 border-green-200 rounded-lg text-green-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:shadow-md"
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
                  <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex flex-wrap gap-4">
                      <div className={`flex items-center px-3 py-1 rounded-full text-sm ${merchantColumn ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-500'}`}>
                        <div className={`w-2 h-2 rounded-full mr-2 ${merchantColumn ? 'bg-orange-500' : 'bg-gray-400'}`}></div>
                        Merchant: {merchantColumn || 'Not selected (will use default prefix)'}
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
                      Invoice Number Prefix:
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
                          ⚠️ Invoice prefix is required to generate PDFs
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {rrnColumn && upiColumn && amountColumn && (merchantColumn || invoicePrefix.trim()) && (
                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={generateAllPDFs}
                      disabled={generatingPDFs}
                      className="inline-flex items-center px-10 py-4 bg-gradient-to-r from-emerald-500 to-blue-600 text-white hover:from-emerald-600 hover:to-blue-700 rounded-xl font-bold text-lg shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                    >
                      <Download className="w-6 h-6 mr-3" />
                      {generatingPDFs ? `Generating... ${pdfProgress}%` : `Generate All ${preview.data.length} Invoices`}
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
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b">
                            Row #
                          </th>
                          {rrnColumn && (
                            <th className="px-6 py-4 text-left text-sm font-semibold text-blue-700 bg-blue-50 border-b border-blue-200">
                              {rrnColumn} (PDF Name)
                            </th>
                          )}
                          {merchantColumn && (
                            <th className="px-6 py-4 text-left text-sm font-semibold text-orange-700 bg-orange-50 border-b border-orange-200">
                              {merchantColumn} (Merchant)
                            </th>
                          )}
                          {upiColumn && (
                            <th className="px-6 py-4 text-left text-sm font-semibold text-emerald-700 bg-emerald-50 border-b border-emerald-200">
                              {upiColumn} (Bill To)
                            </th>
                          )}
                          {amountColumn && (
                            <th className="px-6 py-4 text-left text-sm font-semibold text-green-700 bg-green-50 border-b border-green-200">
                              {amountColumn} (Net Amount)
                            </th>
                          )}
                          {preview.headers.filter(header => 
                            header !== '_rowIndex' && header !== rrnColumn && header !== upiColumn && header !== merchantColumn && header !== amountColumn
                          ).slice(0, 2).map((header) => (
                            <th key={header} className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b">
                              {header}
                            </th>
                          ))}
                          <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 border-b">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentRows.map((row, index) => (
                          <tr key={startIndex + index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                              {startIndex + index + 1}
                            </td>
                            {rrnColumn && (
                              <td className="px-6 py-4 text-sm font-mono text-blue-800 bg-blue-50">
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
                              <td className="px-6 py-4 text-sm font-mono text-green-800 bg-green-50">
                                {formatCellValue(row[amountColumn], amountColumn)}
                              </td>
                            )}
                            {preview.headers.filter(header => 
                              header !== '_rowIndex' && header !== rrnColumn && header !== upiColumn && header !== merchantColumn && header !== amountColumn
                            ).slice(0, 2).map((header) => (
                              <td key={header} className="px-6 py-4 text-sm text-gray-900">
                                {formatCellValue(row[header], header).substring(0, 25)}
                                {formatCellValue(row[header], header).length > 25 ? '...' : ''}
                              </td>
                            ))}
                            <td className="px-6 py-4 text-center">
                              {rrnColumn && upiColumn && amountColumn && (merchantColumn || invoicePrefix.trim()) ? (
                                <button
                                  onClick={() => generateSinglePDF(index)}
                                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white hover:from-emerald-600 hover:to-blue-600 rounded-lg text-sm font-medium transition-all transform hover:scale-105 shadow-md"
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  Generate
                                </button>
                              ) : (
                                <div className="text-xs text-gray-400 text-center">
                                  {!rrnColumn ? 'Select RRN' : !upiColumn ? 'Select UPI' : !amountColumn ? 'Select Amount' : !merchantColumn && !invoicePrefix.trim() ? 'Select Merchant or Prefix' : 'Ready'}
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
            {generatingPDFs && (
              <div className="border-t bg-gradient-to-r from-purple-50 to-pink-50 p-8">
                <div className="text-center mb-4">
                  <h4 className="text-lg font-semibold text-purple-800">Generating Invoices...</h4>
                  <p className="text-sm text-purple-600">Please wait while we create your PDF invoices</p>
                </div>
                <div className="flex items-center justify-center space-x-4">
                  <div className="flex-1 max-w-md bg-purple-200 rounded-full h-4 shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all duration-300 shadow-lg"
                      style={{ width: `${pdfProgress}%` }}
                    ></div>
                  </div>
                  <div className="text-lg font-bold text-purple-700 min-w-[4rem]">{pdfProgress}%</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}