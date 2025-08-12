const { Sequelize } = require('sequelize');

// Use variáveis de ambiente para produção
const dbName = process.env.DB_NAME || 'oacmarket';
const dbUser = process.env.DB_USER || 'postgres';
const dbPass = process.env.DB_PASS || 'basilio@123';
const dbHost = process.env.DB_HOST || 'localhost';

const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  dialect: 'postgres'
});

module.exports = sequelize;
