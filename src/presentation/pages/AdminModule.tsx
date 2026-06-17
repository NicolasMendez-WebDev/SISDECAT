import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Search, Edit2, Trash2, CalendarDays, KeyRound, Cog, PlusCircle, Save, ShieldAlert } from 'lucide-react';
import { Organismo, Dependencia, Proceso, Procedimiento, Actividad, Vigencia, User as UserType, VigenciaUsuario } from '../../domain/models/types';
import { CargasTable } from '../components/shared/CargasTable';
import { UsuariosTable } from '../components/shared/UsuariosTable';
import { RecordDetailsModal } from '../components/shared/RecordDetailsModal';
import { CatalogosAdmin } from '../components/Admin/CatalogosAdmin';

interface AdminModuleProps {
  cargas: any[];
  cargos?: any[];
  factores?: any[];
  onSaveCargo?: (c: any) => Promise<void>;
  onDeleteCargo?: (id: number) => Promise<void>;
  onSaveFactor?: (f: any) => Promise<void>;
  onDeleteFactor?: (id: number) => Promise<void>;
  onUpdate: (data: any) => void;
  onDelete: (id: string) => void;
  organismos: Organismo[];
  dependencias: Dependencia[];
  actividades: Actividad[];
  procesos: Proceso[];
  procedimientos: Procedimiento[];
  vigencias: Vigencia[];
  onVigenciaUpdate: (v: Vigencia) => void;
  onVigenciaCreate: (v: Vigencia, sourceVigenciaId?: string | null) => void;
  usuarios?: UserType[];
  vigenciasUsuarios?: VigenciaUsuario[];
  onUpdateVigenciaUsuario?: (vu: VigenciaUsuario) => void;
  onUpdateUsuario?: (user: UserType) => void;
  onAddUsuario?: (user: UserType) => void;
  currentUser?: UserType;
  onRestoreMockData?: () => void;
  vigenciaActiva?: boolean;
  showToast?: (msg: string, type: 'success'|'error') => void;
  isLoadingRecords?: boolean;
  onReorderCargos?: (c: any[]) => void;
  onReorderFactores?: (f: any[]) => void;
}

export const AdminModule: React.FC<AdminModuleProps> = ({ 
  cargas, cargos = [], factores = [], onSaveCargo, onDeleteCargo, onSaveFactor, onDeleteFactor,
  onReorderCargos, onReorderFactores,
  onUpdate, onDelete, organismos, dependencias, actividades, procesos, procedimientos,
  vigencias, onVigenciaUpdate, onVigenciaCreate, usuarios = [], onUpdateUsuario, onAddUsuario, currentUser,
  vigenciasUsuarios = [], onUpdateVigenciaUsuario, onRestoreMockData, vigenciaActiva = true, showToast, isLoadingRecords
}) => {
  // Find the active/current vigencia to display and edit organisms/roles in that active context
  const activeVigencia = vigencias.find(v => v.Estado === 'Activo') || vigencias.find(v => v.Estado === 'Borrador') || vigencias[0];
  const activeVigenciaId = activeVigencia?.IdVigencia || null;

  const [activeTab, setActiveTab] = useState<'registros' | 'vigencias' | 'usuarios' | 'catalogos'>('vigencias');
  const [selectedCarga, setSelectedCarga] = useState<any | null>(null);
  const [cargaEditMode, setCargaEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Vigencia Form State
  const [isEditingVigencia, setIsEditingVigencia] = useState(false);
  const [currentVigencia, setCurrentVigencia] = useState<Partial<Vigencia>>({});
  const [isNewVigencia, setIsNewVigencia] = useState(false);
  const [copyStructures, setCopyStructures] = useState(false);
  const [selectedSourceVigenciaId, setSelectedSourceVigenciaId] = useState<string | null>(null);

  const orgMap = React.useMemo(() => new Map(organismos.map(o => [o.id, o.nombre])), [organismos]);
  const depMap = React.useMemo(() => new Map(dependencias.map(d => [d.id, d.nombre])), [dependencias]);
  const actMap = React.useMemo(() => new Map(actividades.map(a => [a.id, a.nombre])), [actividades]);
  const procMap = React.useMemo(() => new Map(procesos.map(p => [p.id, p.nombre])), [procesos]);
  const pcdMap = React.useMemo(() => new Map(procedimientos.map(p => [p.id, p.nombre])), [procedimientos]);

  const findName = (type: 'organismo' | 'dependencia' | 'actividad' | 'proceso' | 'procedimiento', id: string) => {
    if (!id) return 'N/A';
    let itemName;
    switch (type) {
      case 'organismo': itemName = orgMap.get(id); break;
      case 'dependencia': itemName = depMap.get(id); break;
      case 'actividad': itemName = actMap.get(id); break;
      case 'proceso': itemName = procMap.get(id); break;
      case 'procedimiento': itemName = pcdMap.get(id); break;
    }
    return itemName || 'Desconocido';
  };

  const sortedVigencias = [...vigencias].sort((a, b) => {
    if (a.Estado === 'Activo' && b.Estado !== 'Activo') return -1;
    if (b.Estado === 'Activo' && a.Estado !== 'Activo') return 1;
    if (a.Anio !== b.Anio) return b.Anio - a.Anio; // Descending year
    // Further fallback, could be IdVigencia but as we just want newer first
    return b.IdVigencia > a.IdVigencia ? 1 : -1; 
  });

  const handleEditVigencia = (v: Vigencia) => {
    setCurrentVigencia(v);
    setIsNewVigencia(false);
    setIsEditingVigencia(true);
  };

  const handleNewVigencia = () => {
    setCurrentVigencia({
      IdVigencia: crypto.randomUUID(),
      Nombre: 'Estudio de cargas de trabajo',
      Anio: new Date().getFullYear(),
      Estado: 'Borrador',
      Param_TS: 0.07,
      Param_HorasEfectivas: 167.2,
      Param_JornadaDiaria: 8.8,
      Activo: true
    });
    setIsNewVigencia(true);
    setCopyStructures(false);
    const lastVigencia = sortedVigencias.find(v => v.Estado !== 'Borrador') || sortedVigencias[0];
    setSelectedSourceVigenciaId(lastVigencia ? lastVigencia.IdVigencia : null);
    setIsEditingVigencia(true);
  };

  const saveVigencia = () => {
    if (currentVigencia.Anio && currentVigencia.Nombre) {
      if (currentVigencia.Estado === 'Activo') {
        const existingActive = vigencias.find(v => v.Estado === 'Activo' && v.IdVigencia !== currentVigencia.IdVigencia);
        if (existingActive) {
          if (showToast) {
            showToast("No se pueden tener dos vigencias activas. Pase la actual a otro estado antes.", "error");
          } else {
            alert("Error: Solo puede haber una vigencia activa a la vez. Debe pasar la vigencia activa actual a otro estado antes.");
          }
          return;
        }
      }

      if (vigencias.some(v => v.IdVigencia === currentVigencia.IdVigencia)) {
        onVigenciaUpdate(currentVigencia as Vigencia);
      } else {
        onVigenciaCreate(currentVigencia as Vigencia, copyStructures ? selectedSourceVigenciaId : null);
      }
      setIsEditingVigencia(false);
    }
  };

  const isOriginalHistorico = !isNewVigencia && vigencias.find(v => v.IdVigencia === currentVigencia?.IdVigencia)?.Estado === 'Historico';

  return (
    <div className="p-6">
      
      {/* Module Navigation */}
      <div className="flex border-b border-slate-200 mb-6 gap-4">
        <button 
          onClick={() => setActiveTab('vigencias')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'vigencias' ? 'border-institutional-blue text-institutional-blue' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Cog size={16} /> Parámetros y Vigencias
        </button>
        <button 
          onClick={() => setActiveTab('registros')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'registros' ? 'border-institutional-blue text-institutional-blue' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Search size={16} /> Registros de Captura
        </button>
        <button 
          onClick={() => setActiveTab('usuarios')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'usuarios' ? 'border-institutional-blue text-institutional-blue' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <User size={16} /> Directorio de Cuentas
        </button>
        <button 
          onClick={() => setActiveTab('catalogos')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'catalogos' ? 'border-institutional-blue text-institutional-blue' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <KeyRound size={16} /> Catálogos del Sistema
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'vigencias' && (
          <motion.div
            key="vigencias"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Gestión de Vigencias SISDECAT</h2>
                <p className="text-sm text-slate-500">Administra los parámetros metodológicos y el aislamiento histórico.</p>
              </div>
              <button onClick={handleNewVigencia} className="bg-institutional-blue text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-institutional-blue/90 transition-colors">
                <PlusCircle size={16} />
                Nueva Vigencia
              </button>
            </div>

            {vigencias.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 border-dashed text-center space-y-4">
                <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center">
                  <CalendarDays className="text-slate-400" size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-700">No hay vigencias creadas</h3>
                  <p className="text-sm text-slate-500 max-w-sm mt-1">
                    Crea una nueva vigencia para configurar la estructura organizacional, parámetros y comenzar a registrar cargas de trabajo.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedVigencias.map(v => (
                <div key={v.IdVigencia} className={`bg-white rounded-2xl border ${v.Estado === 'Activo' ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500/20' : 'border-slate-200 shadow-sm'} p-6 relative`}>
                  {v.Estado === 'Activo' && (
                    <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl uppercase tracking-wider">
                      Vigencia Activa
                    </div>
                  )}
                  {v.Estado === 'Historico' && (
                    <div className="absolute top-0 right-0 bg-slate-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl uppercase tracking-wider">
                      Histórico
                    </div>
                  )}
                  {v.Estado === 'Cerrado' && (
                    <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl uppercase tracking-wider">
                      Cerrado
                    </div>
                  )}
                  {v.Estado === 'Borrador' && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl uppercase tracking-wider">
                      Borrador
                    </div>
                  )}

                  <div className="flex items-start gap-4 mb-4 mt-2">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                      <CalendarDays className="text-slate-400" size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{v.Nombre}</h3>
                      <p className="text-sm text-slate-500">Año Operativo: {v.Anio}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                     <div className="flex justify-between items-center text-sm">
                       <span className="text-slate-500 font-medium">% Tiempo Suplementario:</span>
                       <span className="font-bold text-slate-700">{(v.Param_TS * 100).toFixed(0)}%</span>
                     </div>
                     <div className="flex justify-between items-center text-sm">
                       <span className="text-slate-500 font-medium">Horas Efectivas Mes:</span>
                       <span className="font-bold text-slate-700">{v.Param_HorasEfectivas} Hrs</span>
                     </div>
                     <div className="flex justify-between items-center text-sm">
                       <span className="text-slate-500 font-medium">Jornada Diaria:</span>
                       <span className="font-bold text-slate-700">{v.Param_JornadaDiaria} Hrs</span>
                     </div>
                  </div>

                  <div className="flex justify-between mt-auto">
                    <button onClick={() => handleEditVigencia(v)} className="text-sm font-bold w-full justify-center text-slate-500 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors">
                       <Edit2 size={14}/> Editar Vigencia
                    </button>
                  </div>
                </div>
              ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'registros' && (
          <motion.div
            key="registros"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <User size={18} className="text-institutional-blue" />
                  <h2 className="font-bold text-slate-700 uppercase text-xs tracking-wider">Administración de Registros Operativos</h2>
                </div>
                <div className="flex items-center gap-4">
                  {!import.meta.env.PROD && onRestoreMockData && (
                    <button
                      onClick={onRestoreMockData}
                      className="text-xs font-bold px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition flex items-center gap-2"
                      title="Restaurar base de datos de pruebas (Mock Data)"
                    >
                      <Save size={14} /> Restaurar Datos de Prueba
                    </button>
                  )}
                  <span className="bg-institutional-blue/10 text-institutional-blue text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                    {cargas.length} Registros Activos
                  </span>
                </div>
              </div>
              <CargasTable
                isLoading={isLoadingRecords}
                cargas={cargas}
                actividades={actividades}
                dependencias={dependencias}
                procedimientos={procedimientos}
                currentUser={currentUser!}
                onViewDetails={(carga) => { setSelectedCarga(carga); setCargaEditMode(false); }}
                onEdit={vigenciaActiva ? ((carga) => { setSelectedCarga(carga); setCargaEditMode(true); }) : undefined}
                onDelete={vigenciaActiva ? onDelete : undefined}
              />
            </div>
          </motion.div>
        )}
        {activeTab === 'usuarios' && (
          <motion.div
            key="usuarios"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Directorio de Cuentas del Sistema</h2>
                <p className="text-sm text-slate-500">Muestra el directorio de todas las cuentas registradas que han ingresado al sistema.</p>
              </div>
              <button 
                disabled
                className="bg-institutional-blue/50 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 cursor-not-allowed"
                title="Sincronización automática de M. Entra ID habilitada"
              >
                <ShieldAlert size={16} /> SSO Entra ID
              </button>
            </div>

            <UsuariosTable
              usuarios={usuarios}
              vigenciasUsuarios={vigenciasUsuarios}
              organismos={organismos}
              selectedVigenciaId={activeVigenciaId}
              editMode={true}
              showRolesAndDeps={true}
              onUpdateVigenciaUsuario={onUpdateVigenciaUsuario}
              onUpdateGlobalUsuario={onUpdateUsuario}
            />
          </motion.div>
        )}

        {activeTab === 'catalogos' && (
          <motion.div
            key="catalogos"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Catálogos Auxiliares por Vigencia</h2>
                <p className="text-sm text-slate-500">Administre los cargos y las frecuencias disponibles para la selección en la pantalla de captura, específicos para cada vigencia.</p>
              </div>
            </div>
            <CatalogosAdmin
              vigencias={vigencias}
              cargos={cargos}
              factores={factores}
              onSaveCargo={onSaveCargo}
              onDeleteCargo={onDeleteCargo}
              onSaveFactor={onSaveFactor}
              onDeleteFactor={onDeleteFactor}
              onReorderCargos={onReorderCargos}
              onReorderFactores={onReorderFactores}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Carga Modal */}
      <AnimatePresence>
        {selectedCarga && (
          <RecordDetailsModal
            key={selectedCarga.id}
            record={selectedCarga}
            initialEditMode={cargaEditMode}
            onClose={() => { setSelectedCarga(null); setCargaEditMode(false); }}
            onSave={vigenciaActiva ? ((updatedRecord) => {
              onUpdate(updatedRecord);
              setSelectedCarga(null);
              setCargaEditMode(false);
            }) : undefined}
            onDelete={vigenciaActiva ? (() => { onDelete(selectedCarga.id); setSelectedCarga(null); setCargaEditMode(false); }) : undefined}
            canDelete={vigenciaActiva}
            organismos={organismos}
            dependencias={dependencias}
            procesos={procesos}
            procedimientos={procedimientos}
            actividades={actividades}
            currentUserRole={currentUser?.rol}
          />
        )}
      </AnimatePresence>

      {/* Edit/Create Vigencia Modal */}
      <AnimatePresence>
        {isEditingVigencia && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-xl border border-slate-200 overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3 sticky top-0 z-10">
                <Cog className="text-institutional-blue" />
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-800">Parámetros de Vigencia SISDECAT</h3>
                  <p className="text-sm text-slate-500">Configuración global inviolable para los cálculos Beta-PERT y ETP.</p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 hover:text-slate-700 transition-colors">Nombre de la Vigencia</label>
                  <input 
                    type="text" 
                    value={currentVigencia.Nombre} 
                    onChange={e => setCurrentVigencia({...currentVigencia, Nombre: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-institutional-blue/20 focus:border-institutional-blue transition-all"
                    placeholder="Ej. Medición DAFP 2025"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 hover:text-slate-700 transition-colors">Año Operativo</label>
                    <input 
                      type="number" 
                      value={currentVigencia.Anio || ''} 
                      onChange={e => setCurrentVigencia({...currentVigencia, Anio: parseInt(e.target.value)})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-institutional-blue/20 focus:border-institutional-blue transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 hover:text-slate-700 transition-colors">Estado de Vigencia</label>
                    <select 
                      value={currentVigencia.Estado} 
                      onChange={e => setCurrentVigencia({...currentVigencia, Estado: e.target.value as any})}
                      disabled={isOriginalHistorico}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-institutional-blue/20 focus:border-institutional-blue transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="Borrador">Borrador (Configuración)</option>
                      <option value="Activo">Activo (En Producción)</option>
                      <option value="Cerrado">Cerrado / Bloqueado</option>
                      {(!isNewVigencia && currentVigencia.Estado === 'Historico') || currentVigencia.Estado !== 'Historico' ? (
                        <option value="Historico">Histórico (Auditoría)</option>
                      ) : null}
                    </select>
                  </div>
                </div>

                {isNewVigencia && (
                  <div className="pt-4 border-t border-slate-100">
                    <label className="flex items-start gap-4 cursor-pointer p-4 bg-institutional-blue/5 rounded-xl border border-institutional-blue/20 hover:bg-institutional-blue/10 transition-colors">
                      <div className="pt-0.5">
                        <input 
                          type="checkbox" 
                          checked={copyStructures}
                          onChange={(e) => setCopyStructures(e.target.checked)}
                          className="w-5 h-5 rounded border-slate-300 text-institutional-blue focus:ring-institutional-blue cursor-pointer"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-800">Cargar estructuras y relaciones de estudios anteriores</p>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          Al seleccionar esta opción, se replicará toda la estructura organizacional, procedimental y el mapa de relaciones de la vigencia seleccionada. Esto preparará de inmediato el nuevo estudio conservando las listas blancas y jerarquías.
                        </p>
                        {copyStructures && (
                          <div className="mt-3">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Estudio de Origen</label>
                            <select 
                              value={selectedSourceVigenciaId || ''} 
                              onChange={e => setSelectedSourceVigenciaId(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-institutional-blue/20 focus:border-institutional-blue cursor-pointer"
                            >
                              <option value="" disabled>Seleccione un estudio anterior...</option>
                              {sortedVigencias.map(v => (
                                <option key={v.IdVigencia} value={v.IdVigencia}>{v.Nombre} ({v.Anio}) - {v.Estado}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100">
                   <h4 className="font-bold text-sm text-slate-800 mb-3">Constantes Matemáticas (Decreto 785/2005)</h4>
                   <div className="grid grid-cols-3 gap-4">
                     <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Coeficiente TS</label>
                       <input 
                         type="number" step="0.01"
                         value={currentVigencia.Param_TS || ''} 
                         onChange={e => setCurrentVigencia({...currentVigencia, Param_TS: parseFloat(e.target.value)})}
                         disabled={isOriginalHistorico}
                         className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-700 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-50"
                       />
                       <p className="text-[9px] text-slate-400 mt-1">Decimal (Ej: 0.07 para 7%)</p>
                     </div>
                     <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Horas Efectivas M.</label>
                       <input 
                         type="number" step="0.1"
                         value={currentVigencia.Param_HorasEfectivas || ''} 
                         onChange={e => setCurrentVigencia({...currentVigencia, Param_HorasEfectivas: parseFloat(e.target.value)})}
                         disabled={isOriginalHistorico}
                         className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-700 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-50"
                       />
                       <p className="text-[9px] text-slate-400 mt-1">Estándar: 167.2</p>
                     </div>
                     <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Jornada Diaria</label>
                       <input 
                         type="number" step="0.1"
                         value={currentVigencia.Param_JornadaDiaria || ''} 
                         onChange={e => setCurrentVigencia({...currentVigencia, Param_JornadaDiaria: parseFloat(e.target.value)})}
                         disabled={isOriginalHistorico}
                         className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-700 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-50"
                       />
                       <p className="text-[9px] text-slate-400 mt-1">Estándar: 8.8 hrs</p>
                     </div>
                   </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center sticky bottom-0 z-10">
                 <div>
                   {!isNewVigencia && (
                     <button
                       onClick={() => setShowDeleteConfirm(true)}
                       className="p-2 flex items-center gap-2 text-sm font-bold text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
                     >
                       <Trash2 size={18} />
                     </button>
                   )}
                 </div>
                 <div className="flex justify-end gap-3">
                   <button onClick={() => setIsEditingVigencia(false)} className="px-4 py-2 flex items-center gap-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
                     Cancelar
                   </button>
                   <button onClick={saveVigencia} className="px-5 py-2 flex items-center gap-2 text-sm font-bold text-white bg-institutional-blue rounded-xl hover:bg-institutional-blue/90 transition-colors shadow-sm">
                     <Save size={16} /> Aplicar Parámetros
                   </button>
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Vigencia Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">¿Desactivar Vigencia?</h3>
                <p className="text-slate-600 text-sm mb-6">
                  Está a punto de desactivar (eliminar lógicamente) la vigencia <strong>{currentVigencia.Nombre}</strong>. 
                  Esta acción la pasará a un estado inactivo permanente y ya no se visualizará en los registros principales. 
                  ¿Desea continuar?
                </p>
                
                <div className="flex gap-3 justify-center">
                  <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => {
                      onVigenciaUpdate({ ...currentVigencia, Activo: false } as Vigencia);
                      setShowDeleteConfirm(false);
                      setIsEditingVigencia(false);
                    }}
                    className="px-6 py-2.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
                  >
                    Sí, Desactivar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
