import { Button, Modal, Spinner } from 'react-bootstrap';

export default function ModalConfirmacao({
  show,
  titulo,
  mensagem,
  textoConfirmar = 'Confirmar',
  variante = 'danger',
  processando = false,
  onConfirmar,
  onCancelar,
}) {
  return (
    // Enquanto processa, não deixa fechar pelo fundo, pelo X ou pelo Esc
    <Modal show={show} onHide={() => !processando && onCancelar()} backdrop={processando ? 'static' : true} centered>
      <Modal.Header closeButton={!processando}>
        <Modal.Title as="h2" className="h5">{titulo}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{mensagem}</Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onCancelar} disabled={processando}>
          Cancelar
        </Button>
        <Button variant={variante} onClick={onConfirmar} disabled={processando}>
          {processando && <Spinner size="sm" className="me-2" />}
          {textoConfirmar}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
