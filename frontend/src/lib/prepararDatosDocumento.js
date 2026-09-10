export function prepararDatosDocumento(grupo, primerFirmante) {
  const usuariosOriginales = grupo?.usuarios || [];
  if (primerFirmante && !usuariosOriginales.some(usuario => usuario.uvus === primerFirmante)) {
    throw new Error("El primer firmante no pertenece al documento.");
  }
  const primero = usuariosOriginales.find((usuario) => usuario.uvus === primerFirmante) || usuariosOriginales[0];
  const segundo = usuariosOriginales.find((usuario) => usuario.uvus !== primero?.uvus);
  const usuariosOrdenados = [primero, segundo].filter(Boolean);
  const grupoDe = (permuta, uvus) => {
    if (!uvus) return undefined;
    if (permuta.usuario_1_uvus === uvus) return permuta.usuario_1_grupo;
    if (permuta.usuario_2_uvus === uvus) return permuta.usuario_2_grupo;
    return undefined;
  };
  const permutasOrdenadas = (grupo?.permutas || []).map((permuta) => {
    const grupo1 = grupoDe(permuta, usuariosOrdenados[0]?.uvus);
    const grupo2 = grupoDe(permuta, usuariosOrdenados[1]?.uvus);
    return {
      ...permuta,
      grupo_actual_1: grupo1,
      grupo_nuevo_1: grupo2,
      grupo_actual_2: grupo2,
      grupo_nuevo_2: grupo1,
    };
  });
  return { usuarios: usuariosOrdenados, permutas: permutasOrdenadas };
}

const tieneValor = (value) => value !== null && value !== undefined && String(value).trim() !== "";

export function validarDatosSistemaDocumento({ usuarios, permutas }) {
  const faltantes = [];
  if (usuarios.length !== 2) faltantes.push("los dos estudiantes");
  if (new Set(usuarios.map(u => u.uvus)).size !== 2 || usuarios.some(u => !tieneValor(u.uvus))) faltantes.push("identidad de los dos estudiantes");
  usuarios.forEach((usuario, index) => {
    const numero = index + 1;
    if (!tieneValor(usuario?.correo)) faltantes.push(`correo del estudiante ${numero}`);
    if (!tieneValor(usuario?.estudio)) faltantes.push(`titulación del estudiante ${numero}`);
  });
  if (permutas.length === 0) faltantes.push("al menos una asignatura");
  if (permutas.length > 10) faltantes.push("un máximo de 10 cambios");
  permutas.forEach((permuta, index) => {
    const fila = index + 1;
    if (!tieneValor(permuta?.nombre_asignatura)) faltantes.push(`asignatura de la fila ${fila}`);
    if (!tieneValor(permuta?.curso_asignatura)) faltantes.push(`curso de la fila ${fila}`);
    if (!tieneValor(permuta?.grupo_actual_1)) faltantes.push(`grupo actual de la fila ${fila}`);
    if (!tieneValor(permuta?.grupo_nuevo_1)) faltantes.push(`grupo nuevo de la fila ${fila}`);
    if (!permuta.usuario_1_uvus || !permuta.usuario_2_uvus || permuta.usuario_1_uvus === permuta.usuario_2_uvus ||
        !usuarios.some(u => u.uvus === permuta.usuario_1_uvus) || !usuarios.some(u => u.uvus === permuta.usuario_2_uvus)) {
      faltantes.push(`identidad de los participantes de la fila ${fila}`);
    }
    if (tieneValor(permuta.grupo_actual_1) && String(permuta.grupo_actual_1) === String(permuta.grupo_nuevo_1)) {
      faltantes.push(`grupos distintos en la fila ${fila}`);
    }
  });
  return [...new Set(faltantes)];
}
