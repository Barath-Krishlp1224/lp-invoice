import type { MerchantInvoiceRenderContext } from "./types";

const hexToRgba = (hex: string, alpha: number) => {
    const normalized = String(hex || "").replace("#", "");
    const value = normalized.length === 3
        ? normalized.split("").map((char) => char + char).join("")
        : normalized;
    const int = parseInt(value, 16);
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const escapeHtml = (value: unknown) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const formatRrnValue = (value: unknown) => {
    const normalized = String(value ?? "").trim();

    if (!/^\d+$/.test(normalized)) {
        return normalized;
    }

    return normalized.length >= 12 ? normalized : normalized.padStart(12, "0");
};

const merchantDesigns: Record<string, any> = {
    sparkleap: {
        accent: "#1f4b99",
        accentTwo: "#5d8af0",
        ink: "#163052",
        fontBody: "'Segoe UI', Arial, sans-serif",
        fontDisplay: "'Segoe UI', Arial, sans-serif",
    },
    apextech: {
        accent: "#1f4b99",
        accentTwo: "#7ba4ff",
        ink: "#162b4d",
        fontBody: "'Segoe UI', Arial, sans-serif",
        fontDisplay: "'Segoe UI', Arial, sans-serif",
    },
    bytes_napse: {
        accent: "#1e7c4f",
        accentTwo: "#85cfa9",
        ink: "#1d4330",
        fontBody: "'Trebuchet MS', Verdana, sans-serif",
        fontDisplay: "'Trebuchet MS', Verdana, sans-serif",
    },
    bytes_sparkz: {
        accent: "#172554",
        accentTwo: "#c7a95c",
        ink: "#1f2937",
        fontBody: "Georgia, 'Times New Roman', serif",
        fontDisplay: "Georgia, 'Times New Roman', serif",
    },
    byte_bliss: {
        accent: "#0f766e",
        accentTwo: "#81d4cc",
        ink: "#164e4a",
        fontBody: "'Century Gothic', Verdana, sans-serif",
        fontDisplay: "'Century Gothic', Verdana, sans-serif",
    },
    byteevolve: {
        accent: "#4f7ca6",
        accentTwo: "#b4cce2",
        ink: "#27435c",
        fontBody: "'Segoe UI', Arial, sans-serif",
        fontDisplay: "'Segoe UI', Arial, sans-serif",
    },
    cipher_byte: {
        accent: "#0f766e",
        accentTwo: "#81d4cc",
        ink: "#134e4a",
        fontBody: "Tahoma, Geneva, sans-serif",
        fontDisplay: "Tahoma, Geneva, sans-serif",
    },
    code_horizon: {
        accent: "#0f8ea5",
        accentTwo: "#8edeea",
        ink: "#0c5160",
        fontBody: "'Arial Narrow', Arial, sans-serif",
        fontDisplay: "'Arial Narrow', Arial, sans-serif",
    },
    logic_nook: {
        accent: "#6f42c1",
        accentTwo: "#b9a0eb",
        ink: "#362056",
        fontBody: "'Gill Sans', 'Trebuchet MS', sans-serif",
        fontDisplay: "'Gill Sans', 'Trebuchet MS', sans-serif",
    },
    novalogic: {
        accent: "#b85f77",
        accentTwo: "#ecc3cf",
        ink: "#6f3145",
        fontBody: "'Palatino Linotype', 'Book Antiqua', serif",
        fontDisplay: "'Palatino Linotype', 'Book Antiqua', serif",
    },
    orionbyte: {
        accent: "#3249a8",
        accentTwo: "#99a8ed",
        ink: "#1e2a63",
        fontBody: "'Franklin Gothic Medium', Arial, sans-serif",
        fontDisplay: "'Franklin Gothic Medium', Arial, sans-serif",
    },
    shadaus: {
        accent: "#7a2734",
        accentTwo: "#d7a1ae",
        ink: "#4a1a21",
        fontBody: "Cambria, Georgia, serif",
        fontDisplay: "Cambria, Georgia, serif",
    },
    techterra: {
        accent: "#c96b18",
        accentTwo: "#f7c68f",
        ink: "#6b3d0f",
        fontBody: "'Lucida Sans', Arial, sans-serif",
        fontDisplay: "'Lucida Sans', Arial, sans-serif",
    },
    voltiq: {
        accent: "#0f8ea5",
        accentTwo: "#8edeea",
        ink: "#0c5160",
        fontBody: "'Helvetica Neue', Arial, sans-serif",
        fontDisplay: "'Helvetica Neue', Arial, sans-serif",
    },
    zoving_business: {
        accent: "#6d7f22",
        accentTwo: "#cbd8a0",
        ink: "#414d16",
        fontBody: "Verdana, Geneva, sans-serif",
        fontDisplay: "Verdana, Geneva, sans-serif",
    },
};

const getDesign = (merchantKey: string) => {
    const base = merchantDesigns[merchantKey] || merchantDesigns.sparkleap;

    return {
        ...base,
        soft: hexToRgba(base.accent, 0.08),
        softStrong: hexToRgba(base.accent, 0.16),
        border: hexToRgba(base.accent, 0.22),
        shadow: hexToRgba(base.accent, 0.14),
    };
};

export const renderGenericMerchantInvoiceHTML = (
    merchantKey: string,
    {
        merchantInfo,
        invoiceNumberToDisplay,
        rrnValue,
        formattedAmount,
        receiptEntityName,
        descriptionText,
        fields,
    }: MerchantInvoiceRenderContext
) => {
    const design = getDesign(merchantKey);
    const showSplitDateTime = merchantKey === "apextech";
    const taxValue = merchantKey === "apextech" ? "-" : "₹ 0.00";
    const totalColspan = merchantKey === "apextech" ? 4 : 3;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(formatRrnValue(rrnValue))}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
            --accent: ${design.accent};
            --accent-two: ${design.accentTwo};
            --ink: ${design.ink};
            --soft: ${design.soft};
            --soft-strong: ${design.softStrong};
            --border: ${design.border};
            --shadow: ${design.shadow};
            --body-font: ${design.fontBody};
            --display-font: ${design.fontDisplay};
        }
        body {
            margin: 0;
            background: #f6f8fc;
            color: var(--ink);
            font-family: var(--body-font);
        }
        .page {
            width: 100%;
            max-width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 0;
        }
        .invoice {
            min-height: 297mm;
            background: #ffffff;
            border: 1px solid #e8edf5;
            box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
            overflow: hidden;
        }
        .hero {
            position: relative;
            padding: 14mm 12mm 10mm;
            background:
                radial-gradient(circle at top right, ${design.softStrong} 0, transparent 28%),
                linear-gradient(135deg, #ffffff 0, ${design.soft} 100%);
        }
        .hero::after {
            content: "";
            position: absolute;
            right: -18mm;
            top: -18mm;
            width: 52mm;
            height: 52mm;
            border-radius: 50%;
            background: ${design.softStrong};
            opacity: 0.55;
        }
        .hero-row {
            position: relative;
            z-index: 1;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 8mm;
        }
        .brand {
            display: flex;
            align-items: center;
            gap: 5mm;
        }
        .brand img {
            width: 34mm;
            max-height: 18mm;
            object-fit: contain;
        }
        .brand-copy h1 {
            font-family: var(--display-font);
            font-size: 19px;
            line-height: 1.2;
            color: var(--ink);
        }
        .brand-copy p {
            font-size: 10px;
            line-height: 1.65;
            color: #64748b;
            margin-top: 1.5mm;
        }
        .meta-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(38mm, 1fr));
            gap: 3mm;
        }
        .meta-card {
            border: 1px solid var(--border);
            background: rgba(255,255,255,0.92);
            border-radius: 14px;
            padding: 3.5mm 4mm;
            box-shadow: 0 6px 18px var(--shadow);
        }
        .meta-label {
            font-size: 8.5px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            font-weight: 700;
            margin-bottom: 1.5mm;
        }
        .meta-value {
            font-size: 11px;
            color: var(--ink);
            font-weight: 800;
            word-break: break-all;
        }
        .content {
            padding: 0 12mm 12mm;
        }
        .details-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 4mm;
            margin-top: -4mm;
            position: relative;
            z-index: 1;
            margin-bottom: 7mm;
        }
        .detail-card {
            border: 1px solid #e7ebf2;
            border-radius: 16px;
            background: #ffffff;
            padding: 5mm;
            box-shadow: 0 10px 20px rgba(15, 23, 42, 0.04);
        }
        .detail-card--accent {
            background: linear-gradient(180deg, #ffffff, var(--soft));
        }
        .section-title {
            font-family: var(--display-font);
            font-size: 14px;
            color: var(--ink);
            margin-bottom: 3mm;
        }
        .address-copy,
        .detail-list,
        .terms-list li {
            font-size: 10.5px;
            line-height: 1.7;
            color: #475569;
        }
        .detail-list {
            display: grid;
            gap: 2.5mm;
        }
        .detail-line {
            display: flex;
            justify-content: space-between;
            gap: 4mm;
            border-bottom: 1px solid #eef2f7;
            padding-bottom: 2mm;
        }
        .detail-line:last-child {
            border-bottom: none;
            padding-bottom: 0;
        }
        .detail-line span {
            color: #64748b;
            font-weight: 700;
        }
        .detail-line strong {
            color: var(--ink);
            font-weight: 800;
            text-align: right;
        }
        .table-title {
            font-family: var(--display-font);
            font-size: 15px;
            color: var(--ink);
            margin: 0 0 3mm;
        }
        .table-shell {
            border: 1px solid #e7ebf2;
            border-radius: 18px;
            overflow: hidden;
            background: #ffffff;
            margin-bottom: 7mm;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        thead th {
            background: linear-gradient(90deg, var(--accent), var(--accent-two));
            color: #ffffff;
            padding: 4mm 3mm;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            font-weight: 700;
            text-align: center;
        }
        tbody td {
            border-bottom: 1px solid #eef2f7;
            padding: 4mm 3mm;
            font-size: 10.5px;
            color: #475569;
            text-align: center;
            font-weight: 700;
        }
        tbody tr:last-child td {
            border-bottom: none;
        }
        td.align-left,
        .align-left {
            text-align: left;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: 1.2fr 0.85fr;
            gap: 5mm;
            margin-bottom: 7mm;
        }
        .terms-card,
        .amount-card {
            border: 1px solid #e7ebf2;
            border-radius: 18px;
            background: #ffffff;
            padding: 5mm;
        }
        .terms-card {
            background: linear-gradient(180deg, #ffffff, var(--soft));
        }
        .terms-list {
            list-style: none;
            display: grid;
            gap: 2.5mm;
        }
        .terms-list li {
            position: relative;
            padding-left: 5mm;
        }
        .terms-list li::before {
            content: "";
            position: absolute;
            left: 0;
            top: 1.7mm;
            width: 2mm;
            height: 2mm;
            border-radius: 50%;
            background: var(--accent);
        }
        .amount-line {
            display: flex;
            justify-content: space-between;
            gap: 4mm;
            padding: 2.2mm 0;
            font-size: 11px;
            color: #475569;
            border-bottom: 1px solid #eef2f7;
        }
        .amount-line:last-of-type {
            border-bottom: none;
        }
        .amount-line strong {
            color: var(--ink);
            font-weight: 900;
        }
        .amount-total {
            margin-top: 4mm;
            background: linear-gradient(90deg, var(--accent), var(--accent-two));
            color: #ffffff;
            padding: 4mm 5mm;
            border-radius: 14px;
            display: flex;
            justify-content: space-between;
            gap: 4mm;
            font-size: 13px;
            font-weight: 900;
        }
        .payment-title {
            font-family: var(--display-font);
            font-size: 15px;
            color: var(--ink);
            margin: 0 0 3mm;
        }
        @media print {
            body { background: #ffffff; }
            .invoice { box-shadow: none; border: none; }
            .hero, thead th, .amount-total {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .hero::after,
            .meta-card,
            .detail-card,
            .terms-card,
            .amount-card {
                box-shadow: none !important;
                background: #ffffff !important;
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
            <section class="hero">
                <div class="hero-row">
                    <div class="brand">
                        <img src="${merchantInfo.logoPath}" alt="${escapeHtml(merchantInfo.displayName)} logo" />
                        <div class="brand-copy">
                            <h1>${escapeHtml(merchantInfo.companyName)}</h1>
                            <p>${fields.addressHtml}</p>
                        </div>
                    </div>
                    <div class="meta-grid">
                        <div class="meta-card">
                            <div class="meta-label">Invoice Number</div>
                            <div class="meta-value">${escapeHtml(invoiceNumberToDisplay)}</div>
                        </div>
                        <div class="meta-card">
                            <div class="meta-label">RRN Number</div>
                            <div class="meta-value">${escapeHtml(formatRrnValue(rrnValue))}</div>
                        </div>
                    </div>
                </div>
            </section>
            <div class="content">
                <section class="details-grid">
                    <div class="detail-card detail-card--accent">
                        <h2 class="section-title">Registered Address</h2>
                        <div class="address-copy">${fields.addressHtml}</div>
                    </div>
                    <div class="detail-card">
                        <h2 class="section-title">Customer Details</h2>
                        <div class="detail-list">
                            <div class="detail-line"><span>Name</span><strong>${fields.customerName}</strong></div>
                            <div class="detail-line"><span>UPI ID</span><strong>${fields.upiId}</strong></div>
                        </div>
                    </div>
                    <div class="detail-card">
                        <h2 class="section-title">Transaction Details</h2>
                        <div class="detail-list">
                            ${showSplitDateTime
                                ? `
                            <div class="detail-line"><span>Date</span><strong>${fields.transactionDateOnly}</strong></div>
                            <div class="detail-line"><span>Time</span><strong>${fields.transactionTimeOnly}</strong></div>
                                `
                                : `
                            <div class="detail-line"><span>Date</span><strong>${fields.transactionDate}</strong></div>
                            <div class="detail-line"><span>RRN Number</span><strong>${escapeHtml(formatRrnValue(fields.rrnValue))}</strong></div>
                                `}
                        </div>
                    </div>
                </section>

                <h2 class="table-title">Transaction Details</h2>
                <div class="table-shell">
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
                                <td class="align-left">${escapeHtml(descriptionText)}</td>
                                <td>1</td>
                                <td>₹ ${formattedAmount}</td>
                                <td>₹ ${formattedAmount}</td>
                                <td>${taxValue}</td>
                                <td>₹ ${formattedAmount}</td>
                            </tr>
                            <tr>
                                <td colspan="${totalColspan}" style="font-weight: 900; text-align: right;">Total</td>
                                ${merchantKey === "apextech" ? "" : `<td>₹ ${formattedAmount}</td>`}
                                <td>${taxValue}</td>
                                <td>₹ ${formattedAmount}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <section class="summary-grid">
                    <div class="terms-card">
                        <h2 class="section-title">Terms & Conditions</h2>
                        <ul class="terms-list">
                            <li>By receiving this receipt, the user confirms that the applicable fees were paid to ${escapeHtml(receiptEntityName)} through the payment gateway and accepts the company's terms related to this transaction.</li>
                            <li>This receipt is issued against the UPI ID through which the payment was collected and verified.</li>
                            <li>This is a computer-generated receipt and does not require a physical seal or signature for validation.</li>
                        </ul>
                    </div>
                    <div class="amount-card">
                        <div class="amount-line"><span>Sub Total</span><strong>₹ ${formattedAmount}</strong></div>
                        <div class="amount-line"><span>Tax</span><strong>${taxValue}</strong></div>
                        <div class="amount-total"><span>Total</span><span>₹ ${formattedAmount}</span></div>
                    </div>
                </section>

                <h2 class="payment-title">Payment Details</h2>
                <div class="table-shell">
                    <table>
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Date</th>
                                <th>Transaction ID</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="align-left">${escapeHtml(descriptionText)}</td>
                                <td>${fields.transactionDate}</td>
                                <td>${escapeHtml(formatRrnValue(rrnValue))}</td>
                                <td>₹ ${formattedAmount}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
};
