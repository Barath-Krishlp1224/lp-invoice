import { escapeHtml } from "./shared";
import type { MerchantInvoiceRenderContext } from "./types";

const formatCurrency = (formattedAmount: string) => `₹ ${formattedAmount}`;

const splitAddressAndGst = (addressHtml: string) => {
    const parts = String(addressHtml || "").split(/<br\/?>/i).map((part) => part.trim()).filter(Boolean);
    const gstLine = parts.find((part) => /^gst\s*:/i.test(part)) || "";
    const addressLines = parts.filter((part) => part !== gstLine);

    return {
        addressHtml: addressLines.join("<br/>"),
        gstText: gstLine.replace(/^gst\s*:/i, "").trim(),
    };
};

export const renderCipherByteInvoiceHTML = ({
    merchantInfo,
    invoiceNumberToDisplay,
    rrnValue,
    formattedAmount,
    receiptEntityName,
    descriptionText,
    fields,
}: MerchantInvoiceRenderContext) => {
    const { addressHtml, gstText } = splitAddressAndGst(merchantInfo.address || fields.addressHtml);

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
            background: #bfbfbf;
            color: #1f2937;
            font-family: "Segoe UI", Arial, sans-serif;
        }
        .page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 10mm 8mm;
        }
        .invoice {
            position: relative;
            width: 100%;
            min-height: 277mm;
            background: #ffffff;
            border-radius: 18px;
            overflow: hidden;
        }

        .top-meta {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 8mm;
            padding: 8mm 10mm 4mm;
            font-size: 9px;
            line-height: 1.7;
            color: #6b7280;
            border-bottom: 1px solid #ececec;
        }
        .top-brand {
            display: flex;
            align-items: center;
            gap: 4mm;
            min-height: 16mm;
            
        }
        .top-brand img {
            width: 42mm;
            max-height: 18mm;
            object-fit: contain;
            object-position: left center;
            display: block;
        }
        .top-brand-copy {
            text-align: left;
        }
        .top-brand-name {
            font-size: 12px;
            font-weight: 800;
            color: #111827;
            text-transform: uppercase;
            line-height: 1.4;
            margin-bottom: 1mm;
            margin-top: 3mm;
        }
        .top-brand-address {
            font-size: 9px;
            color: #6b7280;
            line-height: 1.6;
            margin-top: 2mm;
        }
        .top-meta-text {
            text-align: right;
        }
        .top-meta-row {
            display: flex;
            justify-content: flex-end;
            align-items: baseline;
            gap: 3mm;
            margin-top: 2mm;
            white-space: nowrap;
        }
        .top-meta-row strong {
            color: #111827;
            font-size: 14px;
            font-weight: 700;
        }
        .top-meta-row span {
            color: #111827;
            font-size: 12px;
        }
        .title-band {
            display: flex;
            align-items: center;
            gap: 4mm;
            padding: 6mm 10mm 5mm;
        }
        .title-chip {
            
            color: #ffffff;
            font-size: 26px;
            font-weight: 300;
            letter-spacing: 0.04em;
            padding: 1mm 5mm 1.5mm;
            line-height: 1;
            border-radius: 10px;
        }
        .title-no {
            font-size: 26px;
            font-weight: 700;
            color: #2b2b2b;
            line-height: 1;
        }
        .summary {
            padding: 4mm 10mm 8mm;
            margin-top: 10mm;
        }
        .customer-strip {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 4mm;
        }
        .customer-card {
            min-width: 0;
        }
        .customer-label {
            font-size: 10px;
            color: #9ca3af;
            margin-bottom: 1.5mm;
            text-transform: uppercase;
            font-weight: 700;
        }
        .customer-value {
            font-size: 13px;
            line-height: 1.6;
            color: #111827;
            font-weight: 700;
            word-break: break-all;
            overflow-wrap: anywhere;
            overflow: hidden;
        }
        .table-wrap {
            padding: 0 10mm;
            margin-top: 10mm;
        }
        .transaction-grid {
            display: grid;
            gap: 4mm;
        }

        /* ─── Shared column template for header / row / footer ─── */
        .grid-header,
        .grid-row,
        .grid-footer {
            display: grid;
            grid-template-columns: 34% 8% 13% 13% 10% 1fr;
            gap: 2mm;
            align-items: stretch;
        }

        .grid-cell-header {
            padding: 3mm 2.5mm;
            color: #b71c1c;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            text-align: center;
            background: #fff3f3;
            border: 1px solid #f2b4b4;
            border-radius: 999px;
        }
        .grid-cell-header:first-child {
            text-align: center;
        }
        .grid-row {
            background: linear-gradient(135deg, #ffffff 0%, #fff8f8 100%);
            border: 1px solid #f2d3d3;
            border-radius: 16px;
            padding: 3mm;
        }
        .grid-cell {
            padding: 4mm 2.5mm;
            font-size: 10px;
            color: #374151;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #ffffff;
            border-radius: 12px;
            min-height: 16mm;
            overflow: hidden;
            word-break: break-word;
            overflow-wrap: anywhere;
            white-space: normal;
        }
        .grid-cell:first-child {
            justify-content: center;
            text-align: center;
        }
        .grid-cell:last-child {
            font-weight: 700;
            color: #111827;
        }
        .grid-footer-label {
            padding: 4mm 2.5mm;
            font-size: 11px;
            font-weight: 800;
            color: #b71c1c;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            background: #fff3f3;
            border: 1px solid #f2b4b4;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .grid-footer-value {
            padding: 4mm 2.5mm;
            font-size: 11px;
            color: #4b5563;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #ffffff;
            border: 1px solid #f2d3d3;
            border-radius: 12px;
            overflow: hidden;
            word-break: break-word;
            overflow-wrap: anywhere;
        }
        .grid-footer-value:last-child { font-weight: 800; color: #b71c1c; font-size: 12px; }
        .grid-footer-value:empty {
            background: transparent;
            border: none;
        }
        .totals-area {
            display: flex;
            justify-content: flex-end;
            padding: 8mm 10mm 0;
        }
        .totals-box {
            width: 85mm;
            position: relative;
        }
        .amount-card {
            position: relative;
            background: linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%);
            border-radius: 16px;
            padding: 6mm;
            overflow: hidden;
        }
        .amount-card::before {
            content: "";
            position: absolute;
            top: -20px;
            right: -20px;
            width: 80px;
            height: 80px;
            background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
            border-radius: 50%;
        }
        .amount-card::after {
            content: "₹";
            position: absolute;
            bottom: 8px;
            right: 15px;
            font-size: 80px;
            font-weight: 900;
            color: rgba(255, 255, 255, 0.08);
            line-height: 1;
        }
        .amount-label {
            font-size: 10px;
            color: rgba(255, 255, 255, 0.85);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-weight: 600;
            margin-bottom: 3mm;
        }
        .amount-value {
            font-size: 28px;
            color: #ffffff;
            font-weight: 800;
            letter-spacing: 0.02em;
            position: relative;
            z-index: 1;
        }
        .amount-subtext {
            margin-top: 2mm;
            font-size: 9px;
            color: rgba(255, 255, 255, 0.75);
            font-weight: 500;
        }
        .terms {
            width: calc(100% - 20mm);
            max-width: 150mm;
            margin: 38mm auto 0;
            padding: 5mm 6mm 4mm;
            border: 2px solid #b71c1c;
            border-radius: 14px;
            background: #ffffff;
        }
        .terms h3 {
            font-size: 15px;
            font-weight: 800;
            color: #111827;
            margin-bottom: 3mm;
            text-align: center;
        }
        .terms-list {
            list-style: none;
            display: grid;
            gap: 2mm;
        }
        .terms-item {
            position: relative;
            padding-left: 6mm;
            font-size: 10px;
            color: #4b5563;
            line-height: 1.8;
        }
        .terms-item::before {
            content: "›";
            position: absolute;
            left: 0;
            top: 0;
            font-size: 14px;
            line-height: 1.2;
            font-weight: 800;
            color: #b71c1c;
        }
        .thanks {
            display: flex;
            justify-content: flex-end;
            padding: 10mm 10mm 8mm;
        }
        .thanks-chip {
            background: #e57373;
            color: #ffffff;
            font-size: 22px;
            letter-spacing: 0.06em;
            padding: 1.5mm 5mm;
            font-weight: 300;
            border-radius: 10px;
        }
        .footer {
            text-align: center;
            padding: 0 10mm 8mm;
            font-size: 9px;
            color: #6b7280;
        }
        @media print {
            body { background: #ffffff; }
            .page {
                width: 210mm;
                min-height: 297mm;
                padding: 10mm 8mm;
            }
            .invoice { box-shadow: none; }
            .title-chip,
            .grid-header,
            .amount-card,
            .thanks-chip {
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
            <div class="top-meta">
                <div>
                    <div class="top-brand">
                        <img src="${merchantInfo.logoPath}" alt="${escapeHtml(merchantInfo.displayName)} logo" />
                    </div>
                    <div class="top-brand-name">${escapeHtml(merchantInfo.companyName)}</div>
                    <div class="top-brand-address">${addressHtml}${gstText ? `<br/>GST: ${escapeHtml(gstText)}` : ""}</div>
                </div>
                <div class="top-meta-text">
                    <div class="top-meta-row"><strong>Invoice Number:</strong><span>${escapeHtml(invoiceNumberToDisplay)}</span></div>
                    <div class="top-meta-row"><strong>RRN Number:</strong><span>${escapeHtml(rrnValue)}</span></div>
                </div>
            </div>

            <section class="summary">
                <div class="customer-strip">
                    <div class="customer-card">
                        <div class="customer-label">Name</div>
                        <div class="customer-value">${fields.customerName}</div>
                    </div>
                    <div class="customer-card">
                        <div class="customer-label">UPI ID</div>
                        <div class="customer-value">${fields.upiId}</div>
                    </div>
                    <div class="customer-card">
                        <div class="customer-label">Transaction Date</div>
                        <div class="customer-value">${fields.transactionDateOnly}</div>
                    </div>
                    <div class="customer-card">
                        <div class="customer-label">Transaction Time</div>
                        <div class="customer-value">${fields.transactionTimeOnly}</div>
                    </div>
                </div>
            </section>

            <section class="table-wrap">
                <div class="transaction-grid">
                    <div class="grid-header">
                        <div class="grid-cell-header">Description</div>
                        <div class="grid-cell-header">Qty</div>
                        <div class="grid-cell-header">Unit Price</div>
                        <div class="grid-cell-header">Gross Amount</div>
                        <div class="grid-cell-header">Tax</div>
                        <div class="grid-cell-header">Net Amount</div>
                    </div>
                    <div class="grid-row">
                        <div class="grid-cell">${escapeHtml(descriptionText)}</div>
                        <div class="grid-cell">1</div>
                        <div class="grid-cell">${formatCurrency(formattedAmount)}</div>
                        <div class="grid-cell">${formatCurrency(formattedAmount)}</div>
                        <div class="grid-cell">0</div>
                        <div class="grid-cell">${formatCurrency(formattedAmount)}</div>
                    </div>
                    <div class="grid-footer">
                        <div class="grid-footer-label">Total</div>
                        <div class="grid-footer-value"></div>
                        <div class="grid-footer-value"></div>
                        <div class="grid-footer-value">0</div>
                        <div class="grid-footer-value">0</div>
                        <div class="grid-footer-value">${formatCurrency(formattedAmount)}</div>
                    </div>
                </div>
            </section>

            <section class="totals-area">
                <div class="totals-box">
                    <div class="amount-card">
                        <div class="amount-label">Total Amount Due</div>
                        <div class="amount-value">${formatCurrency(formattedAmount)}</div>
                    </div>
                </div>
            </section>

            <section class="terms">
                <h3>Terms &amp; Conditions:</h3>
                <div class="terms-list">
                    <div class="terms-item">By receiving this receipt, the user confirms that the applicable fees were paid to ${escapeHtml(receiptEntityName)} through the payment gateway and accepts the company's terms related to this transaction.</div>
                    <div class="terms-item">This receipt is issued against the UPI ID through which the payment was collected and verified.</div>
                    <div class="terms-item">This is a computer-generated receipt and does not require a physical seal or signature for validation.</div>
                </div>
            </section>
        </div>
    </div>
</body>
</html>`;
};
