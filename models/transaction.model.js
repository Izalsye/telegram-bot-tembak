module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Transaction', {
    target_number: DataTypes.STRING,
    status: DataTypes.ENUM('pending', 'success', 'failed'),
    provider_ref: DataTypes.STRING,
    price: DataTypes.DECIMAL(10, 2),
    response_data: DataTypes.JSON
  });
};