/**
 * Utility functions for generating professional invoice HTML and configurations.
 */

// -----------------------------------------------------------------------------
// CONFIGURATION AND UTILITIES
// -----------------------------------------------------------------------------

// --- SPARKLEAP SPECIFIC CONFIGURATION ---
const SPARKLEAP_ADDRESS = 'NO 195, VINAYAKAR KOVIL, STREET, VANUR TK, Eraiyur,<br/>Tindivanam, Villupuram- 604304 IN<br/>GST: 33ABOCS4605D1ZI';
const SPARKLEAP_CONFIG = {
    companyName: 'SPARKLEAP TECH SOFTWARE SOLUTIONS PRIVATE LIMITED',
    address: SPARKLEAP_ADDRESS,
    termsAcronym: 'SPKL'
};
// ------------------------------------------

/**
 * Retrieves the merchant-specific configuration based on the row data.
 * @param {object} rowData - The current transaction row data.
 * @param {string} merchantColumn - The name of the column containing the merchant name.
 * @returns {{companyName: string, address: string, termsAcronym: string}} The merchant configuration.
 */
export const getMerchantConfig = (rowData, merchantColumn) => {
    
    if (!merchantColumn || !rowData[merchantColumn]) {
        return SPARKLEAP_CONFIG;
    }

    const merchantName = String(rowData[merchantColumn]).toLowerCase().trim();

    if (merchantName.includes('sparkleap')) {
        return SPARKLEAP_CONFIG;
    }
    
    return SPARKLEAP_CONFIG;
};

// -----------------------------------------------------------------------------

/**
 * Attempts to detect required columns based on headers. (Only kept for compatibility with other parts of the system)
 */
export const detectRequiredColumns = (headers) => {
    const detectedColumns = {};

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
            lower.includes('virtual') && lower.includes('payment') ||
            lower.includes('payee') && (lower.includes('vpa') || lower.includes('upi'));
    });

    return detectedColumns;
};

// -----------------------------------------------------------------------------

/**
 * Formats a cell value based on its inferred type (especially for currency and date).
 * FIX APPLIED: Manually constructs DD/MM/YYYY HH:MM format for consistent output 
 * regardless of browser/environment locale settings, ensuring Date/Month/Year order.
 */
export const formatCellValue = (value, header) => {
    const headerLower = header?.toLowerCase() || '';

    if (typeof value === 'number') {
        if (headerLower.includes('amount') || headerLower.includes('txnamount')) {
            return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        }
        // Handle Excel date number: check if it's a date number (usually large)
        if (value > 10000 && value < 100000) {
            // This is a rough check for typical Excel date numbers (1927 to 2195)
            const excelDate = new Date((value - 25569) * 86400 * 1000);
            
            // Check if the output is a valid date string
            if (!isNaN(excelDate.getTime())) {
                // Manually construct DD/MM/YYYY HH:MM
                const day = String(excelDate.getDate()).padStart(2, '0');
                const month = String(excelDate.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
                const year = excelDate.getFullYear();
                const hours = String(excelDate.getHours()).padStart(2, '0');
                const minutes = String(excelDate.getMinutes()).padStart(2, '0');

                return `${day}/${month}/${year} ${hours}:${minutes}`;
            }
        }
        
        return value.toString();
    }
    
    // For Date objects passed from the data hook, format them nicely
    if (value instanceof Date && !isNaN(value.getTime())) {
        // Manually construct DD/MM/YYYY HH:MM
        const day = String(value.getDate()).padStart(2, '0');
        const month = String(value.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
        const year = value.getFullYear();
        const hours = String(value.getHours()).padStart(2, '0');
        const minutes = String(value.getMinutes()).padStart(2, '0');

        return `${day}/${month}/${year} ${hours}:${minutes}`;
    }

    // For RRN/UTR/UPI (which should generally be strings)
    return String(value || '');
};

// -----------------------------------------------------------------------------
// INVOICE GENERATION
// -----------------------------------------------------------------------------

/**
 * Generates the professional invoice HTML content for a single transaction.
 * @param {object} rowData - The current transaction row data.
 * @param {number|string|null} invoiceNumber - The dynamically generated or set invoice number.
 * @param {string} rrnColumn - The RRN column name.
 * @param {string} upiColumn - The UPI column name.
 * @param {string} merchantColumn - The Merchant column name.
 * @param {string} amountColumn - The Amount column name.
 * @param {string} dateColumn - The Date/Time column name (NEW REQUIRED PARAMETER).
 */
export const generateProfessionalInvoiceHTML = (
    rowData,
    invoiceNumber,
    rrnColumn,
    upiColumn,
    merchantColumn,
    amountColumn,
    dateColumn // New required parameter
) => {
    // --- Merchant Info ---
    const merchantInfo = getMerchantConfig(rowData, merchantColumn);

    // --- Invoice Number ---
    const invoiceNumberToDisplay = invoiceNumber ? String(invoiceNumber) : '-';

    // --- Transaction Date/Time (FIXED LOGIC) ---
    // Use the value directly from the selected dateColumn
    let transactionDateTimeDisplay = 'N/A';
    if (dateColumn && rowData[dateColumn] !== undefined) {
        // This relies on the now-fixed formatCellValue
        transactionDateTimeDisplay = formatCellValue(rowData[dateColumn], dateColumn);
    }
    
    // Fallback detection (for amount and VPA)
    const detectedCols = detectRequiredColumns([]); // Pass empty headers as we rely on explicit column names

    // --- Amount ---
    let amountValue = 0;
    if (amountColumn && rowData[amountColumn] !== undefined && rowData[amountColumn] !== null && rowData[amountColumn] !== '') {
        const rawValue = String(rowData[amountColumn]).replace(/[₹,\s]/g, '');
        amountValue = parseFloat(rawValue) || 0;
    } else if (detectedCols.amount && rowData[detectedCols.amount] !== undefined && rowData[detectedCols.amount] !== null && rowData[detectedCols.amount] !== '') {
        const rawValue = String(rowData[detectedCols.amount]).replace(/[₹,\s]/g, '');
        amountValue = parseFloat(rawValue) || 0;
    }
    const formattedAmount = amountValue.toLocaleString('en-IN', { minimumFractionDigits: 2 });

    // --- Bill To (UPI ID) ---
    const upiIdValue = upiColumn && rowData[upiColumn] ? formatCellValue(rowData[upiColumn], upiColumn) :
        (detectedCols.vpa && rowData[detectedCols.vpa] ? formatCellValue(rowData[detectedCols.vpa], detectedCols.vpa) : 'N/A');

    // --- TXN ID (RRN) ---
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
                    <table class="invoice-table" style="table-layout: fixed;">
                        <thead>
                            <tr>
                                <th style="width: 33.33%; padding: 1.5mm 2mm;">Bill to</th>
                                <th style="width: 33.33%; padding: 1.5mm 2mm;">Transaction Date & Time</th>
                                <th style="width: 33.34%; padding: 1.5mm 2mm;">Wallet Load Date & Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="center" style="padding: 1.5mm 2mm;">${upiIdValue}</td>
                                <td class="center" style="padding: 1.5mm 2mm;">${transactionDateTimeDisplay}</td>
                                <td class="center" style="padding: 1.5mm 2mm;">${transactionDateTimeDisplay}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div style="display: flex; gap: 6mm; margin-bottom: 6mm; align-items: flex-end;">
                    <div style="width: 33.33%;">
                        <table class="invoice-table">
                            <thead>
                                <tr>
                                    <th style="padding: 1.5mm 3mm;">TXN ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td class="center" style="padding: 1.5mm 3mm;">${rrnValue}</td>
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