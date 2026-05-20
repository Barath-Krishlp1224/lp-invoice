import { escapeHtml } from "./shared";
import type { MerchantInvoiceRenderContext } from "./types";

const formatCurrency = (formattedAmount: string) => `₹ ${formattedAmount}`;

const getInitials = (name: string) => String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const splitAddressAndGst = (addressHtml: string) => {
    const parts = String(addressHtml || "").split(/<br\/?>/i).map((part) => part.trim()).filter(Boolean);
    const gstLine = parts.find((part) => /^gst\s*:/i.test(part)) || "";
    const addressLines = parts.filter((part) => part !== gstLine);

    return {
        addressHtml: addressLines.join("<br/>"),
        gstText: gstLine.replace(/^gst\s*:/i, "").trim(),
    };
};

const gridIcon = `
<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="1" y="1" width="10" height="10" rx="2" fill="#2d6a4f" />
    <rect x="13" y="1" width="10" height="10" rx="2" fill="#2d6a4f" />
    <rect x="1" y="13" width="10" height="10" rx="2" fill="#2d6a4f" />
    <rect x="13" y="13" width="10" height="10" rx="2" fill="#40916c" />
</svg>`;

const gridIconSmall = `
<svg width="18" height="18" viewBox="0 0 17 17" fill="none" aria-hidden="true">
    <rect x="1" y="1" width="6" height="6" rx="1.2" fill="#2d6a4f" />
    <rect x="10" y="1" width="6" height="6" rx="1.2" fill="#2d6a4f" />
    <rect x="1" y="10" width="6" height="6" rx="1.2" fill="#2d6a4f" />
    <rect x="10" y="10" width="6" height="6" rx="1.2" fill="#40916c" />
</svg>`;

export const renderBytesNapseInvoiceHTML = ({
    merchantInfo,
    invoiceNumberToDisplay,
    rrnValue,
    formattedAmount,
    receiptEntityName,
    descriptionText,
    fields,
}: MerchantInvoiceRenderContext) => {
    const { addressHtml, gstText } = splitAddressAndGst(merchantInfo.address || fields.addressHtml);
    const customerInitials = getInitials(fields.customerName);
    const transactionDateTime = fields.transactionDate || `${fields.transactionDateOnly} ${fields.transactionTimeOnly}`.trim();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(rrnValue)}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            margin: 0;
            background: #e6ede8;
            color: #1b2a22;
            font-family: "DM Sans", "Segoe UI", Arial, sans-serif;
        }
        .page {
            width: 100%;
            max-width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 6mm;
        }
        .invoice {
            background: #ffffff;
            width: 100%;
            min-height: 0;
            margin: 0 auto;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(27, 67, 50, 0.18);
        }
        .header {
            background: #1b4332;
            padding: 10mm 10mm 0;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 8mm;
        }
        .brand {
            display: flex;
            flex-direction: column;
            gap: 3mm;
            max-width: 95mm;
        }
        .brand-top {
            display: flex;
            align-items: center;
            gap: 4mm;
        }
        .brand-logo-wrap {
            background: #ffffff;
            border-radius: 12px;
            padding: 1.5mm 4mm;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 14mm;
            line-height: 0;
        }
        .brand-logo {
            width: 44mm;
            max-height: 18mm;
            object-fit: contain;
            object-position: center center;
            display: block;
            margin: 0 auto;
            vertical-align: middle;
        }
        .company-block {
            margin-top: 2mm;
            padding-top: 3mm;
            border-top: 1px solid #2d6a4f;
            margin-bottom: 4mm;
        }
        .company-title {
            font-size: 9px;
            font-weight: 700;
            color: #ffffff;
            text-transform: uppercase;
            letter-spacing: 0.7px;
            margin-bottom: 1mm;
        }
        .company-address {
            font-size: 9px;
            color: #ffffff;
            line-height: 1.7;
            font-weight: 500;
        }
        .header-right {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 4mm;
            padding-top: 1mm;
        }
        .stamp-word {
            font-family: Georgia, "Times New Roman", serif;
            font-size: 56px;
            font-weight: 900;
            color: #2d6a4f;
            line-height: 0.85;
            letter-spacing: -3px;
            text-align: right;
        }
        .stamp-word em {
            color: #e9c46a;
            font-style: normal;
        }
        .meta-cards {
            display: flex;
            flex-direction: column;
            gap: 2.5mm;
            align-items: flex-end;
        }
        .meta-card {
            background: #ffffff;
            border: 1px solid #d8e3db;
            border-radius: 10px;
            padding: 3mm 5mm;
            min-width: 44mm;
        }
        .meta-label {
            font-size: 7px;
            text-transform: uppercase;
            letter-spacing: 1.3px;
            color: #2d6a4f;
            font-weight: 700;
            margin-bottom: 1mm;
        }
        .meta-value {
            font-size: 12px;
            font-weight: 700;
            color: #1b4332;
            letter-spacing: 0.3px;
            word-break: break-all;
        }
        .header-spacer {
            height: 4mm;
            background: #ffffff;
        }
        .profile {
            background: #ffffff;
            display: flex;
            align-items: stretch;
            margin: 0 10mm;
            border: 1px solid #1b4332;
            border-radius: 14px;
            overflow: hidden;
        }
        .profile-avatar {
            width: 25mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 6mm 0;
            background: #ffffff;
            flex-shrink: 0;
            border-right: 1px solid #2d6a4f;
        }
        .avatar-circle {
            width: 14mm;
            height: 14mm;
            background: #e9c46a;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: Georgia, "Times New Roman", serif;
            font-size: 18px;
            font-weight: 900;
            color: #1b4332;
        }
        .avatar-label {
            font-size: 7px;
            color: #6f5316;
            letter-spacing: 0.6px;
            margin-top: 2mm;
            text-transform: uppercase;
            font-weight: 600;
        }
        .profile-info {
            flex: 1;
            padding: 5mm 6mm;
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 0;
            background: #ffffff;
        }
        .pinfo-item {
            min-width: 0;
            padding: 3.5mm 4mm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            background: transparent;
            border-right: 1px solid #1b4332;
        }
        .pinfo-item:last-child { border-right: none; }
        .pinfo-label {
            font-size: 7px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #2d6a4f;
            font-weight: 600;
            margin-bottom: 1mm;
        }
        .pinfo-value {
            font-size: 10.5px;
            font-weight: 600;
            color: #111111;
            line-height: 1.35;
            word-break: break-all;
            overflow-wrap: anywhere;
            text-align: center;
        }
        .txn-wrap {
        margin-top: 6mm;
        padding: 6mm 10mm 0; }
        .section-head {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            column-gap: 4mm;
            margin-bottom: 4mm;
        }
        .section-line {
            height: 1px;
            background: #cde8d6;
        }
        .section-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: #1b4332;
            color: #d8f3dc;
            font-size: 7.5px;
            font-weight: 700;
            letter-spacing: 1.2px;
            text-transform: uppercase;
            padding: 1.5mm 4mm;
            border-radius: 20px;
            white-space: nowrap;
            min-width: 52mm;
        }
        .tbl {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            font-size: 11px;
            border: 1.5px solid #cde8d6;
            border-radius: 12px;
            overflow: hidden;
            table-layout: fixed;
        }
        .tbl thead { background: #2d6a4f; }
        .tbl thead th {
            padding: 2.5mm 2mm;
            font-size: 7px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #d8f3dc;
            text-align: center;
            white-space: nowrap;
        }
        .tbl thead th:first-child {
            text-align: center;
            width: 34%;
        }
        .tbl thead th:nth-child(2) { width: 8%; }
        .tbl thead th:nth-child(3) { width: 14%; }
        .tbl thead th:nth-child(4) { width: 14%; }
        .tbl thead th:nth-child(5) { width: 10%; }
        .tbl tbody tr td {
            padding: 3.5mm 2mm;
            vertical-align: middle;
            text-align: center;
            border-bottom: 1px solid #e8f5ec;
            color: #1b2a22;
        }
        .tbl tbody tr:last-child td { border-bottom: none; }
        .tbl tbody tr:nth-child(odd) { background: #ffffff; }
        .tbl tbody tr:nth-child(even) { background: #ffffff; }
        .tbl tbody tr.total-row { background: #ffffff; }
        .tbl tbody td:first-child {
            text-align: center;
            line-height: 1.5;
        }
        .tbl tbody td:last-child {
            font-weight: 700;
            color: #1b4332;
        }
        .dash { color: #a8d5b5; }
        .total-wrap {
            margin: 5mm 10mm 0;
            display: grid;
            grid-template-columns: 1fr 54mm;
            border: 1.5px solid #2d6a4f;
            border-radius: 14px;
            overflow: hidden;
            background: #ffffff;
        }
        .total-hero {
            padding: 5mm 6mm;
            background: #ffffff;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        .total-label {
            font-size: 8px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #2d6a4f;
            font-weight: 700;
            margin-bottom: 2mm;
        }
        .total-number {
            font-family: Georgia, "Times New Roman", serif;
            font-size: 30px;
            font-weight: 900;
            color: #111111;
            line-height: 1;
            letter-spacing: -1px;
        }
        .total-number sup {
            font-size: 18px;
            vertical-align: super;
        }
        .total-sub {
            font-size: 9px;
            color: #2d6a4f;
            margin-top: 2mm;
            font-weight: 400;
        }
        .total-rows {
            background: #ffffff;
            padding: 4mm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 2mm;
            border-left: 1px solid #2d6a4f;
        }
        .trow {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10px;
            color: #2d6a4f;
            padding-bottom: 1.5mm;
            border-bottom: 1px dashed #2d6a4f;
        }
        .trow:last-child {
            border: none;
            padding-bottom: 0;
            margin-top: 1mm;
        }
        .trow strong {
            color: #111111;
            font-weight: 700;
        }
        .trow-net {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #ffffff;
            border-radius: 10px;
            margin-top: 1mm;
            padding: 2.5mm 3mm;
            font-size: 10px;
        }
        .trow-net span {
            color: #2d6a4f;
            font-weight: 700;
        }
        .trow-net strong {
            color: #111111;
            font-size: 12px;
            font-weight: 700;
        }
        .terms {
            margin: 10mm 10mm 8mm;
            background: #ffffff;
            border: 1.5px solid #e8f5ec;
            border-radius: 12px;
            overflow: hidden;
        }
        .terms-head {
            background: #2d6a4f;
            padding: 2mm 4mm;
            font-size: 7.5px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #d8f3dc;
            font-weight: 700;
        }
        .terms-body {
            padding: 3.5mm 4mm;
            display: flex;
            flex-direction: column;
            gap: 1.5mm;
        }
        .term {
            font-size: 9px;
            color: #2d4a35;
            line-height: 1.5;
            padding-left: 4mm;
            position: relative;
            font-weight: 400;
        }
        .term::before {
            content: "▸";
            position: absolute;
            left: 0;
            color: #40916c;
            font-size: 9px;
            top: 0;
        }
        .foot {
            background: #1b4332;
            padding: 5mm 8mm;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 5mm;
        }
        .foot-brand {
            display: flex;
            align-items: center;
            gap: 3mm;
        }
        .foot-sq {
            width: 10mm;
            height: 10mm;
            background: #e9c46a;
            border-radius: 8px;
            display: grid;
            place-items: center;
            flex-shrink: 0;
        }
        .foot-name {
            font-family: Georgia, "Times New Roman", serif;
            font-size: 15px;
            font-weight: 700;
            color: #ffffff;
        }
        .foot-name em {
            color: #e9c46a;
            font-style: normal;
        }
        .foot-sub {
            font-size: 7.5px;
            color: #74c69d;
            font-weight: 400;
        }
        .foot-sep {
            width: 1px;
            height: 40px;
            background: #2d6a4f;
            flex-shrink: 0;
        }
        .foot-contacts {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1.5mm;
            flex: 1;
        }
        .foot-item {
            font-size: 9px;
            color: #b7ddc8;
            display: flex;
            align-items: flex-start;
            gap: 2mm;
            justify-content: flex-end;
            text-align: right;
        }
        .foot-dot {
            width: 4px;
            height: 4px;
            background: #e9c46a;
            border-radius: 50%;
            flex-shrink: 0;
            margin-top: 4px;
        }
        @media print {
            body { background: #ffffff; }
            .page {
                width: 100%;
                max-width: 210mm;
                min-height: 297mm;
                padding: 6mm;
            }
            .invoice { box-shadow: none; }
            .header, .profile, .section-line, .section-badge, .tbl thead, .trow-net, .terms-head, .foot {
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
            <div class="header">
                <div class="brand">
                    <div class="brand-top">
                        <div class="brand-logo-wrap">
                            <img class="brand-logo" src="${merchantInfo.logoPath}" alt="${escapeHtml(merchantInfo.displayName)} logo" />
                        </div>
                    </div>
                    <div class="company-block">
                        <div class="company-title">${escapeHtml(merchantInfo.companyName)}</div>
                        <div class="company-address">${addressHtml}</div>
                        ${gstText ? `<div class="company-address">GST: ${escapeHtml(gstText)}</div>` : ""}
                    </div>
                </div>

                <div class="header-right">
                    
                    <div class="meta-cards">
                        <div class="meta-card">
                            <div class="meta-label">Invoice Number</div>
                            <div class="meta-value">${escapeHtml(invoiceNumberToDisplay)}</div>
                        </div>
                        <div class="meta-card">
                            <div class="meta-label">RRN No</div>
                            <div class="meta-value">${escapeHtml(rrnValue)}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="header-spacer"></div>

            <div class="profile">
                <div class="profile-info">
                    <div class="pinfo-item">
                        <div class="pinfo-label">Name</div>
                        <div class="pinfo-value">${fields.customerName}</div>
                    </div>
                    <div class="pinfo-item">
                        <div class="pinfo-label">UPI ID</div>
                        <div class="pinfo-value">${fields.upiId}</div>
                    </div>
                    <div class="pinfo-item">
                        <div class="pinfo-label">Transaction Date</div>
                        <div class="pinfo-value">${fields.transactionDateOnly}</div>
                    </div>
                    <div class="pinfo-item">
                        <div class="pinfo-label">Transaction Time</div>
                        <div class="pinfo-value">${fields.transactionTimeOnly}</div>
                    </div>
                    
                </div>
            </div>

            <div class="txn-wrap">
                <div class="section-head">
                    <div class="section-line"></div>
                    <div class="section-badge">Transaction Details</div>
                    <div class="section-line"></div>
                </div>
                <table class="tbl">
                    <thead>
                        <tr>
                            <th style="text-align: left;">Description</th>
                            <th>Qty</th>
                            <th>Unit Price</th>
                            <th>Gross Amt</th>
                            <th>Tax</th>
                            <th>Net Amt</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="text-align: left;">${escapeHtml(descriptionText)}</td>
                            <td>1</td>
                            <td>${formatCurrency(formattedAmount)}</td>
                            <td>${formatCurrency(formattedAmount)}</td>
                            <td class="dash">—</td>
                            <td>${formatCurrency(formattedAmount)}</td>
                        </tr>
                        <tr class="total-row">
                            <td colspan="3" style="text-align: center; font-weight: 700;">Total</td>
                            <td>${formatCurrency(formattedAmount)}</td>
                            <td>0</td>
                            <td>${formatCurrency(formattedAmount)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="total-wrap">
                <div class="total-hero">
                    <div class="total-label">Total Amount Paid</div>
                    <div class="total-number">₹${escapeHtml(formattedAmount)}</div>
                </div>
                <div class="total-rows">
                    <div class="trow">
                        <span>Sub-Total</span><strong>${formatCurrency(formattedAmount)}</strong>
                    </div>

                    <div class="trow-net">
                        <span>Net Total</span><strong>${formatCurrency(formattedAmount)}</strong>
                    </div>
                </div>
            </div>

            <div class="terms">
                <div class="terms-head">Terms &amp; Conditions</div>
                <div class="terms-body">
                    <div class="term">By receiving this receipt, the user confirms that the applicable fees were paid to ${escapeHtml(receiptEntityName)} through the payment gateway and accepts the company's terms related to this transaction.</div>
                    <div class="term">This receipt is issued against the UPI ID through which the payment was collected and verified.</div>
                    <div class="term">This is a computer-generated receipt and does not require a physical seal or signature for validation.</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
};
