import { Container } from 'react-bootstrap';
import { Outlet } from 'react-router-dom';
import BarraNavegacao from './BarraNavegacao';

export default function Layout() {
  return (
    <>
      <BarraNavegacao />
      <Container as="main" className="py-4">
        <Outlet />
      </Container>
    </>
  );
}
