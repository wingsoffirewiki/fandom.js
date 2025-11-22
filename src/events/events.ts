import { EventEmitter } from "eventemitter3";
import type {
  PageSummary,
  RecentChange,
  FileUploadEvent,
  UserBlockEvent,
} from "../types/index.js";

export interface FandomEvents {
  ready: [];
  warn: [Error];
  pageFetched: [PageSummary];
  pageUpdate: [RecentChange];
  pageCreate: [RecentChange];
  fileUpload: [FileUploadEvent];
  userBlock: [UserBlockEvent];
}

export class FandomEmitter extends EventEmitter<FandomEvents> {}
