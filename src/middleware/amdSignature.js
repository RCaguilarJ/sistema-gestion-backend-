import crypto from 'crypto';

const AMD_SECRET = process.env.AMD_SYNC_SECRET;

function timingSafeCompare(a = '', b = '') {
  try {
    const aBuf = Buffer.from(a, 'hex');
    const bBuf = Buffer.from(b, 'hex');

    if (aBuf.length !== bBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(aBuf, bBuf);
  } catch (err) {
    return false;
  }
}

export function verifyAmdSignature(req, res, next) {
  if (!AMD_SECRET) {
    console.error('AMD_SYNC_SECRET no está configurado.');
    return res.status(503).json({ message: 'Sin configuración de sincronización.' });
  }

  const signature = req.headers['x-signature'];
  if (!signature) {
    return res.status(401).json({ message: 'Falta firma AMD.' });
  }

  const payload = req.rawBody ?? JSON.stringify(req.body ?? {});
  const computed = crypto.createHmac('sha256', AMD_SECRET).update(payload).digest('hex');

  if (!timingSafeCompare(signature, computed)) {
    return res.status(401).json({ message: 'Firma AMD no válida.' });
  }

  return next();
}
