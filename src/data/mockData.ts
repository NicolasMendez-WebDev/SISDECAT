/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vigencia, FactorFrecuencia, TipoProceso, EstructuraJerarquica, EstructuraProcesos, MapaRelaciones, Cargo } from '../domain/models/types';
import { Organismo, Dependencia, Proceso, Procedimiento, Actividad } from '../domain/models/types';

// ==========================================================================
// MOCK DATA VACÍA PARA ENTORNO DE PRUEBAS LIMPIO
// ==========================================================================

export const vigenciasMock: Vigencia[] = [];

export const factoresFrecuenciaMock: FactorFrecuencia[] = [
  { IdFactor: 1, IdVigencia: 'vig-dummy', Nombre: 'Diaria (22 veces al mes)', FactorMensual: 22.0, EsSistema: true },
  { IdFactor: 2, IdVigencia: 'vig-dummy', Nombre: 'Semanal (4.33 veces al mes)', FactorMensual: 4.333333, EsSistema: true },
  { IdFactor: 3, IdVigencia: 'vig-dummy', Nombre: 'Quincenal (2 veces al mes)', FactorMensual: 2.0, EsSistema: true },
  { IdFactor: 4, IdVigencia: 'vig-dummy', Nombre: 'Mensual (1 vez al mes)', FactorMensual: 1.0, EsSistema: true },
  { IdFactor: 5, IdVigencia: 'vig-dummy', Nombre: 'Bimestral (0.5 veces al mes)', FactorMensual: 0.5, EsSistema: true },
  { IdFactor: 6, IdVigencia: 'vig-dummy', Nombre: 'Trimestral (0.33 veces al mes)', FactorMensual: 0.333333, EsSistema: true },
  { IdFactor: 7, IdVigencia: 'vig-dummy', Nombre: 'Semestral (0.166 veces al mes)', FactorMensual: 0.166667, EsSistema: true },
  { IdFactor: 8, IdVigencia: 'vig-dummy', Nombre: 'Anual (0.083 veces al mes)', FactorMensual: 0.083333, EsSistema: true },
];

export const tiposProcesoMock: TipoProceso[] = [
  { IdTipoProceso: 1, Codigo: 'ESTRATEGICO', Nombre: 'Estratégico', EsSistema: true },
  { IdTipoProceso: 2, Codigo: 'MISIONAL', Nombre: 'Misional', EsSistema: true },
  { IdTipoProceso: 3, Codigo: 'APOYO', Nombre: 'Apoyo', EsSistema: true },
  { IdTipoProceso: 4, Codigo: 'EVALUACION', Nombre: 'Evaluación', EsSistema: true },
  { IdTipoProceso: 5, Codigo: 'TRANSVERSAL', Nombre: 'Transversal', EsSistema: true },
];

export const estructuraJerarquicaMock: EstructuraJerarquica[] = [];

export const estructuraProcesosMock: EstructuraProcesos[] = [];

export const mapaRelacionesMock: MapaRelaciones[] = [];

export const usuariosMock = [
  {
    id: "USR-DEV",
    nombre: "Desarrollador SISDECAT",
    rol: "AdminFuncional" as const,
    email: "dev@sisdecat.gov.co",
  },
  {
    id: "USR-001",
    nombre: "Juan Pérez",
    rol: "Funcionario" as const,
    email: "juan.perez@sisdecat.gov.co",
  },
  {
    id: "USR-002",
    nombre: "Ana Gómez",
    rol: "Analista" as const,
    email: "ana.gomez@sisdecat.gov.co",
  },
  {
    id: "USR-003",
    nombre: "Carlos López",
    rol: "Administrador" as const,
    email: "carlos.lopez@sisdecat.gov.co",
  },
];

export const vigenciasUsuariosMock = [];

export const cargosMock: Cargo[] = [];

export const cargasTrabajoMock: any[] = [];

// Computed exports for legacy support during transition
export const organismos: Organismo[] = [];
export const dependencias: Dependencia[] = [];
export const procesos: Proceso[] = [];
export const procedimientos: Procedimiento[] = [];
export const actividades: Actividad[] = [];
