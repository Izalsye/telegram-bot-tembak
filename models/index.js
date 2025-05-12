const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

const User = require('./user.model')(sequelize, DataTypes);
const Category = require('./category.model')(sequelize, DataTypes);
const Product = require('./product.model')(sequelize, DataTypes);
const Transaction = require('./transaction.model')(sequelize, DataTypes);
const Topup = require('./topup.model')(sequelize, DataTypes);
const ManualProductSetting = require('./manualProductSetting.model')(sequelize, DataTypes);
const Log = require('./log.model')(sequelize, DataTypes);
const OtpSession = require('./otpsession.model')(sequelize, DataTypes);


Product.belongsTo(Category, { foreignKey: 'category_id' });
Transaction.belongsTo(User, { foreignKey: 'user_id' });
Transaction.belongsTo(Product, { foreignKey: 'product_id' });
Topup.belongsTo(User, { foreignKey: 'user_id' });
ManualProductSetting.belongsTo(Product, { foreignKey: 'product_id' });
Log.belongsTo(User, { foreignKey: 'user_id' });
OtpSession.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});
User.hasMany(OtpSession, {
  foreignKey: 'user_id',
  as: 'otp_sessions',
});


module.exports = {
  sequelize,
  User,
  Category,
  Product,
  Transaction,
  Topup,
  ManualProductSetting,
  Log,
  OtpSession,
};