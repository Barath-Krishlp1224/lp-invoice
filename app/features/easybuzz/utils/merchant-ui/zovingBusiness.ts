import { renderGenericMerchantInvoiceHTML } from "./shared";
import type { MerchantInvoiceRenderContext } from "./types";

export const renderZovingBusinessInvoiceHTML = (context: MerchantInvoiceRenderContext) =>
    renderGenericMerchantInvoiceHTML("zoving_business", context);

