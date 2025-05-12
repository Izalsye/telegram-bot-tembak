module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Category', {
    name: DataTypes.STRING,
    code: DataTypes.STRING,
    icon: DataTypes.STRING
  });
};