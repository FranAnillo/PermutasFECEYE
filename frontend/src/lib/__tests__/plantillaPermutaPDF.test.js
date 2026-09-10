import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  asegurarCamposPlantillaPermuta,
  CAMPOS_PLANTILLA_PERMUTA,
} from "../plantillaPermutaPDF.js";

describe("asegurarCamposPlantillaPermuta", () => {
  it("convierte una plantilla oficial sin campos en un formulario rellenable", async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([595.28, 841.89]);

    const form = asegurarCamposPlantillaPermuta(pdfDoc);

    expect(form.getFields()).toHaveLength(107);
    expect(form.getFields().map((field) => field.getName())).toEqual(
      expect.arrayContaining(CAMPOS_PLANTILLA_PERMUTA.map(({ name }) => name)),
    );
    expect(() => asegurarCamposPlantillaPermuta(pdfDoc)).not.toThrow();
    expect(form.getFields()).toHaveLength(107);
  });

  it("rechaza una plantilla distinta antes de generar un PDF incompleto", async () => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    pdfDoc.getForm().createTextField("CAMPO_DESCONOCIDO").addToPage(page, {
      x: 10,
      y: 10,
      width: 100,
      height: 20,
    });

    expect(() => asegurarCamposPlantillaPermuta(pdfDoc)).toThrow(
      "La plantilla subida no es compatible con el formulario FCEYE 2026-27",
    );
  });
});
