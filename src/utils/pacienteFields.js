const normalizeOptionalString = (value) => {
  if (value === null || value === undefined) return null;
  const text = value.toString().trim();
  return text.length > 0 ? text : null;
};

const normalizeLookupValue = (value, dictionary) => {
  const text = normalizeOptionalString(value);
  if (!text) return null;

  const lookupKey = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return dictionary[lookupKey] || text;
};

const ESTADO_PAGO_MAP = {
  pagado: "Pagado",
  pagada: "Pagado",
  "si": "Pagado",
  "sí": "Pagado",
  "true": "Pagado",
  "1": "Pagado",
  pendiente: "Pendiente",
  "no pagada": "Pendiente",
  "no pagado": "Pendiente",
  "no": "Pendiente",
  "false": "Pendiente",
  "0": "Pendiente",
  vencido: "Vencido",
  atrasado: "Atrasado",
  parcial: "Parcial",
  exento: "Exento",
  cancelado: "Cancelado",
  moroso: "Moroso",
};

export const normalizeTipoMembresia = (value) => normalizeOptionalString(value);

export const normalizeEstadoPago = (value) =>
  normalizeLookupValue(value, ESTADO_PAGO_MAP);

export const normalizeTallaInput = (value) =>
  value === undefined ? undefined : normalizeOptionalString(value);

export { normalizeOptionalString };
