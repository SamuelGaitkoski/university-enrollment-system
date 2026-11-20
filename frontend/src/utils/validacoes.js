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
