# CLAUDE.md — Sistema de Matrículas (Desafio Front-end Unisinos)

## Idioma
- Código: nomes de domínio em português (disciplina, turma, matricula, professor, aluno). Termos técnicos do React/JS ficam em inglês (useState, props, handleSubmit é aceitável, mas prefira nomes claros em português quando natural: salvarTurma, carregarDados).
- Componentes em PascalCase em português: FormularioTurma, TabelaDisciplinas, GradeSemanal.
- Comentários SEMPRE em português, curtos e diretos (1 linha, no máximo 2). Comentar só o que não é óbvio: regras de negócio, decisões, trechos que vou explicar no vídeo. Nada de JSDoc longo, nada de comentário repetindo o que o código já diz.
- Mensagens de commit em inglês, padrão Conventional Commits, só o título (sem corpo) + linha `Co-Authored-By`: `feat(turmas): add schedule conflict validation`.
- README e documentação em português.

## Estilo
- Componentes funcionais com hooks. Funções pequenas. Regras de negócio em funções puras em `src/utils/`, não espalhadas nos componentes.
- Formulários controlados (value + onChange), validação com regex em `src/utils/validacoes.js`, feedback com `Form.Control.Feedback` do react-bootstrap.
- Toda tela que busca dados trata 3 estados: carregando (Spinner), erro (Alert) e vazio (mensagem amigável).
- Listas sempre com `key` estável (id).
- Sem dependências novas sem perguntar.

## Git
- Um arquivo por commit (`git add <arquivo>` + `git commit`). Nunca `git add .` ou `git add -A`.
- Push ao final de cada fase.
- Nunca commitar node_modules, dist, .env nem backend/db.json.

## Rodar
- `npm run install:all` → instala raiz, backend e frontend
- `npm run dev` → back em http://localhost:3001 e front em http://localhost:5173
- `npm run seed` → restaura os dados de exemplo
