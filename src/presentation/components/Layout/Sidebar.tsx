import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Network,
  ClipboardEdit,
  BarChart3,
  User,
  Settings,
  Shield,
  LogOut,
  Menu,
  Home,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Module, User as UserType } from "../../../domain/models/types";
import { Logo } from "../shared/Logo";

interface SidebarProps {
  currentUser: UserType;
  activeModule: Module;
  setActiveModule: (m: Module) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeModule,
  setActiveModule,
  onLogout,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    const handleOpenSidebar = () => setIsCollapsed(false);
    window.addEventListener('open-sidebar', handleOpenSidebar);
    return () => window.removeEventListener('open-sidebar', handleOpenSidebar);
  }, []);

  const menuItems = [
    { id: "inicio", icon: Home, label: "Inicio", allowedRoles: ["Funcionario"] },
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", allowedRoles: ["AdminFuncional", "Administrador", "Analista"] },
    { id: "estructura", icon: Network, label: "Estructura", allowedRoles: ["AdminFuncional", "Administrador", "Funcionario", "Analista"] },
    { id: "captura", icon: ClipboardEdit, label: "Captura de Cargas", allowedRoles: ["AdminFuncional", "Administrador", "Analista", "Funcionario"] },
    { id: "reportes", icon: BarChart3, label: "Reportes", allowedRoles: ["AdminFuncional", "Administrador", "Analista"] },
    { id: "admin", icon: Shield, label: "Admin", allowedRoles: ["AdminFuncional", "Administrador"] },
  ].filter(item => item.allowedRoles.includes(currentUser.rol));

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 64 : 256 }}
      className="bg-white border-r border-slate-200 h-screen flex flex-col shrink-0 z-50 relative overflow-visible"
    >
      <div
        className={`h-16 px-4 flex items-center border-b border-slate-100 ${isCollapsed ? "justify-center" : "justify-between"}`}
      >
        <div
          className={`flex items-center gap-3 overflow-hidden transition-opacity duration-200 ${isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100"}`}
        >
          <Logo className="w-10 h-10" />
          <span className="font-bold text-[#2cbb47] truncate text-xl whitespace-nowrap">
            SISDECAT
          </span>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors shrink-0"
          title={isCollapsed ? "Expandir menú" : "Contraer menú"}
        >
          <Menu size={20} />
        </button>
      </div>

      <nav className="flex-1 py-4 flex flex-col gap-1 px-3">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveModule(item.id as Module)}
            className={`w-full flex items-center gap-3 p-3 transition-colors relative group rounded-xl ${
              activeModule === item.id
                ? "text-institutional-blue bg-institutional-blue/5"
                : "text-slate-500 hover:bg-slate-50"
            } ${isCollapsed ? "justify-center" : ""}`}
            title={isCollapsed ? item.label : undefined}
          >
            {activeModule === item.id && (
              <motion.div
                layoutId="active-pill"
                className="absolute left-0 w-1 h-8 bg-institutional-blue rounded-r-full"
              />
            )}
            <item.icon size={20} className="shrink-0" />

            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="font-medium text-sm whitespace-nowrap overflow-hidden"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>

            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                {item.label}
              </div>
            )}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-100 flex flex-col gap-1">
        <button
          onClick={() => setActiveModule('configuracion')}
          className={`w-full flex items-center gap-3 p-3 transition-colors rounded-xl relative ${
            activeModule === 'configuracion'
              ? "text-institutional-blue bg-institutional-blue/5"
              : "text-slate-500 hover:bg-slate-50"
          } ${isCollapsed ? "justify-center" : ""}`}
          title={isCollapsed ? "Configuración" : undefined}
        >
          {activeModule === 'configuracion' && (
            <motion.div
              layoutId="active-pill"
              className="absolute left-0 w-1 h-8 bg-institutional-blue rounded-r-full"
            />
          )}
          <Settings size={20} className="shrink-0" />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="font-medium text-sm whitespace-nowrap overflow-hidden"
              >
                Configuración
              </motion.span>
            )}
          </AnimatePresence>
        </button>
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 transition-colors rounded-xl ${isCollapsed ? "justify-center" : ""}`}
          title={isCollapsed ? "Cerrar Sesión" : undefined}
        >
          <LogOut size={20} className="shrink-0" />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="font-medium text-sm whitespace-nowrap overflow-hidden"
              >
                Cerrar Sesión
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.div>
  );
};
