import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import RotaProtegida from './components/RotaProtegida';
import Entrar from './pages/Entrar';
import NaoEncontrada from './pages/NaoEncontrada';
import MinhasMatriculas from './pages/aluno/MinhasMatriculas';
import Ofertas from './pages/aluno/Ofertas';
import Alunos from './pages/secretaria/Alunos';
import DetalheTurma from './pages/secretaria/DetalheTurma';
import Disciplinas from './pages/secretaria/Disciplinas';
import GradeOfertas from './pages/secretaria/GradeOfertas';
import Painel from './pages/secretaria/Painel';
import Professores from './pages/secretaria/Professores';
import Turmas from './pages/secretaria/Turmas';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Entrar />} />

        {/* Visão institucional */}
        <Route path="/secretaria" element={<RotaProtegida tipo="secretaria" />}>
          <Route index element={<Painel />} />
          <Route path="disciplinas" element={<Disciplinas />} />
          <Route path="professores" element={<Professores />} />
          <Route path="alunos" element={<Alunos />} />
          <Route path="turmas" element={<Turmas />} />
          <Route path="turmas/:id" element={<DetalheTurma />} />
          <Route path="grade" element={<GradeOfertas />} />
        </Route>

        {/* Visão do aluno */}
        <Route path="/aluno" element={<RotaProtegida tipo="aluno" />}>
          <Route index element={<MinhasMatriculas />} />
          <Route path="ofertas" element={<Ofertas />} />
        </Route>

        <Route path="*" element={<NaoEncontrada />} />
      </Route>
    </Routes>
  );
}
