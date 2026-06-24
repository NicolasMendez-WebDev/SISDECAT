import React from "react";
import { User as UserIcon, HelpCircle, CheckCircle2 } from "lucide-react";

interface AssignmentSettingsProps {
  formData: any;
  setFormData: (data: any) => void;
  currentUser: any;
}

export const AssignmentSettings: React.FC<AssignmentSettingsProps> = ({
  formData,
  setFormData,
  currentUser,
}) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border transition-all duration-300 ${!formData.actividadId ? "border-slate-100 opacity-60 pointer-events-none" : "border-slate-200"}`}
    >
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2 rounded-t-xl">
        <UserIcon
          size={18}
          className={
            !formData.actividadId ? "text-slate-400" : "text-institutional-blue"
          }
        />
        <h2 className="font-bold text-slate-700 uppercase text-xs tracking-wider">
          Paso 2: Asignación
        </h2>
      </div>
      <div className="px-6 pt-4 pb-0">
        <div className="p-3 bg-blue-50/50 rounded-lg flex items-start gap-2 border border-blue-100/50">
          <HelpCircle size={14} className="text-blue-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-blue-700/80 leading-relaxed font-medium">
            2. Especifique quién realiza la labor, cuánto produce (Q) y con qué
            periodicidad.
          </p>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-500 uppercase">
            Ejecutor de la Tarea
          </label>
          <div className="relative">
            <select
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-institutional-blue/20 focus:border-institutional-blue outline-none transition-all appearance-none"
              value={formData.rolEjecutor}
              onChange={(e) =>
                setFormData({ ...formData, rolEjecutor: e.target.value })
              }
              // Bloquear si el usuario es Funcionario
              disabled={currentUser.rol === "Funcionario"}
            >
              <option value="">Seleccione Nivel</option>
              <option value="Asistencial">Asistencial</option>
              <option value="Técnico">Técnico</option>
              <option value="Profesional">Profesional</option>
              <option value="Asesor">Asesor</option>
              <option value="Directivo">Directivo</option>
            </select>
            {currentUser.rol === "Funcionario" && formData.rolEjecutor && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">
                <CheckCircle2 size={12} />
                Autocompletado
              </div>
            )}
          </div>
          {currentUser.rol === "Funcionario" && (
            <p className="text-[10px] text-slate-400 font-medium italic mt-1">
              * El nivel de ejecutor se ha asignado automáticamente basado en su
              perfil.
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-500 uppercase">
            Cantidad de veces
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="any"
              placeholder="Ej. Inspecciones por turno"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-institutional-blue/20 focus:border-institutional-blue outline-none transition-all pl-8"
              value={formData.volumenQ}
              onKeyDown={(e) => {
                if (e.key === "-" || e.key === "e") e.preventDefault();
              }}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || parseFloat(val) > 0) {
                  setFormData({ ...formData, volumenQ: val });
                }
              }}
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-medium">
              Q
            </span>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-500 uppercase">
            Frecuencia
          </label>
          <select
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-institutional-blue/20 focus:border-institutional-blue outline-none transition-all"
            value={formData.frecuencia}
            onChange={(e) =>
              setFormData({ ...formData, frecuencia: e.target.value })
            }
          >
            <option value="Diario">Diario</option>
            <option value="Semanal">Semanal</option>
            <option value="Quincenal">Quincenal</option>
            <option value="Mensual">Mensual</option>
            <option value="Bimestral">Bimestral</option>
            <option value="Trimestral">Trimestral</option>
            <option value="Semestral">Semestral</option>
            <option value="Anual">Anual</option>
          </select>
        </div>
      </div>
    </div>
  );
};
