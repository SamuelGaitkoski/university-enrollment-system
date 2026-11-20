# Roteiro do vídeo (3 a 5 minutos)

## Antes de gravar

- [ ] `npm run seed` para começar com os dados de exemplo.
- [ ] `npm run dev` rodando; navegador aberto em http://localhost:5173, já na tela inicial (clique em **Sair** se estiver logado).
- [ ] No VS Code, aumente o zoom (**Cmd +** duas ou três vezes) para o código ficar legível no vídeo. Feche abas e painéis que não vai usar.
- [ ] Deixe abertos, nesta ordem: `backend/server.js`, `frontend/src/services/api.js`, `frontend/src/context/AuthContext.jsx`, `frontend/src/utils/regras.js`, `frontend/src/components/FormularioTurma.jsx`, `frontend/src/pages/aluno/Ofertas.jsx`.
- [ ] Grave em MP4, com áudio, tela inteira ou só a janela.

## 1. Apresentação (≈ 30 s)

> "Este é o Sistema de Matrículas, meu Desafio de Programação Front-end. Tem duas visões: a da secretaria, que monta a oferta de turmas, e a do aluno, que se matricula.
> O front é React com Vite — usei Vite porque o Create React App foi descontinuado em 2025 —, React Router, Bootstrap e Context API. O back-end é um servidor Express simples que guarda os dados num arquivo JSON, e o front fala com ele por fetch."

Mostre rapidamente o README ou a estrutura de pastas.

## 2. Demonstração (≈ 2 min)

**Secretaria** (entrar como Secretaria acadêmica):

1. **Painel** (10 s): totais, carga dos professores (Paulo no limite, em vermelho) e turmas lotadas/quase lotadas.
2. **Disciplinas** (20 s): abra *Nova disciplina*, digite `inf5` → vira maiúsculo e mostra o erro da regex. Edite INF101 e mostre que as disciplinas que dependem dela ficam bloqueadas como pré-requisito (evita ciclo). Cancele.
3. **Turmas** (40 s): *Nova turma* → INF301 + **Carlos Lima** → aparece "Carga excedida". Clique em **Seg manhã** → fica vermelho, "Conflito de horário". Troque para **Marina Rocha**, escolha **Sex tarde** e salve. A turma aparece na lista.
4. **Grade** (10 s): grade semanal com todas as turmas; clique numa para abrir o detalhe com os alunos.

**Aluno** (Sair → entrar como **Carla Dias**):

5. **Ofertas** (30 s): mostre os status — Disponível, Lotada, Pré-requisito pendente (com o motivo), Conflito de horário, Já cursada. Ligue *Só disponíveis*. Matricule-se em **INF220** → notificação e créditos sobem para 12/20.
6. **Minhas matrículas** (15 s): lista, barra de créditos e a grade semanal (o mesmo componente da secretaria). Cancele INF220.

## 3. Código (≈ 1 min 30 s)

1. **`backend/server.js`** (15 s): `app.get/post/put/delete` genéricos por coleção, `cors()` e `express.json()`, e o bloqueio 409 quando há vínculos.
2. **`services/api.js`** (10 s): o `fetch` centralizado, que converte erros em mensagens em português.
3. **`context/AuthContext.jsx`** (15 s): Context API guardando o perfil no `localStorage`; o `RotaProtegida` usa isso para liberar as rotas.
4. **`utils/regras.js`** (25 s): `verificarOferta` (conflito e carga do professor) e `avaliarMatricula`, que testa as regras em ordem e devolve `{ permitido, status, motivo }`. São funções puras, separadas dos componentes.
5. **`components/FormularioTurma.jsx`** (15 s): formulário controlado (`value` + `onChange`), erros da regex em `validacoes.js` mais as regras de negócio, exibidos com `Form.Control.Feedback`.
6. **`pages/aluno/Ofertas.jsx`** (10 s): `useDados` no lugar do `componentDidMount`, `useMemo` para calcular o status de cada turma e a renderização condicional do badge e do botão *Matricular*.

## 4. Encerramento (≈ 15 s)

> "Então o sistema cobre cinco casos de uso — cadastros, oferta de turmas, matrícula, cancelamento e grades — com pré-requisitos, conflito de horário, limite de vagas e carga equilibrada dos professores. Obrigado!"

## Dicas

- Treine uma vez antes; se passar de 5 min, encurte a parte de Disciplinas.
- Fale enquanto clica; evite tempo parado esperando.
- Ao final, rode `npm run seed` de novo se quiser repetir a gravação.
