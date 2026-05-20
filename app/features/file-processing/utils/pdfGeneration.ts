// @ts-nocheck

const MM_TO_PX = 96 / 25.4;
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PDF_MARGIN_MM = 8;
const A4_PAGE_WIDTH = `${A4_WIDTH_MM}mm`;
const A4_PAGE_HEIGHT = `${A4_HEIGHT_MM}mm`;
const A4_PAGE_WIDTH_PX = Math.round(A4_WIDTH_MM * MM_TO_PX);
const A4_PAGE_HEIGHT_PX = Math.round(A4_HEIGHT_MM * MM_TO_PX);
export const MAX_OPTIMIZED_OUTPUT_BYTES = 5 * 1024 * 1024;
const MIN_SINGLE_ARTIFACT_BYTES = 160 * 1024;
const PDF_RENDER_PROFILES = [
    { scale: 3.2, imageType: 'png' },
    { scale: 2.8, imageType: 'png' },
    { scale: 2.4, imageType: 'png' },
    { scale: 2.1, imageType: 'png' },
    { scale: 1.8, imageType: 'png' },
    { scale: 1.5, imageType: 'png' },
    { scale: 1.2, imageType: 'png' },
];
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
const formatBytes = (value) => {
    if (!Number.isFinite(value) || value <= 0) {
        return '0 B';
    }

    if (value < 1024) {
        return `${Math.round(value)} B`;
    }

    if (value < 1024 * 1024) {
        return `${(value / 1024).toFixed(1)} KB`;
    }

    return `${(value / (1024 * 1024)).toFixed(2)} MB`;
};

const getRecommendedProfileIndex = (pageCount, maxBytes = MAX_OPTIMIZED_OUTPUT_BYTES) => {
    const safePages = Math.max(1, Number(pageCount) || 1);
    const perPageBudget = Math.max(1, Math.floor(maxBytes / safePages));

    if (safePages <= 2 && perPageBudget >= 1024 * 1024) return 0;
    if (safePages <= 4 && perPageBudget >= 768 * 1024) return 1;
    if (safePages <= 8 && perPageBudget >= 512 * 1024) return 2;
    if (perPageBudget >= 320 * 1024) return 3;
    if (perPageBudget >= 220 * 1024) return 4;
    if (perPageBudget >= 160 * 1024) return 5;
    return PDF_RENDER_PROFILES.length - 1;
};

const buildSizeLimitError = (label, maxBytes, optimizedSize) => {
    const error = new Error(
        `${label} could not be optimized below ${formatBytes(maxBytes)}. `
        + `Best generated size: ${formatBytes(optimizedSize)}. `
        + 'Please reduce the number of invoices in a single merged export.'
    );
    error.code = 'PDF_SIZE_LIMIT_EXCEEDED';
    error.maxBytes = maxBytes;
    error.optimizedSize = optimizedSize;
    return error;
};

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

export const getInvoicePdfOptions = (renderProfile = PDF_RENDER_PROFILES[0]) => ({
    margin: [0, 0, 0, 0],
    image: { type: renderProfile.imageType, quality: 1 },
    html2canvas: {
        scale: renderProfile.scale,
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

export const isPdfRuntimeReady = () => (
    typeof window !== 'undefined'
    && typeof window.html2pdf === 'function'
);

const canvasToBlob = async (canvas, mimeType = 'image/png') => (
    new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error('Failed to create invoice image.'));
                return;
            }

            resolve(blob);
        }, mimeType);
    })
);

const renderInvoicePngFromHtml = async (htmlContent, renderProfile = PDF_RENDER_PROFILES[0]) => {
    const canvas = await renderInvoiceCanvasFromHtml(htmlContent, renderProfile);
    return {
        dataUrl: canvas.toDataURL('image/png'),
    };
};

const renderInvoiceCanvasFromHtml = async (htmlContent, renderProfile = PDF_RENDER_PROFILES[0]) => {
    if (typeof window.html2pdf !== 'function') {
        throw new Error('PDF library not fully loaded. Please wait a moment and try again.');
    }

    const tempContainer = createPdfRenderContainer();
    const element = createPdfSourceElement(htmlContent);
    tempContainer.appendChild(element);

    try {
        await preparePdfSourceElement(element);

        const worker = window.html2pdf()
            .set(getInvoicePdfOptions(renderProfile))
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

const createPdfWorkerFromHtml = async (htmlContent, renderProfile = PDF_RENDER_PROFILES[0]) => {
    if (typeof window.html2pdf !== 'function') {
        throw new Error('PDF library not fully loaded. Please wait a moment and try again.');
    }

    const tempContainer = createPdfRenderContainer();
    const element = createPdfSourceElement(htmlContent);
    tempContainer.appendChild(element);

    try {
        await preparePdfSourceElement(element);

        const worker = window.html2pdf()
            .set(getInvoicePdfOptions(renderProfile))
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

const buildPdfBlobFromHtml = async (htmlContent, renderProfile) => {
    let worker;
    let tempContainer;
    try {
        ({ worker, tempContainer } = await createPdfWorkerFromHtml(htmlContent, renderProfile));
        return await worker.output('blob');
    } finally {
        if (tempContainer && document.body.contains(tempContainer)) {
            document.body.removeChild(tempContainer);
        }
    }
};

const buildMergedPdfBlobFromHtmlList = async (pages, renderProfile, options = {}) => {
    const { worker, pdf, tempContainer } = await createPdfWorkerFromHtml(pages[0], renderProfile);
    const onPageProgress = typeof options.onPageProgress === 'function' ? options.onPageProgress : null;

    try {
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        onPageProgress?.(1, pages.length);

        for (let index = 1; index < pages.length; index += 1) {
            const { dataUrl } = await renderInvoicePngFromHtml(pages[index], renderProfile);
            pdf.addPage();
            pdf.addImage(
                dataUrl,
                'PNG',
                0,
                0,
                pageWidth,
                pageHeight,
                undefined,
                'FAST'
            );
            onPageProgress?.(index + 1, pages.length);

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

const generateOptimizedPdfBlob = async (producer, {
    maxBytes = MAX_OPTIMIZED_OUTPUT_BYTES,
    pageCount = 1,
    label = 'PDF export',
    onAttemptProgress,
} = {}) => {
    const safeMaxBytes = Math.max(MIN_SINGLE_ARTIFACT_BYTES, Number(maxBytes) || MAX_OPTIMIZED_OUTPUT_BYTES);
    const startingIndex = getRecommendedProfileIndex(pageCount, safeMaxBytes);
    const totalAttempts = Math.max(1, PDF_RENDER_PROFILES.length - startingIndex);
    let smallestBlob = null;
    let smallestSize = Number.POSITIVE_INFINITY;
    let lastError = null;

    for (let profileIndex = startingIndex; profileIndex < PDF_RENDER_PROFILES.length; profileIndex += 1) {
        const renderProfile = PDF_RENDER_PROFILES[profileIndex];
        const attemptNumber = (profileIndex - startingIndex) + 1;

        onAttemptProgress?.({
            stage: 'optimizing',
            status: 'rendering',
            attempt: attemptNumber,
            totalAttempts,
            renderScale: renderProfile.scale,
        });

        try {
            const blob = await producer(renderProfile);
            const blobSize = blob?.size || 0;

            onAttemptProgress?.({
                stage: 'optimizing',
                status: blobSize <= safeMaxBytes ? 'accepted' : 'retrying',
                attempt: attemptNumber,
                totalAttempts,
                renderScale: renderProfile.scale,
                blobSize,
                maxBytes: safeMaxBytes,
            });

            if (blobSize < smallestSize) {
                smallestBlob = blob;
                smallestSize = blobSize;
            }

            if (blobSize <= safeMaxBytes) {
                return blob;
            }
        } catch (error) {
            lastError = error;
            onAttemptProgress?.({
                stage: 'optimizing',
                status: 'retrying',
                attempt: attemptNumber,
                totalAttempts,
                renderScale: renderProfile.scale,
                error: error?.message || 'Optimization retry',
            });
        }

        await waitForNextFrame();
    }

    if (smallestBlob) {
        throw buildSizeLimitError(label, safeMaxBytes, smallestSize);
    }

    throw lastError || new Error(`Failed to generate ${label}.`);
};

export const generatePdfBlobFromHtml = async (htmlContent, options = {}) => {
    return generateOptimizedPdfBlob(
        (renderProfile) => buildPdfBlobFromHtml(htmlContent, renderProfile),
        {
            maxBytes: options.maxBytes,
            pageCount: 1,
            label: options.label || 'Invoice PDF',
        }
    );
};

export const generateMergedPdfBlobFromHtmlList = async (htmlContents, options = {}) => {
    const pages = Array.isArray(htmlContents)
        ? htmlContents.filter((content) => Boolean(String(content || '').trim()))
        : [];

    if (pages.length === 0) {
        throw new Error('No invoice pages available to merge.');
    }

    return generateOptimizedPdfBlob(
        (renderProfile) => buildMergedPdfBlobFromHtmlList(pages, renderProfile, {
            onPageProgress: options.onPageProgress,
        }),
        {
            maxBytes: options.maxBytes,
            pageCount: pages.length,
            label: options.label || 'Merged PDF',
            onAttemptProgress: options.onOptimizationProgress,
        }
    );
};

export const generateSplitMergedPdfEntriesFromHtmlList = async (htmlContents, {
    baseFilename = 'Merged_All',
    label = 'Merged PDF',
    maxBytes = MAX_OPTIMIZED_OUTPUT_BYTES,
    onProgress,
} = {}) => {
    const pages = Array.isArray(htmlContents)
        ? htmlContents.filter((content) => Boolean(String(content || '').trim()))
        : [];

    if (pages.length === 0) {
        throw new Error('No invoice pages available to merge.');
    }

    const blobs = [];
    let processedPages = 0;
    const totalPages = pages.length;
    const emitProgress = (completedPages) => {
        if (typeof onProgress !== 'function') {
            return;
        }

        const boundedCompletedPages = Math.max(0, Math.min(totalPages, completedPages));
        onProgress({
            stage: 'merge',
            completedPages: boundedCompletedPages,
            totalPages,
            percent: totalPages > 0 ? Math.round((boundedCompletedPages / totalPages) * 100) : 0,
        });
    };

    const processChunk = async (chunkPages) => {
        try {
            const mergedBlob = await generateMergedPdfBlobFromHtmlList(chunkPages, {
                maxBytes,
                label,
                onPageProgress: (completedChunkPages) => {
                    emitProgress(processedPages + completedChunkPages);
                },
                onOptimizationProgress: (optimizationMeta) => {
                    onProgress?.({
                        ...optimizationMeta,
                        stage: 'optimizing',
                        completedPages: processedPages,
                        totalPages,
                        chunkPages: chunkPages.length,
                    });
                },
            });
            blobs.push(mergedBlob);
            processedPages += chunkPages.length;
            emitProgress(processedPages);
        } catch (error) {
            if (error?.code === 'PDF_SIZE_LIMIT_EXCEEDED' && chunkPages.length > 1) {
                const midPoint = Math.ceil(chunkPages.length / 2);
                await processChunk(chunkPages.slice(0, midPoint));
                await processChunk(chunkPages.slice(midPoint));
                return;
            }

            throw error;
        }
    };

    await processChunk(pages);

    return blobs.map((blob, index) => ({
        blob,
        filename: blobs.length === 1
            ? `${baseFilename}.pdf`
            : `${baseFilename}_Part_${index + 1}.pdf`,
    }));
};

export const buildZipBlob = async (files, options = {}) => {
    if (!window?.JSZip) {
        throw new Error('ZIP library not fully loaded. Please wait a moment and try again.');
    }

    const { onProgress, ...zipOptions } = options;
    const zip = new window.JSZip();
    files.forEach((file) => {
        zip.file(file.filename || file.path, file.blob);
    });

    return zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 },
        ...zipOptions,
    }, typeof onProgress === 'function' ? onProgress : undefined);
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
