import { createProjectionService } from "../projection/createProjectionService";
import { ExcelImporter } from "./ExcelImporter";

/**
 * Composition root for `ExcelImporter` — wires it with the default
 * `ProjectionService` (used to detect lost carry-forward history on import).
 */
export function createExcelImporter(): ExcelImporter {
  const projectionService = createProjectionService();
  return new ExcelImporter((profile) => projectionService.buildSeries(profile));
}
