import { API_URL } from '../lib/methodAPIs';
async function request(body) {
  const response = await fetch(`${API_URL}/api/v1/usuario/configuracionInicial`, {
    method: body ? 'POST' : 'GET', credentials: 'include',
    ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'No se ha podido guardar tu configuración.');
  if (!['grado','asignaturas','grupos','completo'].includes(data.paso) || data.completo !== (data.paso === 'completo')) {
    throw new Error('No se ha podido comprobar tu perfil. Inténtalo de nuevo.');
  }
  return data;
}
export const obtenerConfiguracionInicial = () => request();
export const guardarConfiguracionInicial = data => request(data);
