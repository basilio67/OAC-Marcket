const express = require('express');
const session = require('express-session');
const path = require('path');
const routes = require('./routes/index');
// NÃO use mongoose aqui!

const app = express();

// Configuração do EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'oacmarketsecret',
    resave: false,
    saveUninitialized: false,
}));

// Rotas
app.use('/', routes);

// Inicialização do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
