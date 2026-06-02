import React, { useState } from 'react';
import { Vigencia } from '../../../domain/models/types';
import { Pencil, Save, PlusCircle, Trash2 } from 'lucide-react';

interface CatalogosAdminProps {
  vigencias: Vigencia[];
  cargos: any[];
  factores: any[];
  onSaveCargo?: (c: any) => Promise<void>;
  onDeleteCargo?: (id: number) => Promise<void>;
  onSaveFactor?: (f: any) => Promise<void>;
  onDeleteFactor?: (id: number) => Promise<void>;
}

export const CatalogosAdmin: React.FC<CatalogosAdminProps> = ({
  vigencias, cargos, factores, onSaveCargo, onDeleteCargo, onSaveFactor, onDeleteFactor
}) => {
  const [selectedVigenciaId, setSelectedVigenciaId] = useState<string>(vigencias.find(v => v.Estado === 'Activo')?.IdVigencia || '');
  
  const currentCargos = cargos.filter(c => c.IdVigencia === selectedVigenciaId || c.vigenciaId === selectedVigenciaId);
  const currentFactores = factores.filter(f => f.IdVigencia === selectedVigenciaId || f.vigenciaId === selectedVigenciaId);

  const [editingCargoId, setEditingCargoId] = useState<number | null>(null);
  const [editedCargo, setEditedCargo] = useState<any>({});
  
  const [editingFactorId, setEditingFactorId] = useState<number | null>(null);
  const [editedFactor, setEditedFactor] = useState<any>({});

  const startEditCargo = (c: any) => {
    setEditingCargoId(c.IdCargo);
    setEditedCargo({ ...c });
  };

  const handleSaveCargo = async () => {
    if (onSaveCargo && editedCargo.Denominacion) {
      await onSaveCargo(editedCargo);
      setEditingCargoId(null);
    }
  };

  const startEditFactor = (f: any) => {
    setEditingFactorId(f.IdFactor);
    setEditedFactor({ ...f });
  };

  const handleSaveFactor = async () => {
    if (onSaveFactor && editedFactor.Nombre) {
      await onSaveFactor(editedFactor);
      setEditingFactorId(null);
    }
  };

  const addNewCargo = () => {
    const newId = -Math.round(Math.random() * 1000000);
    const newC = { IdCargo: newId, IdVigencia: selectedVigenciaId, Denominacion: 'Nuevo Cargo', NivelJerarquico: 'Profesional', Activo: true };
    setEditedCargo(newC);
    setEditingCargoId(newId);
  };

  const addNewFactor = () => {
    const newId = -Math.round(Math.random() * 1000000);
    const newF = { IdFactor: newId, IdVigencia: selectedVigenciaId, Nombre: 'Nueva Frecuencia', FactorMensual: 1, EsSistema: false };
    setEditedFactor(newF);
    setEditingFactorId(newId);
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
                      <th className="py-2 px-4 whitespace-nowrap">Nivel Jerárquico</th>
                      <th className="py-2 px-4 text-right whitespace-nowrap">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {currentCargos.length === 0 ? (
                      <tr><td colSpan={3} className="py-4 text-center text-slate-500">No hay cargos registrados.</td></tr>
                    ) : currentCargos.map(c => (
                      <tr key={c.IdCargo} className="hover:bg-slate-50/50">
                        <td className="py-2 px-4">
                          {editingCargoId === c.IdCargo ? (
                            <input autoFocus className="w-full border border-slate-300 rounded px-2 py-1" value={editedCargo.Denominacion} onChange={(e) => setEditedCargo({...editedCargo, Denominacion: e.target.value})} />
                          ) : <span className="font-medium text-slate-700">{c.Denominacion}</span>}
                        </td>
                        <td className="py-2 px-4 text-slate-600">
                           {editingCargoId === c.IdCargo ? (
                             <select className="w-full border border-slate-300 rounded px-2 py-1" value={editedCargo.NivelJerarquico} onChange={(e) => setEditedCargo({...editedCargo, NivelJerarquico: e.target.value})}>
                               <option value="Asistencial">Asistencial</option>
                               <option value="Tecnico">Técnico</option>
                               <option value="Profesional">Profesional</option>
                               <option value="Asesor">Asesor</option>
                               <option value="Directivo">Directivo</option>
                             </select>
                           ) : c.NivelJerarquico}
                        </td>
                        <td className="py-2 px-4 text-right whitespace-nowrap">
                          {editingCargoId === c.IdCargo ? (
                            <div className="flex justify-end gap-2">
                               <button onClick={handleSaveCargo} className="text-green-600 hover:bg-green-50 p-1.5 rounded"><Save size={16}/></button>
                               <button onClick={() => setEditingCargoId(null)} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded text-xs font-bold">cancel</button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 lg:opacity-100 transition-opacity">
                               <button onClick={() => startEditCargo(c)} className="text-slate-400 hover:text-institutional-blue p-1 rounded hover:bg-blue-50 transition-colors"><Pencil size={14}/></button>
                               {onDeleteCargo && (
                                 <button onClick={() => onDeleteCargo(c.IdCargo)} className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"><Trash2 size={14}/></button>
                               )}
                            </div>
                          )}
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
                    ) : currentFactores.map(f => (
                      <tr key={f.IdFactor} className="hover:bg-slate-50/50">
                        <td className="py-2 px-4">
                          {editingFactorId === f.IdFactor ? (
                            <input autoFocus className="w-full border border-slate-300 rounded px-2 py-1" value={editedFactor.Nombre} onChange={(e) => setEditedFactor({...editedFactor, Nombre: e.target.value})} />
                          ) : <span className="font-medium text-slate-700 capitalize">{f.Nombre}</span>}
                        </td>
                        <td className="py-2 px-4 text-slate-600">
                           {editingFactorId === f.IdFactor ? (
                             <input type="number" step="0.01" className="w-20 border border-slate-300 rounded px-2 py-1" value={editedFactor.FactorMensual} onChange={(e) => setEditedFactor({...editedFactor, FactorMensual: parseFloat(e.target.value)})} />
                           ) : <span className="font-mono text-xs">{f.FactorMensual}</span>}
                        </td>
                        <td className="py-2 px-4 text-right whitespace-nowrap">
                          {editingFactorId === f.IdFactor ? (
                            <div className="flex justify-end gap-2">
                               <button onClick={handleSaveFactor} className="text-green-600 hover:bg-green-50 p-1.5 rounded"><Save size={16}/></button>
                               <button onClick={() => setEditingFactorId(null)} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded text-xs font-bold">cancel</button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 lg:opacity-100 transition-opacity">
                               {f.EsSistema && <span className="text-[9px] text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">Sistema</span>}
                               <button onClick={() => startEditFactor(f)} className="text-slate-400 hover:text-institutional-blue p-1 rounded hover:bg-blue-50 transition-colors"><Pencil size={14}/></button>
                               {onDeleteFactor && (
                                 <button onClick={() => onDeleteFactor(f.IdFactor)} disabled={f.EsSistema} className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-30"><Trash2 size={14}/></button>
                               )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
