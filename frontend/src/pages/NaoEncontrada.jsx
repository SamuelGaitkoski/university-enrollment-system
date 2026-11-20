import { Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default function NaoEncontrada() {
  return (
    <div className="text-center py-5">
      <p className="display-1 fw-bold text-primary mb-0">404</p>
      <h1 className="h3">Página não encontrada</h1>
      <p className="text-secondary">O endereço acessado não existe.</p>
      <Button as={Link} to="/">
        Voltar ao início
      </Button>
    </div>
  );
}
