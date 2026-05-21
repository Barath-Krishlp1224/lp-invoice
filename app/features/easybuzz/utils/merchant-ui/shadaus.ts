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
}: MerchantInvoiceRenderContext) => {
    const receiptName = receiptEntityName || merchantInfo.displayName;
    const taxValue = "0.00";
    const subtotalValue = formattedAmount;
    const totalValue = formattedAmount;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(formatRrnValue(rrnValue))}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            min-height: 100vh;
            background: #f3f4f6;
            color: #1f2937;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
            padding: 16px;
        }

        .page-shell {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
        }

        .invoice-card {
            width: 100%;
            max-width: 980px;
            background: #ffffff;
            box-shadow: 0 22px 55px rgba(15, 23, 42, 0.12);
            border-radius: 2px;
            overflow: hidden;
        }

        .top-bar {
            height: 8px;
            background: #1d4ed8;
        }

        .content {
            padding: 28px 32px 32px;
        }

        .micro-head {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 24px;
            font-size: 13px;
            color: #6b7280;
            margin-bottom: 34px;
        }

        .micro-code {
            font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
            letter-spacing: 0.06em;
            color: #4b5563;
        }

        .micro-brand {
            text-align: right;
        }

        .micro-brand-main {
            color: #4b5563;
            line-height: 1.45;
        }

        .micro-brand-sub {
            font-size: 11px;
            color: #c3c8d1;
            margin-top: 2px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
        }

        .brand-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            gap: 24px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 18px;
            margin-bottom: 28px;
        }

        .brand-title {
            font-size: 42px;
            font-weight: 800;
            letter-spacing: -0.05em;
            color: #1f2937;
            line-height: 1;
        }

        .brand-address {
            font-size: 11px;
            color: #9ca3af;
            margin-top: 8px;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            line-height: 1.7;
        }

        .brand-tagline {
            text-align: right;
            font-size: 11px;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.14em;
        }

        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 28px;
            margin-bottom: 34px;
        }

        .section-kicker {
            font-size: 11px;
            font-weight: 700;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 10px;
        }

        .invoice-name {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 4px;
        }

        .invoice-copy {
            font-size: 14px;
            line-height: 1.6;
            color: #4b5563;
        }

        .meta-stack {
            display: grid;
            gap: 8px;
            font-size: 14px;
        }

        .meta-line {
            display: flex;
            justify-content: space-between;
            gap: 16px;
        }

        .meta-line .label {
            color: #6b7280;
        }

        .meta-line .value {
            color: #1f2937;
            font-weight: 600;
            text-align: right;
            overflow-wrap: anywhere;
        }

        .table-wrap {
            overflow-x: auto;
            margin-bottom: 34px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }

        thead tr {
            border-bottom: 1px solid #e5e7eb;
        }

        th {
            text-align: left;
            padding: 12px 0;
            font-size: 13px;
            font-weight: 700;
            color: #4b5563;
        }

        th:not(:first-child),
        td:not(:first-child) {
            text-align: right;
        }

        tbody tr {
            border-bottom: 1px solid #f3f4f6;
        }

        td {
            padding: 14px 0;
            color: #1f2937;
        }

        .two-col {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 32px;
            margin-bottom: 38px;
        }

        .thank-you {
            font-size: 14px;
            font-style: italic;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
            padding-top: 16px;
            margin-bottom: 18px;
        }

        .payment-stack {
            display: grid;
            gap: 6px;
            font-size: 14px;
        }

        .payment-line {
            display: flex;
            gap: 12px;
        }

        .payment-line .label {
            width: 120px;
            color: #6b7280;
            flex-shrink: 0;
        }

        .payment-line .value {
            color: #1f2937;
        }

        .totals {
            display: grid;
            gap: 10px;
            font-size: 14px;
        }

        .total-line {
            display: flex;
            justify-content: space-between;
            gap: 16px;
        }

        .total-line .label {
            color: #6b7280;
        }

        .total-line .value {
            color: #1f2937;
        }

        .total-line.rule {
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 10px;
        }

        .grand-total {
            padding-top: 4px;
            font-size: 16px;
            font-weight: 800;
        }

        .grand-total .label,
        .grand-total .value {
            color: #111827;
        }

        .bottom-section {
            margin-top: 8px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
        }

        .bottom-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 32px;
        }

        .terms-copy {
            font-size: 12px;
            line-height: 1.8;
            color: #6b7280;
        }

        .signature {
            text-align: right;
        }

        .signature-name {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 4px;
        }

        .signature-role {
            font-size: 14px;
            color: #4b5563;
            margin-top: 4px;
        }

        .signature-tag {
            font-size: 11px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.08em;
        }

        .footer-mark {
            margin-top: 32px;
            text-align: center;
            font-size: 10px;
            color: #d1d5db;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        }

        @media print {
            body {
                background: #ffffff;
                padding: 0;
            }

            .page-shell {
                padding: 0;
                min-height: auto;
            }

            .invoice-card {
                max-width: none;
                box-shadow: none;
                border-radius: 0;
            }

            .top-bar {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            @page {
                size: A4 portrait;
                margin: 0;
            }
        }

        @media (max-width: 760px) {
            .content {
                padding: 24px 20px 28px;
            }

            .micro-head,
            .brand-row,
            .info-grid,
            .two-col,
            .bottom-grid {
                grid-template-columns: 1fr;
                display: grid;
            }

            .brand-tagline,
            .micro-brand,
            .signature {
                text-align: left;
            }

            .meta-line,
            .total-line {
                gap: 12px;
            }
        }
    </style>
</head>
<body>
    <div class="page-shell">
        <div class="invoice-card">
            <div class="top-bar"></div>
            <div class="content">
                <div class="micro-head">
                    <div class="micro-code">${escapeHtml(formatRrnValue(rrnValue))}</div>
                    <div class="micro-brand">
                        <div class="micro-brand-main">${escapeHtml(receiptName)}</div>
                        <div class="micro-brand-sub">Brand</div>
                    </div>
                </div>

                <div class="brand-row">
                    <div>
                        <div class="brand-title">${escapeHtml(merchantInfo.displayName || "BRAND")}</div>
                        <div class="brand-address">${fields.addressHtml}</div>
                    </div>
                    <div class="brand-tagline">Invoice</div>
                </div>

                <div class="info-grid">
                    <div>
                        <div class="section-kicker">Invoice To:</div>
                        <div class="invoice-name">${escapeHtml(fields.customerName)}</div>
                        <div class="invoice-copy">${escapeHtml(fields.upiId)}</div>
                        <div class="invoice-copy">${escapeHtml(receiptName)}</div>
                    </div>
                    <div class="meta-stack">
                        <div class="meta-line">
                            <span class="label">Invoice No:</span>
                            <span class="value">${escapeHtml(invoiceNumberToDisplay)}</span>
                        </div>
                        <div class="meta-line">
                            <span class="label">RRN No:</span>
                            <span class="value">${escapeHtml(formatRrnValue(rrnValue))}</span>
                        </div>
                        <div class="meta-line">
                            <span class="label">Invoice Date:</span>
                            <span class="value">${escapeHtml(fields.transactionDateOnly)}</span>
                        </div>
                        <div class="meta-line">
                            <span class="label">Invoice Time:</span>
                            <span class="value">${escapeHtml(fields.transactionTimeOnly)}</span>
                        </div>
                    </div>
                </div>

                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>SL.N.</th>
                                <th>ITEM DESCRIPTION</th>
                                <th>PRICE</th>
                                <th>QTY</th>
                                <th>TAX</th>
                                <th>TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>01</td>
                                <td>${escapeHtml(descriptionText)}</td>
                                <td>₹ ${escapeHtml(formattedAmount)}</td>
                                <td>1</td>
                                <td>${taxValue}</td>
                                <td>₹ ${escapeHtml(formattedAmount)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="two-col">
                    <div>
                        <div class="thank-you">Thank You For Your Business</div>
                        <div class="section-kicker">Payment Method</div>
                        <div class="payment-stack">
                            <div class="payment-line">
                                <span class="label">Account No:</span>
                                <span class="value">${escapeHtml(formatRrnValue(rrnValue))}</span>
                            </div>
                            <div class="payment-line">
                                <span class="label">Account Name:</span>
                                <span class="value">${escapeHtml(receiptName)}</span>
                            </div>
                            <div class="payment-line">
                                <span class="label">Branch Name:</span>
                                <span class="value">${escapeHtml(merchantInfo.companyName)}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div class="totals">
                            <div class="total-line">
                                <span class="label">SubTotal</span>
                                <span class="value">₹ ${escapeHtml(subtotalValue)}</span>
                            </div>
                            <div class="total-line">
                                <span class="label">Tax.VAT 0%</span>
                                <span class="value">${taxValue}</span>
                            </div>
                            <div class="total-line rule">
                                <span class="label">Discount</span>
                                <span class="value">0.00</span>
                            </div>
                            <div class="total-line grand-total">
                                <span class="label">Total Amount</span>
                                <span class="value">₹ ${escapeHtml(totalValue)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bottom-section">
                    <div class="bottom-grid">
                        <div>
                            <div class="section-kicker">Terms &amp; Condition:</div>
                            <div class="terms-copy">
                                By receiving this receipt, the user confirms that the applicable fees were paid to ${escapeHtml(receiptName)} through the payment gateway and accepts the company's terms related to this transaction. This receipt is issued against the UPI ID through which the payment was collected and verified. This is a computer-generated receipt and does not require a physical seal or signature for validation.
                            </div>
                        </div>
                        <div class="signature">
                            <div class="signature-name">${escapeHtml(merchantInfo.displayName || "Name Surname")}</div>
                            <div class="signature-tag">${escapeHtml(merchantInfo.companyName || "NAME SURNAME")}</div>
                            <div class="signature-role">General Manager</div>
                        </div>
                    </div>
                </div>

                <div class="footer-mark">Invoice Template Design</div>
            </div>
        </div>
    </div>
</body>
</html>`;
};
