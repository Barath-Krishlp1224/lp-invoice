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

export const renderByteBlissInvoiceHTML = ({
    merchantInfo,
    invoiceNumberToDisplay,
    rrnValue,
    formattedAmount,
    descriptionText,
    fields,
}: MerchantInvoiceRenderContext) => {
    const { addressHtml, gstText } = splitAddressAndGst(merchantInfo.address || fields.addressHtml);
    const displayAmount = String(formattedAmount || "").replace(/\.00\b/g, "");

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(invoiceNumberToDisplay)} | ${escapeHtml(merchantInfo.displayName)}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            background: #c8d4dc;
            font-family: 'Nunito Sans', 'Segoe UI', sans-serif;
            min-height: 100vh;
            padding: 28px 16px 48px;
            color: #1a2e3b;
        }

        .page {
            max-width: 700px;
            margin: 0 auto;
        }

        .card {
            background: #dce6ec;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 16px 48px rgba(0, 0, 0, 0.18);
            position: relative;
        }

        .hdr {
            position: relative;
            padding: 36px 40px 0 40px;
            overflow: hidden;
        }

        .wave {
            position: absolute;
            top: 0;
            right: 0;
            width: 500px;
            height: 260px;
            pointer-events: none;
            z-index: 0;
        }

        .hdr__row1 {
            position: relative;
            z-index: 2;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 36px;
            gap: 20px;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .logo__image {
            width: 70mm;
            max-height: 64px;
            object-fit: contain;
            object-position: left center;
            flex-shrink: 0;
            display: block;
        }

        .logo__icon {
            width: 46px;
            height: 46px;
            flex-shrink: 0;
        }

        .logo__name {
            font-size: 15px;
            font-weight: 900;
            color: #1a2e3b;
            letter-spacing: 0.5px;
            line-height: 1;
            text-transform: uppercase;
        }

        .logo__sub {
            font-size: 10.5px;
            color: #4a6070;
            margin-top: 3px;
            font-weight: 400;
            line-height: 1.45;
        }

        .inv-heading {
            font-size: 52px;
            font-weight: 900;
            color: #1a2e3b;
            letter-spacing: -1px;
            line-height: 1;
            text-transform: uppercase;
            position: relative;
            z-index: 2;
        }

        .hdr__row2 {
            position: relative;
            z-index: 2;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 22px;
            padding-bottom: 36px;
        }

        .info-left {
            min-width: 0;
            flex: 1;
        }

        .info-section { margin-bottom: 20px; }
        .info-section:last-child { margin-bottom: 0; }

        .info-label {
            font-size: 12px;
            font-weight: 800;
            color: #1a2e3b;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 6px;
        }

        .info-value {
            font-size: 13px;
            color: #2a4050;
            line-height: 1.7;
            font-weight: 400;
            text-align: left;
        }

        .info-value__company {
            display: block;
            font-size: 14px;
            font-weight: 900;
            color: #1a2e3b;
            margin-bottom: 4px;
        }

        .info-value__gst {
            display: block;
            margin-top: 4px;
        }

        .info-right {
            min-width: 205px;
            text-align: right;
            color: #374151;
            margin-top: -78px;
            padding: 18px 18px 14px;
            border-radius: 18px;
            position: relative;
            z-index: 3;
            text-shadow: none;
        }

        .info-right__item + .info-right__item {
            margin-top: 10px;
        }

        .info-right__label {
            display: block;
            font-size: 11px;
            font-weight: 900;
            letter-spacing: 0.9px;
            text-transform: uppercase;
            color: #6b7280;
            line-height: 1.2;
            -webkit-text-fill-color: #6b7280;
        }

        .info-right__value {
            display: block;
            margin-top: 4px;
            font-size: 15px;
            font-weight: 900;
            color: #111111;
            line-height: 1.25;
            -webkit-text-fill-color: #111111;
        }

        .table-zone {
            padding: 0 28px;
            margin-bottom: 28px;
        }

        .tbl-header {
            background: linear-gradient(90deg, #2b8a8a 0%, #1e6b7a 100%);
            border-radius: 50px;
            display: grid;
            grid-template-columns: minmax(0, 2.2fr) minmax(0, 0.55fr) minmax(0, 0.95fr) minmax(0, 1.05fr) minmax(0, 0.55fr) minmax(0, 1.05fr);
            width: 100%;
            padding: 14px 20px;
            margin-bottom: 6px;
            gap: 8px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .tbl-header span {
            font-size: 10px;
            font-weight: 800;
            color: #ffffff;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            line-height: 1.25;
            overflow-wrap: anywhere;
            text-align: center;
        }

        .tbl-body {
            background: #ffffff;
            border-radius: 20px;
            padding: 8px 0;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .tbl-row {
            display: grid;
            grid-template-columns: minmax(0, 2.2fr) minmax(0, 0.55fr) minmax(0, 0.95fr) minmax(0, 1.05fr) minmax(0, 0.55fr) minmax(0, 1.05fr);
            width: 100%;
            padding: 14px 20px;
            align-items: center;
            border-bottom: 1px solid #f0f4f7;
            gap: 8px;
        }

        .tbl-row:last-child { border-bottom: none; }

        .r-desc {
            font-size: 12px;
            color: #1a2e3b;
            font-weight: 400;
            line-height: 1.5;
            overflow-wrap: anywhere;
            text-align: center;
        }

        .r-num,
        .r-price {
            text-align: center;
            font-size: 12px;
            color: #1a2e3b;
            font-weight: 400;
            overflow-wrap: anywhere;
        }

        .r-total {
            text-align: center;
            font-size: 12px;
            color: #1a2e3b;
            font-weight: 400;
            overflow-wrap: anywhere;
        }

        .tbl-total-row {
            display: grid;
            grid-template-columns: minmax(0, 2.2fr) minmax(0, 0.55fr) minmax(0, 0.95fr) minmax(0, 1.05fr) minmax(0, 0.55fr) minmax(0, 1.05fr);
            width: 100%;
            padding: 14px 20px;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            font-weight: 700;
            color: #1a2e3b;
        }

        .tbl-total-label {
            grid-column: 1 / 4;
            text-align: center;
        }

        .tbl-gross,
        .tbl-tax,
        .tbl-net {
            text-align: center;
        }

        .bottom-zone {
            padding: 0 28px 36px;
            display: grid;
            grid-template-columns: 1fr 240px;
            gap: 24px;
            align-items: start;
            
        }

        .notes__title {
            font-size: 12px;
            font-weight: 800;
            color: #1a2e3b;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 10px;
            margin-top: 20mm;
        }

        .notes__body {
            font-size: 11.5px;
            color: #4a6070;
            line-height: 1.7;
            font-weight: 400;
        }

        .notes__list {
            list-style: disc;
            padding-left: 18px;
            margin: 0;
        }

        .notes__list li + li {
            margin-top: 8px;
        }

        .totals {
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            overflow: hidden;
        }

        .totals__row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 13px 20px;
            border-bottom: 1px solid #f0f4f7;
            font-size: 13px;
            gap: 16px;
        }

        .totals__row:last-child { border-bottom: none; }
        .totals__row .tk { font-weight: 700; color: #1a2e3b; }
        .totals__row .tv { color: #1a2e3b; font-weight: 400; white-space: nowrap; }
        .totals__row.grand .tk { font-weight: 900; font-size: 14px; }
        .totals__row.grand .tv { font-weight: 700; font-size: 14px; }

        .ftr {
            background: #1a2e3b;
            margin: 0 28px 28px;
            border-radius: 50px;
            display: flex;
            justify-content: space-evenly;
            align-items: center;
            padding: 15px 24px;
            gap: 8px;
        }

        .fi {
            display: flex;
            align-items: center;
            gap: 9px;
            font-size: 11.5px;
            color: #c8d8e4;
            font-weight: 400;
            min-width: 0;
        }

        .fi span {
            overflow-wrap: anywhere;
        }

        .fi svg {
            width: 14px;
            height: 14px;
            stroke: #c8d8e4;
            fill: none;
            stroke-width: 1.8;
            stroke-linecap: round;
            stroke-linejoin: round;
            flex-shrink: 0;
        }

        .fi-sep {
            width: 1px;
            height: 20px;
            background: rgba(255, 255, 255, 0.15);
        }

        @media (max-width: 580px) {
            body { padding: 16px 10px 40px; }
            .hdr { padding: 24px 22px 0; }
            .hdr__row1 { flex-direction: column; gap: 16px; margin-bottom: 24px; }
            .hdr__row2 { flex-direction: column; gap: 20px; padding-bottom: 28px; }
            .info-right { text-align: left; min-width: 0; margin-top: 0; padding: 0; text-shadow: none; }
            .wave { width: 340px; height: 180px; }
            .table-zone { padding: 0 16px; }
            .tbl-header,
            .tbl-row,
            .tbl-total-row {
                grid-template-columns: minmax(0, 2fr) minmax(0, 0.5fr) minmax(0, 0.9fr) minmax(0, 1fr) minmax(0, 0.5fr) minmax(0, 1fr);
                padding: 12px 12px;
                gap: 6px;
            }
            .tbl-header span { font-size: 9px; letter-spacing: 0.3px; }
            .r-desc, .r-num, .r-price, .r-total, .tbl-total-row { font-size: 11px; }
            .bottom-zone { padding: 0 16px 28px; grid-template-columns: 1fr; }
            .ftr { margin: 0 16px 24px; border-radius: 14px; flex-direction: column; gap: 12px; }
            .fi-sep { width: 100%; height: 1px; }
        }

        @media print {
            body { background: #dce6ec; padding: 0; }
            .card { box-shadow: none; }
            .info-right,
            .info-right__label,
            .info-right__value {
                -webkit-text-fill-color: inherit !important;
                text-shadow: none !important;
            }
            .info-right { color: #374151 !important; }
            .info-right__label {
                color: #6b7280 !important;
                -webkit-text-fill-color: #6b7280 !important;
            }
            .info-right__value {
                color: #111111 !important;
                -webkit-text-fill-color: #111111 !important;
            }
            .tbl-header {
                background: #1f7a84 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="card">
            <div class="hdr">
                <svg class="wave" viewBox="0 0 340 260" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMaxYMin meet">
                    <defs>
                        <linearGradient id="wg" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#4bbfbf" />
                            <stop offset="100%" stop-color="#1a6e80" />
                        </linearGradient>
                    </defs>
                    <path
                        d="M340 0 C 280 0, 180 10, 150 70 C 120 130, 190 190, 260 210 C 300 220, 340 215, 340 215 Z"
                        fill="url(#wg)"
                        opacity="0.82"
                    />
                    <path
                        d="M340 0 C 300 0, 240 12, 220 55 C 200 98, 250 150, 310 168 C 328 174, 340 172, 340 172 Z"
                        fill="#7ddada"
                        opacity="0.30"
                    />
                </svg>

                <div class="hdr__row1">
                    <div class="logo">
                        <img class="logo__image" src="${merchantInfo.logoPath}" alt="${escapeHtml(merchantInfo.displayName)} logo" />
                    </div>
                </div>

                <div class="hdr__row2">
                    <div class="info-left">
                        <div class="info-section">
                            <div class="info-value">
                                <span class="info-value__company">${escapeHtml(merchantInfo.companyName || merchantInfo.displayName)}</span>
                                ${addressHtml}
                                <span class="info-value__gst">GST: ${escapeHtml(gstText || "N/A")}</span>
                            </div>
                        </div>
                        <div class="info-section">
                            <div class="info-label">Transaction Details</div>
                            <div class="info-value">
                                Name: ${escapeHtml(fields.customerName || "N/A")}<br />
                                UPI ID: ${escapeHtml(fields.upiId || "N/A")}<br />
                                Transaction Time: ${escapeHtml(fields.transactionTimeOnly || "N/A")}<br />
                                Transaction Date: ${escapeHtml(fields.transactionDateOnly || "N/A")}
                            </div>
                        </div>
                    </div>

                    <div class="info-right" style="color: #374151 !important; -webkit-text-fill-color: #374151 !important;">
                        <div class="info-right__item" style="color: #374151 !important; -webkit-text-fill-color: #374151 !important;">
                            <span class="info-right__label" style="color: #6b7280 !important; -webkit-text-fill-color: #6b7280 !important;">Invoice No</span>
                            <span class="info-right__value" style="color: #111111 !important; -webkit-text-fill-color: #111111 !important;">${escapeHtml(invoiceNumberToDisplay)}</span>
                        </div>
                        <div class="info-right__item" style="color: #374151 !important; -webkit-text-fill-color: #374151 !important;">
                            <span class="info-right__label" style="color: #6b7280 !important; -webkit-text-fill-color: #6b7280 !important;">RRN No</span>
                            <span class="info-right__value" style="color: #111111 !important; -webkit-text-fill-color: #111111 !important;">${escapeHtml(formatRrnValue(rrnValue))}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="table-zone">
                <div class="tbl-header">
                    <span>Description</span>
                    <span>Qty</span>
                    <span>Unit Price</span>
                    <span>Gross Amount</span>
                    <span>Tax</span>
                    <span>Unit Amount</span>
                </div>

                <div class="tbl-body">
                    <div class="tbl-row">
                        <span class="r-desc">${escapeHtml(descriptionText)}</span>
                        <span class="r-num">1</span>
                        <span class="r-price">₹${displayAmount}</span>
                        <span class="r-total">₹${displayAmount}</span>
                        <span class="r-price">-</span>
                        <span class="r-total">₹${displayAmount}</span>
                    </div>
                    <div class="tbl-total-row">
                        <span class="tbl-total-label">Total</span>
                        <span class="tbl-gross">₹${displayAmount}</span>
                        <span class="tbl-tax">-</span>
                        <span class="tbl-net">₹${displayAmount}</span>
                    </div>
                </div>
            </div>

            <div class="bottom-zone">
                <div class="notes">
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
                    <div class="totals__row grand">
                        <span class="tk">Grand Total</span>
                        <span class="tv">₹${displayAmount}</span>
                    </div>
                </div>
            </div>

        
        </div>
    </div>
</body>
</html>`;
};
