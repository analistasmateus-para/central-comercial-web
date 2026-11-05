# Central Comercial — Aplicativo
Interface inicial React + Vite com autenticação Google (Firebase). Nenhum dado privado é armazenado no frontend.

## Desenvolvimento
1. `npm install`
2. Copie `.env.example` para `.env` e configure o Firebase e a URL do Worker.
3. `npm run dev`

## Publicação
Configure `Settings > Pages > Source: GitHub Actions`. Em `Settings > Secrets and variables > Actions > Variables`, cadastre todas as variáveis VITE_ do `.env.example`. Adicione o domínio do GitHub Pages aos domínios autorizados do Firebase Authentication. A API deve permitir o domínio do site via CORS.

**Estado:** interface de consulta inicial; CRM, propostas, relatórios gerais e geração de PDF ainda não implementados. Não conceda acesso antes de concluir e testar autorização e escopo dos dados.
