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

export const renderTechterraInvoiceHTML = ({
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
            background: #151515;
            color: #f5f5f5;
            font-family: "Segoe UI", Arial, sans-serif;
        }
        .page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
        }
        .invoice {
            position: relative;
            width: 210mm;
            min-height: 297mm;
            padding: 14mm 14mm 10mm;
            background:
                linear-gradient(115deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 38%),
                radial-gradient(circle at 20% 18%, rgba(255,255,255,0.04), transparent 34%),
                linear-gradient(180deg, #262626 0%, #1b1b1b 100%);
            overflow: hidden;
        }
        .content {
            position: relative;
            z-index: 1;
        }
        .hero-pill {
            width: 86mm;
            min-height: 22mm;
            border: 1px solid rgba(144, 19, 19, 0.9);
            border-left: none;
            border-radius: 0 11mm 11mm 0;
            display: flex;
            align-items: center;
            gap: 4mm;
            padding: 5mm 6mm 5mm 5mm;
            margin-left: -14mm;
        }
        .hero-logo {
            width: 75mm;
            max-height: 20mm;
            object-fit: contain;
            object-position: left center;
            flex-shrink: 0;
        }
        .hero-copy {
            min-width: 0;
        }
        .hero-title {
            font-size: 28px;
            line-height: 0.95;
            font-weight: 300;
            letter-spacing: 0.02em;
            color: #ffffff;
        }
        .hero-subtitle {
            margin-top: 1.5mm;
            font-size: 9px;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: rgba(255,255,255,0.82);
        }
        .top-meta {
            display: grid;
            grid-template-columns: 1.15fr 0.85fr;
            gap: 18mm;
            margin-top: 24mm;
            margin-bottom: 14mm;
            max-width: 150mm;
        }
        .to-label,
        .meta-label {
            font-size: 11px;
            color: rgba(255,255,255,0.92);
            font-weight: 700;
            margin-bottom: 3mm;
        }
        .to-value {
            font-size: 10px;
            line-height: 1.75;
            color: rgba(255,255,255,0.84);
            text-align: center;
            margin-top: -10mm;
        }
        .to-value strong {
            display: block;
            margin-bottom: 2mm;
            font-size: 15px;
            line-height: 1.2;
            white-space: nowrap;
            color: #ffffff;
            text-align: center;
        }
        .meta-card {
            border: 1px solid rgba(255,255,255,0.18);
            border-radius: 4mm;
            padding: 4.5mm 5mm;
            background: rgba(255,255,255,0.02);
            backdrop-filter: blur(2px);
        }
        .meta-row + .meta-row {
            margin-top: 4mm;
            padding-top: 4mm;
            border-top: 1px solid rgba(255,255,255,0.1);
        }
        .meta-value {
            font-size: 11px;
            line-height: 1.6;
            color: rgba(255,255,255,0.88);
            word-break: break-word;
        }
        .meta-inline {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 4mm;
        }
        .meta-inline .meta-label,
        .meta-inline .meta-value {
            margin: 0;
            line-height: 1.35;
            white-space: nowrap;
        }
        .meta-inline .meta-value {
            text-align: right;
        }
        .client-strip {
            margin-top: 4mm;
            margin-bottom: 6mm;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 5mm;
        }
        .client-item {
            border: 1px solid rgba(255,255,255,0.14);
            border-radius: 4mm;
            background: rgba(255,255,255,0.03);
            padding: 4mm 5mm;
            text-align: center;
        }
        .client-label {
            font-size: 9px;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: rgba(255,255,255,0.62);
            margin-bottom: 1.5mm;
            font-weight: 700;
        }
        .client-value {
            font-size: 12px;
            line-height: 1.45;
            color: #ffffff;
            font-weight: 700;
            word-break: break-word;
        }
        .table-head {
            margin-top: 0;
            background: #ffffff;
            color: #252525;
            border-radius: 999px;
            display: grid;
            grid-template-columns: 1.8fr 0.7fr 1.1fr 1.1fr 0.8fr 1.1fr;
            gap: 4mm;
            padding: 3.2mm 6mm;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.24em;
            text-transform: uppercase;
            text-align: center;
        }
        .table-body {
            margin-top: 5mm;
        }
        .table-row {
            display: grid;
            grid-template-columns: 1.8fr 0.7fr 1.1fr 1.1fr 0.8fr 1.1fr;
            gap: 4mm;
            align-items: start;
            padding: 4.5mm 6mm;
            color: rgba(255,255,255,0.92);
            font-size: 12px;
            line-height: 1.45;
            text-align: center;
        }
        .table-row + .table-row {
            margin-top: 3mm;
        }
        .table-row .desc {
            text-align: center;
        }
        .table-row.total-row .desc {
            grid-column: 1 / 4;
            font-weight: 700;
        }
        .bottom-grid {
            margin-top: 16mm;
            display: grid;
            grid-template-columns: 1.5fr 0.5fr;
            gap: 18mm;
            align-items: start;
        }
        .payment-title,
        .notes__title {
            font-size: 14px;
            margin-top: 10rem;
            font-weight: 800;
            color: #ffffff;
            margin-bottom: 3mm;
        }
        .payment-copy,
        .notes__body {
            font-size: 12px;
            line-height: 1.75;
            color: rgba(255,255,255,0.82);
        }
        .notes__list {
            margin: 0;
            padding-left: 4.5mm;
        }
        .notes__list li + li {
            margin-top: 1.5mm;
        }
        .totals {
            justify-self: end;
            width: 100%;
            max-width: 54mm;
        }
        .total-line {
            display: flex;
            justify-content: space-between;
            gap: 4mm;
            align-items: baseline;
            font-size: 11px;
            font-weight: 700;
            color: rgba(255,255,255,0.92);
            margin-bottom: 2.5mm;
        }
        .rule {
            margin: 8mm 0 6mm;
            height: 1px;
            background: rgba(255,255,255,0.45);
        }
        .grand-row {
            display: flex;
            justify-content: space-between;
            gap: 4mm;
            align-items: baseline;
            font-size: 11px;
            font-weight: 800;
            color: #ffffff;
        }
        .note-pill {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 10mm;
            border: 1px solid rgba(255,255,255,0.88);
            border-radius: 999px;
            padding: 0 5mm;
            margin-top: 8mm;
            font-size: 10px;
            font-weight: 700;
            color: #ffffff;
        }
        .footer-copy {
            margin-top: 12mm;
            max-width: 76mm;
        }
        .footer-copy strong {
            display: block;
            font-size: 12px;
            font-weight: 800;
            color: #ffffff;
            margin-bottom: 2mm;
        }
        .footer-copy div {
            font-size: 10px;
            line-height: 1.65;
            color: rgba(255,255,255,0.84);
        }
        @media print {
            body { background: #ffffff; }
            .page { width: 210mm; }
            .invoice {
                box-shadow: none;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .hero-pill,
            .meta-card,
            .table-head,
            .note-pill {
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
            <div class="content">
                <div>
                    <img class="hero-logo" src="${merchantInfo.logoPath}" alt="${escapeHtml(merchantInfo.displayName)} logo" />
                </div>

                <div class="top-meta">
                    <div class="to-block">
                        <div class="to-value">
                            <strong>${escapeHtml(merchantInfo.companyName || merchantInfo.displayName)}</strong>
                            ${addressHtml}
                            ${gstText ? `<br/>GST: ${escapeHtml(gstText)}` : ""}
                        </div>
                    </div>
                    <div class="meta-card">
                        <div class="meta-row">
                            <div class="meta-inline">
                                <div class="meta-label">Invoice No</div>
                                <div class="meta-value">${escapeHtml(invoiceNumberToDisplay)}</div>
                            </div>
                        </div>
                        <div class="meta-row">
                            <div class="meta-inline">
                                <div class="meta-label">RRN No</div>
                                <div class="meta-value">${escapeHtml(paddedRrn)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="client-strip">
                    <div class="client-item">
                        <div class="client-label">Name</div>
                        <div class="client-value">${fields.customerName}</div>
                    </div>
                    <div class="client-item">
                        <div class="client-label">UPI ID</div>
                        <div class="client-value">${fields.upiId}</div>
                    </div>
                </div>

                <div class="table-head">
                    <span>Description</span>
                    <span>Qty</span>
                    <span>Unit Price</span>
                    <span>Gross Amount</span>
                    <span>Tax</span>
                    <span>Net Amount</span>
                </div>

                <div class="table-body">
                    <div class="table-row">
                        <span class="desc">${escapeHtml(descriptionText)}</span>
                        <span>1</span>
                        <span>${formatCurrency(formattedAmount)}</span>
                        <span>${formatCurrency(formattedAmount)}</span>
                        <span>₹ 0.00</span>
                        <span>${formatCurrency(formattedAmount)}</span>
                    </div>
                    <div class="table-row total-row">
                        <span class="desc">Total</span>
                        <span>${formatCurrency(formattedAmount)}</span>
                        <span>₹ 0.00</span>
                        <span>${formatCurrency(formattedAmount)}</span>
                    </div>
                </div>

             

                <div class="rule"></div>

                <div class="bottom-grid" style="margin-top: 0;">
                    <div>
                        <div class="notes__title">Terms & Conditions:</div>
                        <div class="notes__body">
                            <ul class="notes__list">
                                <li>By receiving this receipt, the user confirms that the applicable fees were paid to ${escapeHtml(merchantInfo.receiptEntityName || merchantInfo.displayName)} through the payment gateway and accepts the company's terms related to this transaction.</li>
                                <li>This receipt is issued against the UPI ID through which the payment was collected and verified.</li>
                                <li>This is a computer-generated receipt — no physical seal or signature required.</li>
                            </ul>
                        </div>

                    </div>
                    <div class="totals">
                        <div class="grand-row"><span>Grand Total</span><strong>${formatCurrency(formattedAmount)}</strong></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
};
