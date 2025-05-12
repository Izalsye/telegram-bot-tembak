module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Product', {
    name: DataTypes.STRING,
    alias: DataTypes.STRING,
    code: DataTypes.STRING,
    price: DataTypes.DECIMAL(10, 2),
    base_price: DataTypes.DECIMAL(10, 2),
    provider: DataTypes.ENUM('digiflazz', 'manual'),
    brand: DataTypes.STRING,  // Menambahkan kolom brand
    deskripsi: DataTypes.TEXT,
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    otp: { type: DataTypes.BOOLEAN, defaultValue: true },
    metode: DataTypes.TEXT,
  });
};
