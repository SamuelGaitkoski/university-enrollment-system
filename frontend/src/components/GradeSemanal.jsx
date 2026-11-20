import { Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { DIAS, TURNOS } from '../utils/horarios';

// Tabela dia × turno. Reutilizada na grade de ofertas (secretaria) e na grade pessoal (aluno).
// itens: [{ id, horarios: ['21'], titulo, subtitulo, detalhe, cor, para }]
export default function GradeSemanal({ itens, mensagemVazia = 'Nenhuma turma para exibir.' }) {
  if (itens.length === 0) {
    return <p className="text-secondary text-center py-4 mb-0">{mensagemVazia}</p>;
  }

  return (
    <Table bordered responsive className="mb-0 align-top" style={{ tableLayout: 'fixed', minWidth: 720 }}>
      <thead className="text-center">
        <tr>
          <th style={{ width: 80 }} />
          {DIAS.map((dia) => (
            <th key={dia.codigo}>{dia.nome}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {TURNOS.map((turno) => (
          <tr key={turno.codigo}>
            <th className="text-secondary fw-semibold small align-middle">{turno.nome}</th>
            {DIAS.map((dia) => {
              const codigo = dia.codigo + turno.codigo;
              // Turmas que acontecem neste dia e turno
              const naCelula = itens.filter((item) => item.horarios.includes(codigo));
              return (
                <td key={codigo} className="p-1" style={{ height: 72 }}>
                  {naCelula.map((item) => (
                    <CartaoGrade key={item.id} item={item} />
                  ))}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

function CartaoGrade({ item }) {
  const conteudo = (
    <>
      <div className="fw-semibold text-truncate">{item.titulo}</div>
      {item.subtitulo && <div className="text-truncate text-secondary">{item.subtitulo}</div>}
      {item.detalhe && <div className="text-secondary">{item.detalhe}</div>}
    </>
  );
  const classes = `d-block small rounded px-2 py-1 mb-1 bg-body-tertiary border-start border-4 border-${item.cor ?? 'primary'} text-body text-decoration-none`;

  return item.para ? (
    <Link to={item.para} className={classes} title={item.titulo}>
      {conteudo}
    </Link>
  ) : (
    <div className={classes} title={item.titulo}>
      {conteudo}
    </div>
  );
}
