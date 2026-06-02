import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  PieChart as RechartsPieChart,
  Pie,
  Treemap,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Line,
  Legend,
} from "recharts";
import {
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  ClipboardEdit,
  Search,
  PieChart,
  Layers,
  Activity,
  Users,
  HelpCircle,
} from "lucide-react";
import { User, Dependencia, Proceso, Procedimiento, Actividad, Organismo } from "../../domain/models/types";
import { calculateETP, CALC_CONFIG } from "../../application/utils/calculations";

const InfoTooltip = ({ label, text, direction = "down" }: { label?: string; text: string; direction?: "up" | "down" }) => (
  <span className="group/tooltip relative inline-flex items-center cursor-help">
    {label && <span className="mr-1">{label}</span>}
    <HelpCircle size={12} className="text-slate-400 group-hover/tooltip:text-slate-600 transition-colors" />
    <span className={`pointer-events-none absolute left-1/2 -translate-x-1/2 w-max max-w-[220px] opacity-0 transition-opacity group-hover/tooltip:opacity-100 bg-slate-800 text-white text-xs rounded-lg py-2 px-3 shadow-xl z-[100] font-sans font-normal normal-case tracking-normal leading-relaxed text-left ${direction === 'down' ? 'top-full mt-2' : 'bottom-full mb-2'}`}>
      {text}
      <span className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 border-x-[6px] border-x-transparent ${direction === 'down' ? 'bottom-full border-b-[6px] border-b-slate-800' : 'top-full border-t-[6px] border-t-slate-800'}`}></span>
    </span>
  </span>
);

const EmptyChartState: React.FC<{ message?: string }> = ({ message = "Sin datos de medición" }) => (
  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 min-h-[150px]">
    <BarChart3 size={24} className="mb-2 text-slate-300 opacity-50" />
    <span className="text-xs font-bold text-slate-500">{message}</span>
    <span className="text-[10px] text-slate-400 mt-1 max-w-[180px] text-center">No hay registros suficientes.</span>
  </div>
);

interface DashboardModuleProps {
  cargas: any[];
  dependencias: Dependencia[];
  procesos?: Proceso[];
  procedimientos?: Procedimiento[];
  actividades?: Actividad[];
  organismos?: Organismo[];
  currentUser: User;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  cargas,
  dependencias,
  procesos = [],
  procedimientos = [],
  actividades = [],
  organismos = [],
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'estrategica' | 'procesos' | 'eficiencia'>('estrategica');
  const [summaryFilter, setSummaryFilter] = useState<'dependencia' | 'organismo'>('organismo');

  const {
    totalETP,
    totalActivities,
    flatTimeAlerts,
    etpByDep,
    etpByOrg,
    viewCargas,
    nivelEjecutorData,
    distribucionFrecuenciaData,
    macroprocesosData,
    radarOrganismosData,
    paretoData,
    histogramaData,
    tiemposVelasData
  } = useMemo(() => {
    const vc =
      currentUser.rol === "Funcionario"
        ? cargas.filter((c) => c.userId === currentUser.id)
        : currentUser.rol === "Analista" && currentUser.dependenciaId
          ? cargas.filter((c) => c.dependenciaId === currentUser.dependenciaId)
          : cargas;

    let tETP = 0;
    vc.forEach((c) => {
      const e = calculateETP(c).ETP;
      tETP += e;
      // Inject ETP for easier use later
      c._etpCalculated = e;
    });

    const nameCounts: Record<string, number> = {};
    const etpByDepCalc = dependencias
      .map((dep) => {
        let uniqueName = dep.nombre;
        if (nameCounts[uniqueName]) {
          uniqueName = `${uniqueName} (${nameCounts[uniqueName]})`;
          nameCounts[dep.nombre]++;
        } else {
          nameCounts[uniqueName] = 1;
        }

        const depCargas = vc.filter((c) => c.dependenciaId === dep.id);
        const sumETP = depCargas.reduce((acc, c) => acc + (c._etpCalculated || 0), 0);
        return {
          id: dep.id,
          name: uniqueName,
          etp: parseFloat(sumETP.toFixed(2)),
          count: depCargas.length,
        };
      })
      .filter((d) => d.count > 0)
      .sort((a, b) => b.etp - a.etp);

    const orgNameCounts: Record<string, number> = {};
    const etpByOrgCalc = organismos
      .map((org) => {
        let uniqueName = org.nombre;
        if (orgNameCounts[uniqueName]) {
          uniqueName = `${uniqueName} (${orgNameCounts[uniqueName]})`;
          orgNameCounts[org.nombre]++;
        } else {
          orgNameCounts[uniqueName] = 1;
        }

        const orgCargas = vc.filter((c) => c.organismoId === org.id);
        const sumETP = orgCargas.reduce((acc, c) => acc + (c._etpCalculated || 0), 0);
        return {
          id: org.id,
          name: uniqueName,
          etp: parseFloat(sumETP.toFixed(2)),
          count: orgCargas.length,
        };
      })
      .filter((d) => d.count > 0)
      .sort((a, b) => b.etp - a.etp);

    // Análisis por Nivel jerárquico / Nivel de Ejecutor
    const nivelEjecutorGroups: Record<string, number> = {};
    vc.forEach(c => {
      const lvl = c.rolEjecutor || 'Sin Definir';
      nivelEjecutorGroups[lvl] = (nivelEjecutorGroups[lvl] || 0) + (c._etpCalculated || 0);
    });
    const nivelEjecutorData = Object.entries(nivelEjecutorGroups)
      .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);

    // Análisis por Frecuencia de Ejecución
    const frecuenciaGroups: Record<string, number> = {};
    vc.forEach(c => {
      const f = String(c.frecuencia || 'No Definida').toLowerCase();
      const capF = f.charAt(0).toUpperCase() + f.slice(1);
      frecuenciaGroups[capF] = (frecuenciaGroups[capF] || 0) + (c._etpCalculated || 0);
    });
    const distribucionFrecuenciaData = Object.entries(frecuenciaGroups).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2))
    })).sort((a, b) => b.value - a.value).slice(0, 5);

    let procData = procesos.map(proc => {
      const pCargas = vc.filter(c => c.procesoId === proc.id);
      const value = pCargas.reduce((acc, c) => acc + (c._etpCalculated || 0), 0);
      return { name: (proc?.nombre || '').length > 25 ? (proc?.nombre || '').slice(0, 25) + '...' : (proc?.nombre || 'No Definido'), value };
    }).filter(p => p.value > 0).sort((a,b) => b.value - a.value).slice(0, 5);

    // If no data, provide a fallback to show structure
    const mpData = procData.length > 0 ? procData : [
      { name: "Sin datos", value: 1 }
    ];

    const depToOrg = new Map<string, string>();
    dependencias.forEach(d => {
       if (d.parentId) depToOrg.set(d.id, d.parentId);
    });

    // Radar Transversalidad
    const radarData = organismos.slice(0, 6).map((org) => {
       const orgCargas = vc.filter(c => c.organismoId === org.id || depToOrg.get(c.dependenciaId) === org.id);
       const t = orgCargas.reduce((acc, c) => acc + (c._etpCalculated || 0), 0);
       return {
         subject: (org?.nombre || '').length > 15 ? (org?.nombre || '').slice(0, 15) + '...' : (org?.nombre || 'No Definido'),
         A: parseFloat(t.toFixed(1)) || 0
       }
    });

    // Pareto Actividades
    let pData = actividades.map(act => {
      const actC = vc.filter(c => c.actividadId === act.id);
      const e = actC.reduce((acc, c) => acc + (c._etpCalculated || 0), 0);
      return { name: act.nombre, etp: e };
    });
    
    // Aggregate undocumented activities as a single block
    const undocumentedCargas = vc.filter(c => c.actividadId === "actividad_no_documentada");
    if (undocumentedCargas.length > 0) {
      const e = undocumentedCargas.reduce((acc, c) => acc + (c._etpCalculated || 0), 0);
      pData.push({ name: 'ACTIVIDAD NO DOCUMENTADA', etp: e });
    }
    
    pData = pData.filter(x => x.etp > 0).sort((a, b) => b.etp - a.etp);
    
    // Calculate cumulative
    let totalE = pData.reduce((acc, c) => acc + c.etp, 0);
    let runSum = 0;
    pData = pData.map(item => {
      runSum += item.etp;
      return {
        ...item,
        cumulative: parseFloat(((runSum / totalE) * 100).toFixed(1))
      }
    });
    
    // Histograma de Distribución de ETP (instead of dedicación/cargos as those are hypothetical)
    const etpRanges = [
      { max: 0.1, name: "Muy Bajo (< 0.1)" },
      { max: 0.25, name: "Bajo (0.1 - 0.25)" },
      { max: 0.5, name: "Medio (0.25 - 0.5)" },
      { max: 1.0, name: "Alto (0.5 - 1.0)" },
      { max: Infinity, name: "Muy Alto (> 1.0)" }
    ];
    
    let histData = etpRanges.map(r => ({ range: r.name, count: 0, _max: r.max }));
    vc.forEach(c => {
      const e = c._etpCalculated || 0;
      for (const bucket of histData) {
        if (e <= bucket._max) {
          bucket.count++;
          break;
        }
      }
    });

    // Comparativa de tiempos estandarizada en minutos
    // Ordenar de manera descendente por Tiempo Normal en minutos (de mayor ejecución a menor)
    const tvData = vc.map(c => {
       let actName = actividades?.find(a => a.id === c.actividadId)?.nombre || c.actividadId;
       if (c.actividadId === "actividad_no_documentada") {
         actName = 'ACTIVIDAD NO DOCUMENTADA';
       }
       const uTiempoStr = String(c.unidadTiempo || '').toLowerCase();
       const timeFactorHours = CALC_CONFIG.MATRIZ_TIEMPOS[uTiempoStr as keyof typeof CALC_CONFIG.MATRIZ_TIEMPOS] || 0;
       
       const toMinutes = (val: number) => val ? Math.round(val * timeFactorHours * 60) : 0;

       const tMinOrig = c.tiempoMin || c.tiempoNormal;
       const tNormOrig = c.tiempoNormal;
       const tMaxOrig = c.tiempoMax || c.tiempoNormal;

       const minC = toMinutes(tMinOrig);
       const normalC = toMinutes(tNormOrig);
       const maxC = toMinutes(tMaxOrig);

       return {
         name: (actName || '').length > 20 ? (actName || '').slice(0, 20) + '...' : (actName || ''),
         min: minC,
         normal: normalC,
         max: maxC,
         variabilidad: maxC - minC
       }
    }).sort((a,b) => b.normal - a.normal).slice(0, 20); // Top 20 de tiempo de ejecución

    return { 
      totalETP: tETP, 
      totalActivities: vc.length, 
      flatTimeAlerts: vc.filter((c) => c.is_flat_time).length, 
      etpByDep: etpByDepCalc, 
      etpByOrg: etpByOrgCalc,
      viewCargas: vc,
      nivelEjecutorData,
      distribucionFrecuenciaData,
      macroprocesosData: mpData,
      radarOrganismosData: radarData,
      paretoData: pData.slice(0, 10), // Top 10 for Pareto
      histogramaData: histData,
      tiemposVelasData: tvData
    };
  }, [cargas, dependencias, procesos, actividades, organismos, currentUser]);

  const COLORS = ["#018d38", "#0b5640", "#3AF9A2", "#3561ab", "#8FCAF0", "#f28e18", "#8b4a97", "#B0942B"];
  const HEATMAP_COLORS = ["#3561ab", "#018d38", "#f28e18"]; 
  const DISTINCT_COLORS = ["#018d38", "#3AF9A2", "#3561ab", "#B0942B", "#0b5640"];
  
  // Custom Treemap content
  const CustomTreemapContent = (props: any) => {
    const { root, depth, x, y, width, height, index, payload, colors, rank, name } = props;
    if (!payload?.etp) return null;
    const ratio = payload.etp / (payload.count || 1); // Just a mock ratio for color
    const color = ratio > 1.2 ? "#ffedd5" : ratio < 0.8 ? "#e0f2fe" : "#dcfce7";
    const stroke = ratio > 1.2 ? "#f28e18" : ratio < 0.8 ? "#3561ab" : "#018d38";
    const textStyle = { fill: stroke, fontWeight: 700 };
    return (
      <g>
        <rect x={x} y={y} width={width} height={height} style={{ fill: color, stroke: '#ffffff', strokeWidth: 2 }} />
        {width > 50 && height > 30 ? (
          <text x={x + 4} y={y + 18} fill="#334155" fontSize={10} fontWeight="bold">
            {name}
          </text>
        ) : null}
        {width > 50 && height > 45 ? (
          <text x={x + 4} y={y + 32} fill={stroke} fontSize={10} fontWeight="bold">
            {payload.etp} ETP
          </text>
        ) : null}
      </g>
    );
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Cards / Counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5 relative group"
        >
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-24 h-24 bg-institutional-blue/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          </div>
          <div className="w-14 h-14 bg-institutional-blue/10 rounded-2xl flex items-center justify-center text-institutional-blue shadow-inner relative z-10">
            <TrendingUp size={28} />
          </div>
          <div className="z-10">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1 flex items-center">
              <InfoTooltip label="ETP Institucional" text="Total de Empleados de Tiempo Pleno (ETP) requeridos calculados para toda la institución según las cargas registradas." direction="down" />
            </p>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-bold text-slate-800 tracking-tight">
                {totalETP.toFixed(2)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5 relative group"
        >
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          </div>
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner relative z-10">
            <CheckCircle2 size={28} />
          </div>
          <div className="z-10">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1 flex items-center">
              <InfoTooltip label="Actividades / Reg" text="Cantidad total de actividades o registros de carga que han sido capturados y evaluados." direction="down" />
            </p>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-bold text-slate-800 tracking-tight">
                {totalActivities}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5 relative group"
        >
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          </div>
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner relative z-10">
            <Users size={28} />
          </div>
          <div className="z-10">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1 flex items-center">
              <InfoTooltip label="Dependencias Ev." text="Número de dependencias u organismos que tienen al menos un registro de carga evaluado." direction="down" />
            </p>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-bold text-slate-800 tracking-tight">
                {etpByDep.length}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
        {[
          { id: 'estrategica', label: 'Balance de Cargas (Estratégico)', icon: Layers, tooltip: "Vista general y estratégica del balanceo de ETP a nivel organizacional." },
          { id: 'procesos', label: 'Análisis por Procesos', icon: Activity, tooltip: "Desglose e impacto de la carga analizada por sus diferentes macroprocesos y procesos." },
          { id: 'eficiencia', label: 'Eficiencia Individual', icon: BarChart3, tooltip: "Evaluación del comportamiento de las actividades respecto a frecuencias y estandarización de tiempos." }
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-bold transition-all ${
                activeTab === t.id 
                  ? 'bg-white shadow-sm text-institutional-blue border border-slate-200/50' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              <Icon size={18} className={activeTab === t.id ? "text-institutional-blue" : "text-slate-400"} />
              <InfoTooltip label={t.label} text={t.tooltip} direction="down" />
            </button>
          )
        })}
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        {activeTab === 'estrategica' && (
          <motion.div
            key="estrategica"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* BarChart: Análisis por Nivel de Ejecutor */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center">
                    <InfoTooltip label="Distribución ETP por Nivel de Ejecutor" text="Muestra cuánto ETP (tiempo) consume cada nivel jerárquico (Profesional, Técnico, etc.) en conjunto." />
                  </h3>
                  <Users size={16} className="text-slate-300" />
                </div>
                <div className="h-[350px] w-full max-w-lg mx-auto">
                  {nivelEjecutorData.length === 0 ? <EmptyChartState /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={nivelEjecutorData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fontWeight: 600, fill: "#64748b" }} axisLine={false} tickLine={false} />
                      <RechartsTooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                      <Bar dataKey="value" name="ETP Requerido" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={32}>
                         {nivelEjecutorData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </RechartsBarChart>
                  </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* PieChart: Distribución ETP por Frecuencia */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center">
                    <InfoTooltip label="Distribución ETP por Frecuencia" text="Proporción del tiempo total (ETP) dedicado según la periodicidad de las actividades (Diaria, Semanal, Mensual, etc.)." />
                  </h3>
                  <PieChart size={16} className="text-slate-300" />
                </div>
                <div className="h-[350px] w-full">
                  {distribucionFrecuenciaData.length === 0 ? <EmptyChartState /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={distribucionFrecuenciaData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {distribucionFrecuenciaData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={DISTINCT_COLORS[index % DISTINCT_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'procesos' && (
          <motion.div
            key="procesos"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pareto Actividades */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center">
                    <InfoTooltip label="Pareto de Actividades (Top 10)" text="Diagrama de Pareto que muestra las 10 actividades que consumen mayor cantidad de ETP y su porcentaje acumulado." />
                  </h3>
                  <BarChart3 size={16} className="text-slate-300" />
                </div>
                <div className="h-[350px] w-full">
                  {paretoData.length === 0 ? <EmptyChartState /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={paretoData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        tick={false}
                        axisLine={{ stroke: '#f1f5f9' }}
                      />
                      <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                      <RechartsTooltip contentStyle={{ maxWidth: '320px', whiteSpace: 'normal', wordWrap: 'break-word', fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }} cursor={{ fill: "#f8fafc" }} />
                      <Bar yAxisId="left" dataKey="etp" name="ETP" fill="#007ea7" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="cumulative" name="% Acumulado" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: "#ef4444" }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Pie & Radar */}
              <div className="grid grid-cols-1 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center">
                      <InfoTooltip label="Distribución por Proceso" text="Porcentaje de esfuerzo (ETP) distribuido entre los diferentes Macroprocesos de la institución." />
                    </h3>
                    <PieChart size={16} className="text-slate-300" />
                  </div>
                  <div className="h-[180px] w-full">
                    {macroprocesosData.length === 0 ? <EmptyChartState /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie 
                          data={macroprocesosData} 
                          cx="50%" 
                          cy="50%" 
                          innerRadius={0} 
                          outerRadius={65} 
                          paddingAngle={0} 
                          dataKey="value" 
                          stroke="white"
                          strokeWidth={2}
                          labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }} 
                          label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }) => {
                            const RADIAN = Math.PI / 180;
                            const radius = outerRadius * 1.35;
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                            return (
                              <text x={x} y={y} fill="#475569" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={10} fontWeight={500}>
                                {name.length > 15 ? name.substring(0, 15) + '...' : name} ({(percent * 100).toFixed(1)}%)
                              </text>
                            );
                          }}>
                          {macroprocesosData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center">
                      <InfoTooltip label="Radar de Transversalidad" text="Gráfico radial que ilustra cómo se distribuye o transversaliza la carga entre diferentes tipos de organismos." />
                    </h3>
                    <Activity size={16} className="text-slate-300" />
                  </div>
                  <div className="h-[180px] w-full">
                    {radarOrganismosData.length === 0 ? <EmptyChartState /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarOrganismosData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 9 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={{ fontSize: 9 }} />
                        <Radar name="Institucional" dataKey="A" stroke="#00a8cc" fill="#00a8cc" fillOpacity={0.4} />
                      </RadarChart>
                    </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'eficiencia' && (
          <motion.div
            key="eficiencia"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Histograma Distribucion de Carga */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center">
                    <InfoTooltip label="Distribución de Actividades por Carga" text="Histograma que agrupa las actividades en rangos según su nivel de ETP (baja, media, alta carga)." />
                  </h3>
                  <BarChart3 size={16} className="text-slate-300" />
                </div>
                <div className="h-[350px] w-full">
                  {histogramaData.length === 0 ? <EmptyChartState /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={histogramaData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="range" tick={{ fontSize: 11, fontWeight: 600, fill: "#64748b" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                      <RechartsTooltip cursor={{ fill: "#f8fafc" }} />
                      <Bar dataKey="count" name="Cantidad de Registros" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Comparativa Tiempos (Candlestick mock) */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center">
                    <InfoTooltip label="Variabilidad de Tiempos (Min, Normal, Max)" text="Comparativa del tiempo mínimo, normal y máximo estándar fijado para las actividades capturadas." />
                  </h3>
                  <Activity size={16} className="text-slate-300" />
                </div>
                <div className="h-[350px] w-full overflow-y-auto pr-2 custom-scrollbar">
                  {tiemposVelasData.length === 0 ? <EmptyChartState /> : (
                  <div style={{ height: `${Math.max(350, tiemposVelasData.length * 40)}px` }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={tiemposVelasData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                        <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fontWeight: 600, fill: "#64748b" }} width={80} axisLine={false} tickLine={false} />
                        <RechartsTooltip cursor={{ fill: "#f8fafc" }} formatter={(value: number) => [`${value} min`, undefined]} />
                        <Bar dataKey="max" name="Tiempo Máx." fill="#e2e8f0" radius={[0, 4, 4, 0]} barSize={10} />
                        <Line type="step" dataKey="normal" stroke="#0ea5e9" strokeWidth={0} dot={{ r: 5, fill: "#0ea5e9", strokeWidth: 2, stroke: "#fff" }} />
                        <Line type="step" dataKey="min" stroke="#ef4444" strokeWidth={0} dot={{ r: 3, fill: "#ef4444" }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  )}
                </div>
                <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-slate-500 mt-2">
                  <span className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-200 rounded-sm"></div> T. Máximo</span>
                  <span className="flex items-center gap-1"><div className="w-3 h-3 bg-sky-500 rounded-full"></div> T. Normal</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-full"></div> T. Mínimo</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Table at the bottom (shows only on 'estrategica') */}
      <AnimatePresence>
        {activeTab === 'estrategica' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            className="bg-white rounded-2xl shadow-sm border border-slate-200"
          >
            <div className="px-6 py-5 rounded-t-2xl border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-institutional-blue rounded-lg flex items-center justify-center text-white">
                  <ClipboardEdit size={16} />
                </div>
                <h2 className="font-bold text-slate-700 uppercase text-[11px] tracking-[0.15em] flex items-center">
                  <InfoTooltip label="Matriz de Planta Requerida (ETP)" text="Tabla detallada que consolida el total de actividades y el cálculo final del ETP requerido para la vista seleccionada." direction="down" />
                </h2>
              </div>
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
                <button
                  onClick={() => setSummaryFilter('organismo')}
                  className={`px-3 py-1 text-[10px] uppercase font-bold rounded-md transition-colors ${summaryFilter === 'organismo' ? 'bg-institutional-blue/10 text-institutional-blue' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  Organismo
                </button>
                <button
                  onClick={() => setSummaryFilter('dependencia')}
                  className={`px-3 py-1 text-[10px] uppercase font-bold rounded-md transition-colors ${summaryFilter === 'dependencia' ? 'bg-institutional-blue/10 text-institutional-blue' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  Dependencia
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-400 font-bold uppercase text-[9px] tracking-[0.2em] border-b border-slate-200">
                    <th className="px-8 py-5">{summaryFilter === 'dependencia' ? 'Dependencia' : 'Organismo'}</th>
                    <th className="px-8 py-5 text-center">Volumen Actividades</th>
                    <th className="px-8 py-5 text-center">ETP Requerido</th>
                    <th className="px-8 py-5">Eficiencia Relativa</th>
                  </tr>
                </thead>
                <tbody>
                  {(summaryFilter === 'dependencia' ? etpByDep : etpByOrg).length > 0 ? (
                    (summaryFilter === 'dependencia' ? etpByDep : etpByOrg).map((item, idx) => (
                      <tr
                        key={`${item.name}-${idx}`}
                        className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 group"
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: COLORS[idx % COLORS.length],
                              }}
                            />
                            <span className="font-bold text-slate-700">
                              {item.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center font-medium text-slate-500">
                          {item.count}
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className="text-xl font-bold text-slate-800">
                            {item.etp.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${(item.etp / (totalETP || 1)) * 100}%`,
                                }}
                                className="h-full bg-institutional-blue rounded-full"
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 w-10">
                              {totalETP > 0
                                ? ((item.etp / totalETP) * 100).toFixed(1)
                                : "0.0"}
                              %
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-3 opacity-30">
                          <Search size={48} />
                          <p className="text-sm font-bold uppercase tracking-widest">
                            Sin datos de medición
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
