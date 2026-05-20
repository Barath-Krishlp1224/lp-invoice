import { escapeHtml } from "./shared";
import type { MerchantInvoiceRenderContext } from "./types";

export const renderNovalogicInvoiceHTML = ({
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
            --brand:       ${merchantInfo.themeColor || "#0f4c81"};
            --brand-mid:   #1a6aad;
            --brand-light: #e8f2fb;
            --brand-pale:  #f2f7fd;
            --accent:      #c8972b;
            --ink:         #0d1f2d;
            --ink-2:       #3a5068;
            --ink-3:       #7a95aa;
            --rule:        #cddae5;
            --surface:     #f5f8fb;
            --white:       #ffffff;
            background: var(--white);
            color: var(--ink);
            font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
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
            position: relative;
        }

        /* ══════════════════════════════
           HEADER
        ══════════════════════════════ */
        .header {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 64mm;
            gap: 5mm;
            border-radius: 16px;
            overflow: visible;
        }

        .header-main {
         
            display: flex;
            align-items: center;
            gap: 7mm;
            padding: 6mm 7mm;
            border-radius: 16px;
        }

        .header-logo-wrap {
            background: var(--white);
            width: 65mm;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 6mm 5mm;
     
        }

        .header-logo-wrap img {
            max-width: 100%;
            max-height: 20mm;
            object-fit: contain;
        }

        .header-center {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: flex-start;
            text-align: left;
        }

        .header-center .company-name {
            font-size: 15pt;
            font-weight: 700;
            color: var(--white);
            letter-spacing: 0.5px;
            margin-bottom: 1.5mm;
        }

        .header-center .company-address {
            font-size: 8.5pt;
            color: rgba(255,255,255,0.8);
            line-height: 1.6;
        }

        .header-right {
            background: var(--white);
            border: 1px solid var(--rule);
            padding: 5mm 5.5mm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 2.5mm;
            text-align: left;
            border-radius: 16px;
        }

        .header-right .doc-title {
            font-size: 16pt;
            font-weight: 800;
            color: var(--brand);
            letter-spacing: 2px;
            text-transform: uppercase;
            line-height: 1;
        }

        .header-right .doc-type {
            font-size: 7pt;
            color: var(--ink-3);
            letter-spacing: 1.2px;
            text-transform: uppercase;
        }

        .ref-pills {
            display: flex;
            flex-direction: column;
            gap: 2mm;
            margin-top: 1mm;
        }

        .ref-pill {
            
            border: 1px solid var(--rule);
            border-radius: 10px;
            padding: 2mm 3mm;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 2mm;
        }

        .ref-pill .rp-label {
            font-size: 6.5pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--ink-3);
        }

        .ref-pill .rp-value {
            font-size: 8.5pt;
            font-weight: 700;
            color: var(--ink);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        /* ══════════════════════════════
           BODY WRAPPER
        ══════════════════════════════ */
        .body {
            flex: 1;
            padding: 8mm 10mm 6mm;
            display: flex;
            flex-direction: column;
            gap: 5.5mm;
        }

        .top-shell {
            padding: 5mm 10mm 0;
        }

        /* ══════════════════════════════
           PARTIES BAND
        ══════════════════════════════ */
        .parties-band {
            display: flex;
            justify-content: center;
        }

        .party-cell {
            padding: 5mm 5.5mm;
            border: 1px solid var(--rule);
            background: var(--white);
            border-radius: 14px;
            width: min(100%, 120mm);
        }

        .party-cell.left {
            border-top: 4px solid var(--brand);
            text-align: center;
        }

        .party-cell.right {
            background: var(--brand-pale);
            border-top: 4px solid var(--accent);
        }

        .party-tag {
            font-size: 6.5pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 2mm;
        }

        .party-name {
            font-size: 10.5pt;
            font-weight: 700;            
            margin-bottom: 1mm;
            line-height: 1.3;
        }

        .party-detail {
            font-size: 8pt;
            color: var(--ink-2);
            line-height: 1.7;
        }

        /* ══════════════════════════════
           TXN META STRIP
        ══════════════════════════════ */
        .txn-strip {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 4mm;
        }

        .txn-cell {
            padding: 4mm 4.5mm;
            border: 1px solid var(--rule);
            background: var(--surface);
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 1mm;
        }

        .txn-label {
            font-size: 6.5pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--ink-3);
        }

        .txn-value {
            font-size: 9.5pt;
            font-weight: 700;
            color: var(--ink);
        }

        /* ══════════════════════════════
           SECTION HEADING
        ══════════════════════════════ */
        .section-head {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 2mm;
        }

        .section-head-text {
            font-size: 7.5pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.5px;
        }

        .items-shell {
            
            background: var(--white);
            padding: 4mm;
        }

        /* ══════════════════════════════
           ITEMS TABLE
        ══════════════════════════════ */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
        }

        .items-table-wrap {
            border-radius: 14px;
            overflow: hidden;
        }

        .items-table thead tr {
            background: var(--brand);
        }

        .items-table thead th {
            color: var(--white);
            font-size: 7pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            padding: 3.5mm 4mm;
            text-align: center;
            border: 1px solid var(--brand-mid);
        }

        .items-table thead th:nth-child(3),
        .items-table thead th:nth-child(5),
        .items-table thead th:last-child,
        .items-table tbody td:nth-child(3),
        .items-table tbody td:nth-child(5),
        .items-table tbody td:last-child,
        .items-table .totals-row td:last-child {
            white-space: nowrap;
        }

        .items-table tbody td {
            padding: 4mm 4mm;
            border: 1px solid var(--rule);
            color: var(--ink-2);
            vertical-align: middle;
            text-align: center;
        }

        .items-table tbody tr:nth-child(even) td {
            background: var(--brand-pale);
        }

        .items-table .totals-row td {
            background: var(--brand-light);
            font-weight: 700;
            font-size: 9.5pt;
            color: var(--ink);
            border: 1px solid var(--rule);
            border-top: 2px solid var(--brand);
            text-align: center;
        }

        .items-table .totals-row td:first-child {
            text-align: center;
            color: var(--brand);
            letter-spacing: 0.5px;
        }

        /* ══════════════════════════════
           BOTTOM ROW
        ══════════════════════════════ */
        .bottom-row {
            display: flex;
            gap: 5mm;
            align-items: flex-start;
        }

        /* ── TERMS ── */
        .terms-block {
            flex: 1;
            border: 1px solid var(--rule);
            background: var(--surface);
            border-radius: 14px;
            overflow: hidden;
        }

        .terms-block-head {
            background: var(--brand-light);
            border-bottom: 1px solid var(--rule);
            padding: 2.5mm 4mm;
            font-size: 7pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--brand);
            text-align: center;
        }

        .terms-block-body {
            padding: 4mm;
        }

        .terms-list {
            list-style: none;
            font-size: 7.5pt;
            color: var(--ink-2);
            line-height: 1.65;
        }

        .terms-list li {
            position: relative;
            padding-left: 5mm;
            margin-bottom: 2.5mm;
        }

        .terms-list li::before {
            content: "▸";
            position: absolute;
            left: 0;
            color: var(--accent);
            font-size: 8pt;
            line-height: 1.5;
        }

        /* ── SUMMARY ── */
        .summary-block {
            width: 62mm;
            flex-shrink: 0;
            border: 1px solid var(--rule);
            border-radius: 14px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .summary-block-head {
            background: var(--brand);
            color: var(--white);
            font-size: 7pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 2px;
            padding: 3mm 4mm;
            text-align: center;
        }

        .summary-rows {
            flex: 1;
            padding: 0 4mm;
        }

        .sum-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 3mm 0;
            border-bottom: 1px solid var(--rule);
            font-size: 8.5pt;
            color: var(--ink-2);
        }

        .sum-row strong {
            font-weight: 700;
            color: var(--ink);
        }

        .sum-row.last-row {
            border-bottom: none;
        }

        .total-band {
            background: var(--white);
            padding: 4mm;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid var(--accent);
        }

        .total-band .tb-label {
            font-size: 7.5pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--ink-2);
        }

        .total-band .tb-amount {
            font-size: 16pt;
            font-weight: 800;
            color: var(--brand);
        }

        /* ══════════════════════════════
           FOOTER
        ══════════════════════════════ */
        .footer {
            border-top: 1px solid var(--rule);
            padding: 3mm 10mm;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: var(--surface);
        }

        .footer-note {
            font-size: 7pt;
            color: var(--ink-3);
            line-height: 1.6;
        }

        .footer-badge {
            border: 1.5px solid var(--accent);
            border-radius: 999px;
            padding: 1.5mm 5mm;
            font-size: 7pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: var(--accent);
        }

        /* ══════════════════════════════
           BOTTOM ACCENT STRIPE
        ══════════════════════════════ */
        .bottom-stripe {
            height: 3px;
            background: var(--brand);
        }

        /* ══════════════════════════════
           PRINT RULES
        ══════════════════════════════ */
        @media print {
            body { background: var(--white); margin: 0; padding: 0; }

            .page {
                width: 210mm;
                min-height: 297mm;
                margin: 0;
                box-shadow: none;
            }

            .bottom-stripe,
            .header-main,
            .header-logo-wrap,
            .header-right,
            .ref-pill,
            .party-cell,
            .items-table thead,
            .items-table .totals-row td,
            .terms-block-head,
            .summary-block-head,
            .total-band,
            .footer {
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
        <div class="top-shell">
            <!-- HEADER -->
            <div class="header">
                <div class="header-main">
                    <div class="header-logo-wrap">
                        <img src="${merchantInfo.logoPath}" alt="${escapeHtml(merchantInfo.displayName)} logo" />
                    </div>
                </div>
                <div class="header-right">
                    <div>
                        <div class="doc-title">INVOICE</div>
                    </div>
                    <div class="ref-pills">
                        <div class="ref-pill">
                            <div class="rp-label">Invoice No.</div>
                            <div class="rp-value">${escapeHtml(invoiceNumberToDisplay)}</div>
                        </div>
                        <div class="ref-pill">
                            <div class="rp-label">RRN</div>
                            <div class="rp-value">${escapeHtml(rrnValue)}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- BODY -->
        <div class="body">

            <!-- PARTIES BAND -->
            <div class="parties-band">
                <div class="party-cell left">
                    <div class="party-name">${escapeHtml(merchantInfo.companyName)}</div>
                    <div class="party-detail">${merchantInfo.address}</div>
                </div>
            </div>

            <!-- TRANSACTION META STRIP -->
            <div class="txn-strip">
              
               
                <div class="txn-cell">
                    <div class="txn-label">Name</div>
                    <div class="txn-value">${fields.customerName}</div>
                </div>
                 <div class="txn-cell">
                    <div class="txn-label">UPI ID</div>
                    <div class="txn-value">${fields.upiId}</div>
                </div>
                  <div class="txn-cell">
                    <div class="txn-label">Transaction Date</div>
                    <div class="txn-value">${fields.transactionDateOnly}</div>
                </div>
                <div class="txn-cell">
                    <div class="txn-label">Transaction Time</div>
                    <div class="txn-value">${fields.transactionTimeOnly}</div>
                </div>
            </div>

            <!-- ITEMS TABLE -->
                <div class="items-shell">
                <div class="items-table-wrap">
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th style="width:40%;">Description</th>
                                <th style="width:8%;">Qty</th>
                                <th style="width:13%;">Unit Price</th>
                                <th style="width:13%;">Gross Amt</th>
                                <th style="width:13%;">Tax</th>
                                <th style="width:13%;">Net Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${escapeHtml(descriptionText)}</td>
                                <td>1</td>
                                <td>${formattedAmount}</td>
                                <td>${formattedAmount}</td>
                                <td>0.00</td>
                                <td>${formattedAmount}</td>
                            </tr>
                            <tr class="totals-row">
                                <td colspan="3">TOTAL</td>
                                <td>${formattedAmount}</td>
                                <td>0.00</td>
                                <td>${formattedAmount}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- BOTTOM: TERMS + SUMMARY -->
            <div class="bottom-row">
                <div class="terms-block">
                    <div class="terms-block-head">Terms &amp; Conditions</div>
                    <div class="terms-block-body">
                        <ul class="terms-list">
                            <li>By receiving this receipt, the customer confirms that the applicable fees were paid to ${escapeHtml(receiptEntityName)} through the payment gateway and accepts the company's terms related to this transaction.</li>
                            <li>This receipt is issued against the UPI ID through which the payment was collected and verified.</li>
                            <li>This is a computer-generated receipt and does not require a physical seal or signature for validation.</li>
                        </ul>
                    </div>
                </div>

                <div class="summary-block">
                    <div class="total-band">
                        <span class="tb-label">Total</span>
                        <span class="tb-amount">${formattedAmount}</span>
                    </div>
                </div>
            </div>

        </div>



    </div>
</body>
</html>`;
