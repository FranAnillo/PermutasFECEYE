export const validarDNI = (value) => {
  const dniRegex = /^[0-9]{8}$/;
  if (!value) return "El DNI es obligatorio";
  if (!dniRegex.test(value)) return "El DNI debe tener 8 números";
  return "";
};
export const validarLetraDNI = (value) => {
  const letraRegex = /^[A-Z]$/;
  if (!value) return "La letra es obligatoria";
  if (!letraRegex.test(value)) return "Debe ser una letra mayúscula";
  return "";
};
export const validarCodigoPostal = (value) => {
  const cpRegex = /^[0-9]{5}$/;
  if (!value) return "El código postal es obligatorio";
  if (!cpRegex.test(value)) return "El código postal debe tener 5 números";
  return "";
};

export const validarTelefono = (value) => {
  const telefonoRegex = /^[0-9]{9}$/;
  if (!value) return "El teléfono es obligatorio";
  if (!telefonoRegex.test(value)) return "El teléfono debe tener 9 números";
  return "";
};

export const validarCampoObligatorio = (value, campo) => {
  if (!value.trim()) return `El campo ${campo} es obligatorio`;
  return "";
};
