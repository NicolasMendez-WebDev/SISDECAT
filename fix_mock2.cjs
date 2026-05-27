const fs = require('fs');
let content = fs.readFileSync('src/data/mockData.ts', 'utf8');

const roles = ['Directivo', 'Asesor', 'Profesional', 'Técnico', 'Asistencial'];
let i = 0;
content = content.replace(/rolEjecutor:\s*"Funcionario"/g, () => {
  const rol = roles[i % roles.length];
  i++;
  return `rolEjecutor: "${rol}"`;
});
content = content.replace(/rolEjecutor:\s*"Analista"/g, () => {
  const rol = roles[i % roles.length];
  i++;
  return `rolEjecutor: "${rol}"`;
});

fs.writeFileSync('src/data/mockData.ts', content, 'utf8');
