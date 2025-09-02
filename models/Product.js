const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const Store = require('./Store');

const Product = sequelize.define('Product', {
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descricao: {
    type: DataTypes.STRING,
    allowNull: false
  },
  preco: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  imagem: {
    type: DataTypes.STRING
  },
  destaque: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

// Associação correta
Product.belongsTo(Store, { as: 'loja', foreignKey: 'lojaId' });
Store.hasMany(Product, { as: 'produtos', foreignKey: 'lojaId' });

module.exports = Product;
