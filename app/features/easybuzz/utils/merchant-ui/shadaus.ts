import { renderGenericMerchantInvoiceHTML } from "./shared";
import type { MerchantInvoiceRenderContext } from "./types";

export const renderShadausInvoiceHTML = (context: MerchantInvoiceRenderContext) =>
    renderGenericMerchantInvoiceHTML("shadaus", context);

