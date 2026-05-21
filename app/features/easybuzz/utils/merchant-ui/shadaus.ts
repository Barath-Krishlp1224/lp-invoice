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
            background: #eef1f6;
            color: #1e293b;
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Inter', Arial, sans-serif;
            padding: 20px;
        }

        .page-shell {
            min-height: 100vh;
            display: flex;
            align-items: flex-start;
            justify-content: flex-start;
            padding: 20px;
        }

        .invoice-card {
            width: 100%;
            max-width: 900px;
            margin-right: auto;
            background: #ffffff;
            box-shadow: 0 25px 60px rgba(15, 23, 42, 0.10), 0 4px 16px rgba(15, 23, 42, 0.06);
            border-radius: 16px;
            overflow: hidden;
        }

        /* ── Header ── */
        .header {
            background: linear-gradient(135deg, #f0f7ff 0%, #e0effe 100%);
            border-bottom: 1px solid #bae6fd;
            padding: 36px 40px 44px;
            position: relative;
            overflow: hidden;
        }

        .header::before {
            content: "";
            position: absolute;
            right: -60px;
            top: -60px;
            width: 220px;
            height: 220px;
            border-radius: 50%;
            background: rgba(37, 99, 235, 0.12);
        }

        .header::after {
            content: "";
            position: absolute;
            right: 60px;
            bottom: -40px;
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: rgba(37, 99, 235, 0.06);
        }

        .header-top {
            display: grid;
            grid-template-columns: minmax(360px, 1fr) 220px;
            align-items: flex-start;
            gap: 24px;
            position: relative;
            z-index: 1;
        }

        .header-brand {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 14px;
            justify-content: flex-start;
            text-align: left;
            width: 100%;
            max-width: 360px;
            min-width: 0;
        }

        .header-logo {
            max-width: 280px;
            height: auto;
            display: block;
            flex-shrink: 0;
            align-self: flex-start;
        }

        .header-brand-copy {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            justify-content: center;
            text-align: left;
            max-width: 360px;
            width: 100%;
            margin-top: 2px;
        }

        .header-company {
            font-size: 14px;
            color: #0f172a;
            font-weight: 600;
            letter-spacing: 0.02em;
            text-align: left;
            width: 100%;
            line-height: 1.45;
            word-break: normal;
            overflow-wrap: break-word;
        }

        .header-address {
            font-size: 11px;
            color: #64748b;
            margin-top: 6px;
            line-height: 1.7;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            text-align: left;
            width: 100%;
            word-break: normal;
            overflow-wrap: break-word;
        }

        .header-invoice-label {
            position: relative;
            z-index: 1;
            width: 220px;
            min-width: 220px;
            margin-top: 12px;
        }

        /* ── Meta Cards Row ── */
        .meta-cards {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin: -24px 40px 0;
            position: relative;
            z-index: 2;
        }

        .meta-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px 18px;
            box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
        }

        .meta-card-label {
            font-size: 10px;
            font-weight: 700;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 6px;
        }

        .meta-card-value {
            font-size: 13px;
            font-weight: 700;
            color: #0f172a;
            word-break: break-all;
        }

        /* ── Content Body ── */
        .content {
            padding: 32px 40px 40px;
        }

        /* ── Customer & Invoice Info ── */
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 32px;
            margin-bottom: 32px;
            padding-top: 8px;
        }

        .info-block {
            padding: 20px 24px;
            background: #f8fafc;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
        }

        .section-kicker {
            font-size: 11px;
            font-weight: 700;
            color: #2563eb;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .section-kicker::before {
            content: "";
            width: 3px;
            height: 14px;
            background: #2563eb;
            border-radius: 2px;
            flex-shrink: 0;
        }

        .invoice-name {
            font-size: 17px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 6px;
        }

        .invoice-copy {
            font-size: 13px;
            line-height: 1.7;
            color: #64748b;
        }

        .meta-stack {
            display: grid;
            gap: 0;
        }

        .meta-line {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            padding: 10px 0;
            border-bottom: 1px solid #e2e8f0;
        }

        .meta-line:last-child {
            border-bottom: none;
        }

        .meta-line .label {
            font-size: 13px;
            color: #64748b;
            font-weight: 500;
        }

        .meta-line .value {
            font-size: 13px;
            color: #0f172a;
            font-weight: 700;
            text-align: right;
            overflow-wrap: anywhere;
        }

        /* ── Table ── */
        .table-wrap {
            overflow-x: auto;
            margin-bottom: 32px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            overflow: hidden;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }

        thead tr {
            background: linear-gradient(90deg, #0f172a, #1e3a5f);
        }

        th {
            padding: 14px 16px;
            font-size: 11px;
            font-weight: 700;
            color: #ffffff;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            text-align: center;
        }

        th:first-child {
            text-align: left;
        }

        th:last-child {
            text-align: right;
        }

        tbody tr {
            border-bottom: 1px solid #f1f5f9;
        }

        tbody tr:last-child {
            border-bottom: none;
        }

        td {
            padding: 16px;
            color: #334155;
            font-weight: 500;
            text-align: center;
        }

        td:first-child {
            text-align: left;
            font-weight: 700;
            color: #0f172a;
        }

        td:last-child {
            text-align: right;
            font-weight: 700;
            color: #0f172a;
        }

        /* ── Two-Col Summary ── */
        .two-col {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 32px;
            margin-bottom: 32px;
        }

        .thank-you {
            font-size: 18px;
            font-weight: 700;
            color: #2563eb;
            margin-bottom: 20px;
            letter-spacing: -0.01em;
        }

        .payment-stack {
            display: grid;
            gap: 0;
        }

        .payment-line {
            display: flex;
            gap: 16px;
            padding: 8px 0;
            border-bottom: 1px dashed #e2e8f0;
        }

        .payment-line:last-child {
            border-bottom: none;
        }

        .payment-line .label {
            width: 130px;
            font-size: 13px;
            color: #64748b;
            flex-shrink: 0;
            font-weight: 500;
        }

        .payment-line .value {
            font-size: 13px;
            color: #0f172a;
            font-weight: 600;
        }

        .totals {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px 24px;
        }

        .total-line {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            padding: 8px 0;
        }

        .total-line .label {
            font-size: 13px;
            color: #64748b;
            font-weight: 500;
        }

        .total-line .value {
            font-size: 13px;
            color: #334155;
            font-weight: 600;
        }

        .total-line.rule {
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 12px;
            margin-bottom: 4px;
        }

        .grand-total {
            margin-top: 8px;
            background: linear-gradient(90deg, #0f172a, #2563eb);
            border-radius: 10px;
            padding: 14px 20px;
        }

        .grand-total .label {
            font-size: 15px;
            font-weight: 800;
            color: #ffffff;
        }

        .grand-total .value {
            font-size: 18px;
            font-weight: 900;
            color: #ffffff;
        }

        /* ── Bottom Section ── */
        .bottom-section {
            margin-top: 8px;
            padding-top: 28px;
            border-top: 2px solid #f1f5f9;
        }

        .bottom-grid {
            display: grid;
            grid-template-columns: 1.2fr 0.8fr;
            gap: 32px;
        }

        .terms-box {
            background: #e5e7eb;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 24px;
            margin: 32px 0;
            text-align: center;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .terms-list {
            font-size: 11.5px;
            line-height: 1.85;
            color: #64748b;
            text-align: left;
            display: inline-block;
            margin: 0 auto;
            max-width: 90%;
            padding-left: 20px;
        }

        .table-total-row td {
            font-weight: 800 !important;
            color: #0f172a !important;
            border-top: 2px solid #e2e8f0;
        }

        .signature {
            text-align: right;
            padding-top: 8px;
        }

        .signature-line {
            width: 160px;
            height: 2px;
            background: linear-gradient(90deg, #cbd5e1, #e2e8f0);
            margin-left: auto;
            margin-bottom: 12px;
            border-radius: 1px;
        }

        .signature-name {
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 2px;
        }

        .signature-tag {
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.08em;
        }

        .signature-role {
            font-size: 13px;
            color: #94a3b8;
            margin-top: 4px;
            font-weight: 500;
        }

        /* ── Footer ── */
        .footer-mark {
            margin-top: 36px;
            text-align: center;
            font-size: 10px;
            color: #cbd5e1;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
            padding-top: 16px;
            border-top: 1px solid #f1f5f9;
        }

        /* ── Print ── */
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

            .header,
            thead tr,
            .grand-total,
            .terms-box {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            .meta-card {
                box-shadow: none;
            }

            @page {
                size: A4 portrait;
                margin: 0;
            }
        }

        /* ── Mobile ── */
        @media (max-width: 760px) {
            .header {
                padding: 28px 20px 36px;
            }

            .header-top {
                grid-template-columns: 1fr;
            }

            .header-invoice-label {
                width: 100%;
                min-width: 0;
                margin-top: 8px;
            }

            .meta-cards {
                grid-template-columns: 1fr 1fr;
                margin: -20px 20px 0;
                gap: 10px;
            }

            .content {
                padding: 24px 20px 28px;
            }



            .info-grid,
            .two-col,
            .bottom-grid {
                grid-template-columns: 1fr;
            }

            .signature {
                text-align: left;
            }

            .signature-line {
                margin-left: 0;
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

            <div class="header">
                <div class="header-top">
                    <div class="header-brand">
                        <img src="${merchantInfo.logoPath}" alt="${escapeHtml(merchantInfo.displayName)} Logo" class="header-logo" />
                        <div class="header-brand-copy">
                            <div class="header-company">${escapeHtml(merchantInfo.companyName || receiptName)}</div>
                            <div class="header-address">${fields.addressHtml}</div>
                        </div>
                    </div>
                    <div class="header-invoice-label">
                        <div class="meta-stack">
                            <div class="meta-line" style="padding-top: 0; padding-bottom: 8px;">
                                <span class="label">Invoice No:</span>
                                <span class="value">${escapeHtml(invoiceNumberToDisplay)}</span>
                            </div>
                            <div class="meta-line" style="border-bottom: none; padding-top: 8px; padding-bottom: 0;">
                                <span class="label">RRN No:</span>
                                <span class="value">${escapeHtml(formatRrnValue(rrnValue))}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="meta-cards">
                <div class="meta-card">
                    <div class="meta-card-label">Name</div>
                    <div class="meta-card-value">${escapeHtml(fields.customerName)}</div>
                </div>
                <div class="meta-card">
                    <div class="meta-card-label">UPI ID</div>
                    <div class="meta-card-value">${escapeHtml(fields.upiId)}</div>
                </div>
                <div class="meta-card">
                    <div class="meta-card-label">Transaction Date</div>
                    <div class="meta-card-value">${escapeHtml(fields.transactionDateOnly)}</div>
                </div>
                <div class="meta-card">
                    <div class="meta-card-label">Transaction Time</div>
                    <div class="meta-card-value">${escapeHtml(fields.transactionTimeOnly)}</div>
                </div>
            </div>

            <div class="content">

                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>DESCRIPTION</th>
                                <th>QTY</th>
                                <th>UNIT PRICE</th>
                                <th>GROSS AMOUNT</th>
                                <th>TAX</th>
                                <th>NET AMOUNT</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${escapeHtml(descriptionText)}</td>
                                <td>1</td>
                                <td>₹ ${escapeHtml(formattedAmount)}</td>
                                <td>₹ ${escapeHtml(formattedAmount)}</td>
                                <td>${taxValue}</td>
                                <td>₹ ${escapeHtml(formattedAmount)}</td>
                            </tr>
                            <tr class="table-total-row">
                                <td colspan="3">TOTAL</td>
                                <td>₹ ${escapeHtml(formattedAmount)}</td>
                                <td>${taxValue}</td>
                                <td>₹ ${escapeHtml(formattedAmount)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style="display: flex; justify-content: center; margin: 32px 0;">
                    <div class="total-line grand-total" style="width: 300px; margin: 0; box-shadow: 0 10px 25px rgba(37, 99, 235, 0.2);">
                        <span class="label">Total Amount</span>
                        <span class="value">₹ ${escapeHtml(totalValue)}</span>
                    </div>
                </div>

                <div class="bottom-section">
                    <div class="terms-box">
                        <div class="section-kicker" style="justify-content: center;">Terms &amp; Conditions</div>
                        <ul class="terms-list">
                            <li>By receiving this receipt, the user confirms that the applicable fees were paid to ${escapeHtml(receiptName)} through the payment gateway and accepts the company's terms related to this transaction.</li>
                            <li>This receipt is issued against the UPI ID through which the payment was collected and verified.</li>
                            <li>This is a computer-generated receipt and does not require a physical seal or signature for validation.</li>
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    </div>
</body>
</html>`;
};
