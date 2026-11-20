import { Button, Container, Nav, Navbar } from 'react-bootstrap';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { rotaInicial, useAuth } from '../context/AuthContext';

const LINKS = {
  secretaria: [
    { para: '/secretaria', texto: 'Painel', icone: 'bi-speedometer2', exato: true },
    { para: '/secretaria/disciplinas', texto: 'Disciplinas', icone: 'bi-journal-bookmark' },
    { para: '/secretaria/professores', texto: 'Professores', icone: 'bi-person-badge' },
    { para: '/secretaria/alunos', texto: 'Alunos', icone: 'bi-people' },
    { para: '/secretaria/turmas', texto: 'Turmas', icone: 'bi-easel' },
    { para: '/secretaria/grade', texto: 'Grade', icone: 'bi-calendar-week' },
  ],
  aluno: [
    { para: '/aluno', texto: 'Minhas matrículas', icone: 'bi-card-checklist', exato: true },
    { para: '/aluno/ofertas', texto: 'Ofertas', icone: 'bi-search' },
  ],
};

export default function BarraNavegacao() {
  const { perfil, sair } = useAuth();
  const navigate = useNavigate();

  function handleSair() {
    sair();
    navigate('/');
  }

  // Os links mudam conforme o perfil logado (renderização condicional)
  const links = perfil ? LINKS[perfil.tipo] : [];
  const nomeUsuario = perfil?.tipo === 'aluno' ? perfil.aluno.nome : 'Secretaria acadêmica';

  return (
    <Navbar expand="lg" bg="primary" data-bs-theme="dark" className="shadow-sm">
      <Container>
        <Navbar.Brand as={Link} to={perfil ? rotaInicial(perfil) : '/'}>
          <i className="bi bi-mortarboard-fill me-2" />
          Matrículas
        </Navbar.Brand>

        {perfil && (
          <>
            <Navbar.Toggle aria-controls="menu-principal" />
            <Navbar.Collapse id="menu-principal">
              <Nav className="me-auto">
                {links.map((link) => (
                  <Nav.Link key={link.para} as={NavLink} to={link.para} end={link.exato}>
                    <i className={`bi ${link.icone} me-1`} />
                    {link.texto}
                  </Nav.Link>
                ))}
              </Nav>
              <div className="d-flex align-items-center gap-3">
                <span className="text-white small">
                  <i className="bi bi-person-circle me-1" />
                  {nomeUsuario}
                </span>
                <Button variant="outline-light" size="sm" onClick={handleSair}>
                  <i className="bi bi-box-arrow-right me-1" />
                  Sair
                </Button>
              </div>
            </Navbar.Collapse>
          </>
        )}
      </Container>
    </Navbar>
  );
}
