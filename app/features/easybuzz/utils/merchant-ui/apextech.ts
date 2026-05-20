import { escapeHtml, formatRrnValue } from "./shared";
import type { MerchantInvoiceRenderContext } from "./types";

export const renderApextechInvoiceHTML = ({
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
            background: #f3f6fb;
            color: #111827;
            font-family: "Segoe UI", Arial, sans-serif;
        }
        .page {
            width: 100%;
            max-width: 210mm;
            height: 297mm;
            margin: 0 auto;
            overflow: hidden;
        }
        .invoice {
            height: 100%;
            background: #ffffff;
            box-shadow: 0 18px 36px rgba(15, 23, 42, 0.08);
            padding: 8mm 10mm;
            display: flex;
            flex-direction: column;
        }
        .top-rule {
            height: 1.5mm;
            background: linear-gradient(90deg, #2f57a5, #6f8ed8);
            border-radius: 999px;
            margin-bottom: 8mm;
            flex-shrink: 0;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 10mm;
            margin-bottom: 10mm;
            flex-shrink: 0;
        }
        .brand {
            min-height: 22mm;
            display: flex;
            align-items: center;
            /* Move logo slightly to the right */
            padding-left: 8mm;
        }
        .brand img {
            /* Increased size */
            width: 55mm;
            max-height: 28mm;
            object-fit: contain;
            object-position: left center;
        }
        .meta-row {
            display: flex;
            gap: 7mm;
        }
        .meta-box {
            min-width: 40mm;
            border: 1px solid #c6d3ee;
            border-radius: 6mm;
            padding: 5mm 5mm;
            text-align: center;
            background: #ffffff;
        }
        .meta-label {
            font-size: 9px;
            letter-spacing: 0.24em;
            font-weight: 800;
            color: #111827;
            text-transform: uppercase;
            margin-bottom: 3mm;
        }
        .meta-value {
            font-size: 12px;
            font-weight: 700;
            color: #374151;
            word-break: break-all;
        }
        .company-name {
            text-align: center;
            font-size: 24px;
            font-weight: 800;
            color: #111827;
            margin-bottom: 2mm;
            margin-top: 8mm;
            flex-shrink: 0;
        }
        .company-address {
            text-align: center;
            font-size: 12px;
            line-height: 1.75;
            font-weight: 700;
            color: #374151;
            margin-bottom: 6mm;
            flex-shrink: 0;
        }
        .divider {
            height: 1px;
            background: #e5e7eb;
            margin-bottom: 6mm;
            flex-shrink: 0;
        }
        .cards-band {
            padding: 3mm 0 4mm;
            margin-bottom: 5mm;
            flex-shrink: 0;
        }
        .cards {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8mm;
        }
        .card {
            border: 1px solid #d9dee8;
            border-radius: 6mm;
            background: #ffffff;
            padding: 6mm 5mm;
            min-height: 48mm;
            box-shadow: 0 2px 4px rgba(15, 23, 42, 0.02);
            display: flex;
            flex-direction: column;
        }
        .card h3 {
            text-align: center;
            font-size: 13px;
            font-weight: 800;
            color: #202020;
            margin-bottom: 5mm;
        }
        .address {
            text-align: center;
            font-size: 12px;
            line-height: 1.8;
            font-weight: 700;
            color: #202020;
            flex-grow: 1;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .detail-table {
            width: 100%;
            border-collapse: collapse;
            flex-grow: 1;
        }
        .detail-table td {
            font-size: 12px;
            color: #202020;
            font-weight: 700;
            padding: 3.5mm 1.5mm;
            white-space: nowrap;
        }
        .detail-table td:first-child {
            width: 40%;
            text-align: left;
        }
        .detail-table td:nth-child(2) {
            width: 4%;
            text-align: center;
        }
        .detail-table td:last-child {
            text-align: left;
        }
        .detail-table tr + tr td {
            border-top: 1px solid #eceef2;
        }
        .main-table-wrap {
            border: 1px solid #d6ddea;
            border-radius: 7mm;
            overflow: hidden;
            margin-bottom: 4mm;
            flex-shrink: 0;
        }
        .main-table {
            width: 100%;
            border-collapse: collapse;
        }
        .main-table thead th {
            background: #2f57a5;
            color: #ffffff;
            font-size: 9px;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            font-weight: 800;
            text-align: center;
            padding: 5mm 2.5mm;
            border-right: 1px solid rgba(255,255,255,0.1);
        }
        .main-table thead th:last-child {
            border-right: none;
        }
        .main-table tbody td {
            background: #ffffff;
            font-size: 12px;
            color: #111827;
            font-weight: 700;
            text-align: center;
            padding: 5mm 2.5mm;
            border-top: 1px solid #edf1f6;
            white-space: nowrap;
        }
        .main-table tbody tr:last-child td {
            background: #e2e8f1;
        }
        .main-table tbody td.desc {
            text-align: left;
            padding-left: 5mm;
        }
        .paid-band {
            display: flex;
            justify-content: center;
            margin: 3mm 0 4mm;
            flex-shrink: 0;
        }
        .paid-shell {
            width: 105mm;
            padding: 4mm 5mm;
        }
        .paid-card {
            background: #2f57a5;
            color: #ffffff;
            border-radius: 6mm;
            padding: 5mm 6mm;
            text-align: center;
        }
        .paid-label {
            font-size: 9px;
            letter-spacing: 0.24em;
            text-transform: uppercase;
            font-weight: 800;
            margin-bottom: 2mm;
        }
        .paid-value {
            font-size: 24px;
            font-weight: 900;
            line-height: 1;
        }
        .terms-box {
            border: 1px solid #d9dee8;
            border-radius: 6mm;
            padding: 3mm 4.5mm 2.5mm;
            background: #ffffff;
            flex-shrink: 0;
        }
        .terms-box h3 {
            font-size: 14px;
            font-weight: 800;
            color: #111827;
            margin-bottom: 2mm;
        }
        .terms-list {
            list-style: none;
            display: grid;
            gap: 0.4mm;
        }
        .terms-list li {
            position: relative;
            padding-left: 6mm;
            font-size: 12px;
            line-height: 1.7;
            color: #111111;
            font-weight: 400;
            text-align: left;
        }
        .terms-list li::before {
            content: "";
            position: absolute;
            left: 0;
            top: 0.55em;
            width: 2mm;
            height: 2mm;
            border-radius: 50%;
            background: #2f57a5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        @media print {
            body { background: #ffffff; }
            .page { padding: 0; }
            .invoice { box-shadow: none; }
            .top-rule,
            .main-table thead th,
            .paid-card,
            .terms-list li::before {
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
            <div class="top-rule"></div>
            <section class="header">
                <div class="brand">
                    <img src="${merchantInfo.logoPath}" alt="${escapeHtml(merchantInfo.displayName)} logo" />
                </div>
                <div class="meta-row">
                    <div class="meta-box">
                        <div class="meta-label">Invoice Number</div>
                        <div class="meta-value">${escapeHtml(invoiceNumberToDisplay)}</div>
                    </div>
                    <div class="meta-box">
                        <div class="meta-label">RRN Number</div>
                        <div class="meta-value">${escapeHtml(formatRrnValue(rrnValue))}</div>
                    </div>
                </div>
            </section>

            <div class="company-name">${escapeHtml(merchantInfo.companyName)}</div>
            <div class="company-address">${fields.addressHtml}</div>
            <div class="divider"></div>

            <section class="cards-band">
                <div class="cards">
                    <div class="card">
                        <h3>Customer Details</h3>
                        <table class="detail-table">
                            <tbody>
                                <tr>
                                    <td>Name</td>
                                    <td>:</td>
                                    <td>${fields.customerName}</td>
                                </tr>
                                <tr>
                                    <td>UPI ID</td>
                                    <td>:</td>
                                    <td>${fields.upiId}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="card">
                        <h3>Transaction Details</h3>
                        <table class="detail-table">
                            <tbody>
                                <tr>
                                    <td>Transaction Date</td>
                                    <td>:</td>
                                    <td>${fields.transactionDateOnly}</td>
                                </tr>
                                <tr>
                                    <td>Transaction Time</td>
                                    <td>:</td>
                                    <td>${fields.transactionTimeOnly}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            <div class="main-table-wrap">
                <table class="main-table">
                    <thead>
                        <tr>
                            <th style="width: 40%;">Description</th>
                            <th style="width: 12%;">Quantity</th>
                            <th style="width: 16%;">Unit Price</th>
                            <th style="width: 16%;">Gross Amount</th>
                            <th style="width: 10%;">Tax</th>
                            <th style="width: 18%;">Net Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="desc">${escapeHtml(descriptionText)}</td>
                            <td>1</td>
                            <td>₹ ${formattedAmount}</td>
                            <td>₹ ${formattedAmount}</td>
                            <td>-</td>
                            <td>₹ ${formattedAmount}</td>
                        </tr>
                        <tr>
                            <td colspan="4" style="text-align: center;">Total</td>
                            <td>-</td>
                            <td>₹ ${formattedAmount}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <section class="paid-band">
                <div class="paid-shell">
                    <div class="paid-card">
                        <div class="paid-label">Total Amount Paid</div>
                        <div class="paid-value">₹ ${formattedAmount}</div>
                    </div>
                </div>
            </section>

            <section class="terms-box">
                <h3>Terms & Conditions</h3>
                <ul class="terms-list">
                    <li>By receiving this receipt, the user confirms that the applicable fees were paid to ${escapeHtml(receiptEntityName)} through the payment gateway and accepts the company's terms related to this transaction.</li>
                    <li>This receipt is issued against the UPI ID through which the payment was collected and verified.</li>
                    <li>This is a computer-generated receipt and does not require a physical seal or signature for validation.</li>
                </ul>
            </section>
        </div>
    </div>
</body>
</html>`;
