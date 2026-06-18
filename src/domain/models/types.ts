export interface Vigencia {
  IdVigencia: string;
  Nombre: string;
  Anio: number;
  Estado: 'Borrador' | 'Activo' | 'Cerrado' | 'Historico';
  FechaInicio: string;
  FechaCierre?: string;
  Param_TS: number;
  Param_HorasEfectivas: number;
  Param_JornadaDiaria: number;
  Activo: boolean;
}

export interface FactorFrecuencia {
  IdFactor: number;
  IdVigencia: string;
  Nombre: string;
  FactorMensual: number;
  EsSistema: boolean;
}

export interface TipoProceso {
  IdTipoProceso: number;
  Codigo: string;
  Nombre: string;
  EsSistema: boolean;
}

export interface EstructuraJerarquica {
  IdNodoOrg: string;
  IdVigencia: string;
  IdPadre: string | null;
  Nivel: number;
  CodigoInterno: string;
  Nombre: string;
  Activo: boolean;
}

export interface EstructuraProcesos {
  IdNodoProceso: string;
  IdVigencia: string;
  IdPadre: string | null;
  IdTipoProceso: number | null;
  Nivel: number;
  CodigoInterno: string;
  Nombre: string;
  Producto?: string;
  Activo: boolean;
}

export interface MapaRelaciones {
  IdMapa: number;
  IdVigencia: string;
  IdNodoOrg: string;
  IdNodoProceso: string;
  ObservacionRelacion?: string;
}

export interface Cargo {
  IdCargo: number;
  IdVigencia: string;
  CodigoDANE?: string;
  Denominacion: string;
  Grado?: string;
  NivelJerarquico: string;
  Activo: boolean;
}

export interface Organismo {
  id: string;
  vigenciaId?: string;
  nombre: string;
  parentId?: string;
  codigo?: string;
  nivel?: number;
  estado?: 'Activo' | 'Inactivo';
}

export interface Dependencia {
  id: string;
  vigenciaId?: string;
  parentId: string;
  nombre: string;
  codigo?: string;
  nivel?: number;
  estado?: 'Activo' | 'Inactivo';
}

export interface Proceso {
  id: string;
  vigenciaId?: string;
  dependenciaId: string;
  nombre: string;
  codigo?: string;
  estado?: 'Activo' | 'Inactivo';
  procesoId?: string; // Optional for sub-procesos / Nivel 2
}

export interface Procedimiento {
  id: string;
  vigenciaId?: string;
  procesoId: string;
  nombre: string;
  codigo?: string;
  estado?: 'Activo' | 'Inactivo';
}

export interface Actividad {
  id: string;
  vigenciaId?: string;
  procedimientoId: string;
  nombre: string;
  codigo?: string;
  estado?: 'Activo' | 'Inactivo';
}

export type Module = 'inicio' | 'dashboard' | 'estructura' | 'captura' | 'reportes' | 'admin' | 'configuracion';

export type ViewMode = 'organizacional' | 'procedimental' | 'general';

export interface Relacion {
  id: string;
  parentId: string;
  childId: string;
  type: 'Dependencia' | 'Proceso' | 'Procedimiento' | 'Actividad';
  includedChildren?: boolean;
}

export type UserRole = 'Funcionario' | 'Analista' | 'Administrador' | 'AdminFuncional';

export interface User {
  id: string;
  nombre: string;
  email: string;
  // Estos campos se mantienen temporalmente por compatibilidad con UI
  rol?: UserRole;
  organismoId?: string;
  dependenciaId?: string;
}

export interface VigenciaUsuario {
  idVigenciaUsuario: string;
  idVigencia: string;
  idUsuario: string;
  idOrganismo?: string;
  idDependencia?: string; // Si el usuario está restringido a capturar/ver una dependencia
  rol: UserRole;
}
