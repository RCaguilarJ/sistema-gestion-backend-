import { Op } from 'sequelize';
import Notification from '../models/Notification.js';

function buildNotificationFilters(role) {
  return {
    leido: false,
    [Op.and]: [
      {
        [Op.or]: [
          { rol_destino: null },
          { rol_destino: role }
        ]
      },
      {
        [Op.or]: [
          { especialidad_destino: null },
          { especialidad_destino: role }
        ]
      }
    ]
  };
}

async function fetchNotifications(role) {
  return Notification.findAll({
    where: buildNotificationFilters(role),
    order: [['creado_en', 'DESC']],
    limit: 25
  });
}

export const pollNotifications = async (req, res) => {
  try {
    if (!req.user?.role) {
      return res.status(401).json({ message: 'Usuario sin rol.' });
    }

    const notifications = await fetchNotifications(req.user.role);
    res.json({ notifications });
  } catch (error) {
    console.error('Error poll notifications:', error);
    res.status(500).json({ message: 'Error al obtener notificaciones', error: error.message });
  }
};

export const streamNotifications = async (req, res) => {
  if (!req.user?.role) {
    res.status(401).json({ message: 'Usuario sin rol.' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const pushData = async () => {
    try {
      const notifications = await fetchNotifications(req.user.role);
      res.write(`data: ${JSON.stringify({ notifications })}\n\n`);
    } catch (error) {
      console.error('Error stream notifications:', error);
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'Error obteniendo notificaciones' })}\n\n`);
    }
  };

  const heartbeat = setInterval(() => {
    res.write(':heartbeat\n\n');
  }, 25000);

  const pollInterval = setInterval(pushData, 15000);
  pushData();

  req.on('close', () => {
    clearInterval(pollInterval);
    clearInterval(heartbeat);
    res.end();
  });
};

export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user?.role) {
      return res.status(401).json({ message: 'Usuario sin rol.' });
    }

    const notification = await Notification.findByPk(id);
    if (!notification) {
      return res.status(404).json({ message: 'Notificación no encontrada.' });
    }

    notification.leido = true;
    await notification.save();

    res.json({ message: 'Notificación marcada como leída.' });
  } catch (error) {
    console.error('Error marcar notificación:', error);
    res.status(500).json({ message: 'Error al actualizar notificación', error: error.message });
  }
};
