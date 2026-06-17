import React from "react";
import { History, HelpCircle, AlertTriangle } from "lucide-react";
import { CALC_CONFIG } from "../../../application/utils/calculations";

interface TimeCaptureProps {
  formData: any;
  setFormData: (data: any) => void;
  mathError: boolean;
}

export const TimeCapture: React.FC<TimeCaptureProps> = ({
  formData,
  setFormData,
  mathError,
}) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border transition-all duration-300 ${!formData.rolEjecutor || !formData.volumenQ || !formData.frecuencia ? "border-slate-100 opacity-60 pointer-events-none" : "border-slate-200"}`}
    >
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2 rounded-t-xl">
        <History
          size={18}
          className={
            !formData.rolEjecutor || !formData.volumenQ || !formData.frecuencia
              ? "text-slate-400"
              : "text-institutional-blue"
          }
        />
        <h2 className="font-bold text-slate-700 uppercase text-xs tracking-wider">
          Paso 3: Tiempos
        </h2>
      </div>
      <div className="px-6 pt-4 pb-0">
        <div className="p-3 bg-blue-50/50 rounded-lg flex items-start gap-2 border border-blue-100/50">
          <HelpCircle size={14} className="text-blue-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-blue-700/80 leading-relaxed font-medium">
            3. Seleccione la unidad de medida e Ingrese los tiempos optimista
            (mín), más probable (norm), y pesimista (máx) por ciclo.
          </p>
        </div>
      </div>
      <div className="p-6 space-y-4">
        {/* Unidad de Medida */}
        <div className="space-y-1.5 border-b border-slate-100 pb-4">
          <label className="text-[11px] font-semibold text-slate-500 uppercase">
            Unidad de Medida
          </label>
          <div className="flex gap-2 w-full mt-2">
            {Object.keys(CALC_CONFIG.MATRIZ_TIEMPOS).map((unit) => (
              <button
                key={unit}
                onClick={() =>
                  setFormData({
                    ...formData,
                    unidadTiempo: unit.toLowerCase(),
                  })
                }
                className={`flex-1 py-1.5 px-1 text-[10px] font-bold uppercase rounded border transition-all ${
                  formData.unidadTiempo === unit.toLowerCase()
                    ? "bg-institutional-blue text-white border-institutional-blue"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                }`}
              >
                {unit}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 italic mt-2">
            {formData.unidadTiempo
              ? "Unidad seleccionada. Ingrese los tiempos en secuencia."
              : "Seleccione la unidad de tiempo para habilitar los tiempos mínimos y máximos"}
          </p>
        </div>

        {/* Tiempos PERT */}
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1.5">
            <div className="group relative inline-flex items-center gap-1 cursor-help w-full">
              <label className="text-[11px] font-black text-rose-500 uppercase border-b border-dashed border-rose-300">
                Tm
              </label>
            </div>
            <input
              type="number"
              min="0"
              placeholder="0"
              disabled={!formData.unidadTiempo}
              className={`w-full px-2 py-2 border rounded-lg text-sm outline-none transition-all ${!formData.unidadTiempo ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed" : mathError ? "bg-white border-red-300 focus:ring-2 focus:ring-red-100" : "bg-white border-slate-200 focus:ring-2 focus:ring-institutional-blue/20"}`}
              value={formData.tiempoMin}
              onKeyDown={(e) => {
                if (e.key === "-" || e.key === "e") e.preventDefault();
              }}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || parseFloat(val) >= 0) {
                  setFormData({ ...formData, tiempoMin: val });
                }
              }}
            />
          </div>
          <div className="space-y-1.5">
            <div className="group relative inline-flex items-center gap-1 cursor-help w-full">
              <label className="text-[11px] font-black text-emerald-600 uppercase border-b border-dashed border-emerald-300">
                Tn
              </label>
            </div>
            <input
              type="number"
              min="0"
              placeholder="0"
              disabled={!formData.tiempoMin}
              className={`w-full px-2 py-2 border rounded-lg text-sm outline-none transition-all ${!formData.tiempoMin ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed" : mathError ? "bg-white border-red-300 focus:ring-2 focus:ring-red-100" : "bg-white border-slate-200 focus:ring-2 focus:ring-institutional-blue/20"}`}
              value={formData.tiempoNormal}
              onKeyDown={(e) => {
                if (e.key === "-" || e.key === "e") e.preventDefault();
              }}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || parseFloat(val) >= 0) {
                  setFormData({ ...formData, tiempoNormal: val });
                }
              }}
            />
          </div>
          <div className="space-y-1.5">
            <div className="group relative inline-flex items-center gap-1 cursor-help w-full">
              <label className="text-[11px] font-black text-amber-500 uppercase border-b border-dashed border-amber-300">
                TM
              </label>
            </div>
            <input
              type="number"
              min="0"
              placeholder="0"
              disabled={!formData.tiempoNormal}
              className={`w-full px-2 py-2 border rounded-lg text-sm outline-none transition-all ${!formData.tiempoNormal ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed" : mathError ? "bg-white border-red-300 focus:ring-2 focus:ring-red-100" : "bg-white border-slate-200 focus:ring-2 focus:ring-institutional-blue/20"}`}
              value={formData.tiempoMax}
              onKeyDown={(e) => {
                if (e.key === "-" || e.key === "e") e.preventDefault();
              }}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || parseFloat(val) >= 0) {
                  setFormData({ ...formData, tiempoMax: val });
                }
              }}
            />
          </div>
        </div>

        {mathError && (
          <div className="flex flex-col gap-1.5 p-3 bg-red-50 text-red-600 rounded-lg text-[11px] font-medium border border-red-100 mt-2">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} />
              <span>Restricción de Integridad (Error)</span>
            </div>
            <span className="text-red-500 text-[10px] pl-6">
              {formData.tiempoMax === ""
                ? "Asegúrese que: Tm ≤ Tn (El tiempo normal no puede ser menor al mínimo)."
                : "Asegúrese que: Tm ≤ Tn ≤ TM (El tiempo mínimo no puede ser mayor al normal o máximo)."
              }
            </span>
          </div>
        )}

        {!mathError &&
          formData.tiempoMin &&
          formData.tiempoNormal &&
          formData.tiempoMax &&
          parseFloat(formData.tiempoMin) === parseFloat(formData.tiempoNormal) &&
          parseFloat(formData.tiempoNormal) === parseFloat(formData.tiempoMax) && (
            <div className="flex flex-col gap-1.5 p-3 bg-amber-50 text-amber-700 rounded-lg text-[11px] font-medium border border-amber-200 mt-2">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-500" />
                <span className="font-bold uppercase tracking-wider text-[10px]">Alerta de Calidad (Soft-Warning)</span>
              </div>
              <span className="text-amber-600 text-[10px] pl-6">
                Ha ingresado tiempos idénticos (Flat-Time). Esto anula las ventajas de correlación del algoritmo Beta-PERT. Sin embargo, el sistema le permitirá registrarlo si así lo requiere la medición.
              </span>
            </div>
          )}
      </div>
    </div>
  );
};
