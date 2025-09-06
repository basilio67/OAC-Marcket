const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Comment = require('../models/Comment');
const sequelize = require('../models/index');
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const nodemailer = require('nodemailer');

// Sincronize os modelos com o banco de dados
sequelize.sync({ alter: true });

// Configuração do Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage para uploads no Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'produtos_oacmarket',
        allowed_formats: ['jpg', 'jpeg', 'png']
    }
});
const upload = multer({ storage: storage });

// Middleware para verificar se é vendedor
async function requireSeller(req, res, next) {
    const user = await User.findByPk(req.session.userId);
    if (user && user.tipo === 'vendedor') {
        next();
    } else {
        res.redirect('/');
    }
}

// Middleware para verificar se é administrador
async function requireAdmin(req, res, next) {
    const user = await User.findByPk(req.session.userId);
    if (user && user.isAdmin) {
        next();
    } else {
        res.redirect('/');
    }
}

// Curtidas em memória (substitua por banco depois)
const curtidas = {}; // { [produtoId]: Set de userIds ou cookies }

// Middleware para identificar visitante por cookie
function getUserLikeId(req, res, next) {
    if (!req.cookies) req.cookies = {};
    if (!req.cookies.likeId) {
        const likeId = Math.random().toString(36).substring(2) + Date.now();
        res.cookie('likeId', likeId, { maxAge: 365*24*60*60*1000 }); // 1 ano
        req.cookies.likeId = likeId;
    }
    next();
}

// Configuração do Nodemailer (exemplo com Gmail, troque para seu provedor)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NOTIFY_EMAIL_USER,
        pass: process.env.NOTIFY_EMAIL_PASS
    }
});

// Função utilitária para enviar notificação
async function notificarVendedor(produto, assunto, mensagem) {
    if (!produto || !produto.lojaId) return;
    const loja = await Store.findByPk(produto.lojaId, {
        include: [{ model: User, as: 'vendedor' }]
    });
    if (!loja || !loja.vendedor || !loja.vendedor.email) return;
    await transporter.sendMail({
        from: process.env.NOTIFY_EMAIL_USER,
        to: loja.vendedor.email,
        subject: assunto,
        text: mensagem + `\n\nAcesse o OAC Market: https://oac-marcket.onrender.com`
    });
}

// Página inicial
router.get('/', getUserLikeId, async (req, res) => {
    // Busca os 10 produtos mais recentes
    const produtosRecentes = await Product.findAll({
        order: [['createdAt', 'DESC']],
        include: [
            {
                model: Store,
                as: 'loja'
            }
        ],
        limit: 10
    });
    const likeId = req.cookies.likeId;
    produtosRecentes.forEach(produto => {
        produto.dataValues.curtidas = produto.curtidas || 0;
        produto.dataValues.curtido = produto._curtidasSet && produto._curtidasSet.has(likeId);
    });
    res.render('home', { produtosRecentes }); // Remova accessCount
});

// Cadastro de usuário
router.get('/cadastro', (req, res) => {
    res.render('cadastro');
});

router.post('/cadastro', async (req, res) => {
    const { nome, email, senha, tipo, whatsapp } = req.body;
    try {
        await User.create({ nome, email, senha, tipo, whatsapp });
        res.redirect('/login');
    } catch (err) {
        res.render('cadastro', { erro: 'Ops! 😅 Não foi possível concluir seu cadastro. Por favor, confira os dados e tente novamente.' });
    }
});

// Login
router.get('/login', (req, res) => {
    res.render('login');
});

router.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    const user = await User.findOne({ where: { email, senha } });
    if (user) {
        console.log('isAdmin:', user.isAdmin); // Mostra o valor no terminal
        req.session.userId = user.id;
        if (user.isAdmin) {
            // Redireciona para o painel do administrador
            return res.redirect('/admin');
        }
        if (user.tipo === 'vendedor') {
            // Busca loja do vendedor
            const loja = await Store.findOne({ where: { vendedorId: user.id } });
            if (loja) {
                // Redireciona para a loja do vendedor
                return res.redirect('/loja/' + loja.id);
            } else {
                // Redireciona para criar loja
                return res.redirect('/loja/criar');
            }
        } else {
            // Comprador vai para a lista de produtos
            return res.redirect('/produtos');
        }
    } else {
        res.render('login', { erro: 'Ops! 😅 Não encontramos sua conta ou a senha está incorreta. Confira os dados e tente novamente!' });
    }
});

// Página de criação de loja (apenas vendedores cadastrados)
router.get('/loja/criar', requireSeller, async (req, res) => {
    // Se já existe loja, redireciona para ela
    const loja = await Store.findOne({ where: { vendedorId: req.session.userId } });
    if (loja) {
        return res.redirect('/loja/' + loja.id);
    }
    res.render('criar_loja');
});

router.post('/loja/criar', requireSeller, upload.single('imagemPerfil'), async (req, res) => {
    const { nome, descricao } = req.body;
    let loja = await Store.findOne({ where: { vendedorId: req.session.userId } });
    if (loja) {
        return res.redirect('/loja/' + loja.id);
    }
    const imagemPerfil = req.file ? req.file.path : '';
    loja = await Store.create({
        nome,
        descricao,
        vendedorId: req.session.userId,
        imagemPerfil
    });
    res.redirect('/loja/' + loja.id);
});

// Mensagens em memória (substitua por banco depois)
const mensagens = {};

// Página pública da loja (visualização somente)
router.get('/loja/:id', async (req, res, next) => {
    if (req.query.public === '1') {
        const loja = await Store.findByPk(req.params.id, { include: [{ model: User, as: 'vendedor' }] });
        if (!loja) return res.redirect('/');
        const produtos = await Product.findAll({ where: { lojaId: loja.id } });
        // Não mostra botões de edição/exclusão para visitantes
        return res.render('loja', { loja, produtos, mensagens: [] , visitante: true });
    }
    next();
});

// Página da loja (exibe produtos e mensagens)
router.get('/loja/:id', requireSeller, async (req, res) => {
    const loja = await Store.findByPk(req.params.id, { include: [{ model: User, as: 'vendedor' }] });
    // Só permite acesso se o vendedor for dono da loja
    if (!loja || loja.vendedorId !== req.session.userId) {
        return res.redirect('/');
    }
    const produtos = await Product.findAll({ where: { lojaId: loja.id } });
    const msgs = Array.isArray(mensagens[loja.id]) ? mensagens[loja.id] : [];
    res.render('loja', { loja, produtos, mensagens: msgs, visitante: false });
});

// Cadastro de produto (apenas vendedores cadastrados)
router.get('/loja/:id/produto/criar', requireSeller, async (req, res) => {
    const lojaId = req.params.id;
    if (!lojaId || isNaN(lojaId)) {
        // Se o id estiver vazio ou inválido, redirecione para criar loja
        return res.redirect('/loja/criar');
    }
    const loja = await Store.findByPk(lojaId);
    if (!loja || loja.vendedorId !== req.session.userId) {
        return res.redirect('/');
    }
    res.render('criar_produto', { loja });
});

router.post('/loja/:id/produto/criar', requireSeller, upload.single('imagem'), async (req, res) => {
    const lojaId = req.params.id;
    if (!lojaId || isNaN(lojaId)) {
        // Se o id estiver vazio ou inválido, redirecione para criar loja
        return res.redirect('/loja/criar');
    }
    const loja = await Store.findByPk(lojaId);
    if (!loja || loja.vendedorId !== req.session.userId) {
        return res.redirect('/');
    }
    try {
        const { nome, descricao, preco } = req.body;
        const imagem = req.file ? req.file.path : '';

        // Verifica se o arquivo existe e se o formato é permitido
        if (req.file && !['image/jpeg', 'image/png', 'image/jpg'].includes(req.file.mimetype)) {
            return res.render('criar_produto', { loja, erro: 'Olá! 😁 O formato da imagem não é suportado. Por favor, envie uma imagem JPG ou PNG para que possamos mostrar seu produto com qualidade!' });
        }

        await Product.create({
            nome,
            descricao,
            preco,
            lojaId: loja.id,
            imagem
        });
        res.redirect('/loja/' + loja.id);
    } catch (err) {
        console.error('Erro ao cadastrar produto:', err);
        res.render('criar_produto', { loja, erro: 'Poxa! 😔 Não conseguimos cadastrar seu produto agora. Tente novamente em instantes ou confira os dados informados.' });
    }
});

// Adicionar comentário (POST)
router.post('/produto/:id/comentar', async (req, res) => {
    const produtoId = req.params.id;
    const { autor, texto } = req.body;
    const comentario = await Comment.create({
        produtoId,
        autor: autor || 'Anônimo',
        texto
    });
    // Mensagem personalizada
    const produto = await Product.findByPk(produtoId);
    notificarVendedor(
        produto,
        `Novo comentário no seu produto "${produto.nome}"`,
        `Olá! Seu produto "${produto.nome}" recebeu um novo comentário de ${autor || 'Anônimo'}:\n"${texto}"\n\nVeja mais detalhes acessando sua loja no OAC Market!`
    );
    res.redirect('back');
});

// Página pública de todos os produtos (envia comentários do banco)
router.get('/produtos', getUserLikeId, async (req, res) => {
    const produtos = await Product.findAll({
        include: [
            {
                model: Store,
                as: 'loja',
                include: [
                    {
                        model: User,
                        as: 'vendedor'
                    }
                ]
            },
            {
                model: Comment,
                as: 'comentarios'
            }
        ]
    });
    const likeId = req.cookies.likeId;
    produtos.forEach(produto => {
        produto.dataValues.curtidas = produto.curtidas || 0;
        produto.dataValues.curtido = produto._curtidasSet && produto._curtidasSet.has(likeId);
    });
    res.render('produtos_publicos', { produtos });
});

// Enviar mensagem para vendedor (público, sem login)
router.post('/loja/:id/mensagem', async (req, res) => {
    const lojaId = req.params.id;
    const { texto, autor } = req.body;
    if (!mensagens[lojaId]) mensagens[lojaId] = [];
    mensagens[lojaId].push({
        autor: autor || 'Anônimo',
        texto,
        data: new Date()
    });
    res.redirect('/loja/' + lojaId);
});

// Editar loja (GET)
router.get('/loja/:id/editar', requireSeller, async (req, res) => {
    const loja = await Store.findByPk(req.params.id);
    if (!loja || loja.vendedorId !== req.session.userId) {
        return res.redirect('/');
    }
    res.render('editar_loja', { loja });
});

// Editar loja (POST)
router.post('/loja/:id/editar', requireSeller, async (req, res) => {
    const loja = await Store.findByPk(req.params.id);
    if (!loja || loja.vendedorId !== req.session.userId) {
        return res.redirect('/');
    }
    const { nome, descricao } = req.body;
    loja.nome = nome;
    loja.descricao = descricao;
    await loja.save();
    res.redirect('/loja/' + loja.id);
});

// Excluir produto (POST)
router.post('/produto/:id/excluir', requireSeller, async (req, res) => {
    const produto = await Product.findByPk(req.params.id);
    if (!produto) {
        return res.redirect('/');
    }
    // Só permite excluir se o vendedor for dono da loja do produto
    const loja = await Store.findByPk(produto.lojaId);
    if (!loja || loja.vendedorId !== req.session.userId) {
        return res.redirect('/');
    }
    await produto.destroy();
    res.redirect('/loja/' + loja.id);
});

// Página do administrador - listar todos os produtos e destacar/remover destaque
router.get('/admin', requireAdmin, async (req, res) => {
    const produtos = await Product.findAll({
        include: [
            {
                model: Store,
                as: 'loja',
                include: [
                    {
                        model: User,
                        as: 'vendedor'
                    }
                ]
            }
        ]
    });
    res.render('admin', { produtos });
});

// Destacar produto (POST) - apenas admin
router.post('/produto/:id/destaque', requireAdmin, async (req, res) => {
    const produto = await Product.findByPk(req.params.id);
    if (!produto) return res.redirect('/admin');
    produto.destaque = true;
    await produto.save();
    res.redirect('/admin');
});

// Remover destaque (POST) - apenas admin
router.post('/produto/:id/remover-destaque', requireAdmin, async (req, res) => {
    const produto = await Product.findByPk(req.params.id);
    if (!produto) return res.redirect('/admin');
    produto.destaque = false;
    await produto.save();
    res.redirect('/admin');
});

// Curtir produto
router.post('/produto/:id/curtir', getUserLikeId, async (req, res) => {
    const produtoId = req.params.id;
    const likeId = req.cookies.likeId;
    const produto = await Product.findByPk(produtoId);
    if (!produto) return res.json({ ok: false });
    if (!produto._curtidasSet) produto._curtidasSet = new Set();
    if (!produto._curtidasSet.has(likeId)) {
        produto._curtidasSet.add(likeId);
        produto.curtidas += 1;
        await produto.save();
        // Mensagem personalizada
        notificarVendedor(
            produto,
            `Seu produto "${produto.nome}" recebeu uma curtida!`,
            `Olá! Seu produto "${produto.nome}" acabou de receber uma nova curtida no OAC Market.\n\nVeja como está o interesse no seu produto acessando sua loja!`
        );
    }
    res.json({ ok: true, curtidas: produto.curtidas });
});

// Descurtir produto
router.post('/produto/:id/descurtir', getUserLikeId, async (req, res) => {
    const produtoId = req.params.id;
    const likeId = req.cookies.likeId;
    const produto = await Product.findByPk(produtoId);
    if (!produto) return res.json({ ok: false });
    if (!produto._curtidasSet) produto._curtidasSet = new Set();
    if (produto._curtidasSet.has(likeId) && produto.curtidas > 0) {
        produto._curtidasSet.delete(likeId);
        produto.curtidas -= 1;
        await produto.save();
    }
    res.json({ ok: true, curtidas: produto.curtidas });
});

// Páginas obrigatórias
router.get('/sobre', (req, res) => {
    res.render('sobre');
});
router.get('/contato', (req, res) => {
    res.render('contato');
});
router.get('/privacidade', (req, res) => {
    res.render('privacidade');
});
router.get('/artigos', (req, res) => {
    res.render('artigos');
});
router.get('/dicas', (req, res) => {
    res.render('dicas');
});
router.get('/novidades', (req, res) => {
    res.render('novidades');
});
router.get('/termos', (req, res) => {
    res.render('termos');
});

module.exports = router;
