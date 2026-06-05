import React, { useState } from 'react';
import { Vigencia } from '../../../domain/models/types';
import { Pencil, Save, PlusCircle, Trash2, X, ArrowUp, ArrowDown } from 'lucide-react';
import { motion } from 'motion/react';

interface CatalogosAdminProps {
  vigencias: Vigencia[];
  cargos: any[];
  factores: any[];
  onSaveCargo?: (c: any) => Promise<void>;
  onDeleteCargo?: (id: number) => Promise<void>;
  onSaveFactor?: (f: any) => Promise<void>;
  onDeleteFactor?: (id: number) => Promise<void>;
  onReorderCargos?: (c: any[]) => void;
  onReorderFactores?: (f: any[]) => void;
}

export const CatalogosAdmin: React.FC<CatalogosAdminProps> = ({
  vigencias, cargos, factores, onSaveCargo, onDeleteCargo, onSaveFactor, onDeleteFactor,
  onReorderCargos, onReorderFactores
}) => {
  const [selectedVigenciaId, setSelectedVigenciaId] = useState<string>(vigencias.find(v => v.Estado === 'Activo')?.IdVigencia || '');
  
  const currentCargos = cargos.filter(c => c.IdVigencia === selectedVigenciaId || c.vigenciaId === selectedVigenciaId);
  const currentFactores = factores.filter(f => f.IdVigencia === selectedVigenciaId || f.vigenciaId === selectedVigenciaId);

  const [editingCargo, setEditingCargo] = useState<any>(null);
  const [editingFactor, setEditingFactor] = useState<any>(null);

  const handleSaveCargo = async () => {
    if (onSaveCargo && editingCargo?.Denominacion) {
      await onSaveCargo(editingCargo);
      setEditingCargo(null);
    }
  };

  const handleSaveFactor = async () => {
    if (onSaveFactor && editingFactor?.Nombre) {
      await onSaveFactor(editingFactor);
      setEditingFactor(null);
    }
  };

  const addNewCargo = () => {
    const newId = -Math.round(Math.random() * 1000000);
    const newC = { IdCargo: newId, IdVigencia: selectedVigenciaId, Denominacion: 'Nuevo Cargo', Activo: true };
    setEditingCargo(newC);
  };

  const addNewFactor = () => {
    const newId = -Math.round(Math.random() * 1000000);
    const newF = { IdFactor: newId, IdVigencia: selectedVigenciaId, Nombre: 'Nueva Frecuencia', FactorMensual: 1, EsSistema: false };
    setEditingFactor(newF);
  };

  const moveCargo = (index: number, direction: 'up' | 'down') => {
    if (!onReorderCargos) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= currentCargos.length) return;
    
    // We only swap within the filtered currentCargos context
    const cargoA = currentCargos[index];
    const cargoB = currentCargos[newIndex];
    
    // We update the master cargos array by moving these two elements
    let masterCopy = [...cargos];
    const indexA = masterCopy.findIndex(c => c.IdCargo === cargoA.IdCargo);
    const indexB = masterCopy.findIndex(c => c.IdCargo === cargoB.IdCargo);
    
    if (indexA > -1 && indexB > -1) {
       masterCopy[indexA] = cargoB;
       masterCopy[indexB] = cargoA;
       onReorderCargos(masterCopy);
    }
  };

  const moveFactor = (index: number, direction: 'up' | 'down') => {
    if (!onReorderFactores) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= currentFactores.length) return;
    
    const factorA = currentFactores[index];
    const factorB = currentFactores[newIndex];
    
    let masterCopy = [...factores];
    const indexA = masterCopy.findIndex(f => f.IdFactor === factorA.IdFactor);
    const indexB = masterCopy.findIndex(f => f.IdFactor === factorB.IdFactor);
    
    if (indexA > -1 && indexB > -1) {
       masterCopy[indexA] = factorB;
       masterCopy[indexB] = factorA;
       onReorderFactores(masterCopy);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center gap-4">
        <label className="text-sm font-bold text-slate-700 whitespace-nowrap">Vigencia para catálogos:</label>
        <select 
          value={selectedVigenciaId}
          onChange={(e) => setSelectedVigenciaId(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-institutional-blue/20 outline-none"
        >
          <option value="" disabled>Seleccione una vigencia...</option>
          {vigencias.map(v => (
            <option key={v.IdVigencia} value={v.IdVigencia}>{v.Nombre} ({v.Anio})</option>
          ))}
        </select>
      </div>

      {selectedVigenciaId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cargos */}
          <div className="bg-white border text-left border-slate-200 rounded-xl overflow-hidden">
             <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
               <h3 className="font-bold text-slate-800 text-sm">Cargos / Niveles</h3>
               <button onClick={addNewCargo} className="flex items-center gap-1 text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm font-medium text-institutional-blue hover:bg-slate-50">
                  <PlusCircle size={14}/> Nuevo Cargo
               </button>
             </div>
             <div className="p-0 max-h-[500px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 sticky top-0">
                    <tr>
                      <th className="py-2 px-4 whitespace-nowrap">Denominación</th>
                      <th className="py-2 px-4 text-right whitespace-nowrap">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {currentCargos.length === 0 ? (
                      <tr><td colSpan={2} className="py-4 text-center text-slate-500">No hay cargos registrados.</td></tr>
                    ) : currentCargos.map((c, idx) => (
                      <tr key={c.IdCargo} className="hover:bg-slate-50/50">
                        <td className="py-2 px-4">
                          <span className="font-medium text-slate-700">{c.Denominacion}</span>
                        </td>
                        <td className="py-2 px-4 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 lg:opacity-100 transition-opacity">
                             {idx > 0 && (
                               <button onClick={() => moveCargo(idx, 'up')} className="text-slate-400 hover:text-institutional-blue p-1 rounded hover:bg-blue-50 transition-colors" title="Mover Arriba"><ArrowUp size={14}/></button>
                             )}
                             {idx < currentCargos.length - 1 && (
                               <button onClick={() => moveCargo(idx, 'down')} className="text-slate-400 hover:text-institutional-blue p-1 rounded hover:bg-blue-50 transition-colors" title="Mover Abajo"><ArrowDown size={14}/></button>
                             )}
                             <button onClick={() => setEditingCargo(c)} className="text-slate-400 hover:text-institutional-blue p-1 rounded hover:bg-blue-50 transition-colors"><Pencil size={14}/></button>
                             {onDeleteCargo && (
                               <button onClick={() => onDeleteCargo(c.IdCargo)} className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"><Trash2 size={14}/></button>
                             )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>

          {/* Frecuencias */}
          <div className="bg-white border text-left border-slate-200 rounded-xl overflow-hidden">
             <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
               <h3 className="font-bold text-slate-800 text-sm">Factores de Frecuencia</h3>
               <button onClick={addNewFactor} className="flex items-center gap-1 text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm font-medium text-institutional-blue hover:bg-slate-50">
                  <PlusCircle size={14}/> Nueva Frecuencia
               </button>
             </div>
             <div className="p-0 max-h-[500px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 sticky top-0">
                    <tr>
                      <th className="py-2 px-4 whitespace-nowrap">Nombre</th>
                      <th className="py-2 px-4 whitespace-nowrap" title="Equivalencia en el mes (Ej: Diaria=19)">Factor M.</th>
                      <th className="py-2 px-4 text-right whitespace-nowrap">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {currentFactores.length === 0 ? (
                      <tr><td colSpan={3} className="py-4 text-center text-slate-500">No hay frecuencias.</td></tr>
                    ) : currentFactores.map((f, idx) => (
                      <tr key={f.IdFactor} className="hover:bg-slate-50/50">
                        <td className="py-2 px-4">
                          <span className="font-medium text-slate-700 capitalize">{f.Nombre}</span>
                        </td>
                        <td className="py-2 px-4 text-slate-600">
                           <span className="font-mono text-xs">{f.FactorMensual}</span>
                        </td>
                        <td className="py-2 px-4 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 lg:opacity-100 transition-opacity">
                             {idx > 0 && (
                               <button onClick={() => moveFactor(idx, 'up')} className="text-slate-400 hover:text-institutional-blue p-1 rounded hover:bg-blue-50 transition-colors" title="Mover Arriba"><ArrowUp size={14}/></button>
                             )}
                             {idx < currentFactores.length - 1 && (
                               <button onClick={() => moveFactor(idx, 'down')} className="text-slate-400 hover:text-institutional-blue p-1 rounded hover:bg-blue-50 transition-colors" title="Mover Abajo"><ArrowDown size={14}/></button>
                             )}
                             {f.EsSistema && <span className="text-[9px] text-slate-400 bg-slate-100 rounded px-1.5 py-0.5 mr-1">Sistema</span>}
                             <button onClick={() => setEditingFactor(f)} className="text-slate-400 hover:text-institutional-blue p-1 rounded hover:bg-blue-50 transition-colors"><Pencil size={14}/></button>
                             {onDeleteFactor && (
                               <button onClick={() => onDeleteFactor(f.IdFactor)} disabled={f.EsSistema} className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-30"><Trash2 size={14}/></button>
                             )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        </div>
      )}

      {/* Cargo Modal */}
      {editingCargo && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingCargo(null)}>
           <motion.div 
             initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
             onClick={e => e.stopPropagation()}
             className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
           >
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                 <h3 className="font-bold text-slate-800 text-sm">{editingCargo.IdCargo < 0 ? 'Crear Nuevo Cargo' : 'Editar Cargo'}</h3>
                 <button onClick={() => setEditingCargo(null)} className="text-slate-400 hover:text-slate-600"><X size={18}/></button>
              </div>
              <div className="p-5 space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Denominación</label>
                    <input 
                      autoFocus
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-institutional-blue/20 focus:border-institutional-blue outline-none" 
                      value={editingCargo.Denominacion} 
                      onChange={(e) => setEditingCargo({...editingCargo, Denominacion: e.target.value})} 
                      placeholder="Ej: Profesional Especializado"
                    />
                 </div>
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                 <button onClick={() => setEditingCargo(null)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>
                 <button onClick={handleSaveCargo} className="px-4 py-2 text-sm font-bold bg-institutional-blue text-white rounded-lg hover:bg-institutional-blue/90 shadow-sm flex items-center gap-2 transition-all">
                    <Save size={16}/> Guardar
                 </button>
              </div>
           </motion.div>
        </div>
      )}

      {/* Factor Modal */}
      {editingFactor && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingFactor(null)}>
           <motion.div 
             initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
             onClick={e => e.stopPropagation()}
             className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
           >
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                 <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    {editingFactor.IdFactor < 0 ? 'Crear Nueva Frecuencia' : 'Editar Frecuencia'}
                    {editingFactor.EsSistema && <span className="bg-institutional-blue/10 text-institutional-blue text-[10px] px-2 py-0.5 rounded uppercase ml-2">Sistema</span>}
                 </h3>
                 <button onClick={() => setEditingFactor(null)} className="text-slate-400 hover:text-slate-600"><X size={18}/></button>
              </div>
              <div className="p-5 space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre</label>
                    <input 
                      autoFocus
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-institutional-blue/20 focus:border-institutional-blue outline-none" 
                      value={editingFactor.Nombre} 
                      onChange={(e) => setEditingFactor({...editingFactor, Nombre: e.target.value})} 
                      placeholder="Ej: Mensual"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Factor Mensual</label>
                    <input 
                      type="number" step="0.01" min="0"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-institutional-blue/20 focus:border-institutional-blue outline-none" 
                      value={editingFactor.FactorMensual} 
                      onChange={(e) => setEditingFactor({...editingFactor, FactorMensual: parseFloat(e.target.value)})} 
                      placeholder="Ej: 19"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Este valor representa cuántas veces se ejecuta esta frecuencia en un mes de trabajo activo.</p>
                 </div>
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                 <button onClick={() => setEditingFactor(null)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>
                 <button onClick={handleSaveFactor} className="px-4 py-2 text-sm font-bold bg-institutional-blue text-white rounded-lg hover:bg-institutional-blue/90 shadow-sm flex items-center gap-2 transition-all">
                    <Save size={16}/> Guardar
                 </button>
              </div>
           </motion.div>
        </div>
      )}
    </div>
  );
};

