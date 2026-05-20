import { renderGenericMerchantInvoiceHTML } from "./shared";
import type { MerchantInvoiceRenderContext } from "./types";

export const renderTechterraInvoiceHTML = (context: MerchantInvoiceRenderContext) =>
    renderGenericMerchantInvoiceHTML("techterra", context);

