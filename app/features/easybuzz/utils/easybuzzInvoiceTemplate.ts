// @ts-nocheck
import { getMerchantConfig } from "./merchantConfigs";
import { renderGenericMerchantInvoiceHTML } from "./merchant-ui/shared";
import { merchantUiRegistry } from "./merchant-ui/registry";

const pad2 = (value) => String(value).padStart(2, "0");

const hexToRgba = (hex, alpha) => {
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

const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatDateTimeParts = (year, month, day, hours, minutes, seconds) => {
    const datePart = `${pad2(day)}/${pad2(month)}/${year}`;

    if (hours === undefined || minutes === undefined) {
        return datePart;
    }

    return `${datePart} ${pad2(hours)}:${pad2(minutes)}:${pad2(seconds ?? 0)}`;
};

const formatExcelSerialDate = (value) => {
    const excelEpoch = Date.UTC(1899, 11, 30);
    const date = new Date(excelEpoch + Math.round(value * 86400 * 1000));

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return formatDateTimeParts(
        date.getUTCFullYear(),
        date.getUTCMonth() + 1,
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds()
    );
};

const formatDateString = (value) => {
    const trimmed = value.trim();

    const isoLikeMatch = trimmed.match(
        /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2})(?::(\d{1,2}))(?::\d{1,2})?(?:\.\d+)?)?(?:\s*(AM|PM))?(?:Z|[+-]\d{2}:?\d{2})?$/i
    );

    if (isoLikeMatch) {
        let hours = isoLikeMatch[4];
        const minutes = isoLikeMatch[5];
        const seconds = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2})(?::(\d{1,2}))(?::(\d{1,2}))?(?:\.\d+)?)?(?:\s*(AM|PM))?(?:Z|[+-]\d{2}:?\d{2})?$/i)?.[6];
        const meridiem = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2})(?::(\d{1,2}))(?::(\d{1,2}))?(?:\.\d+)?)?(?:\s*(AM|PM))?(?:Z|[+-]\d{2}:?\d{2})?$/i)?.[7]?.toUpperCase();

        if (hours !== undefined && meridiem) {
            let normalizedHours = Number(hours);
            if (meridiem === "PM" && normalizedHours < 12) normalizedHours += 12;
            if (meridiem === "AM" && normalizedHours === 12) normalizedHours = 0;
            hours = normalizedHours;
        }

        return formatDateTimeParts(
            Number(isoLikeMatch[1]),
            Number(isoLikeMatch[2]),
            Number(isoLikeMatch[3]),
            hours !== undefined ? Number(hours) : undefined,
            minutes !== undefined ? Number(minutes) : undefined,
            seconds !== undefined ? Number(seconds) : undefined
        );
    }

    const slashDateMatch = trimmed.match(
        /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:[ ,T]+(\d{1,2})(?::(\d{1,2}))(?::(\d{1,2}))?\s*(AM|PM)?)?$/i
    );

    if (slashDateMatch) {
        const first = Number(slashDateMatch[1]);
        const second = Number(slashDateMatch[2]);
        const year = slashDateMatch[3].length === 2 ? `20${slashDateMatch[3]}` : slashDateMatch[3];
        const isDayFirst = first > 12;
        const isMonthFirst = second > 12 || (!isDayFirst && first <= 12 && second <= 12);
        const day = isMonthFirst ? second : first;
        const month = isMonthFirst ? first : second;
        let hours = slashDateMatch[4];
        const minutes = slashDateMatch[5];
        const seconds = slashDateMatch[6];
        const meridiem = slashDateMatch[7]?.toUpperCase();

        if (hours !== undefined && meridiem) {
            let normalizedHours = Number(hours);
            if (meridiem === "PM" && normalizedHours < 12) normalizedHours += 12;
            if (meridiem === "AM" && normalizedHours === 12) normalizedHours = 0;
            hours = normalizedHours;
        }

        return formatDateTimeParts(
            Number(year),
            month,
            day,
            hours !== undefined ? Number(hours) : undefined,
            minutes !== undefined ? Number(minutes) : undefined,
            seconds !== undefined ? Number(seconds) : undefined
        );
    }

    const parsedDate = new Date(trimmed);
    if (!Number.isNaN(parsedDate.getTime())) {
        return formatDateTimeParts(
            parsedDate.getFullYear(),
            parsedDate.getMonth() + 1,
            parsedDate.getDate(),
            parsedDate.getHours(),
            parsedDate.getMinutes(),
            parsedDate.getSeconds()
        );
    }

    return trimmed;
};

export const detectRequiredColumns = (headers) => {
    const detectedColumns = {};

    detectedColumns.amount = headers.find((header) => {
        const lower = header.toLowerCase();
        return lower.includes("amount")
            || lower.includes("value")
            || lower.includes("txnamount")
            || lower.includes("transaction_amount");
    });

    detectedColumns.vpa = headers.find((header) => {
        const lower = header.toLowerCase();
        return lower.includes("vpa")
            || (lower.includes("virtual") && lower.includes("payment"))
            || (lower.includes("payee") && (lower.includes("vpa") || lower.includes("upi")));
    });

    return detectedColumns;
};

export const formatCellValue = (value, header) => {
    const headerLower = header?.toLowerCase() || "";

    if (typeof value === "number") {
        if (headerLower.includes("amount") || headerLower.includes("txnamount")) {
            return `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
        }
        if (value > 10000 && value < 100000) {
            const formattedExcelDate = formatExcelSerialDate(value);
            if (formattedExcelDate) {
                return formattedExcelDate;
            }
        }

        return value.toString();
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return formatDateTimeParts(
            value.getFullYear(),
            value.getMonth() + 1,
            value.getDate(),
            value.getHours(),
            value.getMinutes(),
            value.getSeconds()
        );
    }

    if (typeof value === "string" && value.trim()) {
        return formatDateString(value);
    }

    return String(value || "");
};

const merchantDesigns = {
    sparkleap: {
        accent: "#1f4b99",
        accentTwo: "#5d8af0",
        ink: "#163052",
        fontBody: "'Segoe UI', Arial, sans-serif",
        fontDisplay: "'Segoe UI', Arial, sans-serif",
        headerVariant: "ribbon",
        detailsVariant: "grid",
        tableVariant: "solid",
        summaryVariant: "card",
        badgeStyle: "filled",
        shapeVariant: "corner-lines",
        designName: "Royal Blue Ledger",
    },
    apextech: {
        accent: "#1f4b99",
        accentTwo: "#7ba4ff",
        ink: "#162b4d",
        fontBody: "'Segoe UI', Arial, sans-serif",
        fontDisplay: "'Segoe UI', Arial, sans-serif",
        headerVariant: "ribbon",
        detailsVariant: "grid",
        tableVariant: "solid",
        summaryVariant: "card",
        badgeStyle: "filled",
        shapeVariant: "corner-lines",
        designName: "Royal Blue Statement",
    },
    bytes_napse: {
        accent: "#1e7c4f",
        accentTwo: "#85cfa9",
        ink: "#1d4330",
        fontBody: "'Trebuchet MS', Verdana, sans-serif",
        fontDisplay: "'Trebuchet MS', Verdana, sans-serif",
        headerVariant: "sidebar",
        detailsVariant: "stacked",
        tableVariant: "striped",
        summaryVariant: "split",
        badgeStyle: "outline",
        shapeVariant: "left-rail",
        designName: "Emerald Compliance",
    },
    bytes_sparkz: {
        accent: "#172554",
        accentTwo: "#c7a95c",
        ink: "#1f2937",
        fontBody: "Georgia, 'Times New Roman', serif",
        fontDisplay: "Georgia, 'Times New Roman', serif",
        headerVariant: "centered",
        detailsVariant: "matrix",
        tableVariant: "gold-rule",
        summaryVariant: "band",
        badgeStyle: "gold",
        shapeVariant: "double-rule",
        designName: "Navy Gold Treasury",
    },
    logic_nook: {
        accent: "#6f42c1",
        accentTwo: "#b9a0eb",
        ink: "#362056",
        fontBody: "'Gill Sans', 'Trebuchet MS', sans-serif",
        fontDisplay: "'Gill Sans', 'Trebuchet MS', sans-serif",
        headerVariant: "frame",
        detailsVariant: "cards",
        tableVariant: "soft",
        summaryVariant: "stamp",
        badgeStyle: "pill",
        shapeVariant: "frame-corners",
        designName: "Purple Gridline",
    },
    byte_bliss: {
        accent: "#0f766e",
        accentTwo: "#81d4cc",
        ink: "#164e4a",
        fontBody: "'Century Gothic', Verdana, sans-serif",
        fontDisplay: "'Century Gothic', Verdana, sans-serif",
        headerVariant: "ledger",
        detailsVariant: "columns",
        tableVariant: "minimal-accent",
        summaryVariant: "totals-right",
        badgeStyle: "filled",
        shapeVariant: "top-chip",
        designName: "Teal Settlement Sheet",
    },
    techterra: {
        accent: "#c96b18",
        accentTwo: "#f7c68f",
        ink: "#6b3d0f",
        fontBody: "'Lucida Sans', Arial, sans-serif",
        fontDisplay: "'Lucida Sans', Arial, sans-serif",
        headerVariant: "spotlight",
        detailsVariant: "matrix",
        tableVariant: "header-strip",
        summaryVariant: "inline",
        badgeStyle: "outline",
        shapeVariant: "notch",
        designName: "Orange Operations",
    },
    shadaus: {
        accent: "#7a2734",
        accentTwo: "#d7a1ae",
        ink: "#4a1a21",
        fontBody: "Cambria, Georgia, serif",
        fontDisplay: "Cambria, Georgia, serif",
        headerVariant: "letterhead",
        detailsVariant: "stacked",
        tableVariant: "classic",
        summaryVariant: "card",
        badgeStyle: "gold",
        shapeVariant: "bottom-rule",
        designName: "Maroon Signature",
    },
    orionbyte: {
        accent: "#3249a8",
        accentTwo: "#99a8ed",
        ink: "#1e2a63",
        fontBody: "'Franklin Gothic Medium', Arial, sans-serif",
        fontDisplay: "'Franklin Gothic Medium', Arial, sans-serif",
        headerVariant: "panel",
        detailsVariant: "grid",
        tableVariant: "soft",
        summaryVariant: "split",
        badgeStyle: "pill",
        shapeVariant: "corner-tab",
        designName: "Indigo Control",
    },
    cipher_byte: {
        accent: "#0f766e",
        accentTwo: "#81d4cc",
        ink: "#134e4a",
        fontBody: "Tahoma, Geneva, sans-serif",
        fontDisplay: "Tahoma, Geneva, sans-serif",
        headerVariant: "minimal",
        detailsVariant: "columns",
        tableVariant: "lined",
        summaryVariant: "inline",
        badgeStyle: "outline",
        shapeVariant: "hairline",
        designName: "Teal Audit Flow",
    },
    voltiq: {
        accent: "#0f8ea5",
        accentTwo: "#8edeea",
        ink: "#0c5160",
        fontBody: "'Helvetica Neue', Arial, sans-serif",
        fontDisplay: "'Helvetica Neue', Arial, sans-serif",
        headerVariant: "capsule",
        detailsVariant: "cards",
        tableVariant: "capsule",
        summaryVariant: "stamp",
        badgeStyle: "filled",
        shapeVariant: "soft-corners",
        designName: "Cyan Receipt Deck",
    },
    novalogic: {
        accent: "#b85f77",
        accentTwo: "#ecc3cf",
        ink: "#6f3145",
        fontBody: "'Palatino Linotype', 'Book Antiqua', serif",
        fontDisplay: "'Palatino Linotype', 'Book Antiqua', serif",
        headerVariant: "elegant",
        detailsVariant: "matrix",
        tableVariant: "rose",
        summaryVariant: "band",
        badgeStyle: "pill",
        shapeVariant: "soft-divider",
        designName: "Rose Premium Note",
    },
    zoving_business: {
        accent: "#6d7f22",
        accentTwo: "#cbd8a0",
        ink: "#414d16",
        fontBody: "Verdana, Geneva, sans-serif",
        fontDisplay: "Verdana, Geneva, sans-serif",
        headerVariant: "structured",
        detailsVariant: "stacked",
        tableVariant: "olive",
        summaryVariant: "totals-right",
        badgeStyle: "outline",
        shapeVariant: "top-line",
        designName: "Olive Documentation",
    },
    byteevolve: {
        accent: "#4f7ca6",
        accentTwo: "#b4cce2",
        ink: "#27435c",
        fontBody: "'Segoe UI', Arial, sans-serif",
        fontDisplay: "'Segoe UI', Arial, sans-serif",
        headerVariant: "executive",
        detailsVariant: "grid",
        tableVariant: "steel",
        summaryVariant: "split",
        badgeStyle: "filled",
        shapeVariant: "rule-box",
        designName: "Steel Blue Banking",
    },
    code_horizon: {
        accent: "#0f8ea5",
        accentTwo: "#8edeea",
        ink: "#0c5160",
        fontBody: "'Arial Narrow', Arial, sans-serif",
        fontDisplay: "'Arial Narrow', Arial, sans-serif",
        headerVariant: "editorial",
        detailsVariant: "columns",
        tableVariant: "mono",
        summaryVariant: "inline",
        badgeStyle: "minimal",
        shapeVariant: "black-bar",
        designName: "Cyan Executive Ledger",
    },
};

const getInvoiceDesign = (merchantInfo) => {
    const preset = merchantDesigns[merchantInfo?.key] || merchantDesigns.sparkleap;
    return {
        ...preset,
        soft: hexToRgba(preset.accent, 0.08),
        softStrong: hexToRgba(preset.accent, 0.14),
        border: hexToRgba(preset.accent, 0.22),
        borderStrong: hexToRgba(preset.accent, 0.34),
        shadow: hexToRgba(preset.accent, 0.12),
    };
};

const renderHeader = (design, merchantInfo, invoiceNumber, rrnValue) => {
    const logo = `
        <div class="merchant-logo-wrap">
            <div class="merchant-logo-frame">
                <img src="${merchantInfo.logoPath}" alt="Merchant Logo" class="merchant-logo" />
            </div>
        </div>
    `;

    const seller = `
        <div class="seller-block">
            <h1 class="merchant-company">${escapeHtml(merchantInfo.companyName)}</h1>
        </div>
    `;

    const meta = `
        <div class="meta-stack">
            <div class="meta-card">
                <div class="meta-label">Invoice Number</div>
                <div class="meta-value meta-code">${escapeHtml(invoiceNumber)}</div>
            </div>
            <div class="meta-card">
                <div class="meta-label">RRN Number</div>
                <div class="meta-value meta-code">${escapeHtml(rrnValue)}</div>
            </div>
        </div>
    `;

    switch (design.headerVariant) {
        case "sidebar":
            return `
                <header class="header header--sidebar">
                    <div class="header-rail"></div>
                    <div class="header-main">
                        <div class="header-row">
                            ${logo}
                            ${meta}
                        </div>
                        ${seller}
                    </div>
                </header>
            `;
        case "centered":
            return `
                <header class="header header--centered">
                    <div class="header-center-logo">${logo}</div>
                    ${seller}
                    <div class="meta-row meta-row--wide">${meta}</div>
                </header>
            `;
        case "frame":
            return `
                <header class="header header--frame">
                    <div class="header-row">
                        ${logo}
                        ${seller}
                    </div>
                    <div class="meta-row">${meta}</div>
                </header>
            `;
        case "ledger":
            return `
                <header class="header header--ledger">
                    <div class="header-row">
                        <div>
                            ${logo}
                            ${seller}
                        </div>
                    </div>
                    <div class="meta-row">${meta}</div>
                </header>
            `;
        case "spotlight":
            return `
                <header class="header header--spotlight">
                    <div class="spotlight-band"></div>
                    <div class="header-row">
                        ${logo}
                        ${meta}
                    </div>
                    ${seller}
                </header>
            `;
        case "letterhead":
            return `
                <header class="header header--letterhead">
                    <div class="header-row">
                        ${seller}
                        ${logo}
                    </div>
                    <div class="meta-row">${meta}</div>
                </header>
            `;
        case "panel":
            return `
                <header class="header header--panel">
                    <div class="header-panel">
                        <div class="header-row">
                            ${logo}
                            ${seller}
                        </div>
                    </div>
                    <div class="meta-row">${meta}</div>
                </header>
            `;
        case "minimal":
            return `
                <header class="header header--minimal">
                    <div class="header-row">
                        ${logo}
                        ${meta}
                    </div>
                    <div class="header-row header-row--spread">
                        ${seller}
                    </div>
                </header>
            `;
        case "capsule":
            return `
                <header class="header header--capsule">
                    <div class="capsule-shell">
                        <div class="header-row">
                            ${logo}
                            ${seller}
                        </div>
                    </div>
                    <div class="meta-row">${meta}</div>
                </header>
            `;
        case "elegant":
            return `
                <header class="header header--elegant">
                    <div class="header-row">
                        ${seller}
                        ${logo}
                    </div>
                    <div class="meta-row meta-row--wide">${meta}</div>
                </header>
            `;
        case "structured":
            return `
                <header class="header header--structured">
                    <div class="header-row">
                        ${logo}
                        ${meta}
                    </div>
                    <div class="structured-divider"></div>
                    ${seller}
                </header>
            `;
        case "executive":
            return `
                <header class="header header--executive">
                    <div class="header-row">
                        ${logo}
                        ${meta}
                    </div>
                    <div class="header-row header-row--spread">
                        ${seller}
                    </div>
                </header>
            `;
        case "editorial":
            return `
                <header class="header header--editorial">
                    <div class="editorial-bar"></div>
                    <div class="header-row">
                        ${seller}
                        ${logo}
                    </div>
                    <div class="meta-row">${meta}</div>
                </header>
            `;
        case "ribbon":
        default:
            return `
                <header class="header header--ribbon">
                    <div class="header-ribbon"></div>
                    <div class="header-row">
                        ${logo}
                        ${meta}
                    </div>
                    ${seller}
                </header>
            `;
    }
};

const renderInfoSection = (design, fields, merchantInfo) => {
    const sellerCard = `
        <section class="info-card info-card--address">
            <h2 class="section-title">Registered Address</h2>
            <div class="address-copy">${fields.addressHtml}</div>
        </section>
    `;

    const customerCard = `
        <section class="info-card">
            <h2 class="section-title">Customer Details</h2>
            <div class="data-list">
                <div class="data-row"><span>Name</span><strong>${fields.customerName}</strong></div>
                <div class="data-row"><span>UPI ID</span><strong>${fields.upiId}</strong></div>
            </div>
        </section>
    `;

    const transactionRows = merchantInfo?.key === "apextech"
        ? `
                <div class="data-row"><span>Date</span><strong>${fields.transactionDateOnly}</strong></div>
                <div class="data-row"><span>Time</span><strong>${fields.transactionTimeOnly}</strong></div>
        `
        : `
                <div class="data-row"><span>Date</span><strong class="value-multiline">${fields.transactionDateHtml}</strong></div>
                <div class="data-row"><span>RRN Number</span><strong>${fields.rrnValue}</strong></div>
        `;

    const transactionCard = `
        <section class="info-card">
            <h2 class="section-title ${merchantInfo?.key === "apextech" ? "section-title--center" : ""}">Transaction Details</h2>
            <div class="data-list">
                ${transactionRows}
            </div>
        </section>
    `;

    switch (design.detailsVariant) {
        case "stacked":
            return `
                <section class="details details--stacked">
                    ${sellerCard}
                    <div class="details-pair">
                        ${customerCard}
                        ${transactionCard}
                    </div>
                </section>
            `;
        case "matrix":
            return `
                <section class="details details--matrix">
                    ${sellerCard}
                    ${customerCard}
                    ${transactionCard}
                </section>
            `;
        case "cards":
            return `
                <section class="details details--cards">
                    ${customerCard}
                    ${sellerCard}
                    ${transactionCard}
                </section>
            `;
        case "columns":
            return `
                <section class="details details--columns">
                    <div class="details-column-left">
                        ${sellerCard}
                    </div>
                    <div class="details-column-right">
                        ${customerCard}
                        ${transactionCard}
                    </div>
                </section>
            `;
        case "grid":
        default:
            return `
                <section class="details details--grid">
                    ${sellerCard}
                    ${customerCard}
                    ${transactionCard}
                </section>
            `;
    }
};

const renderTableSection = (design, descriptionText, formattedAmount, merchantInfo) => `
    <section class="table-section">
        <div class="section-heading-row">
            <div>
               
            </div>
        </div>
        <div class="table-shell table-shell--${design.tableVariant}">
            <table class="invoice-table">
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
                        <td>${merchantInfo?.key === "apextech" ? "-" : "₹ 0.00"}</td>
                        <td>₹ ${formattedAmount}</td>
                    </tr>
                    <tr class="table-total">
                        <td colspan="${merchantInfo?.key === "apextech" ? "4" : "3"}" style="font-weight: 900;">Total</td>
                        ${merchantInfo?.key === "apextech" ? "" : `<td>₹ ${formattedAmount}</td>`}
                        <td>${merchantInfo?.key === "apextech" ? "-" : "₹ 0.00"}</td>
                        <td>₹ ${formattedAmount}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>
`;

const renderSummarySection = (design, formattedAmount, merchantInfo) => {
    const summaryLines = merchantInfo?.key === "apextech"
        ? `
    `
        : `
        <div class="summary-lines">
            <div class="summary-line"><span>Gross Amount</span><strong>₹ ${formattedAmount}</strong></div>
            <div class="summary-line"><span>Tax Amount</span><strong>₹ 0.00</strong></div>
            <div class="summary-line"><span>Net Amount</span><strong>₹ ${formattedAmount}</strong></div>
        </div>
    `;

    const paidCard = `
        <div class="paid-card">
            <div class="paid-label">Total Amount Paid</div>
            <div class="paid-value">₹ ${formattedAmount}</div>
        </div>
    `;

    return `
        <section class="summary summary--${design.summaryVariant}">
          
            ${paidCard}
        </section>
    `;
};

const renderTermsSection = (receiptEntityName) => `
    <section class="terms-block">        
        <h2 class="section-title section-title--tight">Terms & Conditions</h2>
        <ul class="terms-list">
            <li>By receiving this receipt, the user has paid the appropriate fees to ${escapeHtml(receiptEntityName)} through Payment Gateway and accepts the company's terms and conditions in connection with the transaction.</li>
           
            <li>All receipts are issued against the UPI ID through which the payment is collected and verified.</li>
            <li>This is a computer-generated receipt and does not require a physical seal or signature for validation.</li>
        </ul>
    </section>
`;

const renderByteBlissInvoiceHTML = ({
    merchantInfo,
    invoiceNumberToDisplay,
    rrnValue,
    formattedAmount,
    transactionDateTimeDisplay,
    receiptEntityName,
    descriptionText,
    fields,
}) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(rrnValue)}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            margin: 0;
            background: #edf0f7;
            color: #1f2937;
            font-family: "Segoe UI", Arial, sans-serif;
        }
        .page {
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
            min-height: 297mm;
            padding: 0;
        }
        .invoice {
            position: relative;
            min-height: 297mm;
            background: #ffffff;
            overflow: hidden;
            box-shadow: 0 18px 48px rgba(32, 25, 75, 0.14);
            border-radius: 8mm;
        }
        .top-band {
            position: relative;
            height: 34mm;
            background: linear-gradient(90deg, #232134 0 43%, #6a2fff 43%, #8b3dff 100%);
            clip-path: polygon(0 0, 100% 0, 100% 100%, 52% 100%, 44% 58%, 0 58%);
            border-radius: 8mm 8mm 0 0;
        }
        .top-band::after {
            content: "";
            position: absolute;
            top: 12mm;
            right: 0;
            width: 44mm;
            height: 58mm;
            background: linear-gradient(180deg, #7f37ff, #5b1dca);
            clip-path: polygon(18% 0, 100% 0, 100% 100%, 0 100%);
            opacity: 0.96;
            border-radius: 0 0 0 8mm;
        }
        .content {
            position: relative;
            z-index: 1;
            padding: 16mm 12mm 12mm;
            margin-top: -22mm;
        }
        .hero {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8mm;
            margin-bottom: 10mm;
        }
        .brand {
            display: flex;
            align-items: center;
        }
        .brand img {
            width: 34mm;
            max-height: 18mm;
            object-fit: contain;
            object-position: left center;
        }
        .invoice-meta {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 6mm;
            text-align: right;
            flex-wrap: wrap;
        }
        .meta-line {
            font-size: 11px;
            color: #4b5563;
            margin-bottom: 0;
            white-space: nowrap;
        }
        .meta-line strong {
            color: #111827;
        }
        .section-heading {
            text-align: center;
            font-size: 16px;
            font-weight: 800;
            color: #1f2937;
            margin: 8mm 0 4mm;
        }
        .section-band {
            display: grid;
            grid-template-columns: 1fr 1fr 0.9fr 0.9fr 1.5fr;
            background: linear-gradient(90deg, #6d28d9, #8b3dff);
            color: #ffffff;
            font-size: 11px;
            font-weight: 700;
            border-radius: 4mm 4mm 0 0;
        }
        .section-band div {
            padding: 4mm 3mm;
            text-align: center;
            border-right: 1px solid rgba(255,255,255,0.18);
        }
        .section-band div:last-child {
            border-right: none;
        }
        .passenger-row {
            display: grid;
            grid-template-columns: 1fr 1fr 0.9fr 0.9fr 1.5fr;
            border: 1px solid #ebe8f8;
            border-top: none;
            background: #ffffff;
            margin-bottom: 5mm;
            border-radius: 0 0 4mm 4mm;
            overflow: hidden;
        }
        .passenger-row div {
            padding: 4mm 3mm;
            text-align: center;
            font-size: 10.5px;
            color: #4b5563;
            border-right: 1px solid #f0ecfb;
        }
        .passenger-row div:last-child {
            border-right: none;
        }
        .journey-banner {
            background: linear-gradient(90deg, #6d28d9, #8b3dff);
            color: #ffffff;
            font-size: 11.5px;
            font-weight: 700;
            margin-top: 3mm;
            border-radius: 4mm 4mm 0 0;
            overflow: hidden;
            min-height: 5mm;
        }
        .journey-grid {
            margin-bottom: 7mm;
            border-radius: 0 0 4mm 4mm;
            overflow: hidden;
        }
        .bottom-grid {
            display: grid;
            grid-template-columns: 1.25fr 0.75fr;
            gap: 10mm;
            align-items: start;
            margin-bottom: 8mm;
        }
        .terms h3 {
            font-size: 15px;
            font-weight: 800;
            color: #111827;
            margin-bottom: 2mm;
        }
        .terms p {
            font-size: 10.5px;
            line-height: 1.7;
            color: #4b5563;
        }
        .terms ul {
            list-style: none;
            display: grid;
            gap: 2.5mm;
        }
        .terms li {
            position: relative;
            padding-left: 5mm;
            font-size: 10.5px;
            line-height: 1.65;
            color: #4b5563;
        }
        .terms li::before {
            content: "";
            position: absolute;
            top: 1.7mm;
            left: 0;
            width: 2mm;
            height: 2mm;
            border-radius: 50%;
            background: #6d28d9;
        }
        .amount-card {
            justify-self: end;
            width: 100%;
            max-width: 62mm;
        }
        .amount-line {
            display: flex;
            justify-content: space-between;
            gap: 4mm;
            font-size: 11px;
            color: #374151;
            margin-bottom: 3mm;
        }
        .amount-line strong {
            color: #111827;
        }
        .amount-total {
            margin-top: 4mm;
            background: linear-gradient(90deg, #6d28d9, #8b3dff);
            color: #ffffff;
            display: flex;
            justify-content: space-between;
            gap: 4mm;
            padding: 4mm 5mm;
            font-size: 13px;
            font-weight: 800;
            border-radius: 4mm;
        }
        .payment-heading {
            font-size: 16px;
            font-weight: 800;
            text-align: left;
            margin: 4mm 0 4mm;
            color: #1f2937;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            overflow: hidden;
            border-radius: 4mm;
        }
        th {
            background: linear-gradient(90deg, #6d28d9, #8b3dff);
            color: #ffffff;
            text-align: left;
            padding: 4mm 3mm;
            font-size: 11px;
            font-weight: 700;
        }
        td {
            border: 1px solid #eceff4;
            padding: 4mm 3mm;
            font-size: 10.5px;
            color: #4b5563;
        }
        @media print {
            body { background: #ffffff; }
            .invoice { box-shadow: none; }
            .top-band,
            .top-band::after,
            .section-band,
            .journey-banner,
            th,
            .amount-total {
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
                <div class="section-band">
                    <div>Name:</div>
                    <div>UPI ID:</div>
                    <div>Date:</div>
                    <div>Time:</div>
                    <div>Address:</div>
                </div>
                <div class="passenger-row">
                    <div>${fields.customerName}</div>
                    <div>${fields.upiId}</div>
                    <div>${fields.transactionDateOnly}</div>
                    <div>${fields.transactionTimeOnly}</div>
                    <div>${fields.addressHtml}</div>
                </div>

                <div class="section-heading">Journey Details:</div>
                <div class="journey-banner"></div>
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
                                <td>₹ 0.00</td>
                                <td>₹ ${formattedAmount}</td>
                            </tr>
                            <tr>
                                <td colspan="3" style="font-weight: 900; text-align: right;">Total</td>
                                <td>₹ ${formattedAmount}</td>
                                <td>₹ 0.00</td>
                                <td>₹ ${formattedAmount}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <section class="bottom-grid">
                    <div class="terms">
                        <h3>Terms & Conditions</h3>
                        <ul>
                            <li>By receiving this receipt, the user has paid the appropriate fees to ${escapeHtml(receiptEntityName)} through Payment Gateway and accepts the company's terms and conditions in connection with the transaction.</li>
                            <li>All receipts are issued against the UPI ID through which the payment is collected and verified.</li>
                            <li>This is a computer-generated receipt and does not require a physical seal or signature for validation.</li>
                        </ul>
                    </div>
                    <div class="amount-card">
                        <div class="amount-line"><span>Sub Total:</span><strong>₹ ${formattedAmount}</strong></div>
                        <div class="amount-line"><span>Tax:</span><strong>₹ 0.00</strong></div>
                        <div class="amount-total"><span>Total:</span><span>₹ ${formattedAmount}</span></div>
                    </div>
                </section>

                <div class="payment-heading">Payment Details:</div>
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
                            <td>${escapeHtml(descriptionText)}</td>
                            <td>${fields.transactionDate}</td>
                            <td>${escapeHtml(rrnValue)}</td>
                            <td>₹ ${formattedAmount}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</body>
</html>`;

const renderByteEvolveInvoiceHTML = ({
    merchantInfo,
    invoiceNumberToDisplay,
    rrnValue,
    formattedAmount,
    receiptEntityName,
    descriptionText,
    fields,
}) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(rrnValue)}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            margin: 0;
            background: #d8d8d8;
            color: #3f3f46;
            font-family: "Segoe UI", Arial, sans-serif;
        }
        .page {
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
            min-height: 297mm;
            padding: 0;
        }
        .invoice {
            position: relative;
            min-height: 297mm;
            background: #ffffff;
            overflow: hidden;
            box-shadow: 0 14px 40px rgba(17, 24, 39, 0.18);
            padding: 14mm 12mm 12mm;
        }
        .invoice::before {
            content: "";
            position: absolute;
            inset: 0;
            background: linear-gradient(132deg, transparent 0 38%, rgba(244, 232, 232, 0.85) 38%, rgba(244, 232, 232, 0.85) 62%, transparent 62%);
            pointer-events: none;
        }
        .top-meta {
            position: relative;
            z-index: 1;
            display: flex;
            justify-content: flex-end;
            margin-bottom: 12mm;
            font-size: 10px;
            color: #6b7280;
            line-height: 1.7;
            text-align: right;
        }
        .hero {
            position: relative;
            z-index: 1;
            margin-bottom: 10mm;
        }
        .invoice-title {
            display: inline-block;
            background: linear-gradient(90deg, #ef7b6f, #d64e48);
            color: #ffffff;
            font-size: 25px;
            font-weight: 300;
            letter-spacing: 0.05em;
            padding: 2mm 10mm 2mm 5mm;
            margin-bottom: 7mm;
        }
        .invoice-title strong {
            font-weight: 800;
            margin-left: 2mm;
            color: #ffffff;
        }
        .bill-grid {
            display: grid;
            grid-template-columns: 1fr 0.95fr;
            gap: 12mm;
            align-items: start;
        }
        .bill-to h3,
        .summary h3,
        .meta-block h3,
        .payments h3 {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: #991b1b;
            margin-bottom: 3mm;
        }
        .bill-to p,
        .meta-block p,
        .payments p {
            font-size: 10.5px;
            line-height: 1.75;
            color: #52525b;
        }
        .logo {
            width: 34mm;
            max-height: 18mm;
            object-fit: contain;
            object-position: left center;
            margin-bottom: 4mm;
        }
        table {
            position: relative;
            z-index: 1;
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10mm;
        }
        thead th {
            background: #b91c1c;
            color: #ffffff;
            padding: 3.4mm 3mm;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-weight: 700;
            text-align: left;
        }
        tbody td {
            border-bottom: 1px solid #e5e7eb;
            padding: 3.6mm 3mm;
            font-size: 10.5px;
            color: #52525b;
        }
        tbody tr:last-child td {
            border-bottom: 1px solid #d4d4d8;
        }
        .summary-wrap {
            position: relative;
            z-index: 1;
            display: grid;
            grid-template-columns: 1fr 0.82fr;
            gap: 12mm;
            margin-bottom: 10mm;
        }
        .meta-block {
            align-self: end;
        }
        .summary {
            justify-self: end;
            width: 100%;
            max-width: 72mm;
        }
        .summary-line {
            display: flex;
            justify-content: space-between;
            gap: 4mm;
            font-size: 11px;
            color: #3f3f46;
            padding: 1.8mm 0;
        }
        .summary-line.total {
            margin-top: 1mm;
            font-size: 14px;
            font-weight: 800;
            color: #18181b;
        }
        .amount-due {
            margin-top: 4mm;
            background: #b91c1c;
            color: #ffffff;
            display: flex;
            justify-content: space-between;
            gap: 4mm;
            padding: 3.6mm 4mm;
            font-size: 12px;
            font-weight: 800;
        }
        .footer {
            position: relative;
            z-index: 1;
            display: grid;
            grid-template-columns: 0.9fr 1.1fr;
            gap: 12mm;
            align-items: end;
            margin-top: 10mm;
        }
        .payments ul {
            margin-top: 3mm;
            padding-left: 4mm;
            color: #52525b;
            font-size: 10.5px;
            line-height: 1.8;
        }
        .thanks {
            justify-self: end;
            align-self: end;
            background: linear-gradient(90deg, #ef7b6f, #d64e48);
            color: #ffffff;
            font-size: 22px;
            font-weight: 300;
            letter-spacing: 0.05em;
            padding: 2mm 7mm 2mm 5mm;
        }
        .thanks strong {
            font-weight: 800;
            color: #ffffff;
        }
        @media print {
            body { background: #ffffff; }
            .invoice { box-shadow: none; }
            .invoice::before,
            .invoice-title,
            .amount-due,
            .thanks,
            thead th {
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

const renderByteSparkzInvoiceHTML = ({
    merchantInfo,
    invoiceNumberToDisplay,
    rrnValue,
    formattedAmount,
    receiptEntityName,
    descriptionText,
    fields,
}) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(rrnValue)}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            margin: 0;
            background: #a3a3a3;
            color: #3f3f46;
            font-family: "Segoe UI", Arial, sans-serif;
        }
        .page {
            width: 100%;
            max-width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
        }
        .invoice {
            position: relative;
            min-height: 297mm;
            background: #ffffff;
            overflow: hidden;
            box-shadow: 0 18px 44px rgba(15, 23, 42, 0.22);
            padding: 15mm 12mm 10mm;
        }
        .invoice::before {
            content: "";
            position: absolute;
            inset: 0;
            background: linear-gradient(120deg, rgba(255,255,255,0) 28%, rgba(238, 241, 247, 0.75) 42%, rgba(255,255,255,0) 58%);
            pointer-events: none;
        }
        .top-shell {
            position: relative;
            z-index: 1;
            background: linear-gradient(135deg, #5167b0, #5a6fbb 65%, #4760ac);
            border-bottom-left-radius: 16mm;
            border-bottom-right-radius: 16mm;
            padding: 9mm 9mm 15mm;
            overflow: hidden;
        }
        .top-shell::before {
            content: "";
            position: absolute;
            top: -10mm;
            left: 36%;
            width: 40mm;
            height: 30mm;
            background: rgba(255,255,255,0.04);
            border-radius: 50%;
        }
        .top-shell::after {
            content: "";
            position: absolute;
            left: -12mm;
            bottom: -10mm;
            width: 34mm;
            height: 30mm;
            background: rgba(27, 41, 96, 0.35);
            border-radius: 50%;
        }
        .top-row {
            display: grid;
            grid-template-columns: 1fr 0.95fr;
            gap: 10mm;
            color: #ffffff;
            margin-bottom: 10mm;
        }
        .brand-block {
            display: flex;
            align-items: flex-start;
            gap: 4mm;
        }
        .brand-dots {
            display: grid;
            grid-template-columns: repeat(3, 4px);
            gap: 5px;
            padding-top: 2mm;
        }
        .brand-dots span {
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: #ff6b8b;
            display: block;
        }
        .brand-text h1 {
            font-size: 20px;
            line-height: 1;
            letter-spacing: 0.04em;
            font-weight: 800;
            margin-bottom: 1mm;
        }
        .brand-text p,
        .contact p,
        .hero-meta p {
            font-size: 10px;
            line-height: 1.65;
            color: rgba(255,255,255,0.88);
        }
        .contact h3 {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 2mm;
            color: #ffffff;
        }
        .hero-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10mm;
            color: #ffffff;
            align-items: end;
        }
        .hero-meta h3 {
            font-size: 12px;
            font-weight: 400;
            margin-bottom: 1.5mm;
            color: rgba(255,255,255,0.9);
        }
        .hero-meta strong {
            display: block;
            font-size: 16px;
            font-weight: 800;
            color: #ffffff;
            margin-bottom: 1mm;
        }
        .dates {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6mm;
        }
        .date-box span {
            display: block;
            font-size: 11px;
            color: rgba(255,255,255,0.82);
            margin-bottom: 1.5mm;
        }
        .date-box strong {
            display: block;
            font-size: 15px;
            line-height: 1.35;
            color: #ffffff;
        }
        .table-card {
            position: relative;
            z-index: 2;
            margin: -10mm auto 8mm;
            width: calc(100% - 24mm);
            background: rgba(255,255,255,0.94);
            border-radius: 9mm;
            box-shadow: 0 18px 36px rgba(100, 116, 139, 0.2);
            overflow: hidden;
            backdrop-filter: blur(2px);
        }
        .table-card table {
            width: 100%;
            border-collapse: collapse;
        }
        .table-card thead th {
            padding: 5mm 4mm;
            font-size: 10px;
            font-weight: 700;
            color: #3f3f46;
            border-right: 1px solid #e5e7eb;
            text-transform: uppercase;
        }
        .table-card thead th:last-child {
            border-right: none;
        }
        .table-card tbody td {
            padding: 4mm 4mm;
            font-size: 10.5px;
            color: #52525b;
            border-bottom: 1px solid #eef2f7;
            text-align: center;
        }
        .table-card tbody td.desc {
            text-align: left;
        }
        .table-card tbody tr:last-child td {
            border-bottom: none;
        }
        .main-body {
            position: relative;
            z-index: 1;
            padding: 0 7mm;
        }
        .divider {
            height: 1px;
            background: #e5e7eb;
            margin: 4mm 0 6mm;
        }
        .summary-area {
            display: grid;
            grid-template-columns: 0.95fr 0.85fr;
            gap: 12mm;
            align-items: start;
            margin-bottom: 10mm;
        }
        .info-card {
            border: 1px solid #dfe4ec;
            border-radius: 5mm;
            padding: 6mm 5mm;
            background: rgba(255,255,255,0.92);
        }
        .info-card h3 {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #3f4b73;
            margin-bottom: 3mm;
        }
        .info-card p,
        .summary-list div,
        .sign {
            font-size: 10.5px;
            line-height: 1.75;
            color: #52525b;
        }
        .summary-panel {
            justify-self: end;
            width: 100%;
            max-width: 62mm;
        }
        .summary-list {
            display: grid;
            gap: 2.5mm;
            margin-bottom: 5mm;
        }
        .summary-list div {
            display: flex;
            justify-content: space-between;
            gap: 4mm;
        }
        .total-pill {
            background: linear-gradient(90deg, #5167b0, #5b74c6);
            color: #ffffff;
            display: flex;
            justify-content: space-between;
            gap: 4mm;
            padding: 3.8mm 5mm;
            border-radius: 4mm;
            font-size: 12px;
            font-weight: 800;
            margin-bottom: 12mm;
        }
        .sign-line {
            width: 100%;
            height: 1px;
            background: #d4d4d8;
            margin-bottom: 3mm;
        }
        .sign {
            text-align: center;
        }
        .footer-bar {
            position: absolute;
            left: 24mm;
            right: 24mm;
            bottom: 0;
            background: linear-gradient(90deg, #5167b0, #5b74c6);
            color: #ffffff;
            text-align: center;
            padding: 3mm 5mm;
            border-top-left-radius: 5mm;
            border-top-right-radius: 5mm;
            font-size: 11px;
        }
        @media print {
            body { background: #ffffff; }
            .invoice { box-shadow: none; }
            .top-shell,
            .table-card,
            .total-pill,
            .footer-bar {
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
            <section class="top-shell">
                <div class="top-row">
                    <div class="brand-block">
                        <div class="brand-dots">
                            <span></span><span></span><span></span>
                            <span></span><span></span><span></span>
                            <span></span><span></span><span></span>
                        </div>
                        <div class="brand-text">
                            <h1>${escapeHtml(merchantInfo.displayName)}</h1>
                            <p>${escapeHtml(merchantInfo.companyName)}</p>
                        </div>
                    </div>
                    <div class="contact">
                        <h3>Contact</h3>
                        <p>${fields.addressHtml}</p>
                    </div>
                </div>
                <div class="hero-row">
                    <div class="hero-meta">
                        <h3>Invoice to</h3>
                        <strong>${fields.customerName}</strong>
                        <p>UPI ID: ${fields.upiId}</p>
                        <p>Reference No: ${escapeHtml(rrnValue)}</p>
                    </div>
                    <div class="dates">
                        <div class="date-box">
                            <span>Invoice Date</span>
                            <strong>${fields.transactionDate}</strong>
                        </div>
                        <div class="date-box">
                            <span>Due Date</span>
                            <strong>${fields.transactionDate}</strong>
                        </div>
                    </div>
                </div>
            </section>

            <section class="table-card">
                <table>
                    <thead>
                        <tr>
                            <th style="width: 10%;">No.</th>
                            <th style="width: 42%;">Item Description</th>
                            <th style="width: 16%;">Price</th>
                            <th style="width: 12%;">Qty.</th>
                            <th style="width: 20%;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1.</td>
                            <td class="desc">${escapeHtml(descriptionText)}</td>
                            <td>₹ ${formattedAmount}</td>
                            <td>1</td>
                            <td>₹ ${formattedAmount}</td>
                        </tr>
                        <tr>
                            <td>2.</td>
                            <td class="desc">Settlement reference ${escapeHtml(rrnValue)}</td>
                            <td>₹ 0.00</td>
                            <td>1</td>
                            <td>₹ 0.00</td>
                        </tr>
                        <tr>
                            <td>3.</td>
                            <td class="desc">Invoice record ${escapeHtml(invoiceNumberToDisplay)}</td>
                            <td>₹ 0.00</td>
                            <td>1</td>
                            <td>₹ 0.00</td>
                        </tr>
                        <tr>
                            <td>4.</td>
                            <td class="desc">Merchant confirmation ${escapeHtml(receiptEntityName)}</td>
                            <td>₹ 0.00</td>
                            <td>1</td>
                            <td>₹ 0.00</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            <div class="main-body">
                <div class="divider"></div>
                <section class="summary-area">
                    <div class="info-card">
                        <h3>Payment Method</h3>
                        <p>
                            Account No : ${escapeHtml(rrnValue)}<br/>
                            Account Name : ${escapeHtml(receiptEntityName)}<br/>
                            Bank Name : UPI Settlement
                        </p>
                        <h3 style="margin-top: 6mm;">Terms & Conditions</h3>
                        <p>
                            Payment has been received by ${escapeHtml(receiptEntityName)} through the stated UPI channel. This system-generated invoice is valid for settlement, accounting, and record verification purposes.
                        </p>
                    </div>
                    <div class="summary-panel">
                        <div class="summary-list">
                            <div><span>Subtotal</span><strong>₹ ${formattedAmount}</strong></div>
                            <div><span>Discount</span><strong>₹ 0.00</strong></div>
                            <div><span>Tax (0%)</span><strong>₹ 0.00</strong></div>
                        </div>
                        <div class="total-pill"><span>Total</span><span>₹ ${formattedAmount}</span></div>
                        <div class="sign-line"></div>
                        <div class="sign">Authorised Sign</div>
                    </div>
                </section>
            </div>

            <div class="footer-bar">Thank you for your business</div>
        </div>
    </div>
</body>
</html>`;

export const generateProfessionalInvoiceHTML = (
    rowData,
    invoiceNumber,
    rrnColumn,
    upiColumn,
    customerNameColumn,
    merchantColumn,
    amountColumn,
    dateColumn,
    workspaceMode = "easybuzz"
) => {
    const merchantInfo = getMerchantConfig(rowData, merchantColumn, workspaceMode);
    const design = getInvoiceDesign(merchantInfo);
    const invoiceNumberToDisplay = invoiceNumber ? String(invoiceNumber) : "-";

    let transactionDateTimeDisplay = "N/A";
    if (dateColumn && rowData[dateColumn] !== undefined) {
        transactionDateTimeDisplay = formatCellValue(rowData[dateColumn], dateColumn);
    }

    const detectedCols = detectRequiredColumns([]);
    let amountValue = 0;
    if (amountColumn && rowData[amountColumn] !== undefined && rowData[amountColumn] !== null && rowData[amountColumn] !== "") {
        const rawValue = String(rowData[amountColumn]).replace(/[₹,\s]/g, "");
        amountValue = parseFloat(rawValue) || 0;
    } else if (detectedCols.amount && rowData[detectedCols.amount] !== undefined && rowData[detectedCols.amount] !== null && rowData[detectedCols.amount] !== "") {
        const rawValue = String(rowData[detectedCols.amount]).replace(/[₹,\s]/g, "");
        amountValue = parseFloat(rawValue) || 0;
    }

    const formattedAmount = amountValue.toLocaleString("en-IN", { minimumFractionDigits: 2 });
    const upiIdValue = upiColumn && rowData[upiColumn]
        ? formatCellValue(rowData[upiColumn], upiColumn)
        : (detectedCols.vpa && rowData[detectedCols.vpa] ? formatCellValue(rowData[detectedCols.vpa], detectedCols.vpa) : "N/A");
    const customerNameValue = customerNameColumn && rowData[customerNameColumn]
        ? formatCellValue(rowData[customerNameColumn], customerNameColumn)
        : "N/A";
    const rrnValue = rrnColumn && rowData[rrnColumn] ? formatCellValue(rowData[rrnColumn], rrnColumn) : "N/A";
    const receiptEntityName = merchantInfo.receiptEntityName || merchantInfo.companyName;
    const descriptionText = workspaceMode === "others"
        ? "Services rendered and goals delivered successfully"
        : "Wallet Loading";
    const transactionDateParts = transactionDateTimeDisplay.match(/^(\d{2}\/\d{2}\/\d{4})(?:\s+(.+))?$/);
    const transactionDateOnly = transactionDateParts?.[1] || escapeHtml(transactionDateTimeDisplay);
    const transactionTimeOnly = transactionDateParts?.[2] ? escapeHtml(transactionDateParts[2]) : "-";
    const transactionDateHtml = transactionDateParts?.[2]
        ? `${escapeHtml(transactionDateParts[1])}<br/>${escapeHtml(transactionDateParts[2])}`
        : escapeHtml(transactionDateTimeDisplay);

    const fields = {
        addressHtml: String(merchantInfo.address || "Address details not configured").replace(/<br\/>/g, "<br/>"),
        customerName: escapeHtml(customerNameValue),
        upiId: escapeHtml(upiIdValue),
        transactionDate: escapeHtml(transactionDateTimeDisplay),
        transactionDateOnly,
        transactionTimeOnly,
        transactionDateHtml,
        rrnValue: escapeHtml(rrnValue),
    };

    const renderContext = {
        merchantInfo,
        invoiceNumberToDisplay,
        rrnValue,
        formattedAmount,
        transactionDateTimeDisplay,
        receiptEntityName,
        descriptionText,
        fields,
    };

    if (merchantUiRegistry[merchantInfo.key]) {
        return merchantUiRegistry[merchantInfo.key](renderContext);
    }

    return renderGenericMerchantInvoiceHTML(merchantInfo.key, renderContext);

    if (merchantInfo.key === "byte_bliss") {
        return renderByteBlissInvoiceHTML({
            merchantInfo,
            invoiceNumberToDisplay,
            rrnValue,
            formattedAmount,
            transactionDateTimeDisplay,
            receiptEntityName,
            descriptionText,
            fields,
        });
    }

    if (merchantInfo.key === "byteevolve") {
        return renderByteEvolveInvoiceHTML({
            merchantInfo,
            invoiceNumberToDisplay,
            rrnValue,
            formattedAmount,
            receiptEntityName,
            descriptionText,
            fields,
        });
    }

    if (merchantInfo.key === "bytes_sparkz") {
        return renderByteSparkzInvoiceHTML({
            merchantInfo,
            invoiceNumberToDisplay,
            rrnValue,
            formattedAmount,
            receiptEntityName,
            descriptionText,
            fields,
        });
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(rrnValue)}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --accent: ${design.accent};
            --accent-2: ${design.accentTwo};
            --ink: ${design.ink};
            --soft: ${design.soft};
            --soft-strong: ${design.softStrong};
            --border: ${design.border};
            --border-strong: ${design.borderStrong};
            --shadow: ${design.shadow};
            --body-font: ${design.fontBody};
            --display-font: ${design.fontDisplay};
        }

        body {
            margin: 0;
            padding: 0;
            background: #f7f8fa;
            color: var(--ink);
            font-family: var(--body-font);
        }

        .page {
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
            min-height: 297mm;
            padding: 0;
        }

        .invoice {
            position: relative;
            min-height: 297mm;
            padding: 10mm;
            background: #ffffff;
            border: 1px solid #eceef2;
            box-shadow: 0 16px 36px rgba(15, 23, 42, 0.05);
            overflow: hidden;
        }

        .invoice::before,
        .invoice::after {
            content: "";
            position: absolute;
            pointer-events: none;
        }

        .invoice.shape-corner-lines::before {
            top: 8mm;
            right: 8mm;
            width: 22mm;
            height: 22mm;
            border-top: 2px solid var(--accent);
            border-right: 2px solid var(--accent);
            opacity: 0.45;
        }

        .invoice.shape-left-rail::before {
            top: 0;
            left: 0;
            bottom: 0;
            width: 8mm;
            background: linear-gradient(180deg, var(--accent), var(--accent-2));
            opacity: 0.1;
        }

        .invoice.shape-double-rule::before {
            left: 10mm;
            right: 10mm;
            top: 8mm;
            height: 1px;
            background: var(--accent);
            opacity: 0.45;
        }

        .invoice.shape-double-rule::after {
            left: 10mm;
            right: 10mm;
            top: 10mm;
            height: 1px;
            background: var(--accent-2);
            opacity: 0.7;
        }

        .invoice.shape-frame-corners::before {
            left: 8mm;
            top: 8mm;
            width: 18mm;
            height: 18mm;
            border-top: 2px solid var(--accent);
            border-left: 2px solid var(--accent);
            opacity: 0.5;
        }

        .invoice.shape-frame-corners::after {
            right: 8mm;
            bottom: 8mm;
            width: 18mm;
            height: 18mm;
            border-right: 2px solid var(--accent);
            border-bottom: 2px solid var(--accent);
            opacity: 0.5;
        }

        .invoice.shape-top-chip::before {
            top: 0;
            left: 10mm;
            width: 32mm;
            height: 5mm;
            background: var(--accent);
            border-radius: 0 0 10px 10px;
        }

        .invoice.shape-notch::before {
            top: 0;
            right: 12mm;
            width: 28mm;
            height: 10mm;
            background: var(--soft-strong);
            clip-path: polygon(0 0, 100% 0, 100% 100%, 14% 100%);
        }

        .invoice.shape-bottom-rule::after {
            left: 10mm;
            right: 10mm;
            bottom: 8mm;
            height: 2px;
            background: linear-gradient(90deg, var(--accent), transparent);
            opacity: 0.45;
        }

        .invoice.shape-corner-tab::before {
            top: 0;
            right: 0;
            width: 28mm;
            height: 18mm;
            background: var(--soft-strong);
            clip-path: polygon(100% 0, 100% 100%, 0 0);
        }

        .invoice.shape-hairline::before {
            left: 10mm;
            right: 10mm;
            top: 16mm;
            height: 1px;
            background: #d6dbe2;
        }

        .invoice.shape-soft-corners::before {
            top: 9mm;
            left: 9mm;
            width: 20mm;
            height: 20mm;
            border-radius: 12px;
            background: var(--soft);
        }

        .invoice.shape-soft-divider::before {
            left: 10mm;
            right: 10mm;
            top: 22mm;
            height: 12mm;
            background: linear-gradient(90deg, transparent, var(--soft-strong), transparent);
        }

        .invoice.shape-top-line::before {
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: var(--accent);
        }

        .invoice.shape-rule-box::before {
            top: 7mm;
            right: 7mm;
            width: 25mm;
            height: 14mm;
            border: 1px solid var(--border-strong);
            border-radius: 12px;
        }

        .invoice.shape-black-bar::before {
            top: 0;
            left: 0;
            width: 8mm;
            bottom: 0;
            background: #111111;
            opacity: 0.05;
        }

        .header {
            position: relative;
            z-index: 1;
            margin-bottom: 8mm;
            padding-bottom: 5mm;
            border-bottom: 1px solid #edf0f4;
        }

        .header-ribbon,
        .spotlight-band,
        .editorial-bar {
            height: 4px;
            width: 100%;
            background: linear-gradient(90deg, var(--accent), var(--accent-2));
            border-radius: 999px;
            margin-bottom: 4mm;
        }

        .editorial-bar {
            width: 36mm;
        }

        .top-badge,
        .letterhead-top,
        .executive-pill,
        .header-inline-title {
            display: inline-flex;
            align-items: center;
            border: 1px solid var(--border);
            background: var(--soft);
            color: var(--accent);
            padding: 2mm 4mm;
            border-radius: 999px;
            font-size: 10px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            font-weight: 700;
        }

        .top-badge--soft {
            margin-bottom: 4mm;
        }

        .letterhead-top {
            margin-bottom: 4mm;
            border-radius: 4px;
        }

        .header-row {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 6mm;
        }

        .header-row--spread {
            margin-top: 4mm;
        }

        .header--centered,
        .header--elegant {
            text-align: center;
        }

        .header--centered .header-center-logo,
        .header--elegant .header-row,
        .header--centered .header-row {
            justify-content: center;
        }

        .header--sidebar {
            display: grid;
            grid-template-columns: 5mm 1fr;
            gap: 5mm;
        }

        .header-rail {
            border-radius: 999px;
            background: linear-gradient(180deg, var(--accent), var(--accent-2));
        }

        .header-main,
        .header-panel,
        .capsule-shell {
            width: 100%;
        }

        .header-panel,
        .capsule-shell {
            border: 1px solid var(--border);
            background: var(--soft);
            border-radius: 18px;
            padding: 5mm;
        }

        .header--frame {
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 5mm;
        }

        .frame-cap {
            display: inline-block;
            margin-bottom: 3mm;
            padding: 1.5mm 3mm;
            border-radius: 999px;
            background: var(--soft);
            color: var(--accent);
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
        }

        .structured-divider {
            height: 1px;
            background: linear-gradient(90deg, var(--accent), transparent);
            margin: 4mm 0;
        }

        .merchant-logo-wrap {
            display: flex;
            align-items: center;
            gap: 4mm;
        }

        .merchant-logo-frame {
            min-width: 34mm;
            min-height: 18mm;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .merchant-logo {
            width: 34mm;
            max-height: 16mm;
            object-fit: contain;
            display: block;
        }

        .merchant-caption {
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.16em;
            color: #6b7280;
            margin-bottom: 1mm;
        }

        .merchant-display {
            font-size: 12px;
            font-weight: 700;
            color: var(--accent);
        }

        .seller-block {
            flex: 1;
        }

        .kicker,
        .section-eyebrow {
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.14em;
            font-size: 9px;
            font-weight: 700;
            margin-bottom: 1.5mm;
        }

        .merchant-company {
            font-family: var(--display-font);
            font-size: 20px;
            line-height: 1.2;
            color: var(--ink);
            margin-bottom: 1.5mm;
        }

        .design-caption {
            font-size: 10px;
            color: var(--accent);
            font-weight: 700;
        }

        .meta-stack,
        .meta-row {
            display: flex;
            gap: 4mm;
            flex-wrap: wrap;
        }

        .meta-row {
            margin-top: 4mm;
            justify-content: flex-end;
        }

        .meta-row--wide {
            justify-content: center;
        }

        .meta-card {
            min-width: 42mm;
            border: 1px solid var(--border);
            background: #ffffff;
            border-radius: 14px;
            padding: 3.5mm 4mm;
            box-shadow: 0 4px 16px var(--shadow);
        }

        .meta-label {
            font-size: 8.5px;
            text-transform: uppercase;
            letter-spacing: 0.14em;
            color: #6b7280;
            margin-bottom: 1.5mm;
            font-weight: 700;
        }

        .meta-value {
            font-size: 11px;
            font-weight: 800;
            color: var(--ink);
        }

        .meta-code {
            font-family: "Courier New", monospace;
            word-break: break-all;
        }

        .details {
            position: relative;
            z-index: 1;
            margin-bottom: 7mm;
        }

        .details--grid,
        .details--cards,
        .details--matrix {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 4mm;
        }

        .details--cards .info-card:nth-child(2) {
            transform: translateY(2mm);
        }

        .details--stacked {
            display: grid;
            gap: 4mm;
        }

        .details-pair,
        .details--columns {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 4mm;
        }

        .details-column-right {
            display: grid;
            gap: 4mm;
        }

        .info-card {
            border: 1px solid #e8ebf0;
            border-radius: 16px;
            background: #ffffff;
            padding: 5mm;
            box-shadow: 0 8px 20px rgba(15, 23, 42, 0.03);
        }

        .info-card--address {
            background: linear-gradient(180deg, #ffffff, var(--soft));
        }

        .section-title {
            font-family: var(--display-font);
            font-size: 15px;
            line-height: 1.25;
            color: var(--ink);
            margin-bottom: 3mm;
        }

        .section-title--center {
            text-align: center;
        }

        .section-title--tight {
            margin-bottom: 2mm;
        }

        .address-copy {
            font-size: 11px;
            line-height: 1.7;
            color: #475569;
            font-weight: 600;
        }

        .data-list {
            display: grid;
            gap: 3mm;
        }

        .data-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 4mm;
            padding-bottom: 2.5mm;
            border-bottom: 1px solid #eef2f7;
            font-size: 10.5px;
        }

        .data-row:last-child {
            border-bottom: none;
            padding-bottom: 0;
        }

        .data-row span {
            color: #64748b;
            font-weight: 600;
        }

        .data-row strong {
            color: var(--ink);
            font-weight: 800;
            text-align: right;
            word-break: break-word;
        }

        .value-multiline {
            display: inline-block;
            line-height: 1.45;
            white-space: normal;
        }

        .table-section {
            margin-bottom: 7mm;
        }

        .section-heading-row {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 4mm;
            margin-bottom: 3mm;
        }

        .section-note {
            font-size: 9.5px;
            color: var(--accent);
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
        }

        .table-shell {
            overflow: hidden;
            border-radius: 16px;
            border: 1px solid #e6e9ef;
            background: #ffffff;
        }

        .invoice-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
        }

        .invoice-table th,
        .invoice-table td {
            padding: 3.4mm 3mm;
            border-bottom: 1px solid #edf1f5;
            text-align: center;
        }

        .invoice-table th {
            font-size: 8.75px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #ffffff;
            background: var(--accent);
        }

        .invoice-table td {
            color: #334155;
            font-weight: 700;
            white-space: nowrap;
        }

        .invoice-table .align-left {
            text-align: left;
        }

        .table-total td {
            font-weight: 900;
            color: var(--ink);
            background: var(--soft);
        }

        .table-shell--striped tbody tr:nth-child(odd) td,
        .table-shell--soft tbody tr:nth-child(odd) td,
        .table-shell--rose tbody tr:nth-child(odd) td,
        .table-shell--olive tbody tr:nth-child(odd) td,
        .table-shell--steel tbody tr:nth-child(odd) td,
        .table-shell--capsule tbody tr:nth-child(odd) td {
            background: #fafbfd;
        }

        .table-shell--gold-rule {
            border-color: var(--accent-2);
        }

        .table-shell--gold-rule .invoice-table th {
            background: var(--accent);
            border-bottom: 2px solid var(--accent-2);
        }

        .table-shell--classic .invoice-table th,
        .table-shell--lined .invoice-table th,
        .table-shell--mono .invoice-table th {
            background: #ffffff;
            color: var(--ink);
            border-bottom: 1.5px solid var(--accent);
        }

        .table-shell--lined .invoice-table td,
        .table-shell--mono .invoice-table td {
            border-bottom: 1px solid #dde2e8;
        }

        .table-shell--minimal-accent .invoice-table th {
            background: var(--soft-strong);
            color: var(--accent);
        }

        .table-shell--header-strip .invoice-table th {
            background: linear-gradient(90deg, var(--accent), var(--accent-2));
        }

        .table-shell--capsule {
            border-radius: 22px;
        }

        .table-shell--capsule .invoice-table th:first-child {
            border-top-left-radius: 18px;
        }

        .table-shell--capsule .invoice-table th:last-child {
            border-top-right-radius: 18px;
        }

        .summary {
            display: grid;
            grid-template-columns: minmax(0, 1.25fr) minmax(0, 0.95fr);
            gap: 4mm;
            margin-bottom: 7mm;
            align-items: stretch;
        }

        .summary-block,
        .paid-card {
            border: 1px solid #e8ebf0;
            border-radius: 18px;
            background: #ffffff;
            padding: 5mm;
        
        }

        .summary-block {
            background: linear-gradient(180deg, #ffffff, var(--soft));
        }

        .summary-lines {
            display: grid;
            gap: 2.5mm;
        }

        .summary-line {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 4mm;
            padding-bottom: 2mm;
            border-bottom: 1px solid #edf1f5;
            font-size: 11px;
        }

        .summary-line:last-child {
            border-bottom: none;
            padding-bottom: 0;
        }

        .summary-line span {
            color: #64748b;
            font-weight: 700;
        }

        .summary-line strong {
            color: var(--ink);
            font-weight: 900;
        }

        .paid-card {
            background: var(--accent);
            color: #ffffff;
            display: flex;
            flex-direction: column;
            justify-content: center;
            box-shadow: 0 12px 24px var(--shadow);
        }

        .paid-label {
            font-size: 10px;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            opacity: 0.92;
            margin-bottom: 2mm;
            font-weight: 700;
        }

        .paid-value {
            font-size: 28px;
            font-weight: 900;
            line-height: 1.1;
        }

        .summary--band {
            grid-template-columns: 1fr;
        }

        .summary--band .paid-card {
            min-height: 28mm;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
        }

        .summary--card .paid-card {
            align-items: center;
            text-align: center;
        }

        .summary--split .summary-block,
        .summary--totals-right .summary-block,
        .summary--stamp .summary-block,
        .summary--inline .summary-block {
            order: 1;
        }

        .summary--split .paid-card {
            justify-self: start;
            align-items: flex-start;
            text-align: left;
        }

        .summary--totals-right .paid-card {
            justify-self: end;
            align-items: flex-end;
            text-align: right;
        }

        .summary--stamp .paid-card {
            border-radius: 24px;
            transform: rotate(-1deg);
            justify-self: center;
            align-items: center;
            text-align: center;
        }

        .summary--inline .paid-card {
            background: linear-gradient(135deg, var(--accent), var(--accent-2));
            justify-self: end;
            align-items: flex-end;
            text-align: right;
        }

        .summary--band .paid-label {
            margin-bottom: 0;
        }

        .summary--band .paid-value {
            text-align: right;
        }

        .terms-block {
            border: 1px solid #e8ebf0;
            border-radius: 16px;
            padding: 5mm;
            background: #ffffff;
            margin-bottom: 8mm;
        }

        .terms-list {
            list-style: none;
            display: grid;
            gap: 2.5mm;
        }

        .terms-list li {
            position: relative;
            padding-left: 5mm;
            font-size: 10.5px;
            line-height: 1.65;
            color: #475569;
            font-weight: 600;
        }

        .terms-list li::before {
            content: "";
            position: absolute;
            top: 1.7mm;
            left: 0;
            width: 2mm;
            height: 2mm;
            border-radius: 50%;
            background: var(--accent);
        }

        .signature-block {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 6mm;
            margin-top: auto;
            padding-top: 3mm;
        }

        .signature-date {
            font-size: 10.5px;
            color: #64748b;
            font-weight: 700;
        }

        .signature-box {
            min-width: 60mm;
            text-align: center;
        }

        .signature-line {
            width: 100%;
            height: 1px;
            background: #94a3b8;
            margin-bottom: 2mm;
        }

        .signature-label {
            font-size: 10px;
            color: var(--ink);
            text-transform: uppercase;
            letter-spacing: 0.12em;
            font-weight: 700;
        }

        ${merchantInfo.key === "apextech" ? `
        .invoice {
            display: flex;
            flex-direction: column;
        }
        .invoice .header {
            margin-bottom: 10mm;
        }
        .invoice .details {
            margin-bottom: 10mm;
        }
        .invoice .details--grid {
            gap: 6mm;
            align-items: stretch;
        }
        .invoice .info-card {
            min-height: 100%;
        }
        .invoice .table-section {
            margin-bottom: 10mm;
            margin-top: 6mm;
        }
        .invoice .summary {
            margin-bottom: 10mm;
            gap: 6mm;
            margin-top: 8mm;
        }
        .invoice .terms-block {
            margin-top: auto;
            margin-bottom: 0;
        }
        .invoice .header--ribbon .header-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            align-items: center;
        }
        .invoice .seller-block {
            text-align: center;
            margin-top: 7mm;
        }
        .invoice .merchant-company {
            text-align: center;
        }
        .invoice .info-card {
            text-align: center;
        }
        .invoice .info-card .section-title,
        .invoice .info-card .address-copy,
        .invoice .info-card .data-list,
        .invoice .info-card .data-row,
        .invoice .info-card .data-row span,
        .invoice .info-card .data-row strong {
            text-align: center;
        }
        .invoice .info-card .data-list,
        .invoice .info-card .address-copy {
            margin-top: 4mm;
        }
        .invoice .merchant-logo-wrap {
            justify-content: flex-start;
        }
        .invoice .merchant-logo-frame {
            min-width: 42mm;
            min-height: 22mm;
        }
        .invoice .merchant-logo {
            width: 42mm;
            max-height: 20mm;
        }
        .invoice .meta-stack {
            width: 100%;
            flex-direction: row;
            justify-content: flex-end;
            align-items: stretch;
            gap: 6mm;
        }
        .invoice .meta-card {
            min-width: 34mm;
            padding: 3mm 3.5mm;
            box-shadow: none;
            border-width: 2px;
            
        }
        .invoice .meta-label,
        .invoice .meta-value {
            text-align: center;
        }
        .invoice .info-card .data-row {
            gap: 1mm;
            justify-content: center;
            padding-bottom: 3.5mm;
        }
        .invoice .info-card .data-row span {
            padding-right: 6mm;
        }
        .invoice .summary {
            grid-template-columns: 1fr;
            justify-items: center;
            gap: 2mm;
        }
        .invoice .paid-card {
            align-items: center;
            justify-content: center;
            text-align: center;
            width: 100%;
            max-width: 68mm;
            min-height: 28mm;
            margin: 0 auto;
        }
        .invoice .paid-label,
        .invoice .paid-value {
            text-align: center;
        }
        .invoice .summary-block {
            width: 100%;
            max-width: 100%;
        }
        .invoice .terms-block {
            margin-top: -2mm;
        }
        .invoice .meta-row {
            justify-content: flex-end;
        }
        .invoice,
        .invoice .merchant-company,
        .invoice .design-caption,
        .invoice .meta-label,
        .invoice .meta-value,
        .invoice .section-title,
        .invoice .section-eyebrow,
        .invoice .address-copy,
        .invoice .data-row span,
        .invoice .data-row strong,
        .invoice .invoice-table td,
        .invoice .summary-line span,
        .invoice .summary-line strong,
        .invoice .terms-list li {
            color: #111111 !important;
        }
        ` : ""}

        @media print {
            body {
                background: #ffffff;
            }

            .page {
                max-width: none;
            }

            .invoice {
                border: none;
                box-shadow: none;
            }

            @page {
                size: A4 portrait;
                margin: 0;
            }

            .invoice,
            .meta-card,
            .paid-card,
            .summary-block,
            .info-card,
            .table-total td,
            .invoice-table th,
            .top-badge,
            .letterhead-top,
            .executive-pill,
            .header-inline-title,
            .header-panel,
            .capsule-shell {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }

        @media screen and (max-width: 900px) {
            .header-row,
            .summary,
            .details--grid,
            .details--cards,
            .details--matrix,
            .details-pair,
            .details--columns,
            .meta-row,
            .meta-stack,
            .signature-block,
            .section-heading-row {
                grid-template-columns: 1fr;
                flex-direction: column;
            }

            .meta-card,
            .paid-card,
            .summary-block,
            .info-card {
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="invoice">
            ${renderHeader(design, merchantInfo, escapeHtml(invoiceNumberToDisplay), escapeHtml(rrnValue))}
            ${renderInfoSection(design, fields, merchantInfo)}
            ${renderTableSection(design, descriptionText, formattedAmount, merchantInfo)}
            ${renderSummarySection(design, formattedAmount, merchantInfo)}
            ${renderTermsSection(receiptEntityName)}
        </div>
    </div>
</body>
</html>`;
};
