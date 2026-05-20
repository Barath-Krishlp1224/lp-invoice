import { escapeHtml } from "./shared";
import type { MerchantInvoiceRenderContext } from "./types";

export const renderByteBlissInvoiceHTML = ({
    merchantInfo,
    invoiceNumberToDisplay,
    rrnValue,
    formattedAmount,
    descriptionText,
    receiptEntityName,
    fields,
}: MerchantInvoiceRenderContext) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(rrnValue)}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { margin: 0; background: #edf0f7; color: #1f2937; font-family: "Segoe UI", Arial, sans-serif; }
        .page { width: 100%; max-width: 210mm; margin: 0 auto; min-height: 297mm; padding: 4mm 0; }
        .invoice { position: relative; min-height: 289mm; background: #ffffff; overflow: hidden; box-shadow: 0 18px 48px rgba(32, 25, 75, 0.14); border-radius: 8mm; }
        .top-band { position: relative; height: 30mm; background: linear-gradient(90deg, #232134 0 43%, #6a2fff 43%, #8b3dff 100%); clip-path: polygon(0 0, 100% 0, 100% 100%, 52% 100%, 44% 58%, 0 58%); border-radius: 8mm 8mm 0 0; }
        .top-band::after { content: ""; position: absolute; top: 10mm; right: 0; width: 40mm; height: 50mm; background: linear-gradient(180deg, #7f37ff, #5b1dca); clip-path: polygon(18% 0, 100% 0, 100% 100%, 0 100%); opacity: 0.96; border-radius: 0 0 0 8mm; }
        .content { position: relative; z-index: 1; padding: 13mm 10mm 10mm; margin-top: -18mm; }
        .hero { display: flex; justify-content: space-between; align-items: center; gap: 8mm; margin-bottom: 7mm; }
        .brand { display: flex; align-items: center; }
        .brand img { width: 34mm; max-height: 18mm; object-fit: contain; object-position: left center; }
        .invoice-meta { display: flex; justify-content: flex-end; align-items: center; gap: 6mm; text-align: right; flex-wrap: wrap; }
        .meta-line { font-size: 11px; color: #4b5563; margin-bottom: 0; white-space: nowrap; }
        .meta-line strong { color: #111827; }
        .section-heading { text-align: center; font-size: 15px; font-weight: 800; color: #1f2937; margin: 5mm 0 3mm; }
        .customer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; margin-bottom: 4mm; }
        .customer-box { border: 1px solid #ebe8f8; border-radius: 4mm; overflow: hidden; background: #ffffff; }
        .customer-box-title { background: linear-gradient(90deg, #6d28d9, #8b3dff); color: #ffffff; font-size: 11px; font-weight: 700; text-align: center; padding: 3mm 2.5mm; }
        .customer-box-body { padding: 2mm 0; }
        .customer-line { display: grid; grid-template-columns: 0.9fr 1.1fr; gap: 3mm; align-items: start; padding: 2.6mm 3mm; font-size: 10px; line-height: 1.45; color: #4b5563; }
        .customer-line + .customer-line { border-top: 1px solid #f0ecfb; }
        .customer-line span { font-weight: 700; color: #374151; }
        .customer-line strong { font-weight: 600; color: #4b5563; text-align: right; word-break: break-word; }
        .terms li,
        td:first-child { word-break: break-word; }
        .journey-grid { margin-bottom: 5mm; border-radius: 4mm; overflow: hidden; }
        .bottom-grid { display: flex; justify-content: flex-end; align-items: flex-start; gap: 8mm; margin-bottom: 4mm; }
        .terms { flex: 1; margin-right: 10mm; }
        .terms h3 { font-size: 15px; font-weight: 800; color: #111827; margin-bottom: 2mm; }
        .terms ul { list-style: none; display: grid; gap: 1.8mm; }
        .terms li { position: relative; padding-left: 5mm; font-size: 10px; line-height: 1.5; color: #4b5563; text-align: left; }
        .terms li::before { content: ""; position: absolute; top: 1.7mm; left: 0; width: 2mm; height: 2mm; border-radius: 50%; background: #6d28d9; }
        .amount-card { width: 100%; max-width: 62mm; }
        .amount-total { background: linear-gradient(90deg, #6d28d9, #8b3dff); color: #ffffff; display: flex; justify-content: space-between; align-items: center; gap: 4mm; padding: 3.5mm 4.5mm; font-size: 12px; font-weight: 800; border-radius: 4mm; white-space: nowrap; }
        table { width: 100%; border-collapse: collapse; overflow: hidden; border-radius: 4mm; }
        th { background: linear-gradient(90deg, #6d28d9, #8b3dff); color: #ffffff; text-align: left; padding: 3mm 2.5mm; font-size: 10px; font-weight: 700; }
        td { border: 1px solid #eceff4; padding: 3mm 2.5mm; font-size: 10px; color: #4b5563; text-align: center; }
        td:first-child,
        th:first-child { text-align: left; }
        .net-amount-cell { white-space: nowrap; }
        @media print {
            body { background: #ffffff; }
            .invoice { box-shadow: none; }
            .top-band, .top-band::after, .customer-box-title, th, .amount-total { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page { size: A4 portrait; margin: 0; }
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="invoice">
            <div class="top-band"></div>
            <div class="content">
                <section class="hero">
                    <div class="brand">
                        <img src="${merchantInfo.logoPath}" alt="${escapeHtml(merchantInfo.displayName)} logo" />
                    </div>
                    <div class="invoice-meta">
                        <div class="meta-line"><strong>Invoice No:</strong> ${escapeHtml(invoiceNumberToDisplay)}</div>
                        <div class="meta-line"><strong>RRN No:</strong> ${escapeHtml(rrnValue)}</div>
                    </div>
                </section>
                <div class="section-heading">Customer Details:</div>
                <div class="customer-grid">
                    <div class="customer-box">
                        <div class="customer-box-title">Left</div>
                        <div class="customer-box-body">
                            <div class="customer-line"><span>Name</span><strong>${fields.customerName}</strong></div>
                            <div class="customer-line"><span>UPI ID</span><strong>${fields.upiId}</strong></div>
                        </div>
                    </div>
                    <div class="customer-box">
                        <div class="customer-box-title">Right</div>
                        <div class="customer-box-body">
                            <div class="customer-line"><span>Date</span><strong>${fields.transactionDateOnly}</strong></div>
                            <div class="customer-line"><span>Time</span><strong>${fields.transactionTimeOnly}</strong></div>
                            <div class="customer-line"><span>Address</span><strong>${fields.addressHtml}</strong></div>
                        </div>
                    </div>
                </div>
                <div class="journey-grid">
                    <table>
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
                                <td>${escapeHtml(descriptionText)}</td>
                                <td>1</td>
                                <td>₹ ${formattedAmount}</td>
                                <td>₹ ${formattedAmount}</td>
                                <td>-</td>
                                <td class="net-amount-cell">₹ ${formattedAmount}</td>
                            </tr>
                            <tr style="background: #f9fafb;">
                                <td colspan="3" style="font-weight: 900; text-align: right;">Total</td>
                                <td>-</td>
                                <td>-</td>
                                <td class="net-amount-cell" style="font-weight: 900;">₹ ${formattedAmount}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <section class="bottom-grid">
                    <div class="terms">
                        <h3>Terms & Conditions</h3>
                        <ul>
                            <li>By receiving this receipt, the user confirms that the applicable fees were paid to ${escapeHtml(receiptEntityName)} through the payment gateway and accepts the company's terms related to this transaction.</li>
                            <li>This receipt is issued against the UPI ID through which the payment was collected and verified.</li>
                            <li>This is a computer-generated receipt and does not require a physical seal or signature for validation.</li>
                        </ul>
                    </div>
                    <div class="amount-card">
                        <div class="amount-total">
                            <span>Total Amount:</span>
                            <span>₹ ${formattedAmount}</span>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    </div>
</body>
</html>`;
