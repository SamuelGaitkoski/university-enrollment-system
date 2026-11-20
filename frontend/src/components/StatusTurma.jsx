import { Badge } from 'react-bootstrap';

// Aparência de cada status devolvido por avaliarMatricula
const ESTILOS = {
  disponivel: { texto: 'Disponível', cor: 'success', icone: 'bi-check-circle' },
  matriculado: { texto: 'Já matriculado', cor: 'primary', icone: 'bi-bookmark-check' },
  cursada: { texto: 'Já cursada', cor: 'secondary', icone: 'bi-mortarboard' },
  mesmaDisciplina: { texto: 'Já matriculado na disciplina', cor: 'secondary', icone: 'bi-bookmark' },
  preRequisito: { texto: 'Pré-requisito pendente', cor: 'warning', icone: 'bi-lock' },
  lotada: { texto: 'Lotada', cor: 'danger', icone: 'bi-people-fill' },
  conflito: { texto: 'Conflito de horário', cor: 'danger', icone: 'bi-calendar-x' },
  creditos: { texto: 'Limite de créditos', cor: 'warning', icone: 'bi-exclamation-triangle' },
};

export default function StatusTurma({ status }) {
  const estilo = ESTILOS[status];
  return (
    <Badge bg={estilo.cor} text={estilo.cor === 'warning' ? 'dark' : undefined}>
      <i className={`bi ${estilo.icone} me-1`} />
      {estilo.texto}
    </Badge>
  );
}
