import { EventEmitter } from "eventemitter3";
import type { PageSummary } from "../types/index.js";

export interface FandomEvents {
  ready: [];
  warn: [Error];
  pageFetched: [PageSummary];
}

export class FandomEmitter extends EventEmitter<FandomEvents> {}
