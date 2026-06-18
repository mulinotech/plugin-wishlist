(function () {
  // Configurações do app
  const APP_URL = window.location.origin.includes('localhost')
    ? 'http://localhost:3000'
    : 'https://wl.mulinotech.com';

  const Wishlist = {
    isLoggedIn: false,
    customerHash: null,
    favorites: [],
    shopDomain: window.location.hostname,
    lastRemovedItem: null, // Guardar último item removido para Undo
    config: {
      heart_color: '#F26422',
      counter_color: '#002244',
      wishlist_icon: 'heart',
      heart_empty_color: '#888888',
      icon_position: 'top-right'
    },

    // Carregar configurações visuais (cores) cadastradas pelo lojista
    loadConfig: async function () {
      try {
        const res = await fetch(`${APP_URL}/api/config?shop=${this.shopDomain}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.config) {
            this.config = data.config;
            this.injectCustomStyles();
          }
        }
      } catch (e) {
        console.error('Wishlist Widget: erro ao carregar configurações de cor', e);
      }
    },

    // Injetar estilos customizados baseados no painel do lojista
    injectCustomStyles: function () {
      const styleId = 'wishlist-custom-styles';
      let styleTag = document.getElementById(styleId);
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = styleId;
        document.head.appendChild(styleTag);
      }
      styleTag.textContent = `
        :root {
          --oli-color-brand-primary: ${this.config.heart_color} !important;
          --oli-color-brand-secondary: ${this.config.counter_color} !important;
          --oli-color-brand-empty: ${this.config.heart_empty_color || '#888888'} !important;
        }
      `;
    },

    // Retorna o SVG do formato de ícone configurado
    getIconSvg: function (color) {
      const icon = this.config.wishlist_icon || 'heart';
      let path = '';
      if (icon === 'star') {
        path = `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`;
      } else if (icon === 'bookmark') {
        path = `<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>`;
      } else if (icon === 'tag') {
        path = `<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>`;
      } else {
        // default 'heart'
        path = `<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>`;
      }
      return `
        <svg class="icon-heart" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">
          ${path}
        </svg>
      `;
    },

    // Criptografia SHA-256 no client-side para segurança e LGPD
    hashEmail: async function (email) {
      const msgBuffer = new TextEncoder().encode(email.trim().toLowerCase());
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    },

    // Rastreamento de Pixels de Marketing (Meta Pixel e GA4)
    trackMarketingEvent: function (action, product) {
      const priceVal = parseFloat(product.price) || 0;

      // 1. Meta / Facebook Pixel
      if (typeof window.fbq === 'function') {
        try {
          window.fbq('track', 'AddToWishlist', {
            content_name: product.name,
            content_ids: [product.id],
            content_type: 'product',
            value: priceVal,
            currency: 'BRL'
          });
          console.log('[Wishlist Widget] Evento AddToWishlist enviado ao Meta Pixel.');
        } catch (err) {
          console.warn('[Wishlist Widget] Erro ao disparar Meta Pixel:', err);
        }
      }

      // 2. Google Analytics 4 (GA4) / Google Tag Manager (gtag)
      if (typeof window.gtag === 'function') {
        try {
          window.gtag('event', 'add_to_wishlist', {
            value: priceVal,
            currency: 'BRL',
            items: [{
              item_id: product.id,
              item_name: product.name,
              price: priceVal
            }]
          });
          console.log('[Wishlist Widget] Evento add_to_wishlist enviado ao GA4.');
        } catch (err) {
          console.warn('[Wishlist Widget] Erro ao disparar GA4:', err);
        }
      }
    },

    // 1. Validar login do cliente usando a rota padrão da Vnda
    checkLogin: async function () {
      try {
        const res = await fetch('/conta/cliente', { headers: { 'Accept': 'application/json' } });
        if (res.ok) {
          const client = await res.json();
          if (client && Object.keys(client).length > 0) {
            this.isLoggedIn = true;
            this.customerHash = await this.hashEmail(client.email || client.id.toString());
            return true;
          }
        }
      } catch (e) {
        console.error('Wishlist Widget: erro ao validar login', e);
      }
      this.isLoggedIn = false;
      this.customerHash = null;
      return false;
    },

    // 2. Carregar favoritos (do Banco de Dados se logado)
    loadFavorites: async function () {
      if (this.isLoggedIn && this.customerHash) {
        try {
          const res = await fetch(`${APP_URL}/api/favorites?shop=${this.shopDomain}&customer_hash=${this.customerHash}`);
          if (res.ok) {
            const data = await res.json();
            this.favorites = data.favorites || [];
          }
        } catch (e) {
          console.error('Wishlist Widget: erro ao carregar favoritos do banco', e);
        }
      } else {
        this.favorites = [];
      }
    },

    // 3. Salvar/Excluir item (Toggle)
    toggleFavorite: async function (product, isUndoAction = false) {
      // 1. Bloqueia se o usuário não estiver logado
      if (!this.isLoggedIn || !this.customerHash) {
        this.showModal('Para salvar produtos na sua lista de desejos, você precisa estar logado na sua conta.', { type: 'login' });
        return;
      }

      const index = this.favorites.findIndex(item => item.id == product.id);
      const isRemoving = index !== -1;

      if (!isUndoAction && isRemoving) {
        // Salva para possível desfazer (Undo)
        this.lastRemovedItem = { ...product };
      }

      // Usuário Logado - Salvar via API
      try {
        if (isRemoving) {
          console.log('[Wishlist Widget] Enviando DELETE para /api/favorites...', { productId: product.id });
          const res = await fetch(`${APP_URL}/api/favorites`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              shop: this.shopDomain,
              customer_hash: this.customerHash,
              product_id: product.id
            })
          });

          if (res.ok) {
            this.favorites.splice(index, 1);
            this.showToast('Produto removido dos favoritos.', true);
            this.updateUI(product.id, false); // Só atualiza a UI se o servidor confirmar
          } else {
            const errorText = await res.text();
            console.error('[Wishlist Widget] Erro ao remover favorito no servidor:', res.status, errorText);
            this.showToast('Não foi possível remover o favorito. Tente novamente.');
          }
        } else {
          console.log('[Wishlist Widget] Enviando POST para /api/favorites...', { product });
          const res = await fetch(`${APP_URL}/api/favorites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              shop: this.shopDomain,
              customer_hash: this.customerHash,
              product_id: product.id,
              product_name: product.name,
              product_url: product.url,
              product_image: product.image,
              product_price: product.price
            })
          });

          if (res.ok) {
            this.favorites.push(product);
            this.showToast(isUndoAction ? 'Favorito restaurado!' : 'Produto adicionado aos favoritos!');
            this.updateUI(product.id, true); // Só atualiza a UI se o servidor confirmar
            this.trackMarketingEvent('add_to_wishlist', product);
          } else {
            const errorText = await res.text();
            console.error('[Wishlist Widget] Erro ao salvar favorito no servidor:', res.status, errorText);
            this.showToast('Não foi possível salvar o favorito. Tente novamente.');
          }
        }
      } catch (e) {
        console.error('[Wishlist Widget] Erro de rede/conexão com o backend:', e);
        this.showToast('Erro de conexão com o servidor de favoritos.');
      }
    },

    isFavorite: function (id) {
      return this.favorites.some(item => item.id == id);
    },

    // ─── Manipulação de UI ───────────────────────────────────────────────────────



    updateUI: function (productId = null, isActive = false) {
      if (productId !== null) {
        const buttons = document.querySelectorAll(`[data-wishlist-widget-btn][data-id="${productId}"]`);
        buttons.forEach(btn => {
          btn.classList.toggle('is-active', isActive);
          btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
          const icon = btn.querySelector('.icon-heart');
          if (icon) {
            icon.setAttribute('fill', isActive ? this.config.heart_color : 'transparent');
            icon.setAttribute('stroke', isActive ? this.config.heart_color : (this.config.heart_empty_color || '#888888'));
          }
        });
      } else {
        const buttons = document.querySelectorAll('[data-wishlist-widget-btn]');
        buttons.forEach(btn => {
          const id = btn.getAttribute('data-id');
          const active = this.isFavorite(id);
          btn.classList.toggle('is-active', active);
          btn.setAttribute('aria-pressed', active ? 'true' : 'false');
          const icon = btn.querySelector('.icon-heart');
          if (icon) {
            icon.setAttribute('fill', active ? this.config.heart_color : 'transparent');
            icon.setAttribute('stroke', active ? this.config.heart_color : (this.config.heart_empty_color || '#888888'));
          }
        });
      }

      // Atualiza contador de favoritos no header
      const counters = document.querySelectorAll('.wishlist-count');
      counters.forEach(counter => {
        counter.textContent = this.favorites.length;
        if (this.favorites.length > 0) {
          counter.classList.add('has-items');
        } else {
          counter.classList.remove('has-items');
        }
      });

      // Recarrega lista se estiver na página da Wishlist
      if (window.location.pathname === '/wishlist' || window.location.pathname === '/p/wishlist') {
        this.renderWishlistPage();
      }
    },

    // Injetar botão de favorito nos blocos de produtos (Vitrine)
    injectProductCardButtons: function () {
      const cardSelectors = ['.product-block', '.product-card', '.product-item', '[data-product-box]'];

      cardSelectors.forEach(selector => {
        const cards = document.querySelectorAll(selector);
        cards.forEach(card => {
          if (card.querySelector('[data-wishlist-widget-btn]')) return;

          const productId = card.getAttribute('data-product-box') || card.getAttribute('data-id') || card.querySelector('[data-id]')?.getAttribute('data-id');
          if (!productId) return;

          const productName = card.querySelector('.name a, .product-title, h3')?.textContent.trim() || 'Produto';
          const productUrl = card.querySelector('a')?.getAttribute('href') || window.location.pathname;
          // Captura inteligente de imagem (burlar Lazy Load e recuperar URL real)
          const imgEl = card.querySelector('img');
          let productImage = '';
          if (imgEl) {
            // Tenta obter de atributos comuns de lazy loading e responsividade
            let candidateSrc = imgEl.getAttribute('data-src') ||
              imgEl.getAttribute('data-srcset') ||
              imgEl.getAttribute('srcset') ||
              imgEl.getAttribute('src') || '';

            candidateSrc = candidateSrc.trim();

            // Se for srcset / data-srcset, extrai a primeira URL válida
            if (candidateSrc.includes(' ')) {
              const parts = candidateSrc.split(',');
              if (parts.length > 0) {
                const firstPart = parts[0].trim().split(/\s+/)[0];
                if (firstPart && !firstPart.startsWith('data:image')) {
                  candidateSrc = firstPart;
                }
              }
            }

            // Se for placeholder base64 (data:image) ou vazio, tenta pegar do currentSrc do navegador
            if ((!candidateSrc || candidateSrc.startsWith('data:image')) && imgEl.currentSrc) {
              candidateSrc = imgEl.currentSrc;
            }

            // Caso continue com placeholder, busca outras imagens no mesmo card
            if (!candidateSrc || candidateSrc.startsWith('data:image')) {
              const allImgs = card.querySelectorAll('img');
              for (const tempImg of allImgs) {
                let tempSrc = tempImg.getAttribute('data-src') ||
                  tempImg.getAttribute('data-srcset') ||
                  tempImg.getAttribute('srcset') ||
                  tempImg.getAttribute('src') || '';
                tempSrc = tempSrc.trim();

                if (tempSrc.includes(' ')) {
                  const parts = tempSrc.split(',');
                  if (parts.length > 0) {
                    const firstPart = parts[0].trim().split(/\s+/)[0];
                    if (firstPart && !firstPart.startsWith('data:image')) {
                      tempSrc = firstPart;
                    }
                  }
                }

                if (tempSrc && !tempSrc.startsWith('data:image')) {
                  candidateSrc = tempSrc;
                  break;
                }
              }
            }

            productImage = candidateSrc;

            if (productImage.startsWith('//')) {
              productImage = 'https:' + productImage;
            } else if (productImage.startsWith('/') && !productImage.startsWith('//')) {
              productImage = window.location.origin + productImage;
            }
          }

          let priceText = card.querySelector('.price, .product-price, [data-price]')?.textContent || '';
          priceText = priceText.replace(/[^0-9,.]/g, '');
          if (priceText.includes(',')) {
            priceText = priceText.replace(/\./g, '').replace(',', '.');
          }
          const productPrice = parseFloat(priceText || 0);

          const active = this.isFavorite(productId);
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'product-card-wishlist pos-' + (this.config.icon_position || 'top-right');
          btn.setAttribute('data-wishlist-widget-btn', '');
          btn.setAttribute('data-id', productId);
          btn.setAttribute('aria-label', `Adicionar ${productName} aos favoritos`);
          btn.setAttribute('aria-pressed', active ? 'true' : 'false');
          btn.innerHTML = this.getIconSvg(active ? this.config.heart_color : (this.config.heart_empty_color || '#888888'));

          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleFavorite({
              id: productId,
              name: productName,
              url: productUrl,
              image: productImage,
              price: productPrice
            });
          });

          const imageContainer = card.querySelector('.image-wrapper, .image-container, .product-images, .product-gallery, .product-image-container') || imgEl?.parentElement || card;

          if (imageContainer.style.position !== 'relative' && imageContainer.style.position !== 'absolute') {
            imageContainer.style.position = 'relative';
          }
          imageContainer.appendChild(btn);
        });
      });
    },

    injectStyles: function () {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = `${APP_URL}/wishlist-widget.css?v=1.1`;
      document.head.appendChild(link);
    },

    showModal: function (message, options = {}) {
      // Remove modal anterior se houver
      let modal = document.querySelector('.wishlist-custom-modal');
      if (modal) modal.remove();

      modal = document.createElement('div');
      modal.className = 'wishlist-custom-modal';
      
      let actionsHtml = '';
      if (options.type === 'login') {
        actionsHtml = `
          <a href="/entrar" class="wishlist-custom-modal-btn primary">Entrar na minha Conta</a>
          <button class="wishlist-custom-modal-btn secondary" id="wishlist-modal-close-btn">Cancelar</button>
        `;
      } else if (options.allowUndo) {
        actionsHtml = `
          <button class="wishlist-custom-modal-btn primary" id="wishlist-modal-undo-btn">Desfazer</button>
          <button class="wishlist-custom-modal-btn secondary" id="wishlist-modal-close-btn">Fechar</button>
        `;
      } else {
        actionsHtml = `
          <button class="wishlist-custom-modal-btn primary" id="wishlist-modal-close-btn">Ok</button>
        `;
      }

      modal.innerHTML = `
        <div class="wishlist-custom-modal-overlay"></div>
        <div class="wishlist-custom-modal-box">
          <button class="wishlist-custom-modal-close" id="wishlist-modal-top-close">&times;</button>
          <p class="wishlist-custom-modal-message">${message}</p>
          <div class="wishlist-custom-modal-actions">
            ${actionsHtml}
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Trigger reflow para transição suave
      modal.offsetHeight;
      modal.classList.add('show');

      const closeModal = () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
      };

      // Event listeners
      modal.querySelector('.wishlist-custom-modal-overlay').addEventListener('click', closeModal);
      modal.querySelector('#wishlist-modal-top-close').addEventListener('click', closeModal);
      
      const closeBtn = modal.querySelector('#wishlist-modal-close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
      }

      const undoBtn = modal.querySelector('#wishlist-modal-undo-btn');
      if (undoBtn) {
        undoBtn.addEventListener('click', () => {
          if (this.lastRemovedItem) {
            this.toggleFavorite(this.lastRemovedItem, true);
          }
          closeModal();
        });
      }
      
      // Fecha automaticamente após 4 segundos se não for login
      if (options.type !== 'login') {
        if (this.modalTimeout) clearTimeout(this.modalTimeout);
        this.modalTimeout = setTimeout(closeModal, 4000);
      }
    },

    showToast: function (message, allowUndo = false) {
      this.showModal(message, { allowUndo: allowUndo });
    },

    // ─── Renderização Dinâmica de Página ───
    renderSharedWishlistPage: function (sharedHash, sharedFavorites) {
      const container = document.querySelector('#wishlist-container') || document.querySelector('main');
      if (!container) return;

      if (!sharedFavorites || sharedFavorites.length === 0) {
        container.innerHTML = `
          <div class="wishlist-page-empty">
            <h2>Lista de Desejos Vazia</h2>
            <p>Esta lista compartilhada não possui nenhum produto salvo.</p>
            <a href="/" class="btn-back">Ir para a Loja</a>
          </div>
        `;
        return;
      }

      let gridHtml = '<div class="wishlist-grid-saas">';
      sharedFavorites.forEach(product => {
        const formattedPrice = product.price && parseFloat(product.price) > 0 
          ? parseFloat(product.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) 
          : '';

        gridHtml += `
          <div class="wishlist-item-saas">
            <div class="image-wrapper">
              <img src="${product.image}" alt="${product.name}" />
            </div>
            <h3>${product.name}</h3>
            ${formattedPrice ? `<p class="wishlist-item-price">${formattedPrice}</p>` : '<p class="wishlist-item-price-empty"></p>'}
            <a href="${product.url}" class="btn-view">Ver Produto</a>
          </div>
        `;
      });
      gridHtml += '</div>';

      container.innerHTML = `
        <div class="wishlist-wrapper-saas">
          <h1 style="font-size: 28px; margin-bottom: 8px;">Lista de Desejos Compartilhada</h1>
          <p style="font-size: 13px; color: var(--oli-color-text-secondary); margin-bottom: 24px;">Você está visualizando a lista de favoritos compartilhada.</p>
          ${gridHtml}
        </div>
      `;
    },

    renderWishlistPage: function () {
      const container = document.querySelector('#wishlist-container') || document.querySelector('main');
      if (!container) return;

      if (!this.isLoggedIn || !this.customerHash) {
        container.innerHTML = `
          <div class="wishlist-page-empty">
            <h2>Acesso Restrito</h2>
            <p>Para visualizar e gerenciar sua lista de desejos, por favor faça login em sua conta.</p>
            <a href="/entrar" class="btn-back">Entrar na minha Conta</a>
          </div>
        `;
        return;
      }

      if (this.favorites.length === 0) {
        container.innerHTML = `
          <div class="wishlist-page-empty">
            <h2>Sua lista de desejos está vazia</h2>
            <p>Navegue pela loja e adicione itens para salvar seus favoritos.</p>
            <a href="/" class="btn-back">Voltar para a Loja</a>
          </div>
        `;
        return;
      }

      // Evita renderização inteira se o número de elementos bater para evitar piscada (CLS)
      const currentItems = container.querySelectorAll('.wishlist-item-saas');
      if (currentItems.length === this.favorites.length) {
        return; // UI já está sincronizada
      }

      let gridHtml = '<div class="wishlist-grid-saas">';
      this.favorites.forEach(product => {
        const formattedPrice = product.price && parseFloat(product.price) > 0 
          ? parseFloat(product.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) 
          : '';

        gridHtml += `
          <div class="wishlist-item-saas" data-product-card-id="${product.id}">
            <div class="image-wrapper">
              <img src="${product.image}" alt="${product.name}" />
              <button class="btn-remove" data-remove-id="${product.id}" aria-label="Remover ${product.name} dos favoritos">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <h3>${product.name}</h3>
            ${formattedPrice ? `<p class="wishlist-item-price">${formattedPrice}</p>` : '<p class="wishlist-item-price-empty"></p>'}
            <a href="${product.url}" class="btn-view">Ver Produto</a>
          </div>
        `;
      });
      gridHtml += '</div>';

      container.innerHTML = `
        <div class="wishlist-wrapper-saas">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; flex-wrap: wrap; gap: 16px;">
            <h1 style="margin: 0;">Minha Lista de Desejos</h1>
            <div class="wishlist-share-container" style="display: flex; gap: 8px;">
              <button class="btn-share-wishlist copy" id="btn-wishlist-share-copy">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                Copiar Link
              </button>
              <button class="btn-share-wishlist whatsapp" id="btn-wishlist-share-wa">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.665.988 3.311 1.485 5.372 1.486 5.482.002 9.943-4.456 9.947-9.936.002-2.654-1.029-5.148-2.902-7.025C17.186 1.8 14.698 1.099 12.01 1.099 6.53 1.099 2.07 5.56 2.067 11.04c-.001 2.005.508 3.96 1.47 5.634L2.57 20.89l4.077-1.736zM17.487 14.39c-.298-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
                WhatsApp
              </button>
            </div>
          </div>
          ${gridHtml}
        </div>
      `;

      // Adiciona listener para exclusão com animação de colapso físico (Fade & Collapse)
      container.querySelectorAll('[data-remove-id]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          // Garante a obtenção do ID correto mesmo se o clique for no SVG interno
          const target = e.target.closest('[data-remove-id]');
          if (!target) return;
          const id = target.getAttribute('data-remove-id');
          const card = container.querySelector(`[data-product-card-id="${id}"]`);
          const product = this.favorites.find(item => item.id == id);

          if (card && product) {
            // Animação de colapso físico
            card.classList.add('is-collapsing');

            // Aguarda a transição de CSS finalizar antes de atualizar o estado físico
            setTimeout(() => {
              this.toggleFavorite(product);
            }, 350); // Deve bater com a velocidade da transição --oli-transition-slow
          }
        });
      });

      // Listeners de compartilhamento
      const copyBtn = container.querySelector('#btn-wishlist-share-copy');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          const shareUrl = `${window.location.origin}/wishlist?shared=${this.customerHash || 'guest'}`;
          navigator.clipboard.writeText(shareUrl).then(() => {
            this.showToast('Link de compartilhamento copiado!');
          }).catch(err => {
            console.error('Erro ao copiar link', err);
          });
        });
      }

      const waBtn = container.querySelector('#btn-wishlist-share-wa');
      if (waBtn) {
        waBtn.addEventListener('click', () => {
          const shareUrl = `${window.location.origin}/wishlist?shared=${this.customerHash || 'guest'}`;
          const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent('Dê uma olhada na minha lista de desejos de favoritos: ' + shareUrl)}`;
          window.open(waUrl, '_blank');
        });
      }
    },

    // ─── Inicializador ───
    init: async function () {
      this.injectStyles();
      await this.loadConfig();

      // Verifica se está visualizando uma lista compartilhada
      const urlParams = new URLSearchParams(window.location.search);
      const sharedHash = urlParams.get('shared');
      if (sharedHash && (window.location.pathname === '/wishlist' || window.location.pathname === '/p/wishlist')) {
        try {
          const res = await fetch(`${APP_URL}/api/favorites?shop=${this.shopDomain}&customer_hash=${sharedHash}`);
          if (res.ok) {
            const data = await res.json();
            this.renderSharedWishlistPage(sharedHash, data.favorites || []);
            return;
          }
        } catch (e) {
          console.error('Wishlist Widget: erro ao carregar lista compartilhada', e);
        }
      }

      await this.checkLogin();
      await this.loadFavorites();
      this.injectProductCardButtons();
      this.updateUI();

      // Observador de mutações para scroll infinito nas vitrines
      const observer = new MutationObserver(() => this.injectProductCardButtons());
      observer.observe(document.body, { childList: true, subtree: true });
    }
  };

  // Inicializa o script
  document.addEventListener('DOMContentLoaded', () => Wishlist.init());
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    Wishlist.init();
  }
})();

