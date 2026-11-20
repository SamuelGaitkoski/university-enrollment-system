import { useMemo, useState } from 'react';
import { Badge, Button, Card, Col, Form, InputGroup, Row } from 'react-bootstrap';
import Carregando from '../../components/Carregando';
import MensagemErro from '../../components/MensagemErro';
import ModalConfirmacao from '../../components/ModalConfirmacao';
import StatusTurma from '../../components/StatusTurma';
import { useAuth } from '../../context/AuthContext';
import { useNotificacao } from '../../context/NotificacaoContext';
import useDados from '../../hooks/useDados';
import { get, post } from '../../services/api';
import { DIAS, TURNOS, horarioCurto } from '../../utils/horarios';
import { LIMITE_CREDITOS, SEMESTRE_ATUAL, avaliarMatricula, creditosDoAluno, ocupacao } from '../../utils/regras';

export default function Ofertas() {
  const { perfil } = useAuth();
  const { notificar } = useNotificacao();
  // O aluno é buscado na API para ter o histórico sempre atualizado
  const { dados, carregando, erro, recarregar, tentarNovamente } = useDados({
    aluno: `/alunos/${perfil.aluno.id}`,
    turmas: `/turmas?semestre=${SEMESTRE_ATUAL}`,
    disciplinas: '/disciplinas',
    professores: '/professores',
    matriculas: '/matriculas',
  });

  const [filtros, setFiltros] = useState({ busca: '', dia: '', turno: '', soDisponiveis: false });
  const [escolhida, setEscolhida] = useState(null);
  const [matriculando, setMatriculando] = useState(false);

  // Cada turma recebe o resultado das regras de matrícula para este aluno
  const ofertas = useMemo(() => {
    if (!dados) return [];
    return dados.turmas
      .map((turma) => ({
        turma,
        disciplina: dados.disciplinas.find((d) => d.id === turma.disciplinaId),
        professor: dados.professores.find((p) => p.id === turma.professorId),
        matriculados: ocupacao(turma.id, dados.matriculas),
        avaliacao: avaliarMatricula(dados.aluno, turma, dados),
      }))
      .sort((a, b) => (a.disciplina?.codigo ?? '').localeCompare(b.disciplina?.codigo ?? ''));
  }, [dados]);

  const filtradas = ofertas.filter(({ turma, disciplina, professor, avaliacao }) => {
    const termo = filtros.busca.trim().toLowerCase();
    const texto = `${disciplina?.codigo} ${disciplina?.nome} ${professor?.nome}`.toLowerCase();
    return (
      texto.includes(termo) &&
      (!filtros.dia || turma.horarios.some((h) => h[0] === filtros.dia)) &&
      (!filtros.turno || turma.horarios.some((h) => h[1] === filtros.turno)) &&
      (!filtros.soDisponiveis || avaliacao.permitido)
    );
  });

  const creditos = dados ? creditosDoAluno(dados.aluno.id, SEMESTRE_ATUAL, dados) : 0;

  function handleFiltro(evento) {
    const { name, value, type, checked } = evento.target;
    setFiltros({ ...filtros, [name]: type === 'checkbox' ? checked : value });
  }

  async function matricular() {
    setMatriculando(true);
    try {
      // Confere de novo com dados atuais: outra pessoa pode ter ocupado a última vaga
      const matriculas = await get('/matriculas');
      const avaliacao = avaliarMatricula(dados.aluno, escolhida.turma, { ...dados, matriculas });
      if (!avaliacao.permitido) throw new Error(avaliacao.motivo);

      await post('/matriculas', {
        alunoId: dados.aluno.id,
        turmaId: escolhida.turma.id,
        dataMatricula: new Date().toISOString(),
      });
      notificar(`Matrícula em ${escolhida.disciplina?.codigo} realizada!`);
    } catch (e) {
      notificar(e.message, 'danger');
    } finally {
      setMatriculando(false);
      setEscolhida(null);
      recarregar();
    }
  }

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h1 className="h3 mb-0">Ofertas disponíveis</h1>
          <span className="text-secondary small">Semestre {SEMESTRE_ATUAL}</span>
        </div>
        {dados && (
          <Badge bg={creditos >= LIMITE_CREDITOS ? 'danger' : 'primary'} className="fs-6 fw-normal">
            {creditos} / {LIMITE_CREDITOS} créditos
          </Badge>
        )}
      </div>

      {carregando && <Carregando />}
      {erro && <MensagemErro mensagem={erro} onTentarNovamente={tentarNovamente} />}

      {dados && !erro && (
        <>
          <Card className="shadow-sm border-0 mb-3">
            <Card.Body>
              <Row className="g-2 align-items-center">
                <Col md={5}>
                  <InputGroup>
                    <InputGroup.Text>
                      <i className="bi bi-search" />
                    </InputGroup.Text>
                    <Form.Control
                      name="busca"
                      placeholder="Buscar disciplina ou professor"
                      aria-label="Buscar oferta"
                      value={filtros.busca}
                      onChange={handleFiltro}
                    />
                  </InputGroup>
                </Col>
                <Col xs={6} md={2}>
                  <Form.Select name="dia" value={filtros.dia} onChange={handleFiltro} aria-label="Dia">
                    <option value="">Todos os dias</option>
                    {DIAS.map((d) => (
                      <option key={d.codigo} value={d.codigo}>
                        {d.nome}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col xs={6} md={2}>
                  <Form.Select name="turno" value={filtros.turno} onChange={handleFiltro} aria-label="Turno">
                    <option value="">Todos os turnos</option>
                    {TURNOS.map((t) => (
                      <option key={t.codigo} value={t.codigo}>
                        {t.nome}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Check
                    type="switch"
                    id="soDisponiveis"
                    name="soDisponiveis"
                    label="Só disponíveis"
                    checked={filtros.soDisponiveis}
                    onChange={handleFiltro}
                  />
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {filtradas.length === 0 && (
            <p className="text-secondary text-center py-5">
              {ofertas.length === 0
                ? 'Nenhuma turma ofertada neste semestre.'
                : 'Nenhuma turma encontrada com estes filtros.'}
            </p>
          )}

          <Row xs={1} md={2} lg={3} className="g-3">
            {filtradas.map(({ turma, disciplina, professor, matriculados, avaliacao }) => (
              <Col key={turma.id}>
                <Card className={`h-100 shadow-sm border-0 ${avaliacao.permitido ? '' : 'bg-body-tertiary'}`}>
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                      <Card.Title as="h2" className="h6 mb-0">
                        <span className="text-primary">{disciplina?.codigo}</span> {disciplina?.nome}
                      </Card.Title>
                      <span className="small text-secondary text-nowrap">{disciplina?.creditos} cr.</span>
                    </div>
                    <div className="small text-secondary mb-2">
                      <i className="bi bi-person me-1" />
                      {professor?.nome}
                    </div>
                    <div className="mb-2">
                      {turma.horarios.map((h) => (
                        <Badge key={h} bg="light" text="dark" className="border me-1 fw-normal">
                          <i className="bi bi-clock me-1" />
                          {horarioCurto(h)}
                        </Badge>
                      ))}
                    </div>
                    <div className="small mb-3">
                      Vagas: {matriculados}/{turma.vagas}
                    </div>

                    {/* Renderização condicional: o status e o motivo vêm das regras */}
                    <div className="mt-auto">
                      <StatusTurma status={avaliacao.status} />
                      {!avaliacao.permitido && <div className="small text-secondary mt-1">{avaliacao.motivo}</div>}
                      <Button
                        className="w-100 mt-2"
                        variant={avaliacao.permitido ? 'success' : 'outline-secondary'}
                        disabled={!avaliacao.permitido}
                        onClick={() => setEscolhida({ turma, disciplina, professor })}
                      >
                        Matricular
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </>
      )}

      <ModalConfirmacao
        show={Boolean(escolhida)}
        titulo="Confirmar matrícula"
        mensagem={
          escolhida && (
            <>
              Matricular-se em <strong>{escolhida.disciplina?.codigo} — {escolhida.disciplina?.nome}</strong> com{' '}
              {escolhida.professor?.nome} ({escolhida.turma.horarios.map(horarioCurto).join(', ')})?
            </>
          )
        }
        textoConfirmar="Matricular"
        variante="success"
        processando={matriculando}
        onConfirmar={matricular}
        onCancelar={() => setEscolhida(null)}
      />
    </>
  );
}
