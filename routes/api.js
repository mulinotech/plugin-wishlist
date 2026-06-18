const express = require('express');
const router = express.Router();
const { db } = require('../config/database');

// Middleware auxiliar para validar a loja
async function validateShop(req, res, next) {
  const shopDomain = req.query.shop || req.body.shop;
  if (!shopDomain) {
    return res.status(400).json({ error: 'Parâmetro shop é obrigatório.' });
  }

  try {
    const [shops] = await db.query('SELECT id, retention_days, heart_color, counter_color, wishlist_icon, heart_empty_color, icon_position FROM shops WHERE vnda_shop_id = ?', [shopDomain]);
    if (shops.length === 0) {
      return res.status(404).json({ error: 'Loja não cadastrada.' });
    }
    req.shop = shops[0];
    next();
  } catch (error) {
    res.status(500).json({ error: 'Erro de banco de dados.' });
  }
}

// Rota pública para obter as configurações visuais da loja (cores e ícone)
router.get('/config', validateShop, (req, res) => {
  res.json({
    success: true,
    config: {
      heart_color: req.shop.heart_color || '#d93025',
      counter_color: req.shop.counter_color || '#e74c3c',
      wishlist_icon: req.shop.wishlist_icon || 'heart',
      heart_empty_color: req.shop.heart_empty_color || '#888888',
      icon_position: req.shop.icon_position || 'top-right'
    }
  });
});

// 1. Buscar favoritos de um cliente
router.get('/favorites', validateShop, async (req, res) => {
  const { customer_hash } = req.query;

  if (!customer_hash) {
    return res.status(400).json({ error: 'customer_hash é obrigatório.' });
  }

  try {
    const [favorites] = await db.query(
      `SELECT product_id as id, product_name as name, product_url as url, product_image as image, product_price as price 
       FROM favorites 
       WHERE shop_id = ? AND customer_hash = ? 
       ORDER BY created_at DESC`,
      [req.shop.id, customer_hash]
    );
    res.json({ success: true, favorites });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar favoritos.' });
  }
});

// 2. Adicionar produto aos favoritos
router.post('/favorites', validateShop, async (req, res) => {
  const { customer_hash, product_id, product_name, product_url, product_image, product_price } = req.body;

  if (!customer_hash || !product_id || !product_name || !product_url) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
  }

  try {
    // Evita duplicatas
    const [existing] = await db.query(
      'SELECT id FROM favorites WHERE shop_id = ? AND customer_hash = ? AND product_id = ?',
      [req.shop.id, customer_hash, product_id]
    );

    if (existing.length > 0) {
      return res.json({ success: true, message: 'Produto já está nos favoritos.' });
    }

    await db.query(
      `INSERT INTO favorites (shop_id, customer_hash, product_id, product_name, product_url, product_image, product_price) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.shop.id, customer_hash, product_id, product_name, product_url, product_image, parseInt(product_price) || 0]
    );

    res.json({ success: true, message: 'Produto favoritado com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar favorito.' });
  }
});

// 3. Remover produto dos favoritos
router.delete('/favorites', validateShop, async (req, res) => {
  const { customer_hash, product_id } = req.body || req.query;

  if (!customer_hash || !product_id) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
  }

  try {
    await db.query(
      'DELETE FROM favorites WHERE shop_id = ? AND customer_hash = ? AND product_id = ?',
      [req.shop.id, customer_hash, product_id]
    );
    res.json({ success: true, message: 'Produto removido dos favoritos.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover favorito.' });
  }
});

module.exports = router;
