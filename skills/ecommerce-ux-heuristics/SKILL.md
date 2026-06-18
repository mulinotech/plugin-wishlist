---
name: ecommerce-ux-heuristics
description: >-
  Regras de ouro de UX para e-commerce aplicadas a listas de desejos (Wishlist).
  Foca em persistência, conversão e redução de atrito.
---

# Heurísticas de UX para E-commerce (Wishlist)

## Visão Geral
Esta skill descreve heurísticas de usabilidade e fluxos de experiência focados em maximizar a conversão e o engajamento através da Wishlist nas lojas Olist/Vnda.

## Heurísticas Principais para Wishlist Premium

### 1. Persistência de Dados (Guest Wishlist)
- **Regra:** O usuário deve conseguir favoritar itens sem precisar fazer login imediatamente.
- **Implementação:** Armazene a lista temporária no `localStorage` ou em cookies seguros. Quando o usuário realizar o login ou cadastro, sincronize automaticamente a wishlist local com o banco de dados da plataforma Vnda.

### 2. Visibilidade do Estado do Sistema
- **Regra:** Sempre mostre se um produto está favoritado ou não de forma inequívoca em qualquer parte da loja (carrosséis, listagens de busca, página de produto).
- **Badge do Cabeçalho:** O cabeçalho da loja deve conter o ícone da Wishlist com uma badge dinâmica indicando a quantidade de itens salvos (ex: ❤️ `3`).

### 3. Prevenção de Erros e Recuperação
- **Regra:** A remoção acidental de um produto da wishlist deve ser facilmente revertida.
- **Implementação:** Ao remover um item, exiba um toast com uma opção clara de "Desfazer" (Undo).

### 4. Estado Vazio Engajador (Empty State Affordance)
- **Regra:** Nunca exiba apenas uma tela em branco ou a mensagem "Sua lista está vazia" sem um direcionador de ação.
- **Implementação:** O estado vazio da Wishlist deve conter:
  - Uma ilustração minimalista premium e agradável.
  - Um texto convidativo ("Sua lista de desejos está esperando por você").
  - Um botão de chamada para ação (CTA) claro para "Continuar Comprando" ou sugestões/carrosséis de produtos mais vendidos.

### 5. Compartilhamento Social Simples
- **Regra:** Permitir que o usuário compartilhe sua lista com amigos ou familiares de forma direta.
- **Implementação:** Botão para "Copiar link da lista" ou compartilhar diretamente via WhatsApp/Redes sociais com mensagens customizadas.

### 6. Integração Rápida com o Carrinho (Quick Buy)
- **Regra:** Facilitar a compra de um item favoritado diretamente da lista.
- **Implementação:** Cada card na página de Wishlist deve ter um botão secundário ou principal "Adicionar ao Carrinho" que não redirecione o usuário de página (use requisições assíncronas/AJAX).
