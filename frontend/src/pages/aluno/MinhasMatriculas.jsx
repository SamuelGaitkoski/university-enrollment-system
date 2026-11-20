import { useMemo, useState } from 'react';
import { Badge, Button, Card, ProgressBar, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Carregando from '../../components/Carregando';
import GradeSemanal from '../../components/GradeSemanal';
import MensagemErro from '../../components/MensagemErro';
import ModalConfirmacao from '../../components/ModalConfirmacao';
import { useAuth } from '../../context/AuthContext';
import { useNotificacao } from '../../context/NotificacaoContext';
import useDados from '../../hooks/useDados';
import { del } from '../../services/api';
import { horarioCurto } from '../../utils/horarios';
import { LIMITE_CREDITOS, SEMESTRE_ATUAL, corDaCarga, turmasDoAluno } from '../../utils/regras';

export default function MinhasMatriculas() {
  const { perfil } = useAuth();
  const { notificar } = useNotificacao();
  const { dados, carregando, erro, recarregar, tentarNovamente } = useDados({
    turmas: `/turmas?semestre=${SEMESTRE_ATUAL}`,
    disciplinas: '/disciplinas',
    professores: '/professores',
    matriculas: `/matriculas?alunoId=${perfil.aluno.id}`,
  });

  const [paraCancelar, setParaCancelar] = useState(null);
  const [cancelando, setCancelando] = useState(false);

  const minhas = useMemo(() => {
    if (!dados) return [];
    return turmasDoAluno(perfil.aluno.id, SEMESTRE_ATUAL, dados)
      .map((item) => ({ ...item, professor: dados.professores.find((p) => p.id === item.turma.professorId) }))
      .sort((a, b) => (a.disciplina?.codigo ?? '').localeCompare(b.disciplina?.codigo ?? ''));
  }, [dados, perfil.aluno.id]);

  // Mesma GradeSemanal da secretaria, só com as turmas do aluno
  const itensGrade = minhas.map(({ turma, disciplina, professor }) => ({
    id: turma.id,
    horarios: turma.horarios,
    titulo: `${disciplina?.codigo} ${disciplina?.nome}`,
    subtitulo: professor?.nome,
    cor: 'success',
  }));

  const creditos = minhas.reduce((total, { disciplina }) => total + (disciplina?.creditos ?? 0), 0);

  // UC4 pelo aluno: cancela a própria matrícula
  async function cancelar() {
    setCancelando(true);
    try {
      await del(`/matriculas/${paraCancelar.matricula.id}`);
      notificar(`Matrícula em ${paraCancelar.disciplina?.codigo} cancelada.`);
      recarregar();
    } catch (e) {
      notificar(e.message, 'danger');
    } finally {
      setCancelando(false);
      setParaCancelar(null);
    }
  }

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h1 className="h3 mb-0">Minhas matrículas</h1>
          <span className="text-secondary small">
            {perfil.aluno.nome} · {perfil.aluno.matricula} · semestre {SEMESTRE_ATUAL}
          </span>
        </div>
        <Button as={Link} to="/aluno/ofertas" variant="success">
          <i className="bi bi-plus-lg me-1" />
          Buscar ofertas
        </Button>
      </div>

      {carregando && <Carregando />}
      {erro && <MensagemErro mensagem={erro} onTentarNovamente={tentarNovamente} />}

      {dados && !erro && (
        <>
          <Card className="shadow-sm border-0 mb-3">
            <Card.Body>
              <div className="d-flex justify-content-between small mb-1">
                <span>Créditos no semestre</span>
                <strong>
                  {creditos} / {LIMITE_CREDITOS}
                </strong>
              </div>
              <ProgressBar
                variant={corDaCarga(creditos, LIMITE_CREDITOS)}
                now={(creditos / LIMITE_CREDITOS) * 100}
                aria-label="Créditos no semestre"
              />
            </Card.Body>
          </Card>

          <Card className="shadow-sm border-0">
            <Card.Body>
              {minhas.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-secondary">Você ainda não está matriculado em nenhuma turma.</p>
                  <Button as={Link} to="/aluno/ofertas" variant="outline-success">
                    Ver ofertas disponíveis
                  </Button>
                </div>
              ) : (
                <Table responsive hover className="align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Disciplina</th>
                      <th>Professor</th>
                      <th>Horários</th>
                      <th className="text-center">Créditos</th>
                      <th className="text-end">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {minhas.map(({ matricula, turma, disciplina, professor }) => (
                      <tr key={matricula.id}>
                        <td>
                          <span className="fw-semibold">{disciplina?.codigo}</span> {disciplina?.nome}
                        </td>
                        <td>{professor?.nome}</td>
                        <td>
                          {turma.horarios.map((h) => (
                            <Badge key={h} bg="light" text="dark" className="border me-1 fw-normal">
                              {horarioCurto(h)}
                            </Badge>
                          ))}
                        </td>
                        <td className="text-center">{disciplina?.creditos}</td>
                        <td className="text-end">
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => setParaCancelar({ matricula, disciplina })}
                          >
                            <i className="bi bi-x-circle me-1" />
                            Cancelar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>

          {minhas.length > 0 && (
            <Card className="shadow-sm border-0 mt-3">
              <Card.Body>
                <h2 className="h5 mb-3">Minha grade semanal</h2>
                <GradeSemanal itens={itensGrade} />
              </Card.Body>
            </Card>
          )}
        </>
      )}

      <ModalConfirmacao
        show={Boolean(paraCancelar)}
        titulo="Cancelar matrícula"
        mensagem={
          paraCancelar && `Deseja cancelar sua matrícula em ${paraCancelar.disciplina?.codigo} — ${paraCancelar.disciplina?.nome}?`
        }
        textoConfirmar="Cancelar matrícula"
        textoCancelar="Voltar"
        processando={cancelando}
        onConfirmar={cancelar}
        onCancelar={() => setParaCancelar(null)}
      />
    </>
  );
}
