module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Topup', {
    amount: DataTypes.DECIMAL(10, 2),
    method: DataTypes.STRING,
    status: DataTypes.ENUM('pending', 'success', 'failed')
  });
};