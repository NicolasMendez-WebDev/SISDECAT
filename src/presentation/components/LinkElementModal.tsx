import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, ChevronRight, ChevronLeft, CheckSquare, Square } from 'lucide-react';
import { Organismo, Dependencia, Proceso, Procedimiento, Actividad } from '../../domain/models/types';

interface LinkElementModalProps {
  config: { isOpen: boolean, parentType: string, parentId: string, childType: string, ancestorDepId?: string } | null;
  onClose: () => void;
  onLink: (childIds: string[]) => void;
  organismos: Organismo[];
  dependencias: Dependencia[];
  procesos: Proceso[];
  procedimientos: Procedimiento[];
  actividades: Actividad[];
  relaciones: any[];
}

export const LinkElementModal: React.FC<LinkElementModalProps> = ({ 
  config, onClose, onLink, organismos, dependencias, procesos, procedimientos, actividades, relaciones 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (config?.isOpen) {
      setSearchTerm('');
      setSelectedIds([]);
    }
  }, [config?.isOpen]);

  if (!config || !config.isOpen) return null;

  let itemsToLink: any[] = [];
  if (config.childType === 'Dependencia') {
    itemsToLink = dependencias.filter(d => {
      if (d.id === config.parentId) return false;
      const isNativeChild = d.parentId === config.parentId;
      const isExcluded = relaciones.some(r => r.type === 'Dependencia' && r.childId === d.id && r.parentId === config.parentId && r.activo === false);
      const isAlreadyLinkedActive = relaciones.some(r => r.type === 'Dependencia' && r.childId === d.id && r.parentId === config.parentId && r.activo !== false);

      if (isNativeChild) {
        return isExcluded;
      } else {
        return !isAlreadyLinkedActive;
      }
    });
  } else if (config.childType === 'Proceso') {
    itemsToLink = procesos.filter(p => {
      const isNativeChild = p.dependenciaId === config.parentId;
      const isExcluded = relaciones.some(r => r.type === 'Proceso' && r.childId === p.id && r.parentId === config.parentId && r.activo === false);
      const isAlreadyLinkedActive = relaciones.some(r => r.type === 'Proceso' && r.childId === p.id && r.parentId === config.parentId && r.activo !== false);

      if (isNativeChild) {
        return isExcluded;
      } else {
        return !isAlreadyLinkedActive;
      }
    });
  } else if (config.childType === 'Procedimiento') {
    itemsToLink = procedimientos.filter(p => {
      const belongsToThisProcess = p.procesoId === config.parentId;
      if (!belongsToThisProcess) return false;

      const isExcluded = relaciones.some(r => 
        r.type === 'Procedimiento' && 
        r.childId === p.id && 
        r.activo === false && 
        (
          (config.ancestorDepId && String(r.parentId).toLowerCase() === String(config.ancestorDepId).toLowerCase()) ||
          String(r.parentId).toLowerCase() === String(config.parentId).toLowerCase()
        )
      );
      return isExcluded;
    });
  } else if (config.childType === 'Actividad') {
    itemsToLink = actividades.filter(a => {
      const belongsToThisPcd = a.procedimientoId === config.parentId;
      if (!belongsToThisPcd) return false;

      const isExcluded = relaciones.some(r => 
        r.type === 'Actividad' && 
        r.childId === a.id && 
        r.activo === false && 
        (
          (config.ancestorDepId && String(r.parentId).toLowerCase() === String(config.ancestorDepId).toLowerCase()) ||
          String(r.parentId).toLowerCase() === String(config.parentId).toLowerCase()
        )
      );
      return isExcluded;
    });
  }


  const filteredItems = itemsToLink.filter(item => 
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.codigo && item.codigo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const parentNode = 
    config.parentType === 'Organismo' ? organismos.find(o => o.id === config.parentId) :
    config.parentType === 'Dependencia' ? dependencias.find(d => d.id === config.parentId) :
    config.parentType === 'Proceso' ? procesos.find(p => p.id === config.parentId) :
    config.parentType === 'Procedimiento' ? procedimientos.find(p => p.id === config.parentId) : null;

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'Organismo': return 'bg-blue-100 text-blue-700';
      case 'Dependencia': return 'bg-emerald-100 text-emerald-700';
      case 'Proceso': return 'bg-amber-100 text-amber-700';
      case 'Procedimiento': return 'bg-purple-100 text-purple-700';
      case 'Actividad': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const handleLink = () => {
    if (selectedIds.length > 0) {
      onLink(selectedIds);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col h-[75vh] modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${getBadgeColor(config.parentType)}`}>
              Padre: {config.parentType}
            </span>
            <span className="text-xs font-bold text-slate-400">ID: {config.parentId}</span>
          </div>
          <h3 className="font-bold text-lg text-slate-800">Vincular {config.childType}s a "{parentNode?.nombre || config.parentId}"</h3>
          <p className="text-sm text-slate-500">Seleccione uno o varios {config.childType.toLowerCase()}s del catálogo base para establecer la relación. Los procedimientos y actividades asociados se vincularán automáticamente.</p>
        </div>
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder={`Buscar por nombre o código de ${config.childType.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-institutional-blue/20 outline-none transition-all"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredItems.length > 0 ? (
            filteredItems.map(item => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <button 
                  key={item.id} 
                  onClick={() => toggleSelection(item.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center group shadow-sm hover:shadow-md ${
                    isSelected ? 'bg-institutional-blue/5 border-institutional-blue' : 'bg-slate-50 border-slate-100 hover:border-institutional-blue/50 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`shrink-0 ${isSelected ? 'text-institutional-blue' : 'text-slate-300 group-hover:text-institutional-blue/50'}`}>
                      {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{item.nombre}</span>
                        {item.codigo && (
                          <span className="text-[10px] font-mono bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                            {item.codigo}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-mono">ID: {item.id}</span>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${getBadgeColor(config.childType)}`}>
                          {config.childType}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Search size={48} className="text-slate-200 mb-4" />
              <p className="text-sm">No se encontraron {config.childType.toLowerCase()}s disponibles.</p>
            </div>
          )}
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-6 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleLink}
            disabled={selectedIds.length === 0}
            className={`px-6 py-2 text-sm font-bold rounded-xl transition-colors flex items-center gap-2 ${
              selectedIds.length > 0 
                ? 'bg-institutional-blue text-white hover:bg-institutional-blue/90 shadow-md' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Vincular {selectedIds.length > 0 ? `${selectedIds.length} elemento${selectedIds.length > 1 ? 's' : ''}` : ''}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
