import { useMemo, useState } from 'react';
import { Alert, Button, Card, Col, ProgressBar, Row, Table } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import Carregando from '../../components/Carregando';
import MensagemErro from '../../components/MensagemErro';
import ModalConfirmacao from '../../components/ModalConfirmacao';
import { useNotificacao } from '../../context/NotificacaoContext';
import useDados from '../../hooks/useDados';
import { del } from '../../services/api';
import { decodificarHorario } from '../../utils/horarios';
import { corDaCarga } from '../../utils/regras';

export default function DetalheTurma() {
  const { id } = useParams(); // id da turma vindo da URL /secretaria/turmas/:id
  const { dados, carregando, erro, recarregar, tentarNovamente } = useDados({
    turmas: '/turmas',
    disciplinas: '/disciplinas',
    professores: '/professores',
    alunos: '/alunos',
    matriculas: `/matriculas?turmaId=${id}`,
  });
  const { notificar } = useNotificacao();

  const [paraRemover, setParaRemover] = useState(null);
  const [removendo, setRemovendo] = useState(false);

  const turma = dados?.turmas.find((t) => t.id === id);
  const disciplina = dados?.disciplinas.find((d) => d.id === turma?.disciplinaId);
  const professor = dados?.professores.find((p) => p.id === turma?.professorId);

  // Lista de matriculados com os dados do aluno
  const matriculados = useMemo(() => {
    if (!dados) return [];
    return dados.matriculas
      .map((m) => ({ ...m, aluno: dados.alunos.find((a) => a.id === m.alunoId) }))
      .sort((a, b) => (a.aluno?.nome ?? '').localeCompare(b.aluno?.nome ?? ''));
  }, [dados]);

  // UC4 pela secretaria: remove a matrícula do aluno nesta turma
  async function removerMatricula() {
    setRemovendo(true);
    try {
      await del(`/matriculas/${paraRemover.id}`);
      notificar(`Matrícula de ${paraRemover.aluno?.nome} removida.`);
      recarregar();
    } catch (e) {
      notificar(e.message, 'danger');
    } finally {
      setRemovendo(false);
      setParaRemover(null);
    }
  }

  const voltar = (
    <Button as={Link} to="/secretaria/turmas" variant="link" className="px-0 mb-2">
      <i className="bi bi-arrow-left me-1" />
      Voltar para turmas
    </Button>
  );

  if (carregando) return <Carregando />;
  if (erro) return <MensagemErro mensagem={erro} onTentarNovamente={tentarNovamente} />;
  if (!turma) {
    return (
      <>
        {voltar}
        <Alert variant="warning">Turma não encontrada.</Alert>
      </>
    );
  }

  const percentual = (matriculados.length / turma.vagas) * 100;

  return (
    <>
      {voltar}
      <h1 className="h3 mb-1">
        {disciplina?.codigo} — {disciplina?.nome}
      </h1>
      <p className="text-secondary mb-3">Semestre {turma.semestre}</p>

      <Row className="g-3 mb-4">
        <Col md={4}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body>
              <div className="text-secondary small">Professor</div>
              <div className="fw-semibold">{professor?.nome}</div>
              <div className="small text-secondary">{professor?.email}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body>
              <div className="text-secondary small">Horários</div>
              {turma.horarios.map((h) => (
                <div key={h} className="fw-semibold">
                  {decodificarHorario(h)} <span className="text-secondary small fw-normal">({h})</span>
                </div>
              ))}
              <div className="small text-secondary">{disciplina?.creditos} créditos</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body>
              <div className="text-secondary small">Ocupação</div>
              <div className="fw-semibold mb-2">
                {matriculados.length} de {turma.vagas} vagas
              </div>
              <ProgressBar
                variant={corDaCarga(matriculados.length, turma.vagas)}
                now={Math.min(100, percentual)}
                aria-label="Ocupação da turma"
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm border-0">
        <Card.Body>
          <h2 className="h5 mb-3">Alunos matriculados</h2>
          {matriculados.length === 0 ? (
            <p className="text-secondary text-center py-3 mb-0">Nenhum aluno matriculado nesta turma.</p>
          ) : (
            <Table responsive hover className="align-middle mb-0">
              <thead>
                <tr>
                  <th>Matrícula</th>
                  <th>Nome</th>
                  <th>Curso</th>
                  <th>Data da matrícula</th>
                  <th className="text-end">Ações</th>
                </tr>
              </thead>
              <tbody>
                {matriculados.map((m) => (
                  <tr key={m.id}>
                    <td className="font-monospace">{m.aluno?.matricula}</td>
                    <td className="fw-semibold">{m.aluno?.nome ?? 'Aluno removido'}</td>
                    <td>{m.aluno?.curso}</td>
                    <td>{new Date(m.dataMatricula).toLocaleDateString('pt-BR')}</td>
                    <td className="text-end">
                      <Button variant="outline-danger" size="sm" onClick={() => setParaRemover(m)}>
                        <i className="bi bi-person-dash me-1" />
                        Remover
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <ModalConfirmacao
        show={Boolean(paraRemover)}
        titulo="Remover matrícula"
        mensagem={paraRemover && `Remover ${paraRemover.aluno?.nome} desta turma?`}
        textoConfirmar="Remover"
        processando={removendo}
        onConfirmar={removerMatricula}
        onCancelar={() => setParaRemover(null)}
      />
    </>
  );
}
