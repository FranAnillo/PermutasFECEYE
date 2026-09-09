// Límite por IP compartido entre login y registro: cuenta fallos y peticiones
// en curso; los accesos correctos liberan su plaza, también detrás de un NAT.
// En varios procesos debe complementarse con un límite común en el proxy.
export function createAuthRateLimit({ windowMs = 15 * 60 * 1000, max = 20, maxEntries = 10000, now = Date.now } = {}) {
  const attempts = new Map();
  return (req, res, next) => {
    const currentTime = now();
    for (const [key, entry] of attempts) {
      if (entry.expiresAt <= currentTime) attempts.delete(key);
    }
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    let entry = attempts.get(key);
    if (!entry) {
      if (attempts.size >= maxEntries) {
        res.set('Retry-After', String(Math.ceil(windowMs / 1000)));
        return res.status(429).json({ message: 'Demasiados intentos. Inténtalo más tarde.' });
      }
      entry = { count: 0, expiresAt: currentTime + windowMs };
      attempts.set(key, entry);
    }
    if (entry.count >= max) {
      res.set('Retry-After', String(Math.ceil((entry.expiresAt - currentTime) / 1000)));
      return res.status(429).json({ message: 'Demasiados intentos. Inténtalo más tarde.' });
    }
    entry.count += 1;
    res.once('finish', () => {
      if (res.statusCode < 400) {
        entry.count -= 1;
        if (entry.count === 0 && attempts.get(key) === entry) attempts.delete(key);
      }
    });
    next();
  };
}
