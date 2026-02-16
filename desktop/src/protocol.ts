/*
    Offers a function called once which registers all protocols bnefore app ready
 */

import { protocol } from "electron";
import { registerPdfProtocol } from "./pdf.js";
import { registerImageProtocol } from "./image.js";

/**
 * Called once before app ready to define protocol schemes
 */
export function registerProtocols() {
  registerPdfProtocol(protocol);
  registerImageProtocol(protocol);
}