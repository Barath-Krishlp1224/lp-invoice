import { renderApextechInvoiceHTML } from "./apextech";
import { renderByteBlissInvoiceHTML } from "./byteBliss";
import { renderByteEvolveInvoiceHTML } from "./byteEvolve";
import { renderBytesNapseInvoiceHTML } from "./bytesNapse";
import { renderBytesSparkzInvoiceHTML } from "./bytesSparkz";
import { renderCipherByteInvoiceHTML } from "./cipherByte";
import { renderCodeHorizonInvoiceHTML } from "./codeHorizon";
import { renderLogicNookInvoiceHTML } from "./logicNook";
import { renderNovalogicInvoiceHTML } from "./novalogic";
import { renderOrionbyteInvoiceHTML } from "./orionbyte";
import { renderShadausInvoiceHTML } from "./shadaus";
import { renderTechterraInvoiceHTML } from "./techterra";
import { renderVoltiqInvoiceHTML } from "./voltiq";
import { renderZovingBusinessInvoiceHTML } from "./zovingBusiness";

export const merchantUiRegistry: Record<string, (context: any) => string> = {
    apextech: renderApextechInvoiceHTML,
    bytes_napse: renderBytesNapseInvoiceHTML,
    bytes_sparkz: renderBytesSparkzInvoiceHTML,
    byte_bliss: renderByteBlissInvoiceHTML,
    byteevolve: renderByteEvolveInvoiceHTML,
    cipher_byte: renderCipherByteInvoiceHTML,
    code_horizon: renderCodeHorizonInvoiceHTML,
    logic_nook: renderLogicNookInvoiceHTML,
    novalogic: renderNovalogicInvoiceHTML,
    orionbyte: renderOrionbyteInvoiceHTML,
    shadaus: renderShadausInvoiceHTML,
    techterra: renderTechterraInvoiceHTML,
    voltiq: renderVoltiqInvoiceHTML,
    zoving_business: renderZovingBusinessInvoiceHTML,
};
