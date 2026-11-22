import { Capacitor } from '@capacitor/core'

export function normalizeApiBaseUrl(value = '') {
  return String(value).trim().replace(/\/+$/, '')
}

export function getInitialApiBaseUrl() {
  const saved = localStorage.getItem('zion-api-base-url')
  return normalizeApiBaseUrl(saved || import.meta.env.VITE_API_BASE_URL || '')
}

function endpoint(path, apiBaseUrl) {
  const base = normalizeApiBaseUrl(apiBaseUrl)
  return base ? `${base}${path}` : path
}

export function createLocalDemoReply(question) {
  const compact = String(question || '').trim().replace(/\s+/g, ' ')
  return `**Modo demonstração ativo**\n\nO APK está funcionando, mas ainda não recebeu a URL pública do servidor Zion. Ele não guarda chaves de modelos no telefone.\n\n**Leitura do seu pedido**\n${compact || 'Descreva o que você quer construir.'}\n\n**Para ativar respostas de IA reais no aplicativo**\n1. Publique a API Zion em uma URL HTTPS.\n2. Configure \`OPENROUTER_API_KEY\` ou \`GROQ_API_KEY\` somente nesse servidor.\n3. Abra Configurações no app e informe a URL pública da API.\n\nA interface e o histórico local continuam disponíveis enquanto você configura a infraestrutura.`
}

export async function readAgentHealth(apiBaseUrl) {
  const response = await fetch(endpoint('/api/health', apiBaseUrl))
  if (!response.ok) throw new Error('A API não respondeu ao health check.')
  return response.json()
}

export async function requestAgent({ apiBaseUrl, provider, messages }) {
  try {
    const response = await fetch(endpoint('/api/chat', apiBaseUrl), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ provider, messages }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error || 'Não foi possível consultar o agente.')
    return data
  } catch (error) {
    // Uma build Android sem servidor configurado continua útil em modo demo,
    // em vez de expor uma falha de rede para a pessoa usuária.
    if (!normalizeApiBaseUrl(apiBaseUrl) && Capacitor.isNativePlatform()) {
      const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user')
      return {
        content: createLocalDemoReply(lastUserMessage?.content),
        mode: 'demo',
        provider,
      }
    }
    throw error
  }
}
