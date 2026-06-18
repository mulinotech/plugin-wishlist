const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDb, db } = require('./config/database');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const settingsRoutes = require('./routes/settings');
const globalRoutes = require('./routes/global');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware customizado para tratar cabeçalhos e métodos CORS (sem duplicar o Origin da Cloudez)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // Responde imediatamente com 200 para a pré-requisição OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Servir arquivos estáticos (como o widget JS e a tela de admin)
app.use(express.static(path.join(__dirname, 'public')));

// Rotas do backend
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/global', globalRoutes);



// Rota de Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Rotina Diária de Limpeza automática (Cleanup Cron)
// Em produção, isso pode ser chamado por um agendador de tarefas externo (ex: cron-job.org ou trigger no SO)
app.post('/cron/cleanup', async (req, res) => {
  // Simples proteção por token básico no header para segurança do cron
  const cronToken = req.headers['x-cron-token'];
  if (process.env.NODE_ENV === 'production' && cronToken !== process.env.CRON_TOKEN) {
    return res.status(401).json({ error: 'Não autorizado.' });
  }

  try {
    const [shops] = await db.query('SELECT id, retention_days, vnda_shop_id FROM shops');
    let deletedCount = 0;

    for (const shop of shops) {
      const [result] = await db.query(
        'DELETE FROM favorites WHERE shop_id = ? AND created_at < NOW() - INTERVAL ? DAY',
        [shop.id, shop.retention_days]
      );
      deletedCount += result.affectedRows;
      console.log(`[Cleanup] Loja ${shop.vnda_shop_id}: ${result.affectedRows} registros expirados deletados.`);
    }

    res.json({ success: true, message: 'Cleanup executado com sucesso.', deleted: deletedCount });
  } catch (error) {
    console.error('[Cleanup] Erro durante a limpeza:', error);
    res.status(500).json({ error: 'Falha ao executar limpeza de dados.' });
  }
});

// Inicialização do servidor
app.listen(PORT, async () => {
  console.log(`Servidor rodando com sucesso na porta ${PORT}`);
  // Cria banco e tabelas no banco de dados se não existirem
  await initDb();
});
