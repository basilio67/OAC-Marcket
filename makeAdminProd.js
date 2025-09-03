const sequelize = require('./models/index');
const User = require('./models/User');

(async () => {
  await sequelize.authenticate();

  // Atualiza o admin pelo email e senha exatos
  const admin = await User.findOne({
    where: { email: 'zilysmith23@gmail.com', senha: 'basilio@1234' }
  });

  if (admin) {
    await admin.update({
      isAdmin: true,
      whatsapp: '+258842168220'
    });
    await admin.reload();
    console.log('Admin atualizado!', admin.dataValues);
  } else {
    // Se não existe, cria
    const novoAdmin = await User.create({
      nome: 'Administrador',
      email: 'zilysmith23@gmail.com',
      senha: 'basilio@1234',
      tipo: 'vendedor',
      whatsapp: '+258842168220',
      isAdmin: true
    });
    console.log('Admin criado!', novoAdmin.dataValues);
  }

  process.exit();
})();
