const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORTA = process.env.PORT || 3001;
const ARQUIVO_DB = path.join(__dirname, 'db.json');
const ARQUIVO_SEED = path.join(__dirname, 'db.seed.json');
const COLECOES = ['disciplinas', 'professores', 'alunos', 'turmas', 'matriculas'];

// Na primeira execução, cria o db.json a partir dos dados de exemplo
if (!fs.existsSync(ARQUIVO_DB)) fs.copyFileSync(ARQUIVO_SEED, ARQUIVO_DB);

const lerDb = () => JSON.parse(fs.readFileSync(ARQUIVO_DB, 'utf-8'));
const salvarDb = (db) => fs.writeFileSync(ARQUIVO_DB, JSON.stringify(db, null, 2));

// Vínculos que impedem a exclusão: [coleção que referencia, campo, mensagem]
const VINCULOS = {
  disciplinas: [
    ['turmas', 'disciplinaId', 'Disciplina possui turmas ofertadas.'],
    ['disciplinas', 'preRequisitos', 'Disciplina é pré-requisito de outra.'],
  ],
  professores: [['turmas', 'professorId', 'Professor está alocado em turmas.']],
  alunos: [['matriculas', 'alunoId', 'Aluno possui matrículas.']],
  turmas: [['matriculas', 'turmaId', 'Turma possui alunos matriculados.']],
};

const app = express();
app.use(cors());
app.use(express.json());

// Restaura os dados de exemplo (útil na demonstração)
app.post('/reset', (req, res) => {
  fs.copyFileSync(ARQUIVO_SEED, ARQUIVO_DB);
  res.json({ mensagem: 'Dados restaurados.' });
});

// Valida o nome da coleção em todas as rotas que usam :colecao
app.param('colecao', (req, res, next, colecao) => {
  if (!COLECOES.includes(colecao)) {
    return res.status(404).json({ erro: `Coleção "${colecao}" não existe.` });
  }
  next();
});

// Lista com filtro simples por query string: /matriculas?alunoId=a1
app.get('/:colecao', (req, res) => {
  const filtros = Object.entries(req.query);
  const itens = lerDb()[req.params.colecao].filter((item) =>
    filtros.every(([campo, valor]) => String(item[campo]) === valor)
  );
  res.json(itens);
});

app.get('/:colecao/:id', (req, res) => {
  const item = lerDb()[req.params.colecao].find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ erro: 'Registro não encontrado.' });
  res.json(item);
});

app.post('/:colecao', (req, res) => {
  const db = lerDb();
  const novo = { ...req.body, id: crypto.randomUUID() };
  db[req.params.colecao].push(novo);
  salvarDb(db);
  res.status(201).json(novo);
});

app.put('/:colecao/:id', (req, res) => {
  const db = lerDb();
  const lista = db[req.params.colecao];
  const indice = lista.findIndex((i) => i.id === req.params.id);
  if (indice === -1) return res.status(404).json({ erro: 'Registro não encontrado.' });
  lista[indice] = { ...req.body, id: req.params.id };
  salvarDb(db);
  res.json(lista[indice]);
});

app.delete('/:colecao/:id', (req, res) => {
  const { colecao, id } = req.params;
  const db = lerDb();
  const indice = db[colecao].findIndex((i) => i.id === id);
  if (indice === -1) return res.status(404).json({ erro: 'Registro não encontrado.' });

  // Integridade: responde 409 se outro registro depende deste
  for (const [outra, campo, mensagem] of VINCULOS[colecao] || []) {
    // O campo pode ser um id ou uma lista de ids (ex.: preRequisitos)
    if (db[outra].some((item) => [].concat(item[campo]).includes(id))) {
      return res.status(409).json({ erro: mensagem });
    }
  }

  db[colecao].splice(indice, 1);
  salvarDb(db);
  res.status(204).end();
});

app.listen(PORTA, () => console.log(`API rodando em http://localhost:${PORTA}`));
