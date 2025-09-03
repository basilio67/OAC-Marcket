const sequelize = require('./models/index');
const User = require('./models/User');

(async () => {
  await sequelize.authenticate();

  // Atualiza ou cria o admin
  const [admin, created] = await User.findOrCreate({
    where: { email: 'zilysmith23@gmail.com' },
    defaults: {
      nome: 'Administrador',
      senha: 'basilio@1234',
      tipo: 'vendedor',
      whatsapp: '+258842168220',
      isAdmin: true
    }
  });

  if (!created) {
    await admin.update({
      isAdmin: true,
      senha: 'basilio@1234',
      whatsapp: '+258842168220'
    });
    await admin.reload(); // Garante que os dados estejam atualizados
    console.log('Admin atualizado!', admin.dataValues); // Mostra o valor atualizado
  } else {
    console.log('Admin criado!', admin.dataValues);
  }

  process.exit();
})();
