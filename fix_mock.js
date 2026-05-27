const fs = require('fs');
let content = fs.readFileSync('src/data/mockData.ts', 'utf8');

const roles = ['Directivo', 'Asesor', 'Profesional', 'Técnico', 'Asistencial'];
let i = 0;
content = content.replace(/rolEjecutor:\s*"Funcionario"/g, () => {
  const rol = roles[i % roles.length];
  i++;
  return `rolEjecutor: "${rol}"`;
});
// Need to ensure the `rol` of the user who did it is maintained? The user is just the author. Wait, there is no system role field on Carga! We should add `rol: "Funcionario"` down below or in the type.

fs.writeFileSync('src/data/mockData.ts', content, 'utf8');
