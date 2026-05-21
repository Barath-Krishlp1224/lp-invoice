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
        addressHtml: addressLines.join("<br/>"),
        gstText: gstLine.replace(/^(gst|gstin)\s*:?\s*/i, "").trim(),
    };
};

const formatCurrency = (amount: string) => `₹ ${escapeHtml(amount)}`;

export const renderOrionbyteInvoiceHTML = ({
    merchantInfo,
    invoiceNumberToDisplay,
    rrnValue,
    formattedAmount,
    receiptEntityName,
    descriptionText,
    fields,
}: MerchantInvoiceRenderContext) => {
    const { addressHtml, gstText } = splitAddressAndGst(merchantInfo.address || fields.addressHtml);
    const paddedRrn = formatRrnValue(rrnValue);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(paddedRrn)}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            margin: 0;
            background: #2a2a2a;
            color: #222222;
            font-family: "Segoe UI", Arial, sans-serif;
        }
        .page {
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
            padding: 0;
        }
        .invoice {
            background: #f4f2f0;
            box-shadow: 0 18px 44px rgba(15, 23, 42, 0.25);
            width: 210mm;
            min-height: 297mm;
            padding: 8mm;
            display: flex;
            flex-direction: column;
            gap: 5mm;
            border-radius: 0;
        }
        .header {
            display: grid;
            grid-template-columns: 74mm minmax(0, 1fr);
            gap: 8mm;
            align-items: start;
        }
        .left-rail {
            display: flex;
            flex-direction: column;
            gap: 0;
        }
        .brand-box {
            width: 75mm;
            height: 28mm;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2mm;
            margin-left: -6mm;
            margin-bottom: 5mm;
            position: relative;
            z-index: 2;
        }
        .brand-box img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            object-position: left center;
            display: block;
        }
        .left-card {
            background: #2f2f2f;
            color: #ffffff;
            padding: 12mm 8mm 7mm;
            border-radius: 10mm 0 10mm 0;
            overflow: hidden;
        }
        .left-section + .left-section {
            margin-top: 5mm;
        }
        .left-label {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.04em;
            margin-bottom: 1.5mm;
        }
        .left-value {
            font-size: 12px;
            line-height: 1.55;
            color: rgba(255,255,255,0.92);
            word-break: break-word;
        }
        .left-rule {
            width: 12mm;
            height: 0.4mm;
            background: rgba(255,255,255,0.78);
            margin: 6mm 0;
        }
        .right-side {
            padding-top: 6mm;
            display: flex;
            flex-direction: column;
        }
        .brand-line {
            display: flex;
            align-items: center;
            gap: 4mm;
            margin-bottom: 10mm;
        }
        .brand-mark {
            width: 11mm;
            height: 11mm;
            border: 1.2mm solid #333333;
            border-radius: 50%;
            position: relative;
            flex-shrink: 0;
        }
        .brand-mark::after {
            content: "";
            position: absolute;
            inset: 2.1mm;
            border: 1mm solid #333333;
            border-radius: 50%;
        }
        .brand-copy {
            min-width: 0;
        }
        .brand-name {
            font-size: 11px;
            font-weight: 700;
            color: #282828;
        }
        .brand-sub {
            font-size: 9px;
            color: #7a7a7a;
            margin-top: 1mm;
        }
        .invoice-title {
            font-size: 40px;
            line-height: 0.92;
            letter-spacing: 0.04em;
            font-weight: 800;
            color: #2b2b2b;
        }
        .invoice-subtitle {
            font-size: 11px;
            color: #8b8b8b;
            margin-top: 2mm;
        }
        .meta-card {
            margin-top: 4mm;
            background: #ffffff;
            border: 1px solid #ece7e1;
            padding: 4mm 5mm;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4mm;
            max-width: 80mm;
            border-radius: 4mm;
        }
        .meta-item + .meta-item {
            border-left: 1px solid #e7e1da;
            padding-left: 4mm;
        }
        .meta-label {
            font-size: 9px;
            color: #7a7a7a;
            margin-bottom: 1.5mm;
        }
        .meta-value {
            font-size: 13px;
            font-weight: 700;
            color: #3d3d3d;
            line-height: 1.4;
            word-break: break-word;
        }
        .payment-block {
            margin-top: 5mm;
            width: 100%;
            background: #ffffff;
            border: 1px solid #ece7e1;
            border-radius: 4mm;
            padding: 4mm 5mm;
        }
        .payment-head {
            display: flex;
            align-items: center;
            gap: 5mm;
            margin-bottom: 3mm;
        }
        .payment-title {
            font-size: 11px;
            font-weight: 800;
            line-height: 1.35;
            color: #272727;
        }
        .payment-rule {
            flex: 1;
            height: 0.45mm;
            background: #d9d1c8;
        }
        .payment-copy {
            font-size: 11px;
            color: #707070;
            line-height: 1.65;
            width: 100%;
            text-align: center;
        }
        .payment-copy strong {
            display: block;
            font-size: 15px;
            color: #2d2d2d;
            margin-bottom: 2mm;
            line-height: 1.35;
            text-align: center;
        }
        .table-shell {
            border: 1px solid #e8e2da;
            background: #ffffff;
            border-radius: 5mm;
            overflow: hidden;
            margin-top: 20mm;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        thead th {
            background: #2f2f2f;
            color: #ffffff;
            padding: 4mm 3mm;
            font-size: 10px;
            font-weight: 700;
            text-align: center;
        }
        tbody td {
            padding: 3.5mm 3mm;
            font-size: 11px;
            color: #323232;
            border-top: 1px solid #ede8e2;
            text-align: center;
            vertical-align: top;
        }
        tbody td.align-left {
            text-align: center;
        }
        .summary {
            display: flex;
            justify-content: flex-end;
        }
        .summary-card {
            width: 100%;
            max-width: 82mm;
            background: #ffffff;
            border: 1px solid #e8e2da;
            padding: 4mm 5mm;
            border-radius: 4mm;
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 4mm;
            font-size: 13px;
            font-weight: 800;
            color: #262626;
            text-align: left;
        }
        .summary-card strong { color: #262626; }
        .footer {
            display: grid;
            grid-template-columns: 1.5fr 0.5fr;
            gap: 8mm;
            align-items: end;
        }
        .terms {
            background: #ffffff;
            border: 1px solid #e8e2da;
            border-radius: 4mm;
            padding: 4mm 5mm;
            margin-top: 20mm;
        }
        .terms-title {
            font-size: 12px;
            font-weight: 800;
            color: #2b2b2b;
            margin-bottom: 3mm;
        }
        .btm-note-list {
            margin: 0;
            padding-left: 4.5mm;
            font-size: 11px;
            line-height: 1.75;
            color: #6f6f6f;
        }
        .btm-note-list li + li {
            margin-top: 2mm;
        }
        .contact-grid {
            display: grid;
            gap: 4mm;
        }
        .contact-item {
            display: grid;
            grid-template-columns: 7mm minmax(0, 1fr);
            gap: 3mm;
            align-items: start;
        }
        .contact-icon {
            width: 7mm;
            height: 7mm;
            background: #2f2f2f;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            border-radius: 2mm;
            line-height: 1;
        }
        .contact-text {
            font-size: 11px;
            line-height: 1.55;
            color: #4c4c4c;
        }
        .contact-text strong {
            display: block;
            color: #272727;
            margin-bottom: 0.5mm;
        }
        @media print {
            body { background: #ffffff; }
            .page {
                width: 210mm;
                max-width: 210mm;
                padding: 0;
            }
            .invoice, .brand-box, .left-card, .meta-card, thead th, .contact-icon {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .invoice {
                box-shadow: none;
                border-radius: 0;
                width: 210mm;
                min-height: 297mm;
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
                <div class="left-rail">
                    <div class="brand-box">
                        <img src="${merchantInfo.logoPath}" alt="${escapeHtml(merchantInfo.displayName)} logo" />
                    </div>
                    <div class="left-card">
                        <div class="left-section">
                            <div class="left-label">Name</div>
                            <div class="left-value">${fields.customerName}</div>
                        </div>
                        <div class="left-section">
                            <div class="left-label">UPI ID</div>
                            <div class="left-value">${fields.upiId}</div>
                        </div>
                        <div class="left-section">
                            <div class="left-label">Transaction Date</div>
                            <div class="left-value">${fields.transactionDateOnly}</div>
                        </div>
                        <div class="left-section">
                            <div class="left-label">Transaction Time</div>
                            <div class="left-value">${fields.transactionTimeOnly}</div>
                        </div>
                    </div>
                </div>

                <div class="right-side">


                    <div class="meta-card">
                     <div class="meta-item">
                            <div class="meta-label">Invoice No:</div>
                            <div class="meta-value">${escapeHtml(invoiceNumberToDisplay)}</div>
                        </div>
                        <div class="meta-item">
                            <div class="meta-label">RRN No:</div>
                            <div class="meta-value">${escapeHtml(paddedRrn)}</div>
                        </div>
                       
                    </div>

                    <div class="payment-block">
                        <div class="payment-head">
                        </div>
                        <div class="payment-copy">
                            <strong>${escapeHtml(merchantInfo.companyName || merchantInfo.displayName)}</strong>
                            ${addressHtml}
                            ${gstText ? `<br/>GST: ${escapeHtml(gstText)}` : ""}
                        </div>
                    </div>
                </div>
            </div>

            <div class="table-shell">
                <table>
                    <thead>
                        <tr>
                            <th style="width: 34%;">Description</th>
                            <th style="width: 11%;">Qty</th>
                            <th style="width: 15%;">Unit Price</th>
                            <th style="width: 15%;">Gross Amount</th>
                            <th style="width: 10%;">Tax</th>
                            <th style="width: 15%;">Net Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="align-left">${escapeHtml(descriptionText)}</td>
                            <td>1</td>
                            <td>${formatCurrency(formattedAmount)}</td>
                            <td>${formatCurrency(formattedAmount)}</td>
                            <td>0.00</td>
                            <td>${formatCurrency(formattedAmount)}</td>
                        </tr>
                        <tr>
                            <td colspan="3" style="text-align: center; font-weight: 700;">Total</td>
                            <td>${formatCurrency(formattedAmount)}</td>
                            <td>0.00</td>
                            <td>${formatCurrency(formattedAmount)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="summary">
                <div class="summary-card">
                    <span>Total</span>
                    <strong>${formatCurrency(formattedAmount)}</strong>
                </div>
            </div>

            <div class="footer">
                <div class="terms">
                    <div class="terms-title">Terms & Conditions</div>
                    <ul class="btm-note-list">
                        <li>By receiving this receipt, the user confirms that the applicable fees were paid to ${escapeHtml(receiptEntityName || merchantInfo.displayName)} through the payment gateway and accepts the company's terms related to this transaction.</li>
                        <li>This receipt is issued against the UPI ID through which the payment was collected and verified.</li>
                        <li>This is a computer-generated receipt and does not require a physical seal or signature for validation.</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
};
