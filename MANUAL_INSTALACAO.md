# Manual de Instalação e Configuração do Plugin Wishlist (Olist/Vnda)

Este documento descreve o passo a passo para configurar, instalar e testar o plugin de Wishlist no ambiente local, no ambiente de staging (loja de teste `inpyx`) e em produção.

---

## 1. Requisitos Prévios

Antes de iniciar, certifique-se de possuir:
1. Acesso ao **Portal de Parceiros/Desenvolvedores da Vnda** (homologação/staging ou produção).
2. Acesso ao painel administrativo da loja de testes na Vnda (ex: `inpyx`).
3. Acesso ao container do **Google Tag Manager (GTM)** instalado na loja correspondente.
4. O servidor do plugin hospedado e acessível publicamente (ex: `https://wl.mulinotech.com`).

---

## 2. Configuração das Variáveis de Ambiente (`.env`)

O projeto utiliza variáveis de ambiente para gerenciar as credenciais com segurança. **Nunca envie o arquivo `.env` de desenvolvimento para o ambiente de produção/staging.**

### Configuração Local (Desenvolvimento)
No seu ambiente de desenvolvimento local, edite ou crie o arquivo `.env` na raiz do projeto:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=vnda_wishlist_db
VNDA_CLIENT_ID=seu_client_id_desenvolvimento
VNDA_CLIENT_SECRET=seu_client_secret_desenvolvimento
VNDA_REDIRECT_URI=http://localhost:3000/auth/callback
```

### Configuração na Hospedagem (Produção/Staging - ex: Cloudez)
Na hospedagem, configure as variáveis diretamente no painel de controle (seção de **Variáveis de Ambiente** / **Environment Variables**):

*   **`PORT`**: `3000` (ou a porta atribuída pela hospedagem)
*   **`DB_HOST`**: Endereço do banco de dados de produção fornecido pela Cloudez.
*   **`DB_USER`**: Usuário do banco de dados de produção.
*   **`DB_PASSWORD`**: Senha do banco de dados de produção.
*   **`DB_NAME`**: Nome do banco de dados de produção.
*   **`VNDA_CLIENT_ID`**: O Client ID gerado para o aplicativo no Portal de Parceiros da Vnda.
*   **`VNDA_CLIENT_SECRET`**: O Client Secret gerado no Portal de Parceiros da Vnda.
*   **`VNDA_REDIRECT_URI`**: `https://wl.mulinotech.com/auth/callback`

---

## 3. Registro do App no Portal de Parceiros da Vnda

Para que a Vnda reconheça seu plugin, registre-o no console de desenvolvedor:
1. Acesse o **Console de Parceiros da Vnda**.
2. Crie um novo aplicativo chamado **Wishlist Premium**.
3. Configure as URLs do App da seguinte forma:
   *   **Redirect URI / Callback URL**: `https://wl.mulinotech.com/auth/callback`
   *   **App URL (Admin URL)**: `https://wl.mulinotech.com/admin/`
4. Nas permissões (scopes), marque ou adicione:
   *   `read_products` (necessário para ler dados dos produtos favoritados)
   *   `write_script_tags` (necessário caso utilize injeção automática de scripts no futuro)

---

## 4. Instalação do Aplicativo na Loja (Fluxo OAuth)

Para associar o plugin à loja de testes `inpyx`:
1. Abra o navegador e acesse a URL de início de instalação, passando o domínio de staging da loja como parâmetro:
   ```
   https://wl.mulinotech.com/auth?shop=inpyx.cws.vnda.com.br
   ```
   *(Substitua `inpyx.cws.vnda.com.br` pelo domínio de testes exato fornecido pela Vnda).*
2. Você será redirecionado para a tela de autenticação da Vnda. Insira suas credenciais da loja `inpyx` e clique em **Autorizar**.
3. A Vnda enviará um código temporário de volta para o seu callback (`/auth/callback`), que obterá o token de acesso definitivo, registrará os dados da loja no banco MySQL e redirecionará para o painel de configurações do aplicativo.

---

## 5. Integração do Widget na Loja via Google Tag Manager (GTM)

Como a instalação visual da Wishlist na loja do cliente final é feita de forma desacoplada via GTM:
1. Acesse o painel do **Google Tag Manager** associado à loja `inpyx`.
2. Vá em **Tags** > **Nova**.
3. Em **Configuração da Tag**, selecione **HTML Personalizado** (Custom HTML).
4. Insira o seguinte código de carregamento do script:
   ```html
   <script src="https://wl.mulinotech.com/wishlist-widget.js" defer></script>
   ```
5. Em **Acionadores**, escolha **Todas as páginas** (All Pages).
6. Salve a Tag e clique em **Enviar** para publicar as alterações no container do GTM.

---

## 6. Visualização do Painel no Admin da Vnda/Olist

Uma vez instalado o App na loja:
1. Faça login no painel administrativo da Vnda da loja `inpyx`.
2. Acesse o menu lateral de **Aplicativos** ou **Integrações**.
3. Localize e clique no aplicativo **Wishlist Premium**.
4. O painel da Wishlist (`https://wl.mulinotech.com/admin/`) será carregado de forma nativa e integrada dentro de um iframe no painel da Vnda, identificando a loja ativa através dos parâmetros enviados na URL.
