import { renderGenericMerchantInvoiceHTML } from "./shared";
import type { MerchantInvoiceRenderContext } from "./types";

export const renderOrionbyteInvoiceHTML = (context: MerchantInvoiceRenderContext) =>
    renderGenericMerchantInvoiceHTML("orionbyte", context);

