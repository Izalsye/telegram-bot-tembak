const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('ppob', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false
});

module.exports = sequelize;