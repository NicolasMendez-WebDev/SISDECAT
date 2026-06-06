import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  organismos,
  dependencias,
  procesos,
  procedimientos,
  actividades,
} from "./data/mockData";
import { Module, User, VigenciaUsuario } from "./domain/models/types";
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

import { SelectOrganismoModal } from "./presentation/components/Layout/SelectOrganismoModal";
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
  const [cargos, setCargos] = useState<any[]>([]);
  const [factoresFrecuencia, setFactoresFrecuencia] = useState<any[]>([]);
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
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);

  const [selectedVigenciaId, setSelectedVigenciaId] = useState<string | null>(
    null,
  );

  React.useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoadingData(true);
        let sessionUser = null;
        try {
          const { supabase } = await import("./lib/supabaseClient");
          if (supabase) {
            const {
              data: { session },
            } = await supabase.auth.getSession();
            if (session && session.user) {
              sessionUser = {
                id: session.user.id,
                nombre:
                  session.user.user_metadata?.full_name ||
                  session.user.email?.split("@")[0] ||
                  "Usuario",
                email: session.user.email,
                rol: session.user.user_metadata?.rol || "Funcionario",
              };
              setCurrentUser(sessionUser);
            }
          }

          const { DatabaseService } =
            await import("./application/services/DatabaseService");
          const vDb = await DatabaseService.getVigencias();
          setVigencias(vDb || []);

          const orgDb = await DatabaseService.getEstructuraOrg();
          const fetchedOrgs = orgDb
            .filter((x) => x.Nivel === 1)
            .map((x) => ({
              id: x.IdNodoOrg,
              vigenciaId: x.IdVigencia,
              codigo: x.CodigoInterno,
              nombre: x.Nombre,
              level: 1,
              activo: x.Activo,
              estado: x.Activo ? "Activo" : "Inactivo",
            }));
          const fetchedDeps = orgDb
            .filter((x) => x.Nivel > 1)
            .map((x) => ({
              id: x.IdNodoOrg,
              vigenciaId: x.IdVigencia,
              codigo: x.CodigoInterno,
              nombre: x.Nombre,
              parentId: x.IdPadre,
              level: x.Nivel,
              activo: x.Activo,
              estado: x.Activo ? "Activo" : "Inactivo",
            }));
          setOrgData(fetchedOrgs);
          setDepData(fetchedDeps);

          const mapaDb = await DatabaseService.getMapaRelaciones();
          const mappedRels = mapaDb
            .map((m) => ({
              vigenciaId:
                m.IdVigencia ||
                m.idvigencia ||
                m.vigenciaId ||
                (m as any).id_vigencia,
              parentId:
                m.IdNodoOrg ||
                m.idnodoorg ||
                m.parentId ||
                (m as any).id_nodo_org,
              childId:
                m.IdNodoProceso ||
                m.idnodoproceso ||
                m.childId ||
                (m as any).id_nodo_proceso,
              type:
                m.ObservacionRelacion ||
                m.observacionrelacion ||
                (m as any).observacion_relacion ||
                m.type ||
                "Proceso",
            }))
            .filter((r) => r.parentId && r.childId);

          // ... Continue the block completely by matching what it was doing, wait, I can just replace lines 155 to 191

          setRelaciones(mappedRels);

          const procDb = await DatabaseService.getEstructuraProc();
          // UI expects Proceso in procData, Procedimiento in pcdData, Actividad in actData (Nivel 1 are just categories)
          const fetchedProcs = procDb
            .filter((x) => x.Nivel <= 2)
            .map((x) => {
              const parentNivel1 = procDb.find(
                (p) => p.IdNodoProceso === x.IdPadre && p.Nivel === 1,
              );
              return {
                id: x.IdNodoProceso,
                vigenciaId: x.IdVigencia,
                codigo: x.CodigoInterno,
                nombre: x.Nombre,
                dependenciaId:
                  mappedRels.find(
                    (r) => String(r.childId) === String(x.IdNodoProceso),
                  )?.parentId || null,
                procesoId: x.IdPadre, // Mapping IdPadre as procesoId for level 1/2 if exists
                level: x.Nivel,
                activo: x.Activo,
                estado: x.Activo ? "Activo" : "Inactivo",
                tipo: parentNivel1 ? parentNivel1.Nombre : "Misional",
                descripcion: parentNivel1
                  ? `Tipo de proceso: ${parentNivel1.Nombre}`
                  : x.Nivel === 1
                    ? "Macoproceso/Tipo"
                    : "Misional",
              };
            });
          const fetchedPcds = procDb
            .filter((x) => x.Nivel === 3)
            .map((x) => ({
              id: x.IdNodoProceso,
              vigenciaId: x.IdVigencia,
              codigo: x.CodigoInterno,
              nombre: x.Nombre,
              procesoId: x.IdPadre,
              producto: x.Producto,
              level: 3,
              activo: x.Activo,
              estado: x.Activo ? "Activo" : "Inactivo",
            }));
          const fetchedActs = procDb
            .filter((x) => x.Nivel >= 4)
            .map((x) => ({
              id: x.IdNodoProceso,
              vigenciaId: x.IdVigencia,
              codigo: x.CodigoInterno,
              nombre: x.Nombre,
              procedimientoId: x.IdPadre,
              level: 4,
              activo: x.Activo,
              estado: x.Activo ? "Activo" : "Inactivo",
            }));

          setRelaciones(mappedRels);
          setProcData(fetchedProcs);
          setPcdData(fetchedPcds);
          setActData(fetchedActs);

          const fetchedUsuariosDep = await DatabaseService.getUsuariosOrganismos();

          // Build simple user stubs based on Sec.UsuariosOrganismos because auth.users is inaccessible
          const tmpUsersMap = new Map<string, User>();
          // Map to keep track of the canonical ID we assigned for each email to correct any duplicate IDs
          const emailToCanonicalId = new Map<string, string>();
          
          fetchedUsuariosDep.forEach((x) => {
             const id = x.EntraIdObjectId;
             const rawEmail = x.UPN || `${id}@sisdecat.gov.co`;
             const email = rawEmail.toLowerCase();
             
               if (!tmpUsersMap.has(email)) {
                 tmpUsersMap.set(email, {
                   id: id,
                   email: rawEmail,
                   nombre: rawEmail
                     ? rawEmail.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())
                     : `Usuario ${id.substring(0, 5)}`,
                   rol: x.RolFuncional || "Funcionario",
                   dependenciaId: x.IdNodoOrg || undefined
                 });
                 emailToCanonicalId.set(email, id);
               } else {
                 // Check if there are any conflicting roles. In a unified role system, they should all be identical.
                 // We simply maintain the role they have. If there are duplicates, we keep the role mapped.
                 // No more automatic rank elevation that damages global role.
               }
          });
          const uniqueUsers = Array.from(tmpUsersMap.values());
          
          // Deduplicate vigenciasUsuarios prioritizing the most recent/actual rol if there are duplicates
          const seenVigenciaUsuario = new Set<string>();
          const dedupedVigenciasUsuarios: VigenciaUsuario[] = [];
          
          fetchedUsuariosDep.forEach((x) => {
             const rawEmail = x.UPN || `${x.EntraIdObjectId}@sisdecat.gov.co`;
             const canonicalId = emailToCanonicalId.get(rawEmail.toLowerCase()) || x.EntraIdObjectId;
             
             const key = `${canonicalId}-${x.IdVigencia}`;
             if (!seenVigenciaUsuario.has(key)) {
                seenVigenciaUsuario.add(key);
                dedupedVigenciasUsuarios.push({
                  idVigenciaUsuario: x.IdUsuarioDep,
                  idVigencia: x.IdVigencia,
                  idUsuario: canonicalId,
                  idDependencia: x.IdNodoOrg,
                  rol: x.RolFuncional,
                });
             }
          });
          
          setVigenciasUsuarios(dedupedVigenciasUsuarios);

          let currentUserToAdd = null;
          if (sessionUser) {
            if (!uniqueUsers.find((x) => x.id === sessionUser.id)) {
              currentUserToAdd = sessionUser;
              uniqueUsers.push(sessionUser);
            }
          } else {
            const mockSession = localStorage.getItem("mockSession");
            if (mockSession) {
              const parsed = JSON.parse(mockSession);
              setCurrentUser(parsed);
              if (!uniqueUsers.find((x) => x.id === parsed.id)) {
                uniqueUsers.push(parsed);
              }
            }
          }

          setUsuarios(uniqueUsers);

          // We have basic structure, let the user in
          setIsLoadingData(false);

          try {
            const { captureService } =
              await import("./application/services/captureService");
            const existingCargas = await captureService.getCargas();
            setCargasTrabajo(existingCargas || []);

            // Extract users from CargasTrabajo
            if (existingCargas && existingCargas.length > 0) {
              setUsuarios((prev) => {
                const updated = [...prev];
                existingCargas.forEach((c) => {
                  const author = c.autor || "Usuario Desconocido";
                  let id = c.userId || (author.includes("@") ? author : author.toLowerCase().replace(/ /g, "."));
                  let email = author.includes("@") ? author : `${id}@sisdecat.gov.co`;
                  
                  if (!updated.find((u) => u.id === id || u.email.toLowerCase() === email.toLowerCase())) {
                    updated.push({
                      id: id,
                      email: email,
                      nombre: author.includes("@") ? author.split("@")[0].replace(/[._]/g, " ") : author,
                      rol: "Funcionario",
                    });
                  }
                });
                return updated;
              });
            }

            const [cargosDb, factDb] = await Promise.all([
              DatabaseService.getCargos(),
              DatabaseService.getFactoresFrecuencia(),
            ]);
            
            const savedCargosOrder = JSON.parse(localStorage.getItem('cargos_order') || '{}');
            const sortedCargos = (cargosDb || []).sort((a: any, b: any) => 
               (savedCargosOrder[a.IdCargo] ?? 9999) - (savedCargosOrder[b.IdCargo] ?? 9999)
            );
            
            const savedFactOrder = JSON.parse(localStorage.getItem('factores_order') || '{}');
            const sortedFact = (factDb || []).sort((a: any, b: any) => 
               (savedFactOrder[a.IdFactor] ?? 9999) - (savedFactOrder[b.IdFactor] ?? 9999)
            );

            setCargos(sortedCargos);
            setFactoresFrecuencia(sortedFact);
          } catch(e) {
            console.error("Error fetching background records:", e);
          } finally {
            setIsLoadingRecords(false);
          }

        } catch (e: any) {
          console.error("Error loading prod data from supabase:", e);
          showToast(
            `Error al cargar datos desde Supabase: ${e.message}`,
            "error",
          );
          setOrgData([]);
          setDepData([]);
          setProcData([]);
          setPcdData([]);
          setActData([]);
          setVigencias([]);
          setRelaciones([]);
          setCargasTrabajo([]);
        }
      } catch (error: any) {
        console.error("Error de inicialización:", error);
        showToast(
          "Error de conexión o configuración inicial: " + error.message,
          "error",
        );
      } finally {
        setIsLoadingData(false);
        setIsLoadingRecords(false);
      }
    };
    initializeData();
  }, []);

  const _activeVigencia = vigencias.find(
    (v) => v.Estado === "Activo" && v.Activo !== false,
  );

  let currentVigenciaView = vigencias.find(
    (v) =>
      v.IdVigencia === (selectedVigenciaId || _activeVigencia?.IdVigencia) &&
      v.Activo !== false,
  );
  if (currentUser?.rol === "Funcionario") {
    currentVigenciaView = _activeVigencia;
  }

  const currentVigenciaId = currentVigenciaView?.IdVigencia;

  const currentUserVigenciaContext = vigenciasUsuarios.find(
    (vu) =>
      vu.idUsuario === currentUser?.id && String(vu.idVigencia) === String(currentVigenciaId),
  );

  let currentOrgData = orgData.filter(
    (x) => x.vigenciaId === currentVigenciaId && x.activo !== false,
  );
  let currentDepData = depData.filter(
    (x) => x.vigenciaId === currentVigenciaId && x.activo !== false,
  );
  const currentProcData = procData.filter(
    (x) => x.vigenciaId === currentVigenciaId && x.activo !== false,
  );
  const currentPcdData = pcdData.filter(
    (x) => x.vigenciaId === currentVigenciaId && x.activo !== false,
  );
  const currentActData = actData.filter(
    (x) => x.vigenciaId === currentVigenciaId && x.activo !== false,
  );

  // Default legacy mock cargas to the current vigencia if they don't have one
  const currentCargas = cargasTrabajo
    .map((c) => {
      let newC = !c.vigenciaId
        ? { ...c, vigenciaId: currentVigenciaId }
        : { ...c };
      if (!newC.userRole || !newC.userId) {
        if (
          currentUser &&
          (c.autor === currentUser.nombre ||
            c.autor === currentUser.id ||
            c.userId === currentUser.id)
        ) {
          newC.userRole = currentUser.rol;
          newC.userId = currentUser.id;
        } else {
          // Match by autor
          const foundUser = usuarios.find(
            (u) => u.nombre === c.autor || u.id === c.autor,
          );
          if (foundUser) {
            newC.userRole = foundUser.rol;
            newC.userId = foundUser.id;
          }
        }
      }
      return newC;
    })
    .filter((c) => c.vigenciaId === currentVigenciaId);
  const currentRelaciones = relaciones.filter(
    (r) => String(r.vigenciaId) === String(currentVigenciaId),
  );

  // Compute UI-friendly pseudo relations to properly wrap Procedimientos inside their Procesos
  const uiRelaciones = React.useMemo(() => {
    const computedMap = new Map<string, any>();

    currentRelaciones.forEach((rel) => {
      let currentType = rel.type || "Proceso";
      const childIdStr = String(rel.childId).toLowerCase().trim();
      const parentIdStr = String(rel.parentId).toLowerCase().trim();

      // Find the true nature of this ID first, no matter what `rel.type` saved in DB says
      const pcd = currentPcdData.find(
        (p) => String(p.id).toLowerCase().trim() === childIdStr,
      );
      if (pcd) {
        if (pcd.procesoId) {
          const key = `${parentIdStr}_${String(pcd.procesoId).toLowerCase().trim()}`;
          if (computedMap.has(key)) {
            const existing = computedMap.get(key);
            if (!existing.includedChildren) existing.includedChildren = [];
            if (!existing.includedChildren.includes(pcd.id)) {
              existing.includedChildren.push(pcd.id);
            }
          } else {
            computedMap.set(key, {
              type: "Proceso", // We group procedures under a synthetic Proceso relation
              childId: pcd.procesoId,
              parentId: rel.parentId,
              vigenciaId: rel.vigenciaId,
              includedChildren: [pcd.id],
            });
          }
          return; // skip raw
        } else {
          currentType = "Procedimiento"; // Fix type just in case
        }
      }

      const proc = currentProcData.find(
        (p) => String(p.id).toLowerCase().trim() === childIdStr,
      );
      if (proc) {
        currentType = "Proceso";
      }

      const act = currentActData.find(
        (p) => String(p.id).toLowerCase().trim() === childIdStr,
      );
      if (act) {
        currentType = "Actividad";
      }

      const dep = currentDepData.find(
        (d) => String(d.id).toLowerCase().trim() === childIdStr,
      );
      if (dep) {
        currentType = "Dependencia";
      }

      const fallbackKey = `${parentIdStr}_${childIdStr}`;
      if (computedMap.has(fallbackKey)) {
        // Keep includedChildren for already-seeded items (when parent process already has an entry)
        const existing = computedMap.get(fallbackKey);
        existing.type = currentType;
      } else {
        computedMap.set(fallbackKey, { ...rel, type: currentType });
      }
    });

    return Array.from(computedMap.values());
  }, [currentRelaciones, currentPcdData, currentProcData, currentActData]);

  const rawDependenciaId = currentUserVigenciaContext?.idDependencia || currentUser?.dependenciaId;
  let computedOrganismoId = currentUser?.organismoId || currentUserVigenciaContext?.idOrganismo;
  
  if (rawDependenciaId && !computedOrganismoId) {
    // Traverse relations to find the Organismo ancestor
    let currTarget = rawDependenciaId;
    let fallbackLevels = 10;
    while(fallbackLevels > 0) {
       const currLower = String(currTarget).toLowerCase().trim();
       
       const foundOrg = currentOrgData.find(o => String(o.id).toLowerCase().trim() === currLower);
       if (foundOrg) {
          computedOrganismoId = foundOrg.id;
          break;
       }

       const directParentDep = currentDepData.find(d => String(d.id).toLowerCase().trim() === currLower);
       if (directParentDep && directParentDep.parentId) {
         currTarget = directParentDep.parentId;
       } else {
         const rel = uiRelaciones.find(r => String(r.childId).toLowerCase().trim() === currLower && (r.type === 'Dependencia' || r.type === 'Organismo-Dependencia'));
         if (rel) {
            currTarget = rel.parentId;
         } else {
            break;  
         }
       }
       fallbackLevels--;
    }
  }

  const effectiveUser = currentUser
    ? {
        ...currentUser,
        rol: usuarios.find(u => u.email.toLowerCase() === currentUser.email.toLowerCase())?.rol || currentUser.rol,
        dependenciaId: rawDependenciaId,
        organismoId: computedOrganismoId
      }
    : null;

  if (effectiveUser?.rol === "Funcionario" && effectiveUser.organismoId) {
    currentOrgData = currentOrgData.filter(o => o.id === effectiveUser.organismoId);
  }

  const availableVigencias = (
    currentUser?.rol === "Funcionario"
      ? vigencias.filter(
          (v) => v.Estado === "Activo" || v.Estado === "Historico",
        )
      : vigencias
  ).filter((v) => v.Activo !== false);

  const mustSelectOrganismo = !!(
    effectiveUser &&
    effectiveUser.rol === "Funcionario" &&
    currentVigenciaView?.Estado === "Activo" &&
    currentUserVigenciaContext &&
    !currentUserVigenciaContext.idDependencia
  );

  const handleSelectOrganismo = async (orgId: string, depId: string) => {
    if (!currentUser || !currentVigenciaView || !currentUserVigenciaContext) return;
    
    // Optimistic Update
    setVigenciasUsuarios(prev => prev.map(vu => 
       vu.idVigenciaUsuario === currentUserVigenciaContext.idVigenciaUsuario
       ? { ...vu, idOrganismo: orgId, idDependencia: depId } 
       : vu
    ));
    setUsuarios(prev => prev.map(u => 
       u.id === currentUser.id ? { ...u, organismoId: orgId, dependenciaId: depId } : u
    ));
    setCurrentUser(prev => prev ? { ...prev, organismoId: orgId, dependenciaId: depId } : prev);
    
    // DB Update
    try {
        const { DatabaseService } = await import("./application/services/DatabaseService");
        await DatabaseService.saveUsuarioDependencia({
            IdUsuarioDep: currentUserVigenciaContext.idVigenciaUsuario,
            IdVigencia: currentVigenciaView.IdVigencia,
            EntraIdObjectId: currentUser.id,
            IdNodoOrg: depId,
            RolFuncional: "Funcionario",
            Activo: true,
            UPN: currentUser.email
        });
        showToast("Organismo y dependencia asignados correctamente", "success");
    } catch(e) {
        showToast("Error guardando dependencia", "error");
    }
  };

  const handleCreateVigencia = async (
    v: any,
    sourceVigenciaId?: string | null,
  ) => {
    let finalVigencias = [...vigencias];
    finalVigencias.push(v);
    setVigencias(finalVigencias);

    try {
      const { DatabaseService } =
        await import("./application/services/DatabaseService");
      await DatabaseService.saveVigencia(v);
      showToast(
        "Vigencia guardada exitosamente en la base de datos.",
        "success",
      );

      // Set default Cargos and FactoresFrecuencia
      const defaultCargos = [
        { IdVigencia: v.IdVigencia, Denominacion: "Asistencial", Activo: true },
        { IdVigencia: v.IdVigencia, Denominacion: "Técnico", Activo: true },
        { IdVigencia: v.IdVigencia, Denominacion: "Profesional", Activo: true },
        { IdVigencia: v.IdVigencia, Denominacion: "Asesor", Activo: true },
        { IdVigencia: v.IdVigencia, Denominacion: "Directivo", Activo: true },
      ];

      const defaultFactores = [
        {
          IdVigencia: v.IdVigencia,
          Nombre: "Diaria",
          FactorMensual: 19,
          EsSistema: true,
        },
        {
          IdVigencia: v.IdVigencia,
          Nombre: "Semanal",
          FactorMensual: 4,
          EsSistema: true,
        },
        {
          IdVigencia: v.IdVigencia,
          Nombre: "Quincenal",
          FactorMensual: 2,
          EsSistema: true,
        },
        {
          IdVigencia: v.IdVigencia,
          Nombre: "Mensual",
          FactorMensual: 1,
          EsSistema: true,
        },
        {
          IdVigencia: v.IdVigencia,
          Nombre: "Bimestral",
          FactorMensual: 0.5,
          EsSistema: true,
        },
        {
          IdVigencia: v.IdVigencia,
          Nombre: "Trimestral",
          FactorMensual: 0.33,
          EsSistema: true,
        },
        {
          IdVigencia: v.IdVigencia,
          Nombre: "Semestral",
          FactorMensual: 0.16,
          EsSistema: true,
        },
        {
          IdVigencia: v.IdVigencia,
          Nombre: "Anual",
          FactorMensual: 0.08,
          EsSistema: true,
        },
      ];

      const newCargos: any[] = [];
      for (const dc of defaultCargos) {
        const saved = await DatabaseService.saveCargo(dc).catch(() => dc);
        newCargos.push(saved);
      }
      setCargos((prev) => [...prev, ...newCargos]);

      const newFactores: any[] = [];
      for (const df of defaultFactores) {
        const saved = await DatabaseService.saveFactorFrecuencia(df).catch(
          () => df,
        );
        newFactores.push(saved);
      }
      setFactoresFrecuencia((prev) => [...prev, ...newFactores]);
    } catch (e: any) {
      console.error("Could not push vigencia to API", e);
      showToast(`Error de conexión al servidor: ${e.message}`, "error");
    }

    if (sourceVigenciaId) {
      // Check if there are structures in that source to clone
      const sourceOrgData = orgData.filter(
        (x) => x.vigenciaId === sourceVigenciaId,
      );
      const sourceDepData = depData.filter(
        (x) => x.vigenciaId === sourceVigenciaId,
      );
      const sourceProcData = procData.filter(
        (x) => x.vigenciaId === sourceVigenciaId,
      );
      const sourcePcdData = pcdData.filter(
        (x) => x.vigenciaId === sourceVigenciaId,
      );
      const sourceActData = actData.filter(
        (x) => x.vigenciaId === sourceVigenciaId,
      );

      // Create an ID map to preserve relationships
      const idMap = new Map<string, string>();
      const getNewId = (oldId: string, prefix: string) => {
        if (!oldId) return undefined;
        if (!idMap.has(oldId)) {
          idMap.set(oldId, crypto.randomUUID());
        }
        return idMap.get(oldId);
      };

      const newOrgData = sourceOrgData.map((x) => ({
        ...x,
        vigenciaId: v.IdVigencia,
        id: getNewId(x.id, "org")!,
        parentId: getNewId(x.parentId!, "org"),
      }));
      const newDepData = sourceDepData.map((x) => ({
        ...x,
        vigenciaId: v.IdVigencia,
        id: getNewId(x.id, "dep")!,
        parentId: getNewId(x.parentId!, "dep") || getNewId(x.parentId!, "org"),
      }));
      const newProcData = sourceProcData.map((x) => ({
        ...x,
        vigenciaId: v.IdVigencia,
        id: getNewId(x.id, "proc")!,
        dependenciaId: getNewId(x.dependenciaId, "dep")!,
      }));
      const newPcdData = sourcePcdData.map((x) => ({
        ...x,
        vigenciaId: v.IdVigencia,
        id: getNewId(x.id, "pcd")!,
        procesoId: getNewId(x.procesoId, "proc")!,
      }));
      const newActData = sourceActData.map((x) => ({
        ...x,
        vigenciaId: v.IdVigencia,
        id: getNewId(x.id, "act")!,
        procedimientoId: getNewId(x.procedimientoId, "pcd")!,
      }));

      setOrgData([...orgData, ...newOrgData]);
      setDepData([...depData, ...newDepData]);
      setProcData([...procData, ...newProcData]);
      setPcdData([...pcdData, ...newPcdData]);
      setActData([...actData, ...newActData]);

      // Clone relaciones too
      const newRelaciones = relaciones
        .filter(
          (r) =>
            r.vigenciaId === sourceVigenciaId &&
            (sourceProcData.some((p) => p.id === r.childId) ||
              sourcePcdData.some((p) => p.id === r.childId) ||
              sourceActData.some((p) => p.id === r.childId)),
        )
        .map((r) => ({
          ...r,
          id: crypto.randomUUID(),
          childId: idMap.get(r.childId) || r.childId,
          parentId: idMap.get(r.parentId) || r.parentId,
          vigenciaId: v.IdVigencia,
          includedChildren: r.includedChildren
            ? r.includedChildren.map((cId: string) => idMap.get(cId) || cId)
            : undefined,
        }));
      setRelaciones([...relaciones, ...newRelaciones]);

      try {
        const { DatabaseService } =
          await import("./application/services/DatabaseService");
        await DatabaseService.saveEstructuraOrg([...newOrgData, ...newDepData]);
        await DatabaseService.saveEstructuraProc([
          ...newProcData,
          ...newPcdData,
          ...newActData,
        ]);
        await DatabaseService.saveMapaRelaciones(newRelaciones);
      } catch (e: any) {
        console.error("Could not save cloned structures to DB", e);
        showToast(
          `Error al clonar estructura en la base de datos: ${e.message}`,
          "error",
        );
      }
    }
    showToast("Nueva Vigencia Registrada", "success");
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
      const { captureService } =
        await import("./application/services/captureService");
      const saved = await captureService.createCarga(cargaConMeta);
      setCargasTrabajo([...cargasTrabajo, saved]);
      console.log("Carga guardada en backend simulado:", saved);
    } catch (error) {
      showToast("Error al guardar registro", "error");
    }
  };

  const handleUpdateCarga = async (updatedCarga: any) => {
    try {
      const { captureService } =
        await import("./application/services/captureService");

      const originalCarga = currentCargas.find((c) => c.id === updatedCarga.id);
      if (!originalCarga) return;

      // Track changes
      const changes = [];
      const fieldsToCheck = [
        "volumenQ",
        "frecuencia",
        "unidadTiempo",
        "tiempoMin",
        "tiempoNormal",
        "tiempoMax",
      ];
      fieldsToCheck.forEach((field) => {
        if (originalCarga[field] !== updatedCarga[field]) {
          changes.push({
            field,
            old: originalCarga[field],
            new: updatedCarga[field],
          });
        }
      });

      if (changes.length > 0) {
        const auditEntry = {
          timestamp: new Date().toISOString(),
          editor: currentUser?.nombre || "Administrador",
          rol: currentUser?.rol || "Súper-Administrador",
          changes,
          comentario: updatedCarga._comentario || "Sin comentarios adicionales",
        };
        updatedCarga.auditLog = [...(originalCarga.auditLog || []), auditEntry];
        delete updatedCarga._comentario;
      }

      const updated = await captureService.updateCarga(
        updatedCarga.id,
        updatedCarga,
      );

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
      const { captureService } =
        await import("./application/services/captureService");
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
      if (type === "Organismo")
        newOrgs = orgData.map((o) => (o.id === id ? { ...o, ...data } : o));
      if (type === "Dependencia")
        newDeps = depData.map((d) => (d.id === id ? { ...d, ...data } : d));
      if (type === "Proceso")
        newProcs = procData.map((p) => (p.id === id ? { ...p, ...data } : p));
      if (type === "Procedimiento")
        newPcds = pcdData.map((pc) => (pc.id === id ? { ...pc, ...data } : pc));
      if (type === "Actividad")
        newActs = actData.map((a) => (a.id === id ? { ...a, ...data } : a));
    } else {
      const newId = crypto.randomUUID();
      modifiedId = newId;

      let calculatedLevel = 1;
      if (type === "Organismo") calculatedLevel = 1;
      else if (type === "Dependencia") calculatedLevel = data.parentId ? 2 : 2;
      else if (type === "Proceso")
        calculatedLevel = 2; // Nivel 2
      else if (type === "Procedimiento")
        calculatedLevel = 3; // Nivel 3
      else if (type === "Actividad") calculatedLevel = 4; // Nivel 4

      // Generate a 6 digit code if user did not provide one
      const finalCodigo = data.codigo?.trim()
        ? data.codigo
        : Math.floor(100000 + Math.random() * 900000).toString();

      const newItem = {
        id: newId,
        ...data,
        codigo: finalCodigo,
        activo: true,
        estado: "Activo",
        vigenciaId: currentVigenciaView?.IdVigencia,
        level: calculatedLevel,
        nivel: calculatedLevel,
      };

      if (type === "Organismo") {
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

    let newRels = [...relaciones];
    if (mode === "create" && type === "Proceso" && data.parentId) {
      newRels.push({
        type: "Proceso",
        childId: modifiedId!,
        parentId: data.parentId,
        vigenciaId: currentVigenciaView?.IdVigencia,
      });
    }

    try {
      const { DatabaseService } =
        await import("./application/services/DatabaseService");
      if (type === "Organismo" || type === "Dependencia") {
        await DatabaseService.saveEstructuraOrg([...newOrgs, ...newDeps]);
      } else {
        await DatabaseService.saveEstructuraProc([
          ...newProcs,
          ...newPcds,
          ...newActs,
        ]);
        if (mode === "create" && type === "Proceso" && data.parentId) {
          await DatabaseService.saveMapaRelaciones(newRels);
        }
      }

      setOrgData(newOrgs);
      setDepData(newDeps);
      setProcData(newProcs);
      setPcdData(newPcds);
      setActData(newActs);
      if (mode === "create" && type === "Proceso" && data.parentId) {
        setRelaciones(newRels);
      }
    } catch (e: any) {
      console.error("Could not push structure update to API", e);
      showToast(`Error al guardar en base de datos: ${e.message}`, "error");
      return; // DO NOT update state or show success toast if it fails
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
      const codeKey =
        allHeaders.find(
          (k) =>
            k.toLowerCase().includes("código") ||
            k.toLowerCase().includes("codigo") ||
            k.toLowerCase().includes("cÃ³digo"),
        ) || allHeaders[0];
      const nameKey =
        allHeaders.find(
          (k) =>
            k.toLowerCase().includes("dependencia") ||
            k.toLowerCase().includes("organismo") ||
            k.toLowerCase().includes("nombre") ||
            k.toLowerCase().includes("descrip"),
        ) || allHeaders[1];
      const padreKey =
        allHeaders.find((k) => k.toLowerCase().includes("padre")) ||
        allHeaders[2];
      const nivelKey =
        allHeaders.find((k) => k.toLowerCase().includes("nivel")) ||
        allHeaders[3];

      const newOrgs: any[] = [];
      const newDeps: any[] = [];
      const idCodeMap = new Map<string, string>();

      orgData
        .filter((o) => o.vigenciaId === currentVigenciaView?.IdVigencia)
        .forEach((o) => {
          if (o.codigo && o.id) idCodeMap.set(o.codigo, o.id);
        });
      depData
        .filter((d) => d.vigenciaId === currentVigenciaView?.IdVigencia)
        .forEach((d) => {
          if (d.codigo && d.id) idCodeMap.set(d.codigo, d.id);
        });

      // Generate UUIDs for all rows to ensure forward references work
      datos.forEach((row) => {
        const codigo = String(row[codeKey as string] ?? "").trim();
        if (codigo && !idCodeMap.has(codigo)) {
          idCodeMap.set(codigo, crypto.randomUUID());
        }
      });

      datos.forEach((row) => {
        const codigo = String(row[codeKey as string] ?? "").trim();
        const nombre = String(row[nameKey as string] ?? "").trim();
        const padreRaw = row[padreKey as string];
        const padre = padreRaw ? String(padreRaw).trim() : "";
        const nivel = String(row[nivelKey as string] ?? "").trim();

        if (!codigo || !nombre) return;

        let nodeUuid = idCodeMap.get(codigo);
        if (!nodeUuid) {
          nodeUuid = crypto.randomUUID();
          idCodeMap.set(codigo, nodeUuid);
        }

        let parentUuid = null;
        if (padre && padre !== codigo) {
          parentUuid = idCodeMap.get(padre) || null;
        }

        if (nivel === "0" || nivel === "1" || !padre || padre === codigo) {
          // Organismo usually root
          newOrgs.push({
            id: nodeUuid,
            codigo: codigo,
            nombre,
            activo: true,
            level: 1,
            vigenciaId: currentVigenciaView?.IdVigencia,
            fechaCreacion: new Date().toISOString(),
          });
        } else {
          // Dependencia
          newDeps.push({
            id: nodeUuid,
            codigo: codigo,
            nombre,
            activo: true,
            level: 2,
            parentId: parentUuid || undefined,
            vigenciaId: currentVigenciaView?.IdVigencia,
            fechaCreacion: new Date().toISOString(),
          });
        }
      });

      const combinedOrgsDeps = [...newOrgs, ...newDeps];
      const uniqueOrgsMap = new Map();
      combinedOrgsDeps.forEach((item) =>
        uniqueOrgsMap.set(item.id, { ...item, estado: "Activo" }),
      );
      const dedupedOrgs = Array.from(uniqueOrgsMap.values());

      if (dedupedOrgs.length > 0) {
        try {
          const { DatabaseService } =
            await import("./application/services/DatabaseService");
          const orgData = dedupedOrgs.filter(
            (d) => d.nivel === 1 || d.level === 1,
          );
          const depData = dedupedOrgs.filter(
            (d) => d.nivel === 2 || d.level === 2,
          );

          if (orgData.length > 0)
            await DatabaseService.saveEstructuraOrg(orgData);
          if (depData.length > 0)
            await DatabaseService.saveEstructuraOrg(depData);
        } catch (e: any) {
          console.error("Error saving imported orgs", e);
          showToast(
            `Error guardando exportación en base de datos: ${e.message}`,
            "error",
          );
        }
      }

      if (dedupedOrgs.length > 0) {
        setOrgData((prev) => {
          const map = new Map(prev.map((o) => [o.id, o]));
          dedupedOrgs
            .filter((d) => d.level === 1 || d.nivel === 1)
            .forEach((d) => map.set(d.id, d));
          return Array.from(map.values());
        });
        setDepData((prev) => {
          const map = new Map(prev.map((d) => [d.id, d]));
          dedupedOrgs
            .filter((d) => d.level === 2 || d.nivel === 2)
            .forEach((d) => map.set(d.id, d));
          return Array.from(map.values());
        });
      }
      showToast(
        `Se importaron/actualizaron ${dedupedOrgs.length} organismos y dependencias.`,
        "success",
      );
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
      const codeKey =
        allHeaders.find(
          (k) =>
            k.toLowerCase().includes("código") ||
            k.toLowerCase().includes("codigo") ||
            k.toLowerCase().includes("cÃ³digo"),
        ) || allHeaders[0];
      const nameKey =
        allHeaders.find(
          (k) =>
            k.toLowerCase().includes("proceso") ||
            k.toLowerCase().includes("procedimiento") ||
            k.toLowerCase().includes("actividad") ||
            k.toLowerCase().includes("nombre") ||
            k.toLowerCase().includes("dependencia"),
        ) || allHeaders[1];
      const padreKey =
        allHeaders.find((k) => k.toLowerCase().includes("padre")) ||
        allHeaders[2];
      const nivelKey =
        allHeaders.find((k) => k.toLowerCase().includes("nivel")) ||
        allHeaders[3];

      const newProcs: any[] = [];
      const newPcds: any[] = [];
      const newActs: any[] = [];

      const tiposProceso: Record<string, string> = {};
      const idCodeMap = new Map<string, string>(); // Maps legacy code to UUID

      // Use all elements (including inactive ones) from the DB to avoid UNIQUE constraint conflicts on CodigoInterno
      procData
        .filter((p) => p.vigenciaId === currentVigenciaView?.IdVigencia)
        .forEach((p) => {
          if (p.codigo && p.id) idCodeMap.set(p.codigo, p.id);
        });
      pcdData
        .filter((p) => p.vigenciaId === currentVigenciaView?.IdVigencia)
        .forEach((p) => {
          if (p.codigo && p.id) idCodeMap.set(p.codigo, p.id);
        });
      actData
        .filter((a) => a.vigenciaId === currentVigenciaView?.IdVigencia)
        .forEach((a) => {
          if (a.codigo && a.id) idCodeMap.set(a.codigo, a.id);
        });

      // Generate UUIDs for all rows to ensure forward references work
      datos.forEach((row) => {
        const codigo = String(row[codeKey as string] ?? "").trim();
        if (codigo && !idCodeMap.has(codigo)) {
          idCodeMap.set(codigo, crypto.randomUUID());
        }
      });

      // Primera pasada: identificar Tipos de Proceso (Nivel 1)
      datos.forEach((row) => {
        const codigo = String(row[codeKey as string] ?? "").trim();
        const nombre = String(row[nameKey as string] ?? "").trim();
        const nivel = String(row[nivelKey as string] ?? "").trim();

        if (codigo && nombre && (nivel === "1" || nivel === "0")) {
          tiposProceso[codigo] = nombre;
        }
      });

      datos.forEach((row) => {
        const codigo = String(row[codeKey as string] ?? "").trim();
        const nombre = String(row[nameKey as string] ?? "").trim();
        const padreRaw = row[padreKey as string];
        const padre = padreRaw ? String(padreRaw).trim() : "";
        const nivel = String(row[nivelKey as string] ?? "").trim();

        if (!codigo || !nombre) return;

        let nodeUuid = idCodeMap.get(codigo);
        if (!nodeUuid) {
          nodeUuid = crypto.randomUUID();
          idCodeMap.set(codigo, nodeUuid);
        }

        let parentUuid = null;
        if (padre && padre !== codigo) {
          parentUuid = idCodeMap.get(padre) || null;
        }

        const nivelLower = nivel.toLowerCase();

        // If it's explicitly 2 or explicitly 'proceso' or has no parent (making it root in the new structure)
        if (
          !padre ||
          codigo === padre ||
          nivel === "1" ||
          nivel === "2" ||
          nivelLower.includes("proceso") ||
          nivelLower === "0"
        ) {
          newProcs.push({
            id: nodeUuid,
            codigo: codigo,
            nombre,
            procesoId: parentUuid || undefined,
            descripcion: "Importado",
            activo: true,
            nivel: 2, // Force level 2 for Proceso to match UI logic
            tipo: "Misional",
            vigenciaId: currentVigenciaView?.IdVigencia,
          });
        } else if (nivel === "3" || nivelLower.includes("procedimiento")) {
          newPcds.push({
            id: nodeUuid,
            codigo: codigo,
            nombre,
            procesoId: parentUuid || undefined,
            activo: true,
            nivel: 3,
            vigenciaId: currentVigenciaView?.IdVigencia,
          });
        } else {
          newActs.push({
            id: nodeUuid,
            codigo: codigo,
            nombre,
            procedimientoId: parentUuid || undefined,
            activo: true,
            nivel: 4,
            vigenciaId: currentVigenciaView?.IdVigencia,
          });
        }
      });

      const combinedProcs = [...newProcs, ...newPcds, ...newActs];
      const uniqueProcsMap = new Map();
      combinedProcs.forEach((item) =>
        uniqueProcsMap.set(item.id, { ...item, estado: "Activo" }),
      );
      const dedupedProcs = Array.from(uniqueProcsMap.values());

      if (dedupedProcs.length > 0) {
        try {
          const { DatabaseService } =
            await import("./application/services/DatabaseService");
          const procsNivel1_2 = dedupedProcs.filter((p) => p.nivel <= 2);
          const procsNivel3 = dedupedProcs.filter((p) => p.nivel === 3);
          const procsNivel4 = dedupedProcs.filter((p) => p.nivel >= 4);

          if (procsNivel1_2.length > 0)
            await DatabaseService.saveEstructuraProc(procsNivel1_2);
          if (procsNivel3.length > 0)
            await DatabaseService.saveEstructuraProc(procsNivel3);
          if (procsNivel4.length > 0)
            await DatabaseService.saveEstructuraProc(procsNivel4);
        } catch (e: any) {
          console.error("Error saving imported procs", e);
          showToast(
            `Error guardando importación en base de datos: ${e.message}`,
            "error",
          );
        }
      }

      if (dedupedProcs.length > 0) {
        setProcData((prev) => {
          const map = new Map(prev.map((p) => [p.id, p]));
          dedupedProcs
            .filter((d) => d.nivel === 1 || d.nivel === 2)
            .forEach((d) => map.set(d.id, d));
          return Array.from(map.values());
        });
        setPcdData((prev) => {
          const map = new Map(prev.map((p) => [p.id, p]));
          dedupedProcs
            .filter((d) => d.nivel === 3)
            .forEach((d) => map.set(d.id, d));
          return Array.from(map.values());
        });
        setActData((prev) => {
          const map = new Map(prev.map((p) => [p.id, p]));
          dedupedProcs
            .filter((d) => d.nivel >= 4)
            .forEach((d) => map.set(d.id, d));
          return Array.from(map.values());
        });
      }
      showToast(
        `Se importaron/actualizaron ${dedupedProcs.length} elementos de procesos.`,
        "success",
      );
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

      const allHeaders =
        nuevasRelaciones.length > 0 ? Object.keys(firstValidRow) : [];
      const orgKey =
        allHeaders.find(
          (k) =>
            k.toLowerCase().includes("org_dep") ||
            k.toLowerCase().includes("org") ||
            k.toLowerCase().includes("dependencia"),
        ) || allHeaders[0];
      const proKey =
        allHeaders.find(
          (k) =>
            k.toLowerCase().includes("pro_proc") ||
            k.toLowerCase().includes("proceso") ||
            k.toLowerCase().includes("procedimiento"),
        ) || allHeaders[1];

      const mappedRels: any[] = [];

      nuevasRelaciones.forEach((row) => {
        let parentIdRaw = String(
          row[orgKey] ?? row.IdNodoOrg ?? row.parentId ?? "",
        ).trim();
        let childIdRaw = String(
          row[proKey] ?? row.IdNodoProceso ?? row.childId ?? "",
        ).trim();

        if (!parentIdRaw || !childIdRaw) return;

        let trueParentId = parentIdRaw;
        const foundOrg = orgData.find(
          (o) => o.codigo === parentIdRaw || o.id === parentIdRaw,
        );
        const foundDep = depData.find(
          (d) => d.codigo === parentIdRaw || d.id === parentIdRaw,
        );
        if (foundOrg) trueParentId = foundOrg.id;
        else if (foundDep) trueParentId = foundDep.id;

        let trueChildId = childIdRaw;
        let childType = "Proceso";

        const foundProc = procData.find(
          (p) => p.codigo === childIdRaw || p.id === childIdRaw,
        );
        const foundPcd = pcdData.find(
          (p) => p.codigo === childIdRaw || p.id === childIdRaw,
        );
        const foundAct = actData.find(
          (a) => a.codigo === childIdRaw || a.id === childIdRaw,
        );

        if (foundProc) {
          trueChildId = foundProc.id;
          childType = "Proceso";
        } else if (foundPcd) {
          trueChildId = foundPcd.id;
          childType = "Procedimiento";
        } else if (foundAct) {
          trueChildId = foundAct.id;
          childType = "Actividad";
        } else {
          if (
            childIdRaw.startsWith("proc_") ||
            trueChildId.toLowerCase().includes("proceso")
          )
            childType = "Proceso";
          else if (
            childIdRaw.startsWith("pcd_") ||
            trueChildId.toLowerCase().includes("procedimiento")
          )
            childType = "Procedimiento";
          else if (
            childIdRaw.startsWith("act_") ||
            trueChildId.toLowerCase().includes("actividad")
          )
            childType = "Actividad";
        }

        mappedRels.push({
          type: childType,
          childId: trueChildId,
          parentId: trueParentId,
        });
      });

      const validRels = mappedRels.filter((r) => r.childId && r.parentId);

      if (validRels.length > 0) {
        try {
          const { DatabaseService } =
            await import("./application/services/DatabaseService");

          // Map to correct format before updating state to get right Vigencia
          validRels.forEach((newRel) => {
            newRel.vigenciaId = currentVigenciaView?.IdVigencia;
          });

          await DatabaseService.saveMapaRelaciones(validRels);
        } catch (e: any) {
          console.error("Error saving imported relaciones", e);
          showToast(
            `Error guardando exportación en base de datos: ${e.message}`,
            "error",
          );
        }
      }

      setRelaciones((prev) => {
        const combined = [...prev];
        validRels.forEach((newRel) => {
          const existing = combined.find(
            (r) =>
              r.childId === newRel.childId &&
              r.parentId === newRel.parentId &&
              r.vigenciaId === newRel.vigenciaId,
          );
          if (!existing) {
            combined.push(newRel);
          }
        });
        return combined;
      });

      showToast(`Se importaron relaciones correctamente.`, "success");
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
      // Logica estandar para todo: vincular el nodo directamente sin pseudo-relaciones
      if (
        !modifiedRelations.some(
          (r) =>
            r.type === childType &&
            r.childId === childId &&
            r.parentId === parentId &&
            r.vigenciaId === vigenciaId,
        )
      ) {
        const newRel = { type: childType, childId, parentId, vigenciaId };
        modifiedRelations.push(newRel);
        newRelations.push(newRel);
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
    import("./application/services/DatabaseService").then(
      ({ DatabaseService }) => {
        DatabaseService.saveMapaRelaciones(modifiedRelations).catch((e) => {
          console.error("Could not save mapped relations remotely", e);
          showToast(`Error guardando relaciones: ${e.message}`, "error");
        });
      },
    );

    // Obtenemos unicamente los que no fueron updates implicitos para los mensajes y ui logs
    const explicitNewRels = newRelations.filter((r) => !r.implicitUpdate);
    const linkIds = explicitNewRels.map(
      (r) => `link:${r.parentId}:${r.childId}`,
    );
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
      const isUnlinkingProceso = childType === "Proceso";

      const toDeleteChildIds: string[] = [childId];

      if (isUnlinkingProceso) {
        // If we are unlinking a pseudo Proceso connection, we should also delete all Procedimiento links under it
        const pcdsInProceso = pcdData
          .filter((p) => p.procesoId === childId)
          .map((p) => p.id);
        toDeleteChildIds.push(...pcdsInProceso);
      }

      const newRels = relaciones.filter(
        (r) =>
          !(
            (r.type === childType &&
              r.childId === childId &&
              r.parentId === parentId &&
              r.vigenciaId === currentVigenciaView?.IdVigencia) ||
            (isUnlinkingProceso &&
              r.type === "Procedimiento" &&
              toDeleteChildIds.includes(r.childId) &&
              r.parentId === parentId &&
              r.vigenciaId === currentVigenciaView?.IdVigencia)
          ),
      );
      setRelaciones(newRels);

      // Sync Delete in background
      if (currentVigenciaView?.IdVigencia) {
        import("./application/services/DatabaseService").then(
          ({ DatabaseService }) => {
            toDeleteChildIds.forEach((idToDelete) => {
              DatabaseService.deleteMapaRelacion(
                currentVigenciaView.IdVigencia,
                parentId,
                idToDelete,
              ).catch((e) => {
                console.error("Error al sincronizar borrado", e);
              });
            });
          },
        );
      }
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
    const changeToInactive = (item: any) =>
      item.id === id
        ? { ...item, Activo: false, activo: false, estado: "Inactivo" }
        : item;

    let updatedList: any[] = [];
    if (type === "Organismo") {
      itemName = orgData.find((o) => o.id === id)?.nombre || itemName;
      updatedList = orgData.map(changeToInactive);
    }
    if (type === "Dependencia") {
      itemName = depData.find((d) => d.id === id)?.nombre || itemName;
      updatedList = depData.map(changeToInactive);
    }
    if (type === "Proceso") {
      itemName = procData.find((p) => p.id === id)?.nombre || itemName;
      updatedList = procData.map(changeToInactive);
    }
    if (type === "Procedimiento") {
      itemName = pcdData.find((pc) => pc.id === id)?.nombre || itemName;
      updatedList = pcdData.map(changeToInactive);
    }
    if (type === "Actividad") {
      itemName = actData.find((a) => a.id === id)?.nombre || itemName;
      updatedList = actData.map(changeToInactive);
    }

    try {
      const { DatabaseService } =
        await import("./application/services/DatabaseService");
      if (type === "Organismo" || type === "Dependencia") {
        await DatabaseService.saveEstructuraOrg(updatedList);
      } else {
        await DatabaseService.saveEstructuraProc(updatedList);
      }

      // Only apply state updates if save succeeds
      if (type === "Organismo") setOrgData(updatedList);
      if (type === "Dependencia") setDepData(updatedList);
      if (type === "Proceso") setProcData(updatedList);
      if (type === "Procedimiento") setPcdData(updatedList);
      if (type === "Actividad") setActData(updatedList);
    } catch (e: any) {
      console.error("Could not save deletion to DB", e);
      showToast(`Error remoto al eliminar: ${e.message}`, "error");
      return; // DO NOT update state or show success toast if it fails
    }

    showToast(`${type} eliminado exitosamente.`, "success", {
      type,
      name: itemName,
      action: "eliminado",
    });
  };

  const handleDeleteStructure = (type: string, id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: `Eliminar ${type}`,
      message: `¿Está seguro de que desea eliminar este ${type}? El elemento se eliminará lógicamente para mantener la consistencia histórica, dejando de mostrarse en la estructura.`,
      confirmText: "Eliminar",
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
      if (customEvent.detail && typeof customEvent.detail === "string") {
        setActiveModule(customEvent.detail as Module);
      }
    };
    window.addEventListener("navigate-module", handleNavigate);
    return () => window.removeEventListener("navigate-module", handleNavigate);
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (!import.meta.env.VITE_SUPABASE_URL) {
      localStorage.setItem("mockSession", JSON.stringify(user));
    }
    setSelectedVigenciaId(null);
    if (!usuarios.find((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase())) {
      setUsuarios([...usuarios, user]);
    }

    // Auto-enroll the user into the current active vigencia if they aren't already enrolled
    const activeVigencia = vigencias.find((v) => v.Estado === "Activo");
    if (activeVigencia) {
      const alreadyEnrolled = vigenciasUsuarios.some(
        (vu) =>
          vu.idUsuario === user.id &&
          vu.idVigencia === activeVigencia.IdVigencia,
      );
      if (!alreadyEnrolled) {
        // Admins retain their global roles in the vigencia so they don't get locked out
        const isAdmin =
          user.rol === "AdminFuncional" || user.rol === "Administrador";

        const newVu: any = {
          idVigenciaUsuario: `VU-${user.id}-${activeVigencia.IdVigencia}-${Date.now()}`,
          idVigencia: activeVigencia.IdVigencia,
          idUsuario: user.id,
          rol: isAdmin ? user.rol : "Funcionario",
          idDependencia: "",
        };
        setVigenciasUsuarios((prev) => [...prev, newVu]);

        import("./application/services/DatabaseService").then(
          ({ DatabaseService }) => {
            DatabaseService.saveUsuarioDependencia({
              IdUsuarioDep: newVu.idVigenciaUsuario,
              IdVigencia: newVu.idVigencia,
              EntraIdObjectId: newVu.idUsuario,
              IdNodoOrg: newVu.idDependencia || null,
              RolFuncional: newVu.rol,
              UPN: user.email,
              Activo: true,
            }).catch((e: any) => {
              console.error("Failed to save auto-enrollment to DB", e);
            });
          },
        );
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
    localStorage.removeItem("mockSession");
    const { supabase } = await import("./lib/supabaseClient");
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 relative z-50">
        <div className="w-12 h-12 border-4 border-institutional-blue/20 border-t-institutional-blue rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium text-slate-500 animate-pulse">
          Sincronizando información del sistema...
        </p>
      </div>
    );
  }

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

      <SelectOrganismoModal
        isOpen={mustSelectOrganismo}
        onSave={handleSelectOrganismo}
        organismos={currentOrgData}
        dependencias={currentDepData}
        relaciones={uiRelaciones}
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
              {activeModule === "inicio" && <InicioModule />}
              {activeModule === "captura" && (
                <CapturaModule
                  currentUser={effectiveUser!}
                  organismos={currentOrgData}
                  dependencias={currentDepData}
                  procesos={currentProcData}
                  procedimientos={currentPcdData}
                  actividades={currentActData}
                  cargas={currentCargas}
                  cargos={cargos}
                  factores={factoresFrecuencia}
                  vigenciaActiva={currentVigenciaView?.Estado === "Activo"}
                  relaciones={uiRelaciones}
                  onSave={handleSaveCarga}
                  onDelete={handleDeleteCarga}
                  isLoadingRecords={isLoadingRecords}
                />
              )}
              {activeModule === "estructura" && (
                <EstructuraModule
                  hasVigencia={!!currentVigenciaId}
                  isReadOnly={
                    effectiveUser?.rol === "Funcionario" ||
                    effectiveUser?.rol === "Analista"
                  }
                  organismos={currentOrgData}
                  dependencias={currentDepData}
                  procesos={currentProcData}
                  procedimientos={currentPcdData}
                  actividades={currentActData}
                  vigenciaActiva={
                    currentVigenciaView?.Estado === "Activo" ||
                    currentVigenciaView?.Estado === "Borrador"
                  }
                  relaciones={uiRelaciones}
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
                  currentUser={effectiveUser!}
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
                  currentUser={effectiveUser!}
                />
              )}
              {activeModule === "admin" && (
                <AdminModule
                  isLoadingRecords={isLoadingRecords}
                  showToast={showToast}
                  cargas={currentCargas}
                  cargos={cargos}
                  factores={factoresFrecuencia}
                  onSaveCargo={async (c) => {
                    const { DatabaseService } =
                      await import("./application/services/DatabaseService");
                    try {
                      const saved = await DatabaseService.saveCargo(c);
                      setCargos((prev) =>
                        prev
                          .map((x) => (x.IdCargo === saved.IdCargo ? saved : x))
                          .concat(
                            prev.find((x) => x.IdCargo === saved.IdCargo)
                              ? []
                              : [saved],
                          ),
                      );
                      showToast("Rol guardado exitosamente", "success");
                    } catch (e: any) {
                      showToast(e.message || "Error al guardar el rol", "error");
                    }
                  }}
                  onDeleteCargo={async (id) => {
                    const { DatabaseService } =
                      await import("./application/services/DatabaseService");
                    await DatabaseService.deleteCargo(id);
                    setCargos((prev) => prev.filter((x) => x.IdCargo !== id));
                  }}
                  onSaveFactor={async (f) => {
                    const { DatabaseService } =
                      await import("./application/services/DatabaseService");
                    try {
                      const saved = await DatabaseService.saveFactorFrecuencia(f);
                      setFactoresFrecuencia((prev) =>
                        prev
                          .map((x) => (x.IdFactor === saved.IdFactor ? saved : x))
                          .concat(
                            prev.find((x) => x.IdFactor === saved.IdFactor)
                              ? []
                              : [saved],
                          ),
                      );
                      showToast("Factor de frecuencia guardado exitosamente", "success");
                    } catch (e: any) {
                      showToast(e.message || "Error al guardar factor de frecuencia", "error");
                    }
                  }}
                  onDeleteFactor={async (id) => {
                    const { DatabaseService } =
                      await import("./application/services/DatabaseService");
                    await DatabaseService.deleteFactorFrecuencia(id);
                    setFactoresFrecuencia((prev) =>
                      prev.filter((x) => x.IdFactor !== id),
                    );
                  }}
                  onReorderCargos={(newCargos) => {
                     setCargos(newCargos);
                     const orderMap = newCargos.reduce((acc: any, c: any, i: number) => { acc[c.IdCargo] = i; return acc; }, {});
                     localStorage.setItem('cargos_order', JSON.stringify(orderMap));
                  }}
                  onReorderFactores={(newFactores) => {
                     setFactoresFrecuencia(newFactores);
                     const orderMap = newFactores.reduce((acc: any, f: any, i: number) => { acc[f.IdFactor] = i; return acc; }, {});
                     localStorage.setItem('factores_order', JSON.stringify(orderMap));
                  }}
                  currentUser={effectiveUser!}
                  onUpdate={handleUpdateCarga}
                  onDelete={handleDeleteCarga}
                  organismos={currentOrgData}
                  dependencias={currentDepData}
                  actividades={currentActData}
                  procesos={currentProcData}
                  procedimientos={currentPcdData}
                  vigencias={availableVigencias}
                  vigenciaActiva={currentVigenciaView?.Estado === "Activo"}
                  onVigenciaUpdate={async (v) => {
                    let finalVigencias = [...vigencias];
                    finalVigencias = finalVigencias.map((vig) =>
                      vig.IdVigencia === v.IdVigencia ? v : vig,
                    );
                    setVigencias(finalVigencias);

                    try {
                      const { DatabaseService } =
                        await import("./application/services/DatabaseService");
                      await DatabaseService.saveVigencia(v);
                      showToast(
                        "Vigencia y parámetros actualizados en la base de datos",
                        "success",
                      );
                    } catch (e) {
                      showToast(
                        "Datos actualizados localmente. Error en red.",
                        "success",
                      );
                    }
                  }}
                  onVigenciaCreate={handleCreateVigencia}
                  usuarios={usuarios}
                  vigenciasUsuarios={vigenciasUsuarios}
                  onUpdateVigenciaUsuario={async (vu) => {
                    const isGlobalAdmin = vu.rol === "Administrador" || vu.rol === "AdminFuncional";
                    let effectiveDepId = vu.idDependencia;
                    
                    if (isGlobalAdmin) {
                      effectiveDepId = ''; 
                    }
                    
                    const safeVu = { ...vu, idDependencia: effectiveDepId };

                    const exists = vigenciasUsuarios.find(
                      (x) => x.idUsuario === safeVu.idUsuario && String(x.idVigencia) === String(safeVu.idVigencia),
                    );
                    
                    const optimisticallyUpdated = exists 
                      ? vigenciasUsuarios.map(x => (x.idUsuario === safeVu.idUsuario && String(x.idVigencia) === String(safeVu.idVigencia)) ? safeVu : x)
                      : [...vigenciasUsuarios, safeVu];
                      
                    setVigenciasUsuarios(optimisticallyUpdated);

                    try {
                      const { DatabaseService } = await import("./application/services/DatabaseService");
                      const result = await DatabaseService.saveUsuarioDependencia({
                        IdUsuarioDep: exists ? exists.idVigenciaUsuario : safeVu.idVigenciaUsuario,
                        IdVigencia: safeVu.idVigencia,
                        EntraIdObjectId: safeVu.idUsuario,
                        IdNodoOrg: safeVu.idDependencia,
                        RolFuncional: safeVu.rol,
                        Activo: true,
                        UPN: usuarios.find(u => u.id === safeVu.idUsuario)?.email
                      });
                      
                      // Refresh front-end with the actual IDs from the DB
                      if (result && result.IdUsuarioDep) {
                        setVigenciasUsuarios(prev => prev.map(x => 
                           (x.idUsuario === safeVu.idUsuario && String(x.idVigencia) === String(safeVu.idVigencia))
                           ? { ...safeVu, idVigenciaUsuario: result.IdUsuarioDep }
                           : x
                        ));
                      }
                      
                      showToast("Asignación de usuario guardada", "success");
                    } catch (e: any) {
                      const isCheck = e?.message?.includes("violate");
                      if (isCheck) {
                         showToast("Combinación inválida de rol y organismo según las reglas del sistema.", "error");
                      } else {
                         showToast("Error de red al guardar asignación", "error");
                      }
                    }
                  }}
                  onUpdateUsuario={async (user) => {
                    const safeRol = user.rol || "Funcionario";
                    const isGlobalAdmin = safeRol === "Administrador" || safeRol === "AdminFuncional";
                    
                    let effectiveDepId = user.dependenciaId;
                    
                    if (isGlobalAdmin) {
                      effectiveDepId = ''; // force null basically
                    }

                    // Update state optimistically
                    setUsuarios(
                      usuarios.map((u) => (u.id === user.id ? { ...user, dependenciaId: effectiveDepId } : u))
                    );

                    // Sync global role to all of their vigencias
                    const userRelations = vigenciasUsuarios.filter(vu => vu.idUsuario === user.id);
                    try {
                      const { DatabaseService } = await import("./application/services/DatabaseService");
                      if (userRelations.length > 0) {
                         await Promise.all(userRelations.map(vu => 
                            DatabaseService.saveUsuarioDependencia({
                              IdUsuarioDep: vu.idVigenciaUsuario,
                              IdVigencia: vu.idVigencia,
                              EntraIdObjectId: vu.idUsuario,
                              IdNodoOrg: effectiveDepId !== undefined ? effectiveDepId : vu.idDependencia,
                              RolFuncional: safeRol, // The new global role
                              Activo: true,
                              UPN: user.email
                            })
                         ));
                         setVigenciasUsuarios(prev => prev.map(vu => vu.idUsuario === user.id ? { ...vu, rol: safeRol, idDependencia: effectiveDepId !== undefined ? effectiveDepId : vu.idDependencia } : vu));
                      } else if (currentVigenciaView) {
                         // No relations, but we need to save the role to DB. We insert a dummy record in the active vigencia with no dependency.
                         const newRel = await DatabaseService.saveUsuarioDependencia({
                           IdVigencia: currentVigenciaView.IdVigencia,
                           EntraIdObjectId: user.id,
                           IdNodoOrg: effectiveDepId || null,
                           RolFuncional: safeRol,
                           Activo: true,
                           UPN: user.email
                         });
                         
                         if (newRel) {
                           setVigenciasUsuarios(prev => [...prev, {
                             idVigenciaUsuario: newRel.IdUsuarioDep,
                             idVigencia: currentVigenciaView.IdVigencia,
                             idUsuario: user.id,
                             idDependencia: effectiveDepId || null,
                             rol: safeRol
                           }]);
                         }
                      } else {
                         // Cannot persist role if no vigencia exists and no fallback schema exists.
                         showToast("No se puede persistir el rol sin una vigencia activa", "error");
                         return;
                      }
                      showToast("Usuario actualizado en la plataforma", "success");
                    } catch (e) {
                      console.error("Failed to sync global role", e);
                      showToast("Error al guardar cambios de rol o dependencia", "error");
                      // Optionally, trigger a refresh here if we wanted to revert optimistic UI
                    }
                  }}
                  onAddUsuario={async (user) => {
                    const safeRol = user.rol || "Funcionario";
                    const isGlobalAdmin = safeRol === "Administrador" || safeRol === "AdminFuncional";
                    let effectiveDepId = user.dependenciaId;
                    
                    if (isGlobalAdmin) {
                      effectiveDepId = ''; 
                    }

                    if (!usuarios.some((u) => u.email.toLowerCase() === user.email.toLowerCase())) {
                       const userToAdd = { ...user, dependenciaId: effectiveDepId, rol: safeRol };
                       setUsuarios([userToAdd, ...usuarios]);
                       try {
                         const { DatabaseService } = await import("./application/services/DatabaseService");
                         if (currentVigenciaView) {
                             const newRel = await DatabaseService.saveUsuarioDependencia({
                               IdVigencia: currentVigenciaView.IdVigencia,
                               EntraIdObjectId: user.id,
                               IdNodoOrg: effectiveDepId || null,
                               RolFuncional: safeRol,
                               Activo: true,
                               UPN: user.email
                             });
                             
                             if (newRel) {
                               setVigenciasUsuarios(prev => [...prev, {
                                 idVigenciaUsuario: newRel.IdUsuarioDep,
                                 idVigencia: currentVigenciaView.IdVigencia,
                                 idUsuario: user.id,
                                 idDependencia: effectiveDepId || null,
                                 rol: safeRol
                               }]);
                             }
                         }
                         showToast("Usuario creado en el sistema", "success");
                       } catch (e: any) {
                         const isCheck = e?.message?.includes("violate");
                         if (isCheck) {
                           showToast("El usuario fue creado, pero la combinación de rol y organismo es inválida según reglas del sistema.", "error");     
                         } else {
                           showToast("Usuario creado, pero hubo un error de red al persistirlo.", "error");
                         }
                       }
                    } else {
                       showToast("El usuario ya existe en otra fuente o en el sistema", "error");
                    }
                  }}
                  onRestoreMockData={async () => {
                    try {
                      if (!currentVigenciaView) {
                        showToast(
                          "Debe haber una vigencia activa para generar datos",
                          "error",
                        );
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
                        showToast(
                          "Debe existir una estructura (con actividades) y mapas de relación",
                          "error",
                        );
                        return;
                      }

                      const nivelesEjecutor = [
                        "Directivo",
                        "Asesor",
                        "Profesional",
                        "Tecnico",
                        "Asistencial",
                      ];
                      const frecuencias = [
                        "Diaria",
                        "Semanal",
                        "Quincenal",
                        "Mensual",
                        "Bimestral",
                        "Trimestral",
                        "Semestral",
                        "Anual",
                      ];
                      const timeUnits: ("minutos" | "horas" | "dias")[] = [
                        "minutos",
                        "minutos",
                        "horas",
                      ];

                      // Pre-generate some mock users representing "Funcionarios"
                      const mockUsers = Array.from({ length: 20 }).map(
                        (_, i) => {
                          const randomOrgId =
                            validOrgs[
                              Math.floor(Math.random() * validOrgs.length)
                            ]?.id || "ORG-FALLBACK";
                          return {
                            id: `USR-MOCK-${i + 1}`,
                            nombre: `Funcionario ${i + 1}`,
                            rol: "Funcionario" as const,
                            email: `funcionario${i + 1}@ejemplo.com`,
                            organismoId: randomOrgId,
                          };
                        },
                      );

                      // We will simulate the Captura UI to generate all truly valid paths.
                      const validPaths: {
                        orgId: string;
                        depId: string;
                        procId: string;
                        pcdId: string;
                        actId: string;
                      }[] = [];

                      const getAllDescendantDependencias = (
                        parentId: string,
                      ): string[] => {
                        const direct = validDeps
                          .filter((d) => d.parentId === parentId)
                          .map((d) => d.id);
                        const linked = validRelaciones
                          .filter(
                            (r) =>
                              r.type === "Dependencia" &&
                              r.parentId === parentId,
                          )
                          .map((r) => r.childId);
                        const combined = Array.from(
                          new Set([...direct, ...linked]),
                        );

                        let all = [...combined];
                        combined.forEach((id) => {
                          all = [...all, ...getAllDescendantDependencias(id)];
                        });
                        return all;
                      };

                      for (const org of validOrgs) {
                        const availableDeps = getAllDescendantDependencias(
                          org.id,
                        );
                        const filteredDeps = validDeps.filter((d) =>
                          availableDeps.includes(d.id),
                        );

                        for (const dep of filteredDeps) {
                          const filteredProcesos = validProcs.filter(
                            (p) =>
                              p.dependenciaId === dep.id ||
                              p.dependenciaId === org.id ||
                              validRelaciones.some(
                                (r) =>
                                  r.type === "Proceso" &&
                                  r.childId === p.id &&
                                  (r.parentId === dep.id ||
                                    r.parentId === org.id),
                              ),
                          );

                          for (const proc of filteredProcesos) {
                            let currProcs = validPcds.filter(
                              (pc) =>
                                pc.procesoId === proc.id ||
                                validRelaciones.some(
                                  (r) =>
                                    r.type === "Procedimiento" &&
                                    r.childId === pc.id &&
                                    r.parentId === proc.id,
                                ) ||
                                validRelaciones.some(
                                  (r) =>
                                    r.type === "Procedimiento" &&
                                    r.childId === pc.id &&
                                    r.parentId === dep.id,
                                ) ||
                                validRelaciones.some(
                                  (r) =>
                                    r.type === "Procedimiento" &&
                                    r.childId === pc.id &&
                                    r.parentId === org.id,
                                ),
                            );

                            const procRelation = validRelaciones.find(
                              (r) =>
                                r.type === "Proceso" &&
                                r.childId === proc.id &&
                                (r.parentId === dep.id ||
                                  r.parentId === org.id),
                            );
                            if (procRelation?.includedChildren?.length) {
                              currProcs = currProcs.filter((pc) =>
                                procRelation.includedChildren!.includes(pc.id),
                              );
                            }

                            for (const pcd of currProcs) {
                              let currActs = validActs.filter(
                                (a) =>
                                  a.procedimientoId === pcd.id ||
                                  validRelaciones.some(
                                    (r) =>
                                      r.type === "Actividad" &&
                                      r.childId === a.id &&
                                      r.parentId === pcd.id,
                                  ),
                              );

                              const pcdRelation = validRelaciones.find(
                                (r) =>
                                  r.type === "Procedimiento" &&
                                  r.childId === pcd.id &&
                                  r.parentId === proc.id,
                              );
                              if (pcdRelation?.includedChildren?.length) {
                                currActs = currActs.filter((a) =>
                                  pcdRelation.includedChildren!.includes(a.id),
                                );
                              }

                              for (const act of currActs) {
                                validPaths.push({
                                  orgId: org.id,
                                  depId: dep.id,
                                  procId: proc.id,
                                  pcdId: pcd.id,
                                  actId: act.id,
                                });
                              }
                            }
                          }
                        }
                      }

                      if (validPaths.length === 0) {
                        showToast(
                          "La estructura de datos provista no contiene rutas completas válidas (Organismo -> Dependencia -> Proceso -> ...). Por favor verifica los mapas de relación.",
                          "error",
                        );
                        return;
                      }

                      for (let i = 0; i < sampleCount; i++) {
                        const selectedPath =
                          validPaths[
                            Math.floor(Math.random() * validPaths.length)
                          ];

                        const sysRol = "Funcionario";
                        const lvlEjecutor =
                          nivelesEjecutor[
                            Math.floor(Math.random() * nivelesEjecutor.length)
                          ];
                        const tNormal = Math.floor(Math.random() * 60) + 10;
                        const randomlySelectedUser =
                          mockUsers[
                            Math.floor(Math.random() * mockUsers.length)
                          ];

                        generatedCargas.push({
                          id: crypto.randomUUID(),
                          vigenciaId: currentVigenciaView.IdVigencia,
                          organismoId: selectedPath.orgId,
                          dependenciaId: selectedPath.depId,
                          procesoId: selectedPath.procId,
                          procedimientoId: selectedPath.pcdId,
                          actividadId: selectedPath.actId,
                          tiempoMin: Math.max(
                            1,
                            tNormal - Math.floor(Math.random() * 10),
                          ),
                          tiempoNormal: tNormal,
                          tiempoMax:
                            tNormal + Math.floor(Math.random() * 15) + 5,
                          volumenQ: Math.floor(Math.random() * 50) + 1,
                          unidadTiempo:
                            timeUnits[
                              Math.floor(Math.random() * timeUnits.length)
                            ],
                          frecuencia:
                            frecuencias[
                              Math.floor(Math.random() * frecuencias.length)
                            ],
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
                        showToast(
                          "No se pudieron generar datos. Verifica los mapas de relación.",
                          "error",
                        );
                        return;
                      }

                      // Check which mockUsers were actually used, or just append all
                      const newMockUsers = mockUsers.filter(
                        (mu) => !usuarios.some((u) => u.id === mu.id),
                      );
                      if (newMockUsers.length > 0) {
                        setUsuarios([...usuarios, ...newMockUsers]);
                      }

                      const { del } = await import("idb-keyval");
                      await del("sdmct_cargas_trabajo");
                      const { captureService } =
                        await import("./application/services/captureService");
                      await captureService.initialize();
                      setCargasTrabajo(generatedCargas);
                      showToast(
                        `Generadas ${generatedCargas.length} cargas de trabajo correctamente asociadas.`,
                        "success",
                      );
                    } catch (error) {
                      console.error(error);
                      showToast("Error generando datos de prueba", "error");
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
