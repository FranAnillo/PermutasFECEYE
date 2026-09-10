import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import GeneracionPDF from '../generacionPDF.jsx';
import PermutasAceptadas from '../permutasAceptadas.jsx';
import * as api from '../../../services/permuta.js';
import * as archivos from '../../../services/subidaArchivos.js';
import { toast } from 'react-toastify';
import { readFileSync } from 'node:fs';
import { PDFDocument } from 'pdf-lib';

vi.mock('../../../services/permuta.js', () => ({ obtenerDocumentoPermuta: vi.fn(),
  firmarPermuta: vi.fn(), aceptarPermuta: vi.fn(), validarSolicitudPermuta: vi.fn(),
  obtenerPermutasAgrupadasPorUsuario: vi.fn(), generarBorradorPermuta: vi.fn(), resolverDocumentoPermuta: vi.fn() }));
vi.mock('../../../services/subidaArchivos.js', () => ({ obtenerPlantillaPermuta: vi.fn(),
  subirPDFDocumento: vi.fn(), descargarPDFDocumento: vi.fn() }));
vi.mock('../../../services/login.js', () => ({ obtenerSesion: vi.fn(async () => ({ user: { uvus: 'aaa0000' } })) }));
vi.mock('react-toastify', () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() } }));
const { traducir } = vi.hoisted(() => ({ traducir: key => key }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: traducir }) }));
vi.mock('../../../lib/logger.js', () => ({ logError: vi.fn() }));

const Location = () => <div data-testid="location">{useLocation().search}</div>;
const montar = (url = '/generarPermuta?documento=8') => render(<MemoryRouter initialEntries={[url]}>
  <GeneracionPDF />
</MemoryRouter>);

beforeEach(() => {
  vi.clearAllMocks();
  URL.createObjectURL = vi.fn(() => 'blob:test');
  URL.revokeObjectURL = vi.fn();
});

describe('pantalla de documentos', () => {
  it('genera la plantilla real con los grupos de ambos estudiantes y deja editable al segundo', async () => {
    api.obtenerDocumentoPermuta.mockResolvedValue({ result: { result: {
      id: 8, estado: 'BORRADOR', puedeEditar: true, estudiante_cumplimentado_1: 'aaa0000',
      grupo: { usuarios: [
        { uvus: 'aaa0000', correo: 'arturo@example.test', estudio: 'Economía' },
        { uvus: 'sample', correo: 'sample@example.test', estudio: 'Economía' },
      ], permutas: [{ permuta_id: 5, nombre_asignatura: 'Economía Pública I', curso_asignatura: 3,
        usuario_1_uvus: 'aaa0000', usuario_2_uvus: 'sample', usuario_1_grupo: 1, usuario_2_grupo: 2 }] },
    } } });
    const plantilla = readFileSync('../backend/assets/plantillas/plantillaPermuta2627.pdf');
    archivos.obtenerPlantillaPermuta.mockResolvedValue(new Uint8Array(plantilla));
    montar();
    await screen.findByLabelText('Curso del estudiante');
    const values = ['2', 'Arturo', 'Lopez Costalez', '12345678', 'Z', 'Calle Ejemplo 1', 'Sevilla', '41001', 'Sevilla', '600123123'];
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(values.length);
    inputs.forEach((input, i) => fireEvent.change(input, { target: { value: values[i] } }));
    fireEvent.click(screen.getByText('pdf_generation.buttons.visualize'));
    await waitFor(() => { if (toast.error.mock.calls.length) throw new Error(JSON.stringify(toast.error.mock.calls)); expect(URL.createObjectURL).toHaveBeenCalled(); });
    const blob = URL.createObjectURL.mock.calls[0][0];
    const bytes = await new Promise(resolve => {
      const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsArrayBuffer(blob);
    });
    const form = (await PDFDocument.load(bytes)).getForm();
    expect(form.getTextField('NOMBRE_1').getText()).toBe('Arturo');
    expect(form.getTextField('EMAIL_2').getText()).toBe('sample@example.test');
    expect(form.getTextField('GRUPO_ACTUAL_1_1').getText()).toBe('1');
    expect(form.getTextField('GRUPO_NUEVO_1_1').getText()).toBe('2');
    expect(form.getTextField('GRUPO_ACTUAL_2_1').getText()).toBe('2');
    expect(form.getTextField('GRUPO_NUEVO_2_1').getText()).toBe('1');
    expect(form.getTextField('CURSO_SOLICITANTE_1').getText()).toBe('2');
    expect(form.getTextField('CURSO_1_1').getText()).toBe('3');
    expect(form.getTextField('NOMBRE_2').isReadOnly()).toBe(false);
    expect(form.getTextField('CURSO_SOLICITANTE_2').isReadOnly()).toBe(false);
  });

  it('consulta el documento de la URL y permite ver un PDF final sin datos académicos', async () => {
    api.obtenerDocumentoPermuta.mockResolvedValue({ result: { result: { id: 8, estado: 'VALIDADA', puedeEditar: false, puedeValidar: false } } });
    archivos.descargarPDFDocumento.mockResolvedValue(new Uint8Array([1,2,3]));
    montar();
    expect(await screen.findByTitle('Vista previa del PDF')).toBeInTheDocument();
    expect(api.obtenerDocumentoPermuta).toHaveBeenCalledWith(8);
    expect(archivos.descargarPDFDocumento).toHaveBeenCalledWith(8);
    expect(archivos.obtenerPlantillaPermuta).not.toHaveBeenCalled();
  });

  it.each(['/generarPermuta', '/generarPermuta?documento=undefined'])('un enlace sin documento válido vuelve al listado: %s', async url => {
    render(<MemoryRouter initialEntries={[url]}><Routes>
      <Route path="/generarPermuta" element={<GeneracionPDF />} />
      <Route path="/permutasAceptadas" element={<p>Listado de permutas</p>} />
    </Routes></MemoryRouter>);
    expect(await screen.findByText('Listado de permutas')).toBeInTheDocument();
    expect(api.obtenerDocumentoPermuta).not.toHaveBeenCalled();
  });

  it('un fallo al aceptar el PDF no muestra éxito ni navega', async () => {
    api.obtenerDocumentoPermuta.mockResolvedValue({ result: { result: { id: 8, estado: 'FIRMADA', puedeEditar: true } } });
    archivos.descargarPDFDocumento.mockResolvedValue(new Uint8Array([1]));
    archivos.subirPDFDocumento.mockResolvedValue({ result: { fileId: 'archivo.pdf' } });
    api.aceptarPermuta.mockRejectedValue(new Error('El documento ha cambiado de estado'));
    montar();
    const input = await screen.findByLabelText(/Seleccionar PDF firmado/);
    fireEvent.change(input, { target: { files: [new File(['%PDF-'], 'firmado.pdf', { type: 'application/pdf' })] } });
    fireEvent.click(screen.getByText('pdf_generation.buttons.upload'));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('El documento ha cambiado de estado'));
    expect(toast.success).not.toHaveBeenCalled();
    expect(screen.getByTitle('Vista previa del PDF')).toBeInTheDocument();
  });

  it('el estudiante fuera de turno no puede subir un documento', async () => {
    api.obtenerDocumentoPermuta.mockResolvedValue({ result: { result: { id: 8, estado: 'FIRMADA', puedeEditar: false } } });
    archivos.descargarPDFDocumento.mockResolvedValue(new Uint8Array([1]));
    montar();
    await screen.findByTitle('Vista previa del PDF');
    expect(screen.queryByText('pdf_generation.buttons.upload')).not.toBeInTheDocument();
  });

  it('el segundo grupo navega a su documento existente', async () => {
    api.obtenerPermutasAgrupadasPorUsuario.mockResolvedValue({ result: { result: [
      { usuarios: ['aaa0000','aaa0001'], permutas: [{ permuta_id: 2, documento_id: 7, estado_permuta_asociada: 'BORRADOR' }] },
      { usuarios: ['aaa0000','sample'], permutas: [{ permuta_id: 5, documento_id: 8, estado_permuta_asociada: 'BORRADOR' }] },
    ] } });
    render(<MemoryRouter initialEntries={['/permutasAceptadas']}><Routes>
      <Route path="/permutasAceptadas" element={<PermutasAceptadas />} />
      <Route path="/generarPermuta" element={<Location />} />
    </Routes></MemoryRouter>);
    const botones = await screen.findAllByText('accepted_swaps.continue_swap');
    fireEvent.click(botones[1]);
    expect(await screen.findByTestId('location')).toHaveTextContent('?documento=8');
  });

  it('resuelve la tarjeta pulsada cuando el listado no incluye documento_id', async () => {
    api.obtenerPermutasAgrupadasPorUsuario.mockResolvedValue({ result: { result: [
      { usuarios: ['aaa0000','sample'], permutas: [
        { permuta_id: 6, nombre_asignatura: 'Finanzas', estado_permuta_asociada: 'BORRADOR' },
        { permuta_id: 5, nombre_asignatura: 'Economía Pública I', estado_permuta_asociada: 'BORRADOR' },
      ] },
      { usuarios: ['aaa0000','aaa0001'], permutas: [{ permuta_id: 2, nombre_asignatura: 'Matemáticas II', estado_permuta_asociada: 'BORRADOR' }] },
    ] } });
    api.resolverDocumentoPermuta.mockResolvedValue(12);
    render(<MemoryRouter initialEntries={['/permutasAceptadas']}><Routes>
      <Route path="/permutasAceptadas" element={<PermutasAceptadas />} />
      <Route path="/generarPermuta" element={<Location />} />
    </Routes></MemoryRouter>);
    fireEvent.click((await screen.findAllByText('accepted_swaps.continue_swap'))[0]);
    expect(await screen.findByTestId('location')).toHaveTextContent('?documento=12');
    expect(api.resolverDocumentoPermuta).toHaveBeenCalledWith([6,5]);
    expect(api.generarBorradorPermuta).not.toHaveBeenCalled();
  });
});
