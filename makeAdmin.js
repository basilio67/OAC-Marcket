const sequelize = require('./models/index');
const User = require('./models/User');

(async () => {
  await sequelize.authenticate();
  await User.update(
    { isAdmin: true, senha: 'basilio@1234' },
    { where: { email: 'zilysmith372@gmail.com' } }
  );
  console.log('Admin atualizado!');
  process.exit();
})();
