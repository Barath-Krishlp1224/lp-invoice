// ../utils/invoiceConfig.js

/**
 * Retrieves the merchant-specific configuration based on the row data.
 * @param {object} rowData - The current transaction row data.
 * @param {string} merchantColumn - The name of the column containing the merchant name.
 * @param {object} customPrefixes - The user-defined custom prefixes.
 * @returns {{companyName: string, address: string, invoicePrefix: string, termsAcronym: string}} The merchant configuration.
 */
export const getMerchantConfig = (rowData, merchantColumn, customPrefixes) => {
    const merchantConfig = {
        'auxford': {
            companyName: 'AUXFORD PRIVATE LIMITED',
            address: 'NO 15 11 CROSS POONGAVANAM GARDEN MANAVELY KARIKALAMBAKAM PONDICHERRY - 605007 IN GST: 34AAYCA4056H1ZD',
            invoicePrefix: customPrefixes.auxford || 'AUX-',
            termsAcronym: 'APL' 
        },
        'jetpack': {
            companyName: 'JETPACK PAMNETWORK PRIVATE LIMITED',
            address: 'No.195A Vinayagar koil St Eraiyur Tindivanam, Villupuram Tamil Nadu-604304 IN GST:33AAFCJ9470R1ZS',
            invoicePrefix: customPrefixes.jetpack || 'JET-',
            termsAcronym: 'JPPL' 
        }
    };

    if (!merchantColumn || !rowData[merchantColumn]) {
        // Default (Jetpack) logic
        return {
            ...merchantConfig['jetpack'],
            invoicePrefix: customPrefixes.default || merchantConfig['jetpack'].invoicePrefix,
            termsAcronym: merchantConfig['jetpack'].termsAcronym
        }; 
    }

    const merchantName = String(rowData[merchantColumn]).toLowerCase().trim();

    if (merchantName.includes('auxford')) {
        return merchantConfig['auxford'];
    } else if (merchantName.includes('jetpack')) {
        return merchantConfig['jetpack'];
    }

    // Default return if no specific match
    return merchantConfig[merchantName] || merchantConfig['jetpack'];
};

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

/**
 * Generates the professional invoice HTML content for a single transaction.
 */
export const generateProfessionalInvoiceHTML = (rowData, headers, rowIndex, rrnColumn, upiColumn, merchantColumn, amountColumn, customPrefixes) => {
    const currentDate = new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });

    const merchantInfo = getMerchantConfig(rowData, merchantColumn, customPrefixes);
    const detectedCols = detectRequiredColumns(headers);

    const transactionDateValue = detectedCols.transactionDate && rowData[detectedCols.transactionDate] ?
        formatCellValue(rowData[detectedCols.transactionDate], detectedCols.transactionDate).split(' ')[0] :
        currentDate.split(',')[0].split(' ')[0];

    const transactionTimeValue = detectedCols.transactionTime && rowData[detectedCols.transactionTime] ?
        formatCellValue(rowData[detectedCols.transactionTime], detectedCols.transactionTime) :
        currentDate.split(', ')[1]?.split(' ')[0] || '00:00';

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

    const invoiceNumber = `${merchantInfo.invoicePrefix}${String(rowIndex).padStart(3, '0')}`;
    const pdfFilename = rrnColumn && rowData[rrnColumn] ? `Invoice_${String(rowData[rrnColumn]).replace(/[^a-zA-Z0-9_-]/g, '_')}` : `Invoice_${rowIndex}`;

    const termsAcronym = merchantInfo.termsAcronym;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${rrnValue}</title>
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
            /* CRITICAL FIX: Base font size reduced */
            font-size: 10px; 
            min-height: 100vh;
        }
        
        .container {
            width: 100%; 
            max-width: 210mm; 
            margin: 0 auto; 
            padding: 0;
        }
        
        .invoice {
            background: white;
            /* CRITICAL FIX: Reduced vertical padding to minimal */
            padding: 5px 10px 5px 10px; 
            width: 100%;
            min-height: 297mm;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        
        .header {
            text-align: center;
            /* CRITICAL FIX: Reduced margin */
            margin-bottom: 5px;
        }
        
        .invoice-title {
            font-size: 24px; 
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 5px;
        }
        
        .logo-container {
            display: flex;
            justify-content: center;
            margin-bottom: 5px;
        }
        
        .company-details {
            max-width: 500px;
            margin: 0 auto;
            text-align: center; 
        }
        
        .company-name {
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 8px; 
            font-size: 14px;
        }
        
        .company-address {
            font-size: 10px; /* Aligned with base font */
            color: #6b7280;
            line-height: 1.4; 
        }
        
        .main-content {
            /* CRITICAL FIX: Removed margin */
            margin-bottom: 0px; 
        }
        
        .table-container {
            /* CRITICAL FIX: Reduced margin */
            margin-bottom: 8px; 
            overflow-x: auto;
        }
        
        .invoice-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #FFDA64;
            font-size: 10px; /* Aligned with base font */
        }
        
        .invoice-table th,
        .invoice-table td {
            border: 1px solid #FFDA64;
            /* CRITICAL FIX: Reduced vertical padding */
            padding: 5px 8px; 
            text-align: left;
        }
        
        .invoice-table th {
            background-color: #FFDA64 !important;
            color: #1f2937 !important;
            font-weight: 600;
        }
        
        .center {
            text-align: center;
        }
        
        .right {
            text-align: right;
        }
        
        .total-row {
            background-color: #f9fafb !important;
            font-weight: 600;
        }
        
        .total-label {
            font-weight: 600;
        }
        
        .terms {
            margin-top: 15px; /* Reduced from 20px */
            page-break-inside: avoid;
        }
        
        .terms h3 {
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 5px; /* Reduced from 10px */
            font-size: 12px; /* Reduced from 13px */
        }
        
        .terms-content {
            font-size: 10px; /* Aligned with base font */
            color: #6b7280;
            line-height: 1.4; /* Reduced line height */
        }
        
        .terms-content p {
            /* CRITICAL FIX: Reduced vertical margin */
            margin-bottom: 4px; 
        }
        
        @media print {
            body {
                margin: 0;
                padding: 0;
            }
            
            .container {
                padding: 0;
                width: 100%;
                max-width: none;
            }
            
            .invoice {
                box-shadow: none;
                border-radius: 0;
                padding: 0;
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
                            /* CRITICAL FIX: Reduced image size */
                            style="width: 80px; height: auto; border-radius: 12px; object-fit: cover;"
                        />
                    </div>
                </div>
                <div class="company-details">
                    <h2 class="company-name">${merchantInfo.companyName}</h2>
                    <p class="company-address">${merchantInfo.address}</p>
                </div>
            </div>
            
            <div class="main-content">
                <div class="table-container">
                    <table class="invoice-table">
                        <thead>
                            <tr>
                                <th>Bill to</th>
                                <th>Transaction Date & Time</th>
                                <th>RRN No.</th>
                                <th>Invoice No.</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${upiIdValue}</td>
                                <td>${transactionTimeValue}</td>
                                <td>${rrnValue}</td>
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
                
                <div class="terms">
                    <h3>Terms</h3>
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