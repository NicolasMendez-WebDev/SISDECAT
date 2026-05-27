import {
  organismos,
  dependencias,
  procesos,
  procedimientos,
  actividades,
} from "../../data/mockData";
import { User } from "../../domain/models/types";

const SIMULATED_DELAY_MS = 400;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const catalogService = {
  getOrganismos: async () => {
    await delay(SIMULATED_DELAY_MS);
    return organismos;
  },
  getDependencias: async () => {
    await delay(SIMULATED_DELAY_MS);
    return dependencias;
  },
  getProcesos: async () => {
    await delay(SIMULATED_DELAY_MS);
    return procesos;
  },
  getProcedimientos: async () => {
    await delay(SIMULATED_DELAY_MS);
    return procedimientos;
  },
  getActividades: async () => {
    await delay(SIMULATED_DELAY_MS);
    return actividades;
  },
};
