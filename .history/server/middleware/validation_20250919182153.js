const { body, validationResult } = require('express-validator');

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Errores de validación',
      details: errors.array()
    });
  }
  next();
};

// Validaciones para registro de usuario
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Número de teléfono inválido'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  handleValidationErrors
];

// Validaciones para login
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('password')
    .optional()
    .isLength({ min: 1 })
    .withMessage('Contraseña requerida'),
  handleValidationErrors
];

// Validaciones para datos de asistente
const validateAttendeeData = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('dni')
    .matches(/^[0-9]{7,8}$/)
    .withMessage('DNI debe tener 7 u 8 dígitos'),
  body('phone')
    .matches(/^[\+]?[0-9]{8,15}$/)
    .withMessage('Teléfono debe tener entre 8 y 15 dígitos'),
  handleValidationErrors
];

// Validación para crear eventos
const validateEventCreation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('El nombre del evento debe tener entre 3 y 100 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede superar los 500 caracteres'),
  body('date')
    .isISO8601()
    .withMessage('Fecha inválida')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('La fecha del evento debe ser futura');
      }
      return true;
    }),
  body('location')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('La ubicación debe tener entre 5 y 200 caracteres'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número positivo'),
  body('total_tickets')
    .isInt({ min: 1, max: 10000 })
    .withMessage('El total de entradas debe estar entre 1 y 10000'),
  handleValidationErrors
];

// Sanitización de datos de entrada
const sanitizeInput = (req, res, next) => {
  // Remover propiedades peligrosas
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  
  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    for (const key of dangerousKeys) {
      delete obj[key];
    }
    
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Escapar caracteres HTML básicos
        obj[key] = obj[key]
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
      } else if (typeof obj[key] === 'object') {
        sanitizeObject(obj[key]);
      }
    }
  };
  
  sanitizeObject(req.body);
  sanitizeObject(req.query);
  next();
};

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateAttendeeData,
  validateEventCreation,
  sanitizeInput,
  handleValidationErrors
};