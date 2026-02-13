/*
    Offers a function called once which registers all protocols bnefore app ready
 */

import { protocol } from "electron";
import { registerPdfProtocol } from "./pdf";
import { registerImageProtocol } from "./image";

/**
 * Called once before app ready to define protocol schemes
 */
export function registerProtocols() {
  registerPdfProtocol(protocol);
  registerImageProtocol(protocol);
}