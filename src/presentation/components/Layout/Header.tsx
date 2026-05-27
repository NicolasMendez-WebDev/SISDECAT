import React, { useState } from 'react';
import { Menu, Building2, ChevronRight, MessageSquare, Bell, ChevronDown, CheckCircle2, AlertCircle, Link2, Unlink, Edit2, Plus, Trash2, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { User, Vigencia } from '../../../domain/models/types';

interface HeaderProps {
  notifications?: {
    id: string, 
    message?: string, 
    date: string, 
    type: 'success' | 'error',
    element?: { id?: string, type: string, name: string, action: string, targetType?: string, targetName?: string, parentId?: string, multipleIds?: string[] }
  }[];
  onViewElement?: (id: string, parentId?: string, action?: string, multipleIds?: string[]) => void;
  currentUser: User;
  onLogout: () => void;
  activeVigencia?: Vigencia;
  onSelectVigencia?: (id: string) => void;
  vigencias?: Vigencia[];
}

export const Header: React.FC<HeaderProps> = ({ notifications = [], onViewElement, currentUser, onLogout, activeVigencia, onSelectVigencia, vigencias = [] }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showVigenciaMenu, setShowVigenciaMenu] = useState(false);

  const getElementColor = (type: string) => {
    switch (type) {
      case 'Organismo': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Dependencia': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Proceso': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Procedimiento': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Actividad': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getNotificationIcon = (action?: string, type?: string) => {
    if (type === 'error') return <AlertCircle size={16} />;
    
    switch (action) {
      case 'vinculado':
      case 'vinculados':
        return <Link2 size={16} />;
      case 'desvinculado':
        return <Unlink size={16} />;
      case 'creado':
        return <Plus size={16} />;
      case 'actualizado':
        return <Edit2 size={16} />;
      case 'desactivado':
      case 'eliminado':
        return <Trash2 size={16} />;
      default:
        return <CheckCircle2 size={16} />;
    }
  };

  const getNotificationBg = (action?: string, type?: string) => {
    if (type === 'error') return 'bg-red-100 text-red-500';
    
    switch (action) {
      case 'vinculado':
      case 'vinculados':
        return 'bg-blue-100 text-blue-600';
      case 'desvinculado':
        return 'bg-cyan-100 text-cyan-600';
      case 'creado':
        return 'bg-emerald-100 text-emerald-600';
      case 'actualizado':
        return 'bg-amber-100 text-amber-600';
      case 'desactivado':
      case 'eliminado':
        return 'bg-red-100 text-red-500';
      default:
        return 'bg-institutional-blue/10 text-institutional-blue';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
          <Building2 size={16} />
          <span>SDMCT</span>
          <ChevronRight size={14} />
          <span className="font-medium text-slate-700">Sistema digital para la medición de cargas de trabajo.</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button 
            onClick={() => currentUser.rol !== 'Funcionario' && setShowVigenciaMenu(!showVigenciaMenu)}
            className={`hidden lg:flex items-center gap-3 px-4 py-2 bg-institutional-blue/5 border border-institutional-blue/10 rounded-lg transition-all text-left min-w-[320px] max-w-[450px] ${currentUser.rol !== 'Funcionario' ? 'hover:bg-institutional-blue/10 cursor-pointer' : 'cursor-default'}`}
          >
            <CalendarDays size={16} className="text-institutional-blue shrink-0" />
            <div className="flex flex-col flex-1 truncate">
              <span className="text-[10px] font-bold text-institutional-blue uppercase tracking-wider leading-none">Vigencia Visualizada</span>
              <span className="text-sm font-medium text-slate-800 leading-none mt-1.5 truncate">
                {activeVigencia ? `${activeVigencia.Nombre}, ${activeVigencia.Anio}` : "No hay vigencia"}
              </span>
              {activeVigencia && (
                 <span className={`text-[9px] font-bold mt-1.5 px-2 py-0.5 rounded-full w-fit uppercase tracking-wider ${
                    activeVigencia.Estado === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 
                    activeVigencia.Estado === 'Historico' ? 'bg-slate-200 text-slate-700' :
                    activeVigencia.Estado === 'Cerrado' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                 }`}>
                    {activeVigencia.Estado}
                 </span>
              )}
            </div>
            {currentUser.rol !== 'Funcionario' && (
              <ChevronDown size={16} className="text-institutional-blue/50 shrink-0 ml-2" />
            )}
          </button>
          
          <AnimatePresence>
            {showVigenciaMenu && currentUser.rol !== 'Funcionario' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full right-0 mt-2 min-w-[320px] max-w-[450px] w-full bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Seleccionar Vigencia</p>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {vigencias.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-slate-500">
                      No hay vigencias disponibles
                    </div>
                  ) : (
                    vigencias.map(v => (
                      <button
                        key={v.IdVigencia}
                        onClick={() => {
                          onSelectVigencia?.(v.IdVigencia);
                          setShowVigenciaMenu(false);
                        }}
                        className={`w-full text-left px-4 py-3.5 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 ${v.IdVigencia === activeVigencia?.IdVigencia ? 'bg-institutional-blue/5 hover:bg-institutional-blue/10' : ''}`}
                      >
                        <div className="flex-1 w-0">
                          <p className={`text-sm font-medium truncate ${v.IdVigencia === activeVigencia?.IdVigencia ? 'text-institutional-blue' : 'text-slate-700'}`}>
                            {v.Nombre}, {v.Anio}
                          </p>
                          <span className={`text-[9px] font-bold mt-1.5 inline-block px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            v.Estado === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 
                            v.Estado === 'Historico' ? 'bg-slate-200 text-slate-700' :
                            v.Estado === 'Cerrado' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {v.Estado}
                          </span>
                        </div>
                        {v.IdVigencia === activeVigencia?.IdVigencia && <CheckCircle2 size={18} className="text-institutional-blue shrink-0" />}
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-1">
          {currentUser && ['Administrador', 'AdminFuncional'].includes(currentUser.rol || '') && (
            <div className="relative">
              <button 
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 relative"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
              <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full right-0 mt-2 w-[420px] bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50"
                >
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-700 text-sm">Notificaciones</h3>
                  </div>
                  <div className="max-h-[500px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-500">No hay notificaciones</div>
                    ) : (
                      notifications.map(n => {
                        const isMultiple = n.element?.action === 'vinculados';
                        return (
                          <div key={n.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-3">
                            <div className={`mt-0.5 shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${getNotificationBg(n.element?.action, n.type)}`}>
                              {getNotificationIcon(n.element?.action, n.type)}
                            </div>
                            <div className="flex-1">
                              {n.element ? (
                                <div className="flex flex-col gap-2.5">
                                  <div className="text-sm text-slate-700 leading-relaxed flex flex-wrap items-center gap-x-1.5 gap-y-1">
                                    <span>{isMultiple ? 'Los' : 'El'}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${getElementColor(n.element.type)}`}>{n.element.type}{isMultiple ? 's' : ''}</span>
                                    <strong>{n.element.name}</strong>
                                    <span>{isMultiple ? 'han sido' : 'ha sido'} {n.element.action} de forma {n.type === 'success' ? 'exitosa' : 'errónea'}</span>
                                    {n.element.targetType && n.element.targetName && (
                                      <>
                                        <span>al</span>
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${getElementColor(n.element.targetType)}`}>{n.element.targetType}</span>
                                        <strong>{n.element.targetName}</strong>
                                      </>
                                    )}
                                    <span>.</span>
                                  </div>
                                  {n.element.id && n.element.action !== 'desactivado' && n.element.action !== 'eliminado' && n.element.action !== 'desvinculado' && (
                                    <div className="flex justify-end mt-1">
                                      <button 
                                        onClick={() => {
                                          setShowNotifications(false);
                                          if (onViewElement) onViewElement(n.element!.id!, n.element!.parentId, n.element!.action, n.element!.multipleIds);
                                        }}
                                        className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors w-fit border border-slate-200 shadow-sm"
                                      >
                                        Ver en Estructura
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-slate-700">{n.message}</p>
                              )}
                              <p className="text-[10px] text-slate-400 mt-2 font-medium">{new Date(n.date).toLocaleString()}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          )}
        </div>
        <div className="h-8 w-px bg-slate-200"></div>
        <div className="flex items-center gap-3 p-1.5 rounded-lg cursor-default">
          <div className="w-8 h-8 bg-institutional-green text-white rounded-full flex items-center justify-center font-medium text-sm">
            {currentUser.nombre.substring(0, 2).toUpperCase()}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-sm font-medium text-slate-700">{currentUser.nombre}</div>
            <div className="text-xs text-slate-500">{currentUser.rol}</div>
          </div>
        </div>
      </div>
    </header>
  );
};
