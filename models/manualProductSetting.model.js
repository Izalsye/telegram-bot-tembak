module.exports = (sequelize, DataTypes) => {
  return sequelize.define('ManualProductSetting', {
    stock: DataTypes.INTEGER,
    auto_response: DataTypes.TEXT
  });
};