import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FolderTree,
  User as UserIcon,
  History,
  Calculator,
  ClipboardEdit,
  BarChart3,
  Search,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Building2,
  FileText,
  HelpCircle,
  X,
  Trash2,
} from "lucide-react";
import { Actividad, User, Organismo, Dependencia, Proceso, Procedimiento } from "../../domain/models/types";
import { CargasTable } from "../components/shared/CargasTable";
import { RecordDetailsModal } from "../components/shared/RecordDetailsModal";
import {
  calculateETP,
  CALC_CONFIG,
} from "../../application/utils/calculations";
import { HierarchySelection } from "../components/Captura/HierarchySelection";
import { AssignmentSettings } from "../components/Captura/AssignmentSettings";
import { TimeCapture } from "../components/Captura/TimeCapture";

interface CapturaModuleProps {
  currentUser: User;
  organismos: Organismo[];
  dependencias: Dependencia[];
  procesos: Proceso[];
  procedimientos: Procedimiento[];
  actividades: Actividad[];
  cargas: any[];
  cargos?: any[];
  factores?: any[];
  vigenciaActiva?: boolean;
  relaciones: {
    type: string;
    childId: string;
    parentId: string;
    includedChildren?: string[];
  }[];
  onSave: (data: any) => void;
  onDelete?: (id: string) => void;
  isLoadingRecords?: boolean;
}

export const CapturaModule: React.FC<CapturaModuleProps> = ({
  currentUser,
  organismos,
  dependencias,
  procesos,
  procedimientos,
  actividades,
  cargas,
  cargos = [],
  factores = [],
  vigenciaActiva,
  relaciones,
  onSave,
  onDelete,
  isLoadingRecords
}) => {
  const initialFormState = {
    organismoId: currentUser?.organismoId || "",
    dependenciaId: currentUser?.dependenciaId || "",
    procesoId: "",
    procedimientoId: "",
    actividadId: "",
    descripcionActividad: "",
    rolEjecutor: "",
    volumenQ: "",
    frecuencia: "",
    unidadTiempo: "",
    tiempoMin: "",
    tiempoNormal: "",
    tiempoMax: "",
  };

  const [formData, setFormData] = useState(initialFormState);
  
  // Sync when currentUser receives its async updates
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      organismoId: currentUser?.organismoId || prev.organismoId,
      dependenciaId: currentUser?.dependenciaId || prev.dependenciaId
    }));
  }, [currentUser?.organismoId, currentUser?.dependenciaId]);
  
  // Enforce defaults on reset
  const resetForm = () => {
    setFormData({
      ...initialFormState,
      organismoId: currentUser?.organismoId || "",
      dependenciaId: currentUser?.dependenciaId || ""
    });
  };
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedRecordDetails, setSelectedRecordDetails] = useState<
    any | null
  >(null);

  const hasSelection = !!formData.procesoId;

  // Filtered lists for cascading selects
  const handleOrganismoChange = (id: string) => {
    setFormData({
      ...initialFormState,
      organismoId: id,
      dependenciaId: "",
    });
  };

  const handleDependenciaChange = (id: string) => {
    setFormData({
      ...initialFormState,
      organismoId: formData.organismoId,
      dependenciaId: id,
    });
  };

  // Recursive helper to find all descendant dependencias of an organism or dependencia
  const getAllDescendantDependencias = useCallback(
    (parentId: string, visited: Set<string> = new Set()): string[] => {
      const pIdLower = String(parentId).toLowerCase().trim();
      if (visited.has(pIdLower)) return [];
      visited.add(pIdLower);
      
      const direct = dependencias
        .filter((d) => d.parentId && String(d.parentId).toLowerCase().trim() === pIdLower)
        .map((d) => d.id);
      const linked = relaciones
        .filter((r) => (r.type === "Dependencia" || r.type === "Organismo-Dependencia") && String(r.parentId).toLowerCase().trim() === pIdLower)
        .map((r) => r.childId);
      const combined = Array.from(new Set([...direct, ...linked])).filter(id => !visited.has(String(id).toLowerCase().trim()));

      let all = [...combined];
      combined.forEach((id) => {
        all = [...all, ...getAllDescendantDependencias(id, visited)];
      });
      return all;
    },
    [dependencias, relaciones],
  );

  const filteredDependencias = useMemo(() => {
    const availableDependenciaIds = formData.organismoId
      ? getAllDescendantDependencias(formData.organismoId).map(id => String(id).toLowerCase().trim())
      : [];
    return dependencias.filter((d) => availableDependenciaIds.includes(String(d.id).toLowerCase().trim()));
  }, [formData.organismoId, dependencias, getAllDescendantDependencias]);

  const filteredProcesos = useMemo(() => {
    let result = procesos.filter(
      (p) =>
        p.dependenciaId === formData.dependenciaId ||
        p.dependenciaId === formData.organismoId ||
        relaciones.some(
          (r) =>
            r.type === "Proceso" &&
            r.childId === p.id &&
            (r.parentId === formData.dependenciaId || r.parentId === formData.organismoId),
        ),
    );
    return result;
  }, [formData.dependenciaId, formData.organismoId, procesos, relaciones]);

  const filteredProcedimientos = useMemo(() => {
    let result = procedimientos.filter(
      (pc) =>
        (formData.procesoId && pc.procesoId === formData.procesoId) ||
        (formData.procesoId && relaciones.some(
          (r) =>
            r.type === "Procedimiento" &&
            r.childId === pc.id &&
            r.parentId === formData.procesoId,
        )) ||
        (!formData.procesoId && formData.dependenciaId && relaciones.some(
          (r) =>
            r.type === "Procedimiento" &&
            r.childId === pc.id &&
            r.parentId === formData.dependenciaId,
        )) ||
        (!formData.procesoId && formData.organismoId && relaciones.some(
          (r) =>
            r.type === "Procedimiento" &&
            r.childId === pc.id &&
            r.parentId === formData.organismoId,
        ))
    );
    const procRelation = formData.procesoId
      ? relaciones.find(
          (r) =>
            r.type === "Proceso" &&
            r.childId === formData.procesoId &&
            (r.parentId === formData.dependenciaId || r.parentId === formData.organismoId),
        )
      : undefined;
    if (procRelation && procRelation.includedChildren && procRelation.includedChildren.length > 0) {
      result = result.filter((pc) =>
        procRelation.includedChildren!.includes(pc.id),
      );
    }
    return result;
  }, [formData.procesoId, formData.dependenciaId, formData.organismoId, procedimientos, relaciones]);

  const filteredActividades = useMemo(() => {
    let result = actividades.filter(
      (a) =>
        a.procedimientoId === formData.procedimientoId ||
        relaciones.some(
          (r) =>
            r.type === "Actividad" &&
            r.childId === a.id &&
            r.parentId === formData.procedimientoId,
        ),
    );
    const pcdRelation = relaciones.find(
      (r) =>
        r.type === "Procedimiento" &&
        r.childId === formData.procedimientoId &&
        r.parentId === formData.procesoId,
    );
    if (pcdRelation && pcdRelation.includedChildren && pcdRelation.includedChildren.length > 0) {
      result = result.filter((a) =>
        pcdRelation.includedChildren!.includes(a.id),
      );
    }

    // Filter activities for Funcionario role (one-time recording per activity)
    if (currentUser.rol === "Funcionario") {
      const userCompletedActivityIds = cargas
        .filter((c) => c.userId === currentUser.id)
        .map((c) => c.actividadId);
      result = result.filter((a) => !userCompletedActivityIds.includes(a.id));
    }
    return result;
  }, [
    formData.procedimientoId,
    formData.procesoId,
    actividades,
    relaciones,
    currentUser,
    cargas,
  ]);

  // Memoized Lookup Maps to avoid O(N^2) searches inside map loops
  const actividadesMap = useMemo(() => {
    const map = new Map<string, string>();
    actividades.forEach((a) => map.set(a.id, a.nombre));
    return map;
  }, [actividades]);

  const dependenciasMap = useMemo(() => {
    const map = new Map<string, string>();
    dependencias.forEach((d) => map.set(d.id, d.nombre));
    return map;
  }, [dependencias]);

  const organismosMap = useMemo(() => {
    const map = new Map<string, string>();
    organismos.forEach((o) => map.set(o.id, o.nombre));
    return map;
  }, [organismos]);

  const procedimientosMap = useMemo(() => {
    const map = new Map<string, string>();
    procedimientos.forEach((p) => map.set(p.id, p.nombre));
    return map;
  }, [procedimientos]);

  const procesosMap = useMemo(() => {
    const map = new Map<string, string>();
    procesos.forEach((p) => map.set(p.id, p.nombre));
    return map;
  }, [procesos]);

  const completedRecords = useMemo(() => {
    return cargas.filter((c) => {
      // En Captura de Cargas, cada usuario ve únicamente sus propios registros,
      // independientemente de su rol.
      return c.userId === currentUser.id || c.autor === currentUser.nombre;
    });
  }, [cargas, currentUser.id]);

  const handleProcesoChange = (id: string) => {
    setFormData({
      ...initialFormState,
      organismoId: formData.organismoId,
      dependenciaId: formData.dependenciaId,
      procesoId: id,
    });
  };

  const handleProcedimientoChange = (id: string) => {
    setFormData({
      ...initialFormState,
      organismoId: formData.organismoId,
      dependenciaId: formData.dependenciaId,
      procesoId: formData.procesoId,
      procedimientoId: id,
    });
  };

  const handleSave = () => {
    if (!formData.actividadId) {
      alert(
        "Error: Debe completar la ruta jerárquica completa antes de guardar.",
      );
      return;
    }

    if (!formData.unidadTiempo) {
      alert("Error: Debe seleccionar una unidad de medida (minutos, horas, etc.).");
      return;
    }

    const tm = parseFloat(formData.tiempoMin) || 0;
    const tn = parseFloat(formData.tiempoNormal) || 0;
    const tM = parseFloat(formData.tiempoMax) || 0;

    // Coherencia Matemática
    if (tn < tm || tn > tM) {
      alert(
        "Error de Coherencia Matemática: El Tiempo Normal (TN) debe estar entre el Mínimo (Tm) y el Máximo (TM).",
      );
      return;
    }

    const isFlatTime = tm === tn && tn === tM && tm > 0;

    if (isFlatTime) {
      if (
        !confirm(
          "Tiempos idénticos detectados. Esto anula la distribución estadística. ¿Está seguro de que esta tarea no tiene variabilidad?",
        )
      ) {
        return;
      }
    }

    onSave({
      ...formData,
      is_flat_time: isFlatTime,
    });

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);

    setFormData((prev) => ({
      ...prev,
      actividadId: "",
      rolEjecutor: "",
      volumenQ: "",
      frecuencia: "Diario",
      unidadTiempo: "",
      tiempoMin: "",
      tiempoNormal: "",
      tiempoMax: "",
    }));
  };

  const results = calculateETP(formData);

  // Validation Flags
  const tm = parseFloat(formData.tiempoMin) || 0;
  const tn = parseFloat(formData.tiempoNormal) || 0;
  const tM = parseFloat(formData.tiempoMax) || 0;

  const mathError = tn > 0 && (tn < tm || tn > tM);
  const flatTimeWarning = tm > 0 && tn > 0 && tM > 0 && tm === tn && tn === tM;

  const timeFactor =
    CALC_CONFIG.MATRIZ_TIEMPOS[
      formData.unidadTiempo as keyof typeof CALC_CONFIG.MATRIZ_TIEMPOS
    ] || 0;
  const tnHrs = tn * timeFactor;
  const workdayWarning = tnHrs > 8;

  const isSaveDisabled =
    !vigenciaActiva ||
    !formData.organismoId ||
    !formData.dependenciaId ||
    !formData.procesoId ||
    !formData.procedimientoId ||
    !formData.actividadId ||
    (formData.actividadId === "actividad_no_documentada" && !formData.descripcionActividad) ||
    !formData.rolEjecutor ||
    !formData.volumenQ ||
    !formData.frecuencia ||
    !formData.tiempoMin ||
    !formData.tiempoNormal ||
    !formData.tiempoMax ||
    mathError;

  // Calculate total ETP for the selected process
  const cargasForSelectedProcess = useMemo(
    () => completedRecords.filter((c) => c.procesoId === formData.procesoId),
    [completedRecords, formData.procesoId],
  );

  const totalEtpForSelectedProcess = useMemo(
    () =>
      cargasForSelectedProcess.reduce((acc, c) => acc + calculateETP(c).ETP, 0),
    [cargasForSelectedProcess],
  );

  // Group by procedure for the distribution chart
  const etpByProcedure = useMemo(() => {
    return filteredProcedimientos
      .map((pcd) => {
        const pcdCargas = completedRecords.filter((c) => c.procedimientoId === pcd.id);
        const sumETP = pcdCargas.reduce(
          (acc, c) => acc + calculateETP(c).ETP,
          0,
        );
        return {
          name: pcd.nombre,
          etp: parseFloat(sumETP.toFixed(2)),
        };
      })
      .filter((p) => p.etp > 0)
      .sort((a, b) => b.etp - a.etp);
  }, [filteredProcedimientos, completedRecords]);

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto relative">
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 20, x: "-50%" }}
            exit={{ opacity: 0, y: -50, x: "-50%" }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="fixed top-0 left-1/2 z-50 bg-white p-4 rounded-xl shadow-2xl border border-slate-200 flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 flex items-center justify-center rounded-full">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="font-bold text-slate-800">¡Éxito!</p>
              <p className="text-sm text-slate-500">
                Registro guardado correctamente.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="space-y-6">
        {/* Tarjeta 1: Jerarquía */}
        <HierarchySelection
          formData={{
            ...formData,
            onChangeDescripcionActividad: (val: string) => setFormData({ ...formData, descripcionActividad: val })
          }}
          handleOrganismoChange={handleOrganismoChange}
          handleDependenciaChange={handleDependenciaChange}
          handleProcesoChange={handleProcesoChange}
          handleProcedimientoChange={handleProcedimientoChange}
          handleActividadChange={(id) => setFormData({
            ...initialFormState,
            organismoId: formData.organismoId,
            dependenciaId: formData.dependenciaId,
            procesoId: formData.procesoId,
            procedimientoId: formData.procedimientoId,
            actividadId: id,
            descripcionActividad: "",
          })}
          organismos={organismos}
          filteredDependencias={filteredDependencias}
          filteredProcesos={filteredProcesos}
          filteredProcedimientos={filteredProcedimientos}
          filteredActividades={filteredActividades}
          isFuncionario={currentUser?.rol === 'Funcionario'}
        />

        <div className={`grid grid-cols-1 gap-6 ${currentUser.rol !== 'Funcionario' ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
          {/* Tarjeta 2: Asignación */}
          <div
            className={`bg-white rounded-xl shadow-sm border transition-all duration-300 ${!formData.actividadId ? "border-slate-100 opacity-60 pointer-events-none" : "border-slate-200"}`}
          >
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2 rounded-t-xl">
              <UserIcon
                size={18}
                className={
                  !formData.actividadId
                    ? "text-slate-400"
                    : "text-institutional-blue"
                }
              />
              <h2 className="font-bold text-slate-700 uppercase text-xs tracking-wider">
                Paso 2: Asignación
              </h2>
            </div>
            <div className="px-6 pt-4 pb-0">
              <div className="p-3 bg-blue-50/50 rounded-lg flex items-start gap-2 border border-blue-100/50">
                <HelpCircle
                  size={14}
                  className="text-blue-400 mt-0.5 shrink-0"
                />
                <p className="text-[11px] text-blue-700/80 leading-relaxed font-medium">
                  2. Especifique quién realiza la labor, cuánto produce (Q) y
                  con qué periodicidad.
                </p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <div className="group relative inline-flex items-center gap-1 cursor-help w-full">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase border-b border-dashed border-slate-300">
                    Nivel de ejecutor
                  </label>
                  <HelpCircle size={10} className="text-slate-400" />
                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[220px] opacity-0 transition-opacity group-hover:opacity-100 bg-slate-800 text-white text-xs rounded-lg py-2 px-3 shadow-xl z-[100] font-normal normal-case text-center">
                    Categoría o nivel jerárquico del empleado que ejecuta la
                    actividad.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-t-[6px] border-t-slate-800 border-x-[6px] border-x-transparent"></div>
                  </div>
                </div>
                <select
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-institutional-blue/20 focus:border-institutional-blue outline-none transition-all"
                  value={formData.rolEjecutor}
                  onChange={(e) =>
                    setFormData({ ...formData, rolEjecutor: e.target.value })
                  }
                >
                  <option value="">Seleccione Nivel</option>
                  {cargos.length > 0 ? (
                    cargos.map((cargo) => (
                      <option key={cargo.IdCargo} value={cargo.Denominacion}>
                        {cargo.Denominacion}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Asistencial">Asistencial</option>
                      <option value="Técnico">Técnico</option>
                      <option value="Profesional">Profesional</option>
                      <option value="Asesor">Asesor</option>
                      <option value="Directivo">Directivo</option>
                    </>
                  )}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="group relative inline-flex items-center gap-1 cursor-help w-full">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase border-b border-dashed border-slate-300">
                      Cantidad de veces
                    </label>
                    <HelpCircle size={10} className="text-slate-400" />
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] opacity-0 transition-opacity group-hover:opacity-100 bg-slate-800 text-white text-xs rounded-lg py-2 px-3 shadow-xl z-[100] font-normal normal-case text-center">
                      Periodicidad con la que se ejecuta la actividad (Diaria,
                      Mensual, etc).
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-t-[6px] border-t-slate-800 border-x-[6px] border-x-transparent"></div>
                    </div>
                  </div>
                  <select
                    disabled={!formData.rolEjecutor}
                    className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition-all ${!formData.rolEjecutor ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed" : "bg-white border-slate-200 focus:ring-2 focus:ring-institutional-blue/20 focus:border-institutional-blue"}`}
                    value={formData.frecuencia}
                    onChange={(e) =>
                      setFormData({ ...formData, frecuencia: e.target.value })
                    }
                  >
                  <option value="">Seleccione</option>
                  {factores.length > 0 ? (
                    factores.map((factor) => (
                      <option key={factor.IdFactor} value={factor.Nombre.toLowerCase()}>
                        {factor.Nombre}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="diaria">Diaria</option>
                      <option value="semanal">Semanal</option>
                      <option value="quincenal">Quincenal</option>
                      <option value="mensual">Mensual</option>
                      <option value="bimestral">Bimestral</option>
                      <option value="trimestral">Trimestral</option>
                      <option value="semestral">Semestral</option>
                      <option value="anual">Anual</option>
                    </>
                  )}
                </select>
                </div>
                <div className="space-y-1.5">
                  <div className="group relative inline-flex items-center gap-1 cursor-help w-full">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase border-b border-dashed border-slate-300">
                      Volumen (Q)
                    </label>
                    <HelpCircle size={10} className="text-slate-400" />
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] opacity-0 transition-opacity group-hover:opacity-100 bg-slate-800 text-white text-xs rounded-lg py-2 px-3 shadow-xl z-[100] font-normal normal-case text-center">
                      Cantidad de veces que se realiza la actividad en el
                      periodo seleccionado.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-t-[6px] border-t-slate-800 border-x-[6px] border-x-transparent"></div>
                    </div>
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    disabled={!formData.frecuencia}
                    className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition-all ${!formData.frecuencia ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed" : "bg-white border-slate-200 focus:ring-2 focus:ring-institutional-blue/20 focus:border-institutional-blue"}`}
                    value={formData.volumenQ}
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "e") e.preventDefault();
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || parseFloat(val) >= 0) {
                        setFormData({ ...formData, volumenQ: val });
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta 3: Tiempos */}
          <div
            className={`bg-white rounded-xl shadow-sm border transition-all duration-300 ${!formData.rolEjecutor || !formData.volumenQ || !formData.frecuencia ? "border-slate-100 opacity-60 pointer-events-none" : "border-slate-200"}`}
          >
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2 rounded-t-xl">
              <History
                size={18}
                className={
                  !formData.rolEjecutor ||
                  !formData.volumenQ ||
                  !formData.frecuencia
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
                <HelpCircle
                  size={14}
                  className="text-blue-400 mt-0.5 shrink-0"
                />
                <p className="text-[11px] text-blue-700/80 leading-relaxed font-medium">
                  3. Ingrese los tiempos optimista (mín), más probable (norm), y
                  pesimista (máx) por ciclo.
                </p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <div className="group relative inline-flex items-center gap-1 cursor-help w-full">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase border-b border-dashed border-slate-300">
                    Unidad de Tiempo
                  </label>
                  <HelpCircle size={10} className="text-slate-400" />
                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[260px] opacity-0 transition-opacity group-hover:opacity-100 bg-slate-800 text-white text-xs rounded-lg py-2 px-3 shadow-xl z-[100] font-normal normal-case text-center">
                    Medida en la que se registran los tiempos productivos para
                    esta actividad.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-t-[6px] border-t-slate-800 border-x-[6px] border-x-transparent"></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-institutional-blue/20 focus:border-institutional-blue outline-none transition-all"
                    value={formData.unidadTiempo}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unidadTiempo: e.target.value,
                      })
                    }
                  >
                    <option value="">Seleccione unidad</option>
                    <option value="minutos">Minutos</option>
                    <option value="horas">Horas</option>
                  </select>
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  {formData.unidadTiempo
                    ? "Unidad seleccionada. Ingrese los tiempos en secuencia."
                    : "(Seleccione la unidad de tiempo para habilitar los tiempos mínimos y máximos)"}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <div className="group relative inline-flex items-center gap-1 cursor-help w-full">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase border-b border-dashed border-slate-300">
                      Mínimo
                    </label>
                    <HelpCircle size={8} className="text-slate-400" />
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] opacity-0 transition-opacity group-hover:opacity-100 bg-slate-800 text-white text-xs rounded-lg py-2 px-3 shadow-xl z-[100] font-normal normal-case text-center">
                      El tiempo más rápido posible sin errores.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-t-[6px] border-t-slate-800 border-x-[6px] border-x-transparent"></div>
                    </div>
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
                    <label className="text-[10px] font-semibold text-slate-400 uppercase border-b border-dashed border-slate-300">
                      Normal
                    </label>
                    <HelpCircle size={8} className="text-slate-400" />
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] opacity-0 transition-opacity group-hover:opacity-100 bg-slate-800 text-white text-xs rounded-lg py-2 px-3 shadow-xl z-[100] font-normal normal-case text-center">
                      El tiempo promedio o habitual de ejecución.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-t-[6px] border-t-slate-800 border-x-[6px] border-x-transparent"></div>
                    </div>
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
                    <label className="text-[10px] font-semibold text-slate-400 uppercase border-b border-dashed border-slate-300">
                      Máximo
                    </label>
                    <HelpCircle size={8} className="text-slate-400" />
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] opacity-0 transition-opacity group-hover:opacity-100 bg-slate-800 text-white text-xs rounded-lg py-2 px-3 shadow-xl z-[100] font-normal normal-case text-center">
                      El tiempo máximo que toma cuando hay complicaciones.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-t-[6px] border-t-slate-800 border-x-[6px] border-x-transparent"></div>
                    </div>
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
                <div className="flex items-center gap-2 text-red-500 text-[10px] font-bold bg-red-50 p-2 rounded-lg border border-red-100">
                  <AlertCircle size={14} />
                  COHERENCIA: El tiempo Normal debe estar entre el Mínimo y el
                  Máximo
                </div>
              )}

              {flatTimeWarning && (
                <div className="flex items-center gap-2 text-amber-600 text-[10px] font-bold bg-amber-50 p-2 rounded-lg border border-amber-100">
                  <AlertTriangle size={14} />
                  TIEMPO PLANO: Sin variabilidad estadística
                </div>
              )}

              {workdayWarning && (
                <div className="flex items-center gap-2 text-amber-600 text-[10px] font-bold bg-amber-50 p-2 rounded-lg border border-amber-100">
                  <AlertTriangle size={14} />
                  JORNADA: Supera 8 horas estándar
                </div>
              )}
            </div>
          </div>

          {/* Tarjeta de Cálculo CORE */}
          {currentUser.rol !== 'Funcionario' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 bg-institutional-blue/5 flex items-center gap-2 rounded-t-xl">
              <Calculator size={18} className="text-institutional-blue" />
              <h2 className="font-bold text-slate-700 uppercase text-xs tracking-wider">
                Cálculo Metodológico (Caja Blanca)
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-col items-start justify-center">
                  <div className="mb-1 group relative inline-flex items-center gap-1 cursor-help">
                    <p className="text-[10px] text-slate-400 font-bold uppercase border-b border-dashed border-slate-300">
                      T. Resultante (TR)
                    </p>
                    <HelpCircle size={10} className="text-slate-400" />
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[250px] opacity-0 transition-opacity group-hover:opacity-100 bg-slate-800 text-white text-xs rounded-lg py-2 px-3 shadow-xl z-[100] font-normal normal-case text-center">
                      Tiempo Resultante (TR): Promedio ponderado de los tiempos
                      (PERT). Es el tiempo estimado base de la actividad.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-t-[6px] border-t-slate-800 border-x-[6px] border-x-transparent"></div>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-slate-700">
                    {results.TR.toFixed(2)}{" "}
                    <span className="text-[10px] text-slate-400 font-normal">
                      Hrs
                    </span>
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-col items-start justify-center">
                  <div className="mb-1 group relative inline-flex items-center gap-1 cursor-help">
                    <p className="text-[10px] text-slate-400 font-bold uppercase border-b border-dashed border-slate-300">
                      T. Estándar (TE)
                    </p>
                    <HelpCircle size={10} className="text-slate-400" />
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[250px] opacity-0 transition-opacity group-hover:opacity-100 bg-slate-800 text-white text-xs rounded-lg py-2 px-3 shadow-xl z-[100] font-normal normal-case text-center">
                      Tiempo Estándar (TE): Es el Tiempo Resultante (TR) más el
                      factor de suplemento o fatiga (7%).
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-t-[6px] border-t-slate-800 border-x-[6px] border-x-transparent"></div>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-slate-700">
                    {results.TE.toFixed(2)}{" "}
                    <span className="text-[10px] text-slate-400 font-normal">
                      Hrs
                    </span>
                  </p>
                </div>
              </div>
              <div className="p-4 bg-institutional-blue text-white rounded-xl shadow-inner relative">
                <div className="absolute inset-0 overflow-hidden rounded-xl">
                  <div className="absolute -top-4 -right-4 p-4 opacity-10">
                    <Calculator size={80} />
                  </div>
                </div>
                <div className="relative z-20">
                  <div className="mb-1 group relative inline-flex items-center gap-1 cursor-help">
                    <p className="text-[10px] font-bold opacity-70 uppercase border-b border-dashed border-white/50">
                      Equivalente de Tiempo (ETP)
                    </p>
                    <HelpCircle size={10} className="opacity-70" />
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[280px] opacity-0 transition-opacity group-hover:opacity-100 bg-slate-800 text-white text-xs rounded-lg py-2 px-3 shadow-xl z-[100] font-normal normal-case text-center">
                      Equivalente de Tiempo Pleno (ETP): Personas necesarias
                      para ejecutar esta actividad al mes. (CTM ÷ Horas
                      Efectivas Mensuales).
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-t-[6px] border-t-slate-800 border-x-[6px] border-x-transparent"></div>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-black">
                      {results.ETP.toFixed(3)}
                    </p>
                    <p className="text-xs font-bold opacity-70">ETP / Mes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>

        {/* Botones de Acción */}
        {!vigenciaActiva ? (
           <div className="bg-orange-50 border border-orange-200 text-orange-700 p-4 rounded-xl flex items-start justify-between mb-4">
             <div className="flex gap-3 items-center">
               <AlertCircle className="shrink-0" size={18} />
               <div>
                  <h3 className="font-bold text-sm leading-none">Vigencia No Activa</h3>
                  <p className="text-[11px] mt-1 pr-4">La captura de tiempos está inhabilitada. Solo es permitida para la vigencia activa.</p>
               </div>
             </div>
           </div>
        ) : (
        <div className="flex flex-col sm:flex-row gap-4 justify-start mt-4 mb-4">
          <button
            onClick={() =>
              setFormData({
                ...initialFormState,
                organismoId: formData.organismoId,
                dependenciaId: formData.dependenciaId,
              })
            }
            className="px-6 py-3 text-[11px] font-black text-rose-600/80 bg-rose-500/10 hover:text-rose-700 hover:bg-rose-500/20 rounded-xl transition-all uppercase tracking-widest border border-rose-500/20"
          >
            Cancelar Registro
          </button>
          <button
            onClick={handleSave}
            disabled={isSaveDisabled}
            className={`px-8 py-3 text-xs font-black rounded-xl shadow-lg transition-all uppercase tracking-[0.15em] flex items-center justify-center gap-3 border-2 ${
              isSaveDisabled
                ? "bg-emerald-500/10 text-emerald-600/40 border-emerald-500/5 cursor-not-allowed shadow-none"
                : "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 hover:-translate-y-1 hover:shadow-emerald-600/30 active:translate-y-0 active:shadow-none"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
            Guardar registro
          </button>
        </div>
        )}

        {/* Componente: Registros Completados (Relocated below cards) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History size={18} className="text-institutional-blue" />
              <h2 className="font-bold text-slate-700 uppercase text-xs tracking-wider">
                Registros Completados
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {!hasSelection && currentUser.rol !== "Funcionario" && (
                <span className="text-[10px] text-slate-400 font-medium italic hidden sm:inline">
                  Actualmente viendo todos los registros
                </span>
              )}
              <span className="bg-institutional-blue text-white px-2.5 py-0.5 rounded-full text-[10px] font-black">
                {completedRecords.length}
              </span>
            </div>
          </div>
          <CargasTable
            isLoading={isLoadingRecords}
            cargas={completedRecords}
            actividades={actividades}
            dependencias={dependencias}
            procedimientos={procedimientos}
            currentUser={currentUser}
            onViewDetails={setSelectedRecordDetails}
          />
        </div>

        {/* Componente: Comportamiento del Nivel (Back to Sidebar) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-institutional-blue" />
              <h2 className="font-bold text-slate-700 uppercase text-xs tracking-wider">
                Comportamiento del Nivel
              </h2>
            </div>
          </div>
          <div className="p-6 flex flex-col">
            {!hasSelection ? (
              <div className="flex flex-col items-center justify-center text-center text-slate-400 space-y-4 py-8">
                <Search size={32} className="opacity-20" />
                <p className="text-[11px] px-4">
                  Seleccione un proceso para ver analíticas vinculadas.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">
                      Actividades
                    </p>
                    <p className="text-xl font-black text-institutional-blue leading-none">
                      {filteredActividades.length}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">
                      ETP Total
                    </p>
                    <p className="text-xl font-black text-institutional-blue leading-none">
                      {totalEtpForSelectedProcess.toFixed(1)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2">
                    Procedimientos
                    <span className="h-px bg-slate-100 flex-1"></span>
                  </p>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {etpByProcedure.length > 0 ? (
                      etpByProcedure.map((item, idx) => (
                        <div key={item.name} className="space-y-1.5">
                          <div className="flex justify-between text-[9px] font-bold">
                            <span className="truncate max-w-[130px] text-slate-600 uppercase tracking-tighter">
                              {item.name}
                            </span>
                            <span className="text-institutional-blue">
                              {(
                                (item.etp / (totalEtpForSelectedProcess || 1)) *
                                100
                              ).toFixed(0)}
                              %
                            </span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${(item.etp / (totalEtpForSelectedProcess || 1)) * 100}%`,
                              }}
                              className={`h-full ${idx % 2 === 0 ? "bg-institutional-blue" : "bg-emerald-500"}`}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-slate-400 italic text-center py-4">
                        Sin datos de carga.
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-institutional-blue/5 rounded-xl border border-institutional-blue/10">
                  <div className="flex items-center gap-2 text-institutional-blue mb-1">
                    <HelpCircle size={14} />
                    <span className="text-[10px] font-bold uppercase">
                      Sugerencia
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-tight">
                    Distribución basada en el proceso{" "}
                    <strong>{procesosMap.get(formData.procesoId)}</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {selectedRecordDetails && (
            <RecordDetailsModal
              record={selectedRecordDetails}
              onClose={() => setSelectedRecordDetails(null)}
              organismos={organismos}
              dependencias={dependencias}
              procesos={procesos}
              procedimientos={procedimientos}
              actividades={actividades}
              onDelete={vigenciaActiva ? onDelete : undefined}
              canDelete={vigenciaActiva}
              currentUserRole={currentUser?.rol}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
