# Zion AI

> Um workspace de agente de IA para planejar, construir e lançar produtos — com uma arquitetura preparada para serviços com camada gratuita.

## O que já funciona

- **Interface de agente completa**: chat persistido no navegador, atalhos de começo, estados de raciocínio, painel de contexto e design responsivo.
- **Gateway de IA no servidor**: a chave nunca vai ao navegador. O app chama `POST /api/chat`, e o servidor conversa com o provedor selecionado.
- **OpenRouter ou Groq**: configuração via variáveis de ambiente e seleção no workspace.
- **Modo de demonstração útil**: sem chave configurada, o app explica como conectar um modelo e mantém a interface testável; ele não finge que gerou uma resposta por IA.
- **Base para memória no Supabase**: `supabase/schema.sql` cria conversas, mensagens, índices e políticas RLS por usuário.
- **Stack gratuita documentada**: o painel aponta opções para inferência, banco, RAG, edge e CI.

> O Zion é um ponto de partida de produto, não uma cópia de um modelo proprietário. Para obter respostas de um LLM real, conecte uma chave de provedor no servidor.

## Início rápido

### 1. Instale e rode

```bash
npm install
cp .env.example .env
npm run dev
```

Abra a URL mostrada pelo Vite (normalmente `http://localhost:5173`). O Vite encaminha `/api/*` para a API local na porta `8787`.

### 2. Escolha um provedor

Edite `.env` com **uma** das chaves abaixo e reinicie `npm run dev`.

```dotenv
# Opção A — gateway com modelos gratuitos disponíveis
OPENROUTER_API_KEY=sk-or-...

# Opção B — inferência rápida
# GROQ_API_KEY=gsk_...
```

A interface mostra se o provedor está conectado. As chaves são lidas apenas por `server.mjs`; não use prefixos como `VITE_` para segredos.

### 3. (Opcional) adicione memória persistente

1. Crie um projeto no Supabase.
2. No **SQL Editor**, execute [`supabase/schema.sql`](supabase/schema.sql).
3. Adicione sua camada de autenticação e conecte os inserts de conversas/mensagens à API server-side.

O schema vem com Row Level Security: cada pessoa só acessa as suas próprias conversas e mensagens.

## Aplicativo Android (APK)

O Zion também é um aplicativo Android nativo via **Capacitor 7**. O código web é empacotado no APK, portanto a mesma interface funciona no navegador e no telefone.

### Gerar um APK de teste

Pré-requisitos locais: Node 22+, JDK 21 e Android SDK com API 35.

```bash
npm install
npm run apk:debug
```

O arquivo instalável de teste será criado em:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

`npm run android:sync` recompila o frontend e copia os arquivos atualizados para o projeto Android. Para abrir o projeto nativo no Android Studio:

```bash
npm run android:open
```

Há também um workflow de GitHub Actions que monta o APK de teste e o publica como artefato **zion-ai-debug-apk** a cada push/PR. Um APK `debug` pode ser instalado para testes, mas uma publicação na Play Store exige assinatura de release e uma chave que não deve ser versionada.

### Conectar o APK à IA

O APK nunca recebe chaves de OpenRouter ou Groq. Publique `server.mjs` em uma URL HTTPS, guarde as chaves nesse servidor e configure a URL pública em **Configurações** dentro do app. Alternativamente, defina no momento do build:

```dotenv
VITE_API_BASE_URL=https://api.seu-dominio.example
APP_ALLOWED_ORIGINS=https://app.seu-dominio.example,capacitor://localhost
```

Sem uma URL de API, o aplicativo inicia em modo demonstração local de forma segura. A API aceita a origem `capacitor://localhost` e `https://localhost` para o WebView Android, além das origens explícitas em `APP_ALLOWED_ORIGINS`.

## Arquitetura

```text
Navegador (React + Vite)
        │  requisição relativa /api/chat
        ▼
API privada (Node HTTP)
        │  chave de servidor
        ├── OpenRouter ── modelos abertos / gratuitos
        └── Groq ─────── inferência de baixa latência

Supabase (opcional): Auth + Postgres + memória de conversas
Brave Search API (próxima integração): pesquisa e contexto para RAG
Cloudflare Workers (próxima implantação): edge/API
GitHub Actions (próxima automação): testes e deploy
```

### Rotas

| Método | Rota | Finalidade |
|---|---|---|
| `GET` | `/api/health` | Mostra quais provedores foram configurados, sem expor chaves. |
| `POST` | `/api/chat` | Recebe `{ provider, messages }` e devolve a resposta do agente. |

A API limita o corpo a 1 MB, restringe papéis de mensagem, preserva apenas o contexto recente e não envia a chave ao cliente.

## Catálogo de serviços acessíveis

A seleção inicial foi desenhada a partir do excelente repositório [ripienaar/free-for-dev](https://github.com/ripienaar/free-for-dev), uma lista comunitária de ofertas com tiers gratuitos para desenvolvedores. A disponibilidade e as cotas mudam; confirme os detalhes e a elegibilidade diretamente em cada fornecedor antes de lançar.

| Necessidade | Serviço sugerido | Papel no Zion |
|---|---|---|
| Modelos | [OpenRouter](https://openrouter.ai/) | Gateway para testar modelos, incluindo opções gratuitas quando disponíveis. |
| Inferência de baixa latência | [GroqCloud](https://console.groq.com/) | Alternativa de execução de modelos abertos. |
| Dados e identidade | [Supabase](https://supabase.com/) | Auth, Postgres, storage e memória de conversa. |
| Pesquisa/RAG | [Brave Search API](https://brave.com/search/api/) | Contexto recente e pesquisável para o agente. |
| API/edge | [Cloudflare Workers](https://workers.cloudflare.com/) | Borda e rotas de API na implantação. |
| Código e CI | [GitHub](https://github.com/) | Repositório, automações e revisão. |

O `free-for-dev` também lista o **Brave Search API** para contexto de agentes e RAG, o **GitHub** para repositórios/CI, e diversas opções de dados e deployment. Este projeto apenas se inspira na curadoria; não é afiliado ao repositório nem aos provedores acima.

## Próximas evoluções recomendadas

1. **Autenticação real** — conectar Supabase Auth e trocar o armazenamento local por chamadas autenticadas à API.
2. **Ferramentas com confirmação** — implementar pesquisa, leitura de arquivos e ações externas com permissões explícitas, logs e limites por usuário.
3. **RAG seguro** — indexar apenas fontes autorizadas, armazenar citações, e incluir links de origem na resposta.
4. **Rate limiting e observabilidade** — limite por usuário/IP, métricas de custo/latência e alertas de erro antes do lançamento público.
5. **Streaming** — substituir a resposta única por SSE para tokens progressivos, preservando cancelamento e tratamento de falha.
6. **Deploy** — colocar a API em um ambiente server-side (por exemplo, Worker com secrets) e configurar `PUBLIC_APP_URL`.

## Desenvolvimento

```bash
npm run check   # build de produção
npm run build   # gera dist/
npm start       # somente a API na porta 8787
```

## Segurança

- `.env` está no `.gitignore`; nunca faça commit de chaves.
- Não permita que o cliente escolha endpoint, modelo arbitrário ou credenciais.
- Antes de ativar ferramentas externas, implemente allowlists, confirmação humana e auditoria.
- Configure CORS para o domínio real na produção; as permissões atuais atendem desenvolvimento local e preview da Arena.

## Licença

Ainda não definida. Escolha uma licença antes de disponibilizar o projeto publicamente.
