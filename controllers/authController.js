// controllers/authController.js
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Esta debería ser una variable de entorno secreta, pero la pondremos aquí por ahora
const JWT_SECRET = 'mi-secreto-muy-seguro-para-tokens'; 

// --- REGISTRO DE NUEVO USUARIO ---
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1. Verificamos si el usuario ya existe
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'El correo ya está registrado.' });
    }

    // 2. Creamos el usuario (el hook en User.js encriptará la contraseña)
    const newUser = await User.create({
      username,
      email,
      password,
    });

    // 3. Creamos un token para el nuevo usuario
    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, {
      expiresIn: '1h', // El token expira en 1 hora
    });

    // 4. Enviamos la respuesta
    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      },
    });

  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// --- LOGIN DE USUARIO EXISTENTE ---
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Buscamos al usuario por email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // 2. Comparamos la contraseña enviada con la encriptada en la BD
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // 3. Si todo está bien, creamos un token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '1h',
    });

    // 4. Enviamos la respuesta
    res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });

  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};