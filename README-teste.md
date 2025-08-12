# Como testar o OAC Market localmente

1. **Instale as dependências:**
   ```
   npm install
   ```

2. **Crie a pasta para uploads de imagens:**
   ```
   mkdir public/uploads
   ```

3. **Inicie o servidor:**
   ```
   node server.js
   ```

4. **Acesse no navegador:**
   ```
   http://localhost:3000
   ```

5. **Fluxo de teste:**
   - Clique em "Ver todos os produtos" para ver os produtos públicos.
   - Para cadastrar uma loja ou produto, acesse `/cadastro` e crie um usuário vendedor, faça login, crie uma loja e adicione produtos.
   - Para testar envio de mensagens, acesse uma loja e envie uma mensagem no formulário disponível.

6. **Observação:** 
   - Compradores não precisam se cadastrar.
   - Produtos e mensagens são públicos.
