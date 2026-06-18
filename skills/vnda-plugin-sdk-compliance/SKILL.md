---
name: vnda-plugin-sdk-compliance
description: >-
  Regras de conformidade técnica para desenvolvimento de plugins na Vnda/Olist.
  Garante segurança, performance de script e renderização sem CLS.
---

# Conformidade com Vnda Plugin SDK

## Visão Geral
Esta skill detalha os critérios de aceitação técnica e arquitetura de integração necessários para que o plugin de Wishlist funcione perfeitamente no ecossistema e-commerce da Vnda/Olist.

## Diretrizes Técnicas

### 1. Injeção de Scripts (Script Tags)
- **Desempenho:** Todo script frontend inserido na loja Vnda deve ser carregado com o atributo `defer` ou `async` para não bloquear a renderização crítica do HTML da loja.
- **Tamanho do Pacote:** O bundle de produção do widget de favoritos no front-end não deve ultrapassar `15KB` gzipped para preservar a pontuação de Core Web Vitals da loja do cliente.

### 2. Prevenção de Cumulative Layout Shift (CLS)
- **Placeholder Estático:** Ao renderizar botões de favoritos em listagens de produtos ou páginas de detalhes de produto (PDP), reserve o espaço ocupado pelo botão previamente na folha de estilos (CSS) da loja. Evite injeções tardias de JS que empurram os elementos da página (mantenha CLS < 0.1).

### 3. Autenticação e Segurança da API
- **Contexto do Usuário:** Para ações que salvam favoritos no banco de dados, verifique sempre a integridade da sessão do cliente autenticado na plataforma Vnda.
- **Segurança:** O backend do plugin deve autenticar chamadas utilizando os tokens JWT fornecidos pelo SDK da Vnda ou tokens de API seguros (App Tokens) nas rotas administrativas do admin.

### 4. Rotas e Middlewares (Padrão de Servidor)
- As rotas públicas expostas pelo plugin devem ser prefixadas com `/webhooks/vnda/*` ou `/api/vnda/*` para facilitar o roteamento transparente.
- Use tratamento adequado de CORS apenas para os domínios autorizados da loja Vnda parceira.

### 5. Boas Práticas do SDK
- Siga estritamente o fluxo de instalação e desinstalação de aplicativos da Vnda APP Store, garantindo a remoção completa de webhooks e scripts da loja do lojista quando o aplicativo for desinstalado.
