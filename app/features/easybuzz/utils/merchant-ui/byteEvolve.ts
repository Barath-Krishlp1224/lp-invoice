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

export const renderByteEvolveInvoiceHTML = ({
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
    <title>${escapeHtml(formatRrnValue(rrnValue))}</title>
    <style>
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        
        body { 
            background: #ebebeb; 
            font-family: "Segoe UI", Arial, sans-serif; 
            color: #1c1c1e; 
        }
        
        .page { 
            width: 100%; 
            max-width: 210mm; 
            margin: 0 auto; 
            min-height: 297mm;
            background: #ffffff;
        }
        
        .inv { 
            background: #ffffff; 
            min-height: 297mm; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.10); 
            display: flex; 
            flex-direction: column;
            position: relative;
        }

        /* ── HEADER ── */
        .hdr {  
            padding: 10mm 12mm; 
            display: flex; 
            align-items: flex-start; 
            justify-content: space-between; 
            border-bottom-left-radius: 18mm; 
            border-bottom-right-radius: 18mm; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact;
            background: linear-gradient(135deg, #f8f9fc 0%, #ffffff 100%);
        }
        
        .hdr-brand { 
            display: flex; 
            align-items: center; 
        }
        
        .logo-img { 
            width: 88mm; 
            max-height: 18mm; 
            object-fit: contain; 
            object-position: left center; 
        }
        
        .hdr-inv { 
            text-align: right; 
        }
        
        .hdr-inv .meta-line { 
            margin-top: 3mm; 
        }
        
        .hdr-inv .meta-label { 
            display: block; 
            font-size: 8.5px; 
            letter-spacing: 0.16em; 
            text-transform: uppercase; 
            color: #727272ff; 
            margin-bottom: 1mm; 
        }
        
        .hdr-inv .meta-value { 
            display: block; 
            font-size: 13px; 
            font-weight: 700; 
            color: #000000ff; 
            line-height: 1.2; 
        }
        
        .hdr-inv .num { 
            display: block; 
            font-size: 13px; 
            font-weight: 700; 
            color: #000000ff; 
            line-height: 1.2; 
        }

        /* ── INFO ROW ── */
        .info-row { 
            width: calc(100% - 18mm); 
            margin: 0 auto 4mm; 
            background: #0f1b33; 
            border: 1px solid #e5e7eb; 
            border-radius: 18px; 
            overflow: hidden; 
        }
        
        .info-company { 
            padding: 5mm 7mm 4mm; 
            text-align: center; 
            border-bottom: 1px solid rgba(229, 231, 235, 0.28); 
        }
        
        .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
        }
        
        .ir-cell { 
            padding: 5mm 7mm; 
            text-align: center; 
        }
        
        /* Left cell (Customer details) - rounded corners on bottom-left */
        .ir-cell:first-child {
            border-right: 1px solid rgba(229, 231, 235, 0.2);
            border-bottom-left-radius: 18px;
        }
        
        /* Right cell (Transaction date & time) - rounded corners on bottom-right */
        .ir-cell:last-child {
            border-bottom-right-radius: 18px;
        }
        
        .ir-label { 
            font-size: 9px; 
            font-weight: 700; 
            letter-spacing: 0.13em; 
            text-transform: uppercase; 
            color: #b8c7e6; 
            margin-bottom: 2mm; 
        }
        
        .ir-val { 
            font-size: 13.5px; 
            font-weight: 600; 
            color: #f8fbff; 
        }
        
        .ir-sub { 
            font-size: 11.5px; 
            color: #d7e0f0; 
            margin-top: 1mm; 
            line-height: 1.6; 
        }
        
        .ir-company-name { 
            font-size: 15px; 
            font-weight: 800; 
            color: #ffffff; 
            margin-bottom: 1.5mm; 
        }
        
        .ir-gst { 
            font-size: 10.5px; 
            font-weight: 700; 
            color: #c8d6f2; 
            margin-top: 1.5mm; 
        }

        /* ── TERMS & CONDITIONS (MOVED UP) ── */
        .btm { 
            width: calc(100% - 18mm); 
            margin: 0 auto 50mm; 
            background: #ffffff; 
            border: 1px solid #e5e7eb; 
            border-radius: 24px 10px 18px 18px; 
            padding: 6mm 7mm;
            break-inside: avoid;
            page-break-inside: avoid;
        }
        
        .btm-note { 
            max-width: 100%; 
            margin: 0 auto; 
            text-align: left; 
        }
        
        .btm-note-title { 
            font-size: 10px; 
            font-weight: 700; 
            letter-spacing: 0.13em; 
            text-transform: uppercase; 
            color: #9ca3af; 
            margin-bottom: 2.5mm; 
        }
        
        .btm-note-list { 
            margin: 0; 
            padding-left: 4.5mm; 
            font-size: 11.5px; 
            color: #6b7280; 
            line-height: 1.7; 
        }
        
        .btm-note-list li { 
            margin-bottom: 2mm;
        }
        
        .btm-note-list li + li { 
            margin-top: 1.5mm; 
        }

        /* ── TABLE ── */
        .tbl-wrap { 
            width: calc(100% - 24mm); 
            margin: 0 auto 0; 
            padding: 4mm 7mm 2mm; 
            background: #ffffff; 
            flex: 1;
        }
        
        .tbl-hdr { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 3mm; 
        }
        
        .tbl-title { 
            font-size: 9px; 
            font-weight: 700; 
            letter-spacing: 0.13em; 
            text-transform: uppercase; 
            color: #9ca3af; 
        }
        
        table { 
            width: 100%; 
            border-collapse: collapse; 
            table-layout: fixed; 
        }
        
        thead tr { 
            border-bottom: 2px solid #0f1b33; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
        }
        
        thead th { 
            font-size: 9.5px; 
            font-weight: 700; 
            letter-spacing: 0.08em; 
            text-transform: uppercase; 
            color: #0f1b33; 
            padding: 3mm 3mm; 
            text-align: center; 
        }
        
        tbody td { 
            font-size: 11px; 
            color: #374151; 
            padding: 3mm 3mm; 
            border-bottom: 1px solid #f3f4f6; 
            vertical-align: middle; 
            text-align: center; 
        }

        tbody td.desc-cell {
            font-size: 12.5px;
            line-height: 1.6;
        }
        
        tbody td.amt { 
            font-family: "Courier New", monospace; 
            color: #111827; 
            white-space: nowrap;
        }
        
        tbody tr.total-row td { 
            font-weight: 700; 
            background: #f9fafb; 
        }
        
        tbody tr:last-child td { 
            border-bottom: none; 
        }

        /* ── FOOTER ── */
        .ftr { 
            background: #0f1b33; 
            padding: 4mm 12mm; 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact;
            margin-top: auto;
            border-radius: 18px 18px 0 0;
        }
        
        .ftr-l { 
            font-size: 10px; 
            color: #d7e0f0; 
        }
        
        .ftr-c { 
            font-size: 9.5px; 
            color: #a9bbdf; 
            font-family: "Courier New", monospace; 
        }
        
        .ftr-r { 
            font-size: 12px; 
            font-weight: 800; 
            color: #f0fdfa; 
            letter-spacing: 0.05em; 
        }

        /* Print styles */
        @media print {
            body { 
                background: #ffffff; 
                margin: 0;
                padding: 0;
            }
            
            .inv { 
                box-shadow: none; 
            }
            
            .hdr, .ftr, .info-row { 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact; 
            }
            
            @page { 
                size: A4 portrait; 
                margin: 0;
            }
            
            .page {
                margin: 0;
                max-width: 100%;
            }
            
            .btm {
                break-inside: avoid;
                page-break-inside: avoid;
            }
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
            .info-grid {
                grid-template-columns: 1fr;
            }
            
            .ir-cell:first-child {
                border-right: none;
                border-bottom: 1px solid rgba(229, 231, 235, 0.2);
                border-bottom-left-radius: 0;
            }
            
            .ir-cell:last-child {
                border-bottom-right-radius: 18px;
                border-bottom-left-radius: 18px;
            }
            
            .ftr {
                flex-direction: column;
                text-align: center;
                gap: 2mm;
            }
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="inv">

            <!-- HEADER -->
            <div class="hdr">
                <div class="hdr-brand">
                    <img class="logo-img" src="${merchantInfo.logoPath}" alt="${escapeHtml(merchantInfo.displayName)} logo" />
                </div>
                <div class="hdr-inv">
                    <div class="meta-line">
                        <span class="meta-label">Invoice No</span>
                        <span class="num">${escapeHtml(invoiceNumberToDisplay)}</span>
                    </div>
                    <div class="meta-line">
                        <span class="meta-label">RRN No</span>
                        <span class="meta-value">${escapeHtml(formatRrnValue(rrnValue))}</span>
                    </div>
                </div>
            </div>

            <!-- INFO ROW -->
            <div class="info-row">
                <div class="info-company">
                    <div class="ir-label">Company details</div>
                    <div class="ir-company-name">${escapeHtml(merchantInfo.companyName)}</div>
                    <div class="ir-sub">${addressHtml}</div>
                    ${gstText ? `<div class="ir-gst">GST: ${escapeHtml(gstText)}</div>` : ""}
                </div>
                <div class="info-grid">
                    <div class="ir-cell">
                        <div class="ir-label">Customer details</div>
                        <div class="ir-val">${escapeHtml(fields.customerName)}</div>
                        <div class="ir-sub">UPI ID: ${escapeHtml(fields.upiId)}</div>
                    </div>
                    <div class="ir-cell">
                        <div class="ir-label">Transaction date &amp; time</div>
                        <div class="ir-val">${escapeHtml(fields.transactionDateOnly)}</div>
                        <div class="ir-sub">${escapeHtml(fields.transactionTimeOnly)}</div>
                    </div>
                </div>
            </div>


            <!-- TABLE -->
            <div class="tbl-wrap">
                <table>
                    <thead>
                        <tr>
                            <th style="width:36%">Description</th>
                            <th style="width:8%">Qty</th>
                            <th style="width:14%">Unit price</th>
                            <th style="width:14%">Gross amount</th>
                            <th style="width:10%">Tax</th>
                            <th style="width:18%">Net amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="desc-cell" style="text-align:left">${escapeHtml(descriptionText)}</td>
                            <td>1</td>
                            <td class="amt">₹ ${escapeHtml(formattedAmount)}</td>
                            <td class="amt">₹ ${escapeHtml(formattedAmount)}</td>
                            <td>0</td>
                            <td class="amt">₹ ${escapeHtml(formattedAmount)}</td>
                        </tr>
                        <tr class="total-row">
                            <td colspan="3" style="text-align:right"><strong>Total</strong></td>
                            <td class="amt"><strong>₹ ${escapeHtml(formattedAmount)}</strong></td>
                            <td><strong>0</strong></td>
                            <td class="amt"><strong>₹ ${escapeHtml(formattedAmount)}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- TERMS & CONDITIONS (MOVED UP - BEFORE TABLE) -->
            <div class="btm">
                <div class="btm-note">
                    <div class="btm-note-title">Terms &amp; Conditions</div>
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