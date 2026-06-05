import React, { useState, useMemo } from 'react';
import { User as UserType, VigenciaUsuario, Dependencia } from '../../../domain/models/types';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface UsuariosTableProps {
  usuarios: UserType[];
  vigenciasUsuarios?: VigenciaUsuario[];
  dependencias: Dependencia[];
  selectedVigenciaId?: string;
  editMode: boolean; // if true, shows selects for role and dependency
  onUpdateVigenciaUsuario?: (vu: VigenciaUsuario) => void;
  showRolesAndDeps?: boolean;
}

export const UsuariosTable: React.FC<UsuariosTableProps> = ({
  usuarios,
  vigenciasUsuarios = [],
  dependencias,
  selectedVigenciaId,
  editMode,
  onUpdateVigenciaUsuario,
  showRolesAndDeps = true
}) => {
  const [filters, setFilters] = useState({
    search: '',
    rol: '',
    dependencia: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  type SortField = 'nombre' | 'email' | 'currentRol' | 'currentDepName';
  const [sortConfig, setSortConfig] = useState<{ field: SortField, direction: 'asc' | 'desc' }>({ field: 'nombre', direction: 'asc' });

  // Enhance users with vigencia info if applicable
  const mappedUsers = useMemo(() => {
    return usuarios.map(u => {
      let currentRol = u.rol || 'Funcionario';
      let currentDepId = u.dependenciaId || '';
      let vu: VigenciaUsuario | undefined = undefined;

      if (selectedVigenciaId) {
        vu = vigenciasUsuarios.find(x => x.idUsuario === u.id && String(x.idVigencia) === String(selectedVigenciaId));
        if (vu) {
          currentRol = vu.rol;
          currentDepId = vu.idDependencia || '';
        } else if (editMode) {
          // Default mock object if none exists and we are editing
          vu = {
            idVigenciaUsuario: `VU-NEW-${Math.random()}`,
            idVigencia: selectedVigenciaId,
            idUsuario: u.id,
            rol: currentRol,
            idDependencia: currentDepId
          };
        }
      }

      const currentDepName = dependencias.find(d => d.id === currentDepId)?.nombre || 'Sin Dependencia';

      return {
        ...u,
        currentRol,
        currentDepId,
        currentDepName,
        vu
      };
    });
  }, [usuarios, vigenciasUsuarios, dependencias, selectedVigenciaId, editMode]);

  const filteredUsers = useMemo(() => {
    return mappedUsers.filter(u => {
      const matchSearch = filters.search === '' || 
        u.nombre.toLowerCase().includes(filters.search.toLowerCase()) || 
        u.email.toLowerCase().includes(filters.search.toLowerCase());
      const matchRol = filters.rol === '' || u.currentRol === filters.rol;
      const matchDep = filters.dependencia === '' || u.currentDepId === filters.dependencia;

      return matchSearch && matchRol && matchDep;
    });
  }, [mappedUsers, filters]);

  // Unique options for filters
  const extractUniqueValues = (field: 'currentRol' | 'currentDepId', currentFieldName: string) => {
    const applicable = mappedUsers.filter(u => {
      const matchSearch = filters.search === '' || u.nombre.toLowerCase().includes(filters.search.toLowerCase()) || u.email.toLowerCase().includes(filters.search.toLowerCase());
      const matchRol = filters.rol === '' || currentFieldName === 'rol' || u.currentRol === filters.rol;
      const matchDep = filters.dependencia === '' || currentFieldName === 'dependencia' || u.currentDepId === filters.dependencia;
      return matchSearch && matchRol && matchDep;
    });
    return Array.from(new Set(applicable.map(u => u[field])));
  };

  const uniqueRoles = useMemo(() => extractUniqueValues('currentRol', 'rol'), [mappedUsers, filters]);
  const uniqueDepIds = useMemo(() => extractUniqueValues('currentDepId', 'dependencia'), [mappedUsers, filters]);

  useMemo(() => {
    setCurrentPage(1);
  }, [filters]);

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

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200">
      {/* Table Header / Filters */}
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
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
        <div className="flex gap-2 w-full sm:w-auto">
          <select
            className="w-full sm:w-auto px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-institutional-blue"
            value={filters.rol}
            onChange={(e) => setFilters(f => ({ ...f, rol: e.target.value }))}
          >
            <option value="">Todos los Roles</option>
            {uniqueRoles.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          
          <select
            className="w-full sm:w-auto px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-institutional-blue max-w-[200px] truncate"
            value={filters.dependencia}
            onChange={(e) => setFilters(f => ({ ...f, dependencia: e.target.value }))}
          >
            <option value="">Todas las Dependencias</option>
            {uniqueDepIds.filter(id => id).map(id => {
               const depName = dependencias.find(d => d.id === id)?.nombre || 'Desconocida';
               return <option key={id} value={id}>{depName}</option>;
            })}
          </select>
        </div>
        )}
      </div>

      {/* Table Grid */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full table-auto text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50/50 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
            <tr>
              <th className="p-4 resizable-th w-auto"><SortHeader title="Nombre del Usuario" field="nombre" /></th>
              <th className="p-4 resizable-th w-auto"><SortHeader title="Correo Institucional" field="email" /></th>
              {showRolesAndDeps && <th className="p-4 resizable-th w-auto"><SortHeader title={editMode ? 'Rol en Vigencia' : selectedVigenciaId ? 'Rol (Vigencia Activa)' : 'Rol (Global)'} field="currentRol" /></th>}
              {showRolesAndDeps && <th className="p-4 resizable-th w-auto"><SortHeader title={editMode ? 'Dependencia' : selectedVigenciaId ? 'Dependencia (Vigencia Activa)' : 'Dependencia (Global)'} field="currentDepName" /></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 min-h-[300px]">
            {paginatedUsers.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-institutional-blue/10 text-institutional-blue flex items-center justify-center font-bold text-xs shrink-0">
                      {u.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="font-bold text-slate-800 text-sm">{u.nombre}</div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-xs text-slate-500">{u.email}</div>
                </td>
                {showRolesAndDeps && (
                  <>
                <td className="p-4">
                  {editMode ? (
                    <select
                      value={u.currentRol}
                      onChange={(e) => {
                        if (u.vu && onUpdateVigenciaUsuario) {
                          onUpdateVigenciaUsuario({ ...u.vu, rol: e.target.value as any });
                        }
                      }}
                      className="w-full min-w-[150px] bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs font-medium text-slate-700 hover:border-institutional-blue transition-colors focus:outline-none"
                    >
                      <option value="Funcionario">✅ Funcionario</option>
                      <option value="Analista">🔍 Analista</option>
                      <option value="Administrador">👑 Administrador</option>
                      <option value="AdminFuncional">🛠️ Adm. Funcional</option>
                    </select>
                  ) : (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 inline-block">
                      {u.currentRol === 'Funcionario' ? '✅ Funcionario' : 
                       u.currentRol === 'Analista' ? '🔍 Analista' : 
                       u.currentRol === 'Administrador' ? '👑 Administrador' : 
                       '🛠️ Adm. Funcional'}
                    </span>
                  )}
                </td>
                <td className="p-4">
                  {editMode ? (
                    <select
                      value={u.currentDepId}
                      onChange={(e) => {
                         if (u.vu && onUpdateVigenciaUsuario) {
                           onUpdateVigenciaUsuario({ ...u.vu, idDependencia: e.target.value });
                         }
                      }}
                      className={`w-full min-w-[150px] bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs font-medium text-slate-700 hover:border-institutional-blue transition-colors focus:outline-none`}
                    >
                      <option value="">-- Global --</option>
                      {dependencias.map(d => (
                        <option key={d.id} value={d.id}>{d.nombre}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs text-slate-600 truncate block max-w-[200px]" title={u.currentDepName}>
                      {(!u.currentDepId || u.currentDepId === '') ? '-- Global --' : u.currentDepName}
                    </span>
                  )}
                </td>
                  </>
                )}
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={!showRolesAndDeps ? 2 : editMode ? 4 : 4} className="p-8 text-center text-slate-500">
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
