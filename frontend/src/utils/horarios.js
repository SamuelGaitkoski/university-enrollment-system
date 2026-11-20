// Código de horário com 2 dígitos: 1º = dia (2=segunda … 7=sábado), 2º = turno (1=manhã, 2=tarde, 3=noite)
export const DIAS = [
  { codigo: '2', nome: 'Segunda', curto: 'Seg' },
  { codigo: '3', nome: 'Terça', curto: 'Ter' },
  { codigo: '4', nome: 'Quarta', curto: 'Qua' },
  { codigo: '5', nome: 'Quinta', curto: 'Qui' },
  { codigo: '6', nome: 'Sexta', curto: 'Sex' },
  { codigo: '7', nome: 'Sábado', curto: 'Sáb' },
];

export const TURNOS = [
  { codigo: '1', nome: 'Manhã' },
  { codigo: '2', nome: 'Tarde' },
  { codigo: '3', nome: 'Noite' },
];

const diaDe = (codigo) => DIAS.find((d) => d.codigo === codigo[0]);
const turnoDe = (codigo) => TURNOS.find((t) => t.codigo === codigo[1]);

// "21" → "Segunda · Manhã"
export function decodificarHorario(codigo) {
  return `${diaDe(codigo)?.nome ?? '?'} · ${turnoDe(codigo)?.nome ?? '?'}`;
}

// "21" → "Seg manhã" (para tabelas e badges)
export function horarioCurto(codigo) {
  return `${diaDe(codigo)?.curto ?? '?'} ${turnoDe(codigo)?.nome.toLowerCase() ?? '?'}`;
}

// Ordena por dia e depois por turno: como os dois são dígitos, a ordem do texto já resolve
export function ordenarHorarios(horarios) {
  return [...horarios].sort();
}
