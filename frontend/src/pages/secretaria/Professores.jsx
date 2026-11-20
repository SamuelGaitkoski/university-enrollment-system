import { useMemo, useState } from 'react';
import { Button, Card, Form, InputGroup, ProgressBar, Table } from 'react-bootstrap';
import Carregando from '../../components/Carregando';
import FormularioProfessor from '../../components/FormularioProfessor';
import MensagemErro from '../../components/MensagemErro';
import ModalConfirmacao from '../../components/ModalConfirmacao';
import { useNotificacao } from '../../context/NotificacaoContext';
import useDados from '../../hooks/useDados';
import { del, post, put } from '../../services/api';
import { SEMESTRE_ATUAL, cargaProfessor, corDaCarga } from '../../utils/regras';

export default function Professores() {
  const { dados, carregando, erro, recarregar, tentarNovamente } = useDados({
    professores: '/professores',
    turmas: '/turmas',
    disciplinas: '/disciplinas',
  });
  const { notificar } = useNotificacao();

  const [busca, setBusca] = useState('');
  const [emEdicao, setEmEdicao] = useState(null);
  const [paraExcluir, setParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  const professores = useMemo(() => dados?.professores ?? [], [dados]);

  // Junta cada professor com a carga que ele tem no semestre atual
  const linhas = useMemo(() => {
    if (!dados) return [];
    const termo = busca.trim().toLowerCase();
    return professores
      .filter((p) => `${p.nome} ${p.email}`.toLowerCase().includes(termo))
      .sort((a, b) => a.nome.localeCompare(b.nome))
      .map((p) => ({ ...p, carga: cargaProfessor(p.id, SEMESTRE_ATUAL, dados.turmas, dados.disciplinas) }));
  }, [dados, professores, busca]);

  async function salvar(professor) {
    try {
      if (professor.id) await put(`/professores/${professor.id}`, professor);
      else await post('/professores', professor);
      notificar(`Professor ${professor.nome} salvo.`);
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
      await del(`/professores/${paraExcluir.id}`);
      notificar(`Professor ${paraExcluir.nome} excluído.`);
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
          <h1 className="h3 mb-0">Professores</h1>
          {dados && (
            <span className="text-secondary small">
              {professores.length} cadastrados · carga no semestre {SEMESTRE_ATUAL}
            </span>
          )}
        </div>
        <Button onClick={() => setEmEdicao({})} disabled={!dados}>
          <i className="bi bi-plus-lg me-1" />
          Novo professor
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
                placeholder="Buscar por nome ou e-mail"
                aria-label="Buscar professor"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </InputGroup>

            {linhas.length === 0 ? (
              <p className="text-secondary text-center py-4 mb-0">
                {professores.length === 0
                  ? 'Nenhum professor cadastrado. Clique em "Novo professor" para começar.'
                  : `Nenhum professor encontrado para "${busca}".`}
              </p>
            ) : (
              <Table responsive hover className="align-middle mb-0">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th style={{ minWidth: 180 }}>Carga (créditos)</th>
                    <th className="text-end">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((professor) => (
                    <tr key={professor.id}>
                      <td className="fw-semibold">{professor.nome}</td>
                      <td>{professor.email}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <ProgressBar
                            className="flex-grow-1"
                            style={{ height: 8 }}
                            variant={corDaCarga(professor.carga, professor.cargaMaxima)}
                            now={Math.min(100, (professor.carga / professor.cargaMaxima) * 100)}
                            aria-label={`Carga de ${professor.nome}`}
                          />
                          <span className="small text-nowrap">
                            {professor.carga} / {professor.cargaMaxima}
                          </span>
                        </div>
                      </td>
                      <td className="text-end text-nowrap">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          title="Editar"
                          aria-label={`Editar ${professor.nome}`}
                          onClick={() => setEmEdicao(professor)}
                        >
                          <i className="bi bi-pencil" />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          title="Excluir"
                          aria-label={`Excluir ${professor.nome}`}
                          onClick={() => setParaExcluir(professor)}
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

      {emEdicao && (
        <FormularioProfessor
          professor={emEdicao}
          professores={professores}
          cargaAtual={emEdicao.carga ?? 0}
          onSalvar={({ carga: _carga, ...professor }) => salvar(professor)}
          onFechar={() => setEmEdicao(null)}
        />
      )}

      <ModalConfirmacao
        show={Boolean(paraExcluir)}
        titulo="Excluir professor"
        mensagem={paraExcluir && `Deseja excluir ${paraExcluir.nome}?`}
        textoConfirmar="Excluir"
        processando={excluindo}
        onConfirmar={excluir}
        onCancelar={() => setParaExcluir(null)}
      />
    </>
  );
}
