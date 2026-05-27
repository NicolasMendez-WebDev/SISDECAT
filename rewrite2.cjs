const fs = require('fs');
const content = fs.readFileSync('src/presentation/pages/CapturaModule.tsx', 'utf8');

const startPaso2 = '            {/* Tarjeta 2: Asignación */}';
const startPaso3 = '            {/* Tarjeta 3: Tiempos */}';
const startBotones = '          {/* Botones de Acción */}';
const startCalculo = '            {/* Tarjeta de Cálculo CORE */}';
const startCompor = '            {/* Componente: Comportamiento del Nivel (Back to Sidebar) */}';
const startRegistros = '        {/* Componente: Registros Completados (Relocated below cards) */}';
const endRegistros = '      </div>\n\n      <AnimatePresence>';

const idxGrid1 = content.indexOf('<div className="grid grid-cols-1 md:grid-cols-2 gap-6">\n            {/* Tarjeta 2: Asignación */}');

const topPart = content.substring(0, idxGrid1);

const blockPaso2 = content.substring(content.indexOf(startPaso2), content.indexOf(startPaso3));
const blockPaso3 = content.substring(content.indexOf(startPaso3), content.indexOf(startBotones));
let blockPaso3Clean = blockPaso3;
if (blockPaso3Clean.endsWith('          </div>\n\n')) {
    blockPaso3Clean = blockPaso3Clean.slice(0, -18);
}
// wait, since I'm moving blocks, I'd rather just replace the specific sections.
// Let's print out indices to be safe.
console.log({
  idxGrid1,
  startPaso2: content.indexOf(startPaso2),
  startPaso3: content.indexOf(startPaso3),
  startBotones: content.indexOf(startBotones),
  startCalculo: content.indexOf(startCalculo),
  startCompor: content.indexOf(startCompor),
  startRegistros: content.indexOf(startRegistros),
  endRegistros: content.indexOf(endRegistros)
});

const blockCalculo = content.substring(content.indexOf(startCalculo), content.indexOf(startCompor));
const blockCompor = content.substring(content.indexOf(startCompor), content.indexOf(startRegistros));
let blockComporClean = blockCompor;
if (blockComporClean.endsWith('          </div>\n\n')) {
    blockComporClean = blockComporClean.slice(0, -18);
} else if (blockComporClean.endsWith('          </div>\n        </div>\n\n')) {
    blockComporClean = blockComporClean.slice(0, -32);
}

const blockRegistros = content.substring(content.indexOf(startRegistros), content.indexOf(endRegistros));

const bottomPart = content.substring(content.indexOf(endRegistros));

const buttonsStr = `
          {/* Botones de Acción */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end mt-4 mb-4">
            <button 
              onClick={() => setFormData({...initialFormState, organismoId: formData.organismoId, dependenciaId: formData.dependenciaId, procesoId: formData.procesoId, procedimientoId: formData.procedimientoId, rolEjecutor: formData.rolEjecutor})}
              className="px-6 py-3 text-[11px] font-black text-red-600/80 bg-red-50 hover:text-red-700 hover:bg-red-100/80 rounded-xl transition-all uppercase tracking-widest border border-red-100"
            >
              Cancelar Registro
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaveDisabled}
              className={\`px-8 py-3 text-xs font-black rounded-xl shadow-lg transition-all uppercase tracking-[0.15em] flex items-center justify-center gap-3 border-2 \${
                isSaveDisabled 
                ? 'bg-emerald-500/10 text-emerald-600/40 border-emerald-500/5 cursor-not-allowed shadow-none' 
                : 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 hover:-translate-y-1 hover:shadow-emerald-600/30 active:translate-y-0 active:shadow-none'
              }\`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
              Guardar registro
            </button>
          </div>
`;

let finalContent = topPart +
  '          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">\n' +
  blockPaso2 + 
  blockPaso3Clean + '\n' +
  blockCalculo.replace('            {/* Tarjeta de Cálculo CORE */}', '            {/* Tarjeta de Cálculo CORE */}').trimEnd() + '\n' +
  '          </div>\n\n' +
  buttonsStr + '\n' +
  blockRegistros.trimEnd() + '\n\n' +
  blockComporClean.trimEnd() + '\n' +
  bottomPart;

fs.writeFileSync('src/presentation/pages/CapturaModule.tsx', finalContent);
console.log('REWRITE2 done.');
