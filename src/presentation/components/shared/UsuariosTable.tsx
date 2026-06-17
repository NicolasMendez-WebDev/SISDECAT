import React, { useState, useMemo } from 'react';
import { User as UserType, VigenciaUsuario, Organismo, Dependencia, Vigencia } from '../../../domain/models/types';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, HelpCircle } from 'lucide-react';

interface UsuariosTableProps {
  usuarios: UserType[];
  vigenciasUsuarios?: VigenciaUsuario[];
  organismos: Organismo[];
  dependencias: Dependencia[];
  vigencias?: Vigencia[];
  selectedVigenciaId?: string | null;
  editMode: boolean; // if true, shows selects for role and dependency
  onUpdateVigenciaUsuario?: (vu: VigenciaUsuario) => void;
  onUpdateGlobalUsuario?: (u: UserType) => void;
  showRolesAndDeps?: boolean;
}

export const UsuariosTable: React.FC<UsuariosTableProps> = ({
  usuarios,
  vigenciasUsuarios = [],
  organismos,
  dependencias,
  vigencias = [],
  selectedVigenciaId,
  editMode,
  onUpdateVigenciaUsuario,
  onUpdateGlobalUsuario,
  showRolesAndDeps = true
}) => {
  // Manage local selected vigencia ID state
  const [localVigenciaId, setLocalVigenciaId] = useState<string | null>(selectedVigenciaId || null);

  // Sync to selectedVigenciaId when/if parent overrides it
  React.useEffect(() => {
    if (selectedVigenciaId !== undefined) {
      setLocalVigenciaId(selectedVigenciaId);
    }
  }, [selectedVigenciaId]);

  // If localVigenciaId not set but vigencias are available, default to the Active one
  React.useEffect(() => {
    if (!localVigenciaId && vigencias && vigencias.length > 0) {
      const activeVig = vigencias.find(v => v.Estado === 'Activo') || 
                        vigencias.find(v => v.Estado === 'Borrador') || 
                        vigencias[0];
      if (activeVig) {
        setLocalVigenciaId(activeVig.IdVigencia);
      }
    }
  }, [vigencias, localVigenciaId]);

  // Integrated Columns Filters state
  const [filters, setFilters] = useState({
    nombre: '',
    email: '',
    rol: '',
    organismo: '',
    dependencia: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Track standard column sizes in state to enable free dragging column resize
  const [colWidths, setColWidths] = useState<{ [key: string]: number }>({
    nombre: 220,
    email: 260,
    rol: 155,
    organismo: 240,
    dependencia: 240
  });

  const startResize = (e: React.MouseEvent, colKey: string) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = colWidths[colKey] || 200;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      setColWidths(prev => ({
        ...prev,
        [colKey]: Math.max(120, Math.min(650, startWidth + deltaX))
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  type SortField = 'nombre' | 'email' | 'currentRol' | 'currentOrgName' | 'currentDepName';
  const [sortConfig, setSortConfig] = useState<{ field: SortField, direction: 'asc' | 'desc' }>({ field: 'nombre', direction: 'asc' });

  // Recursive function to trace any dependency Id back to its top-level Organismo Level 1
  const resolveOrganismId = React.useCallback((id: string): string => {
    if (!id) return '';
    // If it's already an organism ID
    if (organismos.some(o => o.id === id)) {
      return id;
    }
    // Trace up through dependencias
    let current = dependencias.find(d => d.id === id);
    let visited = new Set<string>();
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      const parentId = current.parentId;
      if (!parentId) break;
      if (organismos.some(o => o.id === parentId)) {
        return parentId;
      }
      current = dependencias.find(d => d.id === parentId);
    }
    return '';
  }, [organismos, dependencias]);

  // Recursively check if childId is descendant of parentId
  const isDescendantOf = React.useCallback((childId: string, parentId: string): boolean => {
    if (!childId || !parentId) return false;
    if (childId === parentId) return true;
    
    let current = dependencias.find(d => d.id === childId);
    let visited = new Set<string>();
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      if (current.parentId === parentId) return true;
      current = dependencias.find(d => d.id === current.parentId);
    }
    return false;
  }, [dependencias]);

  // Get all descendant dependencies of an organism/node recursively for selection dropdowns
  const getDescendantDeps = React.useCallback((orgId: string): Dependencia[] => {
    if (!orgId) return dependencias;
    
    let descendants: Dependencia[] = [];
    let queue: string[] = [orgId];
    let visited = new Set<string>();
    
    while (queue.length > 0) {
      const parentId = queue.shift()!;
      if (visited.has(parentId)) continue;
      visited.add(parentId);
      
      // Find all dependencies whose direct parentId is parentId
      const children = dependencias.filter(d => d.parentId === parentId);
      for (const child of children) {
        if (!descendants.some(d => d.id === child.id)) {
          descendants.push(child);
          queue.push(child.id);
        }
      }
    }
    // Sort alphabetically for clean UX
    return descendants.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [dependencias]);

  // Enhance users with both Organism and Dependency information
  const mappedUsers = useMemo(() => {
    return usuarios.map(u => {
      let currentRol = u.rol || 'Funcionario';
      let currentDepId = u.dependenciaId || '';
      let vu: VigenciaUsuario | undefined = undefined;

      if (localVigenciaId) {
        vu = vigenciasUsuarios.find(x => x.idUsuario === u.id && String(x.idVigencia) === String(localVigenciaId));
        if (vu) {
          currentRol = vu.rol;
          currentDepId = vu.idDependencia || '';
        } else if (editMode) {
          // Default mock object if none exists and we are editing
          vu = {
            idVigenciaUsuario: `VU-NEW-${Math.random()}`,
            idVigencia: localVigenciaId,
            idUsuario: u.id,
            rol: currentRol,
            idDependencia: currentDepId
          };
        }
      } else {
        // If we are in global view (no selected vigencia), locate first assigned dependency from their assigned vigencias
        const userVigencias = vigenciasUsuarios.filter(x => x.idUsuario === u.id);
        const assignedVu = userVigencias.find(x => x.idDependencia && x.idDependencia !== "");
        if (assignedVu) {
          currentDepId = assignedVu.idDependencia;
          currentRol = assignedVu.rol;
        }
      }

      // Resolve parent organism recursively
      const currentOrgId = resolveOrganismId(currentDepId);
      
      // If the node assigned itself is the root organism, clear internal dependency ID
      const isDirectOrg = currentDepId === currentOrgId;
      const displayDepId = isDirectOrg ? '' : currentDepId;

      const currentOrgName = organismos.find(o => o.id === currentOrgId)?.nombre || 'Sin Organismo';
      const currentDepName = dependencias.find(d => d.id === displayDepId)?.nombre || 'Sin Dependencia';

      return {
        ...u,
        currentRol,
        currentOrgId,
        currentOrgName,
        currentDepId: displayDepId,
        currentDepName,
        vu
      };
    });
  }, [usuarios, vigenciasUsuarios, organismos, dependencias, localVigenciaId, editMode, resolveOrganismId]);

  // Filter users based on column inputs
  const filteredUsers = useMemo(() => {
    return mappedUsers.filter(u => {
      const matchNombre = filters.nombre === '' || 
        u.nombre.toLowerCase().includes(filters.nombre.toLowerCase());
      const matchEmail = filters.email === '' || 
        u.email.toLowerCase().includes(filters.email.toLowerCase());
      const matchRol = filters.rol === '' || u.currentRol === filters.rol;
      
      // Filter organism match
      const matchOrg = filters.organismo === '' || u.currentOrgId === filters.organismo;
      
      // Filter dependency match (including recursive descendants)
      const matchDep = filters.dependencia === '' || isDescendantOf(u.currentDepId, filters.dependencia);

      return matchNombre && matchEmail && matchRol && matchOrg && matchDep;
    });
  }, [mappedUsers, filters, isDescendantOf]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters, localVigenciaId]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const sortedUsers = useMemo(() => {
    let sortableItems = [...filteredUsers];
    sortableItems.sort((a, b) => {
      let aValue = a[sortConfig.field] || '';
      let bValue = b[sortConfig.field] || '';
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      return 0;
    });
    return sortableItems;
  }, [filteredUsers, sortConfig]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedUsers, currentPage]);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(p => p + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(p => p - 1);
  };

  const SortHeader = ({ title, field }: { title: string, field: SortField }) => {
    const isSorted = sortConfig.field === field;
    return (
      <button 
        onClick={() => {
          let direction: 'asc' | 'desc' = 'asc';
          if (isSorted && sortConfig.direction === 'asc') direction = 'desc';
          setSortConfig({ field, direction });
        }}
        className="flex items-center gap-1 font-bold hover:text-institutional-blue transition-colors outline-none text-left group w-full justify-between"
      >
        <span>{title}</span>
        {isSorted ? (
          sortConfig.direction === 'asc' ? <ArrowUp size={11} className="text-institutional-blue shrink-0" /> : <ArrowDown size={11} className="text-institutional-blue shrink-0" />
        ) : (
          <ArrowUpDown size={11} className="opacity-0 group-hover:opacity-40 transition-opacity shrink-0" />
        )}
      </button>
    );
  };

  // Obtain recursive list of dependencies under the currently filtered organism
  const filteredDependenciesForColumnFilter = useMemo(() => {
    return getDescendantDeps(filters.organismo);
  }, [filters.organismo, getDescendantDeps]);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Table Container with scroll */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full table-layout-fixed border-collapse text-left text-sm">
          <thead>
            {/* Main Header Headers with Resize Handles */}
            <tr className="bg-slate-50/70 border-b border-slate-100">
              {/* Name column */}
              <th 
                className="relative p-2 py-3 border-r border-slate-100 bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider select-none shrink-0"
                style={{ width: colWidths.nombre, minWidth: colWidths.nombre, maxWidth: colWidths.nombre }}
              >
                <SortHeader title="Nombre del Usuario" field="nombre" />
                <div 
                  className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-institutional-blue/40 active:bg-institutional-blue transition-colors z-25"
                  onMouseDown={(e) => startResize(e, 'nombre')}
                />
              </th>

              {/* Email column */}
              <th 
                className="relative p-2 py-3 border-r border-slate-100 bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider select-none shrink-0"
                style={{ width: colWidths.email, minWidth: colWidths.email, maxWidth: colWidths.email }}
              >
                <SortHeader title="Correo Electrónico" field="email" />
                <div 
                  className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-institutional-blue/40 active:bg-institutional-blue transition-colors z-25"
                  onMouseDown={(e) => startResize(e, 'email')}
                />
              </th>

              {showRolesAndDeps && (
                <>
                  {/* Rol column */}
                  <th 
                    className="relative p-2 py-3 border-r border-slate-100 bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider select-none shrink-0"
                    style={{ width: colWidths.rol, minWidth: colWidths.rol, maxWidth: colWidths.rol }}
                  >
                    <SortHeader title="Rol" field="currentRol" />
                    <div 
                      className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-institutional-blue/40 active:bg-institutional-blue transition-colors z-25"
                      onMouseDown={(e) => startResize(e, 'rol')}
                    />
                  </th>

                  {/* Organismo column */}
                  <th 
                    className="relative p-2 py-3 border-r border-slate-100 bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider select-none shrink-0"
                    style={{ width: colWidths.organismo, minWidth: colWidths.organismo, maxWidth: colWidths.organismo }}
                  >
                    <SortHeader title="Organismo" field="currentOrgName" />
                    <div 
                      className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-institutional-blue/40 active:bg-institutional-blue transition-colors z-25"
                      onMouseDown={(e) => startResize(e, 'organismo')}
                    />
                  </th>

                  {/* Dependencia Adscrita column */}
                  <th 
                    className="relative p-2 py-3 bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider select-none shrink-0"
                    style={{ width: colWidths.dependencia, minWidth: colWidths.dependencia, maxWidth: colWidths.dependencia }}
                  >
                    <SortHeader title="Dependencia" field="currentDepName" />
                    <div 
                      className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-institutional-blue/40 active:bg-institutional-blue transition-colors z-25"
                      onMouseDown={(e) => startResize(e, 'dependencia')}
                    />
                  </th>
                </>
              )}
            </tr>

            {/* INTEGRATED COLUMN-WISE FILTERS ROW */}
            <tr className="bg-slate-100/60 border-b border-slate-100">
              {/* Filter Nombre */}
              <td className="p-1 border-r border-slate-100" style={{ width: colWidths.nombre }}>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                  <input
                    type="text"
                    className="w-full pl-6 pr-2 py-1 bg-white border border-slate-100 rounded-md text-xs placeholder-slate-400 focus:outline-none focus:border-institutional-blue text-slate-700 font-medium"
                    placeholder="Filtrar por nombre..."
                    value={filters.nombre}
                    onChange={(e) => setFilters(f => ({ ...f, nombre: e.target.value }))}
                  />
                </div>
              </td>

              {/* Filter Correo */}
              <td className="p-1 border-r border-slate-100" style={{ width: colWidths.email }}>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                  <input
                    type="text"
                    className="w-full pl-6 pr-2 py-1 bg-white border border-slate-100 rounded-md text-xs placeholder-slate-400 focus:outline-none focus:border-institutional-blue text-slate-700 font-medium"
                    placeholder="Filtrar por correo..."
                    value={filters.email}
                    onChange={(e) => setFilters(f => ({ ...f, email: e.target.value }))}
                  />
                </div>
              </td>

              {showRolesAndDeps && (
                <>
                  {/* Filter Rol */}
                  <td className="p-1 border-r border-slate-100" style={{ width: colWidths.rol }}>
                    <select
                      className="w-full py-1 px-1.5 bg-white border border-slate-100 rounded-md text-xs font-semibold text-slate-700 focus:outline-none focus:border-institutional-blue cursor-pointer outline-none"
                      value={filters.rol}
                      onChange={(e) => setFilters(f => ({ ...f, rol: e.target.value }))}
                    >
                      <option value="">Todos los Roles</option>
                      <option value="Funcionario">✅ Funcionario</option>
                      <option value="Analista">🔍 Analista</option>
                      <option value="Administrador">👑 Administrador</option>
                      <option value="AdminFuncional">🛠️ Adm. Funcional</option>
                    </select>
                  </td>

                  {/* Filter Organismo */}
                  <td className="p-1 border-r border-slate-100" style={{ width: colWidths.organismo }}>
                    <select
                      className="w-full py-1 px-1.5 bg-white border border-slate-100 rounded-md text-xs font-semibold text-slate-700 focus:outline-none focus:border-institutional-blue cursor-pointer outline-none truncate block"
                      value={filters.organismo}
                      onChange={(e) => {
                        const newOrg = e.target.value;
                        setFilters(f => ({ ...f, organismo: newOrg, dependencia: '' })); // Limpia sub-dependencias
                      }}
                    >
                      <option value="">Todos los Organismos</option>
                      {organismos.map(org => (
                        <option key={org.id} value={org.id}>{org.nombre}</option>
                      ))}
                    </select>
                  </td>

                  {/* Filter Dependencia recursively */}
                  <td className="p-1" style={{ width: colWidths.dependencia }}>
                    <select
                      className="w-full py-1 px-1.5 bg-white border border-slate-100 rounded-md text-xs font-semibold text-slate-700 focus:outline-none focus:border-institutional-blue cursor-pointer outline-none truncate block"
                      value={filters.dependencia}
                      onChange={(e) => setFilters(f => ({ ...f, dependencia: e.target.value }))}
                    >
                      <option value="">Todas las Dependencias</option>
                      {filteredDependenciesForColumnFilter.map(dep => (
                        <option key={dep.id} value={dep.id}>
                          {dep.nivel && dep.nivel > 2 ? `${'• '.repeat(dep.nivel - 2)} ${dep.nombre}` : dep.nombre}
                        </option>
                      ))}
                    </select>
                  </td>
                </>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 min-h-[300px]">
            {paginatedUsers.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                {/* User Name Cell */}
                <td className="p-2.5 px-3 border-r border-slate-100 shrink-0" style={{ width: colWidths.nombre, minWidth: colWidths.nombre, maxWidth: colWidths.nombre }}>
                  <div className="flex items-center gap-2.5 truncate max-w-full">
                    <div className="w-6.5 h-6.5 rounded-full bg-institutional-blue/10 text-institutional-blue flex items-center justify-center font-bold text-xs shrink-0 select-none">
                      {u.nombre.charAt(0).toUpperCase()}
                    </div>
                    <span 
                      className="font-bold text-slate-800 text-sm truncate block" 
                      title={u.nombre}
                    >
                      {u.nombre}
                    </span>
                  </div>
                </td>

                {/* Email Cell */}
                <td className="p-2.5 px-3 border-r border-slate-100 shrink-0" style={{ width: colWidths.email, minWidth: colWidths.email, maxWidth: colWidths.email }}>
                  <span 
                    className="text-xs font-semibold text-slate-500 truncate block" 
                    title={u.email}
                  >
                    {u.email}
                  </span>
                </td>

                {showRolesAndDeps && (
                  <>
                    {/* Role Selector or Badge */}
                    <td className="p-2.5 px-3 border-r border-slate-100 shrink-0" style={{ width: colWidths.rol, minWidth: colWidths.rol, maxWidth: colWidths.rol }}>
                      <div className="w-full truncate block">
                        {editMode ? (
                          <select
                            value={u.currentRol}
                            onChange={(e) => {
                              const newRol = e.target.value as any;
                              const needsClearDep = newRol === 'Administrador' || newRol === 'AdminFuncional';
                              if (localVigenciaId && u.vu && onUpdateVigenciaUsuario) {
                                onUpdateVigenciaUsuario({ ...u.vu, rol: newRol, idDependencia: needsClearDep ? '' : u.vu.idDependencia });
                              } else if (!localVigenciaId && onUpdateGlobalUsuario) {
                                onUpdateGlobalUsuario({ ...u, rol: newRol, currentRol: newRol, dependenciaId: needsClearDep ? '' : u.currentDepId } as UserType);
                              }
                            }}
                            className="w-full bg-white border border-slate-200 rounded-md px-1.5 py-1 text-xs font-bold text-slate-700 hover:border-institutional-blue transition-colors focus:outline-none cursor-pointer"
                          >
                            <option value="Funcionario">✅ Funcionario</option>
                            <option value="Analista">🔍 Analista</option>
                            <option value="Administrador">👑 Administrador</option>
                            <option value="AdminFuncional">🛠️ Adm. Funcional</option>
                          </select>
                        ) : (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 inline-block truncate max-w-full">
                            {u.currentRol === 'Funcionario' ? '✅ Funcionario' : 
                             u.currentRol === 'Analista' ? '🔍 Analista' : 
                             u.currentRol === 'Administrador' ? '👑 Administrador' : 
                             '🛠️ Adm. Funcional'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Organismo Selector or Text */}
                    <td className="p-2.5 px-3 border-r border-slate-100 shrink-0" style={{ width: colWidths.organismo, minWidth: colWidths.organismo, maxWidth: colWidths.organismo }}>
                      <div className="w-full truncate block">
                        {editMode ? (
                          <select
                            value={u.currentOrgId}
                            disabled={u.currentRol === 'Administrador' || u.currentRol === 'AdminFuncional'}
                            onChange={(e) => {
                              const newOrgId = e.target.value;
                              // Al cambiar organismo superior, se asocia inicialmente a dicho nodo (como root)
                              if (localVigenciaId && u.vu && onUpdateVigenciaUsuario) {
                                onUpdateVigenciaUsuario({ ...u.vu, idDependencia: newOrgId });
                              } else if (!localVigenciaId && onUpdateGlobalUsuario) {
                                onUpdateGlobalUsuario({ ...u, rol: u.currentRol, dependenciaId: newOrgId } as UserType);
                              }
                            }}
                            className={`w-full truncate bg-white border border-slate-200 rounded-md px-1.5 py-1 text-xs font-semibold ${u.currentRol === 'Administrador' || u.currentRol === 'AdminFuncional' ? 'text-slate-400 bg-slate-50 cursor-not-allowed opacity-60' : 'text-slate-700 hover:border-institutional-blue transition-colors focus:outline-none cursor-pointer'}`}
                          >
                            <option value="">-- Sin organismo --</option>
                            {organismos.map(org => (
                              <option key={org.id} value={org.id}>{org.nombre}</option>
                            ))}
                          </select>
                        ) : (
                          <span 
                            className="text-xs font-medium text-slate-600 truncate block max-w-full" 
                            title={(!u.currentOrgId || u.currentOrgId === '') ? '-- Sin organismo --' : u.currentOrgName}
                          >
                            {(!u.currentOrgId || u.currentOrgId === '') ? '-- Sin organismo --' : u.currentOrgName}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Dependency Selector or Text - listings show recursively all descendants! */}
                    <td className="p-2.5 px-3 shrink-0" style={{ width: colWidths.dependencia, minWidth: colWidths.dependencia, maxWidth: colWidths.dependencia }}>
                      <div className="w-full truncate block">
                        {editMode ? (
                          <select
                            value={u.currentDepId}
                            disabled={u.currentRol === 'Administrador' || u.currentRol === 'AdminFuncional' || !u.currentOrgId}
                            onChange={(e) => {
                              const newDepId = e.target.value;
                              const savedId = newDepId || u.currentOrgId; // Si limpia subdependencia, hereda el ID del organismo superior principal
                              if (localVigenciaId && u.vu && onUpdateVigenciaUsuario) {
                                onUpdateVigenciaUsuario({ ...u.vu, idDependencia: savedId });
                              } else if (!localVigenciaId && onUpdateGlobalUsuario) {
                                onUpdateGlobalUsuario({ ...u, rol: u.currentRol, dependenciaId: savedId } as UserType);
                              }
                            }}
                            className={`w-full truncate bg-white border border-slate-200 rounded-md px-1.5 py-1 text-xs font-semibold ${u.currentRol === 'Administrador' || u.currentRol === 'AdminFuncional' || !u.currentOrgId ? 'text-slate-400 bg-slate-50 cursor-not-allowed opacity-60' : 'text-slate-700 hover:border-institutional-blue transition-colors focus:outline-none cursor-pointer'}`}
                          >
                            {!u.currentOrgId ? (
                              <option value="">-- Seleccionar Organismo --</option>
                            ) : (
                              <>
                                <option value="">-- Sin dependencia --</option>
                                {getDescendantDeps(u.currentOrgId).map(dep => (
                                  <option key={dep.id} value={dep.id}>
                                    {dep.nivel && dep.nivel > 2 ? `${'• '.repeat(dep.nivel - 2)} ${dep.nombre}` : dep.nombre}
                                  </option>
                                ))}
                              </>
                            )}
                          </select>
                        ) : (
                          <span 
                            className="text-xs text-slate-500 truncate block max-w-full" 
                            title={(!u.currentDepId || u.currentDepId === '') ? '-- Sin dependencia --' : u.currentDepName}
                          >
                            {(!u.currentDepId || u.currentDepId === '') ? '-- Sin dependencia --' : u.currentDepName}
                          </span>
                        )}
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}

            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={!showRolesAndDeps ? 2 : 5} className="p-8 text-center text-slate-500 text-xs font-medium">
                  No se encontraron usuarios que coincidan con los filtros aplicados. Intentando con otras palabras clave.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {filteredUsers.length > 0 && (
        <div className="px-5 py-3 border-t border-slate-150 bg-slate-50 flex items-center justify-between select-none">
          <p className="text-xs text-slate-500 font-medium hidden sm:block">
            Mostrando <span className="font-bold text-slate-700">{((currentPage - 1) * itemsPerPage) + 1}</span> a <span className="font-bold text-slate-700">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> de <span className="font-bold text-slate-700">{filteredUsers.length}</span> cuentas en total
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className={`p-1.5 rounded-md border transition-all flex items-center gap-1 ${currentPage === 1 ? 'border-transparent text-slate-300 bg-slate-50 cursor-not-allowed' : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50 hover:text-institutional-blue shadow-sm'}`}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-slate-700 px-2 min-w-[40px] text-center">
              {currentPage} / {totalPages > 0 ? totalPages : 1}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className={`p-1.5 rounded-md border transition-all flex items-center gap-1 ${currentPage >= totalPages ? 'border-transparent text-slate-300 bg-slate-50 cursor-not-allowed' : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50 hover:text-institutional-blue shadow-sm'}`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
