const { Model, DataTypes } = require('sequelize');
const db = require('./db');
const Key = require('./key');

class Operation extends Model { }

Operation.init({
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  data: {
    type: DataTypes.BLOB,
  },
  details: {
    type: DataTypes.TEXT,
  },
  signature: {
    type: DataTypes.BLOB,
  },
  context: {
    type: DataTypes.BLOB,
  },
}, {
  sequelize: db,
  modelName: 'operation',
});

Key.hasMany(Operation);
Operation.belongsTo(Key);

module.exports = Operation;
