import React from "react";
import { FolderTree, HelpCircle } from "lucide-react";
import {
  Organismo,
  Dependencia,
  Proceso,
  Procedimiento,
  Actividad,
} from "../../../domain/models/types";

interface HierarchySelectionProps {
  formData: any;
  handleOrganismoChange: (id: string) => void;
  handleDependenciaChange: (id: string) => void;
  handleProcesoChange: (id: string) => void;
  handleProcedimientoChange: (id: string) => void;
  handleActividadChange: (id: string) => void;
  organismos: Organismo[];
  filteredDependencias: Dependencia[];
  filteredProcesos: Proceso[];
  filteredProcedimientos: Procedimiento[];
  filteredActividades: Actividad[];
  isFuncionario?: boolean;
}

export const HierarchySelection: React.FC<HierarchySelectionProps> = ({
  formData,
  handleOrganismoChange,
  handleDependenciaChange,
  handleProcesoChange,
  handleProcedimientoChange,
  handleActividadChange,
  organismos,
  filteredDependencias,
  filteredProcesos,
  filteredProcedimientos,
  filteredActividades,
  isFuncionario,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
        <FolderTree size={18} className="text-institutional-blue" />
        <h2 className="font-bold text-slate-700 uppercase text-xs tracking-wider">
          Paso 1: Jerarquía Organizacional
        </h2>
      </div>
      <div className="px-6 pt-4 pb-0">
        <div className="p-3 bg-blue-50/50 rounded-lg flex items-start gap-2 border border-blue-100/50">
          <HelpCircle size={14} className="text-blue-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-blue-700/80 leading-relaxed font-medium">
            1. Seleccione la ruta exacta de la actividad que desea medir, desde
            el nivel más alto hasta la actividad final.
          </p>
        </div>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-500 uppercase">
            Organismo
          </label>
          <select
            className={`w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-institutional-blue/20 focus:border-institutional-blue outline-none transition-all ${isFuncionario ? "opacity-75 cursor-not-allowed bg-slate-50" : ""}`}
            value={formData.organismoId}
            onChange={(e) => handleOrganismoChange(e.target.value)}
            disabled={isFuncionario}
          >
            <option value="">Seleccione Organismo</option>
            {organismos.map((org) => (
              <option key={org.id} value={org.id}>
                {org.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-500 uppercase">
            Dependencia
          </label>
          <select
            className={`w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-institutional-blue/20 focus:border-institutional-blue outline-none transition-all ${!formData.organismoId || isFuncionario ? "opacity-75 cursor-not-allowed bg-slate-50" : ""}`}
            value={formData.dependenciaId}
            onChange={(e) => handleDependenciaChange(e.target.value)}
            disabled={!formData.organismoId || isFuncionario}
          >
            <option value="">Seleccione Dependencia</option>
            {filteredDependencias.map((dep) => (
              <option key={dep.id} value={dep.id}>
                {dep.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-500 uppercase">
            Proceso
          </label>
          <select
            className={`w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-institutional-blue/20 focus:border-institutional-blue outline-none transition-all ${!formData.dependenciaId ? "opacity-50 cursor-not-allowed bg-slate-50" : ""}`}
            value={formData.procesoId}
            onChange={(e) => handleProcesoChange(e.target.value)}
            disabled={!formData.dependenciaId}
          >
            <option value="">Seleccione Proceso</option>
            {filteredProcesos.map((proc) => (
              <option key={proc.id} value={proc.id}>
                {proc.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-500 uppercase">
            Procedimiento
          </label>
          <select
            className={`w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-institutional-blue/20 focus:border-institutional-blue outline-none transition-all ${(filteredProcedimientos.length === 0) ? "opacity-50 cursor-not-allowed bg-slate-50" : ""}`}
            value={formData.procedimientoId}
            onChange={(e) => handleProcedimientoChange(e.target.value)}
            disabled={filteredProcedimientos.length === 0}
          >
            <option value="">Seleccione Procedimiento</option>
            {filteredProcedimientos.map((proc) => (
              <option key={proc.id} value={proc.id}>
                {proc.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-1 md:col-span-2 space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-500 uppercase">
            Actividad
          </label>
          <select
            className={`w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-institutional-blue/20 focus:border-institutional-blue outline-none transition-all ${!formData.procedimientoId ? "opacity-50 cursor-not-allowed bg-slate-50" : ""}`}
            value={formData.actividadId}
            onChange={(e) => handleActividadChange(e.target.value)}
            disabled={!formData.procedimientoId}
          >
            <option value="">Seleccione Actividad</option>
            {filteredActividades.map((act) => (
              <option key={act.id} value={act.id}>
                {act.nombre}
              </option>
            ))}
            {formData.procedimientoId && (
              <option value="actividad_no_documentada" className="font-bold uppercase bg-slate-50">
                ACTIVIDAD NO DOCUMENTADA
              </option>
            )}
          </select>
          {formData.actividadId === "actividad_no_documentada" && (
            <div className="pt-3 space-y-3">
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                <label className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-2">
                  Nombre de la Actividad
                  <span className="text-red-500 text-xs">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ingrese el nombre de la nueva actividad aquí..."
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-institutional-blue/30 focus:ring-2 focus:ring-institutional-blue/20 outline-none transition-all placeholder:text-slate-400"
                  value={formData.descripcionActividad || ""}
                  onChange={(e) => {
                    const descEvent = { target: { value: e.target.value } };
                    if (formData.onChangeDescripcionActividad) {
                      formData.onChangeDescripcionActividad(e.target.value);
                    }
                  }}
                />
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2 shadow-sm animate-in fade-in">
                <HelpCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed text-amber-800 font-medium">
                  <strong>IMPORTANTE:</strong> Por favor, cerciórese del nivel jerárquico previamente seleccionado antes de inducir una nueva actividad. Búsquela de forma exhaustiva en el listado para evitar duplicidades antes de documentarla como nueva.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
