const today = new Date();
const monthNames = [
  "ENERO",
  "FEBRERO",
  "MARZO",
  "ABRIL",
  "MAYO",
  "JUNIO",
  "JULIO",
  "AGOSTO",
  "SEPTIEMBRE",
  "OCTUBRE",
  "NOVIEMBRE",
  "DICIEMBRE",
];
export const dayValue = String(today.getDate()).padStart(2, "0");
export const yearValue = today.getFullYear().toString();
export const monthValue = monthNames[today.getMonth()];