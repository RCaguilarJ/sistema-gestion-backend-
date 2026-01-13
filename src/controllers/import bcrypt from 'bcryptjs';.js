import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../models/index.js'; 


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

  
    const query = `
      SELECT 
        u.id, 
        u.nombre, 
        u.password, 
        u.role_id,
        r.nombre as role_name,
        GROUP_CONCAT(p.nombre) as permissions_string
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE u.email = ? 
      GROUP BY u.id
    `;

    const [results, metadata] = await db.sequelize.query(query, {
      replacements: [email]
    });

    if (!results || results.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = results[0]; 

   
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    const permissionsArray = user.permissions_string 
      ? user.permissions_string.split(',') 
      : [];

    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role_name, 
        permissions: permissionsArray 
      },
      process.env.JWT_SECRET || 'secreto',
      { expiresIn: '8h' }
    );

    
    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: email,
        role: user.role_name,       
        permissions: permissionsArray 
      }
    });

  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};


export const register = async (req, res) => {
  try {
    const { nombre, email, password, role } = req.body;
    const User = db.User; // Aquí sí usamos el modelo
    
    const hashedPassword = await bcrypt.hash(password, 10);

  
    
    const newUser = await User.create({
      nombre,
      email,
      password: hashedPassword,
      role: role || 'usuario', 
    });

    res.status(201).json({ message: 'Usuario creado', userId: newUser.id });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar', error: error.message });
  }
};