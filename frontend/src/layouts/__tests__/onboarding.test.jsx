import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LayoutEstudiante from '../LayoutEstudiante';
import { obtenerConfiguracionInicial, guardarConfiguracionInicial } from '../../services/configuracionInicial';
vi.mock('../../services/configuracionInicial', () => ({ obtenerConfiguracionInicial: vi.fn(), guardarConfiguracionInicial: vi.fn() }));
vi.mock('../../components/usuario/NavbarEstudiante', () => ({ default: () => <nav>Menú estudiante</nav> }));
vi.mock('../../components/comun/footer', () => ({ default: () => <footer>FCEYE</footer> }));
const logout = vi.fn();
vi.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ logout }) }));
const usuario = { id: 1, nombre_completo: 'Ana', titulacion: 'Economía' };
const grado = { usuario, paso: 'grado', completo: false, matriculadas: [], estudios: [{ id: 1, nombre: 'Economía' }] };
const subjects = { usuario, paso: 'asignaturas', completo: false, matriculadas: [], asignaturas: [{ id: 10, nombre: 'Matemáticas', curso: 1 }, { id: 11, nombre: 'Econometría', curso: 2 }] };
const groups = { usuario, paso: 'grupos', completo: false, matriculadas: [{ id: 10, nombre: 'Matemáticas', grupo_id: null }, { id: 11, nombre: 'Econometría', grupo_id: null }], grupos: [{ id: 20, nombre: '1', asignatura_id: 10 }, { id: 21, nombre: '2', asignatura_id: 11 }] };
const complete = { usuario, paso: 'completo', completo: true, matriculadas: [] };
function view(path = '/miPerfil') {
  return render(<MemoryRouter initialEntries={[path]}><Routes>
    <Route element={<LayoutEstudiante />}>
      <Route path="/miPerfil" element={<p>Perfil disponible</p>} />
      <Route path="/permutas" element={<p>Buscar permutas</p>} />
    </Route>
    <Route path="/login" element={<p>Acceso público</p>} />
  </Routes></MemoryRouter>);
}
beforeEach(() => {
  vi.clearAllMocks();
  obtenerConfiguracionInicial.mockReset().mockResolvedValue(grado);
  guardarConfiguracionInicial.mockReset();
  HTMLDialogElement.prototype.showModal = vi.fn(function () { this.setAttribute('open',''); });
  HTMLDialogElement.prototype.close = vi.fn(function () { this.removeAttribute('open'); });
});
afterEach(cleanup);
it('bloquea la ruta directa y redirige al perfil sin montar las permutas', async () => {
  view('/permutas');
  expect(screen.queryByText('Buscar permutas')).not.toBeInTheDocument();
  expect(await screen.findByLabelText('Grado en el que estás matriculado')).toBeInTheDocument();
  expect(screen.queryByText('Buscar permutas')).not.toBeInTheDocument();
  const dialog = screen.getByRole('dialog');
  expect(fireEvent(dialog, new Event('cancel', { cancelable: true }))).toBe(false);
  expect(dialog).toHaveAttribute('open');
  expect(document.body.style.overflow).toBe('hidden');
});
it('exige grado, asignaturas de varios cursos y todos los grupos antes de desbloquear', async () => {
  guardarConfiguracionInicial.mockResolvedValueOnce(subjects).mockResolvedValueOnce(groups).mockResolvedValueOnce(complete);
  view();
  expect(await screen.findByRole('button', { name: 'Guardar y continuar' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Grado en el que estás matriculado'), { target: { value: '1' } });
  fireEvent.click(screen.getByText('Guardar y continuar'));
  expect(await screen.findByLabelText('Filtrar por curso')).toBeInTheDocument();
  expect(screen.getByText('Guardar y continuar')).toBeDisabled();
  fireEvent.click(screen.getByRole('checkbox', { name: /Matemáticas/ }));
  fireEvent.change(screen.getByLabelText('Filtrar por curso'), { target: { value: '2' } });
  fireEvent.click(screen.getByRole('checkbox', { name: /Econometría/ }));
  fireEvent.click(screen.getByText('Guardar y continuar'));
  fireEvent.change(await screen.findByLabelText('Matemáticas'), { target: { value: '20' } });
  expect(screen.getByText('Guardar y completar mi perfil')).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Econometría'), { target: { value: '21' } });
  fireEvent.click(screen.getByText('Guardar y completar mi perfil'));
  expect(await screen.findByText('Perfil disponible')).toBeInTheDocument();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(document.body.style.overflow).toBe('');
  expect(guardarConfiguracionInicial.mock.calls.map(c => c[0])).toEqual([
    { paso: 'grado', estudio_id: 1 }, { paso: 'asignaturas', asignatura_ids: [10,11] },
    { paso: 'grupos', grupos: [{ asignatura_id: 10, grupo_id: 20 }, { asignatura_id: 11, grupo_id: 21 }] },
  ]);
});
it('retoma grupos pendientes de una sesión anterior y conserva los ya asignados', async () => {
  obtenerConfiguracionInicial.mockResolvedValue({ ...groups, matriculadas: [{ ...groups.matriculadas[0], grupo_id: 20 }, groups.matriculadas[1]] });
  view();
  expect(await screen.findByLabelText('Matemáticas')).toHaveValue('20');
  expect(screen.getByLabelText('Econometría')).toHaveValue('');
  expect(screen.getByText('Guardar y completar mi perfil')).toBeDisabled();
});
it('permite entrar directamente cuando el servidor confirma que está completo', async () => {
  obtenerConfiguracionInicial.mockResolvedValue(complete);
  view('/permutas');
  expect(await screen.findByText('Buscar permutas')).toBeInTheDocument();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
it('un fallo de carga bloquea el acceso y ofrece reintento', async () => {
  obtenerConfiguracionInicial.mockRejectedValueOnce(new Error('offline'));
  view();
  expect(await screen.findByRole('alert')).toHaveTextContent('No hemos podido comprobar');
  expect(screen.queryByText('Perfil disponible')).not.toBeInTheDocument();
  fireEvent.click(screen.getByText('Volver a comprobar'));
  expect(await screen.findByLabelText('Grado en el que estás matriculado')).toBeInTheDocument();
});
it('un fallo al guardar no avanza ni pierde la selección y evita doble envío', async () => {
  let reject;
  guardarConfiguracionInicial.mockReturnValue(new Promise((_, no) => { reject = no; }));
  view();
  fireEvent.change(await screen.findByLabelText('Grado en el que estás matriculado'), { target: { value: '1' } });
  fireEvent.click(screen.getByText('Guardar y continuar'));
  fireEvent.click(screen.getByText('Guardando…'));
  expect(guardarConfiguracionInicial).toHaveBeenCalledTimes(1);
  reject(new Error('No se ha guardado'));
  expect(await screen.findByRole('alert')).toHaveTextContent('No se ha guardado');
  expect(screen.getByLabelText('Grado en el que estás matriculado')).toHaveValue('1');
  expect(screen.queryByText('Perfil disponible')).not.toBeInTheDocument();
});
it('permite cerrar sesión incluso si el perfil no puede cargarse', async () => {
  obtenerConfiguracionInicial.mockRejectedValue(new Error('offline'));
  logout.mockResolvedValue();
  view();
  await screen.findByRole('alert');
  fireEvent.click(screen.getByText('Cerrar sesión y continuar más tarde'));
  await waitFor(() => expect(screen.getByText('Acceso público')).toBeInTheDocument());
});

it('muestra solo carga mientras verifica un perfil completo, sin abrir el asistente', async () => {
  let resolve;
  obtenerConfiguracionInicial.mockReturnValue(new Promise(ok => { resolve = ok; }));
  view('/permutas');
  expect(screen.getByRole('status')).toHaveTextContent('Cargando');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.queryByText('Mi perfil')).not.toBeInTheDocument();
  expect(screen.queryByText('Buscar permutas')).not.toBeInTheDocument();
  resolve(complete);
  expect(await screen.findByText('Buscar permutas')).toBeInTheDocument();
  expect(HTMLDialogElement.prototype.showModal).not.toHaveBeenCalled();
});
