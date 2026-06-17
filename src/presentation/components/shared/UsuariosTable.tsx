import React, { useState, useMemo } from 'react';
import { User as UserType, VigenciaUsuario, Organismo, Dependencia, Vigencia } from '../../../domain/models/types';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

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

  const [filters, setFilters] = useState({
    search: '',
    rol: '',
    organismo: '',
    dependencia: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  type SortField = 'nombre' | 'email' | 'currentRol' | 'currentOrgName' | 'currentDepName';
  const [sortConfig, setSortConfig] = useState<{ field: SortField, direction: 'asc' | 'desc' }>({ field: 'nombre', direction: 'asc' });

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

      // Resolve organism and dependency separately:
      // In the database, the user's IdNodoOrg (currentDepId) usually points to a Dependency (Nivel === 2),
      // which has a parentId pointing to an Organismo (Nivel === 1).
      let currentOrgId = '';
      const currentDepObj = dependencias.find(d => d.id === currentDepId);
      if (currentDepObj) {
        currentOrgId = currentDepObj.parentId || '';
      } else {
        // If it points directly to an organism, handle it gracefully
        const currentOrgObj = organismos.find(o => o.id === currentDepId);
        if (currentOrgObj) {
          currentOrgId = currentDepId;
          currentDepId = ''; // pointed at organism, so no sub-dep specified
        }
      }

      const currentOrgName = organismos.find(o => o.id === currentOrgId)?.nombre || 'Sin Organismo';
      const currentDepName = dependencias.find(d => d.id === currentDepId)?.nombre || 'Sin Dependencia';

      return {
        ...u,
        currentRol,
        currentOrgId,
        currentOrgName,
        currentDepId,
        currentDepName,
        vu
      };
    });
  }, [usuarios, vigenciasUsuarios, organismos, dependencias, localVigenciaId, editMode]);

  const filteredUsers = useMemo(() => {
    return mappedUsers.filter(u => {
      const matchSearch = filters.search === '' || 
        u.nombre.toLowerCase().includes(filters.search.toLowerCase()) || 
        u.email.toLowerCase().includes(filters.search.toLowerCase());
      const matchRol = filters.rol === '' || u.currentRol === filters.rol;
      const matchOrg = filters.organismo === '' || u.currentOrgId === filters.organismo;
      const matchDep = filters.dependencia === '' || u.currentDepId === filters.dependencia;

      return matchSearch && matchRol && matchOrg && matchDep;
    });
  }, [mappedUsers, filters]);

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
        className="flex items-center gap-1 font-bold hover:text-institutional-blue transition-colors outline-none text-left group"
      >
        <span>{title}</span>
        {isSorted ? (
          sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-institutional-blue" /> : <ArrowDown size={12} className="text-institutional-blue" />
        ) : (
          <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-50 transition-opacity" />
        )}
      </button>
    );
  };

  // Get filtered dependencies for the filter bar
  const filterBarDependencies = useMemo(() => {
    if (!filters.organismo) return dependencias;
    return dependencias.filter(d => d.parentId === filters.organismo);
  }, [dependencias, filters.organismo]);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200">
      {/* Table Header / Filters */}
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col xl:flex-row gap-4 items-center justify-between">
        <div className="relative w-full xl:max-w-xs shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-institutional-blue transition-colors"
            placeholder="Buscar por nombre o correo..."
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
          />
        </div>
        {showRolesAndDeps && (
        <div className="flex flex-wrap md:flex-nowrap gap-2 w-full justify-start xl:justify-end">
          {/* Vigencia Selector */}
          <div className="flex items-center gap-1.5 shrink-0 bg-white border border-slate-200 px-2 py-1.5 rounded-lg">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Vigencia:</span>
            <select
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer outline-none"
              value={localVigenciaId || ''}
              onChange={(e) => setLocalVigenciaId(e.target.value || null)}
            >
              <option value="">Todas</option>
              {vigencias.map(v => (
                <option key={v.IdVigencia} value={v.IdVigencia}>
                  {v.Nombre} ({v.Estado})
                </option>
              ))}
            </select>
          </div>

          {/* Rol Selector */}
          <select
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-semibold focus:outline-none focus:border-institutional-blue"
            value={filters.rol}
            onChange={(e) => setFilters(f => ({ ...f, rol: e.target.value }))}
          >
            <option value="">Todos los Roles</option>
            <option value="Funcionario">✅ Funcionario</option>
            <option value="Analista">🔍 Analista</option>
            <option value="Administrador">👑 Administrador</option>
            <option value="AdminFuncional">🛠️ Adm. Funcional</option>
          </select>
          
          {/* Organismo Selector */}
          <select
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-semibold focus:outline-none focus:border-institutional-blue max-w-[180px] truncate"
            value={filters.organismo}
            onChange={(e) => {
              const newOrg = e.target.value;
              setFilters(f => ({ ...f, organismo: newOrg, dependencia: '' })); // clear sub-dep
            }}
          >
            <option value="">Todos los Organismos</option>
            {organismos.map(org => (
              <option key={org.id} value={org.id}>{org.nombre}</option>
            ))}
          </select>

          {/* Dependencia Selector */}
          <select
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-semibold focus:outline-none focus:border-institutional-blue max-w-[180px] truncate"
            value={filters.dependencia}
            onChange={(e) => setFilters(f => ({ ...f, dependencia: e.target.value }))}
          >
            <option value="">Todas las Dependencias</option>
            {filterBarDependencies.map(dep => (
              <option key={dep.id} value={dep.id}>{dep.nombre}</option>
            ))}
          </select>
        </div>
        )}
      </div>

      {/* Table Grid */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full table-auto text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50/50 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
            <tr>
              <th className="p-4"><SortHeader title="Nombre del Usuario" field="nombre" /></th>
              <th className="p-4"><SortHeader title="Correo" field="email" /></th>
              {showRolesAndDeps && <th className="p-4"><SortHeader title={!localVigenciaId ? 'Rol Global' : 'Rol en Vigencia'} field="currentRol" /></th>}
              {showRolesAndDeps && <th className="p-4"><SortHeader title="Organismo" field="currentOrgName" /></th>}
              {showRolesAndDeps && <th className="p-4"><SortHeader title="Dependencia" field="currentDepName" /></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 min-h-[300px]">
            {paginatedUsers.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-institutional-blue/10 text-institutional-blue flex items-center justify-center font-bold text-xs shrink-0">
                      {u.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="font-bold text-slate-800 text-sm">{u.nombre}</div>
                  </div>
                </td>
                <td className="p-4 text-xs font-semibold text-slate-500">
                  {u.email}
                </td>
                {showRolesAndDeps && (
                  <>
                    {/* Role Selector */}
                    <td className="p-4">
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
                          className="bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs font-bold text-slate-700 hover:border-institutional-blue transition-colors focus:outline-none"
                        >
                          <option value="Funcionario">✅ Funcionario</option>
                          <option value="Analista">🔍 Analista</option>
                          <option value="Administrador">👑 Administrador</option>
                          <option value="AdminFuncional">🛠️ Adm. Funcional</option>
                        </select>
                      ) : (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 inline-block">
                          {u.currentRol === 'Funcionario' ? '✅ Funcionario' : 
                           u.currentRol === 'Analista' ? '🔍 Analista' : 
                           u.currentRol === 'Administrador' ? '👑 Administrador' : 
                           '🛠️ Adm. Funcional'}
                        </span>
                      )}
                    </td>

                    {/* Organismo Selector */}
                    <td className="p-4">
                      {editMode ? (
                        <select
                          value={u.currentOrgId}
                          disabled={u.currentRol === 'Administrador' || u.currentRol === 'AdminFuncional'}
                          onChange={(e) => {
                            const newOrgId = e.target.value;
                            if (localVigenciaId && u.vu && onUpdateVigenciaUsuario) {
                              onUpdateVigenciaUsuario({ ...u.vu, idDependencia: newOrgId });
                            } else if (!localVigenciaId && onUpdateGlobalUsuario) {
                              onUpdateGlobalUsuario({ ...u, rol: u.currentRol, dependenciaId: newOrgId } as UserType);
                            }
                          }}
                          className={`w-full max-w-[200px] truncate bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs font-semibold ${u.currentRol === 'Administrador' || u.currentRol === 'AdminFuncional' ? 'text-slate-400 bg-slate-50 cursor-not-allowed opacity-60' : 'text-slate-700 hover:border-institutional-blue transition-colors focus:outline-none'}`}
                        >
                          <option value="">-- Sin organismo --</option>
                          {organismos.map(org => (
                            <option key={org.id} value={org.id}>{org.nombre}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs font-medium text-slate-600 truncate block max-w-[180px]" title={u.currentOrgName}>
                          {(!u.currentOrgId || u.currentOrgId === '') ? '-- Sin organismo --' : u.currentOrgName}
                        </span>
                      )}
                    </td>

                    {/* Dependencia Selector */}
                    <td className="p-4">
                      {editMode ? (
                        <select
                          value={u.currentDepId}
                          disabled={u.currentRol === 'Administrador' || u.currentRol === 'AdminFuncional' || !u.currentOrgId}
                          onChange={(e) => {
                            const newDepId = e.target.value;
                            const savedId = newDepId || u.currentOrgId; // Fallback to entire organism if sub-dep is empty/cleared
                            if (localVigenciaId && u.vu && onUpdateVigenciaUsuario) {
                              onUpdateVigenciaUsuario({ ...u.vu, idDependencia: savedId });
                            } else if (!localVigenciaId && onUpdateGlobalUsuario) {
                              onUpdateGlobalUsuario({ ...u, rol: u.currentRol, dependenciaId: savedId } as UserType);
                            }
                          }}
                          className={`w-full max-w-[200px] truncate bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs font-semibold ${u.currentRol === 'Administrador' || u.currentRol === 'AdminFuncional' || !u.currentOrgId ? 'text-slate-400 bg-slate-50 cursor-not-allowed opacity-60' : 'text-slate-700 hover:border-institutional-blue transition-colors focus:outline-none'}`}
                        >
                          {!u.currentOrgId ? (
                            <option value="">-- Seleccionar Organismo --</option>
                          ) : (
                            <>
                              <option value="">-- Sin dependencia --</option>
                              {dependencias.filter(d => d.parentId === u.currentOrgId).map(dep => (
                                <option key={dep.id} value={dep.id}>{dep.nombre}</option>
                              ))}
                            </>
                          )}
                        </select>
                      ) : (
                        <span className="text-xs text-slate-500 truncate block max-w-[180px]" title={u.currentDepName}>
                          {(!u.currentDepId || u.currentDepId === '') ? '-- Sin dependencia --' : u.currentDepName}
                        </span>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}

            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={!showRolesAndDeps ? 2 : 5} className="p-8 text-center text-slate-500">
                  No se encontraron usuarios que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredUsers.length > 0 && (
        <div className="px-5 py-3 border-t border-slate-100 bg-white flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium hidden sm:block">
            Mostrando <span className="font-bold text-slate-700">{((currentPage - 1) * itemsPerPage) + 1}</span> a <span className="font-bold text-slate-700">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> de <span className="font-bold text-slate-700">{filteredUsers.length}</span> cuentas
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className={`p-1.5 rounded-md border transition-all flex items-center gap-1 ${currentPage === 1 ? 'border-transparent text-slate-300 bg-slate-50 cursor-not-allowed' : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50 hover:text-institutional-blue shadow-sm'}`}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-slate-700 px-2">
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
