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
