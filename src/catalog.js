export const freeStack = [
  {
    id: 'models',
    name: 'OpenRouter',
    tag: 'Model gateway',
    mark: 'OR',
    tone: 'violet',
    description: 'Uma API para alternar modelos e experimentar opções gratuitas sem reescrever o produto.',
    action: 'Use OPENROUTER_API_KEY',
    url: 'https://openrouter.ai/',
  },
  {
    id: 'speed',
    name: 'GroqCloud',
    tag: 'Inferência rápida',
    mark: 'GQ',
    tone: 'orange',
    description: 'Alternativa de baixa latência para servir conversas com modelos abertos.',
    action: 'Use GROQ_API_KEY',
    url: 'https://console.groq.com/',
  },
  {
    id: 'data',
    name: 'Supabase',
    tag: 'Dados + autenticação',
    mark: 'S',
    tone: 'green',
    description: 'Banco Postgres, autenticação e armazenamento para memória persistente do agente.',
    action: 'Aplicar schema SQL',
    url: 'https://supabase.com/',
  },
  {
    id: 'search',
    name: 'Brave Search API',
    tag: 'Pesquisa para RAG',
    mark: 'B',
    tone: 'red',
    description: 'Pesquisa independente para enriquecer respostas com contexto recente e verificável.',
    action: 'Adicionar conector',
    url: 'https://brave.com/search/api/',
  },
  {
    id: 'deploy',
    name: 'Cloudflare Workers',
    tag: 'Execução na borda',
    mark: 'CF',
    tone: 'amber',
    description: 'Hospedagem e rotas de API próximas do usuário para uma camada leve de agente.',
    action: 'Preparar deploy',
    url: 'https://workers.cloudflare.com/',
  },
  {
    id: 'source',
    name: 'GitHub',
    tag: 'Código + CI',
    mark: 'GH',
    tone: 'slate',
    description: 'Repositório, revisão, automação e colaboração do produto em um só fluxo.',
    action: 'Ver repositório',
    url: 'https://github.com/',
  },
]

export const starterPrompts = [
  {
    title: 'Desenhe minha IA',
    text: 'Crie uma arquitetura de agente para meu produto. Inclua modelo, memória, RAG, ferramentas, segurança e um plano de implantação com a stack gratuita.',
    icon: '✦',
  },
  {
    title: 'Planeje um MVP',
    text: 'Quero lançar um MVP de assistente de IA em 7 dias. Divida o escopo em entregas diárias, priorizando a stack gratuita disponível.',
    icon: '◫',
  },
  {
    title: 'Audite a ideia',
    text: 'Atue como arquiteto de IA. Faça cinco perguntas que reduzam o risco técnico do meu produto e proponha decisões padrão sensatas.',
    icon: '⌁',
  },
]

export const providerOptions = [
  {
    id: 'openrouter',
    name: 'OpenRouter',
    model: 'Llama 3.3 70B · free',
    env: 'OPENROUTER_API_KEY',
  },
  {
    id: 'groq',
    name: 'Groq',
    model: 'Llama 3.3 70B · fast',
    env: 'GROQ_API_KEY',
  },
]
