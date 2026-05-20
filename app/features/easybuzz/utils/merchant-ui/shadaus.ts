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
            background:
                linear-gradient(138deg, #f4f1eb 0 16%, transparent 16% 84%, #d9d6d1 84% 100%),
                linear-gradient(42deg, transparent 0 78%, #ece8e2 78% 100%),
                #f3f0ea;
            color: #ffffff;
            font-family: "Trebuchet MS", Arial, sans-serif;
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
            background: linear-gradient(180deg, #13597a 0%, #0f506e 45%, #0c4762 100%);
            box-shadow: 0 20px 44px rgba(15, 23, 42, 0.3);
            padding: 14mm 10mm 9mm;
            position: relative;
            overflow: hidden;
        }
        .top-row {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 8mm;
            align-items: start;
            margin-bottom: 3mm;
        }
        .brand {
            display: flex;
            align-items: center;
            gap: 4mm;
            min-height: 18mm;
        }
        .brand img {
            width: 75mm;
            max-height: 20mm;
            object-fit: contain;
            object-position: left center;
            filter: brightness(0) invert(1);
        }
        .title {
            text-align: right;
            display: grid;
            gap: 2.5mm;
            justify-items: end;
        }
        .title-word {
            font-size: 12mm;
            line-height: 0.94;
            font-weight: 900;
            letter-spacing: 0.08em;
        }
        .title-meta {
            display: grid;
            gap: 1.5mm;
            min-width: 44mm;
        }
        .title-card {
            border-left: 0.5mm solid rgba(255,255,255,0.68);
            padding-left: 3mm;
        }
        .title-label {
            font-size: 2.5mm;
            line-height: 1.3;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: rgba(255,255,255,0.72);
        }
        .title-value {
            display: block;
            margin-top: 0.8mm;
            font-size: 3.3mm;
            line-height: 1.4;
            font-weight: 700;
            color: #ffffff;
            word-break: break-word;
        }
        .rule {
            height: 0.35mm;
            background: rgba(255,255,255,0.42);
            margin: 15mm 0 5mm;
        }
        .hero-grid {
            display: grid;
            grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
            gap: 7mm;
            align-items: end;
            margin-bottom: 8mm;
            margin-top: 15mm;
        }
        .bill-label,
        .meta-label,
        .section-kicker {
            font-size: 2.7mm;
            line-height: 1.3;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: rgba(255,255,255,0.72);
        }
        .bill-name {
            font-size: 6.2mm;
            line-height: 1.15;
            font-weight: 700;
            margin: 1mm 0 2mm;
            text-align: center;
        }
        .bill-address {
            font-size: 3.1mm;
            line-height: 1.6;
            color: rgba(255,255,255,0.86);
            text-align: center;
        }
        .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4mm;
            margin-bottom: 4mm;
        }
        .meta-card {
            border-left: 0.5mm solid rgba(255,255,255,0.68);
            padding-left: 3mm;
            min-height: 12mm;
        }
        .meta-value {
            display: block;
            margin-top: 1mm;
            font-size: 3.4mm;
            line-height: 1.4;
            font-weight: 700;
            color: #ffffff;
            word-break: break-word;
        }
        .total-pill {
            margin-left: auto;
            width: fit-content;
            max-width: 100%;
            background: rgba(255,255,255,0.95);
            color: #434343;
            border-radius: 2mm;
            padding: 3mm 5mm;
            font-size: 7.6mm;
            line-height: 1;
            box-shadow: 0 12px 20px rgba(15, 23, 42, 0.16);
            white-space: nowrap;
        }
        .table-card {
            background: rgba(255,255,255,0.96);
            border-radius: 3mm;
            overflow: hidden;
            box-shadow: none;
            margin-bottom: 7mm;
            margin-top: 15mm;
            width: calc(100% + 8mm);
            margin-left: -4mm;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        thead th {
            padding: 4mm 3mm 3.2mm;
            text-align: center;
            font-size: 4.2mm;
            font-weight: 800;
            color: #1f2937;
            border-bottom: 0.35mm solid rgba(31, 41, 55, 0.9);
        }
        tbody td {
            text-align: center;
        }
        .table-card tbody td {
            padding: 3.6mm 3mm;
            font-size: 3.25mm;
            line-height: 1.45;
            color: #374151;
            border-bottom: 0.25mm solid #d9e2ea;
            vertical-align: top;
        }
        .table-card tbody td:nth-child(n + 2) {
            white-space: nowrap;
        }
        tbody tr:last-child td {
            border-bottom: none;
        }
        .desc-title {
            display: block;
            font-weight: 700;
            color: #111827;
            margin-bottom: 0.6mm;
            text-align: center;
        }
        .desc-copy {
            display: block;
            color: #6b7280;
            font-size: 2.75mm;
            line-height: 1.45;
            text-align: center;
        }
        .total-label {
            font-weight: 800;
            color: #111827;
        }
        .bottom-grid {
            display: grid;
            grid-template-columns: minmax(0, 1.55fr) minmax(0, 0.45fr);
            gap: 8mm;
            align-items: start;
        }
        .info-title,
        .terms-title {
            font-size: 4.8mm;
            line-height: 1.2;
            font-weight: 800;
            margin-bottom: 2.5mm;
        }
        .payment-lines {
            display: grid;
            gap: 1.8mm;
            margin-bottom: 6mm;
        }
        .payment-line {
            display: grid;
            grid-template-columns: 23mm 1fr;
            gap: 3mm;
            font-size: 3.05mm;
            line-height: 1.45;
            color: rgba(255,255,255,0.82);
        }
        .payment-line strong {
            color: #ffffff;
            font-weight: 700;
            white-space: nowrap;
        }
        .section-rule {
            width: 100%;
            height: 0.35mm;
            background: rgba(255,255,255,0.42);
            margin: 4mm 0 3mm;
        }
        .terms-copy {
            font-size: 3mm;
            line-height: 1.7;
            color: rgba(255,255,255,0.82);
        }
        .notes__title {
            font-size: 4.8mm;
            line-height: 1.2;
            font-weight: 800;
            margin-bottom: 2.5mm;
            margin-top: 40mm;        }
        .notes__body {
            font-size: 12px;
            line-height: 1.7;
            color: rgba(255,255,255,0.82);
        }
        .notes__list {
            list-style: disc;
            padding-left: 5mm;
            margin: 0;
        }
        .notes__list li + li {
            margin-top: 1.8mm;
        }
        .summary {
            padding-top: 1mm;
            min-width: 40mm;
            margin-left: -10mm;
        }
        .summary-line {
            display: flex;
            justify-content: space-between;
            gap: 4mm;
            padding: 2mm 0;
            font-size: 3.2mm;
            line-height: 1.4;
            color: rgba(255,255,255,0.84);
            border-bottom: 0.3mm solid rgba(255,255,255,0.38);
        }
        .summary-line strong {
            color: #ffffff;
            font-weight: 700;
            white-space: nowrap;
        }
        .summary-total {
            margin-top: 4mm;
            width: 100%;
            border-radius: 1.6mm;
            overflow: hidden;
            border: 0.25mm solid rgba(12, 18, 28, 0.28);
        }
        .summary-total table td {
            padding: 2.6mm 3.2mm;
            background: rgba(255,255,255,0.92);
            font-size: 3.8mm;
            line-height: 1.2;
            color: #202020;
            font-weight: 800;
            border: none;
            white-space: nowrap;
        }
        .summary-total table td:last-child {
            text-align: right;
            border-left: 0.25mm solid rgba(31, 41, 55, 0.24);
        }
        .signature {
            margin-top: 11mm;
            text-align: right;
        }
        .signature-mark {
            font-family: "Brush Script MT", "Segoe Script", cursive;
            font-size: 10mm;
            line-height: 1;
            color: rgba(255,255,255,0.92);
        }
        .signature-rule {
            width: 42mm;
            height: 0.35mm;
            background: rgba(255,255,255,0.65);
            margin: 1.8mm 0 1.5mm auto;
        }
        .signature-name {
            font-size: 4.8mm;
            line-height: 1.2;
            font-weight: 500;
        }
        .signature-role {
            font-size: 3.1mm;
            line-height: 1.4;
            color: rgba(255,255,255,0.72);
        }
        .footer {
            margin-top: 8mm;
            padding-top: 4mm;
            border-top: 0.35mm solid rgba(255,255,255,0.34);
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 4mm;
        }
        .footer-item {
            display: flex;
            gap: 2mm;
            align-items: flex-start;
            font-size: 2.85mm;
            line-height: 1.45;
            color: rgba(255,255,255,0.82);
        }
        .footer-dot {
            width: 4.2mm;
            height: 4.2mm;
            border-radius: 999px;
            background: rgba(255,255,255,0.9);
            color: #0f506e;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 2.5mm;
            font-weight: 900;
            flex-shrink: 0;
            margin-top: 0.2mm;
        }
        @media print {
            body { background: #ffffff; }
            .page { padding: 0; }
            .invoice {
                width: 100%;
                min-height: 297mm;
                box-shadow: none;
            }
            .invoice,
            .total-pill,
            .table-card,
            .summary-total table td,
            .footer-dot {
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
            <div class="top-row">
                <div class="brand">
                    <img src="${merchantInfo.logoPath}" alt="${escapeHtml(merchantInfo.displayName)} logo" />
                </div>
                <div class="title">
                    <div class="title-meta">
                        <div class="title-card">
                            <div class="title-label">Invoice Number</div>
                            <span class="title-value">${escapeHtml(invoiceNumberToDisplay)}</span>
                        </div>
                        <div class="title-card">
                            <div class="title-label">RRN Number</div>
                            <span class="title-value">${escapeHtml(formatRrnValue(rrnValue))}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="rule"></div>

            <section class="hero-grid">
                <div>
                    <div class="bill-name">${escapeHtml(merchantInfo.companyName)}</div>
                    <div class="bill-address">${fields.addressHtml}</div>
                </div>
                <div>
                    <div class="meta-grid">
                        <div class="meta-card">
                            <div class="meta-label">Name</div>
                            <span class="meta-value">${escapeHtml(fields.customerName)}</span>
                        </div>
                        <div class="meta-card">
                            <div class="meta-label">UPI ID</div>
                            <span class="meta-value">${escapeHtml(fields.upiId)}</span>
                        </div>
                        <div class="meta-card">
                            <div class="meta-label">Transaction Date</div>
                            <span class="meta-value">${escapeHtml(fields.transactionDateOnly)}</span>
                        </div>
                        <div class="meta-card">
                            <div class="meta-label">Transaction Time</div>
                            <span class="meta-value">${escapeHtml(fields.transactionTimeOnly)}</span>
                        </div>
                    </div>
                </div>
            </section>

            <section class="table-card">
                <table>
                    <thead>
                        <tr>
                            <th style="width: 32%;">Description</th>
                            <th style="width: 10%;">Qty</th>
                            <th style="width: 14%;">Unit Price</th>
                            <th style="width: 14%;">Gross Amount</th>
                            <th style="width: 12%;">Tax</th>
                            <th style="width: 18%;">Net Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <span class="desc-title">${escapeHtml(descriptionText)}</span>
                            </td>
                            <td>1</td>
                            <td>₹ ${formattedAmount}</td>
                            <td>₹ ${formattedAmount}</td>
                            <td>₹ 0.00</td>
                            <td>₹ ${formattedAmount}</td>
                        </tr>
                        <tr>
                            <td class="total-label" colspan="3">Total</td>
                            <td>₹ ${formattedAmount}</td>
                            <td>₹ 0.00</td>
                            <td>₹ ${formattedAmount}</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            <section class="bottom-grid">
                <div>

                    <div class="notes__title">Terms & Conditions:</div>
                    <div class="notes__body">
                        <ul class="notes__list">
                            <li>By receiving this receipt, the user confirms that the applicable fees were paid to ${escapeHtml(merchantInfo.receiptEntityName || merchantInfo.displayName)} through the payment gateway and accepts the company's terms related to this transaction.</li>
                            <li>This receipt is issued against the UPI ID through which the payment was collected and verified.</li>
                            <li>This is a computer-generated receipt - no physical seal or signature required.</li>
                        </ul>
                    </div>
                </div>

                <div class="summary">
                    <div class="summary-total">
                        <table>
                            <tr>
                                <td>Total</td>
                                <td>₹ ${formattedAmount}</td>
                            </tr>
                        </table>
                    </div>

                   
                </div>
            </section>
        </div>
    </div>
</body>
</html>`;
