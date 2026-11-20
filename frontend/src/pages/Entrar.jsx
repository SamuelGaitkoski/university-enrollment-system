import { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Row } from 'react-bootstrap';
import { Navigate, useNavigate } from 'react-router-dom';
import Carregando from '../components/Carregando';
import MensagemErro from '../components/MensagemErro';
import { rotaInicial, useAuth } from '../context/AuthContext';
import { get } from '../services/api';

export default function Entrar() {
  const { perfil, entrar } = useAuth();
  const navigate = useNavigate();

  const [alunos, setAlunos] = useState([]);
  const [alunoId, setAlunoId] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  async function buscarAlunos() {
    try {
      const lista = await get('/alunos');
      setAlunos(lista.sort((a, b) => a.nome.localeCompare(b.nome)));
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  function tentarNovamente() {
    setCarregando(true);
    setErro('');
    buscarAlunos();
  }

  // Equivale ao componentDidMount: busca os alunos uma vez ao abrir a tela
  useEffect(() => {
    buscarAlunos();
  }, []);

  // Quem já está logado vai direto para sua página inicial
  if (perfil) return <Navigate to={rotaInicial(perfil)} replace />;

  function entrarComoSecretaria() {
    entrar({ tipo: 'secretaria' });
    navigate('/secretaria');
  }

  function entrarComoAluno(evento) {
    evento.preventDefault();
    const aluno = alunos.find((a) => a.id === alunoId);
    entrar({ tipo: 'aluno', aluno: { id: aluno.id, nome: aluno.nome, matricula: aluno.matricula } });
    navigate('/aluno');
  }

  return (
    <div className="mx-auto py-md-4" style={{ maxWidth: 760 }}>
      <div className="text-center mb-4">
        <h1 className="h2 fw-bold">Sistema de Matrículas</h1>
        <p className="text-secondary">Escolha como deseja entrar.</p>
      </div>

      <Row className="g-4">
        <Col md={6}>
          <Card className="card-perfil h-100 shadow-sm border-0">
            <Card.Body className="d-flex flex-column text-center p-4">
              <i className="bi bi-building fs-1 text-primary" />
              <Card.Title className="mt-2">Secretaria acadêmica</Card.Title>
              <Card.Text className="text-secondary">
                Cadastros, oferta de turmas e grade do semestre.
              </Card.Text>
              <Button className="mt-auto" onClick={entrarComoSecretaria}>
                Entrar como secretaria
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="card-perfil h-100 shadow-sm border-0">
            <Card.Body className="d-flex flex-column text-center p-4">
              <i className="bi bi-mortarboard fs-1 text-success" />
              <Card.Title className="mt-2">Aluno</Card.Title>
              <Card.Text className="text-secondary">
                Consulte as ofertas e faça sua matrícula.
              </Card.Text>

              {carregando && <Carregando texto="Carregando alunos..." />}
              {erro && <MensagemErro mensagem={erro} onTentarNovamente={tentarNovamente} />}
              {!carregando && !erro && alunos.length === 0 && (
                <p className="text-secondary small">Nenhum aluno cadastrado.</p>
              )}

              {!carregando && !erro && alunos.length > 0 && (
                <Form onSubmit={entrarComoAluno} className="mt-auto">
                  <Form.Select
                    aria-label="Selecione o aluno"
                    value={alunoId}
                    onChange={(e) => setAlunoId(e.target.value)}
                    className="mb-3"
                  >
                    <option value="">Selecione o aluno...</option>
                    {alunos.map((aluno) => (
                      <option key={aluno.id} value={aluno.id}>
                        {aluno.nome} — {aluno.matricula}
                      </option>
                    ))}
                  </Form.Select>
                  <Button type="submit" variant="success" className="w-100" disabled={!alunoId}>
                    Entrar como aluno
                  </Button>
                </Form>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
