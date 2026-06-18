---
name: ui-ux-pro-max
description: >-
  Inteligência de design UI/UX adaptada em Português para web e mobile.
  Inclui regras de acessibilidade, tipografia, cores, animações e checklists de qualidade.
---

# UI/UX Pro Max - Inteligência de Design

Guia completo de design para interfaces web e mobile. Contém diretrizes de acessibilidade, paletas de cores harmônicas, combinações tipográficas, animações fluidas e controle de qualidade de UX para eliminar designs genéricos ou robóticos.

## Quando Aplicar

Esta Skill deve ser utilizada em qualquer tarefa que envolva a **estrutura da interface, decisões visuais, padrões de interação ou qualidade da experiência do usuário**.

### Uso Obrigatório:
- Criação e estilização de novos componentes (botões, modais, formulários, tabelas, cabeçalhos, etc.).
- Definição de paletas de cores, sistemas de tipografia e espaçamento.
- Revisão de código frontend focando em experiência do usuário e acessibilidade.
- Implementação de layouts responsivos e transições de tela.

---

## Categorias de Regras por Prioridade

| Prioridade | Categoria | Impacto | Verificações Principais (Obrigatório) | Padrões a Evitar (Anti-patterns) |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Acessibilidade | CRÍTICO | Contraste de texto 4.5:1, navegação via teclado, leitores de tela (ARIA) | Remover anéis de foco, botões de ícone sem etiqueta (label) |
| **2** | Toque e Interação | CRÍTICO | Área de toque mínima de 44x44px, espaçamento adequado, feedbacks instantâneos | Dependência exclusiva de estados de hover |
| **3** | Performance | ALTO | Imagens otimizadas (WebP), carregamento tardio, sem Layout Shift (CLS) | Mudanças bruscas de posição ao carregar elementos tardiamente |
| **4** | Estilo e Coesão | ALTO | Consistência visual, uso de ícones em vetor (SVG) e não emojis | Mistura aleatória de estilos (flat, skeuomorphic, glassmorphism) |
| **5** | Responsividade | ALTO | Breakpoints lógicos, textos legíveis no mobile, sem rolagem horizontal | Largura fixa em pixels, desativação de zoom do usuário |
| **6** | Tipografia e Cores | MÉDIO | Hierarquia clara, fontes adequadas (ex: Inter, Outfit), cores semânticas | Textos menores que 12px, cinza claro sobre fundo branco |
| **7** | Animação | MÉDIO | Duração de 150-300ms, movimento intuitivo e consistente | Animações puramente decorativas, lentidão exagerada (>500ms) |
| **8** | Formulários | MÉDIO | Rótulos visíveis acima dos campos, mensagens de erro próximas, validação suave | Apenas placeholder servindo como rótulo, erros genéricos |

---

## Referência Rápida de Boas Práticas

### Acessibilidade (A11y)
- **Contraste:** Garanta que todas as combinações de texto e fundo atinjam no mínimo a proporção de 4.5:1.
- **Foco Visual:** Elementos interativos ativados via teclado devem ter anéis de foco claros e de alto contraste.
- **Aria-Labels:** Adicione tags ARIA descritivas para qualquer elemento interativo baseado puramente em ícones.

### Toque e Usabilidade Mobile
- **Tamanho dos Alvos:** Elementos clicáveis devem ter pelo menos `44px` por `44px`. Caso o ícone visual seja menor, aumente a área interna de padding ou use atributos de expansão.
- **Espaço Mínimo:** Mantenha um espaçamento mínimo de `8px` entre diferentes botões interativos para evitar cliques errados.

### Layout e Spacing System
- **Escala de Espaçamento:** Baseie as dimensões e margens em múltiplos de `4px` e `8px` para criar ritmo visual coerente.
- **Largura Máxima:** Em telas grandes de desktop, utilize containers com largura máxima de `1200px` ou `1440px` com margens automáticas nas laterais para que a leitura continue centralizada e confortável.

### Animações Fluidas
- **Efeito Mola (Spring):** Use curvas de aceleração naturais (ex: `cubic-bezier(0.175, 0.885, 0.32, 1.275)`) para popups, modais e transições ativas.
- **Não Bloqueante:** A animação nunca deve impedir a ação do usuário; se ele clicar para fechar durante uma animação de abertura, a transição deve ser interrompida imediatamente.
