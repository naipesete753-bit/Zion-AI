import { createServer } from 'node:http'

const port = Number(process.env.PORT || 8787)
const MAX_BODY_SIZE = 1_000_000
const configuredOrigins = new Set(
  (process.env.APP_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
)

const providers = {
  openrouter: {
    env: 'OPENROUTER_API_KEY',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
  },
  groq: {
    env: 'GROQ_API_KEY',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
  },
}

const systemPrompt = `Você é Zion, um assistente de construção de produtos de IA. Responda em português do Brasil, de forma prática, técnica e honesta. Ajude a projetar, implementar, revisar e evoluir agentes de IA.

Seu ambiente usa uma stack acessível: OpenRouter ou Groq para inferência, Supabase para autenticação e memória, Brave Search API para pesquisa/RAG, Cloudflare Workers para API/edge e GitHub para código/CI. Quando sugerir integrações, explique o que é necessário configurar e avise que planos gratuitos têm limites que devem ser confirmados nos sites oficiais.

Estruture respostas complexas com: decisão recomendada, motivo, etapas concretas, riscos e próximo passo. Quando a mensagem começar com MODO CRIAÇÃO, trabalhe como um agente de produto e engenharia: entregue escopo, arquitetura, modelo de dados, endpoints, árvore de arquivos, código essencial, testes e plano de publicação. Assuma padrões seguros quando não houver decisão bloqueante. Você pode projetar e escrever o conteúdo necessário, mas não diga que criou arquivos, publicou um serviço ou executou ferramentas se isso não ocorreu. Não invente ações que você não executou, não exponha chaves e não diga que consultou a internet se ela não foi fornecida no contexto.`

function json(response, status = 200) {
  return { status, headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify(response) }
}

function isAllowedOrigin(origin) {
  const localOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/
  const previewOrigin = /^https:\/\/\d+-[a-z0-9-]+\.e2b\.app$/
  // Capacitor pode usar capacitor://localhost ou https://localhost no WebView.
  return configuredOrigins.has(origin) || localOrigin.test(origin) || previewOrigin.test(origin) || origin === 'capacitor://localhost'
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = ''
    request.on('data', (chunk) => {
      body += chunk
      if (body.length > MAX_BODY_SIZE) {
        reject(new Error('O corpo da requisição excede 1 MB.'))
        request.destroy()
      }
    })
    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch {
        reject(new Error('JSON inválido.'))
      }
    })
    request.on('error', reject)
  })
}

function getDemoReply(question) {
  const compact = question.trim().replace(/\s+/g, ' ')
  return `**Modo demonstração ativo**\n\nAinda não há uma chave de provedor no servidor, então esta resposta é local. Para transformar o Zion em um agente com modelo real, crie um arquivo \`.env\` a partir de \`.env.example\` e defina \`OPENROUTER_API_KEY\` ou \`GROQ_API_KEY\`.\n\n**Leitura do seu pedido**\n${compact || 'Descreva o que você quer construir.'}\n\n**Caminho recomendado**\n1. Comece com um único caso de uso e uma métrica de sucesso.\n2. Use OpenRouter ou Groq para inferência, sem colocar a chave no navegador.\n3. Persista conversas no Supabase quando precisar de login e memória.\n4. Adicione pesquisa/RAG somente quando houver fontes confiáveis para consultar.\n\nEnvie a mesma pergunta depois de configurar o provedor para receber uma resposta do modelo escolhido.`
}

async function generateAnswer({ messages, providerId }) {
  const provider = providers[providerId] || providers.openrouter
  const key = process.env[provider.env]

  if (!key) {
    const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user')
    return { content: getDemoReply(lastUserMessage?.content || ''), mode: 'demo', provider: providerId }
  }

  const safeMessages = messages
    .filter((message) => ['user', 'assistant'].includes(message?.role) && typeof message?.content === 'string')
    .slice(-16)
    .map((message) => ({ role: message.role, content: message.content.slice(0, 12000) }))

  const headers = {
    authorization: `Bearer ${key}`,
    'content-type': 'application/json',
  }

  if (providerId === 'openrouter') {
    headers['HTTP-Referer'] = process.env.PUBLIC_APP_URL || 'http://localhost:5173'
    headers['X-Title'] = 'Zion AI'
  }

  const upstream = await fetch(provider.endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: provider.model,
      messages: [{ role: 'system', content: systemPrompt }, ...safeMessages],
      temperature: 0.35,
      max_tokens: 1200,
    }),
  })

  if (!upstream.ok) {
    const details = (await upstream.text()).slice(0, 500)
    throw new Error(`O provedor respondeu ${upstream.status}: ${details}`)
  }

  const payload = await upstream.json()
  const content = payload?.choices?.[0]?.message?.content
  if (!content || typeof content !== 'string') {
    throw new Error('O provedor não retornou conteúdo de conversa.')
  }

  return { content, mode: 'live', provider: providerId, model: provider.model }
}

const server = createServer(async (request, response) => {
  const origin = request.headers.origin || ''
  if (origin && isAllowedOrigin(origin)) {
    response.setHeader('access-control-allow-origin', origin)
    response.setHeader('vary', 'origin')
  }
  response.setHeader('access-control-allow-methods', 'POST, GET, OPTIONS')
  response.setHeader('access-control-allow-headers', 'content-type')

  if (request.method === 'OPTIONS') {
    response.writeHead(204)
    response.end()
    return
  }

  try {
    if (request.method === 'GET' && request.url === '/api/health') {
      const configured = Object.entries(providers)
        .filter(([, provider]) => Boolean(process.env[provider.env]))
        .map(([id]) => id)
      const result = json({ ok: true, configured })
      response.writeHead(result.status, result.headers)
      response.end(result.body)
      return
    }

    if (request.method === 'POST' && request.url === '/api/chat') {
      const input = await readJson(request)
      if (!Array.isArray(input.messages)) throw new Error('messages deve ser uma lista.')
      const answer = await generateAnswer({
        messages: input.messages,
        providerId: input.provider === 'groq' ? 'groq' : 'openrouter',
      })
      const result = json(answer)
      response.writeHead(result.status, result.headers)
      response.end(result.body)
      return
    }

    const result = json({ error: 'Rota não encontrada.' }, 404)
    response.writeHead(result.status, result.headers)
    response.end(result.body)
  } catch (error) {
    const status = error.message.includes('JSON') || error.message.includes('messages') ? 400 : 502
    const result = json({ error: error.message || 'Não foi possível gerar a resposta.' }, status)
    response.writeHead(result.status, result.headers)
    response.end(result.body)
  }
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Zion API disponível em http://0.0.0.0:${port}`)
})
