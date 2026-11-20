// Regras de negócio em funções puras: recebem dados e devolvem resultados, sem acessar a API

// A disciplina "origemId" exige "alvoId", direta ou indiretamente (pré-requisito do pré-requisito)?
// Usada para impedir ciclos, como A exigir B e B exigir A.
export function dependeDe(origemId, alvoId, disciplinas, visitados = new Set()) {
  if (visitados.has(origemId)) return false;
  visitados.add(origemId);

  const origem = disciplinas.find((d) => d.id === origemId);
  return (origem?.preRequisitos ?? []).some(
    (id) => id === alvoId || dependeDe(id, alvoId, disciplinas, visitados)
  );
}

// Semestre em que as ofertas e matrículas acontecem
export const SEMESTRE_ATUAL = '2026/2';

// Carga do professor = soma dos créditos das turmas dele no semestre
export function cargaProfessor(professorId, semestre, turmas, disciplinas, ignorarTurmaId) {
  return turmas
    .filter((t) => t.professorId === professorId && t.semestre === semestre && t.id !== ignorarTurmaId)
    .reduce((total, t) => total + (disciplinas.find((d) => d.id === t.disciplinaId)?.creditos ?? 0), 0);
}

// Cor da barra de carga: verde, amarelo a partir de 75% e vermelho ao atingir o máximo
export function corDaCarga(carga, maxima) {
  if (carga >= maxima) return 'danger';
  if (carga / maxima >= 0.75) return 'warning';
  return 'success';
}
