import { Table } from 'react-bootstrap';
import { DIAS, TURNOS } from '../utils/horarios';

// Grade clicável dia × turno. "ocupados" marca horários já usados pelo professor: { '21': 'INF101' }
export default function SeletorHorarios({ selecionados, onChange, ocupados = {}, invalido = false }) {
  function alternar(codigo) {
    onChange(
      selecionados.includes(codigo)
        ? selecionados.filter((h) => h !== codigo)
        : [...selecionados, codigo]
    );
  }

  return (
    <Table
      bordered
      size="sm"
      className={`text-center mb-1 ${invalido ? 'border-danger' : ''}`}
      style={{ tableLayout: 'fixed' }}
    >
      <thead>
        <tr>
          <th />
          {DIAS.map((dia) => (
            <th key={dia.codigo} className="fw-normal small">
              {dia.curto}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {TURNOS.map((turno) => (
          <tr key={turno.codigo}>
            <th className="fw-normal small text-start">{turno.nome}</th>
            {DIAS.map((dia) => {
              const codigo = dia.codigo + turno.codigo;
              const marcado = selecionados.includes(codigo);
              const ocupadoPor = ocupados[codigo];
              // Selecionado em cima de um horário ocupado = conflito (vermelho)
              const cor = marcado
                ? ocupadoPor ? 'btn-danger' : 'btn-primary'
                : ocupadoPor ? 'bg-secondary-subtle text-secondary-emphasis' : 'btn-light';
              return (
                <td key={codigo} className="p-1">
                  <button
                    type="button"
                    className={`btn btn-sm w-100 ${cor}`}
                    style={{ minHeight: 34, fontSize: '0.75rem' }}
                    aria-pressed={marcado}
                    aria-label={`${dia.nome} ${turno.nome}${ocupadoPor ? `, ocupado por ${ocupadoPor}` : ''}`}
                    title={ocupadoPor ? `Professor já leciona ${ocupadoPor} neste horário` : codigo}
                    onClick={() => alternar(codigo)}
                  >
                    {marcado ? <i className="bi bi-check-lg" /> : ocupadoPor}
                  </button>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
