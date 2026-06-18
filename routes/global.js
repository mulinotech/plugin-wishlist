const express = require('express');
const router = express.Router();
const { db } = require('../config/database');

// Credenciais do Admin Geral (Padrão ou via .env)
const ADMIN_USER = (process.env.ADMIN_USER || 'admin@mulinotech.com').trim();
const ADMIN_PASS = (process.env.ADMIN_PASS || 'mulinoadminsecret').trim();

// Token simples em memória para a sessão ativa (para evitar banco de sessões complexo)
const activeTokens = new Set();

// Middleware de autenticação do Super Admin (suporta header Bearer ou parâmetro token para BI)
function requireSuperAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token || !activeTokens.has(token)) {
    return res.status(401).json({ error: 'Não autorizado. Faça login.' });
  }
  next();
}

// 1. Rota de Login do Super Admin
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    // Gera um token de sessão simples em formato hexadecimal
    const token = require('crypto').randomBytes(16).toString('hex');
    activeTokens.add(token);
    return res.json({ success: true, token });
  }

  res.status(401).json({ error: 'Usuário ou senha incorretos.' });
});

// 2. Rota para obter estatísticas globais consolidadas
router.get('/stats', requireSuperAdmin, async (req, res) => {
  try {
    // Total de lojas
    const [shopsCount] = await db.query('SELECT COUNT(id) as total FROM shops');
    
    // Total de favoritos ativos
    const [favoritesCount] = await db.query('SELECT COUNT(id) as total FROM favorites');

    // Listagem detalhada de lojas
    const [shopsList] = await db.query(`
      SELECT id, vnda_shop_id, created_at,
             (SELECT COUNT(id) FROM favorites WHERE shop_id = shops.id) as total_favorites
      FROM shops
      ORDER BY total_favorites DESC, created_at DESC
    `);

    // Top 10 produtos mais favoritados globalmente
    const [topProducts] = await db.query(`
      SELECT f.product_id, f.product_name, f.product_image, COUNT(f.id) as total, s.vnda_shop_id as shop_domain
      FROM favorites f
      JOIN shops s ON f.shop_id = s.id
      GROUP BY f.product_id, f.product_name, f.product_image, s.vnda_shop_id
      ORDER BY total DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      stats: {
        total_shops: shopsCount[0].total,
        total_favorites: favoritesCount[0].total,
        shops: shopsList,
        top_products: topProducts
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas globais:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// 3. Rota de Exportação de Dados para PowerBI / Looker Studio (JSON tabular simples)
router.get('/export-bi', requireSuperAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.vnda_shop_id as loja, f.product_id as id_produto, f.product_name as nome_produto, 
             f.product_price as preco_centavos, f.created_at as data_favoritado
      FROM favorites f
      JOIN shops s ON f.shop_id = s.id
      ORDER BY f.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao exportar dados para BI:', error);
    res.status(500).json({ error: 'Erro ao gerar dados de exportação.' });
  }
});

// 4. Rota de Logout
router.post('/logout', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    activeTokens.delete(token);
  }
  res.json({ success: true, message: 'Logout realizado com sucesso.' });
});

module.exports = router;
