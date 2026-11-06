# Diagnóstico de autenticação da Central Comercial

1. No repositório central-comercial-web, atualize apenas os arquivos `central-comercial-web/src/api.js` e `central-comercial-web/src/main.jsx` com os arquivos correspondentes deste pacote. Preserve `.github/workflows/pages.yml` e os demais arquivos.
2. Em GitHub > Settings > Secrets and variables > Actions > Variables, confirme que `VITE_API_URL` é `https://central-comercial-api.analistas-mateus.workers.dev` (sem barra final).
3. Faça commit na branch `main` e aguarde o workflow `Publicar Central Comercial` ficar verde.
4. Abra `https://analistasmateus-para.github.io/central-comercial-web/` e entre com a mesma conta Google cadastrada no Supabase.
5. Informe a mensagem exibida. Não copie nem envie tokens Firebase, chaves ou credenciais.

Se `/api/me` funcionar mas o módulo mostrar `API HTTP 404`, significa que a autenticação passou e a rota de relatórios ainda não está implementada. Não significa falha de login.
