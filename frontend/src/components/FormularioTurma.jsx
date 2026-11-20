import { useMemo, useState } from 'react';
import { Badge, Button, Col, Form, Modal, Row, Spinner } from 'react-bootstrap';
import { horarioCurto, ordenarHorarios } from '../utils/horarios';
import { SEMESTRE_ATUAL, cargaProfessor, ocupacao, verificarOferta } from '../utils/regras';
import { validarTurma } from '../utils/validacoes';
import SeletorHorarios from './SeletorHorarios';
import Seletor from './Seletor';

// Modal de criar/editar turma (UC2 — ofertar turma)
export default function FormularioTurma({ turma, dados, onSalvar, onFechar }) {
  const { turmas, disciplinas, professores, matriculas } = dados;

  const [form, setForm] = useState({
    disciplinaId: turma.disciplinaId ?? '',
    professorId: turma.professorId ?? '',
    semestre: turma.semestre ?? SEMESTRE_ATUAL,
    horarios: turma.horarios ?? [],
    vagas: turma.vagas ?? 40,
  });
  const [tocados, setTocados] = useState({});
  const [tentouSalvar, setTentouSalvar] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const matriculados = turma.id ? ocupacao(turma.id, matriculas) : 0;
  const turmaAtual = { ...form, id: turma.id };

  // Formato primeiro; as regras de negócio (conflito e carga) só depois do formato estar ok
  const errosFormato = validarTurma(form, matriculados);
  const erros = { ...verificarOferta(turmaAtual, { turmas, disciplinas, professores }), ...errosFormato };
  const erroVisivel = (campo) => (tentouSalvar || tocados[campo]) && erros[campo];

  // Horários em que o professor escolhido já dá aula neste semestre: { '21': 'INF101' }
  const ocupados = useMemo(() => {
    const mapa = {};
    turmas
      .filter((t) => t.professorId === form.professorId && t.semestre === form.semestre && t.id !== turma.id)
      .forEach((t) => {
        const codigo = disciplinas.find((d) => d.id === t.disciplinaId)?.codigo;
        t.horarios.forEach((h) => (mapa[h] = codigo));
      });
    return mapa;
  }, [turmas, disciplinas, form.professorId, form.semestre, turma.id]);

  const disciplinasOrdenadas = [...disciplinas].sort((a, b) => a.codigo.localeCompare(b.codigo));
  const professoresOrdenados = [...professores].sort((a, b) => a.nome.localeCompare(b.nome));

  function alterarCampo(campo, valor) {
    setForm({ ...form, [campo]: valor });
    setTocados({ ...tocados, [campo]: true });
  }

  function handleChange(evento) {
    alterarCampo(evento.target.name, evento.target.value);
  }

  async function handleSubmit(evento) {
    evento.preventDefault();
    setTentouSalvar(true);
    if (Object.keys(erros).length > 0) return;

    setSalvando(true);
    const salvou = await onSalvar({
      ...turma,
      ...form,
      horarios: ordenarHorarios(form.horarios),
      vagas: Number(form.vagas),
    });
    if (!salvou) setSalvando(false);
  }

  return (
    <Modal show onHide={onFechar} centered size="lg">
      <Form noValidate onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title as="h2" className="h5">
            {turma.id ? 'Editar turma' : 'Nova turma'}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group controlId="disciplinaId">
                <Form.Label>Disciplina</Form.Label>
                <Seletor
                  id="disciplinaId"
                  value={form.disciplinaId}
                  onChange={(valor) => alterarCampo('disciplinaId', valor)}
                  opcoes={disciplinasOrdenadas.map((d) => ({
                    valor: d.id,
                    rotulo: `${d.codigo} — ${d.nome} (${d.creditos} cr.)`,
                  }))}
                  erro={erros.disciplinaId}
                  mostrarErro={Boolean(erroVisivel('disciplinaId'))}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId="professorId">
                <Form.Label>Professor</Form.Label>
                {/* Mostra a carga de cada professor para apoiar a distribuição equilibrada */}
                <Seletor
                  id="professorId"
                  value={form.professorId}
                  onChange={(valor) => alterarCampo('professorId', valor)}
                  opcoes={professoresOrdenados.map((p) => ({
                    valor: p.id,
                    rotulo: `${p.nome} — ${cargaProfessor(p.id, form.semestre, turmas, disciplinas, turma.id)}/${p.cargaMaxima} cr.`,
                  }))}
                  erro={erros.professorId}
                  mostrarErro={Boolean(erroVisivel('professorId'))}
                />
              </Form.Group>
            </Col>

            <Col sm={6}>
              <Form.Group controlId="semestre">
                <Form.Label>Semestre</Form.Label>
                <Form.Control
                  name="semestre"
                  value={form.semestre}
                  onChange={handleChange}
                  isInvalid={Boolean(erroVisivel('semestre'))}
                  placeholder="2026/2"
                  maxLength={6}
                />
                <Form.Control.Feedback type="invalid">{erros.semestre}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col sm={6}>
              <Form.Group controlId="vagas">
                <Form.Label>Vagas</Form.Label>
                <Form.Control
                  type="number"
                  name="vagas"
                  min={1}
                  max={80}
                  value={form.vagas}
                  onChange={handleChange}
                  isInvalid={Boolean(erroVisivel('vagas'))}
                />
                <Form.Control.Feedback type="invalid">{erros.vagas}</Form.Control.Feedback>
                {matriculados > 0 && <Form.Text>{matriculados} alunos já matriculados.</Form.Text>}
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mt-3">
            <Form.Label className="d-flex flex-wrap align-items-center gap-1">
              Horários
              {ordenarHorarios(form.horarios).map((h) => (
                <Badge key={h} bg="primary" className="fw-normal">
                  {horarioCurto(h)}
                </Badge>
              ))}
            </Form.Label>
            <SeletorHorarios
              selecionados={form.horarios}
              onChange={(horarios) => {
                setForm({ ...form, horarios });
                setTocados({ ...tocados, horarios: true });
              }}
              ocupados={ocupados}
              invalido={Boolean(erroVisivel('horarios'))}
            />
            <Form.Text>
              Clique para marcar. Em cinza, os horários em que o professor já leciona.
            </Form.Text>
            {erroVisivel('horarios') && <div className="text-danger small mt-1">{erros.horarios}</div>}
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onFechar} disabled={salvando}>
            Cancelar
          </Button>
          <Button type="submit" disabled={salvando}>
            {salvando && <Spinner size="sm" className="me-2" />}
            Salvar
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
