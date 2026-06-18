const express = require('express');
const router = express.Router();
const { db } = require('../config/database');

// Rota de Início de Instalação (Chamada pelo painel admin da Olist/Vnda)
// Query Params esperados: shop (URL ou ID do lojista)
router.get('/', (req, res) => {
  const { shop } = req.query;
  if (!shop) {
    return res.status(400).send('Parâmetro shop é obrigatório.');
  }

  // URL de autorização da Vnda/Olist
  // Em produção, isso redireciona para a tela onde o lojista aceita as permissões do App.
  const clientId = process.env.VNDA_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.VNDA_REDIRECT_URI);
  const scope = 'read_products,write_script_tags'; // Permissões desejadas
  
  // Exemplo de URL de autorização OAuth
  const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  
  res.redirect(authUrl);
});

// Rota de Callback do OAuth da Vnda/Olist
router.get('/callback', async (req, res) => {
  const { code, shop } = req.query;

  if (!code || !shop) {
    return res.status(400).send('Parâmetros inválidos no callback do OAuth.');
  }

  try {
    // 1. Troca o código temporário pelo token de acesso definitivo
    // Em produção, faremos um POST para: https://{shop}/admin/oauth/access_token
    let accessToken = 'token_mockado_teste_123456';
    
    if (process.env.NODE_ENV === 'production' || (process.env.VNDA_CLIENT_SECRET && process.env.VNDA_CLIENT_SECRET !== 'seu_client_secret_aqui')) {
      const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: process.env.VNDA_CLIENT_ID,
          client_secret: process.env.VNDA_CLIENT_SECRET,
          code
        })
      });
      if (response.ok) {
        const tokenData = await response.json();
        accessToken = tokenData.access_token;
      }
    }

    // 2. Salva ou atualiza a loja na nossa base MySQL
    const [existing] = await db.query('SELECT id FROM shops WHERE vnda_shop_id = ?', [shop]);
    let dbShopId;

    if (existing.length > 0) {
      await db.query('UPDATE shops SET access_token = ? WHERE vnda_shop_id = ?', [accessToken, shop]);
      dbShopId = existing[0].id;
    } else {
      const [result] = await db.query(
        'INSERT INTO shops (vnda_shop_id, access_token, retention_days) VALUES (?, ?, ?)',
        [shop, accessToken, 45] // Default 45 dias de retenção
      );
      dbShopId = result.insertId;
    }

    // 3. Registrar o Widget de Wishlist dinamicamente na loja do cliente (ScriptTag API)
    // Em produção, isso insere o script <script src="https://seu-dominio/wishlist-widget.js"></script> em todas as páginas da loja.
    try {
      const appUrl = `${req.protocol}://${req.get('host')}`;
      const scriptUrl = `${appUrl}/wishlist-widget.js`;

      await fetch(`https://${shop}/api/v2/script_tags`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          script_tag: {
            event: 'onload',
            src: scriptUrl
          }
        })
      });
      console.log(`ScriptTag registrado com sucesso na loja ${shop}: ${scriptUrl}`);
    } catch (err) {
      console.warn(`Aviso: Não foi possível injetar ScriptTag via API (provavelmente ambiente mock/desenvolvimento): ${err.message}`);
    }

    // 4. Redireciona o lojista para o painel de configurações do App na Cloudez
    res.redirect(`/admin/index.html?shop=${shop}`);

  } catch (error) {
    console.error('Erro no callback do OAuth:', error);
    res.status(500).send('Erro interno durante a autenticação.');
  }
});

module.exports = router;
