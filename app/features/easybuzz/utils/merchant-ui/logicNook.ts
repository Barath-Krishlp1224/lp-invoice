import { escapeHtml } from "./shared";
import type { MerchantInvoiceRenderContext } from "./types";

export const renderLogicNookInvoiceHTML = ({
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
    <title>${escapeHtml(rrnValue)}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            --brand: ${merchantInfo.themeColor || "#1a3a5c"};
            --brand-light: #e8f0f7;
            --brand-muted: #4a6785;
            --ink: #0f1f2e;
            --ink-2: #3a4f62;
            --ink-3: #6b7f91;
            --rule: #d0dae3;
            --surface: #f4f7fa;
            --white: #ffffff;
            background: var(--white);
            color: var(--ink);
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 10pt;
            line-height: 1.5;
        }

        .page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            background: var(--white);
            display: flex;
            flex-direction: column;
        }

        /* ── TOP HEADER BAR ── */
        .header-bar {
            padding: 4mm 8mm 0 0;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 6mm;
        }

        .header-logo-cell {
            width: 75mm;
            display: flex;
            align-items: flex-start;
            justify-content: flex-start;
            padding: 8mm 0 0 8mm;
            flex-shrink: 0;
            border: none;
            border-radius: 0;
            background: transparent;
        }

        .header-logo-cell img {
            max-width: 100%;
            max-height: 18mm;
            object-fit: contain;
        }

        .header-meta-cell {
            background: var(--white);
            width: 60mm;
            padding: 5mm 6mm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 3mm;
            border: 1px solid var(--rule);
            border-left: 3px solid var(--brand);
            border-radius: 12px;
            flex-shrink: 0;
            margin-top: 10mm;
        }

        .hm-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 3mm;
        }

        .hm-label {
            font-size: 7pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--brand-muted);
        }

        .hm-value {
            font-size: 9pt;
            font-weight: 700;
            color: var(--ink);
            text-align: right;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        /* ── BODY CONTENT ── */
        .body-wrap {
            flex: 1;
            padding: 8mm 10mm;
            display: flex;
            flex-direction: column;
            gap: 6mm;
        }

        /* ── PARTIES ROW (Merchant + Customer) ── */
        .parties-row {
            display: flex;
            gap: 6mm;
            padding-top: 1mm;
            margin-top: 10mm;
        }

        .party-block {
            flex: 1;
            background: var(--white);
            border: 1px solid var(--rule);
            border-top: 3px solid var(--brand);
            border-radius: 12px;
            padding: 5mm;
        }

        .party-label {
            font-size: 7pt;
            font-weight: 700;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: var(--brand-muted);
            border-bottom: 1px solid var(--rule);
            padding-bottom: 1.5mm;
            margin-bottom: 2.5mm;
        }

        .party-name {
            font-size: 11pt;
            font-weight: 700;
            color: var(--ink);
            margin-bottom: 1.5mm;
            line-height: 1.3;
        }

        .party-detail {
            font-size: 8.5pt;
            color: var(--ink-2);
            line-height: 1.7;
        }

        .parties-row .party-block:first-child .party-name,
        .parties-row .party-block:first-child .party-detail {
            text-align: center;
        }

        /* ── TRANSACTION META GRID ── */
        .meta-grid {
            background: var(--surface);
            border: 1px solid var(--rule);
            border-left: 3px solid var(--brand);
            border-radius: 12px;
            padding: 4mm 5mm;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 3mm 4mm;
            margin-top: 15mm;
        }

        .mg-item {
            display: flex;
            flex-direction: column;
            gap: 1mm;
        }

        .mg-label {
            font-size: 7pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: var(--ink-3);
        }

        .mg-value {
            font-size: 9.5pt;
            font-weight: 700;
            color: var(--ink);
            line-height: 1.35;
            white-space: normal;
            word-break: break-all;
            overflow-wrap: anywhere;
        }

        /* ── SECTION HEADING ── */
        .section-heading {
            font-size: 8pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: var(--brand);
            margin-bottom: 2mm;
        }

        /* ── ITEMS TABLE ── */
        .items-card {
            border: 1px solid var(--rule);
            border-radius: 12px;
            overflow: hidden;
            margin-top: 10mm;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
        }

        .items-table thead tr {
            background: var(--brand);
        }

        .items-table thead th {
            color: var(--white);
            font-size: 7.5pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            padding: 3mm 3.5mm;
            text-align: center;
            border: 1px solid var(--brand);
            white-space: nowrap;
        }

        .items-table tbody td {
            padding: 3.5mm 3.5mm;
            color: var(--ink-2);
            border: 1px solid var(--rule);
            vertical-align: middle;
            text-align: center;
        }

        .items-table tbody td:nth-child(n+3),
        .items-table .totals-row td {
            white-space: nowrap;
        }

        .items-table tbody tr:nth-child(even) td {
            background: var(--surface);
        }

        .items-table .totals-row td {
            background: var(--brand-light);
            font-weight: 700;
            font-size: 9.5pt;
            color: var(--ink);
            border: 1px solid var(--rule);
            border-top: 2px solid var(--brand);
        }

        /* ── BOTTOM 2-COL ── */
        .bottom-row {
            display: flex;
            gap: 6mm;
            margin-top: 10mm;
        }

        /* ── TERMS ── */
        .terms-block {
            flex: 1.2;
            background: var(--surface);
            border: 1px solid var(--rule);
            border-left: 3px solid var(--brand);
            border-radius: 12px;
            padding: 4mm 5mm;
        }

        .terms-heading {
            font-size: 8pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--brand-muted);
            margin-bottom: 2.5mm;
        }

        .terms-list {
            list-style: none;
            font-size: 8pt;
            color: var(--ink-2);
            line-height: 1.65;
        }

        .terms-list li {
            position: relative;
            padding-left: 5mm;
            margin-bottom: 2mm;
        }

        .terms-list li::before {
            content: "—";
            position: absolute;
            left: 0;
            color: var(--brand-muted);
            font-weight: 700;
        }

        /* ── AMOUNT SUMMARY ── */
        .summary-block {
            width: 60mm;
            flex-shrink: 0;
            border: 1.5px solid var(--brand);
            border-radius: 12px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .summary-heading {
            background: var(--brand);
            color: var(--white);
            font-size: 8pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            padding: 3mm 4mm;
            text-align: center;
        }

        .summary-lines {
            padding: 3mm 4mm;
            display: flex;
            flex-direction: column;
            gap: 0;
            flex: 1;
        }

        .sum-line {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 2.5mm 0;
            font-size: 9pt;
            color: var(--ink-2);
            border-bottom: 1px solid var(--rule);
        }

        .sum-line strong {
            font-weight: 700;
            color: var(--ink);
        }

        .total-payable-row {
            background: var(--brand-light);
            border-top: 2px solid var(--brand);
            padding: 4mm;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .total-payable-row .tp-label {
            font-size: 8pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--brand-muted);
        }

        .total-payable-row .tp-amount {
            font-size: 15pt;
            font-weight: 700;
            color: var(--brand);
        }

        /* ── FOOTER ── */
        .footer {
            margin-top: 6mm;
            border-top: 1px solid var(--rule);
            padding-top: 3mm;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .footer-left {
            font-size: 7.5pt;
            color: var(--ink-3);
        }

        .footer-stamp {
            font-size: 7.5pt;
            font-weight: 700;
            color: var(--brand-muted);
            letter-spacing: 1px;
            text-transform: uppercase;
            border: 1.5px solid var(--brand-muted);
            border-radius: 999px;
            padding: 1mm 4mm;
            opacity: 0.7;
        }

        @media print {
            body { background: var(--white); margin: 0; padding: 0; }
            .page { width: 210mm; min-height: 297mm; margin: 0; box-shadow: none; }

            .header-bar,
            .header-logo-cell,
            .header-meta-cell,
            .meta-grid,
            .items-table thead,
            .items-table .totals-row td,
            .summary-heading,
            .total-payable-row,
            .terms-block,
            .summary-block {
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

        <!-- TOP HEADER BAR -->
        <div class="header-bar">
            <div class="header-logo-cell">
                <img src="${merchantInfo.logoPath}" alt="${escapeHtml(merchantInfo.displayName)} logo" />
            </div>
            <div class="header-meta-cell">
                <div class="hm-row">
                    <div class="hm-label">Invoice No :</div>
                    <div class="hm-value">${escapeHtml(invoiceNumberToDisplay)}</div>
                </div>
                <div class="hm-row">
                    <div class="hm-label">RRN :</div>
                    <div class="hm-value">${escapeHtml(rrnValue)}</div>
                </div>
            </div>
        </div>

        <!-- BODY -->
        <div class="body-wrap">

            <!-- PARTIES ROW -->
            <div class="parties-row">
                <div class="party-block">
                    <div class="party-name">${escapeHtml(merchantInfo.companyName)}</div>
                    <div class="party-detail">${merchantInfo.address}</div>
                </div>
            </div>

            <!-- TRANSACTION META -->
            <div class="meta-grid">
                <div class="mg-item">
                    <div class="mg-label">Name</div>
                    <div class="mg-value">${fields.customerName}</div>
                </div>
                <div class="mg-item">
                    <div class="mg-label">UPI ID</div>
                    <div class="mg-value">${fields.upiId}</div>
                </div>
                <div class="mg-item">
                    <div class="mg-label">Transaction Date</div>
                    <div class="mg-value">${fields.transactionDateOnly}</div>
                </div>
                <div class="mg-item">
                    <div class="mg-label">Transaction Time</div>
                    <div class="mg-value">${fields.transactionTimeOnly}</div>
                </div>
                
            </div>

            <!-- ITEMS TABLE -->
            <div>
                <div class="items-card">
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th style="width:40%">Description</th>
                                <th style="width:8%">Qty</th>
                                <th style="width:13%">Unit Price</th>
                                <th style="width:13%">Gross Amt</th>
                                <th style="width:13%">Tax</th>
                                <th style="width:13%">Net Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${escapeHtml(descriptionText)}</td>
                                <td>1</td>
                                <td>&#8377; ${formattedAmount}</td>
                                <td>&#8377; ${formattedAmount}</td>
                                <td>0</td>
                                <td>&#8377; ${formattedAmount}</td>
                            </tr>
                            <tr class="totals-row">
                                <td colspan="3"><strong>Total</strong></td>
                                <td><strong>&#8377; ${formattedAmount}</strong></td>
                                <td><strong>0</strong></td>
                                <td><strong>&#8377; ${formattedAmount}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- BOTTOM: TERMS + SUMMARY -->
            <div class="bottom-row">
                <div class="terms-block">
                    <div class="terms-heading">Terms &amp; Conditions</div>
                    <ul class="terms-list">
                        <li>By receiving this receipt, the customer confirms that the applicable fees were paid to ${escapeHtml(receiptEntityName)} through the payment gateway and accepts the company's terms related to this transaction.</li>
                        <li>This receipt is issued against the UPI ID through which the payment was collected and verified.</li>
                        <li>This is a computer-generated receipt and does not require a physical seal or signature for validation.</li>
                    </ul>
                </div>
            </div>

        </div>
    </div>
</body>
</html>`;
