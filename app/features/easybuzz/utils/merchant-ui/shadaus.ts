import { escapeHtml, formatRrnValue } from "./shared";
import type { MerchantInvoiceRenderContext } from "./types";

export const renderShadausInvoiceHTML = ({
    merchantInfo,
    invoiceNumberToDisplay,
    rrnValue,
    formattedAmount,
    receiptEntityName,
    descriptionText,
    fields,
}: MerchantInvoiceRenderContext) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(formatRrnValue(rrnValue))}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            margin: 0;
            background: #0f172a;
            color: #1e293b;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
        }
        .page {
            width: 100%;
            max-width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 10mm 0;
        }
        .invoice {
            width: 170mm;
            min-height: 277mm;
            margin: 0 auto;
            background: #ffffff;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            position: relative;
            overflow: hidden;
        }
        
        /* Decorative Header Background */
        .header-decoration {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 85mm;
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%);
            clip-path: polygon(0 0, 100% 0, 100% 75%, 0 100%);
            z-index: 0;
        }
        
        .header-pattern {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 85mm;
            opacity: 0.1;
            background-image: 
                repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.3) 10px, rgba(255,255,255,0.3) 20px),
                repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(255,255,255,0.2) 10px, rgba(255,255,255,0.2) 20px);
        }
        
        .content-wrapper {
            position: relative;
            z-index: 1;
            padding: 14mm 12mm 9mm;
        }
        
        /* Top Header Section */
        .top-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8mm;
        }
        
        .brand-area {
            flex: 1;
        }
        
        .brand-logo {
            background: rgba(255, 255, 255, 0.95);
            padding: 4mm;
            border-radius: 3mm;
            display: inline-block;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .brand-logo img {
            width: 70mm;
            max-height: 18mm;
            object-fit: contain;
            display: block;
        }
        
        .invoice-badge {
            text-align: right;
        }
        
        .badge-main {
            background: rgba(255, 255, 255, 0.95);
            padding: 4mm 5mm;
            border-radius: 3mm;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            display: inline-block;
            min-width: 55mm;
        }
        
        .invoice-label {
            font-size: 8mm;
            font-weight: 900;
            color: #1e40af;
            letter-spacing: 0.05em;
            margin-bottom: 2mm;
            display: block;
        }
        
        .invoice-meta {
            display: grid;
            gap: 1.5mm;
            margin-top: 3mm;
        }
        
        .invoice-meta-row {
            display: flex;
            justify-content: space-between;
            font-size: 2.8mm;
            padding: 1.5mm 0;
            border-bottom: 0.2mm solid #e2e8f0;
        }
        
        .invoice-meta-row:last-child {
            border-bottom: none;
        }
        
        .meta-label {
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-size: 2.4mm;
        }
        
        .meta-value {
            color: #0f172a;
            font-weight: 700;
            font-size: 2.8mm;
        }
        
        /* Info Cards Section */
        .info-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6mm;
            margin-top: 10mm;
            margin-bottom: 8mm;
        }
        
        .info-card {
            background: #ffffff;
            border: 0.4mm solid #e2e8f0;
            border-radius: 3mm;
            padding: 5mm;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            position: relative;
            overflow: hidden;
        }
        
        .info-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 1mm;
            background: linear-gradient(90deg, #3b82f6, #60a5fa);
        }
        
        .card-title {
            font-size: 3mm;
            font-weight: 700;
            color: #3b82f6;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 3mm;
            display: flex;
            align-items: center;
            gap: 2mm;
        }
        
        .card-title::before {
            content: '';
            width: 1mm;
            height: 4mm;
            background: #3b82f6;
            display: block;
        }
        
        .card-name {
            font-size: 5mm;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 2mm;
            line-height: 1.3;
        }
        
        .card-address {
            font-size: 3.2mm;
            line-height: 1.6;
            color: #475569;
        }
        
        .transaction-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 3mm;
        }
        
        .transaction-item {
            background: #f8fafc;
            padding: 3mm;
            border-radius: 2mm;
            border-left: 0.6mm solid #3b82f6;
        }
        
        .transaction-label {
            font-size: 2.5mm;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-weight: 600;
            margin-bottom: 1mm;
        }
        
        .transaction-value {
            font-size: 10px;
            color: #0f172a;
            font-weight: 700;
            word-break: break-word;
        }
        
        /* Items Table */
        .items-section {
            margin: 8mm 0;
        }
        
        .section-header {
            font-size: 4.5mm;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 4mm;
            display: flex;
            align-items: center;
            gap: 3mm;
        }
        
        .section-header::before {
            content: '';
            width: 1.5mm;
            height: 6mm;
            background: linear-gradient(180deg, #3b82f6, #60a5fa);
            display: block;
        }
        
        .table-wrapper {
            background: #ffffff;
            border: 0.4mm solid #e2e8f0;
            border-radius: 3mm;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        thead {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
        }
        
        thead th {
            padding: 4mm 3mm;
            text-align: left;
            font-size: 3.2mm;
            font-weight: 700;
            color: #ffffff;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        thead th:not(:first-child) {
            text-align: right;
        }
        
        tbody td {
            padding: 4mm 3mm;
            font-size: 3.3mm;
            color: #334155;
            border-bottom: 0.2mm solid #e2e8f0;
            text-align: left;
        }
        
        tbody td:not(:first-child) {
            text-align: right;
            white-space: nowrap;
            font-weight: 600;
        }
        
        tbody tr:last-child {
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            font-weight: 700;
        }
        
        tbody tr:last-child td {
            border-bottom: none;
            color: #1e40af;
            font-size: 3.8mm;
            padding: 4.5mm 3mm;
        }
        
        tbody tr:last-child td:first-child {
            font-size: 4.2mm;
            font-weight: 900;
        }
        
        .item-description {
            font-weight: 700;
            color: #0f172a;
        }
        
        /* Summary Section */
        .summary-section {
            display: grid;
            grid-template-columns: 1fr 65mm;
            gap: 8mm;
            margin-top: 10mm;
        }
        
        .terms-box {
            background: #f8fafc;
            border: 0.4mm solid #e2e8f0;
            border-radius: 3mm;
            padding: 5mm;
        }
        
        .terms-title {
            font-size: 4mm;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 3mm;
            display: flex;
            align-items: center;
            gap: 2mm;
        }
        
        .terms-title::before {
            content: '📋';
            font-size: 5mm;
        }
        
        .terms-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .terms-list li {
            font-size: 2.9mm;
            line-height: 1.7;
            color: #475569;
            padding-left: 4mm;
            margin-bottom: 2.5mm;
            position: relative;
        }
        
        .terms-list li::before {
            content: '✓';
            position: absolute;
            left: 0;
            color: #3b82f6;
            font-weight: 900;
            font-size: 3.5mm;
        }
        
        .total-box {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            border-radius: 3mm;
            padding: 3.2mm 5mm;
            box-shadow: 0 10px 25px rgba(30, 64, 175, 0.3);
            position: relative;
            overflow: hidden;
            display: inline-block;
            width: fit-content;
            max-width: 100%;
            align-self: start;
        }
        
        .total-box::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -10%;
            width: 40mm;
            height: 40mm;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
        }
        
        .total-box::after {
            content: '';
            position: absolute;
            bottom: -30%;
            left: -10%;
            width: 35mm;
            height: 35mm;
            background: rgba(255, 255, 255, 0.08);
            border-radius: 50%;
        }
        
        .total-content {
            position: relative;
            z-index: 1;
        }
        
        .total-label {
            font-size: 3.1mm;
            color: rgba(255, 255, 255, 0.85);
            text-transform: uppercase;
            letter-spacing: 0.15em;
            font-weight: 600;
            margin-bottom: 1.2mm;
        }
        
        .total-amount {
            font-size: 8mm;
            font-weight: 900;
            color: #ffffff;
            line-height: 1;
            letter-spacing: -0.02em;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .total-subtext {
            font-size: 2.5mm;
            color: rgba(255, 255, 255, 0.75);
            margin-top: 1.2mm;
            font-weight: 500;
        }
        
        /* Footer */
        .footer {
            margin-top: 12mm;
            padding-top: 5mm;
            border-top: 0.3mm solid #e2e8f0;
            text-align: center;
        }
        
        .footer-text {
            font-size: 3mm;
            color: #64748b;
            line-height: 1.6;
        }
        
        .footer-highlight {
            color: #3b82f6;
            font-weight: 700;
        }
        
        .footer-note {
            margin-top: 2mm;
            font-size: 2.6mm;
            color: #94a3b8;
            font-style: italic;
        }
        
        @media print {
            body { 
                background: #ffffff; 
            }
            .page { 
                padding: 0; 
            }
            .invoice {
                width: 100%;
                min-height: 297mm;
                box-shadow: none;
            }
            .header-decoration,
            .header-pattern,
            .brand-logo,
            .badge-main,
            .info-card,
            .table-wrapper,
            .terms-box,
            .total-box,
            thead {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
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
        <div class="invoice">
            <div class="header-decoration"></div>
            <div class="header-pattern"></div>
            
            <div class="content-wrapper">
                <!-- Header -->
                <div class="top-section">
                    <div class="brand-area">
                        <div class="brand-logo">
                            <img src="${merchantInfo.logoPath}" alt="${escapeHtml(merchantInfo.displayName)} logo" />
                        </div>
                    </div>
                    <div class="invoice-badge">
                        <div class="badge-main">
                            <span class="invoice-label">INVOICE</span>
                            <div class="invoice-meta">
                                <div class="invoice-meta-row">
                                    <span class="meta-label">Invoice #</span>
                                    <span class="meta-value">${escapeHtml(invoiceNumberToDisplay)}</span>
                                </div>
                                <div class="invoice-meta-row">
                                    <span class="meta-label">RRN</span>
                                    <span class="meta-value">${escapeHtml(formatRrnValue(rrnValue))}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Info Cards -->
                <div class="info-section">
                    <div class="info-card">
                        <div class="card-name">${escapeHtml(merchantInfo.companyName)}</div>
                        <div class="card-address">${fields.addressHtml}</div>
                    </div>
                    <div class="info-card">
                        <div class="card-title">Transaction Details</div>
                        <div class="transaction-grid">
                            <div class="transaction-item">
                                <div class="transaction-label">Name</div>
                                <div class="transaction-value">${escapeHtml(fields.customerName)}</div>
                            </div>
                            <div class="transaction-item">
                                <div class="transaction-label">UPI ID</div>
                                <div class="transaction-value">${escapeHtml(fields.upiId)}</div>
                            </div>
                            <div class="transaction-item">
                                <div class="transaction-label">Transaction Date</div>
                                <div class="transaction-value">${escapeHtml(fields.transactionDateOnly)}</div>
                            </div>
                            <div class="transaction-item">
                                <div class="transaction-label">Transaction Time</div>
                                <div class="transaction-value">${escapeHtml(fields.transactionTimeOnly)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Items Table -->
                <div class="items-section">
                    <div class="section-header">Items & Charges</div>
                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th>Qty</th>
                                    <th>Unit Price</th>
                                    <th>Gross</th>
                                    <th>Tax</th>
                                    <th>Net Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><span class="item-description">${escapeHtml(descriptionText)}</span></td>
                                    <td>1</td>
                                    <td>₹ ${formattedAmount}</td>
                                    <td>₹ ${formattedAmount}</td>
                                    <td>₹ 0.00</td>
                                    <td>₹ ${formattedAmount}</td>
                                </tr>
                                <tr>
                                    <td>TOTAL</td>
                                    <td></td>
                                    <td></td>
                                    <td>₹ ${formattedAmount}</td>
                                    <td>₹ 0.00</td>
                                    <td>₹ ${formattedAmount}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Summary Section -->
                <div class="summary-section">
                    <div class="terms-box">
                        <div class="terms-title">Terms & Conditions</div>
                        <ul class="terms-list">
                            <li>By receiving this receipt, the user confirms that the applicable fees were paid to ${escapeHtml(merchantInfo.receiptEntityName || merchantInfo.displayName)} through the payment gateway and accepts the company's terms related to this transaction.</li>
                            <li>This receipt is issued against the UPI ID through which the payment was collected and verified.</li>
                            <li>This is a computer-generated receipt - no physical seal or signature required.</li>
                        </ul>
                    </div>
                    <div class="total-box">
                        <div class="total-content">
                            <div class="total-label">Total Amount</div>
                            <div class="total-amount">₹ ${formattedAmount}</div>                            
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
