import crypto from 'crypto';

const AMD_URL = process.env.AMD_SYNC_URL;
const AMD_SECRET = process.env.AMD_SYNC_SECRET;

function buildSignature(body) {
  return crypto.createHmac('sha256', AMD_SECRET).update(body).digest('hex');
}

async function safeFetch(path, payload) {
  if (!AMD_URL || !AMD_SECRET) {
    console.warn('Sin configuración AMD_SYNC_URL o AMD_SYNC_SECRET; se omite sincronización.');
    return null;
  }

  const fetchFn = globalThis.fetch;
  if (typeof fetchFn !== 'function') {
    throw new Error('fetch no disponible en este entorno Node.');
  }

  const body = JSON.stringify(payload);
  const response = await fetchFn(`${AMD_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Signature': buildSignature(body)
    },
    body
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Sync AMD fallo ${response.status}: ${text}`);
  }

  return response.json();
}

export async function sendPacienteToAmd(paciente) {
  return safeFetch('/sync/pacientes', paciente);
}

export async function sendCitaToAmd(cita) {
  return safeFetch('/sync/citas', cita);
}
