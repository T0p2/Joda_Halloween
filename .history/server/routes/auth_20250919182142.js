const express = require('express');
const { getDatabase } = require('../database/setup');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');
const { authenticateToken, loginRateLimit } = require('../middleware/auth');

const router = express.Router();

// Register user
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const { email, name, phone, password } = req.body;
    const db = getDatabase();

    // Check if user already exists
    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ success: false, error: 'Error de base de datos' });
      }

      if (user) {
        return res.status(400).json({ success: false, error: 'El usuario ya existe' });
      }

      // Hash password if provided
      let passwordHash = null;
      if (password) {
        passwordHash = await bcrypt.hash(password, 10);
      }

      // Create new user
      db.run(
        'INSERT INTO users (email, name, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
        [email, name, phone, passwordHash, 'user'],
        function(err) {
          if (err) {
            return res.status(500).json({ success: false, error: 'Error al crear usuario' });
          }

          const token = jwt.sign(
            { userId: this.lastID, email, role: 'user' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
          );

          res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente',
            token,
            user: { id: this.lastID, email, name, phone, role: 'user' }
          });
        }
      );
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// Login user
router.post('/login', loginRateLimit, validateUserLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = getDatabase();

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ success: false, error: 'Error de base de datos' });
      }

      if (!user) {
        return res.status(400).json({ success: false, error: 'Email o contraseña incorrectos' });
      }

      // Check password if user has one
      if (user.password_hash) {
        if (!password) {
          return res.status(400).json({ success: false, error: 'Contraseña requerida' });
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
          return res.status(400).json({ success: false, error: 'Email o contraseña incorrectos' });
        }
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role || 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: 'Inicio de sesión exitoso',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role || 'user'
        }
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();

    db.get('SELECT id, email, name, phone, role, created_at FROM users WHERE id = ?', 
      [req.user.userId], (err, user) => {
        if (err) {
          return res.status(500).json({ success: false, error: 'Error de base de datos' });
        }

        if (!user) {
          return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        }

        res.json({ 
          success: true, 
          user: {
            ...user,
            role: user.role || 'user'
          }
        });
      });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// Verify token endpoint
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ 
    success: true, 
    valid: true, 
    user: { 
      id: req.user.userId, 
      email: req.user.email, 
      role: req.user.role || 'user' 
    } 
  });
});

module.exports = router;
