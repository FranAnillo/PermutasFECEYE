import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

const pasos = ['grado', 'asignaturas', 'grupos'];
const titulos = { grado: 'Primero, selecciona tu grado', asignaturas: 'Selecciona tus asignaturas', grupos: 'Indica tus grupos actuales' };
export default function ConfiguracionInicialModal({ estado, error, busy, onSave, onRetry, onLogout }) {
  const dialog = useRef(null);
  const [grado, setGrado] = useState('');
  const [asignaturas, setAsignaturas] = useState([]);
  const [curso, setCurso] = useState('');
  const [grupos, setGrupos] = useState(() => Object.fromEntries((estado?.matriculadas || [])
    .filter(a => a.grupo_id).map(a => [a.id, String(a.grupo_id)])));
  useEffect(() => {
    const node = dialog.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    node.showModal();
    return () => { node.close(); document.body.style.overflow = overflow; };
  }, []);
  const paso = estado?.paso;
  const courses = [...new Set((estado?.asignaturas || []).map(a => String(a.curso)))];
  const pendientes = (estado?.matriculadas || []).filter(a => !grupos[a.id]);
  const valido = paso === 'grado' ? Boolean(grado) : paso === 'asignaturas' ? asignaturas.length > 0
    : paso === 'grupos' && estado.matriculadas.length > 0 && pendientes.length === 0;
  function submit(event) {
    event.preventDefault();
    if (busy || !valido) return;
    onSave(paso === 'grado' ? { paso, estudio_id: Number(grado) } : paso === 'asignaturas'
      ? { paso, asignatura_ids: asignaturas }
      : { paso, grupos: estado.matriculadas.map(a => ({ asignatura_id: a.id, grupo_id: Number(grupos[a.id]) })) });
  }
  return <dialog ref={dialog} className="feceye-onboarding" aria-labelledby="onboarding-title"
    aria-describedby="onboarding-description" onCancel={event => event.preventDefault()}>
    <p className="onboarding-eyebrow">PERMUTAS FECEYE · TU PERFIL ACADÉMICO</p>
    <h1 id="onboarding-title">{titulos[paso] || 'Preparando tu perfil'}</h1>
    <p id="onboarding-description">Antes de buscar permutas, necesitamos conocer tu grado, tus asignaturas y el grupo en el que estás matriculado en cada una.</p>
    <ol className="onboarding-steps" aria-label="Pasos de configuración">
      {pasos.map((p,i) => <li key={p} aria-current={paso === p ? 'step' : undefined}>
        <span>{i+1}</span> {p === 'grado' ? 'Grado' : p === 'asignaturas' ? 'Asignaturas' : 'Grupos'}
      </li>)}
    </ol>
    {error && <div className="onboarding-error" role="alert"><p>{error}</p>
      <button type="button" onClick={onRetry} disabled={busy}>Volver a comprobar</button></div>}
    {!estado && !error && <p role="status">Consultando tus datos…</p>}
    {estado && <form onSubmit={submit} aria-busy={busy}>
      <fieldset disabled={busy}>
        <legend className="onboarding-sr">{titulos[paso]}</legend>
        {paso === 'grado' && <>
          <label htmlFor="onboarding-grado">Grado en el que estás matriculado</label>
          <select id="onboarding-grado" required value={grado} onChange={e => setGrado(e.target.value)}>
            <option value="">Selecciona tu grado</option>
            {(estado.estudios || []).map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
          <p>Comprueba tu elección: si necesitas cambiar de grado después, tendrás que contactar con administración.</p>
          {!estado.estudios?.length && <p role="status">No hay grados disponibles. Contacta con administración.</p>}
        </>}
        {paso === 'asignaturas' && <>
          <p className="onboarding-degree">{estado.usuario.titulacion}</p>
          <label htmlFor="onboarding-curso">Filtrar por curso</label>
          <select id="onboarding-curso" value={curso} onChange={e => setCurso(e.target.value)}>
            <option value="">Todos los cursos</option>
            {courses.map(c => <option key={c} value={c}>Curso {c}</option>)}
          </select>
          <div className="onboarding-subjects">
            {(estado.asignaturas || []).filter(a => !curso || String(a.curso) === curso).map(a => <label key={a.id} className="onboarding-subject">
              <input type="checkbox" checked={asignaturas.includes(a.id)} onChange={e => setAsignaturas(prev => e.target.checked ? [...prev,a.id] : prev.filter(id => id !== a.id))} />
              <span>{a.nombre}<small>Curso {a.curso}</small></span>
            </label>)}
          </div>
          <p aria-live="polite">{asignaturas.length} asignaturas seleccionadas. Puedes elegir asignaturas de varios cursos.</p>
          {!estado.asignaturas?.length && <p role="status">No hay asignaturas disponibles para tu grado. Contacta con administración.</p>}
        </>}
        {paso === 'grupos' && <>
          <p>Selecciona tu grupo actual, no el grupo al que quieres cambiarte.</p>
          <div className="onboarding-subjects">
            {estado.matriculadas.map(a => {
              const disponibles = (estado.grupos || []).filter(g => g.asignatura_id === a.id);
              return <div className="onboarding-group" key={a.id}>
                <label htmlFor={`grupo-${a.id}`}>{a.nombre}</label>
                <select id={`grupo-${a.id}`} value={grupos[a.id] || ''} required
                  onChange={e => setGrupos(prev => ({ ...prev, [a.id]: e.target.value }))}>
                  <option value="">Selecciona tu grupo actual</option>
                  {disponibles.map(g => <option key={g.id} value={g.id}>Grupo {g.nombre}</option>)}
                </select>
                {!disponibles.length && <p>No hay grupos disponibles. Contacta con administración.</p>}
              </div>;
            })}
          </div>
          <p aria-live="polite">{pendientes.length ? `Faltan ${pendientes.length} grupos por seleccionar.` : 'Todos los grupos están seleccionados.'}</p>
        </>}
        <button className="onboarding-primary" type="submit" disabled={!valido || busy}>
          {busy ? 'Guardando…' : paso === 'grupos' ? 'Guardar y completar mi perfil' : 'Guardar y continuar'}
        </button>
      </fieldset>
    </form>}
    <button className="onboarding-logout" type="button" onClick={onLogout} disabled={busy}>Cerrar sesión y continuar más tarde</button>
  </dialog>;
}
ConfiguracionInicialModal.propTypes = { estado: PropTypes.object, error: PropTypes.string, busy: PropTypes.bool,
  onSave: PropTypes.func.isRequired, onRetry: PropTypes.func.isRequired, onLogout: PropTypes.func.isRequired };
