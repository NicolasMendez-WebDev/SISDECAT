import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Save, AlertCircle, Info } from 'lucide-react';

interface CreateElementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  type: string;
  parentId?: string;
  parentName?: string;
  parentType?: string;
  initialData?: any;
  mode: 'create' | 'edit';
}

export const CreateElementModal: React.FC<CreateElementModalProps> = ({ 
  isOpen, onClose, onSave, type, parentId, parentName, parentType, initialData, mode 
}) => {
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    estado: 'Activo'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || '',
        codigo: initialData.codigo || '',
        descripcion: initialData.descripcion || '',
        estado: initialData.estado || 'Activo'
      });
    } else {
      setFormData({
        nombre: '',
        codigo: '',
        descripcion: '',
        estado: 'Activo'
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave({
        ...formData,
        parentId: parentId || initialData?.parentId || initialData?.dependenciaId || initialData?.procesoId || initialData?.procedimientoId
      });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">
              {mode === 'create' ? `Crear Nuevo ${type}` : `Editar ${type}`}
            </h3>
            <p className="text-xs text-slate-500">Complete los campos para gestionar el catálogo maestro.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {parentId && parentName && parentType && (
            <div className="p-4 bg-institutional-blue/5 border border-institutional-blue/10 rounded-xl flex items-start gap-3">
              <Info size={18} className="text-institutional-blue mt-0.5 shrink-0" />
              <div className="text-sm text-slate-700">
                {mode === 'create' ? (
                  <>
                    <p>Estás a punto de agregar un nuevo <strong>{type}</strong> a {parentType === 'Organismo' ? 'el' : 'la'} <strong>{parentType} "{parentName}"</strong>.</p>
                    <p className="text-xs text-slate-500 mt-1">Completa la información a continuación para registrarlo en el sistema.</p>
                  </>
                ) : (
                  <>
                    <p>Estás editando {type === 'Organismo' ? 'el' : 'la'} <strong>{type} "{initialData?.nombre}"</strong>, que pertenece a {parentType === 'Organismo' ? 'el' : 'la'} <strong>{parentType} "{parentName}"</strong>.</p>
                    <p className="text-xs text-slate-500 mt-1">Modifica la información necesaria y guarda los cambios.</p>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nombre del Elemento</label>
            <input 
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder={`Ej: Secretaría de... o Proceso de...`}
              className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.nombre ? 'border-red-300 ring-2 ring-red-50' : 'border-slate-200 focus:ring-2 focus:ring-institutional-blue/20'} rounded-xl text-sm outline-none transition-all`}
            />
            {errors.nombre && <p className="text-[10px] text-red-500 font-bold flex items-center gap-1"><AlertCircle size={10} /> {errors.nombre}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Código Institucional</label>
            <input 
              type="text"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              placeholder="Ej: 001-01"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-institutional-blue/20 rounded-xl text-sm outline-none transition-all"
            />
            <p className="text-[10px] text-slate-400 mt-1">El ID interno de base de datos se generará automáticamente.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Descripción / Notas (Opcional)</label>
            <textarea 
              rows={3}
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Breve descripción del propósito de este elemento..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-institutional-blue/20 rounded-xl text-sm outline-none transition-all resize-none"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-1 px-6 py-3 text-sm font-bold text-white bg-institutional-blue rounded-xl hover:bg-institutional-blue/90 transition-all shadow-lg shadow-institutional-blue/20 flex items-center justify-center gap-2"
            >
              <Save size={18} />
              {mode === 'create' ? 'Crear Elemento' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
