const { Model, DataTypes } = require('sequelize');
const db = require('./db');

class Key extends Model { }

Key.init({
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  algorithm: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  share: {
    type: DataTypes.BLOB,
  },
  publicKey: {
    type: DataTypes.BLOB,
  },
}, {
  sequelize: db,
  modelName: 'key',
});

module.exports = Key;
