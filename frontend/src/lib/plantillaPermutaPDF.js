import { rgb } from "pdf-lib";

const SCALE = 140 / 72;
const REFERENCE_HEIGHT = 841.92;

const box = (pageHeight, px1, py1, px2, py2, inset = 2) => ({
  x: px1 / SCALE + inset,
  y: pageHeight - py2 / SCALE + inset,
  width: (px2 - px1) / SCALE - inset * 2,
  height: (py2 - py1) / SCALE - inset * 2,
});

const fieldDefinitions = () => {
  const fields = [{ name: "EXPEDIENTE", rect: [868, 163, 1103, 229], size: 8, maxLength: 40 }];
  const personal = {
    1: {
      APELLIDOS: [165, 292, 592, 319], NOMBRE: [690, 292, 1103, 319],
      DNI: [140, 321, 322, 347], DOMICILIO: [435, 321, 1103, 347],
      COD_POSTAL: [135, 348, 240, 374], LOCALIDAD: [360, 348, 783, 374],
      PROVINCIA: [910, 348, 1103, 374], EMAIL: [140, 376, 592, 401],
      TELEFONO: [700, 376, 1103, 401], TITULACION: [180, 403, 703, 430],
      CURSO_SOLICITANTE: [780, 403, 1103, 430],
    },
    2: {
      APELLIDOS: [165, 746, 600, 771], NOMBRE: [690, 746, 1103, 771],
      DNI: [140, 774, 326, 799], DOMICILIO: [435, 774, 1103, 799],
      COD_POSTAL: [135, 801, 243, 827], LOCALIDAD: [360, 801, 794, 827],
      PROVINCIA: [910, 801, 1103, 827], EMAIL: [140, 829, 600, 854],
      TELEFONO: [700, 829, 1103, 854], TITULACION: [180, 856, 713, 882],
      CURSO_SOLICITANTE: [780, 856, 1103, 882],
    },
  };
  const maxLengths = {
    APELLIDOS: 120, NOMBRE: 80, DNI: 12, DOMICILIO: 150,
    COD_POSTAL: 5, LOCALIDAD: 100, PROVINCIA: 100, EMAIL: 254,
    TELEFONO: 20, TITULACION: 150, CURSO_SOLICITANTE: 30,
  };
  Object.entries(personal).forEach(([student, entries]) => {
    Object.entries(entries).forEach(([key, rect]) => fields.push({
      name: `${key}_${student}`,
      rect,
      size: key === "TITULACION" ? 6.5 : 7,
      maxLength: maxLengths[key],
    }));
  });

  const columns = [
    [67, 325], [325, 407], [407, 500], [500, 587],
    [587, 844], [844, 927], [927, 1019], [1019, 1105],
  ];
  const rowBounds = {
    1: [486, 527, 567, 608, 648, 690],
    2: [939, 980, 1020, 1061, 1101, 1143],
  };
  Object.entries(rowBounds).forEach(([student, ys]) => {
    let row = 1;
    for (let side = 0; side < 2; side += 1) {
      for (let visualRow = 0; visualRow < 5; visualRow += 1) {
        const names = ["ASIGNATURA", "CURSO", "GRUPO_ACTUAL", "GRUPO_NUEVO"];
        names.forEach((key, column) => fields.push({
          name: `${key}_${student}_${row}`,
          rect: [columns[side * 4 + column][0], ys[visualRow], columns[side * 4 + column][1], ys[visualRow + 1]],
          size: key === "ASIGNATURA" ? 5.5 : 7,
          maxLength: key === "ASIGNATURA" ? 150 : 15,
        }));
        row += 1;
      }
    }
  });

  fields.push(
    { name: "LOCALIDAD_FECHA", rect: [90, 1444, 474, 1474], size: 7, maxLength: 100 },
    { name: "DIA", rect: [500, 1444, 553, 1474], size: 7, maxLength: 2 },
    { name: "MES", rect: [584, 1444, 868, 1474], size: 7, maxLength: 20 },
    { name: "ANIO", rect: [897, 1444, 958, 1474], size: 7, maxLength: 2 },
  );
  return fields;
};

export const CAMPOS_PLANTILLA_PERMUTA = fieldDefinitions();

export function asegurarCamposPlantillaPermuta(pdfDoc) {
  const form = pdfDoc.getForm();
  const present = new Set(form.getFields().map((field) => field.getName()));
  const missing = CAMPOS_PLANTILLA_PERMUTA.filter(({ name }) => !present.has(name));

  if (missing.length === 0) return form;
  if (present.size > 0) {
    throw new Error("La plantilla subida no es compatible con el formulario FCEYE 2026-27");
  }

  const page = pdfDoc.getPages()[0];
  const pageHeight = page.getHeight() || REFERENCE_HEIGHT;
  CAMPOS_PLANTILLA_PERMUTA.forEach(({ name, rect, size, maxLength }) => {
    const field = form.createTextField(name);
    field.setMaxLength(maxLength);
    field.addToPage(page, {
      ...box(pageHeight, ...rect),
      backgroundColor: undefined,
      borderColor: undefined,
      borderWidth: 0,
      fontSize: size,
      textColor: rgb(0, 0, 0),
    });
  });
  return form;
}
