const fs = require('fs');
let content = fs.readFileSync('src/data/mockData.ts', 'utf8');

const systemRoles = ['Funcionario', 'Analista', 'Administrador', 'AdminFuncional'];
let i = 0;
content = content.replace(/rolEjecutor:\s*"([^"]+)",/g, (match, p1) => {
  const sysRol = systemRoles[i % systemRoles.length];
  i++;
  return `${match}\n    userRole: "${sysRol}",`;
});

fs.writeFileSync('src/data/mockData.ts', content, 'utf8');
