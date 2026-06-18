const express = require('express');
const router = express.Router();
const { db } = require('../config/database');

// Função para simular preço e estoque consistentes baseados no ID do produto
function getSimulatedStatus(productId) {
  const cleanId = String(productId).replace(/\D/g, '');
  const numId = cleanId ? parseInt(cleanId) : 42;
  const inStock = numId % 5 !== 0; // 80% de chance de estoque positivo
  const stockCount = inStock ? (numId % 20) + 1 : 0;
  // Preço entre R$ 39,90 e R$ 249,90 em centavos
  const currentPrice = 3990 + (numId % 210) * 100;
  return {
    inStock,
    stockCount,
    currentPrice
  };
}

// Middleware auxiliar de validação da loja
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

// 1. Carregar configurações e estatísticas da loja no painel admin
router.get('/', validateShop, async (req, res) => {
  try {
    // Estatísticas dos produtos mais favoritados
    const [mostFavorited] = await db.query(
      `SELECT product_id, product_name, product_image, COUNT(id) as total 
       FROM favorites 
       WHERE shop_id = ? 
       GROUP BY product_id, product_name, product_image 
       ORDER BY total DESC 
       LIMIT 10`,
      [req.shop.id]
    );

    // Mapeia para adicionar informações de preço e estoque simuladas
    const statsMostFavorited = mostFavorited.map(item => {
      const sim = getSimulatedStatus(item.product_id);
      return {
        ...item,
        inStock: sim.inStock,
        stockCount: sim.stockCount,
        currentPrice: sim.currentPrice
      };
    });

    // Total de favoritos ativos
    const [totalFavorites] = await db.query(
      'SELECT COUNT(id) as total FROM favorites WHERE shop_id = ?',
      [req.shop.id]
    );

    res.json({
      success: true,
      settings: {
        retention_days: req.shop.retention_days,
        heart_color: req.shop.heart_color || '#d93025',
        counter_color: req.shop.counter_color || '#e74c3c',
        wishlist_icon: req.shop.wishlist_icon || 'heart',
        heart_empty_color: req.shop.heart_empty_color || '#888888',
        icon_position: req.shop.icon_position || 'top-right'
      },
      stats: {
        total: totalFavorites[0].total,
        mostFavorited: statsMostFavorited
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar estatísticas.' });
  }
});

// 2. Atualizar configurações (dias de retenção, cores e ícone)
router.post('/save', validateShop, async (req, res) => {
  const { retention_days, heart_color, counter_color, wishlist_icon, heart_empty_color, icon_position, shop } = req.body;

  if (retention_days === undefined || isNaN(retention_days) || parseInt(retention_days) < 1) {
    return res.status(400).json({ error: 'Dias de retenção inválidos.' });
  }

  // Validação simples de cor Hexadecimal (ex: #ffffff)
  const hexReg = /^#[0-9A-F]{6}$/i;
  const validHeartColor = heart_color && hexReg.test(heart_color) ? heart_color : '#d93025';
  const validCounterColor = counter_color && hexReg.test(counter_color) ? counter_color : '#e74c3c';
  const validEmptyColor = heart_empty_color && hexReg.test(heart_empty_color) ? heart_empty_color : '#888888';

  // Validação de ícones aceitos
  const allowedIcons = ['heart', 'star', 'tag', 'bookmark'];
  const validIcon = wishlist_icon && allowedIcons.includes(wishlist_icon) ? wishlist_icon : 'heart';

  // Validação de posições aceitas
  const allowedPositions = ['top-right', 'top-left', 'bottom-right', 'bottom-left'];
  const validPosition = icon_position && allowedPositions.includes(icon_position) ? icon_position : 'top-right';

  try {
    await db.query(
      'UPDATE shops SET retention_days = ?, heart_color = ?, counter_color = ?, wishlist_icon = ?, heart_empty_color = ?, icon_position = ? WHERE vnda_shop_id = ?',
      [parseInt(retention_days), validHeartColor, validCounterColor, validIcon, validEmptyColor, validPosition, shop]
    );
    res.json({ success: true, message: 'Configurações atualizadas com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar configurações.' });
  }
});

// 3. Exportar relatório de favoritos para CSV (compatível com Excel em Português)
router.get('/export', validateShop, async (req, res) => {
  try {
    const [favorites] = await db.query(
      `SELECT product_id, product_name, COUNT(id) as total 
       FROM favorites 
       WHERE shop_id = ? 
       GROUP BY product_id, product_name 
       ORDER BY total DESC`,
      [req.shop.id]
    );

    // UTF-8 BOM para garantir acentuação correta no Excel em português
    let csvContent = '\uFEFF';
    csvContent += 'ID do Produto;Nome do Produto;Quantidade de Favoritos\n';
    
    favorites.forEach(item => {
      const nameEscaped = item.product_name.replace(/"/g, '""');
      csvContent += `"${item.product_id}";"${nameEscaped}";${item.total}\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=favoritos_${req.query.shop}.csv`);
    res.send(csvContent);
  } catch (error) {
    res.status(500).send('Erro ao exportar dados.');
  }
});

// 4. Buscar a visão geral de clientes com seus respectivos favoritos
router.get('/customers', validateShop, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT customer_hash, product_id, product_name, product_image, product_price, created_at 
       FROM favorites 
       WHERE shop_id = ? 
       ORDER BY customer_hash, created_at DESC`,
      [req.shop.id]
    );

    // Agrupar itens por cliente (hash)
    const customersMap = {};
    rows.forEach(row => {
      if (!customersMap[row.customer_hash]) {
        customersMap[row.customer_hash] = {
          customer_hash: row.customer_hash,
          total_favorites: 0,
          items: []
        };
      }
      const sim = getSimulatedStatus(row.product_id);
      customersMap[row.customer_hash].items.push({
        id: row.product_id,
        name: row.product_name,
        image: row.product_image,
        price: row.product_price,
        inStock: sim.inStock,
        stockCount: sim.stockCount,
        currentPrice: sim.currentPrice,
        created_at: row.created_at
      });
      customersMap[row.customer_hash].total_favorites++;
    });

    res.json({
      success: true,
      customers: Object.values(customersMap)
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar visão geral de clientes.' });
  }
});

// 5. Remover item da lista de um cliente específico de forma administrativa (Gestão de listas)
router.delete('/customers/remove-favorite', validateShop, async (req, res) => {
  const { customer_hash, product_id } = req.body;
  if (!customer_hash || !product_id) {
    return res.status(400).json({ error: 'customer_hash e product_id são necessários.' });
  }

  try {
    await db.query(
      'DELETE FROM favorites WHERE shop_id = ? AND customer_hash = ? AND product_id = ?',
      [req.shop.id, customer_hash, product_id]
    );
    res.json({ success: true, message: 'Item removido da lista do cliente com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar favorito administrativo.' });
  }
});

// 6. Simular disparo de alertas de marketing (Gatilhos automatizados)
router.post('/send-alert', validateShop, async (req, res) => {
  const { alert_type, product_id, product_name } = req.body;
  if (!alert_type || !product_id || !product_name) {
    return res.status(400).json({ error: 'Dados incompletos para simulação.' });
  }

  try {
    // Busca os clientes que favoritaram este produto para enviar o alerta
    const [favorites] = await db.query(
      'SELECT customer_hash FROM favorites WHERE shop_id = ? AND product_id = ?',
      [req.shop.id, product_id]
    );

    const targetCount = favorites.length;
    
    // Simulação do envio (em produção integraria com ActiveCampaign, Klaviyo, Mandrill, etc.)
    res.json({
      success: true,
      message: `Simulação concluída! Alerta do tipo "${alert_type}" enviado com sucesso para ${targetCount} clientes.`,
      targetCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao simular disparo de alerta.' });
  }
});

module.exports = router;
