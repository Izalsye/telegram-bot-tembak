const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('u1777408_bot', 'u1777408_larva', 'vps01larva', {
  host: '185.229.118.120',
  dialect: 'mysql',
  logging: false
});

module.exports = sequelize;