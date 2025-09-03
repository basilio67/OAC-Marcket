const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const Product = require('./Product');

const Comment = sequelize.define('Comment', {
  autor: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Anônimo'
  },
  texto: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

Comment.belongsTo(Product, { as: 'produto', foreignKey: 'produtoId' });
Product.hasMany(Comment, { as: 'comentarios', foreignKey: 'produtoId' });

module.exports = Comment;
