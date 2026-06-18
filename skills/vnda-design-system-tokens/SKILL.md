---
name: vnda-design-system-tokens
description: >-
  Tokens de design oficiais do Olist Design System (designsystem.olist.io) adaptados
  para e-commerce Vnda. Gerencia Base, Theme e Component Tokens.
---

# Tokens do Olist Design System (Vnda Wishlist)

## Visão Geral
Esta skill fornece acesso estruturado e diretrizes para aplicação de design tokens baseados no Olist Design System (https://designsystem.olist.io). A aplicação deve usar a hierarquia estrita de tokens para evitar valores arbitrários (hardcoded hex/pixels).

## Dependências
Nenhuma.

## Hierarquia de Tokens

### 1. Base Tokens
Coleção bruta de opções visuais. Não devem ser usados diretamente nos componentes.
- **Cores Globais (Famílias):**
  - `brand-orange`: `#F26422` (Marca primária)
  - `brand-navy`: `#002244` (Marca secundária)
  - `neutral-dark`: `#1A1A1A` (Textos principais)
  - `neutral-gray-90`: `#333333`
  - `neutral-gray-50`: `#7F7F7F`
  - `neutral-gray-10`: `#F5F5F5` (Fundo alternativo)
  - `neutral-light`: `#FFFFFF` (Superfícies)
- **Espaçamento Base:**
  - Incrementos de `4px` e `8px` (`spacing-xs: 4px`, `spacing-sm: 8px`, `spacing-md: 16px`, `spacing-lg: 24px`, `spacing-xl: 32px`).
- **Tipografia Base:**
  - Fontes: `Outfit` (Headings) e `Inter` (Body).

### 2. Theme Tokens (Semântica)
Definem o papel de uma cor ou valor na interface.
- **UI Colors:**
  - `color-background-default`: `neutral-light` (`#FFFFFF`)
  - `color-background-muted`: `neutral-gray-10` (`#F5F5F5`)
  - `color-text-primary`: `neutral-dark` (`#1A1A1A`)
  - `color-text-secondary`: `neutral-gray-50` (`#7F7F7F`)
  - `color-action-primary`: `brand-orange` (`#F26422`)
  - `color-action-secondary`: `brand-navy` (`#002244`)
  - `color-feedback-error`: `#E53935`
  - `color-feedback-success`: `#4CAF50`

### 3. Component Tokens
Tokens mapeados especificamente para componentes do Wishlist.
- **Wishlist Button (Coração):**
  - `wishlist-btn-icon-empty`: `neutral-gray-50`
  - `wishlist-btn-icon-filled`: `brand-orange` (ou vermelho de feedback conforme o tema da loja)
  - `wishlist-btn-bg`: `transparent`
- **Wishlist Badge:**
  - `wishlist-badge-bg`: `brand-orange`
  - `wishlist-badge-text`: `neutral-light`

## Como Usar
Ao escrever arquivos de CSS ou JS para o plugin da Wishlist:
1. Certifique-se de referenciar variáveis CSS personalizadas (CSS custom properties) baseadas nesta especificação:
   ```css
   :root {
     --oli-color-brand-primary: #F26422;
     --oli-color-brand-secondary: #002244;
     --oli-color-bg-default: #ffffff;
     --oli-color-bg-muted: #f5f5f5;
     --oli-color-text-primary: #1a1a1a;
     --oli-color-text-muted: #7f7f7f;
     --oli-spacing-xs: 4px;
     --oli-spacing-sm: 8px;
     --oli-spacing-md: 16px;
     --oli-spacing-lg: 24px;
     --oli-radius-sm: 4px;
     --oli-radius-md: 8px;
   }
   ```
2. **Evite anti-patterns**: Nunca use hexadecimais puros nos componentes. Sempre utilize as variáveis `--oli-*`.
