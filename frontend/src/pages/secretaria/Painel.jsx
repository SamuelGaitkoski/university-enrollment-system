import { useMemo } from 'react';
import { Badge, Card, Col, ListGroup, ProgressBar, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Carregando from '../../components/Carregando';
import MensagemErro from '../../components/MensagemErro';
import useDados from '../../hooks/useDados';
import { horarioCurto } from '../../utils/horarios';
import { SEMESTRE_ATUAL, cargaProfessor, corDaCarga, ocupacao } from '../../utils/regras';

export default function Painel() {
  const { dados, carregando, erro, tentarNovamente } = useDados({
    disciplinas: '/disciplinas',
    professores: '/professores',
    alunos: '/alunos',
    turmas: `/turmas?semestre=${SEMESTRE_ATUAL}`,
    matriculas: '/matriculas',
  });

  const indicadores = useMemo(() => {
    if (!dados) return null;
    const idsTurmas = new Set(dados.turmas.map((t) => t.id));

    // Carga de cada professor, da mais alta para a mais baixa (apoio à carga balanceada)
    const cargas = dados.professores
      .map((p) => {
        const carga = cargaProfessor(p.id, SEMESTRE_ATUAL, dados.turmas, dados.disciplinas);
        return { ...p, carga, percentual: (carga / p.cargaMaxima) * 100 };
      })
      .sort((a, b) => b.percentual - a.percentual);

    // Lotadas ou quase lotadas: 75% ou mais ocupado, ou no máximo 1 vaga livre
    const turmasCheias = dados.turmas
      .map((t) => ({
        ...t,
        disciplina: dados.disciplinas.find((d) => d.id === t.disciplinaId),
        matriculados: ocupacao(t.id, dados.matriculas),
      }))
      .filter((t) => t.matriculados / t.vagas >= 0.75 || t.vagas - t.matriculados <= 1)
      .sort((a, b) => b.matriculados / b.vagas - a.matriculados / a.vagas);

    const mediaCarga = cargas.length ? cargas.reduce((s, p) => s + p.percentual, 0) / cargas.length : 0;

    return {
      totais: [
        { rotulo: 'Disciplinas', valor: dados.disciplinas.length, icone: 'bi-journal-bookmark', para: '/secretaria/disciplinas' },
        { rotulo: 'Professores', valor: dados.professores.length, icone: 'bi-person-badge', para: '/secretaria/professores' },
        { rotulo: 'Alunos', valor: dados.alunos.length, icone: 'bi-people', para: '/secretaria/alunos' },
        { rotulo: 'Turmas', valor: dados.turmas.length, icone: 'bi-easel', para: '/secretaria/turmas' },
        {
          rotulo: 'Matrículas',
          valor: dados.matriculas.filter((m) => idsTurmas.has(m.turmaId)).length,
          icone: 'bi-card-checklist',
          para: '/secretaria/grade',
        },
      ],
      cargas,
      turmasCheias,
      mediaCarga,
      maisLivre: [...cargas].sort((a, b) => a.percentual - b.percentual)[0],
    };
  }, [dados]);

  return (
    <>
      <div className="mb-3">
        <h1 className="h3 mb-0">Painel</h1>
        <span className="text-secondary small">Semestre {SEMESTRE_ATUAL}</span>
      </div>

      {carregando && <Carregando />}
      {erro && <MensagemErro mensagem={erro} onTentarNovamente={tentarNovamente} />}

      {indicadores && !erro && (
        <>
          <Row xs={2} md={3} lg={5} className="g-3 mb-4">
            {indicadores.totais.map((total) => (
              <Col key={total.rotulo}>
                <Card as={Link} to={total.para} className="card-perfil h-100 shadow-sm border-0 text-decoration-none">
                  <Card.Body>
                    <div className="d-flex justify-content-between text-secondary small">
                      {total.rotulo}
                      <i className={`bi ${total.icone}`} />
                    </div>
                    <div className="fs-2 fw-bold">{total.valor}</div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          <Row className="g-3">
            <Col lg={7}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Body>
                  <h2 className="h5">Carga dos professores</h2>
                  <p className="small text-secondary">
                    Média de ocupação: {Math.round(indicadores.mediaCarga)}%.
                    {indicadores.maisLivre && (
                      <>
                        {' '}
                        Mais disponível: <strong>{indicadores.maisLivre.nome}</strong> (
                        {indicadores.maisLivre.carga} de {indicadores.maisLivre.cargaMaxima} créditos).
                      </>
                    )}
                  </p>
                  {indicadores.cargas.length === 0 && <p className="text-secondary mb-0">Nenhum professor cadastrado.</p>}
                  {indicadores.cargas.map((p) => (
                    <div key={p.id} className="mb-3">
                      <div className="d-flex justify-content-between small mb-1">
                        <span className="fw-semibold">{p.nome}</span>
                        <span>
                          {p.carga} / {p.cargaMaxima} créditos
                          {p.carga >= p.cargaMaxima && (
                            <Badge bg="danger" className="ms-2">
                              No limite
                            </Badge>
                          )}
                        </span>
                      </div>
                      <ProgressBar
                        variant={corDaCarga(p.carga, p.cargaMaxima)}
                        now={Math.min(100, p.percentual)}
                        aria-label={`Carga de ${p.nome}`}
                      />
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>

            <Col lg={5}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Body>
                  <h2 className="h5">Turmas lotadas ou quase lotadas</h2>
                  {indicadores.turmasCheias.length === 0 ? (
                    <p className="text-secondary mb-0">Nenhuma turma perto de lotar.</p>
                  ) : (
                    <ListGroup variant="flush">
                      {indicadores.turmasCheias.map((t) => (
                        <ListGroup.Item
                          key={t.id}
                          action
                          as={Link}
                          to={`/secretaria/turmas/${t.id}`}
                          className="d-flex justify-content-between align-items-center px-0"
                        >
                          <span>
                            <span className="fw-semibold">{t.disciplina?.codigo}</span>{' '}
                            <span className="small text-secondary">{t.horarios.map(horarioCurto).join(', ')}</span>
                          </span>
                          {t.matriculados >= t.vagas ? (
                            <Badge bg="danger">{t.matriculados}/{t.vagas} lotada</Badge>
                          ) : (
                            <Badge bg="warning" text="dark">
                              {t.matriculados}/{t.vagas} · resta{t.vagas - t.matriculados > 1 ? 'm' : ''}{' '}
                              {t.vagas - t.matriculados}
                            </Badge>
                          )}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </>
  );
}
