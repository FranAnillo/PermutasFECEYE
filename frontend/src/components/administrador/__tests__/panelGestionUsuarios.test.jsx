import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { obtenerTodosUsuarios, actualizarUsuario } from '../../../services/usuario';
import UserManagementPanel from '../panelGestionUsuarios.jsx';

vi.mock('../../../services/usuario', () => ({ obtenerTodosUsuarios: vi.fn(), actualizarUsuario: vi.fn() }));

const sampleUsers = [
    { uvus: 'alice', nombre_completo: 'Alice', correo: 'alice@example.com', rol: 'estudiante' },
    { uvus: 'bob', nombre_completo: 'Bob', correo: 'bob@example.com', rol: 'administrador' },
];

beforeEach(() => {
    vi.clearAllMocks();
    obtenerTodosUsuarios.mockResolvedValue({ result: { result: sampleUsers } });
});

describe('UserManagementPanel', () => {
    it('shows loading until the user request completes', async () => {
        render(<UserManagementPanel />);
        expect(screen.getByText('Cargando usuarios...')).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByText('Cargando usuarios...')).not.toBeInTheDocument());
    });

    it('renders users from the current API envelope', async () => {
        render(<UserManagementPanel />);
        expect(await screen.findByRole('heading', { name: /Alice/ })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /Bob/ })).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: /Editar/ })).toHaveLength(2);
    });

    it('shows a loading failure', async () => {
        obtenerTodosUsuarios.mockRejectedValue(new Error('Network error'));
        render(<UserManagementPanel />);
        expect(await screen.findByText('Error: Network error')).toBeInTheDocument();
    });

    it('sends edited fields for the selected UVUS and updates the card', async () => {
        actualizarUsuario.mockResolvedValue({});
        const { container } = render(<UserManagementPanel />);
        const editButtons = await screen.findAllByRole('button', { name: /Editar/ });
        fireEvent.click(editButtons[0]);
        fireEvent.change(container.querySelector('input[name="name"]'), { target: { value: 'Alice Actualizada' } });
        fireEvent.click(screen.getByRole('button', { name: 'Guardar Cambios' }));
        await waitFor(() => expect(actualizarUsuario).toHaveBeenCalledWith('alice', { nombre_completo: 'Alice Actualizada', correo: 'alice@example.com', rol: 'estudiante' }));
        expect(await screen.findByRole('heading', { name: /Alice Actualizada/ })).toBeInTheDocument();
        expect(screen.queryByText('Guardar Cambios')).not.toBeInTheDocument();
    });

    it('shows an update failure', async () => {
        actualizarUsuario.mockRejectedValue(new Error('Update failed'));
        render(<UserManagementPanel />);
        const editButtons = await screen.findAllByRole('button', { name: /Editar/ });
        fireEvent.click(editButtons[0]);
        fireEvent.click(screen.getByRole('button', { name: 'Guardar Cambios' }));
        expect(await screen.findByText('Error: Update failed')).toBeInTheDocument();
    });

    it('filters the list by name and role', async () => {
        render(<UserManagementPanel />);
        await screen.findByRole('heading', { name: /Alice/ });
        fireEvent.change(screen.getByPlaceholderText('Buscar por nombre...'), { target: { value: 'ali' } });
        expect(screen.queryByRole('heading', { name: /Bob/ })).not.toBeInTheDocument();
        fireEvent.change(screen.getByPlaceholderText('Buscar por nombre...'), { target: { value: '' } });
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'administrador' } });
        expect(screen.queryByRole('heading', { name: /Alice/ })).not.toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /Bob/ })).toBeInTheDocument();
    });
});
