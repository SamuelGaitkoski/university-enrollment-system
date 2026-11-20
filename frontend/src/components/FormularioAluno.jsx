import { useState } from 'react';
import { Button, Col, Form, Modal, Row, Spinner } from 'react-bootstrap';
import { validarAluno } from '../utils/validacoes';

const CURSOS = [
  'Ciência da Computação',
  'Sistemas de Informação',
  'Engenharia de Software',
  'Análise e Desenvolvimento de Sistemas',
];

// Modal de criar/editar aluno, incluindo o histórico (disciplinas aprovadas)
export default function FormularioAluno({ aluno, alunos, disciplinas, onSalvar, onFechar }) {
  const [form, setForm] = useState({
    matricula: aluno.matricula ?? '',
    nome: aluno.nome ?? '',
    email: aluno.email ?? '',
    curso: aluno.curso ?? '',
    disciplinasAprovadas: aluno.disciplinasAprovadas ?? [],
  });
  const [tocados, setTocados] = useState({});
  const [tentouSalvar, setTentouSalvar] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const erros = validarAluno(form, alunos, aluno.id);
  const erroVisivel = (campo) => (tentouSalvar || tocados[campo]) && erros[campo];

  const ordenadas = [...disciplinas].sort((a, b) => a.codigo.localeCompare(b.codigo));
  const codigoDe = (id) => disciplinas.find((d) => d.id === id)?.codigo;

  function handleChange(evento) {
    const { name, value } = evento.target;
    // Matrícula aceita só dígitos
    setForm({ ...form, [name]: name === 'matricula' ? value.replace(/\D/g, '') : value });
  }

  function handleBlur(evento) {
    setTocados({ ...tocados, [evento.target.name]: true });
  }

  function alternarAprovada(id) {
    const lista = form.disciplinasAprovadas.includes(id)
      ? form.disciplinasAprovadas.filter((d) => d !== id)
      : [...form.disciplinasAprovadas, id];
    setForm({ ...form, disciplinasAprovadas: lista });
  }

  async function handleSubmit(evento) {
    evento.preventDefault();
    setTentouSalvar(true);
    if (Object.keys(erros).length > 0) return;

    setSalvando(true);
    const salvou = await onSalvar({
      ...aluno,
      ...form,
      nome: form.nome.trim(),
      email: form.email.trim(),
    });
    if (!salvou) setSalvando(false);
  }

  return (
    <Modal show onHide={onFechar} centered size="lg">
      <Form noValidate onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title as="h2" className="h5">
            {aluno.id ? 'Editar aluno' : 'Novo aluno'}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Row className="g-3">
            <Col md={4}>
              <Form.Group controlId="matricula">
                <Form.Label>Matrícula</Form.Label>
                <Form.Control
                  name="matricula"
                  inputMode="numeric"
                  maxLength={9}
                  value={form.matricula}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  isInvalid={Boolean(erroVisivel('matricula'))}
                  placeholder="202610001"
                  autoFocus
                />
                <Form.Control.Feedback type="invalid">{erros.matricula}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={8}>
              <Form.Group controlId="nome">
                <Form.Label>Nome</Form.Label>
                <Form.Control
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  isInvalid={Boolean(erroVisivel('nome'))}
                />
                <Form.Control.Feedback type="invalid">{erros.nome}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="email">
                <Form.Label>E-mail</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  isInvalid={Boolean(erroVisivel('email'))}
                  placeholder="nome@aluno.edu.br"
                />
                <Form.Control.Feedback type="invalid">{erros.email}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="curso">
                <Form.Label>Curso</Form.Label>
                <Form.Select
                  name="curso"
                  value={form.curso}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  isInvalid={Boolean(erroVisivel('curso'))}
                >
                  <option value="">Selecione...</option>
                  {CURSOS.map((curso) => (
                    <option key={curso} value={curso}>
                      {curso}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{erros.curso}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mt-3">
            <Form.Label>
              Histórico — disciplinas aprovadas{' '}
              <span className="text-secondary small">({form.disciplinasAprovadas.length} marcadas)</span>
            </Form.Label>
            <div className="border rounded p-2 overflow-auto" style={{ maxHeight: 240 }}>
              {ordenadas.length === 0 && (
                <p className="text-secondary small mb-0">Nenhuma disciplina cadastrada.</p>
              )}
              <Row xs={1} md={2} className="g-0">
                {ordenadas.map((disciplina) => {
                  const marcada = form.disciplinasAprovadas.includes(disciplina.id);
                  // Aviso (não bloqueia): aprovada sem ter os pré-requisitos no histórico
                  const faltando = (disciplina.preRequisitos ?? []).filter(
                    (id) => !form.disciplinasAprovadas.includes(id)
                  );
                  return (
                    <Col key={disciplina.id}>
                      <Form.Check
                        id={`aprovada-${disciplina.id}`}
                        checked={marcada}
                        onChange={() => alternarAprovada(disciplina.id)}
                        label={
                          <>
                            <strong>{disciplina.codigo}</strong> {disciplina.nome}
                            {marcada && faltando.length > 0 && (
                              <span className="d-block small text-warning-emphasis">
                                <i className="bi bi-exclamation-triangle me-1" />
                                Sem pré-requisito: {faltando.map(codigoDe).join(', ')}
                              </span>
                            )}
                          </>
                        }
                      />
                    </Col>
                  );
                })}
              </Row>
            </div>
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
