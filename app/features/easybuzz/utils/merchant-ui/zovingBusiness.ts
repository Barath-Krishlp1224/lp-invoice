import React from 'react';
import { escapeHtml, formatRrnValue } from "./shared";
import type { MerchantInvoiceRenderContext } from "./types";

const splitAddressAndGst = (addressHtml: string) => {
    const parts = String(addressHtml || "")
        .split(/<br\/?>/i)
        .map((part) => part.trim())
        .filter(Boolean);
    const gstLine = parts.find((part) => /^(gst|gstin)\s*:?\s*/i.test(part)) || "";
    const addressLines = parts.filter((part) => part !== gstLine);

    return {
        addressText: addressLines.join(", ").replace(/\s*,\s*/g, ", ").trim(),
        gstText: gstLine.replace(/^(gst|gstin)\s*:?\s*/i, "").trim(),
    };
};

const normalizeDisplayName = (value: string) => {
    const trimmed = String(value || "").trim();

    if (!trimmed) {
        return "Zoving Business";
    }

    return trimmed
        .toLowerCase()
        .split(/\s+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};

const formatAmount = (value: string) => `₹${String(value || "").trim()}`;

export const renderZovingBusinessInvoiceHTML = ({
    merchantInfo,
    invoiceNumberToDisplay,
    rrnValue,
    formattedAmount,
    receiptEntityName,
    descriptionText,
    fields,
}: MerchantInvoiceRenderContext) => {
    const { addressText, gstText } = splitAddressAndGst(merchantInfo.address || fields.addressHtml);
    const displayName = normalizeDisplayName(merchantInfo.displayName);
    const companyName = merchantInfo.companyName || merchantInfo.displayName;
    const invoiceAmount = formatAmount(formattedAmount);
    const email = merchantInfo.email || "hello@zovingbusiness.in";
    const website = merchantInfo.website || "www.zovingbusiness.in";
    const manager = merchantInfo.managerName || "Zoving Admin";
    const terms = [
        `By receiving this receipt, the user confirms that the applicable fees were paid to ${receiptEntityName || merchantInfo.displayName} through the payment gateway and accepts the company's terms related to this transaction.`,
        "This receipt is issued against the UPI ID through which the payment was collected and verified.",
    ];

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(formatRrnValue(rrnValue))}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&family=DM+Sans:wght@300;400;500;600;700&family=Dancing+Script:wght@700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            background: #f5f0eb;
            font-family: 'DM Sans', sans-serif;
            color: #1a1a1a;
            margin: 0;
            padding: 20px;
        }

        .page {
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
            min-height: 297mm;
            padding: 8mm 6mm;
            background: #f5f0eb;
        }

        .card {
            background: #ffffff;
            border-radius: 6px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 8px 40px rgba(0,0,0,0.10);
            min-height: 281mm;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .inner {
            padding: 32px 32px 0 32px;
            position: relative;
            z-index: 2;
        }

        .top-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 6px;
            position: relative;
            padding-bottom: 12px;
            overflow: visible;
        }

        .brand-block {
            display: flex;
            align-items: flex-start;
            flex: 1;
            position: relative;
            z-index: 1;
        }

        .brand-logo {
            width: 90mm;
            max-height: 30mm;
            object-fit: contain;
            object-position: left center;
        }

        .meta-block {
            min-width: 90mm;
            max-width: 90mm;
            text-align: right;
            padding-top: 2px;
            position: relative;
            z-index: 2;
        }

        .meta-line + .meta-line {
            margin-top: 10px;
        }

        .meta-label {
            display: block;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #b46b4a;
            margin-bottom: 4px;
        }

        .meta-value {
            display: block;
            font-size: 15px;
            font-weight: 700;
            color: #1a1a1a;
            line-height: 1.25;
            overflow-wrap: anywhere;
        }

        .quote {
            font-family: 'Playfair Display', serif;
            font-style: italic;
            font-size: 17px;
            font-weight: 400;
            color: #1a1a1a;
            margin-bottom: 24px;
            line-height: 1.4;
            max-width: 260px;
        }

        .divider {
            height: 1px;
            background: #d8cfc8;
            margin-bottom: 16px;
        }

        .inv-to-label {
            font-size: 11px;
            color: #888;
            font-weight: 400;
            margin-bottom: 6px;
        }

        .customer-row {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
        }

        .customer-dot {
            width: 22px;
            height: 22px;
            background: #e05c2a;
            border-radius: 50%;
            flex-shrink: 0;
        }

        .customer-name {
            font-family: 'Playfair Display', serif;
            font-size: 32px;
            font-weight: 700;
            color: #1a1a1a;
            letter-spacing: -0.5px;
            line-height: 1;
        }

        .contact-row {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
            margin-bottom: 16px;
            text-align: center;
            width: 100%;
        }

        .company-info-line {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            font-size: 12px;
            color: #555;
            line-height: 1.6;
            width: 100%;
            justify-content: flex-start;
        }

        .company-info-line svg,
        .tpc svg,
        .terms-item svg {
            width: 13px;
            height: 13px;
            stroke: currentColor;
            fill: none;
            stroke-width: 2;
            stroke-linecap: round;
            stroke-linejoin: round;
            flex-shrink: 0;
            margin-top: 3px;
        }

        .company-info-name {
            font-size: 19px;
            font-weight: 700;
            color: #1a1a1a;
            letter-spacing: 0.02em;
            white-space: nowrap;
            width: 100%;
            text-align: center;
        }

        .company-info-address {
            font-size: 13px;
            color: #4b4b4b;
            max-width: 640px;
        }

        .info-puzzle {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin: 0 0 22px;
        }

        .puzzle-tile {
            background-color: #efe5dc;
            border: 1px solid rgba(180, 107, 74, 0.16);
            padding: 14px 16px;
            min-height: 78px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            position: relative;
            overflow: hidden;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .puzzle-tile:nth-child(1) {
            border-radius: 26px 10px 10px 10px;
        }

        .puzzle-tile:nth-child(2) {
            border-radius: 10px 26px 10px 10px;
        }

        .puzzle-tile:nth-child(3) {
            border-radius: 10px 10px 10px 26px;
        }

        .puzzle-tile:nth-child(4) {
            border-radius: 10px 10px 26px 10px;
        }

        .puzzle-label {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #b46b4a;
            margin-bottom: 6px;
        }

        .puzzle-value {
            font-size: 15px;
            font-weight: 700;
            color: #1f1f1f;
            line-height: 1.35;
            overflow-wrap: anywhere;
        }

        .tbl-wrap {
            margin-bottom: 0;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12.5px;
        }

        thead tr {
            border-top: 1.5px solid #1a1a1a;
            border-bottom: 1.5px solid #1a1a1a;
        }

        thead th {
            padding: 10px 10px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #1a1a1a;
            text-align: left;
        }

        thead th:not(:first-child),
        tbody td:not(:first-child) {
            text-align: center;
        }

        thead th:last-child,
        tbody td:last-child {
            text-align: right;
        }

        tbody tr:nth-child(even) {
            background: #ede8e2;
        }

        tbody td {
            padding: 11px 10px;
            color: #333;
            font-size: 12.5px;
        }

        tbody td:last-child {
            font-weight: 600;
        }

        tbody td.amount-cell {
            white-space: nowrap;
            font-weight: 600;
        }

        tbody tr.total-row td {
            font-weight: 700;
            background: #f2ebe5;
            border-top: 1px solid #d8cfc8;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .sub-section {
            padding: 16px 10px 4px;
            display: flex;
            flex-direction: column;
            gap: 4px;
            border-top: 1px solid #d8cfc8;
        }

        .sub-row-line {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 40px;
            font-size: 13px;
            color: #333;
            padding: 3px 0;
        }

        .s-label {
            font-weight: 400;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 1px;
            color: #888;
            min-width: 80px;
            text-align: right;
        }

        .s-val {
            font-weight: 400;
            min-width: 100px;
            text-align: right;
        }

        .total-row-big {
            display: flex;
            justify-content: flex-end;
            align-items: baseline;
            gap: 40px;
            padding: 8px 0 18px;
            margin-top:10mm;
        }

        .tl {
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #333;
            min-width: 80px;
            text-align: right;
        }

        .tv {
            font-family: 'Playfair Display', serif;
            font-size: 34px;
            font-weight: 900;
            color: #1a1a1a;
            line-height: 1;
            min-width: 150px;
            text-align: right;
        }

        .company-info-line span,
        .terms-item span,
        .terms-list li {
            overflow-wrap: anywhere;
        }

        .terms-box {
            margin-top: 30mm;
            width: 78%;
            background: #22252b;
            color: #eef2f7;
            padding: 18px 22px;
            border-radius: 0 24px 24px 0;
            margin-left: -10mm;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .terms-box h3 {
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: #ffffff;
            margin-bottom: 10px;
        }

        .terms-list {
            margin: 0;
            padding-left: 18px;
            color: #ffffff;
            font-size: 11px;
            line-height: 1.7;
        }

        .terms-list li {
            color: #ffffff;
        }

        .terms-list li::marker {
            color: #ffffff;
        }

        .terms-list li + li {
            margin-top: 8px;
        }

        @media print {
            body {
                background: #faf7f4;
                padding: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            .page {
                padding: 0;
                max-width: 100%;
                min-height: auto;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            .card {
                box-shadow: none;
                min-height: 297mm;
                border-radius: 0;
            }

            .puzzle-tile,
            .terms-box,
            tbody tr.total-row td {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            @page {
                size: A4 portrait;
                margin: 0;
            }
        }

        @media (max-width: 580px) {
            .inner {
                padding: 28px 24px 0 24px;
            }

            .meta-block {
                min-width: 0;
                max-width: 45%;
            }

            .contact-row {
                width: 100%;
            }

            .info-puzzle {
                grid-template-columns: 1fr;
            }

            .customer-name {
                font-size: 24px;
            }

            .tv {
                font-size: 28px;
            }

            .terms-box {
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="card">
            <div class="inner">
                <div class="top-row">
                    <div class="brand-block">
                        <img class="brand-logo" src="${merchantInfo.logoPath}" alt="${escapeHtml(companyName || displayName)} logo" />
                    </div>
                    <div class="meta-block">
                        <div class="meta-line">
                            <span class="meta-label">Invoice No</span>
                            <span class="meta-value">${escapeHtml(invoiceNumberToDisplay)}</span>
                        </div>
                        <div class="meta-line">
                            <span class="meta-label">RRN No</span>
                            <span class="meta-value">${escapeHtml(formatRrnValue(rrnValue))}</span>
                        </div>
                    </div>
                </div>


                <div class="contact-row">
                    <div class="company-info-line">
                        <span class="company-info-name">${escapeHtml(companyName)}</span>
                    </div>
                    <div class="company-info-line">
                        <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        <span class="company-info-address">${escapeHtml(addressText)}${gstText ? `, GST: ${escapeHtml(gstText)}` : ""}</span>
                    </div>
                </div>

                <div class="info-puzzle">
                    <div class="puzzle-tile">
                        <span class="puzzle-label">Name</span>
                        <span class="puzzle-value">${escapeHtml(fields.customerName)}</span>
                    </div>
                    <div class="puzzle-tile">
                        <span class="puzzle-label">UPI ID</span>
                        <span class="puzzle-value">${escapeHtml(fields.upiId)}</span>
                    </div>
                    <div class="puzzle-tile">
                        <span class="puzzle-label">Transaction Date</span>
                        <span class="puzzle-value">${escapeHtml(fields.transactionDateOnly)}</span>
                    </div>
                    <div class="puzzle-tile">
                        <span class="puzzle-label">Transaction Time</span>
                        <span class="puzzle-value">${escapeHtml(fields.transactionTimeOnly)}</span>
                    </div>
                </div>

                <div class="tbl-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th>Gross Amount</th>
                                <th>Tax</th>
                                <th>Net Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${escapeHtml(descriptionText)}</td>
                                <td>1</td>
                                <td class="amount-cell">${escapeHtml(invoiceAmount)}</td>
                                <td class="amount-cell">${escapeHtml(invoiceAmount)}</td>
                                <td>0</td>
                                <td class="amount-cell">${escapeHtml(invoiceAmount)}</td>
                            </tr>
                            <tr class="total-row">
                                <td>Total</td>
                                <td></td>
                                <td></td>
                                <td class="amount-cell">${escapeHtml(invoiceAmount)}</td>
                                <td>0</td>
                                <td class="amount-cell">${escapeHtml(invoiceAmount)}</td>
                            </tr>
                        </tbody>
                    </table>
 
                    <div class="total-row-big">
                        <span class="tl">Total</span>
                        <span class="tv">${escapeHtml(invoiceAmount)}</span>
                    </div>
                </div>

                <section class="terms-box">
                    <h3>Terms &amp; Conditions</h3>
                    <ul class="terms-list">
                        <li>By receiving this receipt, the user confirms that the applicable fees were paid to ${escapeHtml(receiptEntityName)} through the payment gateway and accepts the company's terms related to this transaction.</li>
                        <li>This receipt is issued against the UPI ID through which the payment was collected and verified.</li>
                        <li>This is a computer-generated receipt and does not require a physical seal or signature for validation.</li>
                    </ul>
                </section>
            </div>

        </div>
    </div>
</body>
</html>`;
};
