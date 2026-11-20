import { useState } from 'react';
import { Button, Form, Modal, Spinner } from 'react-bootstrap';
import { validarProfessor } from '../utils/validacoes';

// Modal de criar/editar professor. "professor" vazio ({}) significa novo.
export default function FormularioProfessor({ professor, professores, cargaAtual, onSalvar, onFechar }) {
  const [form, setForm] = useState({
    nome: professor.nome ?? '',
    email: professor.email ?? '',
    cargaMaxima: professor.cargaMaxima ?? 12,
  });
  const [tocados, setTocados] = useState({});
  const [tentouSalvar, setTentouSalvar] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const erros = validarProfessor(form, professores, professor.id, cargaAtual);
  const erroVisivel = (campo) => (tentouSalvar || tocados[campo]) && erros[campo];

  function handleChange(evento) {
    setForm({ ...form, [evento.target.name]: evento.target.value });
  }

  function handleBlur(evento) {
    setTocados({ ...tocados, [evento.target.name]: true });
  }

  async function handleSubmit(evento) {
    evento.preventDefault();
    setTentouSalvar(true);
    if (Object.keys(erros).length > 0) return;

    setSalvando(true);
    const salvou = await onSalvar({
      ...professor,
      nome: form.nome.trim(),
      email: form.email.trim(),
      cargaMaxima: Number(form.cargaMaxima),
    });
    if (!salvou) setSalvando(false);
  }

  return (
    <Modal show onHide={onFechar} centered>
      <Form noValidate onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title as="h2" className="h5">
            {professor.id ? 'Editar professor' : 'Novo professor'}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Group className="mb-3" controlId="nome">
            <Form.Label>Nome</Form.Label>
            <Form.Control
              name="nome"
              value={form.nome}
              onChange={handleChange}
              onBlur={handleBlur}
              isInvalid={Boolean(erroVisivel('nome'))}
              autoFocus
            />
            <Form.Control.Feedback type="invalid">{erros.nome}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="email">
            <Form.Label>E-mail</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              isInvalid={Boolean(erroVisivel('email'))}
              placeholder="nome@universidade.edu.br"
            />
            <Form.Control.Feedback type="invalid">{erros.email}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group controlId="cargaMaxima">
            <Form.Label>Carga máxima (créditos por semestre)</Form.Label>
            <Form.Control
              type="number"
              name="cargaMaxima"
              min={2}
              max={40}
              value={form.cargaMaxima}
              onChange={handleChange}
              onBlur={handleBlur}
              isInvalid={Boolean(erroVisivel('cargaMaxima'))}
            />
            <Form.Control.Feedback type="invalid">{erros.cargaMaxima}</Form.Control.Feedback>
            {cargaAtual > 0 && (
              <Form.Text>Leciona atualmente {cargaAtual} créditos no semestre.</Form.Text>
            )}
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
