// Expressões regulares usadas na validação dos formulários
export const REGEX = {
  codigoDisciplina: /^[A-Z]{3}\d{3}$/, // ex.: INF101
  matricula: /^\d{9}$/, // ex.: 202610001
  email: /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/,
  semestre: /^\d{4}\/[12]$/, // ex.: 2026/2
  nomePessoa: /^[A-Za-zÀ-ÖØ-öø-ÿ ]+$/, // letras com acento e espaços
  nomeDisciplina: /^[A-Za-zÀ-ÖØ-öø-ÿ0-9 -]+$/, // permite números e hífen (ex.: Front-end)
  codigoHorario: /^[2-7][1-3]$/, // dia (2–7) + turno (1–3)
};

function validarNome(nome, regex, mensagemFormato) {
  const limpo = nome.trim();
  if (limpo.length < 3) return 'Informe pelo menos 3 caracteres.';
  if (!regex.test(limpo)) return mensagemFormato;
  return '';
}

// Cada validador devolve um objeto { campo: 'mensagem' } só com os campos inválidos
export function validarDisciplina(form, disciplinas, idAtual) {
  const erros = {};

  if (!REGEX.codigoDisciplina.test(form.codigo)) {
    erros.codigo = 'Use 3 letras maiúsculas e 3 dígitos (ex.: INF101).';
  } else if (disciplinas.some((d) => d.codigo === form.codigo && d.id !== idAtual)) {
    erros.codigo = 'Já existe uma disciplina com este código.';
  }

  const erroNome = validarNome(form.nome, REGEX.nomeDisciplina, 'Use apenas letras, números, espaços e hífen.');
  if (erroNome) erros.nome = erroNome;

  if (![2, 4].includes(form.creditos)) erros.creditos = 'Escolha 2 ou 4 créditos.';

  return erros;
}

export function validarProfessor(form, professores, idAtual, cargaAtual = 0) {
  const erros = {};

  const erroNome = validarNome(form.nome, REGEX.nomePessoa, 'Use apenas letras e espaços.');
  if (erroNome) erros.nome = erroNome;

  if (!REGEX.email.test(form.email.trim())) {
    erros.email = 'Informe um e-mail válido (ex.: nome@universidade.edu.br).';
  } else if (professores.some((p) => p.email === form.email.trim() && p.id !== idAtual)) {
    erros.email = 'Já existe um professor com este e-mail.';
  }

  const carga = Number(form.cargaMaxima);
  if (!Number.isInteger(carga) || carga < 2 || carga > 40) {
    erros.cargaMaxima = 'Informe um número inteiro entre 2 e 40.';
  } else if (carga < cargaAtual) {
    // Não deixa reduzir a carga abaixo do que o professor já leciona
    erros.cargaMaxima = `O professor já leciona ${cargaAtual} créditos neste semestre.`;
  }

  return erros;
}

export function validarAluno(form, alunos, idAtual) {
  const erros = {};

  if (!REGEX.matricula.test(form.matricula)) {
    erros.matricula = 'A matrícula deve ter exatamente 9 dígitos.';
  } else if (alunos.some((a) => a.matricula === form.matricula && a.id !== idAtual)) {
    erros.matricula = 'Já existe um aluno com esta matrícula.';
  }

  const erroNome = validarNome(form.nome, REGEX.nomePessoa, 'Use apenas letras e espaços.');
  if (erroNome) erros.nome = erroNome;

  if (!REGEX.email.test(form.email.trim())) {
    erros.email = 'Informe um e-mail válido (ex.: nome@aluno.edu.br).';
  } else if (alunos.some((a) => a.email === form.email.trim() && a.id !== idAtual)) {
    erros.email = 'Já existe um aluno com este e-mail.';
  }

  if (!form.curso) erros.curso = 'Selecione o curso.';

  return erros;
}
