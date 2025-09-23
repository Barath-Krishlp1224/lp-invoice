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