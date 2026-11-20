// Endereço da API: definido em .env (VITE_API_URL) ou o padrão local
const URL_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Faz a requisição e converte erros HTTP/rede em Error com mensagem em português
async function requisicao(caminho, opcoes = {}) {
  let resposta;
  try {
    resposta = await fetch(`${URL_BASE}${caminho}`, {
      headers: { 'Content-Type': 'application/json' },
      ...opcoes,
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique se o back-end está rodando.');
  }

  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => ({}));
    throw new Error(corpo.erro || `Erro ${resposta.status} ao acessar o servidor.`);
  }

  return resposta.status === 204 ? null : resposta.json();
}

// get('/turmas', { semestre: '2026/2' }) → GET /turmas?semestre=2026%2F2
export function get(caminho, filtros) {
  const query = filtros ? `?${new URLSearchParams(filtros)}` : '';
  return requisicao(`${caminho}${query}`);
}

export function post(caminho, dados) {
  return requisicao(caminho, { method: 'POST', body: JSON.stringify(dados) });
}

export function put(caminho, dados) {
  return requisicao(caminho, { method: 'PUT', body: JSON.stringify(dados) });
}

export function del(caminho) {
  return requisicao(caminho, { method: 'DELETE' });
}
