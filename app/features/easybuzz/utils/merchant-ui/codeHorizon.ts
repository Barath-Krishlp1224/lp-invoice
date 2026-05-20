import { escapeHtml } from "./shared";
import type { MerchantInvoiceRenderContext } from "./types";

const normalizeCurrencyValue = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === "string") {
        const normalized = value.replace(/[^0-9.-]/g, "");
        if (!normalized) {
            return null;
        }

        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
};

const formatCurrencyValue = (value: number): string =>
    value.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

export const renderCodeHorizonInvoiceHTML = ({
    merchantInfo,
    invoiceNumberToDisplay,
    rrnValue,
    formattedAmount,
    receiptEntityName,
    descriptionText,
    fields,
}: MerchantInvoiceRenderContext) => {
    const dynamicFields = fields as typeof fields & Record<string, unknown>;
    const possibleTaxValue =
        dynamicFields.taxAmount ??
        dynamicFields.tax ??
        dynamicFields.gstAmount ??
        merchantInfo?.taxAmount ??
        merchantInfo?.tax ??
        merchantInfo?.gstAmount;

    const resolvedTaxAmount = normalizeCurrencyValue(possibleTaxValue) ?? 0;
    const taxDisplay = resolvedTaxAmount > 0 ? formatCurrencyValue(resolvedTaxAmount) : "0";

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(rrnValue)}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            --brand-color: ${merchantInfo.themeColor || "#0f8ea5"};
            --brand-light: #e8f7fa;
            --brand-dark: #0a6b7d;
            margin: 0;
            background: #f5f5f5;
            color: #2d3748;
            font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        }
        .page {
            width: 210mm;
            height: 297mm;
            margin: 0 auto;
            background: #ffffff;
            position: relative;
            overflow: hidden;
        }

        /* Header Section */
        .header {
            background: #f8f9fa;
            padding: 10mm 12mm 8mm;
            position: relative;
        }
        .header-content {
            display: grid;
            grid-template-columns: max-content minmax(0, 1fr);
            align-items: center;
            column-gap: 10mm;
        }
        .logo-section {
            width: 60mm;
        }
        .logo-section img {
            max-width: 100%;
            max-height: 25mm;
            object-fit: contain;
            display: block;
        }
        .invoice-title-section {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            width: 100%;
        }
        .invoice-title {
            font-size: 36px;
            font-weight: 300;
            letter-spacing: 8px;
            margin-bottom: 5mm;
            color: #9ca3af;
        }
        .invoice-meta-grid {
            display: grid;
            gap: 2.5mm;
            width: 100%;
            max-width: 90mm;
            justify-items: end;
            margin-left: auto;
        }
        .meta-row {
            display: grid;
            grid-template-columns: 30mm minmax(0, 1fr);
            justify-content: end;
            align-items: center;
            column-gap: 4mm;
            font-size: 12px;
            width: 100%;
        }
        .meta-label {
            font-weight: 600;
            color: #6b7280;
            text-align: right;
        }
        .meta-value {
            font-weight: 700;
            color: #1f2937;
            white-space: nowrap;
        }

        /* Content Section */
        .content {
            padding: 8mm 12mm 10mm;
        }

        /* Info Cards Grid */
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6mm;
            margin-bottom: 8mm;
        }
        .info-card {
            background: #ffffff;
            border: 2px solid var(--brand-color);
            border-radius: 12px;
            padding: 6mm;
            position: relative;
        }
        .card-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--brand-color);
            margin-bottom: 4mm;
        }
        .info-card:first-child {
            text-align: center;
        }
        .info-card:nth-child(2) .card-title {
            text-align: center;
        }
        .merchant-name {
            font-size: 15px;
            font-weight: 700;
            color: #1a202c;
            margin-bottom: 2mm;
            line-height: 1.4;
        }
        .merchant-address {
            font-size: 11px;
            color: #4a5568;
            line-height: 1.6;
        }
        .transaction-grid {
            display: grid;
            gap: 2.5mm;
        }
        .transaction-row {
            display: grid;
            grid-template-columns: 1fr 3mm minmax(0, 1fr);
            align-items: center;
            font-size: 11px;
            padding: 2mm 0;
            column-gap: 2mm;
        }
        .transaction-row span:first-child {
            color: #6b7280;
            font-weight: 500;
            text-align: right;
        }
        .transaction-row .transaction-colon {
            color: #6b7280;
            font-weight: 600;
            text-align: center;
        }
        .transaction-row span:last-child {
            color: #1f2937;
            font-weight: 700;
            text-align: left;
        }

        /* Table Section */
        .table-section {
            margin-bottom: 8mm;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
        }
        .table thead {
            background: #f3f4f6;
        }
        .table th {
            color: #6b7280;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 4mm 3mm;
            text-align: center;
            border-bottom: 2px solid #e5e7eb;
        }
        .table tbody td {
            padding: 4mm 3mm;
            font-size: 12px;
            color: #374151;
            background: #ffffff;
            border-bottom: 1px solid #f3f4f6;
            text-align: center;
            font-weight: 600;
        }
        .table th:last-child,
        .table tbody td:last-child {
            white-space: nowrap;
        }
        .table .total-row td {
            background: #f9fafb;
            font-weight: 800;
            font-size: 13px;
            color: #1f2937;
            border-bottom: none;
            border-top: 2px solid #e5e7eb;
            padding: 4.5mm 3mm;
            text-align: center;
        }

        /* Summary & Terms Grid */
        .bottom-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6mm;
        }
        
        /* Terms Section */
        .terms-section {
            background: #ffffff;
            border: 2px solid var(--brand-color);
            border-radius: 12px;
            padding: 6mm;
        }
        .terms-title {
            font-size: 12px;
            font-weight: 700;
            color: var(--brand-color);
            margin-bottom: 3mm;
            display: flex;
            align-items: center;
            gap: 2mm;
        }
        .terms-title::before {
            content: "▲";
            font-size: 12px;
        }
        .terms-list {
            list-style: none;
            font-size: 10px;
            line-height: 1.7;
            color: #4a5568;
        }
        .terms-list li {
            position: relative;
            padding-left: 5mm;
            margin-bottom: 3mm;
        }
        .terms-list li::before {
            content: "▸";
            position: absolute;
            left: 0;
            color: var(--brand-color);
            font-weight: bold;
        }

        /* Amount Summary Section */
        .summary-section {
            background: #ffffff;
            padding: 6mm;
            margin-bottom: -50mm;
        }
        .summary-title {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--brand-color);
            margin-bottom: 4mm;
            text-align: center;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 2.5mm 0;
            font-size: 12px;
            color: #4a5568;
            border-bottom: 1px solid #f3f4f6;
        }
        .summary-row:last-of-type {
            margin-bottom: 4mm;
        }
        .summary-row strong {
            color: #1f2937;
            font-weight: 700;
        }
        .total-amount-box {
            background: #f9fafb;
            border: 2px solid #e5e7eb;
            padding: 5mm;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 4mm;
        }
        .total-amount-box span {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #6b7280;
        }
        .total-amount-box strong {
            font-size: 24px;
            font-weight: 800;
            color: #1f2937;
        }

        /* Footer */
        .footer {
            position: absolute;
            bottom: 8mm;
            left: 12mm;
            right: 12mm;
            text-align: center;
            font-size: 9px;
            color: #9ca3af;
            padding-top: 4mm;
            border-top: 1px solid #e5e7eb;
        }

        @media print {
            body {
                background: #ffffff;
                margin: 0;
                padding: 0;
            }
            .page {
                width: 210mm;
                height: 297mm;
                margin: 0;
                box-shadow: none;
            }
            
            /* Force colors to print */
            .header,
            .info-card,
            .table thead,
            .table tbody td,
            .table .total-row td,
            .terms-section,
            .summary-section,
            .total-amount-box,
            .meta-value {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            
            @page {
                size: A4 portrait;
                margin: 0;
            }
        }
    </style>
</head>
<body>
    <div class="page">
        <!-- Header Section -->
        <div class="header">
            <div class="header-content">
                <div class="logo-section">
                    <img src="${merchantInfo.logoPath}" alt="${escapeHtml(merchantInfo.displayName)} logo" />
                </div>
                <div class="invoice-title-section">
                    <div class="invoice-meta-grid">
                        <div class="meta-row">
                            <span class="meta-label">Invoice Number:</span>
                            <span class="meta-value">${escapeHtml(invoiceNumberToDisplay)}</span>
                        </div>
                        <div class="meta-row">
                            <span class="meta-label">RRN Number:</span>
                            <span class="meta-value">${escapeHtml(rrnValue)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Content Section -->
        <div class="content">
            <!-- Info Cards Grid -->
            <div class="info-grid">
                <div class="info-card">
                    <div class="card-title">MERCHANT DETAILS</div>
                    <div class="merchant-name">${escapeHtml(merchantInfo.companyName)}</div>
                    <div class="merchant-address">${merchantInfo.address}</div>
                </div>
                <div class="info-card">
                    <div class="card-title">TRANSACTION DETAILS</div>
                    <div class="transaction-grid">
                        <div class="transaction-row">
                            <span>Customer Name</span>
                            <span class="transaction-colon">:</span>
                            <span>${fields.customerName}</span>
                        </div>
                        <div class="transaction-row">
                            <span>UPI ID</span>
                            <span class="transaction-colon">:</span>
                            <span>${fields.upiId}</span>
                        </div>
                        <div class="transaction-row">
                            <span>Transaction Date</span>
                            <span class="transaction-colon">:</span>
                            <span>${fields.transactionDateOnly}</span>
                        </div>
                        <div class="transaction-row">
                            <span>Transaction Time</span>
                            <span class="transaction-colon">:</span>
                            <span>${fields.transactionTimeOnly}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Table Section -->
            <div class="table-section">
                <table class="table">
                    <thead>
                        <tr>
                            <th style="width: 40%;">DESCRIPTION</th>
                            <th style="width: 8%;">QTY</th>
                            <th style="width: 13%;">UNIT PRICE</th>
                            <th style="width: 13%;">GROSS AMT</th>
                            <th style="width: 13%;">TAX</th>
                            <th style="width: 13%;">NET AMOUNT</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${escapeHtml(descriptionText)}</td>
                            <td>1</td>
                            <td>₹ ${formattedAmount}</td>
                            <td>₹ ${formattedAmount}</td>
                            <td>${taxDisplay === "0" ? "0" : `₹ ${taxDisplay}`}</td>
                            <td>₹ ${formattedAmount}</td>
                        </tr>
                        <tr class="total-row">
                            <td colspan="3">TOTAL</td>
                            <td>0</td>
                            <td>${taxDisplay === "0" ? "0" : `₹ ${taxDisplay}`}</td>
                            <td>₹ ${formattedAmount}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Bottom Grid: Terms & Summary -->
            <div class="bottom-grid">
                <div class="terms-section">
                    <div class="terms-title">Terms & Conditions</div>
                    <ul class="terms-list">
                        <li>By receiving this receipt, the user confirms that the applicable fees were paid to ${escapeHtml(receiptEntityName)} through the payment gateway and accepts the company's terms related to this transaction.</li>
                        <li>This receipt is issued against the UPI ID through which the payment was collected and verified.</li>
                        <li>This is a computer-generated receipt and does not require a physical seal or signature for validation.</li>
                    </ul>
                </div>

                <div class="summary-section">
                    <div class="total-amount-box">
                        <span>TOTAL:</span>
                        <strong>₹ ${formattedAmount}</strong>
                    </div>
                </div>
            </div>
        </div>

    </div>
</body>
</html>`;
};
