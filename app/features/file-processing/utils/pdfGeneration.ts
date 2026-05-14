// @ts-nocheck

const MM_TO_PX = 96 / 25.4;
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PDF_MARGIN_MM = 8;
const PDF_RENDER_SCALE = 4;
const A4_PAGE_WIDTH = `${A4_WIDTH_MM}mm`;
const A4_PAGE_HEIGHT = `${A4_HEIGHT_MM}mm`;
const A4_PAGE_WIDTH_PX = Math.round(A4_WIDTH_MM * MM_TO_PX);
const A4_PAGE_HEIGHT_PX = Math.round(A4_HEIGHT_MM * MM_TO_PX);
const PAGE_ROOT_SELECTORS = [
    '.invoice-wrapper',
    '.invoice-container',
    '.container',
    '.invoice',
];
const PDF_LAYOUT_OVERRIDES = `
    html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        min-height: auto !important;
        background: #ffffff !important;
        overflow: hidden !important;
    }

    body > * {
        width: 100% !important;
    }

    .invoice-wrapper,
    .invoice-container,
    .container,
    .invoice {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 auto !important;
        box-sizing: border-box !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
    }

    table,
    thead,
    tbody,
    tfoot,
    tr,
    td,
    th,
    section,
    article,
    .info-card,
    .detail-box,
    .billing-item,
    .id-row,
    .terms,
    .terms-section,
    .summary-section,
    .line-items,
    .invoice-body,
    .invoice-content {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
    }

    img,
    svg,
    canvas {
        max-width: 100% !important;
        height: auto !important;
    }
`;

const waitForImageLoad = (image) => new Promise((resolve) => {
    if (!image || image.complete) {
        resolve();
        return;
    }

    const finish = () => {
        image.removeEventListener('load', finish);
        image.removeEventListener('error', finish);
        resolve();
    };

    image.addEventListener('load', finish, { once: true });
    image.addEventListener('error', finish, { once: true });
});

const waitForFonts = async () => {
    if (document.fonts?.ready) {
        try {
            await document.fonts.ready;
        } catch {
            // Ignore font readiness failures and continue rendering.
        }
    }
};

const getPrimaryPageRoot = (element) => {
    for (const selector of PAGE_ROOT_SELECTORS) {
        const match = element.querySelector(selector);
        if (match) {
            return match;
        }
    }

    return element.firstElementChild || element;
};

const buildPdfFragment = (htmlContent) => {
    const parser = new DOMParser();
    const parsedDocument = parser.parseFromString(String(htmlContent || ''), 'text/html');
    const fragment = document.createDocumentFragment();
    const styleTag = document.createElement('style');
    styleTag.textContent = PDF_LAYOUT_OVERRIDES;
    fragment.appendChild(styleTag);

    Array.from(parsedDocument.head.querySelectorAll('style, link[rel="stylesheet"]')).forEach((node) => {
        fragment.appendChild(node.cloneNode(true));
    });

    Array.from(parsedDocument.body.childNodes).forEach((node) => {
        fragment.appendChild(node.cloneNode(true));
    });

    return fragment;
};

const waitForNextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));

export const createPdfRenderContainer = () => {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '-99999px';
    container.style.zIndex = '-1';
    container.style.opacity = '0';
    container.style.pointerEvents = 'none';
    container.style.width = `${A4_PAGE_WIDTH_PX}px`;
    container.style.height = `${A4_PAGE_HEIGHT_PX}px`;
    container.style.background = '#ffffff';
    container.style.overflow = 'hidden';
    container.style.display = 'flex';
    container.style.alignItems = 'flex-start';
    container.style.justifyContent = 'center';
    document.body.appendChild(container);
    return container;
};

export const createPdfSourceElement = (htmlContent) => {
    const element = document.createElement('div');
    element.style.width = A4_PAGE_WIDTH;
    element.style.height = A4_PAGE_HEIGHT;
    element.style.background = '#ffffff';
    element.style.overflow = 'hidden';
    element.style.position = 'relative';
    element.style.boxSizing = 'border-box';
    element.style.display = 'flex';
    element.style.alignItems = 'flex-start';
    element.style.justifyContent = 'center';
    element.style.padding = `${PDF_MARGIN_MM}mm`;

    const content = document.createElement('div');
    content.style.width = '100%';
    content.style.height = '100%';
    content.style.background = '#ffffff';
    content.style.boxSizing = 'border-box';
    content.style.overflow = 'hidden';
    content.style.display = 'flex';
    content.style.alignItems = 'flex-start';
    content.style.justifyContent = 'center';
    content.appendChild(buildPdfFragment(htmlContent));

    element.appendChild(content);
    return element;
};

export const preparePdfSourceElement = async (element) => {
    const content = element.firstElementChild || element;
    const pageRoot = getPrimaryPageRoot(content);

    pageRoot.style.width = '100%';
    pageRoot.style.maxWidth = '100%';
    pageRoot.style.margin = '0 auto';
    pageRoot.style.boxSizing = 'border-box';
    pageRoot.style.transformOrigin = 'top center';

    Array.from(content.querySelectorAll('*')).forEach((node) => {
        node.style.boxSizing = 'border-box';
    });

    await Promise.all(Array.from(content.querySelectorAll('img')).map(waitForImageLoad));
    await waitForFonts();
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));

    const availableWidth = A4_PAGE_WIDTH_PX - (PDF_MARGIN_MM * 2 * MM_TO_PX);
    const availableHeight = A4_PAGE_HEIGHT_PX - (PDF_MARGIN_MM * 2 * MM_TO_PX);
    const rect = pageRoot.getBoundingClientRect();
    const measuredWidth = Math.max(rect.width, pageRoot.scrollWidth, 1);
    const measuredHeight = Math.max(rect.height, pageRoot.scrollHeight, 1);
    const scale = Math.min(
        1,
        availableWidth / measuredWidth,
        availableHeight / measuredHeight
    );

    if (scale < 1) {
        pageRoot.style.transform = `scale(${scale})`;
        content.style.height = `${measuredHeight * scale}px`;
    } else {
        pageRoot.style.transform = 'scale(1)';
        content.style.height = '100%';
    }

    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
};

export const getInvoicePdfOptions = () => ({
    margin: [0, 0, 0, 0],
    image: { type: 'jpeg', quality: 1 },
    html2canvas: {
        scale: PDF_RENDER_SCALE,
        logging: false,
        allowTaint: true,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: A4_PAGE_WIDTH_PX,
        windowHeight: A4_PAGE_HEIGHT_PX,
        width: A4_PAGE_WIDTH_PX,
        height: A4_PAGE_HEIGHT_PX,
        scrollX: 0,
        scrollY: 0,
    },
    jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
        compress: true,
    },
    pagebreak: {
        mode: [],
        before: [],
        after: [],
        avoid: [],
    },
});

const renderInvoiceCanvasFromHtml = async (htmlContent) => {
    if (typeof window.html2pdf !== 'function') {
        throw new Error('PDF library not fully loaded. Please wait a moment and try again.');
    }

    const tempContainer = createPdfRenderContainer();
    const element = createPdfSourceElement(htmlContent);
    tempContainer.appendChild(element);

    try {
        await preparePdfSourceElement(element);

        const worker = window.html2pdf()
            .set(getInvoicePdfOptions())
            .from(element)
            .toCanvas();

        const canvas = await worker.get('canvas');
        if (!canvas) {
            throw new Error('Failed to render invoice canvas.');
        }

        return canvas;
    } finally {
        if (document.body.contains(tempContainer)) {
            document.body.removeChild(tempContainer);
        }
    }
};

const createPdfWorkerFromHtml = async (htmlContent) => {
    if (typeof window.html2pdf !== 'function') {
        throw new Error('PDF library not fully loaded. Please wait a moment and try again.');
    }

    const tempContainer = createPdfRenderContainer();
    const element = createPdfSourceElement(htmlContent);
    tempContainer.appendChild(element);

    try {
        await preparePdfSourceElement(element);

        const worker = window.html2pdf()
            .set(getInvoicePdfOptions())
            .from(element)
            .toPdf();

        const pdf = await worker.get('pdf');
        if (!pdf) {
            throw new Error('Failed to generate invoice PDF.');
        }

        while (pdf.getNumberOfPages() > 1) {
            pdf.deletePage(pdf.getNumberOfPages());
        }

        return { worker, pdf, tempContainer };
    } catch (error) {
        if (document.body.contains(tempContainer)) {
            document.body.removeChild(tempContainer);
        }
        throw error;
    }
};

export const generatePdfBlobFromHtml = async (htmlContent) => {
    let worker;
    let tempContainer;
    try {
        ({ worker, tempContainer } = await createPdfWorkerFromHtml(htmlContent));

        return await worker
            .output('blob');
    } finally {
        if (tempContainer && document.body.contains(tempContainer)) {
            document.body.removeChild(tempContainer);
        }
    }
};

export const generateMergedPdfBlobFromHtmlList = async (htmlContents) => {
    const pages = Array.isArray(htmlContents)
        ? htmlContents.filter((content) => Boolean(String(content || '').trim()))
        : [];

    if (pages.length === 0) {
        throw new Error('No invoice pages available to merge.');
    }

    const { worker, pdf, tempContainer } = await createPdfWorkerFromHtml(pages[0]);

    try {
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        for (let index = 1; index < pages.length; index += 1) {
            const canvas = await renderInvoiceCanvasFromHtml(pages[index]);
            pdf.addPage();

            pdf.addImage(
                canvas.toDataURL('image/jpeg', 1),
                'JPEG',
                0,
                0,
                pageWidth,
                pageHeight,
                undefined,
                'FAST'
            );

            if (index % 3 === 0) {
                await waitForNextFrame();
            }
        }

        return await worker.output('blob');
    } finally {
        if (tempContainer && document.body.contains(tempContainer)) {
            document.body.removeChild(tempContainer);
        }
    }
};

export const triggerBlobDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const printPdfBlob = async (blob) => {
    const blobUrl = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');

    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');

    const cleanup = () => {
        if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
        }
        URL.revokeObjectURL(blobUrl);
    };

    return new Promise((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
            cleanup();
            reject(new Error('Timed out while preparing the print preview.'));
        }, 20000);

        iframe.onload = () => {
            window.clearTimeout(timeoutId);

            try {
                const frameWindow = iframe.contentWindow;
                if (!frameWindow) {
                    cleanup();
                    reject(new Error('Unable to open print preview.'));
                    return;
                }

                frameWindow.focus();
                frameWindow.print();
                window.setTimeout(cleanup, 60000);
                resolve(undefined);
            } catch (error) {
                cleanup();
                reject(error);
            }
        };

        document.body.appendChild(iframe);
        iframe.src = blobUrl;
    });
};

export const openPdfBlobPreview = (blob, windowName = '_blank') => {
    const blobUrl = URL.createObjectURL(blob);
    const previewWindow = window.open(blobUrl, windowName);

    if (!previewWindow) {
        URL.revokeObjectURL(blobUrl);
        throw new Error('Could not open print preview. Please disable pop-up blockers.');
    }

    window.setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
    }, 60000);

    return previewWindow;
};

export const createUniqueFilenameTracker = () => new Map();

export const getUniquePdfBasename = (baseName, tracker) => {
    const safeBaseName = String(baseName || 'invoice').trim() || 'invoice';
    const currentCount = tracker.get(safeBaseName) || 0;
    tracker.set(safeBaseName, currentCount + 1);

    if (currentCount === 0) {
        return safeBaseName;
    }

    return `${safeBaseName}_${currentCount + 1}`;
};

export const sanitizePdfPathSegment = (value, fallback = 'invoice') => {
    const normalizedValue = String(value || '')
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
        .replace(/\s+/g, ' ')
        .trim();

    return normalizedValue || fallback;
};
