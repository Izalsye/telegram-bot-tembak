const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('u1777408_bot', 'u1777408_larva', 'vps01larva', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false
});

module.exports = sequelize;