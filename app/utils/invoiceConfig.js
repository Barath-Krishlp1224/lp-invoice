/**
 * Utility functions for generating professional invoice HTML and configurations.
 */

// -----------------------------------------------------------------------------
// CONFIGURATION AND UTILITIES
// -----------------------------------------------------------------------------

/**
 * Retrieves the merchant-specific configuration based on the row data.
 * @param {object} rowData - The current transaction row data.
 * @param {string} merchantColumn - The name of the column containing the merchant name.
 * @returns {{companyName: string, address: string, termsAcronym: string}} The merchant configuration.
 */
export const getMerchantConfig = (rowData, merchantColumn) => {
    const auxfordAddress = 'NO 15 11 CROSS POONGAVANAM GARDEN MANAVELY KARIKALAMBAKAM PONDICHERRY - 605007 IN<br/>GST: 34AAYCA4056H1ZD';
    const jetpackAddress = 'No.195A Vinayagar koil St Eraiyur Tindivanam, Villupuram Tamil Nadu-604304 IN<br/>GST: 33AAFCJ9470R1ZS';

    const merchantConfig = {
        'auxford': {
            companyName: 'AUXFORD PRIVATE LIMITED',
            address: auxfordAddress,
            termsAcronym: 'APL'
        },
        'jetpack': {
            companyName: 'JETPACK PAMNETWORK PRIVATE LIMITED',
            address: jetpackAddress,
            termsAcronym: 'JPPL'
        }
    };

    if (!merchantColumn || !rowData[merchantColumn]) {
        return {
            ...merchantConfig['jetpack'],
            termsAcronym: merchantConfig['jetpack'].termsAcronym
        };
    }

    const merchantName = String(rowData[merchantColumn]).toLowerCase().trim();

    if (merchantName.includes('auxford')) {
        return merchantConfig['auxford'];
    } else if (merchantName.includes('jetpack')) {
        return merchantConfig['jetpack'];
    }

    return merchantConfig[merchantName] || merchantConfig['jetpack'];
};

// -----------------------------------------------------------------------------

/**
 * Attempts to detect required columns based on headers.
 */
export const detectRequiredColumns = (headers) => {
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

// -----------------------------------------------------------------------------

/**
 * Formats a cell value based on its inferred type (especially for currency and date).
 */
export const formatCellValue = (value, header) => {
    const headerLower = header?.toLowerCase() || '';

    if (typeof value === 'number') {
        if (headerLower.includes('amount') || headerLower.includes('txnamount')) {
            return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        }
        else if (headerLower.includes('date') && value > 40000 && value < 60000) {
            // Excel Date Handling: Converts to ISO string (YYYY-MM-DD)
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

// -----------------------------------------------------------------------------
// INVOICE GENERATION WITH INVOICE NUMBERS
// -----------------------------------------------------------------------------

/**
 * Generates the professional invoice HTML content for a single transaction.
 * @param {object} rowData - The current transaction row data.
 * @param {string[]} headers - The list of column headers.
 * @param {number|string|null} invoiceNumber - The dynamically generated or set invoice number.
 * @param {string} rrnColumn - The RRN column name.
 * @param {string} upiColumn - The UPI column name.
 * @param {string} merchantColumn - The Merchant column name.
 * @param {string} amountColumn - The Amount column name.
 * @param {object} customPrefixes - Custom prefix/suffix for invoice number (currently unused, but kept for future).
 */
export const generateProfessionalInvoiceHTML = (
    rowData,
    headers,
    invoiceNumber,
    rrnColumn,
    upiColumn,
    merchantColumn,
    amountColumn,
    customPrefixes 
) => {
    const currentDate = new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });

    const merchantInfo = getMerchantConfig(rowData, merchantColumn);
    const detectedCols = detectRequiredColumns(headers);

    // Prepare Invoice Number - use provided number or default to '-'
    const invoiceNumberToDisplay = invoiceNumber ? String(invoiceNumber) : '-';

    // 1. Get transaction date value (either YYYY-MM-DD from Excel or DD/MM/YYYY from fallback)
    const transactionDateValue = detectedCols.transactionDate && rowData[detectedCols.transactionDate] ?
        formatCellValue(rowData[detectedCols.transactionDate], detectedCols.transactionDate).split(' ')[0] :
        currentDate.split(',')[0].split(' ')[0];

    // 2. Get transaction time value
    const transactionTimeValue = detectedCols.transactionTime && rowData[detectedCols.transactionTime] ?
        formatCellValue(rowData[detectedCols.transactionTime], detectedCols.transactionTime) :
        currentDate.split(', ')[1]?.split(' ')[0] || '00:00';

    // 3. APPLY DD/MM/YYYY FORMAT CORRECTION
    let finalTransactionDate;
    if (transactionDateValue.includes('-')) {
        // Correct YYYY-MM-DD (from formatCellValue for Excel dates) to DD/MM/YYYY
        const parts = transactionDateValue.split('-');
        finalTransactionDate = `${parts[2]}/${parts[1]}/${parts[0]}`; 
    } else {
        // Assume DD/MM/YYYY format is already correct (from en-IN fallback or raw data)
        finalTransactionDate = transactionDateValue;
    }
    
    // 4. Combine the corrected date and time
    const combinedDateTime = `${transactionTimeValue}`;
    // END DATE FORMATTING FIX

    let amountValue = 0;
    if (amountColumn && rowData[amountColumn] !== undefined && rowData[amountColumn] !== null && rowData[amountColumn] !== '') {
        const rawValue = String(rowData[amountColumn]).replace(/[₹,\s]/g, '');
        amountValue = parseFloat(rawValue) || 0;
    } else if (detectedCols.amount && rowData[detectedCols.amount] !== undefined && rowData[detectedCols.amount] !== null && rowData[detectedCols.amount] !== '') {
        const rawValue = String(rowData[detectedCols.amount]).replace(/[₹,\s]/g, '');
        amountValue = parseFloat(rawValue) || 0;
    }
    const formattedAmount = amountValue.toLocaleString('en-IN', { minimumFractionDigits: 2 });

    const upiIdValue = upiColumn && rowData[upiColumn] ? formatCellValue(rowData[upiColumn], upiColumn) :
        (detectedCols.vpa && rowData[detectedCols.vpa] ? formatCellValue(rowData[detectedCols.vpa], detectedCols.vpa) : 'N/A');

    const rrnValue = rrnColumn && rowData[rrnColumn] ? formatCellValue(rowData[rrnColumn], rrnColumn) : 'N/A';

    const termsAcronym = merchantInfo.termsAcronym;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoiceNumberToDisplay} - ${rrnValue}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.3; 
            color: #374151;
            background-color: #f3f4f6;
            padding: 0;
            margin: 0;
            font-size: 10px; 
            min-height: 10vh;
        }
        
        .container {
            width: 100%; 
            max-width: 180mm; 
            margin: 0 auto; 
            padding: 0;
        }
        
        .invoice {
            background: white;
            padding: 5mm 10mm; 
            width: 100%;
            min-height: 277mm; 
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        
        .header {
            margin-bottom: 8mm; 
        }
        
        .invoice-title {
            font-size: 16px; 
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 3mm; 
            text-align: center;
        }
        
        .logo-container {
            display: flex;
            justify-content: flex-start; 
            margin-bottom: 4mm;
        }
        
        .company-details {
            text-align: left; 
        }
        
        .company-name {
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 2mm; 
            font-size: 14px;
        }
        
        .company-address {
            font-size: 10px; 
            color: #000000;
            line-height: 1.4;
            
        }
        
        .main-content {
            margin-bottom: 0px; 
        }
        
        .table-container {
            margin-bottom: 6mm;
            overflow-x: auto;
        }
        
        .invoice-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid black; 
            font-size: 10px; 
        }
        
        .invoice-table th {
            border: 1px solid black;
            padding: 2.5mm 3mm; 
            text-align: center;
            background-color: #FFDA64 !important;
            color: #1f2937 !important;
            font-weight: 600;
        }
        
        .invoice-table td {
            border: 1px solid black;
            padding: 2.5mm 3mm; 
            text-align: center;
            font-weight: normal;
        }
        
        .center {
            text-align: center;
        }
        
        .right {
            text-align: right;
        }
        
        .total-row {
            background-color: #f9fafb !important;
        }
        
        .total-row td {
            font-weight: bold !important;
        }
        
        .total-label {
            font-weight: 600;
        }
        
        .terms {
            margin-top: 10mm;
            page-break-inside: avoid;
        }
        
        .terms h3 {
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 3mm;
            font-size: 12px; 
            text-decoration: underline;
        }
        
        .terms-content {
            font-size: 10px; 
            color: #000000; 
            
            line-height: 1.2; 
            letter-spacing: 0.4px; 
        }
        
        .terms-content p {
            margin-bottom: 2mm; 
        }
        
        @media print {
            body {
                margin: 0;
                padding: 0;
                background: white;
            }
            
            .container {
                padding: 0;
                width: 100%;
                max-width: none;
                margin: 0;
            }
            
            .invoice {
                box-shadow: none;
                border-radius: 0;
                padding: 12mm 10mm;
                min-height: 277mm;
            }
            
            @page {
                size: A4 portrait;
                margin: 10mm;
            }
            
            .invoice-table th {
                background-color: #FFDA64 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .total-row {
                background-color: #f9fafb !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .total-row td {
                font-weight: bold !important;
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
                            style="width: 75px; height: auto; border-radius: 12px; object-fit: cover;"
                        />
                    </div>
                </div>
                <div class="company-details">
                    <h2 class="company-name">${merchantInfo.companyName}</h2>
                    <p class="company-address">
                        ${merchantInfo.address.replace(/<br\/>/g, '<br/>')}
                    </p>
                </div>
            </div>
            
            <div class="main-content">
                <div class="table-container">
                    <table class="invoice-table">
                        <thead>
                            <tr>
                                <th style="width: 33.33%;">Bill to</th>
                                <th style="width: 33.33%;">Transaction Date & Time</th>
                                <th style="width: 33.33%;">Wallet Load Date & Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="center">${upiIdValue}</td>
                                <td class="center">${combinedDateTime}</td>
                                <td class="center">${combinedDateTime}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div style="display: flex; gap: 10mm; margin-bottom: 6mm; align-items: flex-end;">
                    <div style="width: 33.33%;">
                        <table class="invoice-table">
                            <thead>
                                <tr>
                                    <th>RRN No.</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td class="center">${rrnValue}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <div style="width: 30%; margin-left: 40mm;">
                        <table class="invoice-table" style="table-layout: fixed;">
                            <tbody>
                                <tr>
                                    <td class="center" style="width: 10px; padding: 1mm 1.5mm; font-weight: bold;">Invoice No.</td>
                                    <td class="center" style="width: 10px; padding: 1mm 1.5mm; font-weight: bold;">${invoiceNumberToDisplay}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
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
                                <td class="center">Wallet loading</td>
                                <td class="center">1</td>
                                <td class="center">₹ ${formattedAmount}</td>
                                <td class="center">₹ ${formattedAmount}</td>
                                <td class="center">-</td>
                                <td class="center">₹ ${formattedAmount}</td>
                            </tr>
                            <tr class="total-row">
                                <td colspan="4" class="center total-label">Total</td>
                                <td class="center">₹ ${formattedAmount}</td>
                                <td class="center">0</td>
                                <td class="center">₹ ${formattedAmount}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="terms">
                    <h3>Terms:</h3>
                    <div class="terms-content">
                        <p>1. By receiving this invoice, the user has paid the appropriate fees to ${termsAcronym} through Payment Gate and accepts the company's terms and conditions in connection with the transaction.</p>
                        <p>2. All the invoices are raised against the UPI id through which the payment is collected</p>
                        <p>3. This is computer generated invoice and doesn't require a seal and signature.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
};