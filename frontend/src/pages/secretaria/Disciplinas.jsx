import { useMemo, useState } from 'react';
import { Badge, Button, Card, Form, InputGroup, Table } from 'react-bootstrap';
import Carregando from '../../components/Carregando';
import FormularioDisciplina from '../../components/FormularioDisciplina';
import MensagemErro from '../../components/MensagemErro';
import ModalConfirmacao from '../../components/ModalConfirmacao';
import { useNotificacao } from '../../context/NotificacaoContext';
import useDados from '../../hooks/useDados';
import { del, post, put } from '../../services/api';

export default function Disciplinas() {
  const { dados, carregando, erro, recarregar, tentarNovamente } = useDados({ disciplinas: '/disciplinas' });
  const { notificar } = useNotificacao();

  const [busca, setBusca] = useState('');
  const [emEdicao, setEmEdicao] = useState(null); // null = modal fechado; {} = nova
  const [paraExcluir, setParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  const disciplinas = useMemo(() => dados?.disciplinas ?? [], [dados]);
  const porId = useMemo(() => Object.fromEntries(disciplinas.map((d) => [d.id, d])), [disciplinas]);

  // Busca por código ou nome, sem diferenciar maiúsculas
  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return disciplinas
      .filter((d) => `${d.codigo} ${d.nome}`.toLowerCase().includes(termo))
      .sort((a, b) => a.codigo.localeCompare(b.codigo));
  }, [disciplinas, busca]);

  async function salvar(disciplina) {
    try {
      if (disciplina.id) await put(`/disciplinas/${disciplina.id}`, disciplina);
      else await post('/disciplinas', disciplina);
      notificar(`Disciplina ${disciplina.codigo} salva.`);
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
      await del(`/disciplinas/${paraExcluir.id}`);
      notificar(`Disciplina ${paraExcluir.codigo} excluída.`);
      recarregar();
    } catch (e) {
      // Ex.: 409 do servidor quando a disciplina tem turmas ou é pré-requisito
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
          <h1 className="h3 mb-0">Disciplinas</h1>
          {dados && <span className="text-secondary small">{disciplinas.length} cadastradas</span>}
        </div>
        <Button onClick={() => setEmEdicao({})} disabled={!dados}>
          <i className="bi bi-plus-lg me-1" />
          Nova disciplina
        </Button>
      </div>

      {carregando && <Carregando />}
      {erro && <MensagemErro mensagem={erro} onTentarNovamente={tentarNovamente} />}

      {dados && !erro && (
        <Card className="shadow-sm border-0">
          <Card.Body>
            <InputGroup className="mb-3" style={{ maxWidth: 400 }}>
              <InputGroup.Text>
                <i className="bi bi-search" />
              </InputGroup.Text>
              <Form.Control
                placeholder="Buscar por código ou nome"
                aria-label="Buscar disciplina"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </InputGroup>

            {filtradas.length === 0 ? (
              <p className="text-secondary text-center py-4 mb-0">
                {disciplinas.length === 0
                  ? 'Nenhuma disciplina cadastrada. Clique em "Nova disciplina" para começar.'
                  : `Nenhuma disciplina encontrada para "${busca}".`}
              </p>
            ) : (
              <Table responsive hover className="align-middle mb-0">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nome</th>
                    <th className="text-center">Créditos</th>
                    <th>Pré-requisitos</th>
                    <th className="text-end">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((disciplina) => (
                    <tr key={disciplina.id}>
                      <td className="fw-semibold">{disciplina.codigo}</td>
                      <td>{disciplina.nome}</td>
                      <td className="text-center">{disciplina.creditos}</td>
                      <td>
                        {(disciplina.preRequisitos ?? []).length === 0 && <span className="text-secondary">—</span>}
                        {(disciplina.preRequisitos ?? []).map((id) => (
                          <Badge key={id} bg="light" text="dark" className="border me-1" title={porId[id]?.nome}>
                            {porId[id]?.codigo ?? '?'}
                          </Badge>
                        ))}
                      </td>
                      <td className="text-end text-nowrap">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          title="Editar"
                          aria-label={`Editar ${disciplina.codigo}`}
                          onClick={() => setEmEdicao(disciplina)}
                        >
                          <i className="bi bi-pencil" />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          title="Excluir"
                          aria-label={`Excluir ${disciplina.codigo}`}
                          onClick={() => setParaExcluir(disciplina)}
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

      {/* Monta o formulário só quando aberto, para começar sempre com os dados certos */}
      {emEdicao && (
        <FormularioDisciplina
          disciplina={emEdicao}
          disciplinas={disciplinas}
          onSalvar={salvar}
          onFechar={() => setEmEdicao(null)}
        />
      )}

      <ModalConfirmacao
        show={Boolean(paraExcluir)}
        titulo="Excluir disciplina"
        mensagem={paraExcluir && `Deseja excluir ${paraExcluir.codigo} — ${paraExcluir.nome}?`}
        textoConfirmar="Excluir"
        processando={excluindo}
        onConfirmar={excluir}
        onCancelar={() => setParaExcluir(null)}
      />
    </>
  );
}
