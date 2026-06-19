const mysql = require('mysql2');
require('dotenv').config();

let dbHost = (process.env.DB_HOST || '127.0.0.1').trim().replace(/^['"]|['"]$/g, '');
let dbUser = (process.env.DB_USER || 'mrblasterinpyx').trim().replace(/^['"]|['"]$/g, '');
let dbPassword = (process.env.DB_PASSWORD || '').trim().replace(/^['"]|['"]$/g, '');
let dbName = (process.env.DB_NAME || 'mulino_wl_db').trim().replace(/^['"]|['"]$/g, '');

// Corrige caso a Cloudez tenha cortado o hash da senha
if (dbPassword === '3Gq)y') {
  dbPassword = '3Gq)y#J%im6#->';
}

console.log('[Database Debug] Conectando com:', {
  host: dbHost,
  user: dbUser,
  database: dbName,
  passwordLength: dbPassword.length,
  passwordPreview: dbPassword.substring(0, 5) + '...'
});

const pool = mysql.createPool({
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise();

// Função auxiliar para inicializar as tabelas no MySQL se não existirem
async function initDb() {
  try {
    // Tabela de lojistas (shops)
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS shops (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vnda_shop_id VARCHAR(255) NOT NULL UNIQUE,
        access_token VARCHAR(255) NOT NULL,
        retention_days INT DEFAULT 45,
        heart_color VARCHAR(7) DEFAULT '#d93025',
        counter_color VARCHAR(7) DEFAULT '#e74c3c',
        wishlist_icon VARCHAR(50) DEFAULT 'heart',
        heart_empty_color VARCHAR(7) DEFAULT '#888888',
        icon_position VARCHAR(50) DEFAULT 'top-right',
        dashboard_mode VARCHAR(50) DEFAULT 'standard',
        niche_profile VARCHAR(50) DEFAULT 'general',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Tabela de favoritos (favorites)
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        shop_id INT NOT NULL,
        customer_hash VARCHAR(64) NOT NULL,
        customer_identifier VARCHAR(255) NULL,
        product_id VARCHAR(255) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        product_url TEXT NOT NULL,
        product_image TEXT,
        product_price INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
        INDEX idx_customer_hash (customer_hash),
        INDEX idx_shop_product (shop_id, product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Migração: adiciona colunas se a tabela já existia sem elas
    try {
      const [columns] = await promisePool.query("SHOW COLUMNS FROM shops LIKE 'heart_color'");
      if (columns.length === 0) {
        await promisePool.query(`
          ALTER TABLE shops 
          ADD COLUMN heart_color VARCHAR(7) DEFAULT '#d93025',
          ADD COLUMN counter_color VARCHAR(7) DEFAULT '#e74c3c'
        `);
        console.log('Tabela shops alterada com sucesso para incluir novas colunas de cores.');
      }

      const [iconCols] = await promisePool.query("SHOW COLUMNS FROM shops LIKE 'wishlist_icon'");
      if (iconCols.length === 0) {
        await promisePool.query(`
          ALTER TABLE shops 
          ADD COLUMN wishlist_icon VARCHAR(50) DEFAULT 'heart'
        `);
        console.log('Tabela shops alterada com sucesso para incluir a coluna de ícone.');
      }

      const [emptyColorCols] = await promisePool.query("SHOW COLUMNS FROM shops LIKE 'heart_empty_color'");
      if (emptyColorCols.length === 0) {
        await promisePool.query(`
          ALTER TABLE shops 
          ADD COLUMN heart_empty_color VARCHAR(7) DEFAULT '#888888'
        `);
        console.log('Tabela shops alterada com sucesso para incluir a coluna heart_empty_color.');
      }

      const [positionCols] = await promisePool.query("SHOW COLUMNS FROM shops LIKE 'icon_position'");
      if (positionCols.length === 0) {
        await promisePool.query(`
          ALTER TABLE shops 
          ADD COLUMN icon_position VARCHAR(50) DEFAULT 'top-right'
        `);
        console.log('Tabela shops alterada com sucesso para incluir a coluna icon_position.');
      }

      const [modeCols] = await promisePool.query("SHOW COLUMNS FROM shops LIKE 'dashboard_mode'");
      if (modeCols.length === 0) {
        await promisePool.query(`
          ALTER TABLE shops 
          ADD COLUMN dashboard_mode VARCHAR(50) DEFAULT 'standard',
          ADD COLUMN niche_profile VARCHAR(50) DEFAULT 'general'
        `);
        console.log('Tabela shops alterada com sucesso para incluir colunas de modo premium.');
      }

      const [identifierCols] = await promisePool.query("SHOW COLUMNS FROM favorites LIKE 'customer_identifier'");
      if (identifierCols.length === 0) {
        await promisePool.query(`
          ALTER TABLE favorites 
          ADD COLUMN customer_identifier VARCHAR(255) NULL
        `);
        console.log('Tabela favorites alterada com sucesso para incluir a coluna customer_identifier.');
      }

      const [priceCols] = await promisePool.query("SHOW COLUMNS FROM favorites LIKE 'product_price'");
      if (priceCols.length === 0) {
        await promisePool.query(`
          ALTER TABLE favorites 
          ADD COLUMN product_price INT DEFAULT 0
        `);
        console.log('Tabela favorites alterada com sucesso para incluir a coluna product_price.');
      }
    } catch (migError) {
      console.warn('Aviso ao aplicar migrações na tabela shops:', migError.message);
    }

    console.log('Banco de dados MySQL e tabelas inicializadas com sucesso.');
  } catch (error) {
    console.error('Erro ao inicializar tabelas no banco de dados:', error);
  }
}

module.exports = {
  db: promisePool,
  initDb
};
