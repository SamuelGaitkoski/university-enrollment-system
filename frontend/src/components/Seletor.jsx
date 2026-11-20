import { Dropdown } from 'react-bootstrap';

// O Dropdown não aceita eventKey vazio, então a opção "Todos" usa esta chave
const VAZIO = '__vazio__';

// Select personalizado: menu com rolagem quando há muitas opções, no lugar do <select> nativo.
// opcoes: [{ valor, rotulo }]; onChange recebe só o valor escolhido.
export default function Seletor({
  id,
  value,
  onChange,
  opcoes,
  placeholder = 'Selecione...',
  erro,
  mostrarErro = false,
  disabled = false,
  ariaLabel,
}) {
  const selecionada = opcoes.find((o) => o.valor === value);

  return (
    <Dropdown className="seletor w-100" onSelect={(chave) => onChange(chave === VAZIO ? '' : chave)}>
      <Dropdown.Toggle
        id={id}
        as="button"
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        className={`form-select text-start text-truncate ${mostrarErro && erro ? 'is-invalid' : ''}`}
      >
        {selecionada ? selecionada.rotulo : <span className="text-secondary">{placeholder}</span>}
      </Dropdown.Toggle>

      <Dropdown.Menu className="w-100 shadow-sm">
        {opcoes.map((opcao) => (
          <Dropdown.Item
            key={opcao.valor || VAZIO}
            eventKey={opcao.valor || VAZIO}
            active={opcao.valor === value}
            className="d-flex justify-content-between align-items-center gap-2 text-wrap"
          >
            {opcao.rotulo}
            {opcao.valor === value && <i className="bi bi-check-lg" />}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>

      {mostrarErro && erro && <div className="invalid-feedback d-block">{erro}</div>}
    </Dropdown>
  );
}
