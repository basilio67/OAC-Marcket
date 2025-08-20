const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Store = require('../models/Store');
const Product = require('../models/Product');
const sequelize = require('../models/index');
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

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

// Página inicial
router.get('/', (req, res) => {
    res.render('home');
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
        res.render('cadastro', { erro: 'Erro ao cadastrar. Tente novamente.' });
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
        req.session.userId = user.id;
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
        res.render('login', { erro: 'Usuário ou senha inválidos.' });
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

router.post('/loja/criar', requireSeller, async (req, res) => {
    const { nome, descricao } = req.body;
    // Se já existe loja, redireciona para ela
    let loja = await Store.findOne({ where: { vendedorId: req.session.userId } });
    if (loja) {
        return res.redirect('/loja/' + loja.id);
    }
    loja = await Store.create({
        nome,
        descricao,
        vendedorId: req.session.userId,
    });
    res.redirect('/loja/' + loja.id);
});

// Mensagens em memória (substitua por banco depois)
const mensagens = {};

// Página da loja (exibe produtos e mensagens)
router.get('/loja/:id', requireSeller, async (req, res) => {
    const loja = await Store.findByPk(req.params.id, { include: [{ model: User, as: 'vendedor' }] });
    // Só permite acesso se o vendedor for dono da loja
    if (!loja || loja.vendedorId !== req.session.userId) {
        return res.redirect('/');
    }
    const produtos = await Product.findAll({ where: { lojaId: loja.id } });
    const msgs = mensagens[loja.id] || [];
    res.render('loja', { loja, produtos, mensagens: msgs });
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
        await Product.create({
            nome,
            descricao,
            preco,
            lojaId: loja.id,
            imagem
        });
        res.redirect('/loja/' + loja.id);
    } catch (err) {
        console.error('Erro ao cadastrar produto:', err); // Adicionado log detalhado
        res.render('criar_produto', { loja, erro: 'Erro ao cadastrar produto: ' + err.message });
    }
});

// Página pública de todos os produtos
router.get('/produtos', async (req, res) => {
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
