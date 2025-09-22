const jwt = require('jsonwebtoken');

// Middleware para verificar token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Token de acceso requerido' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        error: 'Token inválido o expirado' 
      });
    }
    req.user = user;
    next();
  });
};

// Middleware para verificar si el usuario es admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      error: 'Acceso denegado. Se requieren permisos de administrador.' 
    });
  }
  next();
};

// Middleware de rate limiting
const rateLimit = require('express-rate-limit');

const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs: windowMs,
    max: max,
    message: {
      success: false,
      error: 'Demasiadas solicitudes desde esta IP. Intenta de nuevo más tarde.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Rate limit específico para login (más restrictivo)
const loginRateLimit = createRateLimit(15 * 60 * 1000, 5); // 5 intentos por 15 minutos

// Rate limit general
const generalRateLimit = createRateLimit(15 * 60 * 1000, 100); // 100 requests por 15 minutos

// Rate limit para exportaciones (más restrictivo)
const exportRateLimit = createRateLimit(60 * 1000, 5); // 5 exportaciones por minuto

module.exports = {
  authenticateToken,
  requireAdmin,
  loginRateLimit,
  generalRateLimit,
  exportRateLimit
};