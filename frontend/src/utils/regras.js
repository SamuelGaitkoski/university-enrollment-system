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

// Limite de créditos que o aluno pode cursar por semestre
export const LIMITE_CREDITOS = 20;

// Turmas em que o aluno está matriculado no semestre, já com a disciplina junto
export function turmasDoAluno(alunoId, semestre, { turmas, disciplinas, matriculas }) {
  return matriculas
    .filter((m) => m.alunoId === alunoId)
    .map((m) => ({ matricula: m, turma: turmas.find((t) => t.id === m.turmaId) }))
    .filter(({ turma }) => turma && turma.semestre === semestre)
    .map(({ matricula, turma }) => ({
      matricula,
      turma,
      disciplina: disciplinas.find((d) => d.id === turma.disciplinaId),
    }));
}

export function creditosDoAluno(alunoId, semestre, dados) {
  return turmasDoAluno(alunoId, semestre, dados).reduce((total, { disciplina }) => total + (disciplina?.creditos ?? 0), 0);
}

// Regras da matrícula (UC3). Verifica em ordem e para no primeiro bloqueio.
// Devolve { permitido, status, motivo } para a tela mostrar o status de cada turma.
export function avaliarMatricula(aluno, turma, dados) {
  const { disciplinas, matriculas } = dados;
  const disciplina = disciplinas.find((d) => d.id === turma.disciplinaId);
  const codigoDe = (id) => disciplinas.find((d) => d.id === id)?.codigo ?? '?';
  const minhas = turmasDoAluno(aluno.id, turma.semestre, dados);
  const bloqueio = (status, motivo) => ({ permitido: false, status, motivo });

  if (minhas.some(({ turma: t }) => t.id === turma.id)) {
    return bloqueio('matriculado', 'Você já está matriculado nesta turma.');
  }

  if (aluno.disciplinasAprovadas.includes(turma.disciplinaId)) {
    return bloqueio('cursada', 'Você já foi aprovado nesta disciplina.');
  }

  if (minhas.some(({ turma: t }) => t.disciplinaId === turma.disciplinaId)) {
    return bloqueio('mesmaDisciplina', 'Você já está em outra turma desta disciplina.');
  }

  const pendentes = (disciplina?.preRequisitos ?? []).filter((id) => !aluno.disciplinasAprovadas.includes(id));
  if (pendentes.length > 0) {
    return bloqueio('preRequisito', `Falta aprovação em: ${pendentes.map(codigoDe).join(', ')}.`);
  }

  if (ocupacao(turma.id, matriculas) >= turma.vagas) {
    return bloqueio('lotada', 'Todas as vagas estão preenchidas.');
  }

  for (const { turma: outra, disciplina: outraDisciplina } of minhas) {
    const comum = horariosEmComum(turma.horarios, outra.horarios);
    if (comum.length > 0) {
      return bloqueio('conflito', `Choca com ${outraDisciplina?.codigo} na ${decodificarHorario(comum[0])}.`);
    }
  }

  const creditos = creditosDoAluno(aluno.id, turma.semestre, dados) + (disciplina?.creditos ?? 0);
  if (creditos > LIMITE_CREDITOS) {
    return bloqueio('creditos', `Ficaria com ${creditos} créditos (máximo ${LIMITE_CREDITOS}).`);
  }

  return { permitido: true, status: 'disponivel', motivo: 'Você pode se matricular.' };
}
