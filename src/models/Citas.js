export default (sequelize, DataTypes) => {
  const Cita = sequelize.define(
    "Cita",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      usuario_id: DataTypes.INTEGER,
      medico_id: DataTypes.INTEGER,
      nombre: DataTypes.STRING,
      email: DataTypes.STRING,
      telefono: DataTypes.STRING,
      especialidad: DataTypes.STRING,
      fecha_cita: DataTypes.DATE,
      descripcion: DataTypes.TEXT,
      estado: DataTypes.STRING,
      fecha_registro: DataTypes.DATE,
      fecha_actualizacion: DataTypes.DATE,
    },
    {
      tableName: "citas",     // 🔴 AQUÍ VA EL NOMBRE REAL DE LA TABLA
      timestamps: false,      // porque YA tienes fecha_registro / actualización
    }
  );

  return Cita;
};
