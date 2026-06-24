import { ExportData } from "./ExportData";

/**
 * Small, focused export abstraction (ISP) — depended on by the UI layer
 * (DIP) so the concrete export mechanism (SheetJS today) can be swapped
 * later without touching callers.
 */
export interface Exporter {
  export(data: ExportData, fileName: string): void;
}
