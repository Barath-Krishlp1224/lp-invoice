import { escapeHtml, formatRrnValue } from "./shared";
import type { MerchantInvoiceRenderContext } from "./types";

export const renderBytesSparkzInvoiceHTML = ({
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
    <title>${escapeHtml(formatRrnValue(rrnValue))}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { margin: 0; background: #a3a3a3; color: #3f3f46; font-family: "Segoe UI", Arial, sans-serif; }
        .page { width: 100%; max-width: 210mm; min-height: 297mm; margin: 0 auto; }
        .invoice { position: relative; min-height: 297mm; background: #ffffff; overflow: hidden; box-shadow: 0 18px 44px rgba(15, 23, 42, 0.22); padding: 15mm 12mm 10mm; display: flex; flex-direction: column; }
        .invoice::before { content: none; }

        .header-strip { position: relative; z-index: 2; display: grid; grid-template-columns: 1fr auto; gap: 5mm; align-items: stretch; margin-bottom: 6mm; }
        .top-shell { position: relative; z-index: 1; background: linear-gradient(0deg, #9ea7ae 0%, #7f8a95 8%, #566473 28%, #2c3e50 100%); border-bottom-left-radius: 16mm; border-bottom-right-radius: 16mm; padding: 8mm 9mm 12mm; overflow: hidden; }
        .top-row { display: block; color: #374151; }
        .brand-block { display: flex; align-items: center; justify-content: flex-start; min-height: 18mm; padding: 0; }
        .brand-logo { width: 46mm; max-height: 20mm; object-fit: contain; object-position: left center; display: block; }
        .meta-strip { display: grid; gap: 4mm; }
        .meta-box { min-width: 42mm; min-height: 18mm; border: 1px solid #7f8a95; border-radius: 4mm; padding: 2.8mm 3.5mm; text-align: center;   display: flex; flex-direction: column; justify-content: center; }
        .meta-label { font-size: 8px; line-height: 1.2; letter-spacing: 0.16em; font-weight: 700; text-transform: uppercase; margin-bottom: 1mm; }
        .meta-value { font-size: 11px; line-height: 1.25; font-weight: 800; color: #111827; word-break: break-all; }
        .company-block { color: #ffffff; text-align: center; margin-bottom: 6mm; }
        .company-name { font-size: 18px; line-height: 1.15; letter-spacing: 0.04em; font-weight: 800; margin-bottom: 1.5mm; }
        .company-address { font-size: 10px; line-height: 1.6; color: rgba(255,255,255,0.88); }
        .hero-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; color: #ffffff; align-items: start; }
        .hero-meta { display: grid; grid-template-columns: 1fr; gap: 6mm; }
        .dates { display: grid; grid-template-columns: 1fr; gap: 6mm; }
        .date-box span { display: block; font-size: 11px; color: rgba(255,255,255,0.82); margin-bottom: 1.5mm; }
        .date-box strong { display: block; font-size: 15px; line-height: 1.35; color: #ffffff; text-align: center; }
        .date-box { text-align: center; }
        .table-card { position: relative; z-index: 2; margin: -10mm auto 8mm; width: calc(100% - 24mm); background: rgba(255,255,255,0.94); border: 1px solid #8d99a3; border-radius: 9mm; box-shadow: 0 18px 36px rgba(100, 116, 139, 0.2); overflow: hidden; backdrop-filter: blur(2px); }
        .table-card table { width: 100%; border-collapse: collapse; }
        .table-card thead th { padding: 5mm 3mm; font-size: 10px; font-weight: 700; color: #3f3f46; border-right: 1px solid #c3cad3; text-transform: uppercase; text-align: center; background: #f8fafc; }
        .table-card thead th:last-child { border-right: none; }
        .table-card tbody td { padding: 4.5mm 3mm; font-size: 10.5px; color: #52525b; border-top: 1px solid #d5dce5; text-align: center; }
        .table-card tbody td:first-child { text-align: left; }
        .main-body { position: relative; z-index: 1; padding: 0 7mm; }
        .divider { height: 1px; background: #c3cad3; margin: 4mm 0 6mm; }
        .summary-area { display: flex; justify-content: flex-end; margin-bottom: 8mm; }
        .info-card { border: 1px solid #dfe4ec; border-radius: 5mm; padding: 6mm 5mm; background: rgba(255,255,255,0.92); }
        .info-card h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #3f4b73; margin-bottom: 3mm; }
        .info-card p { font-size: 10.5px; line-height: 1.75; color: #52525b; }
        .terms-list { margin-top: 2mm; padding-left: 4mm; }
        .terms-list li { font-size: 12px; line-height: 1.75; color: #52525b; margin-bottom: 2mm; }
        .summary-panel { width: 100%; max-width: 94mm; }
        .summary-net { display: flex; justify-content: space-between; align-items: center; gap: 4mm; padding: 0 1mm; font-size: 14px; font-weight: 700; color: #475569; margin-bottom: 3mm; }
        .summary-net strong { color: #111827; white-space: nowrap; }
        .total-pill { background: linear-gradient(0deg, #9ea7ae 0%, #6f7a86 10%, #2c3e50 100%); color: #ffffff; display: flex; justify-content: space-between; align-items: center; gap: 4mm; padding: 4.2mm 5mm; border-radius: 4mm; font-size: 12px; font-weight: 800; margin-top: 0; white-space: nowrap; }
        .footer-bar { margin: 0 12mm 0; background: linear-gradient(0deg, #9ea7ae 0%, #6f7a86 10%, #2c3e50 100%); color: #ffffff; border: 1px solid #5f6c79; border-radius: 5mm; padding: 5mm 5mm 4mm; }
        .footer-bar h3 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: #ffffff; margin-bottom: 3mm; }
        .footer-bar .terms-list { margin-top: 0; padding-left: 0; list-style: none; }
        .footer-bar .terms-list li { position: relative; padding-left: 5mm; color: rgba(255,255,255,0.94); line-height: 1.65; margin-bottom: 1.5mm; }
        .footer-bar .terms-list li::before { content: "›"; position: absolute; left: 0; top: 0; font-size: 14px; line-height: 1.2; font-weight: 700; color: #ffffff; }
        @media print {
            body { background: #ffffff; }
            .invoice { box-shadow: none; }
            .top-shell, .table-card, .total-pill, .footer-bar { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page { size: A4 portrait; margin: 0; }
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="invoice">

            <div class="header-strip">
                <div class="top-row">
                    <div class="brand-block">
                        <img class="brand-logo" src="${merchantInfo.logoPath}" alt="${escapeHtml(merchantInfo.displayName)} logo" />
                    </div>
                </div>
                <div class="meta-strip">
                    <div class="meta-box">
                        <div class="meta-label">Invoice Number</div>
                        <div class="meta-value">${escapeHtml(invoiceNumberToDisplay)}</div>
                    </div>
                    <div class="meta-box">
                        <div class="meta-label">RRN Number</div>
                        <div class="meta-value">${escapeHtml(formatRrnValue(rrnValue))}</div>
                    </div>
                </div>
            </div>
            <section class="top-shell">
                <div class="company-block">
                    <div class="company-name">${escapeHtml(merchantInfo.companyName)}</div>
                    <div class="company-address">${fields.addressHtml}</div>
                </div>
                <div class="hero-row">
                    <div class="hero-meta">
                        <div class="date-box">
                            <span>Name</span>
                            <strong>${fields.customerName}</strong>
                        </div>
                        <div class="date-box">
                            <span>UPI ID</span>
                            <strong>${fields.upiId}</strong>
                        </div>
                    </div>
                    <div class="dates">
                        <div class="date-box">
                            <span>Transaction Date</span>
                            <strong>${fields.transactionDateOnly}</strong>
                        </div>
                        <div class="date-box">
                            <span>Transaction Time</span>
                            <strong>${fields.transactionTimeOnly}</strong>
                        </div>
                    </div>
                </div>
            </section>
            <section class="table-card">
                <table>
                    <thead>
                        <tr>
                            <th style="width: 28%;">Description</th>
                            <th style="width: 10%;">Qty</th>
                            <th style="width: 15%;">Unit Price</th>
                            <th style="width: 15%;">Gross Amount</th>
                            <th style="width: 12%;">Tax</th>
                            <th style="width: 20%;">Net Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${escapeHtml(descriptionText)}</td>
                            <td>1</td>
                            <td>₹ ${formattedAmount}</td>
                            <td>₹ ${formattedAmount}</td>
                            <td>-</td>
                            <td>₹ ${formattedAmount}</td>
                        </tr>
                        <tr>
                            <td colspan="3" style="text-align: center; font-weight: 800;">Total</td>
                            <td>₹ ${formattedAmount}</td>
                            <td>0</td>
                            <td>₹ ${formattedAmount}</td>
                        </tr>
                    </tbody>
                </table>
            </section>
            <div class="main-body">
                <div class="divider"></div>
                <section class="summary-area">
                    <div class="summary-panel">
                        <div class="summary-net"><span>Total Amount</span><strong>₹ ${formattedAmount}</strong></div>
                        
                    </div>
                </section>
            </div>
            <div class="footer-bar">
                <h3>Terms & Conditions</h3>
                <ul class="terms-list">
                    <li>By receiving this receipt, the user confirms that the applicable fees were paid to ${escapeHtml(receiptEntityName)} through the payment gateway and accepts the company's terms related to this transaction.</li>
                    <li>This receipt is issued against the UPI ID through which the payment was collected and verified.</li>
                    <li>This is a computer-generated receipt and does not require a physical seal or signature for validation.</li>
                </ul>
            </div>
        </div>
    </div>
</body>
</html>`;
