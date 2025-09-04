const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const User = require('./User');

const Store = sequelize.define('Store', {
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descricao: {
    type: DataTypes.STRING,
    allowNull: false
  },
  imagemPerfil: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

// Associação correta
Store.belongsTo(User, { as: 'vendedor', foreignKey: 'vendedorId' });
User.hasMany(Store, { as: 'lojas', foreignKey: 'vendedorId' });

module.exports = Store;
