import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, FolderTree, Network, ClipboardEdit, CheckCircle2, 
  ChevronRight, ChevronDown, Plus, Edit2, Trash2, Link2, Unlink, 
  Search, AlertTriangle, FileText, BarChart3, X, Settings2
} from 'lucide-react';
import { Organismo, Dependencia, Proceso, Procedimiento, Actividad } from '../../domain/models/types';
import { LinkElementModal } from '../components/LinkElementModal';
import { CreateElementModal } from '../components/CreateElementModal';

interface EstructuraModuleProps {
  organismos: Organismo[];
  dependencias: Dependencia[];
  procesos: Proceso[];
  procedimientos: Procedimiento[];
  actividades: Actividad[];
  relaciones: {type: string, childId: string, parentId: string, includedChildren?: string[]}[];
  hiddenPaths?: string[];
  focusElement?: { id: string, parentId?: string, action?: string, multipleIds?: string[] };
  recentlyModifiedIds?: string[];
  onClearModifiedId?: (id: string) => void;
  onDelete: (type: string, id: string) => void;
  onSave: (type: string, data: any, mode: 'create' | 'edit', id?: string) => void;
  onLink: (childType: string, childIds: string[], parentId: string) => void;
  onUnlink: (childType: string, childId: string, parentId: string, isLinked: boolean, path: string) => void;
  onImportOrganizacion?: (data: any[]) => void;
  onImportProcesos?: (data: any[]) => void;
  onImportRelaciones?: (nuevasRelaciones: any[]) => void;
  vigenciaActiva?: boolean;
  isReadOnly?: boolean;
  hasVigencia?: boolean;
}

export const EstructuraModule: React.FC<EstructuraModuleProps> = ({ 
  organismos, dependencias, procesos, procedimientos, actividades, relaciones, hiddenPaths = [],
  focusElement, recentlyModifiedIds = [], onClearModifiedId, onDelete, onSave, onLink, onUnlink, onImportOrganizacion, onImportProcesos, onImportRelaciones, vigenciaActiva = true, isReadOnly = false, hasVigencia = true
}) => {
  const [selectedNode, setSelectedNode] = useState<{ type: string, id: string, path?: string, parentId?: string, isLinked?: boolean } | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, Set<string>>>({
    general: new Set(),
    organizacional: new Set(),
    procedimental: new Set()
  });
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [linkModalConfig, setLinkModalConfig] = useState<{ isOpen: boolean, parentType: string, parentId: string, childType: string } | null>(null);
  const [createModalConfig, setCreateModalConfig] = useState<{ 
    isOpen: boolean, 
    type: string, 
    parentId?: string, 
    parentName?: string,
    parentType?: string,
    initialData?: any, 
    mode: 'create' | 'edit' 
  }>({ isOpen: false, type: '', mode: 'create' });
  const [viewMode, setViewMode] = useState<'general' | 'organizacional' | 'procedimental'>('general');

  const [importStatus, setImportStatus] = useState<{
    isOpen: boolean;
    step: 'Lectura de archivo' | 'Validando estructura' | 'Inyectando a base de datos' | 'Completado';
    type: string;
    fileName: string;
    totalRows: number;
    processedRows: number;
    error?: string;
  }>({
    isOpen: false,
    step: 'Lectura de archivo',
    type: '',
    fileName: '',
    totalRows: 0,
    processedRows: 0
  });

  const [showRelationTypeModal, setShowRelationTypeModal] = useState(false);

  const recentlyModifiedSet = new Set(recentlyModifiedIds);

  // Helper to find the base path to an element
  const getBasePath = (targetId: string, targetParentId?: string, targetViewMode: string = 'general'): string | null => {
    // If it's a link action, we want the path to the parent, then append the targetId
    if (targetParentId) {
      const parentPath = getBasePath(targetParentId, undefined, targetViewMode);
      if (parentPath) return `${parentPath}/${targetId}`;
    }

    let currentId: string | null = targetId;
    const pathParts = [];
    const visited = new Set();
    
    while (currentId) {
      if (visited.has(currentId)) break;
      visited.add(currentId);
      pathParts.unshift(currentId);
      
      let parentId: string | null = null;
      const act = actividades.find(a => a.id === currentId);
      if (act) parentId = act.procedimientoId;
      else {
        const pcd = procedimientos.find(p => p.id === currentId);
        if (pcd) parentId = pcd.procesoId;
        else {
          const proc = procesos.find(p => p.id === currentId);
          if (proc) {
            // In procedimental view, Proceso is the root
            if (targetViewMode === 'procedimental') {
              parentId = null;
            } else {
              parentId = proc.dependenciaId;
            }
          }
          else {
            const dep = dependencias.find(d => d.id === currentId);
            if (dep) parentId = dep.parentId || null;
            else {
              const org = organismos.find(o => o.id === currentId);
              if (org) parentId = org.parentId || null;
            }
          }
        }
      }
      currentId = parentId;
    }
    
    return pathParts.length > 0 ? pathParts.join('/') : null;
  };

  React.useEffect(() => {
    if (focusElement) {
      // Find type
      let type = 'Elemento';
      if (organismos.some(o => o.id === focusElement.id)) type = 'Organismo';
      else if (dependencias.some(d => d.id === focusElement.id)) type = 'Dependencia';
      else if (procesos.some(p => p.id === focusElement.id)) type = 'Proceso';
      else if (procedimientos.some(p => p.id === focusElement.id)) type = 'Procedimiento';
      else if (actividades.some(a => a.id === focusElement.id)) type = 'Actividad';

      // Determine target view mode
      let targetViewMode: 'general' | 'organizacional' | 'procedimental' = 'general';
      if (focusElement.action === 'vinculado' || focusElement.action === 'desvinculado' || focusElement.action === 'vinculados') {
        targetViewMode = 'general';
      } else {
        if (type === 'Organismo' || type === 'Dependencia') targetViewMode = 'organizacional';
        else if (type === 'Proceso' || type === 'Procedimiento' || type === 'Actividad') targetViewMode = 'procedimental';
      }

      // If it's a link action, we use the parentId to build the path
      const path = getBasePath(focusElement.id, (focusElement.action === 'vinculado' || focusElement.action === 'vinculados') ? focusElement.parentId : undefined, targetViewMode);
      
      if (path) {
        setViewMode(targetViewMode);
        
        // Expand all parents in the correct view mode
        const pathParts = path.split('/');
        const newExpanded = new Set(expandedNodes[targetViewMode]);
        let currentPath = '';
        for (let i = 0; i < pathParts.length - 1; i++) {
          currentPath = currentPath ? `${currentPath}/${pathParts[i]}` : pathParts[i];
          newExpanded.add(currentPath);
        }
        setExpandedNodes(prev => ({ ...prev, [targetViewMode]: newExpanded }));
        
        setSelectedNode({ type, id: focusElement.id, path });
        
        // Scroll to element after a short delay to allow rendering
        setTimeout(() => {
          const el = document.getElementById(`row-${path}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    }
  }, [focusElement]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Do not deselect if clicking inside a row, the details panel, the header notification buttons, or modals
      if (
        !target.closest('.estructura-row') &&
        !target.closest('.estructura-panel') &&
        !target.closest('.modal-content') &&
        !target.closest('header') // let's clear on header clicks unless it's a notification button. Actually, the user asked to clear when clicking the header.
      ) {
        // We actually want to clear on header clicks, but NOT if clicking the notification "Ver en Estructura" button, which triggers navigation.
        // Let's protect elements with data-no-deselect
        if (!target.closest('[data-no-deselect="true"]')) {
          setSelectedNode(null);
        }
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  const handleClearSelection = (e: React.MouseEvent) => {
    // Kept for direct container clicks
    setSelectedNode(null);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<string | null>(null);

  const simulateUpload = (type: string) => {
    setUploadType(type);
    setShowAddMenu(false);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !uploadType) return;
    
    setIsUploading(true);
    setImportStatus({
      isOpen: true,
      step: 'Lectura de archivo',
      type: uploadType,
      fileName: file.name,
      totalRows: 0,
      processedRows: 0
    });
    
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);
      
      const worksheet = workbook.worksheets[0];
      const rows: any[] = [];
      let headers: string[] = [];

      worksheet.eachRow((row, rowNumber) => {
         const rowData = Array.isArray(row.values) ? row.values.slice(1) : (row.values as unknown as any[]);
         
         if (rowNumber === 1) {
           headers = rowData.map(h => (h ? String(h).trim() : `Col${Math.random()}`));
         } else {
           const rowObj: any = {};
           rowData.forEach((val, index) => {
             if (headers[index]) {
               rowObj[headers[index]] = val;
             }
           });
           rows.push(rowObj);
         }
      });

      setImportStatus(prev => ({ ...prev, step: 'Validando estructura', totalRows: rows.length }));
      
      // Simulate validation latency
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setImportStatus(prev => ({ ...prev, step: 'Inyectando a base de datos' }));

      // Simulate step by step processing for UX
      for(let i = 0; i <= rows.length; i += Math.max(1, Math.floor(rows.length / 10))) {
        setImportStatus(prev => ({ ...prev, processedRows: Math.min(i, rows.length) }));
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (uploadType === 'Organización' && onImportOrganizacion) {
        onImportOrganizacion(rows);
      } else if (uploadType === 'Procesos' && onImportProcesos) {
        onImportProcesos(rows);
      } else if (uploadType === 'Relaciones' && onImportRelaciones) {
        onImportRelaciones(rows);
      }

      setImportStatus(prev => ({ ...prev, step: 'Completado', processedRows: rows.length }));
      
      // Auto close after 2 seconds
      setTimeout(() => {
        setImportStatus(prev => ({ ...prev, isOpen: false }));
      }, 2000);

    } catch(err) {
      console.error(err);
      setImportStatus(prev => ({ ...prev, error: 'Error leyendo el archivo Excel. Asegúrese de que es un archivo .xlsx válido.' }));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setUploadType(null);
    }
  };

  const handleNodeClick = (type: string, id: string, path: string, parentId?: string, isLinked?: boolean) => {
    setSelectedNode({ type, id, path, parentId, isLinked });
    
    if (recentlyModifiedSet.has(id) && onClearModifiedId) {
      onClearModifiedId(id);
    }
    if (parentId && recentlyModifiedSet.has(`link:${parentId}:${id}`) && onClearModifiedId) {
      onClearModifiedId(`link:${parentId}:${id}`);
    }
  };

  const handleViewModeChange = (mode: 'general' | 'organizacional' | 'procedimental') => {
    setViewMode(mode);
    setSelectedNode(null); // Clear selection when changing views
  };

  const toggleExpand = (path: string) => {
    const newExpanded = new Set(expandedNodes[viewMode]);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
      // Close all descendants when a node is closed
      newExpanded.forEach(expandedId => {
        if (expandedId.startsWith(`${path}/`)) {
          newExpanded.delete(expandedId);
        }
      });
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes({ ...expandedNodes, [viewMode]: newExpanded });
  };

  const { childrenGraph, targetCountCache } = React.useMemo(() => {
    const graph = new Map<string, {id: string, type: string}[]>();
    
    // Helper to add edges
    const addEdge = (parentId: string, childId: string, childType: string) => {
      if (!graph.has(parentId)) graph.set(parentId, []);
      graph.get(parentId)!.push({id: childId, type: childType});
    };

    if (viewMode === 'organizacional' || viewMode === 'general') {
       organismos.forEach(o => { if (o.parentId && o.estado !== 'Inactivo') addEdge(o.parentId, o.id, 'Organismo'); });
       dependencias.forEach(d => { if (d.parentId && d.estado !== 'Inactivo') addEdge(d.parentId, d.id, 'Dependencia'); });
    }
    if (viewMode === 'general') {
       procesos.forEach(p => { if (p.dependenciaId && p.estado !== 'Inactivo') addEdge(p.dependenciaId, p.id, 'Proceso'); });
    }
    if (viewMode === 'procedimental' || viewMode === 'general') {
       procedimientos.forEach(p => { if (p.procesoId && p.estado !== 'Inactivo') addEdge(p.procesoId, p.id, 'Procedimiento'); });
       actividades.forEach(a => { if (a.procedimientoId && a.estado !== 'Inactivo') addEdge(a.procedimientoId, a.id, 'Actividad'); });
    }
    if (viewMode === 'general') {
       relaciones.forEach(r => addEdge(r.parentId, r.childId, r.type));
    }

    const tCache = new Map<string, number>();
    return { childrenGraph: graph, targetCountCache: tCache };
  }, [viewMode, organismos, dependencias, procesos, procedimientos, actividades, relaciones]);

  const getRecursiveTargetCountFast = React.useCallback((nodeId: string, nodeType: string) => {
    const cacheKey = `${nodeId}-${nodeType}`;
    if (targetCountCache.has(cacheKey)) return targetCountCache.get(cacheKey)!;
    
    let count = 0;
    let visited = new Set<string>();

    const traverse = (currentId: string) => {
      if (visited.has(currentId)) return;
      visited.add(currentId);
      
      const children = childrenGraph.get(currentId) || [];
      
      const uniqueChildren = new Map();
      children.forEach(c => uniqueChildren.set(c.id, c));
      
      uniqueChildren.forEach(c => {
         if (
           (nodeType === 'Organismo' && c.type === 'Dependencia') ||
           (nodeType === 'Dependencia' && c.type === 'Proceso') ||
           (nodeType === 'Proceso' && c.type === 'Procedimiento') ||
           (nodeType === 'Procedimiento' && c.type === 'Actividad')
         ) {
           count++;
         }
         traverse(c.id);
      });
    };
    
    traverse(nodeId);
    targetCountCache.set(cacheKey, count);
    return count;
  }, [childrenGraph, targetCountCache]);

  const displayRows = React.useMemo(() => {
    const rows: any[] = [];
    
    const addChildrenRecursive = (parentId: string | null, level: number, currentPath: string, parentType: string | null, allowedChildren?: string[]) => {
      let baseChildren: any[] = [];

      if (parentType === null) {
        // Root level: Organismos with no parentId
        baseChildren = organismos.filter(o => !o.parentId).map(o => ({ ...o, type: 'Organismo', isLinked: false }));
      } else if (parentType === 'Organismo') {
        // Children of Organismo: Dependencias then Sub-Organismos
        const subOrgs = organismos.filter(o => o.parentId === parentId).map(o => ({ ...o, type: 'Organismo', isLinked: false }));
        const deps = dependencias.filter(d => d.parentId === parentId).map(d => ({ ...d, type: 'Dependencia', isLinked: false }));
        baseChildren = [...deps, ...subOrgs];
      } else if (parentType === 'Dependencia') {
        // Children of Dependencia: Procesos then Sub-Dependencias
        const subDeps = dependencias.filter(d => d.parentId === parentId).map(d => ({ ...d, type: 'Dependencia', isLinked: false }));
        const procs = procesos.filter(p => p.dependenciaId === parentId || (viewMode === 'general' && p.procesoId === parentId)).map(p => ({ ...p, type: 'Proceso', isLinked: false }));
        baseChildren = [...procs, ...subDeps];
      } else if (parentType === 'Proceso') {
        // Children of Proceso: Sub-Procesos then Procedimientos
        const subProcs = procesos.filter(p => p.procesoId === parentId).map(p => ({ ...p, type: 'Proceso', isLinked: false }));
        const pcds = procedimientos.filter(pcd => pcd.procesoId === parentId).map(pcd => ({ ...pcd, type: 'Procedimiento', isLinked: false }));
        baseChildren = [...subProcs, ...pcds];
      } else if (parentType === 'Procedimiento') {
        // Children of Procedimiento: Actividades
        baseChildren = actividades.filter(act => act.procedimientoId === parentId).map(act => ({ ...act, type: 'Actividad', isLinked: false }));
      }

      // Find linked children (only in General view)
      let linkedChildren: any[] = [];
      if (viewMode === 'general' && parentId !== null) {
        const parentIdStr = String(parentId).toLowerCase().trim();
        const rels = relaciones.filter(r => String(r.parentId).toLowerCase().trim() === parentIdStr);
        rels.forEach(r => {
          let childData: any = null;
          let actualType = r.type;
          const rChildIdStr = String(r.childId).toLowerCase().trim();

          // Try to find the child regardless of what 'type' is saved, for maximum robustness
          let found: any = dependencias.find(d => String(d.id).toLowerCase().trim() === rChildIdStr);
          if (found) { childData = found; actualType = 'Dependencia'; }
          else {
            found = procesos.find(p => String(p.id).toLowerCase().trim() === rChildIdStr);
            if (found) { childData = found; actualType = 'Proceso'; }
            else {
              found = procedimientos.find(p => String(p.id).toLowerCase().trim() === rChildIdStr);
              if (found) { childData = found; actualType = 'Procedimiento'; }
              else {
                found = actividades.find(a => String(a.id).toLowerCase().trim() === rChildIdStr);
                if (found) { childData = found; actualType = 'Actividad'; }
              }
            }
          }
          
          if (childData) {
            linkedChildren.push({ ...childData, type: actualType, isLinked: true, includedChildren: r.includedChildren });
          }
        });
      }

      // Combine and filter based on viewMode
      let allChildren: any[] = [];
      if (viewMode === 'organizacional') {
        allChildren = baseChildren.filter(c => c.type === 'Organismo' || c.type === 'Dependencia');
      } else if (viewMode === 'procedimental') {
        if (parentType === null) {
          allChildren = procesos.filter(p => !p.procesoId).map(p => ({ ...p, type: 'Proceso', isLinked: false }));
        } else {
          allChildren = baseChildren.filter(c => ['Proceso', 'Procedimiento', 'Actividad'].includes(c.type));
        }
      } else {
        // General view
        allChildren = [...baseChildren, ...linkedChildren];
      }
      
      if (allowedChildren && allowedChildren.length > 0) {
        allChildren = allChildren.filter(c => allowedChildren.includes(c.id));
      }

      // Sort children to maintain the correct hierarchy order when linked elements are mixed in
      const typeOrder: Record<string, number> = {
        'Actividad': 1,
        'Procedimiento': 2,
        'Proceso': 3,
        'Dependencia': 4,
        'Organismo': 5
      };
      
      allChildren.sort((a, b) => {
        if (typeOrder[a.type] !== typeOrder[b.type]) {
          return typeOrder[a.type] - typeOrder[b.type];
        }
        return a.nombre.localeCompare(b.nombre);
      });

      // Deduplicate and process
      const processedIds = new Set();
      allChildren.forEach(child => {
        const uniqueKey = `${child.type}-${child.id}-${child.isLinked ? 'L' : 'B'}`;
        if (processedIds.has(uniqueKey)) return;
        processedIds.add(uniqueKey);

        const path = currentPath ? `${currentPath}/${child.id}` : child.id;

        // NEW CHECK HERE: Skip rendering this node and all of its descendants if deeply hidden
        if (viewMode === 'general' && hiddenPaths.includes(path)) {
          return; 
        }

        let numElements = 0;
        
        if (viewMode === 'organizacional') {
          numElements = organismos.filter(o => o.parentId === child.id && o.estado !== 'Inactivo').length + dependencias.filter(d => d.parentId === child.id && d.estado !== 'Inactivo').length;
        } else if (viewMode === 'procedimental') {
          if (child.type === 'Proceso') numElements = procesos.filter(p => p.procesoId === child.id && p.estado !== 'Inactivo').length + procedimientos.filter(pcd => pcd.procesoId === child.id && pcd.estado !== 'Inactivo').length;
          else if (child.type === 'Procedimiento') numElements = actividades.filter(act => act.procedimientoId === child.id && act.estado !== 'Inactivo').length;
        } else {
          // General
          // Here, it makes sense to count immediate valid structural & relational children
          const immediateChildren = childrenGraph.get(child.id) || [];
          // Count only unique children that resolve to active state
          const realChildrenIds = new Set<string>();
          immediateChildren.forEach(c => realChildrenIds.add(c.id));
          numElements = realChildrenIds.size;
        }

        // Check for general hasChildren flag (just immediate structural/link children, no recursion needed)
        let hasChildren = false;
        if (viewMode === 'organizacional') {
          hasChildren = organismos.some(o => o.parentId === child.id && o.estado !== 'Inactivo') || dependencias.some(d => d.parentId === child.id && d.estado !== 'Inactivo');
        } else if (viewMode === 'procedimental') {
          if (child.type === 'Proceso') hasChildren = procesos.some(p => p.procesoId === child.id && p.estado !== 'Inactivo') || procedimientos.some(pcd => pcd.procesoId === child.id && pcd.estado !== 'Inactivo');
          else if (child.type === 'Procedimiento') hasChildren = actividades.some(act => act.procedimientoId === child.id && act.estado !== 'Inactivo');
        } else {
          // general mode
          let tempHasChildren = false;
          if (child.type === 'Organismo') {
             tempHasChildren = organismos.some(o => o.parentId === child.id && o.estado !== 'Inactivo') || dependencias.some(d => d.parentId === child.id && d.estado !== 'Inactivo');
          } else if (child.type === 'Dependencia') {
             tempHasChildren = dependencias.some(d => d.parentId === child.id && d.estado !== 'Inactivo') || procesos.some(p => p.dependenciaId === child.id && p.estado !== 'Inactivo');
          } else if (child.type === 'Proceso') {
             tempHasChildren = procesos.some(p => p.procesoId === child.id && p.estado !== 'Inactivo') || procedimientos.some(pcd => pcd.procesoId === child.id && pcd.estado !== 'Inactivo');
          } else if (child.type === 'Procedimiento') {
             tempHasChildren = actividades.some(act => act.procedimientoId === child.id && act.estado !== 'Inactivo');
          }
          if (!tempHasChildren) {
             tempHasChildren = relaciones.some(r => r.parentId === child.id);
          }
          hasChildren = tempHasChildren;
        }

        const getCodigoById = (id: string | null) => {
          if (!id) return 'N/A';
          return organismos.find(o => o.id === id)?.codigo ||
                 dependencias.find(d => d.id === id)?.codigo ||
                 procesos.find(p => p.id === id)?.codigo ||
                 procedimientos.find(pcd => pcd.id === id)?.codigo ||
                 actividades.find(a => a.id === id)?.codigo || id;
        };

        rows.push({
          id: child.id,
          codigo: child.codigo || child.id,
          nombre: child.nombre,
          type: child.type,
          parentId: parentId || 'N/A',
          parentCodigo: getCodigoById(parentId),
          level,
          hasChildren,
          numElements,
          path,
          isLinked: child.isLinked,
          includedChildren: child.includedChildren,
          estado: child.estado
        });

        if (expandedNodes[viewMode].has(path)) {
          addChildrenRecursive(child.id, level + 1, path, child.type, child.includedChildren);
        }
      });
    };

    addChildrenRecursive(null, 0, '', null);
    return rows;
  }, [
    viewMode, expandedNodes, organismos, dependencias, 
    procesos, procedimientos, actividades, relaciones, hiddenPaths
  ]);


  const getSelectedNodeDetails = () => {
    if (!selectedNode) return null;
    const { type, id } = selectedNode;
    if (type === 'Organismo') return organismos.find(o => o.id === id);
    if (type === 'Dependencia') return dependencias.find(d => d.id === id);
    if (type === 'Proceso') return procesos.find(p => p.id === id);
    if (type === 'Procedimiento') return procedimientos.find(pc => pc.id === id);
    if (type === 'Actividad') return actividades.find(a => a.id === id);
    return null;
  };

  const details = getSelectedNodeDetails();

  const currentRecursiveTargetCount = selectedNode ? getRecursiveTargetCountFast(selectedNode.id, selectedNode.type) : 0;

  const maxExpandedLevel = React.useMemo(() => {
    return displayRows.length > 0 ? Math.max(...displayRows.map(r => r.level)) : 0;
  }, [displayRows]);

  const leftPanelWidth = `${50 + (Math.min(maxExpandedLevel, 4) / 4) * 10}%`;

  const handleOpenLinkModal = (directType?: string, directId?: string) => {
    const targetType = directType || selectedNode?.type;
    const targetId = directId || selectedNode?.id;

    if (!targetType || !targetId) return;
    
    const childType = targetType === 'Organismo' ? 'Dependencia' : 
                      targetType === 'Dependencia' ? 'Proceso' : 
                      targetType === 'Proceso' ? 'Procedimiento' : 
                      targetType === 'Procedimiento' ? 'Actividad' : null;
    if (!childType) {
      alert('No se pueden vincular elementos a este nivel.');
      return;
    }
    setLinkModalConfig({ isOpen: true, parentType: targetType, parentId: targetId, childType });
  };

  const handleConfirmLink = (childIds: string[]) => {
    if (linkModalConfig) {
      onLink(linkModalConfig.childType, childIds, linkModalConfig.parentId);
      setLinkModalConfig(null);
    }
  };

  const handleOpenCreateModal = (type: string, parentId?: string, parentName?: string, parentType?: string) => {
    setCreateModalConfig({
      isOpen: true,
      type,
      parentId,
      parentName,
      parentType,
      mode: 'create'
    });
  };

  const handleOpenEditModal = (type: string, id: string) => {
    let item = null;
    let parentName = undefined;
    let parentType = undefined;

    if (type === 'Organismo') {
      item = organismos.find(o => o.id === id);
      if (item?.parentId) {
        parentName = organismos.find(o => o.id === item.parentId)?.nombre;
        parentType = 'Organismo';
      }
    }
    if (type === 'Dependencia') {
      item = dependencias.find(d => d.id === id);
      if (item?.parentId) {
        const parentOrg = organismos.find(o => o.id === item.parentId);
        if (parentOrg) {
          parentName = parentOrg.nombre;
          parentType = 'Organismo';
        } else {
          parentName = dependencias.find(d => d.id === item.parentId)?.nombre;
          parentType = 'Dependencia';
        }
      }
    }
    if (type === 'Proceso') {
      item = procesos.find(p => p.id === id);
      if (item?.dependenciaId) {
        parentName = dependencias.find(d => d.id === item.dependenciaId)?.nombre;
        parentType = 'Dependencia';
      }
    }
    if (type === 'Procedimiento') {
      item = procedimientos.find(p => p.id === id);
      if (item?.procesoId) {
        parentName = procesos.find(p => p.id === item.procesoId)?.nombre;
        parentType = 'Proceso';
      }
    }
    if (type === 'Actividad') {
      item = actividades.find(a => a.id === id);
      if (item?.procedimientoId) {
        parentName = procedimientos.find(p => p.id === item.procedimientoId)?.nombre;
        parentType = 'Procedimiento';
      }
    }

    if (item) {
      setCreateModalConfig({
        isOpen: true,
        type,
        initialData: item,
        parentName,
        parentType,
        mode: 'edit'
      });
    }
  };

  const handleConfirmSave = (data: any) => {
    onSave(createModalConfig.type, data, createModalConfig.mode, createModalConfig.initialData?.id);
    setCreateModalConfig({ ...createModalConfig, isOpen: false });
  };

  return (
    <>
      <div className="flex flex-col h-full">
      <LinkElementModal 
        config={linkModalConfig} 
        onClose={() => setLinkModalConfig(null)} 
        onLink={handleConfirmLink} 
        organismos={organismos}
        dependencias={dependencias}
        procesos={procesos} 
        procedimientos={procedimientos}
        actividades={actividades}
        relaciones={relaciones}
      />
      <CreateElementModal 
        isOpen={createModalConfig.isOpen}
        onClose={() => setCreateModalConfig({ ...createModalConfig, isOpen: false })}
        onSave={handleConfirmSave}
        type={createModalConfig.type}
        parentId={createModalConfig.parentId}
        parentName={createModalConfig.parentName}
        parentType={createModalConfig.parentType}
        initialData={createModalConfig.initialData}
        mode={createModalConfig.mode}
      />
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept=".xlsx" 
        style={{ display: 'none' }} 
      />
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar en la estructura..." 
              className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-institutional-blue/20 outline-none w-64 transition-all"
            />
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
            <button 
              onClick={() => handleViewModeChange('general')}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'general' ? 'bg-white text-institutional-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              General
            </button>
            <button 
              onClick={() => handleViewModeChange('organizacional')}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'organizacional' ? 'bg-white text-institutional-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Organizacional
            </button>
            <button 
              onClick={() => handleViewModeChange('procedimental')}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'procedimental' ? 'bg-white text-institutional-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Procedimental
            </button>
          </div>
          {!isReadOnly && viewMode !== 'general' && (
            <button 
              onClick={() => handleOpenCreateModal(viewMode === 'organizacional' ? 'Organismo' : 'Proceso', undefined, undefined, undefined)}
              className="bg-institutional-blue text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-institutional-blue/90 transition-all shadow-md shadow-institutional-blue/10 ml-2"
            >
              <Plus size={16} />
              {viewMode === 'organizacional' ? 'Nuevo Organismo' : 'Nuevo Proceso'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isReadOnly && (
            <>
              
              <div className="relative">
                <button 
                  onClick={() => vigenciaActiva ? setShowAddMenu(!showAddMenu) : alert('No se puede crear o importar estructura cuando no hay una vigencia activa.')}
                  className={`border border-slate-200 px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${!vigenciaActiva ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                  <Plus size={16} />
                  Importar
                  <ChevronDown size={14} />
                </button>
                {showAddMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 z-50 py-2 overflow-hidden">
                    <div className="px-4 py-2 border-b border-slate-100 mb-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Importación Masiva</p>
                    </div>
                    <button 
                      onClick={() => simulateUpload('Organización')}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Building2 size={14} className="text-institutional-blue" />
                      1. Importar Estructura Organizacional (.xlsx)
                    </button>
                    <button 
                      onClick={() => simulateUpload('Procesos')}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Network size={14} className="text-emerald-500" />
                      2. Importar Estructura Procedimental (.xlsx)
                    </button>
                    <button 
                      onClick={() => { setShowAddMenu(false); setShowRelationTypeModal(true); }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Link2 size={14} className="text-amber-500" />
                      3. Importar Mapa de Relaciones (.xlsx)
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
          <button 
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('navigate-module', { detail: 'captura' }));
            }}
            className="bg-institutional-blue hover:bg-institutional-blue/90 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-2 transition-all shadow-md shadow-institutional-blue/10 shrink-0 select-none"
          >
            <span>Ir a la captura de Cargas de Trabajo</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="px-6 py-3 bg-amber-50 border-b border-amber-100 flex items-start gap-3">
        <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
        <div className="text-xs text-amber-800">
          {viewMode === 'general' && (
            <p><strong>Vista General (Relaciones):</strong> Esta vista es exclusiva para gestionar vinculaciones. Eliminar un elemento aquí solo lo <strong>desvinculará</strong> de su padre actual, conservándolo en el catálogo base. Para crear o editar elementos, diríjase a los catálogos base.</p>
          )}
          {viewMode === 'organizacional' && (
            <p><strong>Catálogo Organizacional:</strong> Las ediciones o cambios de los elementos afectan en toda la organización. Eliminar un organismo o dependencia causará un borrado lógico, ocultándolo de la estructura actual.</p>
          )}
          {viewMode === 'procedimental' && (
            <p><strong>Catálogo Procedimental:</strong> Las ediciones o cambios de los elementos afectan en toda la organización. Eliminar un proceso, procedimiento o actividad causará un borrado lógico, ocultándolo de la estructura actual.</p>
          )}
        </div>
      </div>

      <div 
        className="flex-1 overflow-auto p-6 flex flex-col md:flex-row gap-6 relative"
        onClick={handleClearSelection}
      >
        <div 
          className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all duration-300 shrink-0"
          style={{ width: window.innerWidth > 768 ? leftPanelWidth : '100%' }}
        >
          {!hasVigencia ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/50">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <FolderTree size={32} className="text-institutional-blue opacity-50" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-2">No existen vigencias activas</h3>
              <p className="text-slate-500 text-sm max-w-md">No existen vigencias activas para realizar cargas de trabajo, se habilitará una estructura en el momento adecuado para iniciar un estudio.</p>
            </div>
          ) : (
            <div className="overflow-auto flex-1">
              <table className="w-full text-left text-sm border-collapse min-w-[600px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="px-4 py-3 border-r border-slate-200 w-24">ID</th>
                  <th className="px-4 py-3 border-r border-slate-200">Nombre / Jerarquía</th>
                  <th className="px-4 py-3 border-r border-slate-200 w-32">Tipo</th>
                  <th className="px-4 py-3 border-r border-slate-200 w-24">ID Padre</th>
                  <th className="px-4 py-3 w-fit whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {displayRows.map((row, idx) => (
                    <motion.tr 
                      id={`row-${row.path}`}
                      key={row.path} 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleNodeClick(row.type, row.id, row.path, row.parentId, row.isLinked); 
                        if (row.hasChildren && selectedNode?.path === row.path) {
                          // Only toggle expand if clicking on an already selected node or if we want it to open immediately
                        }
                        if (row.hasChildren) {
                          toggleExpand(row.path);
                        }
                      }}
                      className={`hover:bg-institutional-blue/5 cursor-pointer transition-colors border-b border-slate-100 overflow-hidden ${selectedNode?.path === row.path ? 'bg-institutional-blue/5' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'} ${row.estado === 'Inactivo' ? 'opacity-60 bg-slate-50' : ''}`}
                      data-no-deselect="true"
                    >
                      <td className="px-4 py-3 font-mono text-[10px] text-slate-500 border-r border-slate-100 w-24 max-w-[100px] truncate" title={row.id}>{row.codigo}</td>
                      <td className="px-4 py-3 font-medium text-slate-700 border-r border-slate-100">
                        <div className="flex items-center gap-2" style={{ paddingLeft: `${row.level * 20}px` }}>
                          {row.hasChildren ? (
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleExpand(row.path); }}
                              className="p-1 hover:bg-slate-200 rounded transition-colors shrink-0"
                            >
                              <motion.div
                                animate={{ rotate: expandedNodes[viewMode].has(row.path) ? 90 : 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                              >
                                <ChevronRight size={14} className="shrink-0" />
                              </motion.div>
                            </button>
                          ) : (
                            <div className="w-6 shrink-0" />
                          )}
                          {row.type === 'Organismo' && <Building2 size={14} className="text-blue-700 shrink-0" />}
                          {row.type === 'Dependencia' && <FolderTree size={14} className="text-emerald-700 shrink-0" />}
                          {row.type === 'Proceso' && <Network size={14} className="text-amber-700 shrink-0" />}
                          {row.type === 'Procedimiento' && <ClipboardEdit size={14} className="text-purple-700 shrink-0" />}
                          {row.type === 'Actividad' && <CheckCircle2 size={14} className="text-slate-700 shrink-0" />}
                          <span className={`${row.level === 0 ? 'font-bold text-slate-900' : ''} ${row.estado === 'Inactivo' ? 'text-slate-400' : ''}`}>{row.nombre}</span>
                          {row.numElements > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200" title={`Elementos dependientes a este nivel`}>
                              {row.numElements}
                            </span>
                          )}
                          {(recentlyModifiedSet.has(row.id) || recentlyModifiedSet.has(`link:${row.parentId}:${row.id}`)) && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 ml-2 shadow-[0_0_4px_rgba(16,185,129,0.5)]" title="Modificado recientemente"></span>
                          )}
                          {row.estado === 'Inactivo' && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-200 text-slate-500 uppercase">Inactivo</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 border-r border-slate-100">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          row.type === 'Organismo' ? 'bg-blue-100 text-blue-700' : 
                          row.type === 'Dependencia' ? 'bg-emerald-100 text-emerald-700' : 
                          row.type === 'Proceso' ? 'bg-amber-100 text-amber-700' :
                          row.type === 'Procedimiento' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {row.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-slate-400 border-r border-slate-100 w-24 max-w-[100px] truncate" title={row.parentId}>{row.parentCodigo}</td>
                      <td className="px-4 py-3 w-fit whitespace-nowrap">
                        <div className="flex items-center gap-1 justify-end w-fit">
                          {!isReadOnly && vigenciaActiva && (
                            <>
                              {viewMode === 'organizacional' && (row.type === 'Organismo' || row.type === 'Dependencia') && (
                            <div className="flex items-center">
                              {row.type === 'Organismo' && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleOpenCreateModal('Dependencia', row.id, row.nombre, row.type); }}
                                  className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-all transition-all shrink-0"
                                  title="Agregar Dependencia"
                                >
                                  <ChevronRight size={14} className="shrink-0" />
                                </button>
                              )}
                              {row.type === 'Dependencia' && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleOpenCreateModal('Dependencia', row.id, row.nombre, row.type); }}
                                  className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-all transition-all shrink-0"
                                  title="Agregar Sub-Dependencia"
                                >
                                  <ChevronRight size={14} className="shrink-0" />
                                </button>
                              )}
                            </div>
                          )}
                          {viewMode === 'procedimental' && (row.type === 'Proceso' || row.type === 'Procedimiento' || row.type === 'Actividad') && (
                            <div className="flex items-center">
                              {row.type === 'Proceso' && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleOpenCreateModal('Procedimiento', row.id, row.nombre, row.type); }}
                                  className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-all transition-all shrink-0"
                                  title="Agregar Procedimiento"
                                >
                                  <ChevronRight size={14} className="shrink-0" />
                                </button>
                              )}
                              {row.type === 'Procedimiento' && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleOpenCreateModal('Actividad', row.id, row.nombre, row.type); }}
                                  className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-all transition-all shrink-0"
                                  title="Agregar Actividad"
                                >
                                  <ChevronRight size={14} className="shrink-0" />
                                </button>
                              )}
                            </div>
                          )}
                          {/* Bóton Vincular en vista general */}
                          {viewMode === 'general' && row.type !== 'Organismo' && row.type !== 'Actividad' && (
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                handleNodeClick(row.type, row.id, row.path, row.parentId, row.isLinked);
                                handleOpenLinkModal(row.type, row.id); 
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-all transition-all shrink-0"
                              title="Vincular Elemento"
                            >
                              <Link2 size={14} className="shrink-0" />
                            </button>
                          )}
                          {viewMode !== 'general' && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleOpenEditModal(row.type, row.id); }}
                              className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-all transition-all shrink-0"
                              title="Editar"
                            >
                              <Edit2 size={14} className="shrink-0" />
                            </button>
                          )}
                          {/* Eliminar (Solo en catálogos) */}
                          {viewMode !== 'general' && (
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                onDelete(row.type, row.id); 
                                if (selectedNode?.id === row.id) setSelectedNode(null);
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all shrink-0"
                              title="Desactivar"
                            >
                              <Trash2 size={14} className="shrink-0" />
                            </button>
                          )}
                          {/* Desvincular (Solo en vista General y NO para Organismos) */}
                          {viewMode === 'general' && row.type !== 'Organismo' && row.parentId !== 'N/A' && (
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                onUnlink(row.type, row.id, row.parentId, row.isLinked || false, row.path || '');
                                if (selectedNode?.path === row.path) setSelectedNode(null);
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all shrink-0"
                              title="Desvincular"
                            >
                              <Unlink size={14} className="shrink-0" />
                            </button>
                          )}
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          )}
        </div>
            
        <div className="flex-1 flex flex-col gap-6">
          {selectedNode && details ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full"
              onClick={(e) => e.stopPropagation()}
              data-no-deselect="true"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-700">{details.nombre}</h3>
                  <p className="text-xs text-slate-400">Detalles de {selectedNode.type}</p>
                </div>
                <div className="flex gap-1">
                  {!isReadOnly && (
                    <>
                      <button 
                        onClick={() => handleOpenEditModal(selectedNode.type, selectedNode.id)}
                        className="p-2 text-slate-400 hover:text-institutional-blue hover:bg-institutional-blue/5 rounded-lg transition-all"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          if (viewMode === 'general' && selectedNode.parentId && selectedNode.parentId !== 'N/A' && selectedNode.type !== 'Organismo') {
                            onUnlink(selectedNode.type, selectedNode.id, selectedNode.parentId, selectedNode.isLinked || false, selectedNode.path || '');
                            setSelectedNode(null);
                          } else {
                            onDelete(selectedNode.type, selectedNode.id);
                            setSelectedNode(null);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title={viewMode === 'general' && selectedNode.parentId && selectedNode.parentId !== 'N/A' && selectedNode.type !== 'Organismo' ? "Desvincular" : "Desactivar"}
                      >
                        {viewMode === 'general' && selectedNode.parentId && selectedNode.parentId !== 'N/A' && selectedNode.type !== 'Organismo' ? (
                          <Unlink size={18} />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                      <div className="w-px h-6 bg-slate-100 mx-1 self-center" />
                    </>
                  )}
                  <button 
                    onClick={() => setSelectedNode(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                    title="Cerrar detalles"
                  >
                    <Plus size={18} className="rotate-45" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 p-6 flex flex-col min-h-0 overflow-y-auto">
                <div className="flex flex-col gap-8 min-h-0 w-full overflow-hidden">
                  <div className="flex flex-col space-y-6 min-h-0 w-full overflow-hidden shrink-0">
                    <div className="space-y-4 shrink-0">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Información General</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-400 uppercase">ID Generado (Id largo)</p>
                          <p className="text-sm font-medium">{details.id}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-400 uppercase">Tipo</p>
                          <p className="text-sm font-medium">{selectedNode.type}</p>
                        </div>
                        {selectedNode.type === 'Proceso' && (
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-400 uppercase">Clasificación / Tipo de Proceso</p>
                            <p className="text-sm font-medium">{(details as any).tipo || (details as any).descripcion?.replace('Tipo de proceso: ', '') || 'Misional'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {selectedNode.type === 'Organismo' && (() => {
                      const associatedItems = [
                        ...organismos.filter(o => o.parentId === details.id),
                        ...dependencias.filter(d => d.parentId === details.id || (viewMode === 'general' && relaciones.some(r => r.type === 'Dependencia' && r.childId === d.id && r.parentId === details.id)))
                      ];
                      return (
                      <div className="space-y-4 flex flex-col flex-1 min-h-0">
                        <div className="flex items-center justify-between shrink-0">
                          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Elementos Asociados (A este nivel)</h4>
                          <span className="px-2 py-0.5 bg-institutional-blue/10 text-institutional-blue text-[10px] font-bold rounded-full border border-institutional-blue/20">
                            Nº Elementos: {currentRecursiveTargetCount}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 xl:grid-cols-2 flex-1 pr-2 content-start gap-3 items-start overflow-y-auto w-full auto-rows-max">
                          {associatedItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 flex-none h-[60px]">
                              <div className="overflow-hidden pr-2">
                                <p className="text-xs font-bold text-slate-700 truncate">{item.nombre}</p>
                                <p className="text-[9px] text-slate-400 uppercase font-bold">{(item as any).parentId ? 'Dependencia' : 'Organismo'}</p>
                              </div>
                            </div>
                          ))}
                          <div className="col-span-1 xl:col-span-2 flex flex-col sm:flex-row gap-2 mt-2 shrink-0">
                            {!isReadOnly && viewMode === 'general' && (
                              <button 
                                onClick={() => handleOpenLinkModal()}
                                className="flex-1 py-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-xs font-bold hover:border-amber-500 hover:text-amber-500 transition-all flex items-center justify-center gap-2"
                              >
                                <Link2 size={14} />
                                Vincular Dependencia Existente
                              </button>
                            )}
                            {!isReadOnly && viewMode === 'organizacional' && (
                              <button 
                                onClick={() => handleOpenCreateModal('Dependencia', details.id, details.nombre, selectedNode.type)}
                                className="flex-1 py-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-xs font-bold hover:border-institutional-blue hover:text-institutional-blue transition-all flex items-center justify-center gap-2"
                              >
                                <Plus size={14} />
                                Crear Nueva Dependencia
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                    })()}
                    
                    {selectedNode.type === 'Dependencia' && (() => {
                      const associatedProcs = procesos.filter(p => p.dependenciaId === details.id || (viewMode === 'general' && relaciones.some(r => r.type === 'Proceso' && r.childId === p.id && r.parentId === details.id)));
                      return (
                      <div className="space-y-4 flex flex-col flex-1 min-h-0">
                        <div className="flex items-center justify-between shrink-0">
                          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Procesos Asociados a este nivel</h4>
                          <span className="px-2 py-0.5 bg-institutional-blue/10 text-institutional-blue text-[10px] font-bold rounded-full border border-institutional-blue/20">
                            Nº Elementos: {currentRecursiveTargetCount}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 xl:grid-cols-2 flex-1 pr-2 content-start gap-3 items-start overflow-y-auto w-full auto-rows-max">
                          {associatedProcs.map((proc) => (
                            <div key={proc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 flex-none h-[60px]">
                              <div className="overflow-hidden pr-2">
                                <p className="text-xs font-bold text-slate-700 truncate">{proc.nombre}</p>
                                <p className="text-[10px] text-slate-400 truncate">{(proc as any).tipo || (proc as any).descripcion?.replace('Tipo de proceso: ', '') || 'Misional'}</p>
                              </div>
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 shrink-0">
                                Activo
                              </span>
                            </div>
                          ))}
                          <div className="col-span-1 xl:col-span-2 flex flex-col sm:flex-row gap-2 mt-2 shrink-0">
                            {!isReadOnly && viewMode === 'general' && (
                              <button 
                                onClick={() => handleOpenLinkModal()}
                                className="flex-1 py-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-xs font-bold hover:border-amber-500 hover:text-amber-500 transition-all flex items-center justify-center gap-2"
                              >
                                <Link2 size={14} />
                                Vincular Proceso Existente
                              </button>
                            )}
                            {!isReadOnly && viewMode === 'organizacional' && (
                              <button 
                                onClick={() => handleOpenCreateModal('Dependencia', details.id, details.nombre, selectedNode.type)}
                                className="flex-1 py-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-xs font-bold hover:border-institutional-blue hover:text-institutional-blue transition-all flex items-center justify-center gap-2"
                              >
                                <Plus size={14} />
                                Crear Sub-Dependencia
                              </button>
                            )}
                            {!isReadOnly && viewMode === 'procedimental' && (
                              <button 
                                onClick={() => handleOpenCreateModal('Proceso', details.id, details.nombre, selectedNode.type)}
                                className="flex-1 py-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-xs font-bold hover:border-institutional-blue hover:text-institutional-blue transition-all flex items-center justify-center gap-2"
                              >
                                <Plus size={14} />
                                Crear Nuevo Proceso
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                    })()}

                    {selectedNode.type === 'Proceso' && (() => {
                      const associatedPcds = procedimientos.filter(pcd => pcd.procesoId === details.id || (viewMode === 'general' && relaciones.some(r => r.type === 'Procedimiento' && r.childId === pcd.id && r.parentId === details.id)));
                      return (
                      <div className="space-y-4 flex flex-col flex-1 min-h-0">
                        <div className="flex items-center justify-between shrink-0">
                          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Procedimientos Asociados</h4>
                          <span className="px-2 py-0.5 bg-institutional-blue/10 text-institutional-blue text-[10px] font-bold rounded-full border border-institutional-blue/20">
                            Nº Elementos: {currentRecursiveTargetCount}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 xl:grid-cols-2 flex-1 pr-2 content-start gap-3 items-start overflow-y-auto w-full auto-rows-max">
                          {associatedPcds.map((pcd) => (
                            <div key={pcd.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 flex-none h-[60px]">
                              <div className="overflow-hidden pr-2">
                                <p className="text-xs font-bold text-slate-700 truncate">{pcd.nombre}</p>
                              </div>
                            </div>
                          ))}
                          <div className="col-span-1 xl:col-span-2 flex flex-col sm:flex-row gap-2 mt-2 shrink-0">
                            {!isReadOnly && viewMode === 'general' && (
                              <button 
                                onClick={() => handleOpenLinkModal()}
                                className="flex-1 py-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-xs font-bold hover:border-amber-500 hover:text-amber-500 transition-all flex items-center justify-center gap-2"
                              >
                                <Link2 size={14} />
                                Vincular Procedimiento Existente
                              </button>
                            )}
                            {!isReadOnly && viewMode === 'procedimental' && (
                              <button 
                                onClick={() => handleOpenCreateModal('Procedimiento', details.id, details.nombre, selectedNode.type)}
                                className="flex-1 py-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-xs font-bold hover:border-institutional-blue hover:text-institutional-blue transition-all flex items-center justify-center gap-2"
                              >
                                <Plus size={14} />
                                Crear Nuevo Procedimiento
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                    })()}

                    {selectedNode.type === 'Procedimiento' && (() => {
                      const associatedActs = actividades.filter(a => a.procedimientoId === details.id || (viewMode === 'general' && relaciones.some(r => r.type === 'Actividad' && r.childId === a.id && r.parentId === details.id)));
                      return (
                      <div className="space-y-4 flex flex-col flex-1 min-h-0">
                        <div className="flex items-center justify-between shrink-0">
                          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Actividades Asociadas</h4>
                          <span className="px-2 py-0.5 bg-institutional-blue/10 text-institutional-blue text-[10px] font-bold rounded-full border border-institutional-blue/20">
                            Nº Elementos: {currentRecursiveTargetCount}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 xl:grid-cols-2 flex-1 pr-2 content-start gap-3 items-start overflow-y-auto w-full auto-rows-max">
                          {associatedActs.map((act) => (
                            <div key={act.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 flex-none h-[60px]">
                              <div className="overflow-hidden pr-2">
                                <p className="text-xs font-bold text-slate-700 truncate">{act.nombre}</p>
                              </div>
                            </div>
                          ))}
                          <div className="col-span-1 xl:col-span-2 flex flex-col sm:flex-row gap-2 mt-2 shrink-0">
                            {!isReadOnly && viewMode === 'general' && (
                              <button 
                                onClick={() => handleOpenLinkModal()}
                                className="flex-1 py-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-xs font-bold hover:border-amber-500 hover:text-amber-500 transition-all flex items-center justify-center gap-2"
                              >
                                <Link2 size={14} />
                                Vincular Actividad Existente
                              </button>
                            )}
                            {!isReadOnly && viewMode === 'procedimental' && (
                              <button 
                                onClick={() => handleOpenCreateModal('Actividad', details.id, details.nombre, selectedNode.type)}
                                className="flex-1 py-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-xs font-bold hover:border-institutional-blue hover:text-institutional-blue transition-all flex items-center justify-center gap-2"
                              >
                                <Plus size={14} />
                                Crear Nueva Actividad
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                    })()}
                  </div>
                  
                  <div className="space-y-6 flex flex-col w-full lg:w-1/3 shrink-0">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Métricas de Carga</h4>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center flex-1">
                      <BarChart3 size={48} className="text-slate-200 mb-4" />
                      <p className="text-xs text-slate-500">Distribución de carga estimada para este nivel.</p>
                      <div className="mt-4 w-full space-y-2">
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-institutional-blue w-1/2" />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-400">
                          <span>CAPACIDAD</span>
                          <span>50%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-slate-400 p-8 gap-8 h-full overflow-y-auto">
              <div className="flex flex-col items-center text-center max-w-md">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                  {viewMode === 'general' ? (
                    <Network size={40} className="text-slate-200" />
                  ) : viewMode === 'organizacional' ? (
                    <Building2 size={40} className="text-slate-200" />
                  ) : (
                    <FolderTree size={40} className="text-slate-200" />
                  )}
                </div>
                
                <h3 className="text-slate-800 font-bold text-lg mb-2">
                  {viewMode === 'general' ? 'Capa de Integración' : 'Gestión de Catálogo Maestro'}
                </h3>
                
                <p className="text-sm text-slate-500 leading-relaxed mb-8">
                  {viewMode === 'general' ? (
                    'Esta vista permite unificar la estructura organizacional con el mapa de procesos. Aquí se definen las responsabilidades institucionales vinculando dependencias con sus procesos correspondientes.'
                  ) : viewMode === 'organizacional' ? (
                    'Defina aquí la identidad y jerarquía de la entidad. Los cambios realizados en este catálogo maestro se reflejarán en todo el sistema de gestión.'
                  ) : (
                    'Administre el inventario de procesos, procedimientos y actividades. Esta estructura define el "saber hacer" de la organización.'
                  )}
                </p>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3 w-full text-left">
                  <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center text-institutional-blue shrink-0">
                    <Search size={16} />
                  </div>
                  <p className="text-xs font-medium text-slate-600">
                    Seleccione un elemento de la tabla para ver sus detalles y relaciones jerárquicas.
                  </p>
                </div>
              </div>

              <div className="w-fit min-w-[250px] bg-slate-50 rounded-2xl border border-slate-100 p-6 shrink-0">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 text-left">Resumen de Elementos</h4>
                <div className="flex flex-col gap-3">
                  {(viewMode === 'general' || viewMode === 'organizacional') && (
                    <>
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm gap-6">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border bg-blue-50 text-blue-700 border-blue-200">Organismo</span>
                        </div>
                        <span className="text-lg font-bold text-slate-700">{organismos.filter(o => o.estado !== 'Inactivo').length}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm gap-6">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border bg-emerald-50 text-emerald-700 border-emerald-200">Dependencia</span>
                        </div>
                        <span className="text-lg font-bold text-slate-700">{dependencias.filter(d => d.estado !== 'Inactivo').length}</span>
                      </div>
                    </>
                  )}
                  {(viewMode === 'general' || viewMode === 'procedimental') && (
                    <>
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm gap-6">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border bg-amber-50 text-amber-700 border-amber-200">Proceso</span>
                        </div>
                        <span className="text-lg font-bold text-slate-700">{procesos.filter(p => p.estado !== 'Inactivo').length}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm gap-6">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border bg-purple-50 text-purple-700 border-purple-200">Procedimiento</span>
                        </div>
                        <span className="text-lg font-bold text-slate-700">{procedimientos.filter(p => p.estado !== 'Inactivo').length}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm gap-6">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border bg-slate-50 text-slate-700 border-slate-200">Actividad</span>
                        </div>
                        <span className="text-lg font-bold text-slate-700">{actividades.filter(a => a.estado !== 'Inactivo').length}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
      
      <AnimatePresence>
        {importStatus.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-institutional-blue/10 text-institutional-blue">
                     {importStatus.step === 'Completado' ? <CheckCircle2 size={20} /> : importStatus.error ? <AlertTriangle size={20} className="text-red-500" /> : <div className="w-5 h-5 border-2 border-institutional-blue border-t-transparent rounded-full animate-spin" />}
                   </div>
                   <div>
                     <h3 className="text-lg font-bold text-slate-800">
                       Importando {importStatus.type}
                     </h3>
                     <p className="text-xs text-slate-500 line-clamp-1">{importStatus.fileName}</p>
                   </div>
                </div>

                {importStatus.error ? (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                    {importStatus.error}
                    <div className="mt-3 flex justify-end">
                      <button onClick={() => setImportStatus(prev => ({ ...prev, isOpen: false }))} className="px-3 py-1.5 bg-red-100 font-bold rounded-lg hover:bg-red-200 transition-colors">Cerrar</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                       <div className="flex justify-between items-center text-xs">
                         <span className="font-medium text-slate-600">{importStatus.step}...</span>
                         {importStatus.totalRows > 0 && (
                           <span className="text-slate-400 font-mono">
                             {importStatus.step === 'Completado' || importStatus.step === 'Inyectando a base de datos' ? importStatus.processedRows : 0} / {importStatus.totalRows}
                           </span>
                         )}
                       </div>
                       <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            className={`h-full ${importStatus.step === 'Completado' ? 'bg-emerald-500' : 'bg-institutional-blue'}`}
                            initial={{ width: '0%' }}
                            animate={{ 
                               width: importStatus.step === 'Lectura de archivo' ? '25%' : 
                                      importStatus.step === 'Validando estructura' ? '50%' :
                                      importStatus.step === 'Inyectando a base de datos' ? `${50 + (importStatus.totalRows > 0 ? (importStatus.processedRows / importStatus.totalRows) * 50 : 0)}%` : 
                                      '100%' 
                            }}
                            transition={{ ease: "linear" }}
                          />
                       </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRelationTypeModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 pb-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Link2 size={18} className="text-amber-500" />
                  Nivel de Relación
                </h3>
                <button
                  onClick={() => setShowRelationTypeModal(false)}
                  className="text-slate-400 hover:bg-slate-200 hover:text-slate-600 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-600 cursor-default">
                  ¿Qué nivel de relación contiene el archivo a importar?
                </p>
                <div className="space-y-3 mt-4">
                  <button
                    onClick={() => {
                      setShowRelationTypeModal(false);
                      simulateUpload("Relaciones");
                    }}
                    className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-institutional-blue hover:bg-institutional-blue/5 transition-colors flex items-center gap-4 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-institutional-blue/10 flex items-center justify-center shrink-0">
                      <Network size={20} className="text-slate-500 group-hover:text-institutional-blue transition-colors" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Organismo - Proceso</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Asigna procesos directamente a un organismo.</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowRelationTypeModal(false);
                      simulateUpload("Relaciones");
                    }}
                    className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-institutional-blue hover:bg-institutional-blue/5 transition-colors flex items-center gap-4 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-institutional-blue/10 flex items-center justify-center shrink-0">
                      <Settings2 size={20} className="text-slate-500 group-hover:text-institutional-blue transition-colors" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Dependencia - Procedimiento</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Asigna procedimientos y procesos explícitos a dependencias.</p>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
