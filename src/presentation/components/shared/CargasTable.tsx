import React, { useState, useMemo } from 'react';
import { Eye, Edit2, Trash2, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { User, Actividad, Dependencia, Procedimiento } from '../../../domain/models/types';
import { calculateETP } from '../../../application/utils/calculations';

interface CargasTableProps {
  cargas: any[];
  actividades: Actividad[];
  dependencias: Dependencia[];
  procedimientos: Procedimiento[];
  currentUser: User;
  onViewDetails: (carga: any) => void;
  onEdit?: (carga: any) => void;
  onDelete?: (cargaId: string) => void;
}

export const CargasTable: React.FC<CargasTableProps> = ({
  cargas, actividades, dependencias, procedimientos, currentUser, onViewDetails, onEdit, onDelete
}) => {
  const isFuncionario = currentUser.rol === 'Funcionario';

  const [filters, setFilters] = useState({
    fecha: '',
    dependencia: '',
    procedimiento: '',
    actividad: '',
    autor: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  type SortField = 'dateValue' | 'depName' | 'prodName' | 'actName' | 'autorName' | 'volumenQ' | 'etp';
  const [sortConfig, setSortConfig] = useState<{ field: SortField, direction: 'asc' | 'desc' }>({ field: 'dateValue', direction: 'desc' });

  const mappedCargas = useMemo(() => {
    return cargas.map(carga => {
      let actName = actividades.find(a => a.id === carga.actividadId)?.nombre || 'Actividad Desconocida';
      if (carga.actividadId === "actividad_no_documentada") {
        actName = 'ACTIVIDAD NO DOCUMENTADA';
      }
      const depName = dependencias.find(d => d.id === carga.dependenciaId)?.nombre || 'Sin Dependencia';
      const prodName = procedimientos.find(p => p.id === carga.procedimientoId)?.nombre || 'Sin Procedimiento';
      const dateValue = new Date(carga.createdAt || Date.now());
      const dateStr = dateValue.toLocaleDateString();
      const autorName = carga.autor || 'N/A';
      const etp = calculateETP(carga).ETP;
      return { ...carga, actName, depName, prodName, dateStr, dateValue, autorName, etp, descDoc: carga.descripcionActividad };
    });
  }, [cargas, actividades, dependencias, procedimientos]);

  const filteredCargas = useMemo(() => {
    return mappedCargas.filter(carga => {
      const matchFecha = filters.fecha === '' || carga.dateStr === filters.fecha;
      const matchDep = filters.dependencia === '' || carga.depName === filters.dependencia;
      const matchProd = filters.procedimiento === '' || carga.prodName === filters.procedimiento;
      const matchAct = filters.actividad === '' || carga.actName === filters.actividad;
      const matchAutor = filters.autor === '' || carga.autorName === filters.autor;
      return matchFecha && matchDep && matchProd && matchAct && matchAutor;
    });
  }, [mappedCargas, filters]);

  // Extracts possible options honoring all active filters EXCEPT the one we are evaluating
  const extractUniqueValues = (field: 'dateStr' | 'depName' | 'prodName' | 'actName' | 'autorName', currentFieldName: string) => {
    const applicableCargas = mappedCargas.filter(carga => {
      const matchFecha = filters.fecha === '' || currentFieldName === 'fecha' || carga.dateStr === filters.fecha;
      const matchDep = filters.dependencia === '' || currentFieldName === 'dependencia' || carga.depName === filters.dependencia;
      const matchProd = filters.procedimiento === '' || currentFieldName === 'procedimiento' || carga.prodName === filters.procedimiento;
      const matchAct = filters.actividad === '' || currentFieldName === 'actividad' || carga.actName === filters.actividad;
      const matchAutor = filters.autor === '' || currentFieldName === 'autor' || carga.autorName === filters.autor;
      return matchFecha && matchDep && matchProd && matchAct && matchAutor;
    });
    
    if (field === 'dateStr') {
      return Array.from(new Set(applicableCargas.map(c => c[field])));
    }
    return Array.from(new Set(applicableCargas.map(c => c[field]))).sort();
  };

  const uniqueFechas = useMemo(() => extractUniqueValues('dateStr', 'fecha'), [mappedCargas, filters]);
  const uniqueDependencias = useMemo(() => extractUniqueValues('depName', 'dependencia'), [mappedCargas, filters]);
  const uniqueProcedimientos = useMemo(() => extractUniqueValues('prodName', 'procedimiento'), [mappedCargas, filters]);
  const uniqueActividades = useMemo(() => extractUniqueValues('actName', 'actividad'), [mappedCargas, filters]);
  const uniqueAutores = useMemo(() => extractUniqueValues('autorName', 'autor'), [mappedCargas, filters]);

  useMemo(() => {
    setCurrentPage(1);
  }, [filters]);

  const totalPages = Math.ceil(filteredCargas.length / itemsPerPage);

  const sortedCargas = useMemo(() => {
    let sortableItems = [...filteredCargas];
    sortableItems.sort((a, b) => {
      let aValue = a[sortConfig.field];
      let bValue = b[sortConfig.field];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }

      // Handle numbers or dates
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sortableItems;
  }, [filteredCargas, sortConfig]);

  const paginatedCargas = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedCargas.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedCargas, currentPage]);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(p => p + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(p => p - 1);
  };

  const totals = useMemo(() => {
    return filteredCargas.reduce((acc, curr) => {
      acc.volumenQ += Number(curr.volumenQ) || 0;
      acc.etp += Number(curr.etp) || 0;
      return acc;
    }, { volumenQ: 0, etp: 0 });
  }, [filteredCargas]);

  if (cargas.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 border border-dashed border-slate-300 rounded-xl bg-slate-50">
        No hay registros disponibles para mostrar en este momento.
      </div>
    );
  }

  const SortHeader = ({ title, field }: { title: string, field: SortField }) => {
    const isSorted = sortConfig.field === field;
    return (
      <button 
        onClick={() => {
          let direction: 'asc' | 'desc' = 'asc';
          if (isSorted && sortConfig.direction === 'asc') direction = 'desc';
          setSortConfig({ field, direction });
        }}
        className="flex items-center gap-1 font-bold mb-2 hover:text-institutional-blue transition-colors outline-none w-full text-left group"
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
    <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200">
      <table className="w-full table-auto text-left text-sm whitespace-nowrap">
        <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
          <tr>
            <th className="p-4 align-top w-auto resizable-th">
              <SortHeader title="Fecha" field="dateValue" />
              <select
                className="w-full px-2 py-1 text-xs border border-slate-200 rounded text-slate-700 font-normal focus:outline-none focus:border-institutional-blue max-w-[110px]"
                value={filters.fecha}
                onChange={e => setFilters(f => ({ ...f, fecha: e.target.value }))}
              >
                <option value="">Todas</option>
                {uniqueFechas.map(f => <option key={f as string} value={f as string}>{f as string}</option>)}
              </select>
            </th>
            {!isFuncionario && (
              <th className="p-4 align-top w-auto resizable-th">
                <SortHeader title="Dependencia" field="depName" />
                <select
                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded text-slate-700 font-normal focus:outline-none focus:border-institutional-blue truncate max-w-full"
                  value={filters.dependencia}
                  onChange={e => setFilters(f => ({ ...f, dependencia: e.target.value }))}
                >
                  <option value="">Todas</option>
                  {uniqueDependencias.map(d => <option key={d as string} value={d as string}>{d as string}</option>)}
                </select>
              </th>
            )}
            <th className="p-4 align-top w-auto resizable-th">
              <SortHeader title="Procedimiento" field="prodName" />
              <select
                className="w-full px-2 py-1 text-xs border border-slate-200 rounded text-slate-700 font-normal focus:outline-none focus:border-institutional-blue truncate max-w-full"
                value={filters.procedimiento}
                onChange={e => setFilters(f => ({ ...f, procedimiento: e.target.value }))}
              >
                <option value="">Todos</option>
                {uniqueProcedimientos.map(p => <option key={p as string} value={p as string}>{p as string}</option>)}
              </select>
            </th>
            <th className="p-4 align-top w-auto resizable-th">
              <SortHeader title="Actividad" field="actName" />
              <select
                className="w-full px-2 py-1 text-xs border border-slate-200 rounded text-slate-700 font-normal focus:outline-none focus:border-institutional-blue truncate max-w-full"
                value={filters.actividad}
                onChange={e => setFilters(f => ({ ...f, actividad: e.target.value }))}
              >
                <option value="">Todas</option>
                {uniqueActividades.map(a => <option key={a as string} value={a as string}>{a as string}</option>)}
              </select>
            </th>
            {!isFuncionario && (
              <th className="p-4 align-top w-auto resizable-th">
                <SortHeader title="Autor" field="autorName" />
                <select
                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded text-slate-700 font-normal focus:outline-none focus:border-institutional-blue truncate max-w-[110px]"
                  value={filters.autor}
                  onChange={e => setFilters(f => ({ ...f, autor: e.target.value }))}
                >
                  <option value="">Todos</option>
                  {uniqueAutores.map(a => <option key={a as string} value={a as string}>{a as string}</option>)}
                </select>
              </th>
            )}
            <th className="p-4 text-right align-top w-auto resizable-th">
              <SortHeader title="Volumen" field="volumenQ" />
              <div className="text-xs font-bold text-institutional-blue mt-1 border border-institutional-blue/20 bg-institutional-blue/5 rounded px-2 py-1 inline-block whitespace-nowrap">
                {totals.volumenQ.toLocaleString()}
              </div>
            </th>
            {!isFuncionario && (
            <th className="p-4 text-right align-top w-auto resizable-th">
              <SortHeader title="ETP" field="etp" />
              <div className="text-xs font-bold text-institutional-blue mt-1 border border-institutional-blue/20 bg-institutional-blue/5 rounded px-2 py-1 inline-block whitespace-nowrap">
                {totals.etp.toFixed(2)}
              </div>
            </th>
            )}
            <th className="p-4 text-center align-top w-24">
              <div className="mb-2">Acciones</div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 min-h-[500px]">
          {paginatedCargas.map(carga => {
            return (
              <tr key={carga.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-4 text-xs text-slate-500 whitespace-nowrap">{carga.dateStr}</td>
                {!isFuncionario && (
                  <td className="p-4">
                    <span className="text-xs text-slate-700 whitespace-normal block" title={carga.depName}>{carga.depName}</span>
                  </td>
                )}
                <td className="p-4">
                  <span className="text-xs text-slate-700 whitespace-normal block" title={carga.prodName}>{carga.prodName}</span>
                </td>
                <td className="p-4">
                  <div className="text-xs text-slate-700 whitespace-normal block font-medium" title={carga.actName}>
                    {carga.actName}
                  </div>
                  {carga.actividadId === "actividad_no_documentada" && carga.descDoc && (
                    <div className="text-[10px] text-amber-600 font-bold block mt-0.5 leading-tight uppercase">
                      Nombre: {carga.descDoc}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{carga.id.substring(0, 8)}</div>
                </td>
                {!isFuncionario && (
                  <td className="p-4">
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold tracking-wider">
                      {carga.autorName}
                    </span>
                  </td>
                )}
                <td className="p-4 text-right">
                  <div className="text-xs text-slate-700 font-medium">{carga.volumenQ}</div>
                  <div className="text-[10px] text-slate-400">{carga.frecuencia}</div>
                </td>
                {!isFuncionario && (
                <td className="p-4 text-right">
                  <span className="font-bold text-institutional-blue">{carga.etp.toFixed(2)}</span>
                </td>
                )}
                <td className="p-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onViewDetails(carga)}
                      className="p-1.5 text-slate-400 hover:text-institutional-blue hover:bg-blue-50 rounded-lg transition-colors"
                      title="Ver Detalles"
                    >
                      <Eye size={16} />
                    </button>
                    {onEdit && (
                      <button
                        onClick={() => onEdit(carga)}
                        className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(carga.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {filteredCargas.length === 0 && (
            <tr>
              <td colSpan={isFuncionario ? 5 : 8} className="p-8 text-center text-slate-500 bg-slate-50 border-t border-slate-100">
                No hay coincidencias para los filtros aplicados.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {filteredCargas.length > 0 && (
        <div className="px-5 py-4 border-t border-slate-100 bg-white flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium hidden sm:block">
            Mostrando <span className="font-bold text-slate-700">{((currentPage - 1) * itemsPerPage) + 1}</span> a <span className="font-bold text-slate-700">{Math.min(currentPage * itemsPerPage, filteredCargas.length)}</span> de <span className="font-bold text-slate-700">{filteredCargas.length}</span> registros
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className={`p-1.5 rounded-md border transition-all flex items-center gap-1 ${currentPage === 1 ? 'border-transparent text-slate-300 bg-slate-50 cursor-not-allowed' : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50 hover:text-institutional-blue shadow-sm'}`}
            >
              <ChevronLeft size={16} />
              <span className="text-xs font-semibold pr-1">Ant</span>
            </button>
            <span className="text-xs font-bold text-slate-700 px-2 flex items-center min-w-[60px] justify-center">
              Pág {currentPage} / {totalPages > 0 ? totalPages : 1}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className={`p-1.5 rounded-md border transition-all flex items-center gap-1 ${currentPage >= totalPages ? 'border-transparent text-slate-300 bg-slate-50 cursor-not-allowed' : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50 hover:text-institutional-blue shadow-sm'}`}
            >
              <span className="text-xs font-semibold pl-1">Sig</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
