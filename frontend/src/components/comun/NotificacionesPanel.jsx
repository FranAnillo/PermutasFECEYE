import { useEffect, useRef, useId } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { formatearFecha } from '../../lib/formateadorFechas';
import '../../styles/notificaciones-panel.css';

export default function NotificacionesPanel({ notificaciones, cargando, onClose }) {
  const dialog = useRef(null);
  const titleId = useId();
  const { t } = useTranslation();
  useEffect(() => {
    const node = dialog.current;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    node.showModal();
    return () => {
      node.close();
      document.body.style.overflow = overflow;
      previousFocus?.focus();
    };
  }, []);

  return <dialog ref={dialog} className="notifications-drawer" aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right ||
          event.clientY < rect.top || event.clientY > rect.bottom) onClose();
    }}>
    <header className="notifications-drawer-header">
      <h2 id={titleId}>{t('common.notifications')}</h2>
      <button type="button" aria-label={t('common.close')} onClick={onClose}>×</button>
    </header>
    {cargando ? <p role="status">{t('common.loading')}</p> : notificaciones.length ?
      notificaciones.slice(0, 5).map(item => <article key={item.id} className="notification-item">
        <p className="contenido">{item.contenido}</p>
        <p className="fecha">{formatearFecha(item.fecha_creacion)}</p>
      </article>) : <p>{t('common.no_notifications')}</p>}
  </dialog>;
}

NotificacionesPanel.propTypes = {
  notificaciones: PropTypes.array.isRequired,
  cargando: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
