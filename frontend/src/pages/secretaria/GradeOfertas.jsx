import { useMemo, useState } from 'react';
import { Card, Col, Form, Row } from 'react-bootstrap';
import Carregando from '../../components/Carregando';
import GradeSemanal from '../../components/GradeSemanal';
import MensagemErro from '../../components/MensagemErro';
import useDados from '../../hooks/useDados';
import { SEMESTRE_ATUAL, corDaCarga, ocupacao } from '../../utils/regras';

// UC5 — grade de ofertas do semestre (visão da secretaria)
export default function GradeOfertas() {
  const { dados, carregando, erro, tentarNovamente } = useDados({
    turmas: '/turmas',
    disciplinas: '/disciplinas',
    professores: '/professores',
    matriculas: '/matriculas',
  });

  const [semestre, setSemestre] = useState(SEMESTRE_ATUAL);
  const [professorId, setProfessorId] = useState('');

  const semestres = useMemo(() => {
    const lista = new Set([SEMESTRE_ATUAL, ...(dados?.turmas ?? []).map((t) => t.semestre)]);
    return [...lista].sort().reverse();
  }, [dados]);

  // Converte as turmas no formato que a GradeSemanal espera
  const itens = useMemo(() => {
    if (!dados) return [];
    return dados.turmas
      .filter((t) => t.semestre === semestre && (!professorId || t.professorId === professorId))
      .map((t) => {
        const disciplina = dados.disciplinas.find((d) => d.id === t.disciplinaId);
        const professor = dados.professores.find((p) => p.id === t.professorId);
        const matriculados = ocupacao(t.id, dados.matriculas);
        return {
          id: t.id,
          horarios: t.horarios,
          titulo: `${disciplina?.codigo} ${disciplina?.nome}`,
          subtitulo: professor?.nome,
          detalhe: `${matriculados}/${t.vagas} vagas`,
          cor: corDaCarga(matriculados, t.vagas),
          para: `/secretaria/turmas/${t.id}`,
        };
      })
      .sort((a, b) => a.titulo.localeCompare(b.titulo));
  }, [dados, semestre, professorId]);

  return (
    <>
      <div className="mb-3">
        <h1 className="h3 mb-0">Grade de ofertas</h1>
        <span className="text-secondary small">Clique numa turma para ver os alunos matriculados.</span>
      </div>

      {carregando && <Carregando />}
      {erro && <MensagemErro mensagem={erro} onTentarNovamente={tentarNovamente} />}

      {dados && !erro && (
        <Card className="shadow-sm border-0">
          <Card.Body>
            <Row className="g-2 mb-3 align-items-center">
              <Col sm={4} lg={3}>
                <Form.Select value={semestre} onChange={(e) => setSemestre(e.target.value)} aria-label="Semestre">
                  {semestres.map((s) => (
                    <option key={s} value={s}>
                      Semestre {s}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col sm={4} lg={3}>
                <Form.Select value={professorId} onChange={(e) => setProfessorId(e.target.value)} aria-label="Professor">
                  <option value="">Todos os professores</option>
                  {[...dados.professores]
                    .sort((a, b) => a.nome.localeCompare(b.nome))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                </Form.Select>
              </Col>
              <Col className="small text-secondary">
                {itens.length} turmas · borda{' '}
                <span className="text-success fw-semibold">verde</span>,{' '}
                <span className="text-warning-emphasis fw-semibold">amarela</span> ou{' '}
                <span className="text-danger fw-semibold">vermelha</span> conforme a ocupação
              </Col>
            </Row>

            <GradeSemanal itens={itens} mensagemVazia="Nenhuma turma ofertada com estes filtros." />
          </Card.Body>
        </Card>
      )}
    </>
  );
}
