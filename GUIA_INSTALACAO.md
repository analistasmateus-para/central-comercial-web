# Guia de implantação — Central Comercial

## 1. Criar repositórios
Acesse https://github.com/new e crie:
- `central-comercial-web`: **Public**
- `central-comercial-dados`: **Private**
- `central-comercial-admin`: **Private**

Para cada um, escolha **não** criar README, licença ou .gitignore, pois os ZIPs já possuem os arquivos necessários. Extraia o ZIP correspondente. Envie os arquivos pelo botão **Add file > Upload files**, mantendo as pastas, ou utilize Git local:
```bash
git init
git branch -M main
git add .
git commit -m "Estrutura inicial da Central Comercial"
git remote add origin https://github.com/SEU_USUARIO/NOME_REPOSITORIO.git
git push -u origin main
```

## 2. Subir bases Excel
No repositório **privado** de dados, envie:
- `bases/alimento/painel.xlsx` (arquivo PAINEL ALIMENTO.xlsx)
- `bases/alimentos-mais/painel.xlsx` (arquivo PAINEL ALIMENTOS MAIS.xlsx)
- `bases/bazar/painel.xlsx` (arquivo PAINEL BAZAR(1).xlsx)

A importação automática **ainda não está ativada**: o workflow inspeciona as abas e a carga permanece bloqueada até validarmos os mapeamentos.

## 3. Firebase
Acesse https://console.firebase.google.com, crie projeto e app web. Em Authentication > Sign-in method, habilite **Google** e **Email/Password**. Configure os domínios autorizados, incluindo o endereço GitHub Pages. E-mail/senha será reservado ao administrador, mas a tela administrativa e MFA serão implementados em etapa posterior.

## 4. GitHub Pages
Em `central-comercial-web` > Settings > Pages, selecione **GitHub Actions**. Em Settings > Secrets and variables > Actions > Variables, configure `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`, `VITE_API_URL` conforme `.env.example`. Faça push na branch main. A aplicação será compilada e publicada.

## 5. Backend e banco
Criar Cloudflare Worker, configurar `FIREBASE_PROJECT_ID` e `ALLOWED_ORIGIN` (URL exata do site, sem barra final). A API inicial está escrita para D1, mas o banco acordado é PostgreSQL: **antes de implantar, adaptar o driver da API para Supabase PostgreSQL** e implementar importação validada. Nunca expor a service role key do Supabase no frontend. Se preferir D1, revisar a decisão de banco e criar binding `DB` no Wrangler.

## 6. Verificações obrigatórias
- Sem login: API retorna 401.
- Usuário Google não autorizado: 403.
- Usuário autorizado sem módulo: 403.
- Coordenação fora do escopo: 403.
- Bloqueio de usuário: negar a próxima requisição, mesmo com token Firebase válido.
- Conferir metas, ID FOCO, supervisão e RCA com planilhas originais.
- Percentual de atingimento: `min(100, max(0, 100*real/meta))` para meta > 0; para meta 0/nula, usar nulo.
- Totais não aditivos (mix, positivação): não somar RCAs indiscriminadamente; usar a aba do supervisor.
- Exportação futura: PDF somente, gerado com escopo autorizado no backend.

## 7. Novas Coordenações
Inclua uma pasta `bases/<slug>/painel.xlsx`, cadastre código e caminho em `config/coordenacoes.json`, crie mapeamento específico validado e autorize a Coordenação no painel admin. A interface não precisa de nomes fixos.

## Estado desta entrega
É um **scaffold inicial**, não um produto pronto. A interface e a autenticação Google podem ser testadas após configurar o Firebase; a API não libera dados sem banco e autorização. O painel admin, a carga XLSX, os demais módulos e o PDF são etapas futuras.
