---
name: micro-interactions-overrides
description: >-
  Diretrizes de animações e micro-interações para botões, listas e estados da Wishlist.
  Evita efeitos genéricos de IA e garante suavidade no clique.
---

# Micro-Interactions Overrides (Wishlist)

## Visão Geral
Esta skill orienta a implementação de transições, feedbacks táteis de clique e animações de estado para o botão e container de Wishlist, superando os layouts robóticos tradicionais gerados por IA.

## Diretrizes de Micro-animações

### 1. Efeito do Botão de Coração (Toggle Wishlist)
Ao clicar no ícone de coração, a transição não deve ser uma simples mudança de cor instantânea. Deve seguir o padrão de física elástica (spring physics):
- **Ao clicar/adicionar:**
  - Aplique um scale elástico (`scale(1.3)`) com duração de 250ms e curva de aceleração `cubic-bezier(0.175, 0.885, 0.32, 1.275)` (efeito mola).
  - Preenchimento gradativo do coração de baixo para cima usando SVG clip-path ou mudança suave de opacidade no preenchimento.
- **Ao remover:**
  - Redução suave de escala (`scale(0.85)`) e retorno ao estado original outline com transição de opacidade do preenchimento.

### 2. Feedback de Toast no Canto da Tela
O toast de confirmação ("Produto adicionado aos favoritos") deve respeitar a fluidez espacial:
- **Entrada:** Slide-in a partir da direita ou de baixo, com aceleração suave e `translateY` de 20px para 0px.
- **Saída:** Desvanecimento suave (opacity 0) e translate acelerado em 150ms.
- **Física:** Use `cubic-bezier(0.4, 0, 0.2, 1)`.

### 3. Remoção Física da Wishlist Page (Fade & Collapse)
Quando o usuário remove um produto diretamente da página de Wishlist:
1. **Fase 1 (Opacidade):** Reduzir a opacidade do card para `0` em 200ms.
2. **Fase 2 (Colapso de Espaço):** Reduzir a largura ou altura do container para `0` em 300ms, permitindo que os cards vizinhos deslizem suavemente para ocupar o espaço vazio, sem saltos bruscos na tela (evita Cumulative Layout Shift).

## Exemplo CSS de Micro-interações Premium

```css
/* Botão de coração com efeito de mola */
.wishlist-heart-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: var(--oli-spacing-xs);
  transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), color 0.2s ease;
}

.wishlist-heart-btn:active {
  transform: scale(0.85);
}

.wishlist-heart-btn.is-active {
  transform: scale(1.25);
  animation: heart-pop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes heart-pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.4); }
  100% { transform: scale(1.25); }
}

/* Transição do preenchimento do SVG */
.wishlist-heart-btn svg path {
  transition: fill 0.3s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.2s ease;
}
```
