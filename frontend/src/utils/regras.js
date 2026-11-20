import { decodificarHorario } from './horarios';

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

// Cor de carga ou ocupação: verde, amarelo a partir de 75% e vermelho ao atingir o máximo
export function corDaCarga(carga, maxima) {
  if (carga >= maxima) return 'danger';
  if (carga / maxima >= 0.75) return 'warning';
  return 'success';
}

// Quantos alunos estão matriculados na turma
export function ocupacao(turmaId, matriculas) {
  return matriculas.filter((m) => m.turmaId === turmaId).length;
}

// Horários em comum entre duas listas de códigos
export function horariosEmComum(a, b) {
  return a.filter((h) => b.includes(h));
}

// Regras da oferta (UC2): professor sem conflito de horário e sem ultrapassar a carga máxima.
// Devolve { campo: 'mensagem' } no mesmo formato dos validadores de formulário.
export function verificarOferta(turma, { turmas, disciplinas, professores }) {
  const erros = {};
  const professor = professores.find((p) => p.id === turma.professorId);
  const disciplina = disciplinas.find((d) => d.id === turma.disciplinaId);
  if (!professor || !disciplina) return erros;

  // Outras turmas do mesmo professor no mesmo semestre
  const outrasDoProfessor = turmas.filter(
    (t) => t.professorId === professor.id && t.semestre === turma.semestre && t.id !== turma.id
  );

  for (const outra of outrasDoProfessor) {
    const comum = horariosEmComum(turma.horarios, outra.horarios);
    if (comum.length > 0) {
      const codigo = disciplinas.find((d) => d.id === outra.disciplinaId)?.codigo ?? 'outra turma';
      erros.horarios = `Conflito de horário: ${professor.nome} já leciona ${codigo} na ${decodificarHorario(comum[0])}.`;
      break;
    }
  }

  const carga = cargaProfessor(professor.id, turma.semestre, turmas, disciplinas, turma.id) + disciplina.creditos;
  if (carga > professor.cargaMaxima) {
    erros.professorId = `Carga excedida: ${professor.nome} ficaria com ${carga} de ${professor.cargaMaxima} créditos.`;
  }

  return erros;
}
