import { Alert, Button } from 'react-bootstrap';

// Alerta de erro com botão opcional para tentar de novo
export default function MensagemErro({ mensagem, onTentarNovamente }) {
  return (
    <Alert variant="danger" className="d-flex align-items-center gap-2">
      <i className="bi bi-exclamation-octagon-fill" />
      <span className="flex-grow-1">{mensagem}</span>
      {onTentarNovamente && (
        <Button variant="outline-danger" size="sm" onClick={onTentarNovamente}>
          Tentar novamente
        </Button>
      )}
    </Alert>
  );
}
