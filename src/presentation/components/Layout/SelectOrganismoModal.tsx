import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, ChevronRight, AlertCircle, Search } from 'lucide-react';

interface SelectOrganismoModalProps {
  isOpen: boolean;
  onSave: (organismoId: string, dependenciaId: string) => void;
  organismos: any[];
  dependencias: any[];
  relaciones: any[];
}

export const SelectOrganismoModal: React.FC<SelectOrganismoModalProps> = ({
  isOpen, onSave, organismos, dependencias, relaciones
}) => {
  const [selectedOrganismo, setSelectedOrganismo] = useState<string>('');
  const [selectedDependencia, setSelectedDependencia] = useState<string>('');
  const [searchOrg, setSearchOrg] = useState('');
  const [searchDep, setSearchDep] = useState('');

  if (!isOpen) return null;

  const filteredOrganismos = organismos.filter(o => 
    o.nombre.toLowerCase().includes(searchOrg.toLowerCase())
  );

  const dependenciasDelOrganismoIds = relaciones
    .filter(r => r.type === "Organismo-Dependencia" && r.parentId === selectedOrganismo)
    .map(r => r.childId);

  const dependenciasDelOrganismo = dependencias.filter(d => 
    dependenciasDelOrganismoIds.includes(d.id) &&
    d.nombre.toLowerCase().includes(searchDep.toLowerCase())
  );

  const handleSave = () => {
    if (selectedOrganismo && selectedDependencia) {
      onSave(selectedOrganismo, selectedDependencia);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-4 shrink-0">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Building2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Selección de Organismo y Dependencia</h2>
              <p className="text-sm text-slate-500 mt-1">Por temas de practicidad y uso correcto, por favor indícanos a qué organismo y dependencia perteneces en el periodo laboral actual.</p>
            </div>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto">
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-3 text-sm">
              <AlertCircle className="shrink-0 mt-0.5 text-amber-600" size={18} />
              <p>Debes seleccionar tu organismo y dependencia para poder usar el sistema e ingresar tus cargas laborales de este periodo.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">1. Organismo</label>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Buscar organismo..."
                    value={searchOrg}
                    onChange={(e) => setSearchOrg(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  />
                </div>
                <div className="h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {filteredOrganismos.map(org => (
                    <button
                      key={org.id}
                      onClick={() => {
                        setSelectedOrganismo(org.id);
                        setSelectedDependencia(''); // Reset dep
                        setSearchDep('');
                      }}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between ${selectedOrganismo === org.id ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-slate-50 text-slate-700'}`}
                    >
                      <span className="truncate pr-4">{org.nombre}</span>
                      {selectedOrganismo === org.id && <ChevronRight size={16} className="shrink-0" />}
                    </button>
                  ))}
                  {filteredOrganismos.length === 0 && (
                    <div className="p-4 text-center text-sm text-slate-500">No se encontraron organismos</div>
                  )}
                </div>
              </div>

              {selectedOrganismo && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <label className="block text-sm font-semibold text-slate-700 mb-2">2. Dependencia</label>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="Buscar dependencia..."
                      value={searchDep}
                      onChange={(e) => setSearchDep(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                    />
                  </div>
                  <div className="h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                    {dependenciasDelOrganismo.map(dep => (
                      <button
                        key={dep.id}
                        onClick={() => setSelectedDependencia(dep.id)}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between ${selectedDependencia === dep.id ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-slate-50 text-slate-700'}`}
                      >
                        <span className="truncate pr-4">{dep.nombre}</span>
                        {selectedDependencia === dep.id && <ChevronRight size={16} className="shrink-0" />}
                      </button>
                    ))}
                    {dependenciasDelOrganismo.length === 0 && (
                      <div className="p-4 text-center text-sm text-slate-500">No hay dependencias para este organismo</div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          <div className="p-6 border-t border-slate-100 flex justify-end shrink-0 bg-white">
            <button
              onClick={handleSave}
              disabled={!selectedOrganismo || !selectedDependencia}
              className="px-6 py-2.5 bg-institutional-blue hover:bg-institutional-blue-dark text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirmar y Continuar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
