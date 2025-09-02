const sequelize = require('./models/index');
const User = require('./models/User');

(async () => {
  await sequelize.authenticate();

  // Atualiza ou cria o admin
  const [admin, created] = await User.findOrCreate({
    where: { email: 'zilysmith372@gmail.com' },
    defaults: {
      nome: 'Administrador',
      senha: 'basilio@1234',
      tipo: 'vendedor',
      whatsapp: '',
      isAdmin: true
    }
  });

  if (!created) {
    await admin.update({
      isAdmin: true,
      senha: 'basilio@1234'
    });
    console.log('Admin atualizado!');
  } else {
    console.log('Admin criado!');
  }

  process.exit();
})();
