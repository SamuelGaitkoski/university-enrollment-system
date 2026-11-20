import { useState } from 'react';
import { Button, Form, Modal, Spinner } from 'react-bootstrap';
import { dependeDe } from '../utils/regras';
import { validarDisciplina } from '../utils/validacoes';

// Modal de criar/editar disciplina. "disciplina" vazia ({}) significa nova.
export default function FormularioDisciplina({ disciplina, disciplinas, onSalvar, onFechar }) {
  const editando = Boolean(disciplina.id);

  // Formulário controlado: cada campo lê e escreve neste estado
  const [form, setForm] = useState({
    codigo: disciplina.codigo ?? '',
    nome: disciplina.nome ?? '',
    creditos: disciplina.creditos ?? 4,
    preRequisitos: disciplina.preRequisitos ?? [],
  });
  const [tocados, setTocados] = useState({});
  const [tentouSalvar, setTentouSalvar] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const erros = validarDisciplina(form, disciplinas, disciplina.id);
  // Só mostra o erro depois que o usuário saiu do campo ou tentou salvar
  const erroVisivel = (campo) => (tentouSalvar || tocados[campo]) && erros[campo];

  const opcoesPreRequisito = disciplinas
    .filter((d) => d.id !== disciplina.id)
    .sort((a, b) => a.codigo.localeCompare(b.codigo));

  function handleChange(evento) {
    const { name, value } = evento.target;
    setForm({ ...form, [name]: name === 'codigo' ? value.toUpperCase() : value });
  }

  function handleBlur(evento) {
    setTocados({ ...tocados, [evento.target.name]: true });
  }

  function alternarPreRequisito(id) {
    const lista = form.preRequisitos.includes(id)
      ? form.preRequisitos.filter((p) => p !== id)
      : [...form.preRequisitos, id];
    setForm({ ...form, preRequisitos: lista });
  }

  async function handleSubmit(evento) {
    evento.preventDefault();
    setTentouSalvar(true);
    if (Object.keys(erros).length > 0) return;

    setSalvando(true);
    const salvou = await onSalvar({ ...disciplina, ...form, nome: form.nome.trim() });
    if (!salvou) setSalvando(false);
  }

  return (
    <Modal show onHide={onFechar} centered>
      <Form noValidate onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title as="h2" className="h5">
            {editando ? 'Editar disciplina' : 'Nova disciplina'}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Group className="mb-3" controlId="codigo">
            <Form.Label>Código</Form.Label>
            <Form.Control
              name="codigo"
              value={form.codigo}
              onChange={handleChange}
              onBlur={handleBlur}
              isInvalid={Boolean(erroVisivel('codigo'))}
              placeholder="INF101"
              maxLength={6}
              autoFocus
            />
            <Form.Control.Feedback type="invalid">{erros.codigo}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="nome">
            <Form.Label>Nome</Form.Label>
            <Form.Control
              name="nome"
              value={form.nome}
              onChange={handleChange}
              onBlur={handleBlur}
              isInvalid={Boolean(erroVisivel('nome'))}
              placeholder="Algoritmos I"
            />
            <Form.Control.Feedback type="invalid">{erros.nome}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="d-block">Créditos</Form.Label>
            {[2, 4].map((valor) => (
              <Form.Check
                key={valor}
                inline
                type="radio"
                id={`creditos-${valor}`}
                name="creditos"
                label={`${valor} créditos`}
                checked={form.creditos === valor}
                onChange={() => setForm({ ...form, creditos: valor })}
              />
            ))}
          </Form.Group>

          <Form.Group>
            <Form.Label>
              Pré-requisitos{' '}
              <span className="text-secondary small">({form.preRequisitos.length} selecionados)</span>
            </Form.Label>
            <div className="border rounded p-2 overflow-auto" style={{ maxHeight: 200 }}>
              {opcoesPreRequisito.length === 0 && (
                <p className="text-secondary small mb-0">Nenhuma outra disciplina cadastrada.</p>
              )}
              {opcoesPreRequisito.map((opcao) => {
                // Bloqueia quem já depende desta disciplina, para não criar ciclo
                const geraCiclo = editando && dependeDe(opcao.id, disciplina.id, disciplinas);
                return (
                  <Form.Check
                    key={opcao.id}
                    id={`pre-${opcao.id}`}
                    disabled={geraCiclo}
                    checked={form.preRequisitos.includes(opcao.id)}
                    onChange={() => alternarPreRequisito(opcao.id)}
                    label={
                      <>
                        <strong>{opcao.codigo}</strong> {opcao.nome}
                        {geraCiclo && <span className="text-secondary small"> — depende desta</span>}
                      </>
                    }
                  />
                );
              })}
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
