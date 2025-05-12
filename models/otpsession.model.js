module.exports = (sequelize, DataTypes) => {
    return sequelize.define('OtpSession', {
      user_id: { type: DataTypes.INTEGER, allowNull: true }, // relasi ke User
      phone: { type: DataTypes.STRING, allowNull: false },
      auth_id: { type: DataTypes.STRING, allowNull: false },
      access_token: { type: DataTypes.TEXT },
    });
  };
  