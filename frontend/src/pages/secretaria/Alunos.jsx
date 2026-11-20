import { useMemo, useState } from 'react';
import { Badge, Button, Card, Form, InputGroup, Table } from 'react-bootstrap';
import Carregando from '../../components/Carregando';
import FormularioAluno from '../../components/FormularioAluno';
import MensagemErro from '../../components/MensagemErro';
import ModalConfirmacao from '../../components/ModalConfirmacao';
import { useNotificacao } from '../../context/NotificacaoContext';
import useDados from '../../hooks/useDados';
import { del, post, put } from '../../services/api';

export default function Alunos() {
  const { dados, carregando, erro, recarregar, tentarNovamente } = useDados({
    alunos: '/alunos',
    disciplinas: '/disciplinas',
  });
  const { notificar } = useNotificacao();

  const [busca, setBusca] = useState('');
  const [emEdicao, setEmEdicao] = useState(null);
  const [paraExcluir, setParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  const alunos = useMemo(() => dados?.alunos ?? [], [dados]);
  const disciplinas = useMemo(() => dados?.disciplinas ?? [], [dados]);
  const porId = useMemo(() => Object.fromEntries(disciplinas.map((d) => [d.id, d])), [disciplinas]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return alunos
      .filter((a) => `${a.matricula} ${a.nome} ${a.email} ${a.curso}`.toLowerCase().includes(termo))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [alunos, busca]);

  async function salvar(aluno) {
    try {
      if (aluno.id) await put(`/alunos/${aluno.id}`, aluno);
      else await post('/alunos', aluno);
      notificar(`Aluno ${aluno.nome} salvo.`);
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
      await del(`/alunos/${paraExcluir.id}`);
      notificar(`Aluno ${paraExcluir.nome} excluído.`);
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
          <h1 className="h3 mb-0">Alunos</h1>
          {dados && <span className="text-secondary small">{alunos.length} cadastrados</span>}
        </div>
        <Button onClick={() => setEmEdicao({})} disabled={!dados}>
          <i className="bi bi-plus-lg me-1" />
          Novo aluno
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
                placeholder="Buscar por matrícula, nome, e-mail ou curso"
                aria-label="Buscar aluno"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </InputGroup>

            {filtrados.length === 0 ? (
              <p className="text-secondary text-center py-4 mb-0">
                {alunos.length === 0
                  ? 'Nenhum aluno cadastrado. Clique em "Novo aluno" para começar.'
                  : `Nenhum aluno encontrado para "${busca}".`}
              </p>
            ) : (
              <Table responsive hover className="align-middle mb-0">
                <thead>
                  <tr>
                    <th>Matrícula</th>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Curso</th>
                    <th>Aprovadas</th>
                    <th className="text-end">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((aluno) => {
                    // Ignora ids de disciplinas que já foram excluídas
                    const aprovadas = (aluno.disciplinasAprovadas ?? []).filter((id) => porId[id]);
                    return (
                      <tr key={aluno.id}>
                        <td className="font-monospace">{aluno.matricula}</td>
                        <td className="fw-semibold">{aluno.nome}</td>
                        <td>{aluno.email}</td>
                        <td>{aluno.curso}</td>
                        <td>
                          {aprovadas.length === 0 && <span className="text-secondary">Calouro</span>}
                          {aprovadas.map((id) => (
                            <Badge key={id} bg="light" text="dark" className="border me-1" title={porId[id].nome}>
                              {porId[id].codigo}
                            </Badge>
                          ))}
                        </td>
                        <td className="text-end text-nowrap">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            title="Editar"
                            aria-label={`Editar ${aluno.nome}`}
                            onClick={() => setEmEdicao(aluno)}
                          >
                            <i className="bi bi-pencil" />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            title="Excluir"
                            aria-label={`Excluir ${aluno.nome}`}
                            onClick={() => setParaExcluir(aluno)}
                          >
                            <i className="bi bi-trash" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      )}

      {emEdicao && (
        <FormularioAluno
          aluno={emEdicao}
          alunos={alunos}
          disciplinas={disciplinas}
          onSalvar={salvar}
          onFechar={() => setEmEdicao(null)}
        />
      )}

      <ModalConfirmacao
        show={Boolean(paraExcluir)}
        titulo="Excluir aluno"
        mensagem={paraExcluir && `Deseja excluir ${paraExcluir.nome} (${paraExcluir.matricula})?`}
        textoConfirmar="Excluir"
        processando={excluindo}
        onConfirmar={excluir}
        onCancelar={() => setParaExcluir(null)}
      />
    </>
  );
}
