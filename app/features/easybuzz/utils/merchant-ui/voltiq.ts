import { escapeHtml, formatRrnValue } from "./shared";
import type { MerchantInvoiceRenderContext } from "./types";

const getInitials = (value: string) =>
    String(value || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("") || "CU";

const formatAddressForHtml = (value: string) =>
    escapeHtml(value)
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/\n/g, "<br />");

const simplifyAmountDisplay = (value: string) => {
    const trimmed = String(value || "").trim();
    return trimmed.endsWith(".00") ? trimmed.slice(0, -3) : trimmed;
};

export const renderVoltiqInvoiceHTML = ({
    merchantInfo,
    invoiceNumberToDisplay,
    rrnValue,
    formattedAmount,
    receiptEntityName,
    descriptionText,
    fields,
}: MerchantInvoiceRenderContext) => {
    const brandColor = merchantInfo.themeColor || "#3b9daa";
    const customerName = escapeHtml(fields.customerName);
    const customerInitials = escapeHtml(getInitials(fields.customerName));
    const addressHtml = fields.addressHtml || formatAddressForHtml(merchantInfo.address || "");
    const amountDisplay = escapeHtml(simplifyAmountDisplay(formattedAmount));
    const taxDisplay = "0";

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(formatRrnValue(rrnValue))}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'DM Sans', 'Segoe UI', Arial, sans-serif;
            background: #f0f4f5;
            color: #1a1a1a;
        }

        .inv {
            min-height: 100vh;
            padding: 24px 12px;
        }

        .pg {
            background: #fff;
            width: 100%;
            max-width: 820px;
            min-height: 297mm;
            margin: 0 auto;
            border-radius: 14px;
            padding: 40px 44px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 8px 40px rgba(0,0,0,.1);
        }

        .ds1 {
            position: absolute;
            width: 64px;
            height: 64px;
            background: #c8a97a;
            border-radius: 6px;
            top: -18px;
            right: 64px;
            transform: rotate(20deg);
            opacity: .85;
        }

        .ds2 {
            position: absolute;
            width: 42px;
            height: 42px;
            background: #c8a97a;
            border-radius: 6px;
            bottom: 18px;
            right: -16px;
            transform: rotate(35deg);
            opacity: .75;
        }

        .hdr {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 32px;
            gap: 16px;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 14px;
            min-width: 0;
        }

        .logo-mark {
            width: 160px;
            max-width: 100%;
            max-height: 100px;
            object-fit: contain;
            display: block;
        }

        .logo-fallback {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .dots {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 3px;
            width: 24px;
            flex-shrink: 0;
        }

        .dots span {
            display: block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #1a1a1a;
        }

        .dots span:nth-child(2),
        .dots span:nth-child(3) {
            background: #c8a97a;
        }

        .ltext strong {
            display: block;
            font-size: 14px;
            font-weight: 700;
            color: #1a1a1a;
            line-height: 1.1;
        }

        .ltext small {
            font-size: 10px;
            color: #666;
        }

        .hrgt {
            background: #1a1a1a;
            color: #fff;
            border-radius: 10px;
            padding: 18px 26px;
            min-width: 300px;
        }

        .ititle {
            font-family: 'DM Serif Display', Georgia, serif;
            font-size: 38px;
            font-weight: 400;
            line-height: 1;
            margin-bottom: 12px;
            letter-spacing: -1px;
        }

        .imeta {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
        }

        .mi {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .ml {
            font-size: 10px;
            color: #aaa;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: .5px;
        }

        .mv {
            font-size: 11px;
            color: #fff;
            font-weight: 600;
            word-break: break-word;
        }

        .info-zone {
            display: grid;
            grid-template-columns: 1fr 1px 1fr 1px 1fr;
            gap: 0;
            margin-bottom: 32px;
            align-items: stretch;
            margin-top:20mm;
        }

        .divider-v {
            background: #d0e9ed;
            width: 1px;
            margin: 0 4px;
        }

        .ic-label {
            font-size: 11px;
            font-weight: 700;
            color: ${brandColor};
            text-transform: uppercase;
            letter-spacing: .6px;
        }

        .ic-address {
            padding: 0 20px 0 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
        }

        .ic-address .ic-head {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-bottom: 14px;
        }

        .ic-icon {
            width: 34px;
            height: 34px;
            background: ${brandColor};
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 18px;
            flex-shrink: 0;
        }

        .address-company {
            font-size: 13px;
            font-weight: 700;
            color: #1a1a1a;
            line-height: 1.4;
            margin-bottom: 6px;
            text-align: center;
        }

        .address-lines {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 3px;
            font-size: 11px;
            color: #1a1a1a;
            line-height: 1.5;
            text-align: center;
        }

        .gst-pill {
            display: inline-block;
            margin-top: 10px;
            background: #e8f4f6;
            border: 1px solid #b8d8dc;
            border-radius: 20px;
            padding: 3px 10px;
            font-size: 10px;
            font-weight: 600;
            color: ${brandColor};
            width: fit-content;
            max-width: 100%;
        }

        .ic-customer {
            padding: 0 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 8px;
        }

        .ic-customer .ic-label {
            margin-bottom: 6px;
        }

        .avatar {
            width: 46px;
            height: 46px;
            border-radius: 50%;
            background: #1a1a1a;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            font-weight: 700;
            color: #c8a97a;
            margin-bottom: 6px;
        }

        .cust-name {
            font-size: 15px;
            font-weight: 700;
            color: #1a1a1a;
            line-height: 1.2;
        }

        .cust-badge {
            display: flex;
            align-items: center;
            gap: 5px;
            background: #e8f4f6;
            border-radius: 20px;
            padding: 4px 10px;
            margin-top: 4px;
            max-width: 100%;
            flex-wrap: wrap;
            justify-content: center;
        }

        .cust-badge .cbk {
            font-size: 10px;
            color: ${brandColor};
            font-weight: 600;
        }

        .cust-badge .cbv {
            font-size: 10px;
            color: #1a1a1a;
            font-weight: 500;
            word-break: break-all;
        }

        .ic-txn {
            padding: 0 0 0 20px;
            display: flex;
            flex-direction: column;
        }

        .ic-txn .ic-label {
            margin-bottom: 14px;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .txn-row {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            margin-bottom: 12px;
            position: relative;
        }

        .txn-row:not(:last-child)::after {
            content: '';
            position: absolute;
            left: 12px;
            top: 26px;
            bottom: -12px;
            width: 1px;
            background: #d0e9ed;
        }

        .txn-dot {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: ${brandColor};
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .txn-dot svg {
            width: 12px;
            height: 12px;
            stroke: #fff;
            fill: none;
            stroke-width: 2;
            stroke-linecap: round;
            stroke-linejoin: round;
        }

        .txn-key {
            font-size: 10px;
            color: #888;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: .4px;
        }

        .txn-val {
            font-size: 12px;
            color: #1a1a1a;
            font-weight: 600;
            margin-top: 1px;
            word-break: break-word;
        }

        .stitle {
            font-size: 15px;
            font-weight: 700;
            color: ${brandColor};
            margin-bottom: 12px;
        }

        .tsec {
            margin-bottom: 26px;
            margin-top:20mm;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            border-radius: 10px;
            overflow: hidden;
            table-layout: fixed;
        }

        thead tr {
            background: ${brandColor};
            color: #fff;
        }

        thead th {
            padding: 11px 12px;
            text-align: center;
            font-weight: 600;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: .5px;
            white-space: nowrap;
            overflow: hidden;
        }

        tbody tr {
            border-bottom: 1px solid #e0e0e0;
        }

        tbody td {
            padding: 13px 12px;
            color: #1a1a1a;
            vertical-align: top;
            overflow: hidden;
            text-align: center;
        }

        .dc {
            font-weight: 600;
            text-align: center;
        }
        .nc { font-weight: 700; }

        .totrow td {
            background: #e8f4f6;
            font-weight: 700;
            border-top: 2px solid ${brandColor};
        }

        .tlbl { color: ${brandColor}; }

        .bottom-zone {
            display: grid;
            grid-template-columns: 1fr 260px;
            gap: 20px;
            align-items: start;
            margin-top: 20mm;

        }

        .terms-head {
            font-size: 13px;
            font-weight: 700;
            color: ${brandColor};
            margin-bottom: 10px;
        }

        .terms-stack {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .term-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            background: #f8fbfc;
            border: 1px solid #d0e9ed;
            border-radius: 10px;
            padding: 12px 14px;
        }

        .term-num {
            width: 26px;
            height: 26px;
            border-radius: 50%;
            background: #1a1a1a;
            color: #c8a97a;
            font-size: 11px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            margin-top: 1px;
        }

        .term-text {
            font-size: 11px;
            color: #1a1a1a;
            line-height: 1.6;
        }

        .scard {
            background: #fff;
            border-radius: 10px;
            border: 1px solid #e0e0e0;
            overflow: hidden;
            margin-top: -10mm;
        }

        .srow {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            padding: 11px 16px;
            font-size: 12px;
            border-bottom: 1px solid #e0e0e0;
        }

        .srow:last-child { border-bottom: none; }

        .sfin {
            background: ${brandColor};
            color: #fff;
            font-weight: 700;
            font-size: 14px;
            border-radius: 0 0 10px 10px;
        }

        @media (max-width: 640px) {
            .pg { padding: 28px 18px; }
            .hdr { flex-direction: column; }
            .hrgt { min-width: 100%; }
            .info-zone { grid-template-columns: 1fr; }
            .divider-v { display: none; }
            .ic-address, .ic-customer, .ic-txn {
                padding: 16px 0;
                border-bottom: 1px solid #d0e9ed;
            }
            .bottom-zone { grid-template-columns: 1fr; }
        }

        @media print {
            body { background: #fff; }
            .inv { background: white; padding: 0; min-height: auto; }
            .pg {
                box-shadow: none;
                border-radius: 0;
                max-width: none;
                min-height: 297mm;
            }

            .ds1,
            .ds2,
            .hrgt,
            .divider-v,
            .ic-icon,
            .gst-pill,
            .cust-badge,
            .txn-dot,
            thead tr,
            .totrow td,
            .term-item,
            .term-num,
            .sfin {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }

            .ic-address,
            .ic-customer,
            .ic-txn,
            table,
            thead th,
            tbody td,
            .totrow td,
            .term-item,
            .scard,
            .srow {
                border-color: inherit !important;
            }

            @page {
                size: A4 portrait;
                margin: 0;
            }
        }
    </style>
</head>
<body>
    <div class="inv">
        <div class="pg">
            <div class="ds1"></div>
            <div class="ds2"></div>

            <div class="hdr">
                <div class="logo">
                    <img class="logo-mark" src="${merchantInfo.logoPath}" alt="${escapeHtml(merchantInfo.displayName)} logo" />
                </div>
                <div class="hrgt">
                    <div class="ititle">Invoice</div>
                    <div class="imeta">
                        <div class="mi">
                            <span class="ml">Invoice No.</span>
                            <span class="mv">${escapeHtml(invoiceNumberToDisplay)}</span>
                        </div>
                        <div class="mi">
                            <span class="ml">RRN Number</span>
                            <span class="mv">${escapeHtml(formatRrnValue(rrnValue))}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="info-zone">
                <div class="ic-address">
                    <div class="ic-head">

                        <span class="ic-label">Registered Address</span>
                    </div>
                    <div class="address-company">${escapeHtml(merchantInfo.companyName)}</div>
                    <div class="address-lines">${addressHtml}</div>
                    
                </div>

                <div class="divider-v"></div>

                <div class="ic-customer">
                    <span class="ic-label">Customer Details</span>
                    <p class="cust-name">${customerName}</p>
                    <div class="cust-badge">
                        <span class="cbk">UPI ID :</span>
                        <span class="cbv">${escapeHtml(fields.upiId)}</span>
                    </div>
                </div>

                <div class="divider-v"></div>

                <div class="ic-txn">
                    <span class="ic-label">Transaction Details</span>
                    <div class="txn-row">
                        <div class="txn-dot">
                            <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        </div>
                        <div>
                            <div class="txn-key">Transaction Date</div>
                            <div class="txn-val">${escapeHtml(fields.transactionDateOnly)}</div>
                        </div>
                    </div>
                    <div class="txn-row">
                        <div class="txn-dot">
                            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><polyline points="12 7 12 12 15 15"></polyline></svg>
                        </div>
                        <div>
                            <div class="txn-key">Transaction Time</div>
                            <div class="txn-val">${escapeHtml(fields.transactionTimeOnly)}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="tsec">
                
                <table>
                    <colgroup>
                        <col style="width: 36%;" />
                        <col style="width: 8%;" />
                        <col style="width: 14%;" />
                        <col style="width: 14%;" />
                        <col style="width: 10%;" />
                        <col style="width: 18%;" />
                    </colgroup>
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Qty</th>
                            <th>Unit Price</th>
                            <th>Gross Amount</th>
                            <th>Tax</th>
                            <th>Net Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="dc">${escapeHtml(descriptionText)}</td>
                            <td>1</td>
                            <td>${amountDisplay}</td>
                            <td>${amountDisplay}</td>
                            <td>${taxDisplay}</td>
                            <td class="nc">${amountDisplay}</td>
                        </tr>
                        <tr class="totrow">
                            <td colspan="3"></td>
                            <td class="tlbl">Total</td>
                            <td>${taxDisplay}</td>
                            <td class="nc">${amountDisplay}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="bottom-zone">
                <div>
                    <p class="terms-head">Terms &amp; Conditions</p>
                    <div class="terms-stack">
                        <div class="term-item">
                            <div class="term-num">1</div>
                            <p class="term-text">By receiving this receipt, the user confirms that the applicable fees were paid to ${escapeHtml(receiptEntityName)} through the payment gateway and accepts the company's terms related to this transaction.</p>
                        </div>
                        <div class="term-item">
                            <div class="term-num">2</div>
                            <p class="term-text">This receipt is issued against the UPI ID through which the payment was collected and verified.</p>
                        </div>
                        <div class="term-item">
                            <div class="term-num">3</div>
                            <p class="term-text">This is a computer-generated receipt and does not require a physical seal or signature for validation.</p>
                        </div>
                    </div>
                </div>

                <div>
                    <div class="scard">
                        <div class="srow"><span>Sub Total</span><span>${amountDisplay}</span></div>
                        <div class="srow"><span>Tax</span><span>${taxDisplay}</span></div>
                        <div class="srow sfin"><span>Total</span><span>${amountDisplay}</span></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
};
