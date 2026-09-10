import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import SolicitarPermuta from '../solicitarPermuta';
import { obtenerTodosGruposMisAsignaturasSinGrupoUsuario } from '../../../services/grupo';
import { solicitarPermuta } from '../../../services/permuta';

const navigate = vi.fn();
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('../../../services/grupo', () => ({
  obtenerTodosGruposMisAsignaturasSinGrupoUsuario: vi.fn(),
}));
vi.mock('../../../services/permuta', () => ({ solicitarPermuta: vi.fn() }));
vi.mock('react-toastify', () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
  obtenerTodosGruposMisAsignaturasSinGrupoUsuario.mockResolvedValue({
    result: {
      result: [
        { codasignatura: 12345, nombreasignatura: 'Economía', numgrupo: 2 },
        { codasignatura: 12345, nombreasignatura: 'Economía', numgrupo: 3 },
      ],
    },
  });
  solicitarPermuta.mockResolvedValue({ err: false });
});

it('envía varios grupos deseados en una única solicitud de asignatura', async () => {
  render(<SolicitarPermuta />);

  const grupo2 = await screen.findByRole('checkbox', { name: 'Grupo 2' });
  const grupo3 = screen.getByRole('checkbox', { name: 'Grupo 3' });
  fireEvent.click(grupo2);
  fireEvent.click(grupo3);

  expect(grupo2).toHaveAttribute('aria-checked', 'true');
  expect(grupo3).toHaveAttribute('aria-checked', 'true');
  expect(screen.getByText('Solicitud lista para G.2, G.3')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /Solicitar Ahora/ }));

  await waitFor(() => expect(solicitarPermuta).toHaveBeenCalledWith(12345, [2, 3]));
  expect(solicitarPermuta).toHaveBeenCalledTimes(1);
  expect(navigate).toHaveBeenCalledWith('/misSolicitudesPermuta');
});
