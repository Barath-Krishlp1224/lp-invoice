import { escapeHtml } from "./shared";
import type { MerchantInvoiceRenderContext } from "./types";

export const renderByteEvolveInvoiceHTML = ({
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
    <title>${escapeHtml(rrnValue)}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { margin: 0; background: #d8d8d8; color: #3f3f46; font-family: "Segoe UI", Arial, sans-serif; }
        .page { width: 100%; max-width: 210mm; margin: 0 auto; min-height: 297mm; padding: 0; }
        .invoice { position: relative; min-height: 297mm; background: #ffffff; overflow: hidden; box-shadow: 0 14px 40px rgba(17, 24, 39, 0.18); padding: 14mm 12mm 12mm; }
        .invoice::before { content: ""; position: absolute; inset: 0; background: linear-gradient(132deg, transparent 0 38%, rgba(244, 232, 232, 0.85) 38%, rgba(244, 232, 232, 0.85) 62%, transparent 62%); pointer-events: none; }
        .top-meta, .summary-wrap, .footer, table, .hero { position: relative; z-index: 1; }
        .top-meta { display: flex; justify-content: flex-end; margin-bottom: 12mm; font-size: 10px; color: #6b7280; line-height: 1.7; text-align: right; }
        .hero { margin-bottom: 10mm; }
        .invoice-title { display: inline-block; background: linear-gradient(90deg, #ef7b6f, #d64e48); color: #ffffff; font-size: 25px; font-weight: 300; letter-spacing: 0.05em; padding: 2mm 10mm 2mm 5mm; margin-bottom: 7mm; }
        .invoice-title strong, .thanks strong { font-weight: 800; color: #ffffff; }
        .bill-grid { display: grid; grid-template-columns: 1fr 0.95fr; gap: 12mm; align-items: start; }
        .bill-to h3, .summary h3, .meta-block h3, .payments h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: #991b1b; margin-bottom: 3mm; }
        .bill-to p, .meta-block p, .payments p { font-size: 10.5px; line-height: 1.75; color: #52525b; }
        .logo { width: 34mm; max-height: 18mm; object-fit: contain; object-position: left center; margin-bottom: 4mm; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 10mm; }
        thead th { background: #b91c1c; color: #ffffff; padding: 3.4mm 3mm; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; text-align: left; }
        tbody td { border-bottom: 1px solid #e5e7eb; padding: 3.6mm 3mm; font-size: 10.5px; color: #52525b; }
        tbody tr:last-child td { border-bottom: 1px solid #d4d4d8; }
        .summary-wrap { display: grid; grid-template-columns: 1fr 0.82fr; gap: 12mm; margin-bottom: 10mm; }
        .meta-block { align-self: end; }
        .summary { justify-self: end; width: 100%; max-width: 72mm; }
        .summary-line { display: flex; justify-content: space-between; gap: 4mm; font-size: 11px; color: #3f3f46; padding: 1.8mm 0; }
        .summary-line.total { margin-top: 1mm; font-size: 14px; font-weight: 800; color: #18181b; }
        .amount-due { margin-top: 4mm; background: #b91c1c; color: #ffffff; display: flex; justify-content: space-between; gap: 4mm; padding: 3.6mm 4mm; font-size: 12px; font-weight: 800; }
        .footer { display: grid; grid-template-columns: 0.9fr 1.1fr; gap: 12mm; align-items: end; margin-top: 10mm; }
        .payments ul { margin-top: 3mm; padding-left: 4mm; color: #52525b; font-size: 10.5px; line-height: 1.8; }
        .thanks { justify-self: end; align-self: end; background: linear-gradient(90deg, #ef7b6f, #d64e48); color: #ffffff; font-size: 22px; font-weight: 300; letter-spacing: 0.05em; padding: 2mm 7mm 2mm 5mm; }
        @media print {
            body { background: #ffffff; }
            .invoice { box-shadow: none; }
            .invoice::before, .invoice-title, .amount-due, .thanks, thead th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page { size: A4 portrait; margin: 0; }
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="invoice">
            <div class="top-meta">
                <div>
                    ${escapeHtml(merchantInfo.companyName)}<br/>
                    ${fields.addressHtml}
                </div>
            </div>
            <section class="hero">
                <div class="invoice-title">INVOICE<strong>#${escapeHtml(invoiceNumberToDisplay)}</strong></div>
                <div class="bill-grid">
                    <div class="bill-to">
                        <h3>To</h3>
                        <img class="logo" src="${merchantInfo.logoPath}" alt="${escapeHtml(merchantInfo.displayName)} logo" />
                        <p>
                            <strong>${fields.customerName}</strong><br/>
                            UPI ID: ${fields.upiId}<br/>
                            Transaction Date: ${fields.transactionDate}<br/>
                            Reference No: ${escapeHtml(rrnValue)}
                        </p>
                    </div>
                    <div class="meta-block">
                        <h3>Invoice From</h3>
                        <p>
                            ${escapeHtml(merchantInfo.companyName)}<br/>
                            ${fields.addressHtml}<br/>
                            Received by ${escapeHtml(receiptEntityName)}
                        </p>
                    </div>
                </div>
            </section>
            <table>
                <thead>
                    <tr>
                        <th style="width: 7%;">Item</th>
                        <th style="width: 39%;">Description</th>
                        <th style="width: 12%;">Qty</th>
                        <th style="width: 14%;">Price</th>
                        <th style="width: 12%;">Discount</th>
                        <th style="width: 8%;">Tax</th>
                        <th style="width: 18%;">Ln. Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>1</td>
                        <td>${escapeHtml(descriptionText)}</td>
                        <td>1</td>
                        <td>₹ ${formattedAmount}</td>
                        <td>0%</td>
                        <td>0%</td>
                        <td>₹ ${formattedAmount}</td>
                    </tr>
                    <tr>
                        <td>2</td>
                        <td>Settlement reference ${escapeHtml(rrnValue)}</td>
                        <td>1</td>
                        <td>₹ 0.00</td>
                        <td>0%</td>
                        <td>0%</td>
                        <td>₹ 0.00</td>
                    </tr>
                    <tr>
                        <td>3</td>
                        <td>Invoice record ${escapeHtml(invoiceNumberToDisplay)}</td>
                        <td>1</td>
                        <td>₹ 0.00</td>
                        <td>0%</td>
                        <td>0%</td>
                        <td>₹ 0.00</td>
                    </tr>
                </tbody>
            </table>
            <section class="summary-wrap">
                <div class="meta-block">
                    <h3>Issued Details</h3>
                    <p>
                        Issued on: ${fields.transactionDate}<br/>
                        Due on: ${fields.transactionDate}<br/>
                        Currency: INR<br/>
                        P.O. #: ${escapeHtml(rrnValue)}<br/>
                        Ref: ${escapeHtml(invoiceNumberToDisplay)}
                    </p>
                </div>
                <div class="summary">
                    <h3>Summary</h3>
                    <div class="summary-line"><span>Subtotal</span><strong>₹ ${formattedAmount}</strong></div>
                    <div class="summary-line"><span>Tax 1</span><strong>₹ 0.00</strong></div>
                    <div class="summary-line"><span>Tax 2</span><strong>₹ 0.00</strong></div>
                    <div class="summary-line total"><span>Total</span><strong>₹ ${formattedAmount}</strong></div>
                    <div class="summary-line"><span>Paid</span><strong>₹ 0.00</strong></div>
                    <div class="amount-due"><span>Amount Due:</span><span>₹ ${formattedAmount}</span></div>
                </div>
            </section>
            <section class="footer">
                <div class="payments">
                    <h3>Payment Details</h3>
                    <p>Thank you very much. We really appreciate your business. Please send payments before the due date.</p>
                    <ul>
                        <li>Reference: ${escapeHtml(rrnValue)}</li>
                        <li>Beneficiary: ${escapeHtml(receiptEntityName)}</li>
                        <li>Merchant: ${escapeHtml(merchantInfo.displayName)}</li>
                    </ul>
                </div>
                <div class="thanks">THANKS<strong>!</strong></div>
            </section>
        </div>
    </div>
</body>
</html>`;

