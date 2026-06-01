import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileSpreadsheet } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { calculateETP } from '../../application/utils/calculations';
import { Dependencia, User, Actividad, Organismo, Proceso, Procedimiento } from '../../domain/models/types';
import { CargasTable } from '../components/shared/CargasTable';
import { RecordDetailsModal } from '../components/shared/RecordDetailsModal';

interface ReportesModuleProps {
  cargas: any[];
  organismos: Organismo[];
  dependencias: Dependencia[];
  procesos: Proceso[];
  procedimientos: Procedimiento[];
  actividades: Actividad[];
  currentUser: User;
}

export const ReportesModule: React.FC<ReportesModuleProps> = ({ 
  cargas, 
  organismos,
  dependencias, 
  procesos,
  procedimientos,
  actividades, 
  currentUser 
}) => {
  const [selectedRecordDetails, setSelectedRecordDetails] = useState<any | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const reportData = useMemo(() => {
    const viewCargas = currentUser.rol === 'Funcionario' 
      ? cargas.filter(c => c.userId === currentUser.id)
      : (currentUser.rol === 'Analista' && currentUser.dependenciaId)
      ? cargas.filter(c => c.dependenciaId === currentUser.dependenciaId)
      : cargas; 

    return viewCargas;
  }, [cargas, currentUser]);

  const handleExportExcel = async () => {
    if (reportData.length === 0) return;
    setIsExporting(true);

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = currentUser.nombre;
      workbook.created = new Date();

      // ============== SHEET 1: ESTUDIO VS PLANTA ============== 
      const sheet1 = workbook.addWorksheet('Estudio vs Planta', { views: [{ showGridLines: false }] });
      
      // Header configuration
      sheet1.mergeCells('A1:I1');
      const titleCell = sheet1.getCell('A1');
      titleCell.value = 'RESULTADO ESTUDIO CARGAS DE TRABAJO';
      titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF004B23' } }; // Dark green
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

      // Row 2: Main Headers
      sheet1.mergeCells('A2:A3'); sheet1.getCell('A2').value = 'ORGANISMO / DEPENDENCIA (Jerarquía)';
      sheet1.mergeCells('B2:B3'); sheet1.getCell('B2').value = 'RELACIÓN';
      
      sheet1.mergeCells('C2:G2'); sheet1.getCell('C2').value = 'NIVEL JERÁRQUICO (Calculado ETP)';
      sheet1.mergeCells('H2:H3'); sheet1.getCell('H2').value = 'TOTAL SERVIDORES (Requeridos)';
      sheet1.mergeCells('I2:I3'); sheet1.getCell('I2').value = 'ETP TOTAL CORTO';

      // Row 3: Sub Headers
      sheet1.getCell('C3').value = 'DIRECTIVO';
      sheet1.getCell('D3').value = 'ASESOR';
      sheet1.getCell('E3').value = 'PROFESIONAL';
      sheet1.getCell('F3').value = 'TÉCNICO';
      sheet1.getCell('G3').value = 'ASISTENCIAL';

      // Header styling
      const headerRows = [sheet1.getRow(2), sheet1.getRow(3)];
      headerRows.forEach(row => {
        row.eachCell(cell => {
          if (!cell.value) return;
          cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF007236' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
          };
        });
      });

      // Data Process for Sheet 1
      let currentRowInfo = 4;
      // Build map of top level Organismo for each Dependencia
      const getTopOrgId = (depId: string): string | null => {
        let curr = depId;
        for (let i=0; i<10; i++) {
          if (organismos.some(o => o.id === curr)) return curr;
          const dep = dependencias.find(d => d.id === curr);
          if (!dep || !dep.parentId) return null;
          curr = dep.parentId;
        }
        return null;
      };

      const orgGroups: Record<string, typeof dependencias> = {};
      organismos.forEach(o => orgGroups[o.id] = []);
      const orphanDeps: typeof dependencias = [];

      dependencias.forEach(dep => {
        const topOrgId = getTopOrgId(dep.id);
        if (topOrgId && orgGroups[topOrgId]) {
          orgGroups[topOrgId].push(dep);
        } else {
          orphanDeps.push(dep);
        }
      });
      
      // We also need an "Otros" organismo to catch these 
      const proxyOtros = { id: 'otros_org', nombre: 'Otras Dependencias sin Organismo Mapeado', estado: 'Activo' as "Activo" | "Inactivo", vigenciaId: '', color: '' as any };
      const allOrgs = [...organismos];
      if (orphanDeps.length > 0) {
        allOrgs.push(proxyOtros);
        orgGroups['otros_org'] = orphanDeps;
      }

      // Also capture completely orphaned cargas
      const getCargaDirectOrg = (c: any) => {
        let dep = dependencias.find(d => d.id === c.dependenciaId);
        if (dep) return getTopOrgId(dep.id);
        if (organismos.find(o => o.id === c.dependenciaId)) return c.dependenciaId;
        if (organismos.find(o => o.id === c.organismoId)) return c.organismoId;
        return null;
      };

      const trulyOrphanCargas = reportData.filter(c => !getCargaDirectOrg(c));
      if (trulyOrphanCargas.length > 0) {
        if (!orgGroups['otros_org']) {
           allOrgs.push(proxyOtros);
           orgGroups['otros_org'] = [];
        }
        // Dummy dependencia for orphan cargas
        orgGroups['otros_org'].push({ id: 'orphan_cargas', nombre: 'Registros Huérfanos', parentId: 'otros_org', estado: 'Activo', vigenciaId: '' });
      }

      let grandTotals = { dir: 0, ase: 0, prof: 0, tec: 0, asis: 0, sum: 0, sumEtp: 0 };

      // Ensure we iterate all organismos, even those without nested dependencias to show full structure if needed.
      // But we will primarily process those with dependencies or direct charges.
      allOrgs.forEach(org => {
        const orgDeps = orgGroups[org.id] || [];
        
        let orgTotals = { dir: 0, ase: 0, prof: 0, tec: 0, asis: 0, sum: 0, sumEtp: 0 };

        // Print Organismo Header Row
        const orgRow = sheet1.addRow([
          `🏛️ ${org.nombre}`, 'Organismo',
          '', '', '', '', '', '', ''
        ]);
        orgRow.eachCell(c => {
          c.font = { bold: true, size: 11, color: { argb: 'FF004B23' } };
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
        });

        const allItems = [{ id: org.id, nombre: `${org.nombre} (Directo)`, isOrgData: true }, ...orgDeps];
        
        allItems.forEach(dep => {
          let depCargas = [];
          if (dep.id === 'orphan_cargas') {
             depCargas = trulyOrphanCargas;
          } else if ((dep as any).isOrgData) {
             // Cargas placed directly on the Organismo, meaning no specific Dependencia matches
             depCargas = reportData.filter(c => c.organismoId === dep.id && !dependencias.some(d => d.id === c.dependenciaId));
          } else {
             depCargas = reportData.filter(c => c.dependenciaId === dep.id);
          }
          
          if ((dep as any).isOrgData && depCargas.length === 0) return;

          let etp = {
            dir: 0, ase: 0, prof: 0, tec: 0, asis: 0, total: 0
          };

          depCargas.forEach(c => {
            const val = calculateETP(c).ETP || 0;
            const rol = c.rolEjecutor?.toLowerCase() || '';
            if (rol.includes('directivo')) etp.dir += val;
            else if (rol.includes('asesor')) etp.ase += val;
            else if (rol.includes('profesional')) etp.prof += val;
            else if (rol.includes('técnico') || rol.includes('tecnico')) etp.tec += val;
            else if (rol.includes('asistencial')) etp.asis += val;
            
            etp.total += val;
          });

          // People needed using ceiling
          const req = {
            dir: Math.ceil(etp.dir),
            ase: Math.ceil(etp.ase),
            prof: Math.ceil(etp.prof),
            tec: Math.ceil(etp.tec),
            asis: Math.ceil(etp.asis),
            total: Math.ceil(etp.total)
          };

          const row = sheet1.addRow([
            `      ↳ ${dep.nombre}`, 'Dependencia', 
            req.dir, req.ase, req.prof, req.tec, req.asis, 
            req.dir + req.ase + req.prof + req.tec + req.asis,
            Number(etp.total.toFixed(2))
          ]);

          row.eachCell({ includeEmpty: false }, cell => {
            cell.border = { top: { style: 'hair' }, bottom: { style: 'hair' } };
            cell.alignment = { vertical: 'middle' };
            if (Number(cell.col) >= 3) cell.alignment.horizontal = 'center';
          });

          // Aggregate
          orgTotals.dir += req.dir;
          orgTotals.ase += req.ase;
          orgTotals.prof += req.prof;
          orgTotals.tec += req.tec;
          orgTotals.asis += req.asis;
          orgTotals.sum += (req.dir + req.ase + req.prof + req.tec + req.asis);
          orgTotals.sumEtp += etp.total;
        });

        // Update Organismo Header Row with its Subtotals
        if (orgDeps.length > 0) {
           orgRow.getCell(3).value = orgTotals.dir;
           orgRow.getCell(4).value = orgTotals.ase;
           orgRow.getCell(5).value = orgTotals.prof;
           orgRow.getCell(6).value = orgTotals.tec;
           orgRow.getCell(7).value = orgTotals.asis;
           orgRow.getCell(8).value = orgTotals.sum;
           orgRow.getCell(9).value = Number(orgTotals.sumEtp.toFixed(2));
           [3,4,5,6,7,8,9].forEach(col => orgRow.getCell(col).alignment = { horizontal: 'center' });
        }

        grandTotals.dir += orgTotals.dir;
        grandTotals.ase += orgTotals.ase;
        grandTotals.prof += orgTotals.prof;
        grandTotals.tec += orgTotals.tec;
        grandTotals.asis += orgTotals.asis;
        grandTotals.sum += orgTotals.sum;
        grandTotals.sumEtp += orgTotals.sumEtp;
      });

      // Grand Total
      const totalRow = sheet1.addRow([
        'TOTAL GENERAL INSTITUCIÓN', '', 
        grandTotals.dir, grandTotals.ase, grandTotals.prof, grandTotals.tec, grandTotals.asis, grandTotals.sum, Number(grandTotals.sumEtp.toFixed(2))
      ]);
      totalRow.eachCell(c => {
        c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF004B23' } };
      });
      totalRow.getCell(1).alignment = { horizontal: 'left' };
      [3,4,5,6,7,8,9].forEach(col => totalRow.getCell(col).alignment = { horizontal: 'center' });

      sheet1.getColumn(1).width = 50;
      sheet1.getColumn(2).width = 15;
      [3,4,5,6,7,8,9].forEach(col => sheet1.getColumn(col).width = 15);


      // ============== SHEET 2: REGISTROS ============== 
      const sheet2 = workbook.addWorksheet('Registros');
      
      const headerCols = [
        { header: 'ID', key: 'id', width: 15 },
        { header: 'Fecha Creación', key: 'fecha', width: 15 },
        { header: 'Autor', key: 'autor', width: 25 },
        { header: 'Rol Sistema', key: 'sys_rol', width: 15 },
        { header: 'Organismo', key: 'org', width: 30 },
        { header: 'Dependencia', key: 'dep', width: 35 },
        { header: 'Proceso', key: 'proc', width: 35 },
        { header: 'Procedimiento', key: 'pcd', width: 35 },
        { header: 'Actividad', key: 'act', width: 45 },
        { header: 'Detalle (No Documentada)', key: 'desc_act', width: 30 },
        { header: 'Nivel Ejecutor', key: 'rolEjecutor', width: 20 },
        { header: 'Tiempo Mínimo (Min)', key: 't_min', width: 18 },
        { header: 'Tiempo Normal (Min)', key: 't_nor', width: 18 },
        { header: 'Tiempo Máximo (Min)', key: 't_max', width: 18 },
        { header: 'Frecuencia', key: 'frec', width: 15 },
        { header: 'Volumen', key: 'vol', width: 15 },
        { header: 'Volumen Anual', key: 'vol_anual', width: 15 },
        { header: 'Equivalente ETP', key: 'etp', width: 18 }
      ];
      
      sheet2.columns = headerCols;

      // Header styling
      sheet2.getRow(1).eachCell(c => {
        c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF007236' } }; // Institutional green
        c.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      reportData.forEach(r => {
        const dep = dependencias.find(d => d.id === r.dependenciaId);
        const org = organismos.find(o => o.id === r.organismoId || o.id === dep?.parentId);
        const proc = procesos.find(p => p.id === r.procesoId);
        const pcd = procedimientos.find(p => p.id === r.procedimientoId);
        const act = actividades.find(a => a.id === r.actividadId);

        // Helper calculations
        let mult = 1;
        const f = r.frecuencia?.toLowerCase();
        if (f === 'diaria' || f === 'diario') mult = 250;
        else if (f === 'semanal') mult = 50;
        else if (f === 'quincenal') mult = 24;
        else if (f === 'mensual') mult = 12;
        else if (f === 'trimestral') mult = 4;
        else if (f === 'semestral') mult = 2;
        else mult = 1;

        const volAnual = r.volumenQ * mult;
        
        sheet2.addRow({
          id: r.id,
          fecha: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '',
          autor: r.autor || 'N/A',
          sys_rol: r.userRole || 'N/A',
          org: org?.nombre || 'N/A',
          dep: dep?.nombre || 'N/A',
          proc: proc?.nombre || 'N/A',
          pcd: pcd?.nombre || 'N/A',
          act: r.actividadId === "actividad_no_documentada" ? 'ACTIVIDAD NO DOCUMENTADA' : (act?.nombre || 'N/A'),
          desc_act: r.actividadId === "actividad_no_documentada" ? (r.descripcionActividad || 'N/A') : '',
          rolEjecutor: r.rolEjecutor || 'N/A',
          t_min: r.tiempoMin,
          t_nor: r.tiempoNormal,
          t_max: r.tiempoMax,
          frec: r.frecuencia,
          vol: r.volumenQ,
          vol_anual: volAnual,
          etp: Number((calculateETP(r).ETP || 0).toFixed(4))
        });
      });

      sheet2.autoFilter = {
        from: 'A1',
        to: { row: 1, column: headerCols.length }
      };

      // ============== SHEET 3: RESUMEN Y GRÁFICOS ==============
      const sheet3 = workbook.addWorksheet('Soporte Gráficos', { views: [{ showGridLines: false }] });
      
      sheet3.mergeCells('A1:E1');
      const gTitle = sheet3.getCell('A1');
      gTitle.value = 'DATOS RESUMIDOS PARA GRÁFICOS';
      gTitle.font = { size: 14, bold: true };
      
      sheet3.getCell('A3').value = 'Instrucciones: Use estos datos resumidos para insertar gráficos dinámicos en Excel de forma nativa.';
      sheet3.getCell('A3').font = { italic: true, color: { argb: 'FF64748B' } };

      const addSummaryTable = (startRow: number, title: string, headers: string[], items: {k:string, v:number}[]) => {
        sheet3.getCell(`A${startRow}`).value = title;
        sheet3.getCell(`A${startRow}`).font = { bold: true, color: { argb: 'FF004B23' } };
        sheet3.getCell(`A${startRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
        
        sheet3.getCell(`A${startRow+1}`).value = headers[0];
        sheet3.getCell(`B${startRow+1}`).value = headers[1];
        sheet3.getRow(startRow+1).font = { bold: true, color: { argb: 'FFFFFFFF' }};
        sheet3.getCell(`A${startRow+1}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF007236' } };
        sheet3.getCell(`B${startRow+1}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF007236' } };

        let curr = startRow + 2;
        items.forEach(it => {
          sheet3.getCell(`A${curr}`).value = it.k;
          sheet3.getCell(`B${curr}`).value = it.v;
          curr++;
        });
        
        return curr + 2;
      };

      // Table 1: ETP por Nivel
      const etpByLevel: Record<string, number> = {};
      reportData.forEach(r => {
        const lvl = r.rolEjecutor || 'Sin Definir';
        etpByLevel[lvl] = (etpByLevel[lvl] || 0) + (calculateETP(r).ETP || 0);
      });
      let nextRow = addSummaryTable(5, 'ETP POR NIVEL JERÁRQUICO', ['Nivel', 'ETP Total'], 
        Object.entries(etpByLevel).map(([k,v]) => ({k, v: Number(v.toFixed(2))}))
      );

      // Table 2: ETP por Frecuencia
      const etpByFreq: Record<string, number> = {};
      reportData.forEach(r => {
        const f = r.frecuencia || 'Sin Definir';
        etpByFreq[f] = (etpByFreq[f] || 0) + (calculateETP(r).ETP || 0);
      });
      nextRow = addSummaryTable(nextRow, 'ETP POR FRECUENCIA', ['Frecuencia', 'ETP Total'], 
        Object.entries(etpByFreq).map(([k,v]) => ({k, v: Number(v.toFixed(2))}))
      );

      // Table 3: ETP por Organismo
      const etpByOrgReal: Record<string, number> = {};
      organismos.forEach(o => { etpByOrgReal[o.nombre] = 0; });
      reportData.forEach(r => {
        const dep = dependencias.find(d => d.id === r.dependenciaId);
        const org = organismos.find(o => o.id === r.organismoId || o.id === dep?.parentId);
        if (org) {
          etpByOrgReal[org.nombre] = (etpByOrgReal[org.nombre] || 0) + (calculateETP(r).ETP || 0);
        }
      });
      nextRow = addSummaryTable(nextRow, 'ETP POR ORGANISMO', ['Organismo', 'ETP Total'], 
        Object.entries(etpByOrgReal)
          .sort((a,b) => b[1] - a[1]) // highest first
          .map(([k,v]) => ({k, v: Number(v.toFixed(4))}))
      );

      // Table 4: ETP por Dependencia
      const etpByDepReal: Record<string, number> = {};
      dependencias.forEach(d => { etpByDepReal[d.nombre] = 0; });
      reportData.forEach(r => {
        const dep = dependencias.find(d => d.id === r.dependenciaId);
        if (dep) {
          etpByDepReal[dep.nombre] = (etpByDepReal[dep.nombre] || 0) + (calculateETP(r).ETP || 0);
        }
      });
      nextRow = addSummaryTable(nextRow, 'ETP POR DEPENDENCIA', ['Dependencia', 'ETP Total'], 
        Object.entries(etpByDepReal)
          .sort((a,b) => b[1] - a[1]) // highest first
          .map(([k,v]) => ({k, v: Number(v.toFixed(4))}))
      );

      sheet3.getColumn(1).width = 50;
      sheet3.getColumn(2).width = 15;

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `reporte_cargas_trabajo_${new Date().toISOString().split('T')[0]}.xlsx`);

    } catch (error) {
      console.error("Error exporting to Excel:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Reportes y Exportación</h1>
          <p className="text-sm text-slate-500 mt-1">Gere los informes de cargas de trabajo consolidadas para la vigencia actual.</p>
        </div>
        <button
          onClick={handleExportExcel}
          disabled={reportData.length === 0 || isExporting}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-colors disabled:opacity-50"
        >
          <FileSpreadsheet size={18} />
          {isExporting ? 'Generando Excel...' : 'Exportar a Excel'}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="font-bold text-slate-700">Consolidado de Registros</h2>
          <span className="text-xs font-medium bg-slate-200 text-slate-600 px-2 py-1 rounded-md">{reportData.length} registros</span>
        </div>
        <CargasTable
          cargas={reportData}
          actividades={actividades}
          dependencias={dependencias}
          procedimientos={procedimientos}
          currentUser={currentUser}
          onViewDetails={setSelectedRecordDetails}
        />
      </div>

      <AnimatePresence>
        {selectedRecordDetails && (
          <RecordDetailsModal
            record={selectedRecordDetails}
            onClose={() => setSelectedRecordDetails(null)}
            organismos={organismos}
            dependencias={dependencias}
            procesos={procesos}
            procedimientos={procedimientos}
            actividades={actividades}
            currentUserRole={currentUser?.rol}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

