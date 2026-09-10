import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import NotificacionesPanel from '../NotificacionesPanel';
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: key => key }) }));
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function () { this.setAttribute('open', ''); });
  HTMLDialogElement.prototype.close = vi.fn(function () { this.removeAttribute('open'); });
});
function View() {
  const [open, setOpen] = useState(false);
  return <><p>Panel actual</p><button onClick={() => setOpen(true)}>Campana</button>
    {open && <NotificacionesPanel notificaciones={[]} cargando={false} onClose={() => setOpen(false)} />}</>;
}
it('abre un diálogo, conserva la página, y cierra al pulsar fuera restaurando el foco', () => {
  render(<View />);
  const bell = screen.getByText('Campana');
  bell.focus();
  fireEvent.click(bell);
  const panel = screen.getByRole('dialog');
  panel.getBoundingClientRect = () => ({ left: 640, right: 1000, top: 0, bottom: 800 });
  expect(screen.getByText('Panel actual')).toBeInTheDocument();
  expect(document.body.style.overflow).toBe('hidden');
  fireEvent.click(panel, { clientX: 700, clientY: 200 });
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  fireEvent.click(panel, { clientX: 100, clientY: 200 });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(document.body.style.overflow).toBe('');
  expect(bell).toHaveFocus();
});
it('cierra con Escape y con el botón de cierre', () => {
  render(<View />);
  fireEvent.click(screen.getByText('Campana'));
  fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  fireEvent.click(screen.getByText('Campana'));
  fireEvent.click(screen.getByRole('button', { name: 'common.close' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
