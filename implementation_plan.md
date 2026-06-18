# Plano de Implementação: Agentes e Skills Premium para Wishlist Olist/Vnda

Este plano detalha a criação de um plugin de agente de altíssimo nível para o desenvolvimento da Wishlist premium na plataforma Olist/Vnda, blindando-o contra "vicios de IA" através de diretrizes de UX de elite e integração com o Design System da Olist.

## Análise de Requisitos e Abordagem

O objetivo é criar 5 skills personalizadas dentro de um novo plugin chamado `vnda-wishlist-helper` em `C:\Users\svena\.gemini\config\plugins\vnda-wishlist-helper`:

1. **`vnda-design-system-tokens`**: Mapeamento completo dos tokens de design oficiais da Olist/Vnda (Base Tokens, Theme Tokens e Component Tokens) conforme `https://designsystem.olist.io`.
2. **`micro-interactions-overrides`**: Regras para micro-animações, estados de hover e transições fluidas que eliminam comportamentos robóticos.
3. **`ecommerce-ux-heuristics`**: Heurísticas e boas práticas focadas em wishlists (retencão de clientes, acessibilidade, facilidade de uso, etc.).
4. **`vnda-plugin-sdk-compliance`**: Garantias de conformidade técnica e arquitetural com o SDK de Plugins da Vnda/Olist.
5. **`ui-ux-pro-max`**: Clone adaptado e traduzido do repositório `nextlevelbuilder/ui-ux-pro-max-skill`.

## Arquitetura do Plugin

O novo plugin será estruturado como:
```
C:\Users\svena\.gemini\config\plugins\vnda-wishlist-helper/
├── plugin.json
└── skills/
    ├── vnda-design-system-tokens/
    │   └── SKILL.md
    ├── micro-interactions-overrides/
    │   └── SKILL.md
    ├── ecommerce-ux-heuristics/
    │   └── SKILL.md
    ├── vnda-plugin-sdk-compliance/
    │   └── SKILL.md
    └── ui-ux-pro-max/
        └── SKILL.md
```

---

## Perguntas Abertas

> [!NOTE]
> 1. Existe alguma especificação de cores primárias ou secundárias customizadas que você deseja reforçar além do padrão da Olist (coral, azul escuro, cinzas neutros)?
> 2. O plugin da Wishlist usará React/Next.js ou HTML/JS puro? (As heurísticas e tokens serão otimizados para essa escolha).

---

## Proposta de Alterações

### [Novo Plugin `vnda-wishlist-helper`]

#### [NEW] [plugin.json](file:///C:/Users/svena/.gemini/config/plugins/vnda-wishlist-helper/plugin.json)
Arquivo de configuração do plugin registrando os detalhes do autor, versão e metadados.

#### [NEW] [vnda-design-system-tokens/SKILL.md](file:///C:/Users/svena/.gemini/config/plugins/vnda-wishlist-helper/skills/vnda-design-system-tokens/SKILL.md)
Documentação dos tokens do Olist Design System (Base, Theme, Component), paleta de cores primária, secundária, cinzas e escala de espaçamento (4pt/8dp).

#### [NEW] [micro-interactions-overrides/SKILL.md](file:///C:/Users/svena/.gemini/config/plugins/vnda-wishlist-helper/skills/micro-interactions-overrides/SKILL.md)
Diretrizes e trechos de código/CSS para transições fluidas, micro-efeitos ao adicionar/remover itens, animações do coração (wishlist button) e feedback visual sem layout shifts.

#### [NEW] [ecommerce-ux-heuristics/SKILL.md](file:///C:/Users/svena/.gemini/config/plugins/vnda-wishlist-helper/skills/ecommerce-ux-heuristics/SKILL.md)
Heurísticas de experiência de compra: permanência do usuário, estado vazio atrativo, facilidade de compartilhamento de wishlist e prevenção de atritos na jornada de compra.

#### [NEW] [vnda-plugin-sdk-compliance/SKILL.md](file:///C:/Users/svena/.gemini/config/plugins/vnda-wishlist-helper/skills/vnda-plugin-sdk-compliance/SKILL.md)
Regras de segurança, autenticação, desempenho de carregamento de scripts terceiros na Vnda (evitando CLS na renderização da loja) e padrões de API do plugin.

#### [NEW] [ui-ux-pro-max/SKILL.md](file:///C:/Users/svena/.gemini/config/plugins/vnda-wishlist-helper/skills/ui-ux-pro-max/SKILL.md)
Tradução e adaptação completa da inteligência de UI/UX Pro Max para o idioma Português (PT-BR), fornecendo referências de estilos, acessibilidade e stacks.

---

## Plano de Verificação

### Testes Manuais
- Verificar a criação correta de todos os arquivos de skills no diretório de destino.
- Confirmar se o agente consegue carregar e interpretar as novas skills.
