import { useCallback, useEffect, useRef, useState } from 'react';
import { get } from '../services/api';

// Busca várias rotas em paralelo e controla os estados de carregamento e erro.
// Uso: const { dados } = useDados({ disciplinas: '/disciplinas', turmas: '/turmas' })
export default function useDados(rotas) {
  // A chave em texto evita buscar de novo a cada renderização
  const chave = JSON.stringify(rotas);
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const ultimaBusca = useRef(0);

  const recarregar = useCallback(async () => {
    const entradas = Object.entries(JSON.parse(chave));
    // Numera a busca: se outra mais nova começar, a resposta desta é descartada
    const numero = ++ultimaBusca.current;
    try {
      const resultados = await Promise.all(entradas.map(([, rota]) => get(rota)));
      if (numero !== ultimaBusca.current) return;
      setDados(Object.fromEntries(entradas.map(([nome], i) => [nome, resultados[i]])));
      setErro('');
    } catch (e) {
      if (numero === ultimaBusca.current) setErro(e.message);
    } finally {
      if (numero === ultimaBusca.current) setCarregando(false);
    }
  }, [chave]);

  // Papel do componentDidMount/componentDidUpdate: busca ao montar e quando as rotas mudam
  useEffect(() => {
    recarregar();
  }, [recarregar]);

  function tentarNovamente() {
    setCarregando(true);
    setErro('');
    recarregar();
  }

  return { dados, carregando, erro, recarregar, tentarNovamente };
}
