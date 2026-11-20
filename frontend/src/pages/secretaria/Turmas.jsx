import { useMemo, useState } from 'react';
import { Badge, Button, Card, Col, Row, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Carregando from '../../components/Carregando';
import FormularioTurma from '../../components/FormularioTurma';
import MensagemErro from '../../components/MensagemErro';
import ModalConfirmacao from '../../components/ModalConfirmacao';
import Seletor from '../../components/Seletor';
import { useNotificacao } from '../../context/NotificacaoContext';
import useDados from '../../hooks/useDados';
import { del, post, put } from '../../services/api';
import { horarioCurto } from '../../utils/horarios';
import { SEMESTRE_ATUAL, corDaCarga, ocupacao } from '../../utils/regras';

export default function Turmas() {
  const { dados, carregando, erro, recarregar, tentarNovamente } = useDados({
    turmas: '/turmas',
    disciplinas: '/disciplinas',
    professores: '/professores',
    matriculas: '/matriculas',
  });
  const { notificar } = useNotificacao();

  const [filtros, setFiltros] = useState({ semestre: SEMESTRE_ATUAL, disciplinaId: '', professorId: '' });
  const [emEdicao, setEmEdicao] = useState(null);
  const [paraExcluir, setParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  // Semestres existentes nas turmas, sempre incluindo o atual
  const semestres = useMemo(() => {
    const lista = new Set([SEMESTRE_ATUAL, ...(dados?.turmas ?? []).map((t) => t.semestre)]);
    return [...lista].sort().reverse();
  }, [dados]);

  // Junta turma + disciplina + professor + ocupação e aplica os filtros
  const linhas = useMemo(() => {
    if (!dados) return [];
    return dados.turmas
      .filter(
        (t) =>
          (!filtros.semestre || t.semestre === filtros.semestre) &&
          (!filtros.disciplinaId || t.disciplinaId === filtros.disciplinaId) &&
          (!filtros.professorId || t.professorId === filtros.professorId)
      )
      .map((t) => ({
        ...t,
        disciplina: dados.disciplinas.find((d) => d.id === t.disciplinaId),
        professor: dados.professores.find((p) => p.id === t.professorId),
        matriculados: ocupacao(t.id, dados.matriculas),
      }))
      .sort((a, b) => (a.disciplina?.codigo ?? '').localeCompare(b.disciplina?.codigo ?? ''));
  }, [dados, filtros]);

  function alterarFiltro(campo, valor) {
    setFiltros({ ...filtros, [campo]: valor });
  }

  async function salvar(turma) {
    // Remove os campos calculados antes de enviar para a API
    const { disciplina: _d, professor: _p, matriculados: _m, ...dadosTurma } = turma;
    try {
      if (dadosTurma.id) await put(`/turmas/${dadosTurma.id}`, dadosTurma);
      else await post('/turmas', dadosTurma);
      notificar('Turma salva.');
      setEmEdicao(null);
      recarregar();
      return true;
    } catch (e) {
      notificar(e.message, 'danger');
      return false;
    }
  }

  async function excluir() {
    setExcluindo(true);
    try {
      await del(`/turmas/${paraExcluir.id}`);
      notificar('Turma excluída.');
      recarregar();
    } catch (e) {
      notificar(e.message, 'danger');
    } finally {
      setExcluindo(false);
      setParaExcluir(null);
    }
  }

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h1 className="h3 mb-0">Turmas</h1>
          {dados && <span className="text-secondary small">{linhas.length} turmas no filtro atual</span>}
        </div>
        <Button onClick={() => setEmEdicao({})} disabled={!dados}>
          <i className="bi bi-plus-lg me-1" />
          Nova turma
        </Button>
      </div>

      {carregando && <Carregando />}
      {erro && <MensagemErro mensagem={erro} onTentarNovamente={tentarNovamente} />}

      {dados && !erro && (
        <Card className="shadow-sm border-0">
          <Card.Body>
            <Row className="g-2 mb-3">
              <Col sm={4} lg={3}>
                <Seletor
                  ariaLabel="Semestre"
                  value={filtros.semestre}
                  onChange={(valor) => alterarFiltro('semestre', valor)}
                  opcoes={[
                    { valor: '', rotulo: 'Todos os semestres' },
                    ...semestres.map((s) => ({ valor: s, rotulo: s })),
                  ]}
                />
              </Col>
              <Col sm={4} lg={3}>
                <Seletor
                  ariaLabel="Disciplina"
                  value={filtros.disciplinaId}
                  onChange={(valor) => alterarFiltro('disciplinaId', valor)}
                  opcoes={[
                    { valor: '', rotulo: 'Todas as disciplinas' },
                    ...[...dados.disciplinas]
                      .sort((a, b) => a.codigo.localeCompare(b.codigo))
                      .map((d) => ({ valor: d.id, rotulo: `${d.codigo} — ${d.nome}` })),
                  ]}
                />
              </Col>
              <Col sm={4} lg={3}>
                <Seletor
                  ariaLabel="Professor"
                  value={filtros.professorId}
                  onChange={(valor) => alterarFiltro('professorId', valor)}
                  opcoes={[
                    { valor: '', rotulo: 'Todos os professores' },
                    ...[...dados.professores]
                      .sort((a, b) => a.nome.localeCompare(b.nome))
                      .map((p) => ({ valor: p.id, rotulo: p.nome })),
                  ]}
                />
              </Col>
            </Row>

            {linhas.length === 0 ? (
              <p className="text-secondary text-center py-4 mb-0">
                {dados.turmas.length === 0
                  ? 'Nenhuma turma ofertada. Clique em "Nova turma" para começar.'
                  : 'Nenhuma turma encontrada com estes filtros.'}
              </p>
            ) : (
              <Table responsive hover className="align-middle mb-0">
                <thead>
                  <tr>
                    <th>Disciplina</th>
                    <th>Professor</th>
                    <th>Semestre</th>
                    <th>Horários</th>
                    <th className="text-center">Ocupação</th>
                    <th className="text-end">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((turma) => (
                    <tr key={turma.id}>
                      <td>
                        <span className="fw-semibold">{turma.disciplina?.codigo}</span>{' '}
                        {turma.disciplina?.nome}
                      </td>
                      <td>{turma.professor?.nome}</td>
                      <td>{turma.semestre}</td>
                      <td>
                        {turma.horarios.map((h) => (
                          <Badge key={h} bg="light" text="dark" className="border me-1 fw-normal">
                            {horarioCurto(h)}
                          </Badge>
                        ))}
                      </td>
                      <td className="text-center">
                        <Badge bg={corDaCarga(turma.matriculados, turma.vagas)}>
                          {turma.matriculados}/{turma.vagas}
                        </Badge>
                      </td>
                      <td className="text-end text-nowrap">
                        <Button
                          as={Link}
                          to={`/secretaria/turmas/${turma.id}`}
                          variant="outline-secondary"
                          size="sm"
                          className="me-2"
                          title="Ver alunos"
                          aria-label={`Ver turma de ${turma.disciplina?.codigo}`}
                        >
                          <i className="bi bi-eye" />
                        </Button>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          title="Editar"
                          aria-label={`Editar turma de ${turma.disciplina?.codigo}`}
                          onClick={() => setEmEdicao(turma)}
                        >
                          <i className="bi bi-pencil" />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          title="Excluir"
                          aria-label={`Excluir turma de ${turma.disciplina?.codigo}`}
                          onClick={() => setParaExcluir(turma)}
                        >
                          <i className="bi bi-trash" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      )}

      {emEdicao && (
        <FormularioTurma turma={emEdicao} dados={dados} onSalvar={salvar} onFechar={() => setEmEdicao(null)} />
      )}

      <ModalConfirmacao
        show={Boolean(paraExcluir)}
        titulo="Excluir turma"
        mensagem={
          paraExcluir &&
          `Deseja excluir a turma de ${paraExcluir.disciplina?.codigo} com ${paraExcluir.professor?.nome} (${paraExcluir.semestre})?`
        }
        textoConfirmar="Excluir"
        processando={excluindo}
        onConfirmar={excluir}
        onCancelar={() => setParaExcluir(null)}
      />
    </>
  );
}
