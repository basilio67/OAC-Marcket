# Como resolver erro de conexão recusada

1. Certifique-se de que o **PostgreSQL** está rodando localmente.
   - Instale o PostgreSQL: https://www.postgresql.org/download/
   - Crie um banco de dados chamado `oacmarket` (ou outro nome, mas ajuste na configuração do projeto).
   - Anote usuário, senha, host e porta do seu PostgreSQL.

2. Instale as dependências do projeto (apenas na primeira vez ou se faltar algo):
   ```
   npm install
   ```
   > **Importante:** Para usar PostgreSQL, instale também:
   ```
   npm install sequelize pg pg-hstore
   ```

3. Configure a conexão com o PostgreSQL no seu projeto.
   - Altere o código para usar Sequelize e PostgreSQL (veja documentação do [Sequelize](https://sequelize.org/)).
   - Exemplo de configuração:
     ```js
     // models/index.js
     const { Sequelize } = require('sequelize');
     const sequelize = new Sequelize('oacmarket', 'usuario', 'senha', {
       host: 'localhost',
       dialect: 'postgres'
     });
     module.exports = sequelize;
     ```
   - Atualize os modelos para Sequelize.

4. Certifique-se de que existe a pasta para uploads de imagens:
   ```
   mkdir -p public/uploads
   ```

5. No terminal, dentro da pasta do projeto, execute:
   ```
   node server.js
   ```

6. Verifique se aparece a mensagem:
   ```
   Servidor rodando em http://localhost:3000
   ```

7. Só depois disso acesse no navegador:
   ```
   http://localhost:3000/produtos
   ```

Se aparecer algum erro no terminal, copie e envie aqui para que eu possa ajudar a resolver.

> **Nota:** O projeto original está configurado para MongoDB. Para usar PostgreSQL, será necessário adaptar os modelos e rotas para Sequelize/PostgreSQL.

---

## Como testar o projeto

1. Certifique-se de que o PostgreSQL está rodando e o banco de dados foi criado.
2. Execute o comando abaixo para sincronizar os modelos com o banco de dados (as tabelas serão criadas automaticamente):
   ```
   node server.js
   ```
   > O Sequelize criará as tabelas se ainda não existirem.

3. No navegador, acesse:
   ```
   http://localhost:3000/
   ```
4. Teste os fluxos principais:
   - Cadastro de usuário (como vendedor e comprador)
   - Login
   - Criação de loja (como vendedor)
   - Cadastro de produto (com imagem)
   - Visualização de produtos públicos
   - Envio de mensagens para lojas

5. Se ocorrer algum erro, verifique o terminal e revise as configurações do banco de dados.

Pronto! O projeto estará funcionando com PostgreSQL.

---

# Como colocar o site na internet (deploy)

## Deploy no Render (Node.js + PostgreSQL)

1. **Crie uma conta em [render.com](https://render.com/).**

2. **Suba seu projeto para o GitHub.**

3. **No Render, clique em "New Web Service" e conecte seu repositório.**

4. **Configure as variáveis de ambiente:**
   - `DB_NAME`
   - `DB_USER`
   - `DB_PASS`
   - `DB_HOST`
   - (Adicione outras se necessário, como `PORT`)

5. **Configure o comando de start:**
   ```
   node server.js
   ```

6. **Garanta que a pasta `public/uploads` existe.**
   - No Render, arquivos enviados para a pasta `public/uploads` podem ser apagados após reinício. Para produção, use um serviço externo de armazenamento (ex: AWS S3) para uploads persistentes.

7. **Finalize e aguarde o deploy.**
   - O Render fornecerá uma URL pública para seu site.

---

## Como preencher os dados do Web Service no Render

1. **Nome:**  
   Escolha um nome para o serviço (ex: `oac-market`).

2. **Branch:**  
   Selecione `main` (ou a branch principal do seu repositório).

3. **Build Command:**  
   ```
   npm install
   ```

4. **Start Command:**  
   ```
   node server.js
   ```

5. **Root Directory:**  
   Deixe em branco se o arquivo `server.js` está na raiz do projeto.  
   (Se estiver em uma subpasta, informe o caminho relativo.)

6. **Environment:**  
   Escolha `Node`.

7. **Configure as variáveis de ambiente:**  
   - Clique em "Add Environment Variable" e adicione:
     - `DB_NAME`
     - `DB_USER`
     - `DB_PASS`
     - `DB_HOST`
     - (Adicione outras se necessário, como `PORT`)

8. **Clique em "Create Web Service"**  
   O Render irá instalar as dependências, rodar o build e iniciar seu app.

---

## Como subir o projeto ao GitHub

1. **Crie um repositório novo no GitHub:**  
   - Acesse https://github.com/new  
   - Dê um nome ao repositório (ex: `oac-market`).

2. **No terminal, dentro da pasta do projeto, execute:**
   ```sh
   git init
   git add .
   git commit -m "Primeiro commit"
   git branch -M main
   git remote add origin https://github.com/basilio67/OAC Marcket.git
   git push -u origin main
   ```
   > Substitua `SEU_USUARIO` e `SEU_REPOSITORIO` pelo seu usuário e nome do repositório no GitHub.

3. **Pronto! Seu projeto estará no GitHub.**

---

## Quais variáveis de ambiente adicionar no Render

Adicione as seguintes variáveis de ambiente no painel do Render:

- `DB_NAME` — Nome do banco de dados PostgreSQL (ex: `oacmarket`)
- `DB_USER` — Usuário do banco de dados (ex: `postgres`)
- `DB_PASS` — Senha do banco de dados
- `DB_HOST` — Host do banco de dados (ex: `localhost` ou o endereço fornecido pelo Render PostgreSQL)
- `PORT` — (opcional, mas recomendado) Porta para o servidor Node.js (ex: `10000` ou deixe em branco para usar a padrão do Render)

Se estiver usando um banco PostgreSQL do próprio Render, use os dados fornecidos na tela de configuração do banco.

---

# Dica de segurança

Nunca coloque usuário e senha do banco diretamente no código. Use sempre variáveis de ambiente!

---

## Como criar o banco de dados PostgreSQL no Render

1. No painel do Render, clique em **"New +"** e escolha **"PostgreSQL"**.
2. Dê um nome para o banco e clique em **"Create Database"**.
3. Aguarde a criação. O Render mostrará as informações de conexão:
   - **Database** (nome do banco)
   - **User** (usuário)
   - **Password** (senha)
   - **Host** (host)
   - **Port** (porta)
4. Copie esses dados e use para preencher as variáveis de ambiente do seu Web Service:
   - `DB_NAME` = Database
   - `DB_USER` = User
   - `DB_PASS` = Password
   - `DB_HOST` = Host
   - `PORT` = (opcional, pode deixar em branco ou usar o padrão do Render)

**Importante:**  
- Não compartilhe sua senha do banco.
- Use sempre as variáveis de ambiente para manter seus dados seguros.

---

## Como fazer commit no Git

1. **No terminal, dentro da pasta do projeto, execute:**
   ```sh
   git add .
   git commit -m "Descreva aqui o que mudou, ex: adiciona páginas obrigatórias"
   git push
   ```
   - O comando `git add .` adiciona todas as alterações.
   - O comando `git commit -m "mensagem"` salva as alterações localmente com uma mensagem.
   - O comando `git push` envia as alterações para o GitHub.

2. **Repita sempre que fizer alterações no projeto.**
