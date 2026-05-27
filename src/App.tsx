import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  organismos,
  dependencias,
  procesos,
  procedimientos,
  actividades,
} from "./data/mockData";
import { Module, User } from "./domain/models/types";
import { Sidebar } from "./presentation/components/Layout/Sidebar";
import { Header } from "./presentation/components/Layout/Header";
import { ReportesModule } from "./presentation/pages/ReportesModule";
import { ModuleHeader } from "./presentation/components/Layout/ModuleHeader";
import { CapturaModule } from "./presentation/pages/CapturaModule";
import { EstructuraModule } from "./presentation/pages/EstructuraModule";
import { DashboardModule } from "./presentation/pages/DashboardModule";
import { AdminModule } from "./presentation/pages/AdminModule";
import { InicioModule } from "./presentation/pages/InicioModule";
import { ConfiguracionModule } from "./presentation/pages/ConfiguracionModule";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { ConfirmModal } from "./presentation/components/ConfirmModal";

import { Login } from "./presentation/pages/LoginModule";

export default function App() {
  const devUser: User = {
    id: "DEV1",
    nombre: "Desarrollador MOCK",
    rol: "AdminFuncional",
    email: "dev@test.com",
    dependenciaId: "D1",
  };
  const [currentUser, setCurrentUser] = useState<User | null>(null); // Enable login mode
  const [activeModule, setActiveModule] = useState<Module>("dashboard");
  const [focusElement, setFocusElement] = useState<
    | { id: string; parentId?: string; action?: string; multipleIds?: string[] }
    | undefined
  >(undefined);
  const [toast, setToast] = useState<{
    show: boolean;
    message?: string;
    type: "success" | "error";
    element?: {
      id?: string;
      type: string;
      name: string;
      action: string;
      targetType?: string;
      targetName?: string;
      parentId?: string;
      multipleIds?: string[];
    };
  } | null>(null);
  const [notifications, setNotifications] = useState<
    {
      id: string;
      message?: string;
      date: string;
      type: "success" | "error";
      element?: {
        id?: string;
        type: string;
        name: string;
        action: string;
        targetType?: string;
        targetName?: string;
        parentId?: string;
        multipleIds?: string[];
      };
    }[]
  >([]);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: "danger" | "warning" | "info" | "success";
    onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
    element?: {
      id?: string;
      type: string;
      name: string;
      action: string;
      targetType?: string;
      targetName?: string;
      parentId?: string;
      multipleIds?: string[];
    },
  ) => {
    setToast({ show: true, message, type });

    // Add to notifications history only if it's not an error
    if (type !== "error") {
      const newNotification = {
        id: Math.random().toString(36).substr(2, 9),
        message,
        date: new Date().toISOString(),
        type,
        element,
      };
      setNotifications((prev) => [newNotification, ...prev]);
    }

    setTimeout(() => setToast(null), 5000);
  };

  const handleViewElement = (
    elementId: string,
    parentId?: string,
    action?: string,
    multipleIds?: string[],
  ) => {
    setActiveModule("estructura");
    setFocusElement({ id: elementId, parentId, action, multipleIds });
  };

  // Lifted state for the structure to make it "functional"
  const [orgData, setOrgData] = useState<any[]>([]);
  const [depData, setDepData] = useState<any[]>([]);
  const [procData, setProcData] = useState<any[]>([]);
  const [pcdData, setPcdData] = useState<any[]>([]);
  const [actData, setActData] = useState<any[]>([]);
  const [cargasTrabajo, setCargasTrabajo] = useState<any[]>([]);
  const [vigencias, setVigencias] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [vigenciasUsuarios, setVigenciasUsuarios] = useState<any[]>([]);
  const [relaciones, setRelaciones] = useState<
    {
      type: string;
      childId: string;
      parentId: string;
      vigenciaId?: string;
      includedChildren?: string[];
    }[]
  >([]);
  const [hiddenPaths, setHiddenPaths] = useState<string[]>([]);
  const [recentlyModifiedIds, setRecentlyModifiedIds] = useState<string[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [selectedVigenciaId, setSelectedVigenciaId] = useState<string | null>(null);

  React.useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoadingData(true);
        // Load default structure
        const useRealDatabase = !!import.meta.env.VITE_SUPABASE_URL;
        
        if (useRealDatabase) {
          try {
            const { supabase } = await import('./lib/supabaseClient');
            if (supabase) {
              const { data: { session } } = await supabase.auth.getSession();
              if (session && session.user) {
                setCurrentUser({
                   id: session.user.id,
                   nombre: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "Usuario",
                   email: session.user.email!,
                   rol: session.user.user_metadata?.rol || 'Funcionario'
                });
              }
            } else {
              const localSessionString = localStorage.getItem('mockSession');
              if (localSessionString) {
                try {
                   setCurrentUser(JSON.parse(localSessionString));
                } catch(e) {}
              }
            }

            const { DatabaseService } = await import("./application/services/DatabaseService");
            const vDb = await DatabaseService.getVigencias();
            setVigencias(vDb || []);

            const orgDb = await DatabaseService.getEstructuraOrg();
            // Nivel 1 = Organismo, Nivel >= 2 = Dependencia
            const fetchedOrgs = orgDb.filter(x => x.Nivel === 1).map(x => ({
              id: x.IdNodoOrg,
              vigenciaId: x.IdVigencia,
              codigo: x.CodigoInterno,
              nombre: x.Nombre,
              level: 1,
              activo: x.Activo
            }));
            const fetchedDeps = orgDb.filter(x => x.Nivel > 1).map(x => ({
              id: x.IdNodoOrg,
              vigenciaId: x.IdVigencia,
              codigo: x.CodigoInterno,
              nombre: x.Nombre,
              padreId: x.IdPadre,
              level: x.Nivel,
              activo: x.Activo
            }));
            setOrgData(fetchedOrgs);
            setDepData(fetchedDeps);

            const procDb = await DatabaseService.getEstructuraProc();
            const fetchedMacros = procDb.filter(x => x.Nivel === 1).map(x => ({
               id: x.IdNodoProceso,
               vigenciaId: x.IdVigencia,
               codigo: x.CodigoInterno,
               nombre: x.Nombre,
               level: 1
            }));
            const fetchedProcs = procDb.filter(x => x.Nivel === 2).map(x => ({
               id: x.IdNodoProceso,
               vigenciaId: x.IdVigencia,
               codigo: x.CodigoInterno,
               nombre: x.Nombre,
               procesoId: x.IdPadre, // Mapping IdPadre as procesoId for level 2
               producto: x.Producto,
               level: 2
            }));
            const fetchedActs = procDb.filter(x => x.Nivel === 3).map(x => ({
               id: x.IdNodoProceso,
               vigenciaId: x.IdVigencia,
               codigo: x.CodigoInterno,
               nombre: x.Nombre,
               procedimientoId: x.IdPadre,
               level: 3
            }));
            setProcData(fetchedMacros);
            setPcdData(fetchedProcs);
            setActData(fetchedActs);

            const fetchedUsuariosDep = await DatabaseService.getUsuariosDependencia();
            setVigenciasUsuarios(fetchedUsuariosDep.map(x => ({
               idVigenciaUsuario: x.IdUsuarioDep,
               idVigencia: x.IdVigencia,
               idUsuario: x.EntraIdObjectId,
               idDependencia: x.IdNodoOrg,
               rol: x.RolFuncional
            })));
            
            // Build simple user stubs based on Sec.UsuariosDependencia because auth.users is inaccessible
            const uniqueUsers = Array.from(new Set(fetchedUsuariosDep.map(x => x.EntraIdObjectId))).map(id => {
               const uRef = fetchedUsuariosDep.find(x => x.EntraIdObjectId === id);
               return {
                  id: id,
                  email: uRef?.UPN || `${id}@sisdecat.gov.co`,
                  nombre: uRef?.UPN ? uRef.UPN.split('@')[0] : `Usuario ${id.substring(0, 5)}`,
                  rol: uRef?.RolFuncional || 'Funcionario'
               } as User;
            });
            setUsuarios(uniqueUsers);

            const mapaDb = await DatabaseService.getMapaRelaciones();
            const mappedRels = mapaDb.map(m => ({
               vigenciaId: m.IdVigencia,
               parentId: m.IdNodoOrg,
               childId: m.IdNodoProceso,
               type: m.ObservacionRelacion || "Proceso"
            }));
            setRelaciones(mappedRels);

            const { captureService } = await import("./application/services/captureService");
            const existingCargas = await captureService.getCargas();
            setCargasTrabajo(existingCargas || []);
          } catch (e: any) {
            console.error("Error loading prod data from supabase:", e);
            showToast(`Error al cargar datos desde Supabase: ${e.message}`, "error");
            setOrgData([]); setDepData([]); setProcData([]); setPcdData([]); setActData([]);
            setVigencias([]); setRelaciones([]); setCargasTrabajo([]);
          }
        } else {
          const { vigenciasMock, mapaRelacionesMock, usuariosMock, vigenciasUsuariosMock } = await import('./data/mockData');
          
          const defaultVigenciaId = vigenciasMock[0]?.IdVigencia;
          setOrgData(organismos.map(o => ({ ...o, vigenciaId: defaultVigenciaId })));
          setDepData(dependencias.map(d => ({ ...d, vigenciaId: defaultVigenciaId })));
          setProcData(procesos.map(p => ({ ...p, vigenciaId: defaultVigenciaId })));
          setPcdData(procedimientos.map(p => ({ ...p, vigenciaId: defaultVigenciaId })));
          setActData(actividades.map(a => ({ ...a, vigenciaId: defaultVigenciaId })));
          setVigencias(vigenciasMock);
          setUsuarios(usuariosMock as User[]);
          if(vigenciasUsuariosMock) {
            setVigenciasUsuarios(vigenciasUsuariosMock);
          }

          // Populate whitelist relationships from mapa (only exact explicit mappings)
          const mappedRels: any[] = [];
          mapaRelacionesMock.forEach(m => {
            let type = "Proceso";
            if(m.IdNodoProceso.startsWith('proc')) type = "Proceso";
            if(m.IdNodoProceso.startsWith('pcd')) type = "Procedimiento";
            if(m.IdNodoProceso.startsWith('act')) type = "Actividad";
            
            if (type === "Procedimiento") {
                const procedimiento = procedimientos.find(p => p.id === m.IdNodoProceso);
                if (procedimiento && procedimiento.procesoId) {
                   const procesoId = procedimiento.procesoId;
                   
                   const existingRel = mappedRels.find(r => r.parentId === m.IdNodoOrg && r.childId === procesoId);
                   if (existingRel) {
                       if (!existingRel.includedChildren) existingRel.includedChildren = [];
                       if (!existingRel.includedChildren.includes(m.IdNodoProceso)) {
                           existingRel.includedChildren.push(m.IdNodoProceso);
                       }
                   } else {
                       mappedRels.push({
                           type: "Proceso",
                           childId: procesoId,
                           parentId: m.IdNodoOrg,
                           includedChildren: [m.IdNodoProceso]
                       });
                   }
                   return;
                }
            }
            
            // Add default explicit relationship for UI display/logic independently of group wrapper
            mappedRels.push({
               type,
               childId: m.IdNodoProceso,
               parentId: m.IdNodoOrg,
            });
          });
          
          // Remove duplicates if any
          const validRels: any[] = [];
          mappedRels.forEach(newRel => {
             newRel.vigenciaId = defaultVigenciaId;
             const existing = validRels.find(r => r.childId === newRel.childId && r.parentId === newRel.parentId && r.vigenciaId === newRel.vigenciaId);
             if (!existing) {
                 validRels.push(newRel);
             } else if (newRel.includedChildren) {
                 if (!existing.includedChildren) existing.includedChildren = [];
                 newRel.includedChildren.forEach((ic: string) => {
                     if (!existing.includedChildren.includes(ic)) {
                         existing.includedChildren.push(ic);
                     }
                 });
             }
          });

          setRelaciones(validRels);

          // Fetch local persitence loads
          const { captureService } = await import("./application/services/captureService");
          
          let existingCargas = await captureService.getCargas();
          // Cargar datos de prueba únicamente si no hay registros
          if (existingCargas.length === 0) {
            const { cargasTrabajoMock } = await import('./data/mockData');
            await captureService.initialize(cargasTrabajoMock);
            existingCargas = cargasTrabajoMock;
          }
          setCargasTrabajo(existingCargas);
        }
        
      } catch (error) {
        console.error("Error loading mock data", error);
        showToast("Error de conexión con el servidor", "error");
      } finally {
        setIsLoadingData(false);
      }
    };
    initializeData();
  }, []);

  const _activeVigencia = vigencias.find((v) => v.Estado === "Activo" && v.Activo !== false);
  
  let currentVigenciaView = vigencias.find(v => v.IdVigencia === (selectedVigenciaId || _activeVigencia?.IdVigencia) && v.Activo !== false);
  if (currentUser?.rol === 'Funcionario') {
    currentVigenciaView = _activeVigencia;
  }
  
  const currentVigenciaId = currentVigenciaView?.IdVigencia;

  // Filter lists based on the currently viewed Vigencia
  const currentOrgData = orgData.filter(x => x.vigenciaId === currentVigenciaId);
  const currentDepData = depData.filter(x => x.vigenciaId === currentVigenciaId);
  const currentProcData = procData.filter(x => x.vigenciaId === currentVigenciaId);
  const currentPcdData = pcdData.filter(x => x.vigenciaId === currentVigenciaId);
  const currentActData = actData.filter(x => x.vigenciaId === currentVigenciaId);
  // Default legacy mock cargas to the current vigencia if they don't have one
  const currentCargas = cargasTrabajo.map(c => !c.vigenciaId ? {...c, vigenciaId: currentVigenciaId} : c).filter(c => c.vigenciaId === currentVigenciaId);
  const currentRelaciones = relaciones.filter(r => r.vigenciaId === currentVigenciaId);
  
  // Calculate specific user role for current vigencia
  const currentUserVigenciaContext = vigenciasUsuarios.find(vu => vu.idUsuario === currentUser?.id && vu.idVigencia === currentVigenciaId);
  const effectiveUser = currentUser ? { ...currentUser, rol: currentUserVigenciaContext?.rol || currentUser.rol, dependenciaId: currentUserVigenciaContext?.idDependencia || currentUser.dependenciaId } : null;

  const availableVigencias = (currentUser?.rol === 'Funcionario' 
    ? vigencias.filter(v => v.Estado === 'Activo' || v.Estado === 'Historico')
    : vigencias).filter(v => v.Activo !== false);

  const handleCreateVigencia = async (v: any, sourceVigenciaId?: string | null) => {
    let finalVigencias = [...vigencias];
    finalVigencias.push(v);
    setVigencias(finalVigencias);

    try {
      const { DatabaseService } = await import("./application/services/DatabaseService");
      await DatabaseService.saveVigencia(v);
      showToast("Vigencia guardada exitosamente en la base de datos.", "success");
    } catch(e: any) {
      console.error("Could not push vigencia to API", e);
      showToast(`Error de conexión al servidor: ${e.message}`, "error");
    }

    if (sourceVigenciaId) {
       // Check if there are structures in that source to clone
       const sourceOrgData = orgData.filter(x => x.vigenciaId === sourceVigenciaId);
       const sourceDepData = depData.filter(x => x.vigenciaId === sourceVigenciaId);
       const sourceProcData = procData.filter(x => x.vigenciaId === sourceVigenciaId);
       const sourcePcdData = pcdData.filter(x => x.vigenciaId === sourceVigenciaId);
       const sourceActData = actData.filter(x => x.vigenciaId === sourceVigenciaId);

       // Create an ID map to preserve relationships
       const idMap = new Map<string, string>();
       const getNewId = (oldId: string, prefix: string) => {
         if (!oldId) return undefined;
         if (!idMap.has(oldId)) {
           idMap.set(oldId, crypto.randomUUID());
         }
         return idMap.get(oldId);
       };

       const newOrgData = sourceOrgData.map(x => ({...x, vigenciaId: v.IdVigencia, id: getNewId(x.id, 'org')!, parentId: getNewId(x.parentId!, 'org')}));
       const newDepData = sourceDepData.map(x => ({...x, vigenciaId: v.IdVigencia, id: getNewId(x.id, 'dep')!, parentId: getNewId(x.parentId!, 'dep') || getNewId(x.parentId!, 'org')}));
       const newProcData = sourceProcData.map(x => ({...x, vigenciaId: v.IdVigencia, id: getNewId(x.id, 'proc')!, dependenciaId: getNewId(x.dependenciaId, 'dep')!}));
       const newPcdData = sourcePcdData.map(x => ({...x, vigenciaId: v.IdVigencia, id: getNewId(x.id, 'pcd')!, procesoId: getNewId(x.procesoId, 'proc')!}));
       const newActData = sourceActData.map(x => ({...x, vigenciaId: v.IdVigencia, id: getNewId(x.id, 'act')!, procedimientoId: getNewId(x.procedimientoId, 'pcd')!}));
       
       setOrgData([...orgData, ...newOrgData]);
       setDepData([...depData, ...newDepData]);
       setProcData([...procData, ...newProcData]);
       setPcdData([...pcdData, ...newPcdData]);
       setActData([...actData, ...newActData]);
       
       // Clone relaciones too
       const newRelaciones = relaciones.filter(r => r.vigenciaId === sourceVigenciaId && (sourceProcData.some(p => p.id === r.childId) || sourcePcdData.some(p => p.id === r.childId) || sourceActData.some(p => p.id === r.childId)))
       .map(r => ({
           ...r,
           id: crypto.randomUUID(),
           childId: idMap.get(r.childId) || r.childId,
           parentId: idMap.get(r.parentId) || r.parentId,
           vigenciaId: v.IdVigencia,
           includedChildren: r.includedChildren ? r.includedChildren.map((cId: string) => idMap.get(cId) || cId) : undefined
       }));
       setRelaciones([...relaciones, ...newRelaciones]);

       try {
           const { DatabaseService } = await import("./application/services/DatabaseService");
           await DatabaseService.saveEstructuraOrg([...newOrgData, ...newDepData]);
           await DatabaseService.saveEstructuraProc([...newProcData, ...newPcdData, ...newActData]);
           await DatabaseService.saveMapaRelaciones(newRelaciones);
       } catch (e: any) {
           console.error("Could not save cloned structures to DB", e);
           showToast(`Error al clonar estructura en la base de datos: ${e.message}`, "error");
       }
    }
    showToast('Nueva Vigencia Registrada', 'success');
  };
  const handleSaveCarga = async (nuevaCarga: any) => {
    if (!effectiveUser || !currentVigenciaView) return;
    const cargaConMeta = {
      ...nuevaCarga,
      userId: effectiveUser.id,
      autor: effectiveUser.nombre,
      userRole: effectiveUser.rol,
      vigenciaId: currentVigenciaView.IdVigencia,
    };
    
    try {
      const { captureService } = await import("./application/services/captureService");
      const saved = await captureService.createCarga(cargaConMeta);
      setCargasTrabajo([...cargasTrabajo, saved]);
      console.log("Carga guardada en backend simulado:", saved);
    } catch (error) {
      showToast("Error al guardar registro", "error");
    }
  };

  const handleUpdateCarga = async (updatedCarga: any) => {
    try {
      const { captureService } = await import("./application/services/captureService");
      
      const originalCarga = currentCargas.find(c => c.id === updatedCarga.id);
      if (!originalCarga) return;

      // Track changes
      const changes = [];
      const fieldsToCheck = ['volumenQ', 'frecuencia', 'unidadTiempo', 'tiempoMin', 'tiempoNormal', 'tiempoMax'];
      fieldsToCheck.forEach(field => {
        if (originalCarga[field] !== updatedCarga[field]) {
          changes.push({
            field,
            old: originalCarga[field],
            new: updatedCarga[field]
          });
        }
      });

      if (changes.length > 0) {
        const auditEntry = {
          timestamp: new Date().toISOString(),
          editor: currentUser?.nombre || "Administrador",
          rol: currentUser?.rol || "Súper-Administrador",
          changes,
          comentario: updatedCarga._comentario || "Sin comentarios adicionales"
        };
        updatedCarga.auditLog = [...(originalCarga.auditLog || []), auditEntry];
        delete updatedCarga._comentario;
      }

      const updated = await captureService.updateCarga(updatedCarga.id, updatedCarga);
      
      setCargasTrabajo((prevCargas) =>
        prevCargas.map((c) => (c.id === updated.id ? updated : c)),
      );
      showToast("Registro actualizado correctamente.", "success");
    } catch (error) {
      showToast("Error al actualizar el registro", "error");
    }
  };

  const executeDeleteCarga = async (id: string) => {
    try {
       const { captureService } = await import("./application/services/captureService");
       // Fake logical delete via update 
       await captureService.updateCarga(id, { estado: "Inactivo" });
       
       setCargasTrabajo((prevCargas) =>
         prevCargas.map((c) => (c.id === id ? { ...c, estado: "Inactivo" } : c)),
       );
       showToast("Registro desactivado exitosamente (borrado lógico).");
    } catch (error) {
       showToast("Error al desactivar el registro", "error");
    }
  };

  const handleDeleteCarga = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Desactivar Registro",
      message:
        "¿Está seguro de que desea desactivar este registro? El elemento no se eliminará permanentemente, sino que pasará a estado inactivo para mantener el historial de auditoría.",
      confirmText: "Desactivar",
      cancelText: "Cancelar",
      type: "warning",
      onConfirm: () => executeDeleteCarga(id),
    });
  };

  const executeSaveStructure = async (
    type: string,
    data: any,
    mode: "create" | "edit",
    id?: string,
  ) => {
    let modifiedId = id;
    let newOrgs = [...orgData];
    let newDeps = [...depData];
    let newProcs = [...procData];
    let newPcds = [...pcdData];
    let newActs = [...actData];

    if (mode === "edit" && id) {
      if (type === "Organismo") newOrgs = orgData.map((o) => (o.id === id ? { ...o, ...data } : o));
      if (type === "Dependencia") newDeps = depData.map((d) => (d.id === id ? { ...d, ...data } : d));
      if (type === "Proceso") newProcs = procData.map((p) => (p.id === id ? { ...p, ...data } : p));
      if (type === "Procedimiento") newPcds = pcdData.map((pc) => (pc.id === id ? { ...pc, ...data } : pc));
      if (type === "Actividad") newActs = actData.map((a) => (a.id === id ? { ...a, ...data } : a));
    } else {
      const newId = crypto.randomUUID();
      modifiedId = newId;
      const newItem = { id: newId, ...data, estado: "Activo", vigenciaId: currentVigenciaView?.IdVigencia };

      if (type === "Organismo") {
        if (!data.parentId) {
          const rootOrg = orgData.find((o) => !o.parentId);
          if (rootOrg) newItem.parentId = rootOrg.id;
        }
        newOrgs = [...orgData, newItem];
      } else if (type === "Dependencia") {
        newDeps = [...depData, newItem];
      } else if (type === "Proceso") {
        newProcs = [...procData, { ...newItem, dependenciaId: data.parentId }];
      } else if (type === "Procedimiento") {
        newPcds = [...pcdData, { ...newItem, procesoId: data.parentId }];
      } else if (type === "Actividad") {
        newActs = [...actData, { ...newItem, procedimientoId: data.parentId }];
      }
    }

    setOrgData(newOrgs);
    setDepData(newDeps);
    setProcData(newProcs);
    setPcdData(newPcds);
    setActData(newActs);

    try {
      const { DatabaseService } = await import("./application/services/DatabaseService");
      if (type === "Organismo" || type === "Dependencia") {
         await DatabaseService.saveEstructuraOrg([...newOrgs, ...newDeps]);
      } else {
         await DatabaseService.saveEstructuraProc([...newProcs, ...newPcds, ...newActs]);
      }
    } catch(e: any) {
      console.error("Could not push structure update to API", e);
      showToast(`Error local, asegúrese de tener conexión: ${e.message}`, "error");
    }

    const actionText = mode === "edit" ? "actualizado" : "creado";
    showToast(`${type} ${actionText} exitosamente.`, "success");

    if (modifiedId) {
      setRecentlyModifiedIds((prev) => [...prev, modifiedId!]);
    }
  };

  const handleSaveStructure = (
    type: string,
    data: any,
    mode: "create" | "edit",
    id?: string,
  ) => {
    setConfirmConfig({
      isOpen: true,
      title: mode === "create" ? `Crear ${type}` : `Guardar Cambios en ${type}`,
      message:
        mode === "create"
          ? `¿Está seguro de que desea registrar este nuevo ${type} en el sistema?`
          : `¿Está seguro de que desea guardar las modificaciones realizadas en este ${type}?`,
      confirmText: mode === "create" ? "Crear Elemento" : "Guardar Cambios",
      cancelText: "Cancelar",
      type: "info",
      onConfirm: () => executeSaveStructure(type, data, mode, id),
    });
  };

  const handleImportOrganizacion = async (datos: any[]) => {
    setIsLoadingData(true);
    try {
      let firstValidRow = {};
      for (const row of datos) {
        if (Object.keys(row).length > 0) {
          firstValidRow = row;
          break;
        }
      }
      const allHeaders = datos.length > 0 ? Object.keys(firstValidRow) : [];
      const codeKey = allHeaders.find(k => k.toLowerCase().includes('código') || k.toLowerCase().includes('codigo') || k.toLowerCase().includes('cÃ³digo')) || allHeaders[0];
      const nameKey = allHeaders.find(k => k.toLowerCase().includes('dependencia') || k.toLowerCase().includes('organismo') || k.toLowerCase().includes('nombre') || k.toLowerCase().includes('descrip')) || allHeaders[1];
      const padreKey = allHeaders.find(k => k.toLowerCase().includes('padre')) || allHeaders[2];
      const nivelKey = allHeaders.find(k => k.toLowerCase().includes('nivel')) || allHeaders[3];

      const newOrgs: any[] = [];
      const newDeps: any[] = [];

      datos.forEach(row => {
        const codigo = String(row[codeKey as string] ?? '').trim();
        const nombre = String(row[nameKey as string] ?? '').trim();
        const padreRaw = row[padreKey as string];
        const padre = padreRaw ? String(padreRaw).trim() : '';
        const nivel = String(row[nivelKey as string] ?? '').trim();

        if (!codigo || !nombre) return;
        
        if (nivel === '0' || nivel === '1' || !padre || padre === codigo) {
          // Organismo usually root
          newOrgs.push({
             id: codigo,
             nombre,
             estado: "Activo",
             vigenciaId: currentVigenciaView?.IdVigencia,
             fechaCreacion: new Date().toISOString()
          });
        } else {
          // Dependencia
          // Trying to guess if parent is another Org or Dep based on code
          let parsedParentId = padre;
          if (padre !== '10000' && !newOrgs.some(o => o.id === padre)) {
             parsedParentId = "dep_" + padre;
          }
          
          newDeps.push({
             id: "dep_" + codigo,
             nombre,
             estado: "Activo",
             parentId: parsedParentId,
             vigenciaId: currentVigenciaView?.IdVigencia,
             fechaCreacion: new Date().toISOString()
          });
        }
      });

      if (newOrgs.length > 0) setOrgData(prev => [...prev, ...newOrgs]);
      if (newDeps.length > 0) setDepData(prev => [...prev, ...newDeps]);
      showToast(`Se importaron ${newOrgs.length} organismos y ${newDeps.length} dependencias.`, "success");
    } catch (e) {
      showToast("Error importando organización.", "error");
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleImportProcesos = async (datos: any[]) => {
    setIsLoadingData(true);
    try {
      let firstValidRow = {};
      for (const row of datos) {
        if (Object.keys(row).length > 0) {
          firstValidRow = row;
          break;
        }
      }
      const allHeaders = datos.length > 0 ? Object.keys(firstValidRow) : [];
      const codeKey = allHeaders.find(k => k.toLowerCase().includes('código') || k.toLowerCase().includes('codigo') || k.toLowerCase().includes('cÃ³digo')) || allHeaders[0];
      const nameKey = allHeaders.find(k => k.toLowerCase().includes('proceso') || k.toLowerCase().includes('procedimiento') || k.toLowerCase().includes('actividad') || k.toLowerCase().includes('nombre') || k.toLowerCase().includes('dependencia')) || allHeaders[1];
      const padreKey = allHeaders.find(k => k.toLowerCase().includes('padre')) || allHeaders[2];
      const nivelKey = allHeaders.find(k => k.toLowerCase().includes('nivel')) || allHeaders[3];

      const newProcs: any[] = [];
      const newPcds: any[] = [];
      const newActs: any[] = [];
      
      const tiposProceso: Record<string, string> = {};

      // Primera pasada: identificar Tipos de Proceso (Nivel 1)
      datos.forEach(row => {
        const codigo = String(row[codeKey as string] ?? '').trim();
        const nombre = String(row[nameKey as string] ?? '').trim();
        const nivel = String(row[nivelKey as string] ?? '').trim();
        
        if (codigo && nombre && (nivel === '1' || nivel === '0')) {
          tiposProceso[codigo] = nombre;
        }
      });
      
      datos.forEach(row => {
        const codigo = String(row[codeKey as string] ?? '').trim();
        const nombre = String(row[nameKey as string] ?? '').trim();
        const padreRaw = row[padreKey as string];
        const padre = padreRaw ? String(padreRaw).trim() : '';
        const nivel = String(row[nivelKey as string] ?? '').trim();

        if (!codigo || !nombre || nivel === '1' || nivel === '0') return;

        if (nivel === '2') {
          const tipo = tiposProceso[padre] || "Misional";
          newProcs.push({
             id: "proc_" + codigo,
             nombre,
             descripcion: `Tipo de proceso: ${tipo}`,
             estado: "Activo",
             tipo: tipo, // Custom field just in case
             vigenciaId: currentVigenciaView?.IdVigencia,
          });
        } else if (nivel === '3') {
          newPcds.push({
             id: "pcd_" + codigo,
             nombre,
             procesoId: padre ? "proc_" + padre : undefined,
             estado: "Activo",
             vigenciaId: currentVigenciaView?.IdVigencia,
          });
        } else if (nivel === '4' || parseInt(nivel) > 4) {
          newActs.push({
             id: "act_" + codigo,
             nombre,
             procedimientoId: padre ? "pcd_" + padre : undefined,
             estado: "Activo",
             vigenciaId: currentVigenciaView?.IdVigencia,
          });
        }
      });

      // Fallback si por alguna razón vienen mal los niveles y no mapeó ninguno, usamos la lógica clásica
      if (newProcs.length === 0 && newPcds.length === 0) {
        datos.forEach(row => {
          const codigo = String(row[codeKey as string] ?? '').trim();
          const nombre = String(row[nameKey as string] ?? '').trim();
          const padreRaw = row[padreKey as string];
          const padre = padreRaw ? String(padreRaw).trim() : '';
          const nivel = String(row[nivelKey as string] ?? '').trim();
  
          if (!codigo || !nombre) return;
  
          if (!padre || codigo === padre || nivel === '1' || String(nivel).toLowerCase().includes('proceso')) {
            newProcs.push({
               id: "proc_" + codigo,
               nombre,
               descripcion: "Importado masivamente",
               estado: "Activo",
               vigenciaId: currentVigenciaView?.IdVigencia,
            });
          } else if (nivel === '2' || nivel === '3' || String(nivel).toLowerCase().includes('procedimiento')) {
            newPcds.push({
               id: "pcd_" + codigo,
               nombre,
               procesoId: padre ? "proc_" + padre : undefined,
               estado: "Activo",
               vigenciaId: currentVigenciaView?.IdVigencia,
            });
          } else {
            newActs.push({
               id: "act_" + codigo,
               nombre,
               procedimientoId: padre ? "pcd_" + padre : undefined,
               estado: "Activo",
               vigenciaId: currentVigenciaView?.IdVigencia,
            });
          }
        });
      }

      if (newProcs.length > 0) setProcData(prev => [...prev, ...newProcs]);
      if (newPcds.length > 0) setPcdData(prev => [...prev, ...newPcds]);
      if (newActs.length > 0) setActData(prev => [...prev, ...newActs]);
      showToast(`Se importaron ${newProcs.length} procesos, ${newPcds.length} proc., y ${newActs.length} actv.`, "success");
    } catch {
      showToast("Error importando mapa de procesos.", "error");
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleImportRelaciones = async (nuevasRelaciones: any[]) => {
    try {
      setIsLoadingData(true);
      
      let firstValidRow = {};
      for (const row of nuevasRelaciones) {
        if (Object.keys(row).length > 0) {
          firstValidRow = row;
          break;
        }
      }
      
      const allHeaders = nuevasRelaciones.length > 0 ? Object.keys(firstValidRow) : [];
      const orgKey = allHeaders.find(k => k.toLowerCase().includes('org_dep') || k.toLowerCase().includes('org') || k.toLowerCase().includes('dependencia')) || allHeaders[0];
      const proKey = allHeaders.find(k => k.toLowerCase().includes('pro_proc') || k.toLowerCase().includes('proceso') || k.toLowerCase().includes('procedimiento')) || allHeaders[1];

      const mappedRels: any[] = [];

      nuevasRelaciones.forEach(row => {
          let parentIdRaw = String(row[orgKey] ?? row.IdNodoOrg ?? row.parentId ?? '').trim();
          let childIdRaw = String(row[proKey] ?? row.IdNodoProceso ?? row.childId ?? '').trim();

          if (!parentIdRaw || !childIdRaw) return;

          let trueParentId = parentIdRaw;
          if (depData.some(d => d.id === `dep_${parentIdRaw}`)) trueParentId = `dep_${parentIdRaw}`;
          else if (!orgData.some(o => o.id === parentIdRaw)) {
              if (depData.some(d => d.id === parentIdRaw)) trueParentId = parentIdRaw;
          }
          
          let trueChildId = childIdRaw;
          let childType = "Proceso";
          
          if (procData.some(p => p.id === `proc_${childIdRaw}`)) {
              trueChildId = `proc_${childIdRaw}`;
              childType = "Proceso";
          } else if (pcdData.some(p => p.id === `pcd_${childIdRaw}`)) {
              trueChildId = `pcd_${childIdRaw}`;
              childType = "Procedimiento";
          } else if (actData.some(a => a.id === `act_${childIdRaw}`)) {
              trueChildId = `act_${childIdRaw}`;
              childType = "Actividad";
          } else {
             if (childIdRaw.startsWith('proc_')) childType = "Proceso";
             else if (childIdRaw.startsWith('pcd_')) childType = "Procedimiento";
             else if (childIdRaw.startsWith('act_')) childType = "Actividad";
          }

          if (childType === "Procedimiento") {
              const procedimiento = pcdData.find(p => p.id === trueChildId);
              if (procedimiento && procedimiento.procesoId) {
                 const procesoId = procedimiento.procesoId;
                 
                 const existingRel = mappedRels.find(r => r.parentId === trueParentId && r.childId === procesoId);
                 if (existingRel) {
                     if (!existingRel.includedChildren) existingRel.includedChildren = [];
                     if (!existingRel.includedChildren.includes(trueChildId)) {
                         existingRel.includedChildren.push(trueChildId);
                     }
                 } else {
                     mappedRels.push({
                         type: "Proceso",
                         childId: procesoId,
                         parentId: trueParentId,
                         includedChildren: [trueChildId]
                     });
                 }
                 // IMPORTANT: skip adding explicit Procedimiento wrapper
                 return;
              }
          }

          mappedRels.push({
             type: childType,
             childId: trueChildId,
             parentId: trueParentId
          });
      });

      const validRels = mappedRels.filter(r => r.childId && r.parentId);

      setRelaciones(prev => {
        const combined = [...prev];
        validRels.forEach(newRel => {
           newRel.vigenciaId = currentVigenciaView?.IdVigencia;
           const existing = combined.find(r => r.childId === newRel.childId && r.parentId === newRel.parentId && r.vigenciaId === newRel.vigenciaId);
           if (!existing) {
               combined.push(newRel);
           } else if (newRel.includedChildren) {
               if (!existing.includedChildren) existing.includedChildren = [];
               newRel.includedChildren.forEach((ic: string) => {
                   if (!existing.includedChildren.includes(ic)) {
                       existing.includedChildren.push(ic);
                   }
               });
           }
        });
        return combined;
      });

      showToast(`Se procesaron relaciones correctamente.`, "success");
    } catch (error) {
      showToast("Error al importar la matriz de relaciones.", "error");
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLinkElement = (
    childType: string,
    childIds: string[],
    parentId: string,
  ) => {
    let newRelations: any[] = [];
    const modifiedRelations = [...relaciones];
    const vigenciaId = currentVigenciaView?.IdVigencia;

    childIds.forEach((childId) => {
      // Si estamos vinculando un Procedimiento a una Dependencia/Organismo (algo diferente a un Proceso)
      if (childType === "Procedimiento" && (parentId.startsWith("dep_") || parentId.startsWith("org_") || depData.some(d => d.id === parentId) || orgData.some(o => o.id === parentId))) {
        const procedimiento = pcdData.find(p => p.id === childId);
        if (procedimiento && procedimiento.procesoId) {
          const procesoId = procedimiento.procesoId;
          const existingRelIdx = modifiedRelations.findIndex(r => r.parentId === parentId && r.childId === procesoId && r.vigenciaId === vigenciaId);
          
          if (existingRelIdx >= 0) {
            const existingRel = modifiedRelations[existingRelIdx];
            if (!existingRel.includedChildren) {
              modifiedRelations[existingRelIdx] = { ...existingRel, includedChildren: [childId] };
              newRelations.push({ type: "Proceso", childId: procesoId, parentId, implicitUpdate: true, vigenciaId });
            } else if (!existingRel.includedChildren.includes(childId)) {
              modifiedRelations[existingRelIdx] = {
                ...existingRel,
                includedChildren: [...existingRel.includedChildren, childId]
              };
              newRelations.push({ type: "Proceso", childId: procesoId, parentId, implicitUpdate: true, vigenciaId });
            }
          } else {
            // Creamos la relación Proceso y añadimos el procedimiento al includedChildren
            const newProcesoRel = {
              type: "Proceso",
              childId: procesoId,
              parentId: parentId,
              includedChildren: [childId],
              vigenciaId
            };
            modifiedRelations.push(newProcesoRel);
            newRelations.push(newProcesoRel);
          }
        }
      } else {
        // Logica estandar para todo lo demas (ej: Proceso -> Dependencia)
        if (!modifiedRelations.some(r => r.type === childType && r.childId === childId && r.parentId === parentId && r.vigenciaId === vigenciaId)) {
          const newRel = { type: childType, childId, parentId, vigenciaId };
          modifiedRelations.push(newRel);
          newRelations.push(newRel);
        }
      }
    });

    if (newRelations.length === 0) {
      showToast(
        "Los elementos seleccionados ya están vinculados a este padre.",
        "error",
      );
      return;
    }

    setRelaciones(modifiedRelations);
    
    // Save to DatabaseService
    import("./application/services/DatabaseService").then(({ DatabaseService }) => {
       DatabaseService.saveMapaRelaciones(modifiedRelations).catch(e => {
          console.error("Could not save mapped relations remotely", e);
          showToast(`Error guardando relaciones: ${e.message}`, "error");
       });
    });

    // Obtenemos unicamente los que no fueron updates implicitos para los mensajes y ui logs
    const explicitNewRels = newRelations.filter(r => !r.implicitUpdate);
    const linkIds = explicitNewRels.map((r) => `link:${r.parentId}:${r.childId}`);
    setRecentlyModifiedIds((prev) => [...prev, ...linkIds]);

    let parentName = "Elemento";
    let parentType = "Elemento";
    if (orgData.some((o) => o.id === parentId)) {
      parentType = "Organismo";
      parentName = orgData.find((o) => o.id === parentId)?.nombre || parentName;
    } else if (depData.some((d) => d.id === parentId)) {
      parentType = "Dependencia";
      parentName = depData.find((d) => d.id === parentId)?.nombre || parentName;
    } else if (procData.some((p) => p.id === parentId)) {
      parentType = "Proceso";
      parentName =
        procData.find((p) => p.id === parentId)?.nombre || parentName;
    } else if (pcdData.some((p) => p.id === parentId)) {
      parentType = "Procedimiento";
      parentName = pcdData.find((p) => p.id === parentId)?.nombre || parentName;
    }

    if (newRelations.length === 1) {
      const childId = newRelations[0].childId;
      let childName = "Elemento";
      if (childType === "Dependencia")
        childName = depData.find((d) => d.id === childId)?.nombre || childName;
      if (childType === "Proceso")
        childName = procData.find((p) => p.id === childId)?.nombre || childName;
      if (childType === "Procedimiento")
        childName = pcdData.find((p) => p.id === childId)?.nombre || childName;
      if (childType === "Actividad")
        childName = actData.find((a) => a.id === childId)?.nombre || childName;

      showToast(`${childType} vinculado exitosamente.`, "success", {
        id: childId,
        type: childType,
        name: childName,
        action: "vinculado",
        targetType: parentType,
        targetName: parentName,
        parentId: parentId,
      });
    } else {
      const childNames = newRelations
        .map((r) => {
          if (childType === "Dependencia")
            return depData.find((d) => d.id === r.childId)?.nombre;
          if (childType === "Proceso")
            return procData.find((p) => p.id === r.childId)?.nombre;
          if (childType === "Procedimiento")
            return pcdData.find((p) => p.id === r.childId)?.nombre;
          if (childType === "Actividad")
            return actData.find((a) => a.id === r.childId)?.nombre;
          return "Elemento";
        })
        .filter(Boolean)
        .join(", ");

      showToast(
        `Los ${childType}s ${childNames} han sido vinculados exitosamente a la ${parentType} ${parentName}.`,
        "success",
        {
          id: newRelations[0].childId,
          type: childType,
          name: childNames,
          action: "vinculados",
          targetType: parentType,
          targetName: parentName,
          parentId: parentId,
          multipleIds: newRelations.map((r) => r.childId),
        },
      );
    }
  };

  const executeUnlink = (
    childType: string,
    childId: string,
    parentId: string,
    isLinked: boolean,
    path: string,
  ) => {
    if (isLinked) {
      // Remove from relations array if it's a custom link
      const newRels = relaciones.filter(
          (r) =>
            !(
              r.type === childType &&
              r.childId === childId &&
              r.parentId === parentId &&
              r.vigenciaId === currentVigenciaView?.IdVigencia
            ),
       );
      setRelaciones(newRels);
      
      // Sync Delete in background
      import("./application/services/DatabaseService").then(({ DatabaseService }) => {
          DatabaseService.saveMapaRelaciones(newRels).catch(e => {
             console.error("Error al sincronizar borrado", e);
             showToast(`Error de conexión al eliminar: ${e.message}`, "error");
          });
      });
    } else {
      // If it's a base relationship, we just hide it from the UI for this specific contextual path
      setHiddenPaths((prev) => [...prev, path]);
    }

    // Find name for toast
    let childName = "Elemento";
    if (childType === "Dependencia")
      childName = depData.find((d) => d.id === childId)?.nombre || childName;
    if (childType === "Proceso")
      childName = procData.find((p) => p.id === childId)?.nombre || childName;
    if (childType === "Procedimiento")
      childName = pcdData.find((p) => p.id === childId)?.nombre || childName;
    if (childType === "Actividad")
      childName = actData.find((a) => a.id === childId)?.nombre || childName;

    let parentName = "Elemento";
    let parentType = "Elemento";
    if (orgData.some((o) => o.id === parentId)) {
      parentType = "Organismo";
      parentName = orgData.find((o) => o.id === parentId)?.nombre || parentName;
    } else if (depData.some((d) => d.id === parentId)) {
      parentType = "Dependencia";
      parentName = depData.find((d) => d.id === parentId)?.nombre || parentName;
    } else if (procData.some((p) => p.id === parentId)) {
      parentType = "Proceso";
      parentName =
        procData.find((p) => p.id === parentId)?.nombre || parentName;
    } else if (pcdData.some((p) => p.id === parentId)) {
      parentType = "Procedimiento";
      parentName = pcdData.find((p) => p.id === parentId)?.nombre || parentName;
    }

    showToast(`${childType} desvinculado exitosamente.`, "success", {
      id: childId,
      type: childType,
      name: childName,
      action: "desvinculado",
      targetType: parentType,
      targetName: parentName,
      parentId: parentId,
    });
  };

  const handleUnlinkElement = (
    childType: string,
    childId: string,
    parentId: string,
    isLinked: boolean,
    path: string,
  ) => {
    setConfirmConfig({
      isOpen: true,
      title: `Desvincular ${childType}`,
      message: `¿Está seguro de desvincular este ${childType} de su padre? Se eliminará la relación en esta vista.`,
      confirmText: "Desvincular",
      cancelText: "Cancelar",
      type: "warning",
      onConfirm: () =>
        executeUnlink(childType, childId, parentId, isLinked, path),
    });
  };

  const executeDeleteStructure = async (type: string, id: string) => {
    let itemName = "Elemento";
    const changeToInactive = (item: any) => item.id === id ? { ...item, Activo: false, estado: "Inactivo" } : item;

    let updatedList: any[] = [];
    if (type === "Organismo") {
      itemName = orgData.find((o) => o.id === id)?.nombre || itemName;
      updatedList = orgData.map(changeToInactive);
      setOrgData(updatedList);
    }
    if (type === "Dependencia") {
      itemName = depData.find((d) => d.id === id)?.nombre || itemName;
      updatedList = depData.map(changeToInactive);
      setDepData(updatedList);
    }
    if (type === "Proceso") {
      itemName = procData.find((p) => p.id === id)?.nombre || itemName;
      updatedList = procData.map(changeToInactive);
      setProcData(updatedList);
    }
    if (type === "Procedimiento") {
      itemName = pcdData.find((pc) => pc.id === id)?.nombre || itemName;
      updatedList = pcdData.map(changeToInactive);
      setPcdData(updatedList);
    }
    if (type === "Actividad") {
      itemName = actData.find((a) => a.id === id)?.nombre || itemName;
      updatedList = actData.map(changeToInactive);
      setActData(updatedList);
    }

    try {
      const { DatabaseService } = await import("./application/services/DatabaseService");
      if (type === "Organismo" || type === "Dependencia") {
         await DatabaseService.saveEstructuraOrg(updatedList);
      } else {
         await DatabaseService.saveEstructuraProc(updatedList);
      }
    } catch(e: any) {
      console.error("Could not save deletion to DB", e);
      showToast(`Error remoto al desactivar: ${e.message}`, "error");
    }

    showToast(`${type} desactivado exitosamente.`, "success", {
      type,
      name: itemName,
      action: "desactivado",
    });
  };

  const handleDeleteStructure = (type: string, id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: `Desactivar ${type}`,
      message: `¿Está seguro de que desea desactivar este ${type}? El elemento no se eliminará permanentemente, sino que pasará a estado inactivo para mantener el historial de auditoría.`,
      confirmText: "Desactivar",
      cancelText: "Cancelar",
      type: "warning",
      onConfirm: () => executeDeleteStructure(type, id),
    });
  };

  const getModuleTitle = () => {
    switch (activeModule) {
      case "inicio":
        return "Inicio";
      case "dashboard":
        return "Dashboard de Indicadores";
      case "estructura":
        return "Administración de Estructura";
      case "captura":
        return "Captura de Cargas de Trabajo";
      case "reportes":
        return "Reportes y Análisis";
      case "admin":
        return "Administración";
      case "configuracion":
        return "Configuración";
      default:
        return "SISDECAT - Sistema de Medición";
    }
  };

  React.useEffect(() => {
    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail === 'string') {
        setActiveModule(customEvent.detail as Module);
      }
    };
    window.addEventListener('navigate-module', handleNavigate);
    return () => window.removeEventListener('navigate-module', handleNavigate);
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (!import.meta.env.VITE_SUPABASE_URL) {
      localStorage.setItem('mockSession', JSON.stringify(user));
    }
    setSelectedVigenciaId(null);
    if (!usuarios.find(u => u.id === user.id)) {
      setUsuarios([...usuarios, user]);
    }

    // Auto-enroll the user into the current active vigencia if they aren't already enrolled
    const activeVigencia = vigencias.find(v => v.Estado === 'Activo');
    if (activeVigencia) {
      const alreadyEnrolled = vigenciasUsuarios.some(vu => vu.idUsuario === user.id && vu.idVigencia === activeVigencia.IdVigencia);
      if (!alreadyEnrolled) {
        // Admins retain their global roles in the vigencia so they don't get locked out
        const isAdmin = user.rol === "AdminFuncional" || user.rol === "Administrador";
        
        const newVu: any = {
          idVigenciaUsuario: `VU-${user.id}-${activeVigencia.IdVigencia}-${Date.now()}`,
          idVigencia: activeVigencia.IdVigencia,
          idUsuario: user.id,
          rol: isAdmin ? user.rol : 'Funcionario',
          idDependencia: ''
        };
        setVigenciasUsuarios(prev => [...prev, newVu]);

        import("./application/services/DatabaseService").then(({ DatabaseService }) => {
          DatabaseService.saveUsuarioDependencia({
             IdUsuarioDep: newVu.idVigenciaUsuario,
             IdVigencia: newVu.idVigencia,
             EntraIdObjectId: newVu.idUsuario,
             IdNodoOrg: newVu.idDependencia || null,
             RolFuncional: newVu.rol,
             Activo: true
          }).catch((e: any) => {
             console.error("Failed to save auto-enrollment to DB", e);
          });
        });
      }
    }

    if (user.rol === "Funcionario") {
      setActiveModule("inicio");
    } else {
      setActiveModule("dashboard");
    }
  };

  const handleLogout = async () => {
    setCurrentUser(null);
    localStorage.removeItem('mockSession');
    const { supabase } = await import('./lib/supabaseClient');
    if (supabase) {
       await supabase.auth.signOut();
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} usuarios={usuarios} />;
  }

  return (
    <div className="flex h-screen overflow-hidden font-sans selection:bg-institutional-blue/20 selection:text-institutional-blue relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%", scale: 0.9 }}
            animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
            exit={{ opacity: 0, y: -20, x: "-50%", scale: 0.9 }}
            className="fixed top-6 left-1/2 z-[400] flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-2xl border border-slate-100"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${toast.type === "success" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
            </div>
            <p className="text-sm font-medium text-slate-700 pr-4">
              {toast.message}
            </p>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-600 transition-colors ml-auto"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
      />

      <Sidebar
        currentUser={effectiveUser!}
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          notifications={notifications}
          onViewElement={handleViewElement}
          currentUser={effectiveUser!}
          onLogout={handleLogout}
          activeVigencia={currentVigenciaView}
          onSelectVigencia={(id) => setSelectedVigenciaId(id)}
          vigencias={availableVigencias}
        />
        <ModuleHeader title={getModuleTitle()} />

        <main className="flex-1 overflow-auto bg-slate-50/50">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeModule === "inicio" && (
                <InicioModule />
              )}
              {activeModule === "captura" && (
                <CapturaModule
                  currentUser={currentUser}
                  organismos={currentOrgData}
                  dependencias={currentDepData}
                  procesos={currentProcData}
                  procedimientos={currentPcdData}
                  actividades={currentActData}
                  cargas={currentCargas}
                  vigenciaActiva={currentVigenciaView?.Estado === 'Activo'}
                  relaciones={currentRelaciones}
                  onSave={handleSaveCarga}
                  onDelete={handleDeleteCarga}
                />
              )}
              {activeModule === "estructura" && (
                <EstructuraModule
                  hasVigencia={!!currentVigenciaId}
                  isReadOnly={currentUser?.rol === "Funcionario" || currentUser?.rol === "Analista"}
                  organismos={currentOrgData}
                  dependencias={currentDepData}
                  procesos={currentProcData}
                  procedimientos={currentPcdData}
                  actividades={currentActData}
                  vigenciaActiva={currentVigenciaView?.Estado === 'Activo' || currentVigenciaView?.Estado === 'Borrador'}
                  relaciones={currentRelaciones}
                  hiddenPaths={hiddenPaths}
                  focusElement={focusElement}
                  recentlyModifiedIds={recentlyModifiedIds}
                  onClearModifiedId={(id) =>
                    setRecentlyModifiedIds((prev) =>
                      prev.filter((modId) => modId !== id),
                    )
                  }
                  onDelete={handleDeleteStructure}
                  onSave={handleSaveStructure}
                  onLink={handleLinkElement}
                  onUnlink={handleUnlinkElement}
                  onImportOrganizacion={handleImportOrganizacion}
                  onImportProcesos={handleImportProcesos}
                  onImportRelaciones={handleImportRelaciones}
                />
              )}
              {activeModule === "dashboard" && (
                <DashboardModule
                  cargas={currentCargas}
                  dependencias={currentDepData}
                  procesos={currentProcData}
                  procedimientos={currentPcdData}
                  actividades={currentActData}
                  organismos={currentOrgData}
                  currentUser={currentUser}
                />
              )}
              {activeModule === "reportes" && (
                <ReportesModule
                  cargas={currentCargas}
                  organismos={currentOrgData}
                  dependencias={currentDepData}
                  procesos={currentProcData}
                  procedimientos={currentPcdData}
                  actividades={currentActData}
                  currentUser={currentUser}
                />
              )}
              {activeModule === "admin" && (
                <AdminModule
                  showToast={showToast}
                  cargas={currentCargas}
                  currentUser={effectiveUser!}
                  onUpdate={handleUpdateCarga}
                  onDelete={handleDeleteCarga}
                  organismos={currentOrgData}
                  dependencias={currentDepData}
                  actividades={currentActData}
                  procesos={currentProcData}
                  procedimientos={currentPcdData}
                  vigencias={availableVigencias}
                  vigenciaActiva={currentVigenciaView?.Estado === 'Activo'}
                  onVigenciaUpdate={async (v) => {
                    let finalVigencias = [...vigencias];
                    finalVigencias = finalVigencias.map(vig => 
                      vig.IdVigencia === v.IdVigencia ? v : vig
                    );
                    setVigencias(finalVigencias);
                    
                    try {
                      const { DatabaseService } = await import("./application/services/DatabaseService");
                      await DatabaseService.saveVigencia(v);
                      showToast('Vigencia y parámetros actualizados en la base de datos', 'success');
                    } catch (e) {
                      showToast('Datos actualizados localmente. Error en red.', 'success');
                    }
                  }}
                  onVigenciaCreate={handleCreateVigencia}
                  usuarios={usuarios}
                  vigenciasUsuarios={vigenciasUsuarios}
                  onUpdateVigenciaUsuario={async (vu) => {
                    const exists = vigenciasUsuarios.find(x => x.idVigenciaUsuario === vu.idVigenciaUsuario);
                    if (exists) {
                       setVigenciasUsuarios(vigenciasUsuarios.map(x => x.idVigenciaUsuario === vu.idVigenciaUsuario ? vu : x));
                    } else {
                       setVigenciasUsuarios([...vigenciasUsuarios, vu]);
                    }
                    try {
                      const { DatabaseService } = await import("./application/services/DatabaseService");
                      await DatabaseService.saveUsuarioDependencia({
                         IdUsuarioDep: vu.idVigenciaUsuario,
                         IdVigencia: vu.idVigencia,
                         EntraIdObjectId: vu.idUsuario,
                         IdNodoOrg: vu.idDependencia,
                         RolFuncional: vu.rol,
                         Activo: true
                      });
                      showToast('Asignación de usuario guardada', 'success');
                    } catch(e) {
                      showToast('Error de red al guardar asignación', 'error');
                    }
                  }}
                  onUpdateUsuario={(user) => {
                    setUsuarios(usuarios.map(u => u.id === user.id ? user : u));
                    showToast("Usuario actualizado", "success");
                  }}
                  onAddUsuario={(user) => {
                    setUsuarios([user, ...usuarios]);
                    showToast("Usuario creado", "success");
                  }}
                  onRestoreMockData={async () => {
                    try {
                      if (!currentVigenciaView) {
                         showToast('Debe haber una vigencia activa para generar datos', 'error');
                         return;
                      }

                      const generatedCargas: any[] = [];
                      const sampleCount = 20000; // Generate a robust 20,000 records
                      
                      const validRelaciones = currentRelaciones;
                      const validOrgs = currentOrgData;
                      const validDeps = currentDepData;
                      const validProcs = currentProcData;
                      const validPcds = currentPcdData;
                      const validActs = currentActData;

                      if (validActs.length === 0) {
                        showToast('Debe existir una estructura (con actividades) y mapas de relación', 'error');
                        return;
                      }

                      const nivelesEjecutor = ['Directivo', 'Asesor', 'Profesional', 'Técnico', 'Asistencial'];
                      const frecuencias = ['Diaria', 'Semanal', 'Quincenal', 'Mensual', 'Bimestral', 'Trimestral', 'Semestral', 'Anual'];
                      const timeUnits: ('minutos' | 'horas' | 'dias')[] = ['minutos', 'minutos', 'horas'];

                      // Pre-generate some mock users representing "Funcionarios"
                      const mockUsers = Array.from({ length: 20 }).map((_, i) => {
                         const randomOrgId = validOrgs[Math.floor(Math.random() * validOrgs.length)]?.id || "ORG-FALLBACK";
                         return {
                           id: `USR-MOCK-${i+1}`,
                           nombre: `Funcionario ${i+1}`,
                           rol: 'Funcionario' as const,
                           email: `funcionario${i+1}@ejemplo.com`,
                           organismoId: randomOrgId
                         };
                      });

                      // We will simulate the Captura UI to generate all truly valid paths.
                      const validPaths: { orgId: string; depId: string; procId: string; pcdId: string; actId: string }[] = [];

                      const getAllDescendantDependencias = (parentId: string): string[] => {
                        const direct = validDeps.filter((d) => d.parentId === parentId).map((d) => d.id);
                        const linked = validRelaciones.filter((r) => r.type === "Dependencia" && r.parentId === parentId).map((r) => r.childId);
                        const combined = Array.from(new Set([...direct, ...linked]));

                        let all = [...combined];
                        combined.forEach((id) => {
                          all = [...all, ...getAllDescendantDependencias(id)];
                        });
                        return all;
                      };

                      for (const org of validOrgs) {
                        const availableDeps = getAllDescendantDependencias(org.id);
                        const filteredDeps = validDeps.filter(d => availableDeps.includes(d.id));
                        
                        for (const dep of filteredDeps) {
                          const filteredProcesos = validProcs.filter((p) =>
                            p.dependenciaId === dep.id || p.dependenciaId === org.id ||
                            validRelaciones.some((r) => r.type === "Proceso" && r.childId === p.id && (r.parentId === dep.id || r.parentId === org.id))
                          );

                          for (const proc of filteredProcesos) {
                            let currProcs = validPcds.filter((pc) =>
                              pc.procesoId === proc.id ||
                              validRelaciones.some((r) => r.type === "Procedimiento" && r.childId === pc.id && r.parentId === proc.id) ||
                              validRelaciones.some((r) => r.type === "Procedimiento" && r.childId === pc.id && r.parentId === dep.id) ||
                              validRelaciones.some((r) => r.type === "Procedimiento" && r.childId === pc.id && r.parentId === org.id)
                            );
                            
                            const procRelation = validRelaciones.find((r) => r.type === "Proceso" && r.childId === proc.id && (r.parentId === dep.id || r.parentId === org.id));
                            if (procRelation?.includedChildren?.length) {
                              currProcs = currProcs.filter(pc => procRelation.includedChildren!.includes(pc.id));
                            }

                            for (const pcd of currProcs) {
                              let currActs = validActs.filter((a) =>
                                a.procedimientoId === pcd.id ||
                                validRelaciones.some((r) => r.type === "Actividad" && r.childId === a.id && r.parentId === pcd.id)
                              );
                              
                              const pcdRelation = validRelaciones.find((r) => r.type === "Procedimiento" && r.childId === pcd.id && r.parentId === proc.id);
                              if (pcdRelation?.includedChildren?.length) {
                                currActs = currActs.filter(a => pcdRelation.includedChildren!.includes(a.id));
                              }

                              for (const act of currActs) {
                                validPaths.push({ orgId: org.id, depId: dep.id, procId: proc.id, pcdId: pcd.id, actId: act.id });
                              }
                            }
                          }
                        }
                      }
                      
                      if (validPaths.length === 0) {
                        showToast('La estructura de datos provista no contiene rutas completas válidas (Organismo -> Dependencia -> Proceso -> ...). Por favor verifica los mapas de relación.', 'error');
                        return;
                      }

                      for (let i = 0; i < sampleCount; i++) {
                         const selectedPath = validPaths[Math.floor(Math.random() * validPaths.length)];

                         const sysRol = 'Funcionario';
                         const lvlEjecutor = nivelesEjecutor[Math.floor(Math.random() * nivelesEjecutor.length)];
                         const tNormal = Math.floor(Math.random() * 60) + 10;
                         const randomlySelectedUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];

                         generatedCargas.push({
                            id: crypto.randomUUID(),
                            vigenciaId: currentVigenciaView.IdVigencia,
                            organismoId: selectedPath.orgId,
                            dependenciaId: selectedPath.depId,
                            procesoId: selectedPath.procId,
                            procedimientoId: selectedPath.pcdId,
                            actividadId: selectedPath.actId,
                            tiempoMin: Math.max(1, tNormal - Math.floor(Math.random() * 10)),
                            tiempoNormal: tNormal,
                            tiempoMax: tNormal + Math.floor(Math.random() * 15) + 5,
                            volumenQ: Math.floor(Math.random() * 50) + 1,
                            unidadTiempo: timeUnits[Math.floor(Math.random() * timeUnits.length)],
                            frecuencia: frecuencias[Math.floor(Math.random() * frecuencias.length)],
                            participantes: 1,
                            userId: randomlySelectedUser.id,
                            autor: randomlySelectedUser.nombre,
                            rolEjecutor: lvlEjecutor,
                            userRole: sysRol,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                         });
                      }

                      if (generatedCargas.length === 0) {
                         showToast('No se pudieron generar datos. Verifica los mapas de relación.', 'error');
                         return;
                      }

                      // Check which mockUsers were actually used, or just append all
                      const newMockUsers = mockUsers.filter(mu => !usuarios.some(u => u.id === mu.id));
                      if (newMockUsers.length > 0) {
                        setUsuarios([...usuarios, ...newMockUsers]);
                      }

                      const { del } = await import('idb-keyval');
                      await del("sdmct_cargas_trabajo");
                      const { captureService } = await import("./application/services/captureService");
                      await captureService.initialize(generatedCargas);
                      setCargasTrabajo(generatedCargas);
                      showToast(`Generadas ${generatedCargas.length} cargas de trabajo correctamente asociadas.`, 'success');
                    } catch (error) {
                      console.error(error);
                      showToast('Error generando datos de prueba', 'error');
                    }
                  }}
                />
              )}
              {activeModule === "configuracion" && (
                <ConfiguracionModule currentUser={effectiveUser!} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
