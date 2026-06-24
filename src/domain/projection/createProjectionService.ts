import { createHealthScoreService } from "../scoring/createHealthScoreService";
import { ProjectionService } from "./ProjectionService";

/** Composition root for ProjectionService — wires it with the default HealthScoreService. */
export function createProjectionService(): ProjectionService {
  return new ProjectionService(createHealthScoreService());
}
