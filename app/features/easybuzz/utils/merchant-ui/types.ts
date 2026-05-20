export type MerchantInvoiceFields = {
    addressHtml: string;
    customerName: string;
    upiId: string;
    transactionDate: string;
    transactionDateOnly: string;
    transactionTimeOnly: string;
    transactionDateHtml: string;
    rrnValue: string;
};

export type MerchantInvoiceRenderContext = {
    merchantInfo: any;
    invoiceNumberToDisplay: string;
    rrnValue: string;
    formattedAmount: string;
    transactionDateTimeDisplay?: string;
    receiptEntityName: string;
    descriptionText: string;
    fields: MerchantInvoiceFields;
};

