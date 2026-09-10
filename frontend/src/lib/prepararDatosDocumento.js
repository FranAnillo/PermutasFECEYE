export function prepararDatosDocumento(grupo, primerFirmante) {
  const usuariosOriginales = grupo?.usuarios || [];
  const primero = usuariosOriginales.find((usuario) => usuario.uvus === primerFirmante) || usuariosOriginales[0];
  const segundo = usuariosOriginales.find((usuario) => usuario.uvus !== primero?.uvus);
  const usuariosOrdenados = [primero, segundo].filter(Boolean);
  const grupoDe = (permuta, uvus) => permuta.usuario_1_uvus === uvus
    ? permuta.usuario_1_grupo : permuta.usuario_2_grupo;
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
