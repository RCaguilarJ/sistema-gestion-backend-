import db from '../models/index.js';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { ROLES, ADMIN_ROLES, MEDICAL_ROLES } from '../constants/roles.js';

const User = db.User;

const SPECIALIST_ROLES = [
    ROLES.DOCTOR,
    ROLES.NUTRI,
    ROLES.ENDOCRINOLOGO,
    ROLES.PODOLOGO,
    ROLES.PSICOLOGO,
    ROLES.PSY
];

const normalizeRole = (value) => {
    if (!value) return '';
    return value
        .toString()
        .trim()
        .toUpperCase()
        .replace('Á', 'A')
        .replace('É', 'E')
        .replace('Í', 'I')
        .replace('Ó', 'O')
        .replace('Ú', 'U');
};

const isAdminRole = (role) => ADMIN_ROLES.includes(role);
const isMedicalRole = (role) => MEDICAL_ROLES.includes(role);

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] }
        });
        res.json(users);
    } catch (error) {
        console.error("Error obteniendo usuarios:", error);
        res.status(500).json({ message: "Error al cargar el personal" });
    }
};

export const createUser = async (req, res) => {
    try {
        // 1. Limpieza de datos
        let { nombre, username, email, password, role } = req.body;
        
        // Normalizar rol a mayúsculas para coincidir con el ENUM de la BD
        // Ej: "Endocrinologo" -> "ENDOCRINOLOGO"
        if (role) {
            role = role.toUpperCase()
                .replace('Ó', 'O')
                .replace('Í', 'I')
                .replace('Á', 'A')
                .replace('É', 'E')
                .replace('Ú', 'U');
        }

        // 2. Validaciones
        const existeEmail = await User.findOne({ where: { email } });
        if (existeEmail) return res.status(400).json({ message: "El email ya está registrado" });

        const existeUser = await User.findOne({ where: { username } });
        if (existeUser) return res.status(400).json({ message: "El usuario ya existe" });

        // 3. Crear usuario
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = await User.create({
            nombre,
            username,
            email,
            password: hashedPassword,
            role,
            estatus: 'Activo'
        });

        res.status(201).json({ message: "Usuario creado con éxito", user: newUser });

    } catch (error) {
        console.error("❌ Error creando usuario:", error);
        // Mostrar el error real de la base de datos para depurar
        res.status(500).json({ message: "Error interno", error: error.message });
    }
};

// ... (Incluye aquí updateUser y deleteUser) 
// Actualizar usuario por ID
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        // Excluir password de actualización directa
        const { password, ...updateFields } = req.body;
        await user.update(updateFields);
        res.json({ message: "Usuario actualizado correctamente", user });
    } catch (error) {
        console.error("❌ Error actualizando usuario:", error);
        res.status(500).json({ message: "Error al actualizar usuario" });
    }
};
// Eliminar usuario por ID
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        await user.destroy();
        res.json({ message: "Usuario eliminado correctamente" });
    } catch (error) {
        console.error("❌ Error eliminando usuario:", error);
        res.status(500).json({ message: "Error al eliminar usuario" });
    }
};

// Obtener especialistas filtrados por rol
// - ADMIN/SUPER_ADMIN: puede ver todos o filtrar por ?role=
// - Especialistas: solo pueden ver a sus companeros del mismo rol
export const getEspecialistas = async (req, res) => {
    try {
        const requesterRole = normalizeRole(req.user?.role);
        if (!requesterRole) {
            return res.status(403).json({ message: 'Usuario no autenticado.' });
        }

        let targetRole = normalizeRole(req.query?.role);

        if (isAdminRole(requesterRole)) {
            if (targetRole && !SPECIALIST_ROLES.includes(targetRole)) {
                return res.status(400).json({ message: 'Rol de especialista invalido.' });
            }
        } else if (isMedicalRole(requesterRole)) {
            targetRole = requesterRole;
        } else {
            return res.status(403).json({ message: 'No tienes permisos para ver especialistas.' });
        }

        const where = {
            estatus: 'Activo',
            role: targetRole ? targetRole : { [Op.in]: SPECIALIST_ROLES }
        };

        const especialistas = await User.findAll({
            where,
            attributes: ['id', 'nombre', 'email', 'username', 'role', 'estatus']
        });

        res.json({ especialistas });
    } catch (error) {
        console.error('Error obteniendo especialistas:', error);
        res.status(500).json({ message: 'Error al cargar especialistas' });
    }
};
