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
            line-height: 1.4;
            color: #374151;
            background-color: white;
            padding: 0;
            font-size: 12px;
        }
        
        .container {
            /* Ensures content aligns within a standard printable width */
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
        }
        
        /* >>>>>>>>>>>>> CRITICAL CSS FIXES FOR SINGLE PAGE/ALIGNMENT <<<<<<<<<<<<< */
        .invoice {
            background: white;
            padding: 1.5rem;
            display: block; 
            /* FIXED: Removed min-height: 297mm to prevent forced page breaks */
            position: relative;
            page-break-inside: avoid !important; 
            border: 1px solid #e5e7eb; 
        }

        /* Ensure major sections don't cause trailing breaks */
        .header, .main-content, .upper-section, .lower-section, .table-container {
            page-break-after: avoid;
            page-break-inside: avoid !important; /* Secondary assurance */
        }
        /* >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> */
        
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
            min-height: 0;
        }
        
        .upper-section {
            flex-shrink: 0;
        }
        
        .middle-spacer {
            display: none;
        }
        
        .lower-section {
            flex-shrink: 0;
            page-break-inside: avoid !important;
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
            background-color: #FFDA64 !important;
            color: #1f2937 !important;
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
            background-color: #f9fafb !important;
            font-weight: 600;
        }
        
        .total-label {
            font-weight: 600;
        }
        
        .terms {
            /* FIXED: Reduced margin-top from 5rem to 1rem to save vertical space */
            margin-top: 1rem; 
            page-break-inside: avoid !important; 
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
        
        /* Button Styling for the single PDF viewer */
        .print-button-container {
            display: flex !important;
            justify-content: center;
            margin-top: 3rem;
            page-break-inside: avoid !important;
        }
        
        .print-button {
            display: inline-flex;
            align-items: center;
            padding: 10px 20px;
            background-color: #1c7ed6; /* Blue color */
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transition: background-color 0.3s ease;
        }
        
        .print-button:hover {
            background-color: #1864ab; 
        }

        .print-button svg {
            margin-right: 8px;
        }
        
        @media screen, print {
             .invoice-table th { background-color: #FFDA64 !important; }
             .total-row { background-color: #f9fafb !important; }
             .total-row td { background-color: #f9fafb !important; }
        }
        
        @media print {
            .invoice {
                box-shadow: none;
                border-radius: 0;
                padding: 0.5rem;
                height: auto; 
                display: block;
                border: none !important;
            }
            /* Hide button when print dialog is open */
            .print-button-container {
                display: none !important;
            }
            @page {
                size: A4 portrait;
                /* FIXED: Reduced margin from 0.5in to 0.4in to gain vertical space */
                margin: 0.4in; 
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
                </div>
                
                <div class="lower-section">
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
            
            // Hide the button container before printing
            const printButton = document.querySelector('.print-button-container');
            const originalDisplay = printButton.style.display;
            printButton.style.display = 'none';
            
            document.title = filename; 

            window.print();
            
            // Restore the button after printing dialog is closed (with a small delay)
            setTimeout(() => {
                printButton.style.display = originalDisplay;
            }, 1000);
        }
        
        window.onload = function() {
            document.addEventListener('keydown', function(e) {
                // Ctrl+P / Cmd+P shortcut
                if (e.ctrlKey && e.key === 'p' || e.metaKey && e.key === 'p') {
                    e.preventDefault();
                    downloadPDF();
                }
            });
        }
    </script>
</body>
</html>`;
};