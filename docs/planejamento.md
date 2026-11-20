# Planejamento e Protótipo — Sistema de Matrículas

Desafio da disciplina **Programação Front-end** (Unisinos) — tema: *Sistema de atendimento e matrículas* de uma universidade.

## 1. Visão geral

O sistema tem duas visões:

- **Secretaria acadêmica (visão institucional):** mantém os cadastros (disciplinas, professores, alunos) e monta as ofertas de turmas do semestre, respeitando conflitos de horário e a carga máxima de cada professor.
- **Aluno:** consulta as turmas ofertadas, vê se pode ou não se matricular em cada uma (e por quê), matricula-se, cancela matrículas e consulta sua grade semanal.

### Codificação de horários

Cada turma ocupa um ou mais horários codificados em 2 dígitos:

| 1º dígito (dia) | 2º dígito (turno) |
|---|---|
| 2 = segunda · 3 = terça · 4 = quarta · 5 = quinta · 6 = sexta · 7 = sábado | 1 = manhã · 2 = tarde · 3 = noite |

Exemplos: `21` = segunda de manhã · `33` = terça à noite · `72` = sábado à tarde.

## 2. Atores

| Ator | Descrição |
|---|---|
| **Secretaria** | Funcionário da secretaria acadêmica. Acesso a todas as telas `/secretaria/*`. |
| **Aluno** | Estudante cadastrado. Acesso às telas `/aluno/*`, vendo apenas os próprios dados. |

A identificação é simplificada (sem senha): na tela inicial escolhe-se o perfil, e no caso de aluno, qual aluno. O perfil fica guardado no `AuthContext` e no `localStorage`.

## 3. Casos de uso

### UC1 — Manter cadastros

- **Ator:** Secretaria.
- **Objetivo:** criar, listar, buscar, editar e excluir disciplinas, professores e alunos.
- **Fluxo principal:**
  1. A secretaria abre a tela do cadastro (Disciplinas, Professores ou Alunos).
  2. O sistema lista os registros, com campo de busca.
  3. A secretaria clica em **Nova** (ou **Editar** numa linha); abre-se um modal com o formulário.
  4. A secretaria preenche os campos; o sistema valida em tempo real e mostra o erro abaixo de cada campo.
  5. Ao salvar, o sistema grava na API, fecha o modal, atualiza a tabela e mostra uma notificação.
- **Fluxos alternativos:**
  - Dados inválidos → botão Salvar não envia; campos com erro ficam destacados.
  - Exclusão → modal de confirmação. Se o registro tiver vínculos (disciplina com turma, professor com turma, aluno com matrícula), o servidor responde 409 e a mensagem é exibida.
- **Regras e validações:**
  - Código da disciplina: 3 letras maiúsculas + 3 dígitos (`/^[A-Z]{3}\d{3}$/`), único.
  - Créditos da disciplina: 2 ou 4.
  - Pré-requisitos: outras disciplinas (nunca a própria).
  - Matrícula do aluno: 9 dígitos (`/^\d{9}$/`), única.
  - Nome: mínimo 3 caracteres, só letras (com acentos) e espaços.
  - E-mail: formato válido.
  - Carga máxima do professor: inteiro entre 2 e 40 créditos.
  - Histórico do aluno (disciplinas aprovadas): marcado com checkboxes.

### UC2 — Ofertar turma

- **Ator:** Secretaria.
- **Objetivo:** montar a oferta do semestre criando turmas (disciplina + professor + horários + vagas).
- **Fluxo principal:**
  1. A secretaria abre **Turmas** e clica em **Nova turma**.
  2. Escolhe disciplina, professor, semestre, número de vagas e clica nos horários desejados no **seletor dia × turno**.
  3. O sistema mostra, ao lado do professor, a carga atual / máxima dele no semestre.
  4. Ao salvar, o sistema valida as regras abaixo; se tudo ok, grava e atualiza a lista.
- **Fluxos alternativos:**
  - Professor já tem outra turma num dos horários → bloqueia com "Conflito de horário: o professor já leciona XXX na Segunda · Manhã".
  - Carga ultrapassada → bloqueia com "Carga excedida: 14 de 12 créditos".
  - Excluir turma com alunos matriculados → servidor responde 409.
- **Regras:**
  - Pelo menos 1 horário; cada código casa com `/^[2-7][1-3]$/`.
  - Vagas: inteiro de 1 a 80 (e não menor que o número de matriculados, na edição).
  - Semestre no formato `AAAA/1` ou `AAAA/2`.
  - Professor sem conflito de horário com outra turma dele no mesmo semestre.
  - Soma dos créditos das turmas do professor no semestre ≤ `cargaMaxima`.
- **Apoio à carga balanceada:** o Painel exibe uma barra de progresso de carga por professor (verde < 75%, amarelo ≥ 75%, vermelho = 100%), e o select de professores mostra a carga de cada um, ajudando a distribuir as turmas.

### UC3 — Matricular-se em turma

- **Ator:** Aluno.
- **Objetivo:** matricular-se em turmas ofertadas no semestre.
- **Fluxo principal:**
  1. O aluno abre **Ofertas**.
  2. O sistema lista as turmas do semestre com filtros (busca, dia, turno) e um **status** para cada uma.
  3. O aluno clica em **Matricular** numa turma disponível.
  4. O sistema pede confirmação, grava a matrícula e atualiza os status e a ocupação.
- **Status possíveis** (verificados nesta ordem; o primeiro que falhar é exibido):

  | Status | Regra |
  |---|---|
  | Já matriculado | o aluno já está nesta turma |
  | Já cursada | a disciplina está em `disciplinasAprovadas` |
  | Já matriculado na disciplina | o aluno está em outra turma da mesma disciplina no semestre |
  | Pré-requisito pendente | falta aprovação em algum pré-requisito (mostra quais) |
  | Lotada | matriculados ≥ vagas |
  | Conflito de horário | algum horário coincide com outra matrícula do aluno (mostra qual) |
  | Limite de créditos | créditos matriculados + créditos da turma > 20 |
  | Disponível | nenhuma das anteriores |

- A função de regra retorna `{ permitido, motivo }`; o botão **Matricular** só fica habilitado quando `permitido` é verdadeiro.

### UC4 — Cancelar matrícula

- **Atores:** Aluno (as próprias) e Secretaria (no detalhe da turma).
- **Fluxo:** clicar em **Cancelar** / **Remover** → modal de confirmação → exclusão na API → lista, grade e vagas atualizadas → notificação.

### UC5 — Consultar grades

- **Secretaria — Grade de ofertas:** tabela turnos × dias (seg a sáb) com todas as turmas do semestre escolhido em cada célula (código da disciplina, professor, ocupação).
- **Aluno — Grade pessoal:** a mesma tabela (componente `GradeSemanal` reutilizado) só com as turmas em que está matriculado, mais o total de créditos.

## 4. Mapa de telas e rotas

| Rota | Perfil | Tela |
|---|---|---|
| `/` | público | Entrar |
| `/secretaria` | secretaria | Painel |
| `/secretaria/disciplinas` | secretaria | Disciplinas |
| `/secretaria/professores` | secretaria | Professores |
| `/secretaria/alunos` | secretaria | Alunos |
| `/secretaria/turmas` | secretaria | Turmas (ofertas) |
| `/secretaria/turmas/:id` | secretaria | Detalhe da turma |
| `/secretaria/grade` | secretaria | Grade de ofertas |
| `/aluno` | aluno | Minhas matrículas |
| `/aluno/ofertas` | aluno | Ofertas disponíveis |
| `*` | — | Página não encontrada |

```
                         ┌──────────┐
                         │  Entrar  │  /
                         └────┬─────┘
                ┌─────────────┴──────────────┐
          Secretaria                        Aluno
                │                             │
   ┌────────────┼──────────────┐       ┌──────┴────────┐
 Painel  Disciplinas  Professores   Minhas matrículas  Ofertas
   │     Alunos  Turmas ── Detalhe
   └──── Grade de ofertas
```

`RotaProtegida` redireciona para `/` quando não há perfil ou quando o perfil não pode acessar a rota.

## 5. Protótipo das telas (wireframes)

### 5.1 Entrar (`/`)

```
┌──────────────────────────────────────────────────────┐
│                  Sistema de Matrículas               │
│                                                      │
│   ┌────────────────────┐   ┌────────────────────┐    │
│   │   🏛  Secretaria    │   │   🎓  Aluno         │    │
│   │   acadêmica        │   │                    │    │
│   │                    │   │ [Selecione ▼     ] │    │
│   │    [ Entrar ]      │   │    [ Entrar ]      │    │
│   └────────────────────┘   └────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

### 5.2 Barra de navegação (muda conforme o perfil)

```
Secretaria:
┌──────────────────────────────────────────────────────────────────────────────┐
│ Matrículas │ Painel  Disciplinas  Professores  Alunos  Turmas  Grade │ Secretaria [Sair] │
└──────────────────────────────────────────────────────────────────────────────┘
Aluno:
┌──────────────────────────────────────────────────────────────────────────────┐
│ Matrículas │ Minhas matrículas  Ofertas                      │ Ana Souza [Sair] │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Painel da secretaria (`/secretaria`)

```
┌──────────────────────────────────────────────────────────────────┐
│ Painel — semestre [2026/2 ▼]                                     │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ │Disciplinas│ │Professores│ │ Alunos  │ │ Turmas   │ │Matrículas│ │
│ │    8     │ │    4     │ │    6     │ │    8     │ │   14     │ │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│                                                                  │
│ Carga dos professores            │ Turmas lotadas / quase lotadas│
│ Carlos  ███████████░  10/12      │ INF201 · Seg manhã   9/10 ⚠   │
│ Marina  ██████░░░░░░   8/16      │ INF305 · Ter noite  20/20 ⛔  │
│ Paulo   ███░░░░░░░░░   4/12      │                               │
│ Renata  ████████████  12/12 ⛔   │                               │
└──────────────────────────────────────────────────────────────────┘
```

### 5.4 Disciplinas (`/secretaria/disciplinas`) — mesmo padrão para Professores e Alunos

```
┌──────────────────────────────────────────────────────────────────┐
│ Disciplinas                                      [+ Nova]        │
│ [🔍 Buscar por código ou nome...           ]                     │
│ ┌────────┬──────────────────────┬──────────┬───────────┬───────┐ │
│ │ Código │ Nome                 │ Créditos │ Pré-req.  │ Ações │ │
│ ├────────┼──────────────────────┼──────────┼───────────┼───────┤ │
│ │ INF101 │ Algoritmos I         │    4     │ —         │ ✎  🗑 │ │
│ │ INF102 │ Algoritmos II        │    4     │ INF101    │ ✎  🗑 │ │
│ └────────┴──────────────────────┴──────────┴───────────┴───────┘ │
└──────────────────────────────────────────────────────────────────┘

Modal:
┌────────────── Nova disciplina ──────────────┐
│ Código   [INF10_ ]  ⚠ Use 3 letras + 3 dígitos│
│ Nome     [                         ]        │
│ Créditos (•) 2   ( ) 4                      │
│ Pré-requisitos                              │
│   [x] INF101 Algoritmos I                   │
│   [ ] INF102 Algoritmos II                  │
│                     [Cancelar]  [Salvar]    │
└─────────────────────────────────────────────┘
```

- **Professores:** colunas Nome, E-mail, Carga (atual/máxima no semestre), Ações. Modal: nome, e-mail, carga máxima.
- **Alunos:** colunas Matrícula, Nome, E-mail, Curso, Aprovadas, Ações. Modal: matrícula, nome, e-mail, curso e checkboxes de disciplinas aprovadas (histórico).

### 5.5 Turmas (`/secretaria/turmas`)

```
┌──────────────────────────────────────────────────────────────────┐
│ Turmas                                         [+ Nova turma]    │
│ Semestre [2026/2 ▼]  Disciplina [Todas ▼]  Professor [Todos ▼]   │
│ ┌─────────────────────┬──────────┬─────────────────┬──────┬────┐ │
│ │ Disciplina          │Professor │ Horários        │Vagas │    │ │
│ ├─────────────────────┼──────────┼─────────────────┼──────┼────┤ │
│ │ INF101 Algoritmos I │ Carlos   │ Seg manhã·Qua m.│ 18/20│👁✎🗑│ │
│ │ INF201 Estr. Dados  │ Renata   │ Ter noite       │ 9/10 │👁✎🗑│ │
│ └─────────────────────┴──────────┴─────────────────┴──────┴────┘ │
└──────────────────────────────────────────────────────────────────┘

Modal (com SeletorHorarios):
┌─────────────────── Nova turma ───────────────────┐
│ Disciplina [INF101 Algoritmos I (4 cr.)   ▼]     │
│ Professor  [Carlos — 6/12 cr.             ▼]     │
│ Semestre   [2026/2]      Vagas [ 40 ]            │
│ Horários:                                        │
│          Seg   Ter   Qua   Qui   Sex   Sáb       │
│  Manhã   [■]   [ ]   [■]   [ ]   [ ]   [ ]       │
│  Tarde   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]       │
│  Noite   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]       │
│ ⛔ Conflito: Carlos já leciona INF102 na Qua manhã│
│                          [Cancelar]  [Salvar]    │
└──────────────────────────────────────────────────┘
```

### 5.6 Detalhe da turma (`/secretaria/turmas/:id`)

```
┌──────────────────────────────────────────────────────────────────┐
│ ← Voltar                                                         │
│ INF101 — Algoritmos I · 2026/2                                   │
│ Professor: Carlos Lima   Horários: Segunda · Manhã, Quarta · Manhã│
│ Ocupação: ███████████████░░░  18/20                              │
│                                                                  │
│ Alunos matriculados                                              │
│ ┌───────────┬──────────────┬─────────────┬───────────┐           │
│ │ Matrícula │ Nome         │ Data        │           │           │
│ │ 202610001 │ Ana Souza    │ 02/08/2026  │ [Remover] │           │
│ └───────────┴──────────────┴─────────────┴───────────┘           │
└──────────────────────────────────────────────────────────────────┘
```

### 5.7 Grade de ofertas (`/secretaria/grade`) — componente `GradeSemanal`

```
┌──────────────────────────────────────────────────────────────────┐
│ Grade de ofertas — semestre [2026/2 ▼]                           │
│ ┌───────┬───────────┬───────────┬───────────┬─────┬─────┬─────┐  │
│ │       │ Segunda   │ Terça     │ Quarta    │Quinta│Sexta│Sábado│ │
│ ├───────┼───────────┼───────────┼───────────┼─────┼─────┼─────┤  │
│ │ Manhã │ INF101    │           │ INF101    │     │     │     │  │
│ │       │ Carlos    │           │ Carlos    │     │     │     │  │
│ │       │ 18/20     │           │ 18/20     │     │     │     │  │
│ │ Tarde │           │ INF102    │           │ ... │     │     │  │
│ │ Noite │ INF305    │ INF201    │           │     │     │     │  │
│ └───────┴───────────┴───────────┴───────────┴─────┴─────┴─────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 5.8 Minhas matrículas (`/aluno`)

```
┌──────────────────────────────────────────────────────────────────┐
│ Minhas matrículas — 2026/2                Créditos: 12 / 20      │
│ ┌─────────────────────┬──────────┬────────────────┬────────────┐ │
│ │ Disciplina          │Professor │ Horários       │            │ │
│ │ INF102 Algoritmos II│ Marina   │ Ter tarde      │ [Cancelar] │ │
│ └─────────────────────┴──────────┴────────────────┴────────────┘ │
│                                                                  │
│ Minha grade semanal  (GradeSemanal reutilizado)                  │
│ ┌───────┬────────┬────────┬────────┬────────┬───────┬────────┐   │
│ │ Manhã │        │        │        │        │       │        │   │
│ │ Tarde │        │ INF102 │        │        │       │        │   │
│ │ Noite │        │        │        │        │       │        │   │
│ └───────┴────────┴────────┴────────┴────────┴───────┴────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### 5.9 Ofertas disponíveis (`/aluno/ofertas`)

```
┌──────────────────────────────────────────────────────────────────┐
│ Ofertas — 2026/2                                                 │
│ [🔍 Buscar disciplina...]  Dia [Todos ▼]  Turno [Todos ▼]        │
│ ┌─────────────────────────┐ ┌─────────────────────────┐          │
│ │ INF101 Algoritmos I     │ │ INF201 Estruturas Dados │          │
│ │ Carlos · 4 créditos     │ │ Renata · 4 créditos     │          │
│ │ Seg manhã, Qua manhã    │ │ Ter noite               │          │
│ │ Vagas 18/20             │ │ Vagas 9/10              │          │
│ │ [✔ Disponível]          │ │ [⚠ Pré-requisito        │          │
│ │                         │ │    pendente: INF102]    │          │
│ │ [ Matricular ]          │ │ [ Matricular ] (desab.) │          │
│ └─────────────────────────┘ └─────────────────────────┘          │
└──────────────────────────────────────────────────────────────────┘
```

### 5.10 Página não encontrada (`*`)

```
┌──────────────────────────────────────┐
│        404 — Página não encontrada   │
│        [ Voltar ao início ]          │
└──────────────────────────────────────┘
```

## 6. Modelo de dados

```
 disciplinas ◄──── preRequisitos (ids de disciplinas)
     ▲  ▲
     │  └───────── alunos.disciplinasAprovadas (ids)
     │
   turmas ───────► professores
     ▲
     │
 matriculas ─────► alunos
```

| Coleção | Campo | Tipo | Observação |
|---|---|---|---|
| **disciplinas** | `id` | string | gerado pelo servidor |
| | `codigo` | string | `INF101` — `/^[A-Z]{3}\d{3}$/` |
| | `nome` | string | |
| | `creditos` | number | 2 ou 4 |
| | `preRequisitos` | string[] | ids de disciplinas |
| **professores** | `id` | string | |
| | `nome` | string | |
| | `email` | string | |
| | `cargaMaxima` | number | créditos por semestre |
| **alunos** | `id` | string | |
| | `matricula` | string | 9 dígitos |
| | `nome` | string | |
| | `email` | string | |
| | `curso` | string | |
| | `disciplinasAprovadas` | string[] | ids de disciplinas (histórico) |
| **turmas** | `id` | string | |
| | `disciplinaId` | string | |
| | `professorId` | string | |
| | `semestre` | string | `2026/2` — `/^\d{4}\/[12]$/` |
| | `horarios` | string[] | códigos, ex. `["21","41"]` |
| | `vagas` | number | 1 a 80 |
| **matriculas** | `id` | string | |
| | `alunoId` | string | |
| | `turmaId` | string | |
| | `dataMatricula` | string | ISO 8601 |

## 7. API (Express, porta 3001)

| Método | Rota | Resposta |
|---|---|---|
| GET | `/:colecao` | lista (filtro por query string, ex. `/matriculas?alunoId=3`) |
| GET | `/:colecao/:id` | item ou 404 |
| POST | `/:colecao` | 201 + item criado |
| PUT | `/:colecao/:id` | item atualizado ou 404 |
| DELETE | `/:colecao/:id` | 204, 404, ou 409 se houver vínculos |
| POST | `/reset` | restaura os dados de exemplo |

## 8. Arquitetura do front-end

```
frontend/src
├── main.jsx, App.jsx          rotas (BrowserRouter / Routes / Route)
├── services/api.js            wrapper de fetch (get, post, put, del)
├── context/                   AuthContext (perfil), NotificacaoContext (toasts)
├── utils/                     funções puras: horarios, validacoes, regras
├── components/                Layout, BarraNavegacao, RotaProtegida, GradeSemanal,
│                              SeletorHorarios, Carregando, MensagemErro, ModalConfirmacao
└── pages/                     Entrar, NaoEncontrada, secretaria/*, aluno/*
```

- **Regras de negócio em funções puras** (`utils/regras.js`): fáceis de ler, testar e explicar; os componentes só chamam e exibem o resultado.
- **Toda tela com dados** trata três estados: carregando (Spinner), erro (Alert) e vazio.

## 9. Decisões técnicas

| Decisão | Por quê |
|---|---|
| **React + Vite** em vez de Create React App | O CRA, visto na Semana 6, foi descontinuado pelo time do React em fevereiro de 2025; o Vite é o substituto recomendado. |
| **Componentes funcionais com hooks** | `useState` substitui `setState` e `useEffect` faz o papel de `componentDidMount`/`componentDidUpdate`; é a forma atual recomendada pelo React. |
| **React Router (declarativo)** | Troca de páginas sem recarregar (SPA), com rotas protegidas por perfil. |
| **Bootstrap + React-Bootstrap** | Biblioteca de UI sugerida na disciplina; layout responsivo e componentes prontos (Modal, Table, Toast, ProgressBar). |
| **Context API** | Estado global pequeno (perfil logado e notificações) sem precisar de Redux. |
| **`fetch` nativo** | Integração com o back-end como visto nas aulas, sem bibliotecas extras. |
| **Express + arquivo JSON** | É o "web-server simples" da Semana 5; roda localmente junto com o ZIP, sem depender de serviço externo nem de banco de dados. |
| **Validação com expressões regulares** | Conteúdo da disciplina; validação de primeira camada no front, com feedback imediato no formulário. |
| **Sem renderização no servidor** | Exigência do enunciado: o servidor só entrega JSON; toda a interface é renderizada no navegador. |
| **Identificação sem senha** | Autenticação está fora do escopo; o foco é demonstrar as duas visões e as regras de matrícula. |
