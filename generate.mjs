import fs from 'fs';

let mockData = fs.readFileSync('src/data/mockData.ts', 'utf-8');

function generateUsers(count) {
  let str = '';
  for(let i=10; i < 10+count; i++) {
    let deps = ['dep-1-1', 'dep-4-1', 'dep-5-1', 'dep-7', 'dep-3'];
    let dep = deps[i % deps.length];
    str += `
  {
    id: "USR-0${i}",
    nombre: "Funcionario ${i}",
    rol: "Funcionario" as const,
    email: "funcionario${i}@sdmct.gov.co",
    dependenciaId: "${dep}"
  },`;
  }
  return str;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateCargas(numUsers) {
  let str = '';
  const actividades = [
    { actId: 'act-1', pcdId: 'pcd-1', procId: 'proc-2', depId: 'dep-1-1', orgId: 'org-1' },
    { actId: 'act-2', pcdId: 'pcd-1', procId: 'proc-2', depId: 'dep-1-1', orgId: 'org-1' },
    { actId: 'act-3', pcdId: 'pcd-2', procId: 'proc-3', depId: 'dep-3', orgId: 'org-2' },
    { actId: 'act-4', pcdId: 'pcd-2', procId: 'proc-3', depId: 'dep-3', orgId: 'org-2' },
    { actId: 'act-5', pcdId: 'pcd-3', procId: 'proc-4', depId: 'dep-4-1', orgId: 'org-3' },
    { actId: 'act-6', pcdId: 'pcd-3', procId: 'proc-4', depId: 'dep-4-1', orgId: 'org-3' },
    { actId: 'act-7', pcdId: 'pcd-4', procId: 'proc-4', depId: 'dep-5-1', orgId: 'org-3' },
    { actId: 'act-8', pcdId: 'pcd-4', procId: 'proc-4', depId: 'dep-5-1', orgId: 'org-3' },
    { actId: 'act-9', pcdId: 'pcd-5', procId: 'proc-5', depId: 'dep-7', orgId: 'org-5' },
    { actId: 'act-10', pcdId: 'pcd-5', procId: 'proc-5', depId: 'dep-7', orgId: 'org-5' }
  ];
  let frecs = ['Diaria', 'Semanal', 'Quincenal', 'Mensual', 'Bimestral', 'Trimestral', 'Semestral', 'Anual'];
  
  // 1 record per user per act
  for(let i=10; i < 10+numUsers; i++) {
    // each user registers Random 3 to 8 acts
    let shuffledActs = [...actividades].sort(() => Math.random() - 0.5).slice(0, rand(3, 8));
    for (let act of shuffledActs) {
      let tM = rand(10, 40);
      let tN = rand(tM + 1, 80);
      let tMax = rand(tN + 1, 120);
      let id = Math.random().toString(36).substring(2, 8).toUpperCase();
      str += `
  {
    id: "CRG-${id}",
    vigenciaId: "vig-2025-001",
    organismoId: "${act.orgId}",
    dependenciaId: "${act.depId}",
    procesoId: "${act.procId}",
    procedimientoId: "${act.pcdId}",
    actividadId: "${act.actId}",
    tiempoMin: ${tM},
    tiempoNormal: ${tN},
    tiempoMax: ${tMax},
    volumenQ: ${rand(1, 100)},
    unidadTiempo: "min",
    frecuencia: "${randomItem(frecs)}",
    participantes: ${rand(1, 4)},
    userId: "USR-0${i}",
    autor: "Funcionario ${i}",
    rolEjecutor: "Funcionario",
    createdAt: "2025-04-${String(rand(1, 28)).padStart(2,'0')}T10:00:00Z",
    updatedAt: "2025-04-${String(rand(1, 28)).padStart(2,'0')}T10:00:00Z",
  },`;
    }
  }
  return str;
}

const numUsers = 25; // 25 users * ~5 acts = ~125 records

const newUsersStr = generateUsers(numUsers);
const newCargasStr = generateCargas(numUsers);

mockData = mockData.replace('];\n\nexport const vigenciasUsuariosMock', newUsersStr + '\n];\n\nexport const vigenciasUsuariosMock');
mockData = mockData.replace('];\n\n// ===================================', newCargasStr + '\n];\n\n// ===================================');

fs.writeFileSync('src/data/mockData.ts', mockData);
console.log('Done!');
