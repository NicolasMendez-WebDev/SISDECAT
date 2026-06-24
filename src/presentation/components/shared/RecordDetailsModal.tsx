import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, FileText, User as UserIcon, HelpCircle, Trash2, Edit2, Save } from 'lucide-react';
import { Organismo, Dependencia, Proceso, Procedimiento, Actividad } from '../../../domain/models/types';
import { calculateETP } from '../../../application/utils/calculations';

interface RecordDetailsModalProps {
  record: any;
  onClose: () => void;
  onSave?: (updatedRecord: any) => void;
  onDelete?: (id: string) => void;
  initialEditMode?: boolean;
  organismos: Organismo[];
  dependencias: Dependencia[];
  procesos: Proceso[];
  procedimientos: Procedimiento[];
  actividades: Actividad[];
  canDelete?: boolean; // Control if the user can delete from here
  currentUserRole?: string;
}

export const RecordDetailsModal: React.FC<RecordDetailsModalProps> = ({
  record,
  onClose,
  onSave,
  onDelete,
  initialEditMode = false,
  organismos,
  dependencias,
  procesos,
  procedimientos,
  actividades,
  canDelete = false,
  currentUserRole = ''
}) => {
  const [isEditMode, setIsEditMode] = useState(initialEditMode);
  const [editedRecord, setEditedRecord] = useState(record);
  const [showCommentPrompt, setShowCommentPrompt] = useState(false);
  const [commentText, setCommentText] = useState("");

  if (!record) return null;

  const currentRecord = isEditMode ? editedRecord : record;
  const res = calculateETP(currentRecord);

  const handleFieldChange = (field: string, value: string | number) => {
    setEditedRecord({ ...editedRecord, [field]: value });
  };

  const handleInitiateSave = () => {
    if (onSave) {
      setShowCommentPrompt(true);
    } else {
      setIsEditMode(false);
    }
  };

  const confirmSave = () => {
    if (onSave) {
      onSave({
        ...editedRecord,
        _comentario: commentText || undefined
      });
    }
    setShowCommentPrompt(false);
    setIsEditMode(false);
    setCommentText("");
  };

  const cancelSave = () => {
    setShowCommentPrompt(false);
  };

  const orgName = organismos.find(o => o.id === currentRecord.organismoId)?.nombre || 'N/A';
  const depName = dependencias.find(d => d.id === currentRecord.dependenciaId)?.nombre || 'N/A';
  const procName = procesos.find(p => p.id === currentRecord.procesoId)?.nombre || 'N/A';
  const procedName = procedimientos.find(p => p.id === currentRecord.procedimientoId)?.nombre || 'N/A';
  let actName = actividades.find(a => a.id === currentRecord.actividadId)?.nombre || 'N/A';
  if (currentRecord.actividadId === "actividad_no_documentada") {
    actName = 'ACTIVIDAD NO DOCUMENTADA';
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden modal-content flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-institutional-blue px-6 py-4 flex items-center justify-between shrink-0">
          <h3 className="text-white font-bold flex items-center gap-2">
            <FileText size={18} />
            Detalle de Registro
          </h3>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
          <div className="space-y-6">
            {/* Autor y Fecha Prominente */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-institutional-blue/10 rounded-full flex items-center justify-center text-institutional-blue shrink-0">
                  <UserIcon size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Capturado por</p>
                  <p className="text-sm font-black text-slate-700 leading-tight">{record.autor || 'N/A'}</p>
                  <p className="text-[10px] font-bold text-institutional-blue uppercase tracking-wide mt-0.5">
                    {record.userRole || "Usuario"}
                  </p>
                </div>
              </div>
              <div className="md:text-right flex flex-col md:items-end">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Fecha y Hora de Registro</p>
                <p className="text-sm text-slate-700 font-bold leading-tight">
                  {new Date(record.createdAt || record.created_at || Date.now()).toLocaleDateString([], { day: "2-digit", month: "long", year: "numeric" })}
                </p>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                  {new Date(record.createdAt || record.created_at || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Ruta Organizacional</h4>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4 text-sm">
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Organismo</p>
                    <p className="text-slate-700 font-medium">{orgName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Dependencia</p>
                    <p className="text-slate-700 font-medium">{depName}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Ruta Procedimental y de Ejecución</h4>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4 text-sm">
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Proceso</p>
                    <p className="text-slate-700 font-medium">{procName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Procedimiento</p>
                    <p className="text-slate-700 font-medium">{procedName}</p>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Actividad</p>
                      <p className="text-slate-700 font-normal">{actName}</p>
                      {currentRecord.actividadId === "actividad_no_documentada" && currentRecord.descripcionActividad && (
                        <p className="text-[10px] uppercase text-amber-600 font-bold mt-1 bg-amber-50 px-2 py-0.5 rounded inline-block">Nombre asignado: {currentRecord.descripcionActividad}</p>
                      )}
                    </div>
                    <div className="md:w-[200px]">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Nivel de Ejecutor</p>
                      <div className="inline-flex py-1 px-2 mb-1 bg-institutional-blue/10 text-institutional-blue rounded text-[11px] font-bold border border-institutional-blue/20 uppercase">
                        {record.rolEjecutor || "No Definido"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Parámetros de Medición</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 text-center flex flex-col items-center justify-center">
                  <div className="mb-1 group relative inline-flex items-center gap-1 cursor-help">
                    <p className="text-[10px] text-slate-400 font-bold uppercase border-b border-dashed border-slate-300">Volumen (Q)</p>
                    <HelpCircle size={10} className="text-slate-400" />
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] opacity-0 transition-opacity group-hover:opacity-100 bg-slate-800 text-white text-xs rounded-lg py-2 px-3 shadow-xl z-[100] font-normal normal-case text-center">
                      Cantidad de veces que se realiza la actividad en la frecuencia seleccionada.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-t-[6px] border-t-slate-800 border-x-[6px] border-x-transparent"></div>
                    </div>
                  </div>
                  {isEditMode ? (
                    <input 
                      type="number" min="0" step="any"
                      className="w-full text-center text-base font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded p-1 outline-none focus:border-institutional-blue focus:bg-white transition-colors"
                      value={editedRecord.volumenQ}
                      onChange={(e) => handleFieldChange('volumenQ', Number(e.target.value))}
                    />
                  ) : (
                    <p className="text-base font-bold text-slate-700">{currentRecord.volumenQ}</p>
                  )}
                </div>
                <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 text-center flex flex-col items-center justify-center">
                  <div className="mb-1 group relative inline-flex items-center gap-1 cursor-help">
                    <p className="text-[10px] text-slate-400 font-bold uppercase border-b border-dashed border-slate-300">Frecuencia</p>
                    <HelpCircle size={10} className="text-slate-400" />
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] opacity-0 transition-opacity group-hover:opacity-100 bg-slate-800 text-white text-xs rounded-lg py-2 px-3 shadow-xl z-[100] font-normal normal-case text-center">
                      Periodicidad con la que se ejecuta la actividad (Diaria, Mensual, etc).
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-t-[6px] border-t-slate-800 border-x-[6px] border-x-transparent"></div>
                    </div>
                  </div>
                  {isEditMode ? (
                    <select
                      className="w-full text-center text-base font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded p-1 outline-none focus:border-institutional-blue capitalize focus:bg-white transition-colors"
                      value={(editedRecord.frecuencia || '').toLowerCase()}
                      onChange={(e) => handleFieldChange('frecuencia', e.target.value)}
                    >
                      <option value="diaria">Diaria</option>
                      <option value="semanal">Semanal</option>
                      <option value="quincenal">Quincenal</option>
                      <option value="mensual">Mensual</option>
                      <option value="bimestral">Bimestral</option>
                      <option value="trimestral">Trimestral</option>
                      <option value="semestral">Semestral</option>
                      <option value="anual">Anual</option>
                    </select>
                  ) : (
                    <p className="text-base font-bold text-slate-700 capitalize">{currentRecord.frecuencia}</p>
                  )}
                </div>
                <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 text-center flex flex-col items-center justify-center">
                  <div className="mb-1 group relative inline-flex items-center gap-1 cursor-help">
                    <p className="text-[10px] text-slate-400 font-bold uppercase border-b border-dashed border-slate-300">Unidad de Tiempo</p>
                    <HelpCircle size={10} className="text-slate-400" />
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] opacity-0 transition-opacity group-hover:opacity-100 bg-slate-800 text-white text-xs rounded-lg py-2 px-3 shadow-xl z-[100] font-normal normal-case text-center">
                      Medida en la que se registran los tiempos productivos.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-t-[6px] border-t-slate-800 border-x-[6px] border-x-transparent"></div>
                    </div>
                  </div>
                  {isEditMode ? (
                    <select
                      className="w-full text-center text-base font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded p-1 outline-none focus:border-institutional-blue capitalize focus:bg-white transition-colors"
                      value={(editedRecord.unidadTiempo || '').toLowerCase() === 'min' ? 'minutos' : ((editedRecord.unidadTiempo || '').toLowerCase() === 'hor' ? 'horas' : (editedRecord.unidadTiempo || "minutos").toLowerCase())}
                      onChange={(e) => handleFieldChange('unidadTiempo', e.target.value)}
                    >
                      <option value="minutos">Minutos</option>
                      <option value="horas">Horas</option>
                    </select>
                  ) : (
                    <p className="text-base font-bold text-slate-700 capitalize">
                      {currentRecord.unidadTiempo === 'min' ? 'minutos' : (currentRecord.unidadTiempo === 'hor' ? 'horas' : (currentRecord.unidadTiempo || "minutos"))}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl shadow-sm border border-slate-100 text-center flex flex-col items-center justify-center">
                  <div className="mb-1 group relative inline-flex items-center gap-1 cursor-help">
                    <p className="text-[10px] text-slate-500 font-bold uppercase border-b border-dashed border-slate-300">Tm (Mínimo)</p>
                    <HelpCircle size={10} className="text-slate-400" />
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] opacity-0 transition-opacity group-hover:opacity-100 bg-slate-800 text-white text-xs rounded-lg py-2 px-3 shadow-xl z-[100] font-normal normal-case text-center">
                      El tiempo más rápido posible sin errores.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-t-[6px] border-t-slate-800 border-x-[6px] border-x-transparent"></div>
                    </div>
                  </div>
                  {isEditMode ? (
                    <input 
                      type="number" min="0" step="0.5"
                      className="w-full text-center text-base font-bold text-slate-700 bg-white border border-slate-200 rounded p-1 outline-none focus:border-institutional-blue transition-colors"
                      value={editedRecord.tiempoMin}
                      onChange={(e) => handleFieldChange('tiempoMin', Number(e.target.value))}
                    />
                  ) : (
                    <p className="text-base font-bold text-slate-700">{currentRecord.tiempoMin}</p>
                  )}
                </div>
                <div className="bg-white p-3 rounded-xl shadow-sm border border-institutional-blue/30 text-center relative flex flex-col justify-center items-center">
                  <div className="absolute top-0 right-0 w-8 h-8 bg-institutional-blue/5 rounded-bl-[100%] border-l border-b border-institutional-blue/10 overflow-hidden" />
                  <div className="mb-1 group relative z-20 inline-flex items-center gap-1 cursor-help">
                    <p className="text-[10px] text-institutional-blue font-bold uppercase border-b border-dashed border-institutional-blue/50">TN (Normal)</p>
                    <HelpCircle size={10} className="text-institutional-blue" />
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] opacity-0 transition-opacity group-hover:opacity-100 bg-slate-800 text-white text-xs rounded-lg py-2 px-3 shadow-xl z-[100] font-normal normal-case text-center">
                      El tiempo promedio o habitual de ejecución.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-t-[6px] border-t-slate-800 border-x-[6px] border-x-transparent"></div>
                    </div>
                  </div>
                  {isEditMode ? (
                    <input 
                      type="number" min="0" step="0.5"
                      className="w-full text-center text-lg font-bold text-institutional-blue bg-white border border-institutional-blue/30 rounded p-1 outline-none focus:border-institutional-blue relative z-10 transition-colors"
                      value={editedRecord.tiempoNormal}
                      onChange={(e) => handleFieldChange('tiempoNormal', Number(e.target.value))}
                    />
                  ) : (
                    <p className="text-lg font-bold text-institutional-blue relative z-10">{currentRecord.tiempoNormal}</p>
                  )}
                </div>
                <div className="bg-slate-50 p-3 rounded-xl shadow-sm border border-slate-100 text-center flex flex-col items-center justify-center">
                  <div className="mb-1 group relative inline-flex items-center gap-1 cursor-help">
                    <p className="text-[10px] text-slate-500 font-bold uppercase border-b border-dashed border-slate-300">TM (Máximo)</p>
                    <HelpCircle size={10} className="text-slate-400" />
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] opacity-0 transition-opacity group-hover:opacity-100 bg-slate-800 text-white text-xs rounded-lg py-2 px-3 shadow-xl z-[100] font-normal normal-case text-center">
                      El tiempo máximo que toma cuando hay complicaciones.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-t-[6px] border-t-slate-800 border-x-[6px] border-x-transparent"></div>
                    </div>
                  </div>
                  {isEditMode ? (
                    <input 
                      type="number" min="0" step="0.5"
                      className="w-full text-center text-base font-bold text-slate-700 bg-white border border-slate-200 rounded p-1 outline-none focus:border-institutional-blue transition-colors"
                      value={editedRecord.tiempoMax}
                      onChange={(e) => handleFieldChange('tiempoMax', Number(e.target.value))}
                    />
                  ) : (
                    <p className="text-base font-bold text-slate-700">{currentRecord.tiempoMax}</p>
                  )}
                </div>
              </div>
            </div>

            {currentUserRole !== 'Funcionario' && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Tiempos Calculados</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex flex-col items-start justify-center">
                    <div className="mb-1 group relative inline-flex items-center gap-1 cursor-help">
                      <p className="text-[10px] text-emerald-600 font-bold uppercase border-b border-dashed border-emerald-300">TE (Tiempo Esperado)</p>
                      <HelpCircle size={10} className="text-emerald-600" />
                      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[230px] opacity-0 transition-opacity group-hover:opacity-100 bg-slate-800 text-white text-xs rounded-lg py-2 px-3 shadow-xl z-[100] font-normal normal-case text-center">
                        Tiempo Resultante con factor de suplemento o fatiga (7%) agregado.
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-t-[6px] border-t-slate-800 border-x-[6px] border-x-transparent"></div>
                      </div>
                    </div>
                    <p className="text-xl font-black text-emerald-700">{res.TE.toFixed(2)}h</p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex flex-col items-start justify-center">
                    <div className="mb-1 group relative inline-flex items-center gap-1 cursor-help">
                      <p className="text-[10px] text-amber-600 font-bold uppercase border-b border-dashed border-amber-300">CTM</p>
                      <HelpCircle size={10} className="text-amber-600" />
                      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[250px] opacity-0 transition-opacity group-hover:opacity-100 bg-slate-800 text-white text-xs rounded-lg py-2 px-3 shadow-xl z-[100] font-normal normal-case text-center">
                        Carga de Trabajo Mensual: Tiempo total requerido al mes (TE × Volumen × Frecuencia).
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-t-[6px] border-t-slate-800 border-x-[6px] border-x-transparent"></div>
                      </div>
                    </div>
                    <p className="text-xl font-black text-amber-700">{res.CTM.toFixed(2)}h</p>
                  </div>
                  <div className="bg-institutional-blue/10 p-4 rounded-xl border border-institutional-blue/20 flex flex-col items-start justify-center">
                    <div className="mb-1 group relative inline-flex items-center gap-1 cursor-help">
                      <p className="text-[10px] text-institutional-blue font-bold uppercase border-b border-dashed border-institutional-blue/30">ETP (Final)</p>
                      <HelpCircle size={10} className="text-institutional-blue" />
                      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[250px] opacity-0 transition-opacity group-hover:opacity-100 bg-slate-800 text-white text-xs rounded-lg py-2 px-3 shadow-xl z-[100] font-normal normal-case text-center">
                        Equivalente de Tiempo Pleno: Personas necesarias para ejecutar esta actividad (CTM ÷ 167.2 h/mes).
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-t-[6px] border-t-slate-800 border-x-[6px] border-x-transparent"></div>
                      </div>
                    </div>
                    <p className="text-2xl font-black text-institutional-blue">{res.ETP.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
            {currentRecord.auditLog && currentRecord.auditLog.length > 0 && (
              <div className="mt-8 border-t border-slate-200 pt-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Edit2 size={12} />
                  Historial de Ediciones
                </h4>
                <div className="space-y-4">
                  {currentRecord.auditLog.map((log: any, idx: number) => (
                    <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-slate-700">{log.editor}</p>
                          <p className="text-[10px] font-bold text-institutional-blue uppercase">{log.rol}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">
                            {new Date(log.timestamp).toLocaleDateString()} a las {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <ul className="space-y-1.5">
                          {log.changes.map((change: any, cIdx: number) => (
                            <li key={cIdx} className="text-xs flex items-center gap-2">
                              <span className="font-bold text-slate-600 capitalize">{change.field}:</span>
                              <span className="text-slate-400 line-through">{change.old}</span>
                              <span className="text-institutional-blue font-bold">→</span>
                              <span className="text-emerald-600 font-bold">{change.new}</span>
                            </li>
                          ))}
                        </ul>
                        {log.comentario && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <p className="text-xs text-slate-600 italic">"{log.comentario}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-end shrink-0">
          <div className="flex gap-2">
            {canDelete && onDelete && (
              <button
                onClick={() => {
                  onDelete(record.id);
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-bold transition-colors border border-red-100"
              >
                <Trash2 size={16} />
                Desactivar Registro
              </button>
            )}

            {onSave && !isEditMode && (
              <button
                onClick={() => setIsEditMode(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg text-sm font-bold transition-colors border border-orange-200"
              >
                <Edit2 size={16} />
                Editar
              </button>
            )}

            {isEditMode && (
              <button
                onClick={handleInitiateSave}
                className="flex items-center gap-2 px-6 py-2 bg-institutional-blue text-white hover:bg-institutional-blue/90 rounded-lg text-sm font-bold transition-colors shadow-sm"
              >
                <Save size={16} />
                Guardar Cambios
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-bold transition-colors"
            >
              {isEditMode ? 'Cancelar' : 'Cerrar'}
            </button>
          </div>
        </div>
      </motion.div>

      {showCommentPrompt && (
        <div 
          className="absolute inset-0 bg-slate-900/60 z-[600] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Edit2 size={16} className="text-institutional-blue" />
                Comentario de Edición
              </h3>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-600 mb-3">
                ¿Desea añadir algún comentario sobre esta modificación? (Opcional)
              </p>
              <textarea
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-institutional-blue/20 focus:border-institutional-blue transition-colors text-sm min-h-[100px] resize-y"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Ej: Se ajustó el tiempo estimado debido a la actualización del sistema..."
                autoFocus
              />
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={cancelSave}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmSave}
                className="px-5 py-2 text-sm font-bold bg-institutional-blue text-white rounded-lg hover:bg-institutional-blue/90 hover:-translate-y-0.5 transition-all shadow-sm flex items-center gap-2"
              >
                <Save size={16} />
                Guardar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
