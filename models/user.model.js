module.exports = (sequelize, DataTypes) => {
  return sequelize.define('User', {
    telegram_id: { type: DataTypes.BIGINT, unique: true },
    name: DataTypes.STRING,
    username: DataTypes.STRING,
    phone: DataTypes.STRING,
    balance: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    is_admin: { type: DataTypes.BOOLEAN, defaultValue: false }
  });
};