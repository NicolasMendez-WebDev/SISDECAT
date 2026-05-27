const fs = require('fs');
const content = fs.readFileSync('src/presentation/pages/CapturaModule.tsx', 'utf8');

// I will split the file by unique markers.
const top = content.substring(0, content.indexOf('          {/* Componente: Registros Completados (Relocated below cards) */}'));
const bottom = content.substring(content.indexOf('      <AnimatePresence>\n        {selectedRecordDetails'));

// Extract Registros Completados
const startRegistros = content.indexOf('          {/* Componente: Registros Completados (Relocated below cards) */}');
const endRegistros = content.indexOf('        {/* Panel Lateral: Cálculos y Herramientas */}');
const strRegistros = content.substring(startRegistros, endRegistros).replace('        </div>\n\n', '\n');

// Extract Calculo
const startCalculo = content.indexOf('          {/* Tarjeta de Cálculo CORE */}');
const endCalculo = content.indexOf('          {/* Componente: Comportamiento del Nivel (Back to Sidebar) */}');
const strCalculo = content.substring(startCalculo, endCalculo);

// Extract Comportamiento
const startCompor = content.indexOf('          {/* Componente: Comportamiento del Nivel (Back to Sidebar) */}');
const endCompor = content.indexOf('      <AnimatePresence>\n        {selectedRecordDetails');
const strCompor = content.substring(startCompor, endCompor)
    .replace('          </div>\n        </div>\n      </div>', '')   // Adjust for possible extra divs
    .replace(/        <\/div>\n      <\/div>\n\n/g, '')
    .trimEnd() + '\n';

// Replace the old grid ending in Comportamiento
let cleanCompor = strCompor;
const comporLines = cleanCompor.split('\n');
// Let's just blindly clean up the trailing divs of compor
while(comporLines[comporLines.length-1].trim() === '</div>' || comporLines[comporLines.length-1].trim() === '') {
    comporLines.pop();
}
cleanCompor = comporLines.join('\n') + '\n          </div>\n';

const buttons = `
          {/* Botones de Acción */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end mt-4 mb-4">
            <button 
              onClick={() => setFormData({...initialFormState, organismoId: formData.organismoId, dependenciaId: formData.dependenciaId, procesoId: formData.procesoId, procedimientoId: formData.procedimientoId, rolEjecutor: formData.rolEjecutor})}
              className="px-6 py-3 text-[11px] font-black text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all uppercase tracking-widest border border-slate-200"
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
              <FileText size={18} />
              Guardar registro
            </button>
          </div>
`;

// Combine all 
let newContent = top + buttons + '          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">\n  ' + strCalculo.trimEnd() + '\n\n  ' + cleanCompor.trimEnd() + '\n          </div>\n\n          ' + strRegistros.trimEnd() + '\n      </div>\n\n' + bottom;

// Clean up mismatched divs if they exist
let matchSpaces = newContent.match(/      <\/div>\n\n      <AnimatePresence>/g);
if (matchSpaces && matchSpaces.length > 0) {
    // Looks fine
} else {
    newContent = newContent.replace(/      <AnimatePresence>/, '      </div>\n\n      <AnimatePresence>');
}

fs.writeFileSync('src/presentation/pages/CapturaModule.tsx', newContent);
console.log('REWRITTEN successfully');
