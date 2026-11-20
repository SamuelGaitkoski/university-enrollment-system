import { Navigate, Outlet } from 'react-router-dom';
import { rotaInicial, useAuth } from '../context/AuthContext';

// Só renderiza as rotas filhas se o perfil logado for o exigido
export default function RotaProtegida({ tipo }) {
  const { perfil } = useAuth();

  if (!perfil) return <Navigate to="/" replace />;
  if (perfil.tipo !== tipo) return <Navigate to={rotaInicial(perfil)} replace />;

  return <Outlet />;
}
