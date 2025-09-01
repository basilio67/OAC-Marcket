const { Sequelize } = require('sequelize');

// Use variáveis de ambiente para produção
const dbName = process.env.DB_NAME || 'neondb';
const dbUser = process.env.DB_USER || 'neondb_owner';
const dbPass = process.env.DB_PASS || 'npg_YwoI68WyVEjO';
const dbHost = process.env.DB_HOST || 'ep-twilight-meadow-afj0soew-pooler.c-2.us-west-2.aws.neon.tech';

const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  dialect: 'postgres',
  dialectOptions: {
        ssl: {
              require: true,
                    rejectUnauthorized: false
                        }
                          }
                          });

module.exports = sequelize;
