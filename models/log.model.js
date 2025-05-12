module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Log', {
    command: DataTypes.TEXT,
    response: DataTypes.TEXT
  });
};