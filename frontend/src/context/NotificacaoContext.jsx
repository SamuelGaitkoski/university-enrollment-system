import { createContext, useContext, useState } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

const NotificacaoContext = createContext(null);

const ICONES = {
  success: 'bi-check-circle-fill',
  danger: 'bi-x-circle-fill',
  warning: 'bi-exclamation-triangle-fill',
  info: 'bi-info-circle-fill',
};

// Exibe toasts no canto da tela; qualquer componente chama notificar('mensagem', 'success')
export function NotificacaoProvider({ children }) {
  const [notificacoes, setNotificacoes] = useState([]);

  function notificar(mensagem, tipo = 'success') {
    setNotificacoes((atuais) => [...atuais, { id: crypto.randomUUID(), mensagem, tipo }]);
  }

  function remover(id) {
    setNotificacoes((atuais) => atuais.filter((n) => n.id !== id));
  }

  return (
    <NotificacaoContext.Provider value={{ notificar }}>
      {children}
      <ToastContainer position="top-end" className="p-3 position-fixed" style={{ zIndex: 2000 }}>
        {notificacoes.map((n) => (
          <Toast key={n.id} bg={n.tipo} onClose={() => remover(n.id)} delay={4000} autohide>
            <Toast.Body className={`d-flex align-items-start gap-2 ${n.tipo === 'warning' ? '' : 'text-white'}`}>
              <i className={`bi ${ICONES[n.tipo]}`} />
              <span className="flex-grow-1">{n.mensagem}</span>
              <button
                type="button"
                className={`btn-close ${n.tipo === 'warning' ? '' : 'btn-close-white'}`}
                aria-label="Fechar"
                onClick={() => remover(n.id)}
              />
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </NotificacaoContext.Provider>
  );
}

export function useNotificacao() {
  return useContext(NotificacaoContext);
}
