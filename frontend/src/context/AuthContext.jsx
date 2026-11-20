import { createContext, useContext, useState } from 'react';

const CHAVE_STORAGE = 'perfil';
const AuthContext = createContext(null);

// Lê o perfil salvo para manter o usuário logado após recarregar a página
function lerPerfilSalvo() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_STORAGE));
  } catch {
    return null;
  }
}

// perfil: { tipo: 'secretaria' } ou { tipo: 'aluno', aluno: { id, nome, matricula } }
export function AuthProvider({ children }) {
  const [perfil, setPerfil] = useState(lerPerfilSalvo);

  function entrar(novoPerfil) {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(novoPerfil));
    setPerfil(novoPerfil);
  }

  function sair() {
    localStorage.removeItem(CHAVE_STORAGE);
    setPerfil(null);
  }

  return (
    <AuthContext.Provider value={{ perfil, entrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Página inicial de cada perfil
export function rotaInicial(perfil) {
  return perfil?.tipo === 'aluno' ? '/aluno' : '/secretaria';
}
