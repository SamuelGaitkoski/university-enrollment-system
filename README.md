# Sistema de Matrículas

Sistema de atendimento e matrículas de uma universidade, desenvolvido como Desafio da disciplina **Programação Front-end** (Unisinos).

O sistema tem duas visões:

- **Secretaria acadêmica (visão institucional):** cadastra disciplinas, professores e alunos, monta a oferta de turmas do semestre e acompanha a grade e a carga dos professores.
- **Aluno:** consulta as turmas ofertadas, vê se pode se matricular em cada uma (e por quê), matricula-se, cancela e acompanha sua grade semanal.

## Funcionalidades

| Caso de uso | Onde | Regras principais |
|---|---|---|
| **UC1 — Manter cadastros** | Secretaria → Disciplinas, Professores, Alunos | Validação com regex (código `INF101`, matrícula de 9 dígitos, e-mail, nome); códigos, matrículas e e-mails únicos; pré-requisitos sem ciclo; histórico do aluno com aviso de pré-requisito faltando; exclusão bloqueada quando há vínculos. |
| **UC2 — Ofertar turma** | Secretaria → Turmas | Seletor de horários dia × turno; professor **sem conflito de horário**; **carga máxima** do professor respeitada; vagas de 1 a 80 e nunca abaixo dos matriculados. |
| **UC3 — Matricular-se** | Aluno → Ofertas | Status por turma: Disponível, Lotada, Pré-requisito pendente, Conflito de horário, Já cursada, Já matriculado, Limite de **20 créditos**. |
| **UC4 — Cancelar matrícula** | Aluno → Minhas matrículas · Secretaria → Detalhe da turma | Confirmação antes de excluir. |
| **UC5 — Consultar grades** | Secretaria → Grade · Aluno → Minhas matrículas | Grade semanal dia × turno reutilizada nas duas visões. |

Também há um **Painel** da secretaria com totais, carga de cada professor (apoio à distribuição equilibrada) e turmas lotadas ou quase lotadas.

### Códigos de horário

Cada turma ocupa um ou mais horários de 2 dígitos: o 1º é o dia (2 = segunda … 7 = sábado) e o 2º é o turno (1 = manhã, 2 = tarde, 3 = noite). Exemplos: `21` = segunda de manhã, `33` = terça à noite.

## Tecnologias

- **React 19 + Vite** (JavaScript). O Create React App, visto na Semana 6, foi descontinuado pelo time do React em 2025; o Vite é o substituto recomendado.
- **React Router** para as rotas e páginas protegidas por perfil.
- **Bootstrap 5 + React-Bootstrap + Bootstrap Icons** para a interface responsiva.
- **Context API** (perfil logado e notificações), hooks (`useState`, `useEffect`, `useMemo`) e um hook próprio, `useDados`.
- **`fetch`** nativo para falar com o back-end.
- **Node + Express**, um web server simples que guarda os dados num arquivo JSON.
- Sem renderização no servidor: o Express só devolve JSON e toda a interface roda no navegador.

## Como rodar

**Pré-requisito:** Node.js 20.19 ou superior (`node -v`).

Na pasta raiz do projeto:

```bash
npm run install:all   # instala as dependências da raiz, do backend e do frontend
npm run dev           # sobe o back-end e o front-end juntos
```

Depois abra **http://localhost:5173** no navegador. A API fica em http://localhost:3001.

Para voltar aos dados de exemplo a qualquer momento:

```bash
npm run seed
```

### Perfis para teste

Não há senha: na tela inicial, escolha **Secretaria acadêmica** ou um **aluno** da lista.

| Aluno | Situação nos dados de exemplo |
|---|---|
| **Carla Dias** | Mostra quase todos os status na tela de Ofertas: Disponível (INF220), Lotada (INF320), Pré-requisito pendente (INF301), Conflito de horário (MAT201), Já matriculado e Já cursada. |
| **Ana Souza** | Caloura: não tem disciplinas aprovadas e já está numa turma de INF101 (a outra turma aparece como "Já matriculado na disciplina"). |
| **Bruno Costa** | Mostra conflito de horário (INF110 × INF102 na terça à tarde) e pode se matricular em MAT201. |
| Diego, Elisa e Felipe | Outros históricos para explorar. |

Na visão da secretaria, o professor **Paulo Mendes** está no limite de carga (8/8) e as turmas **INF320** (lotada) e **INF301** (resta 1 vaga) aparecem no Painel.

## Estrutura de pastas

```
├── package.json            # scripts install:all, dev, seed e zip
├── docs/
│   ├── planejamento.md     # protótipo: casos de uso, telas, wireframes e modelo de dados
│   └── roteiro-video.md    # roteiro do vídeo de apresentação
├── backend/
│   ├── server.js           # API Express: CRUD das coleções + integridade
│   └── db.seed.json        # dados de exemplo (db.json é criado a partir dele)
└── frontend/src/
    ├── main.jsx, App.jsx   # entrada e rotas
    ├── services/api.js     # wrapper do fetch
    ├── context/            # AuthContext e NotificacaoContext
    ├── hooks/useDados.js   # busca de dados com carregando/erro
    ├── utils/              # horarios, validacoes (regex) e regras de negócio
    ├── components/         # formulários, GradeSemanal, SeletorHorarios, modais...
    └── pages/              # Entrar, secretaria/* e aluno/*
```

## API

| Método | Rota | Resposta |
|---|---|---|
| GET | `/:colecao` | lista (aceita filtro, ex. `/matriculas?alunoId=a1`) |
| GET | `/:colecao/:id` | item ou 404 |
| POST | `/:colecao` | 201 + item criado |
| PUT | `/:colecao/:id` | item atualizado ou 404 |
| DELETE | `/:colecao/:id` | 204, 404 ou 409 (registro com vínculos) |
| POST | `/reset` | restaura os dados de exemplo |

Coleções: `disciplinas`, `professores`, `alunos`, `turmas` e `matriculas`.

## Entrega

`npm run zip` gera `entrega-desafio-front-end.zip` só com os arquivos versionados (sem `node_modules`).
