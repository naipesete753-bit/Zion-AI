import { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { freeStack, providerOptions, starterPrompts } from './catalog'
import { getInitialApiBaseUrl, normalizeApiBaseUrl, readAgentHealth, requestAgent } from './api'
import './styles.css'
import './mobile.css'

const welcomeMessage = {
  id: 'welcome',
  role: 'assistant',
  content: 'Olá — eu sou o **Zion**. Posso ser seu copiloto para desenhar, construir e lançar produtos com IA.\n\nDescreva o que você quer criar ou comece por um dos atalhos abaixo.',
  time: 'agora',
  mode: 'system',
}

function Icon({ name, size = 18, stroke = 1.8 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  const paths = {
    plus: <><path d="M12 5v14M5 12h14" /></>,
    chat: <><path d="M20 15a4 4 0 0 1-4 4H9l-5 3V8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4Z" /></>,
    grid: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
    library: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></>,
    workflow: <><circle cx="6" cy="6" r="2" /><circle cx="18" cy="18" r="2" /><circle cx="18" cy="6" r="2" /><path d="M8 6h8M6 8v8a2 2 0 0 0 2 2h8" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.1 2.1-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.04 1.56v.1h-3v-.1a1.7 1.7 0 0 0-1.04-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-2.1-2.1.06-.06A1.7 1.7 0 0 0 7 15a1.7 1.7 0 0 0-1.56-1.04h-.1v-3h.1A1.7 1.7 0 0 0 7 9.92a1.7 1.7 0 0 0-.34-1.88L6.6 8l2.1-2.1.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 11.68 4.7v-.1h3v.1a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.1 2.1-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.04h.1v3h-.1A1.7 1.7 0 0 0 19.4 15Z" /></>,
    search: <><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></>,
    send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
    spark: <><path d="m12 3-1.2 5.8L5 10l5.8 1.2L12 17l1.2-5.8L19 10l-5.8-1.2Z" /><path d="m19 16-.5 2.5L16 19l2.5.5L19 22l.5-2.5L22 19l-2.5-.5Z" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    dots: <><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></>,
    paperclip: <path d="m21.4 11.6-8.9 8.9a6 6 0 0 1-8.5-8.5l8.6-8.6a4 4 0 1 1 5.6 5.7l-8.7 8.6a2 2 0 0 1-2.8-2.8l8-8" />,
    terminal: <><path d="m5 7 4 5-4 5" /><path d="M12 17h7" /></>,
    shield: <><path d="M12 3 4.5 6v5c0 5 3.2 8.6 7.5 10 4.3-1.4 7.5-5 7.5-10V6Z" /><path d="m9 12 2 2 4-4" /></>,
    database: <><ellipse cx="12" cy="5" rx="7" ry="3" /><path d="M5 5v7c0 1.7 3.1 3 7 3s7-1.3 7-3V5" /><path d="M5 12v7c0 1.7 3.1 3 7 3s7-1.3 7-3v-7" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    external: <><path d="M14 4h6v6" /><path d="m20 4-9 9" /><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></>,
  }
  return <svg {...common}>{paths[name] || paths.spark}</svg>
}

function renderText(text) {
  return text.split('\n').map((line, index) => {
    const pieces = line.split(/(\*\*[^*]+\*\*)/g)
    return <p key={`${line}-${index}`} className={line.startsWith('•') || /^\d+\./.test(line) ? 'list-line' : ''}>
      {pieces.map((piece, pieceIndex) => piece.startsWith('**') && piece.endsWith('**')
        ? <strong key={pieceIndex}>{piece.slice(2, -2)}</strong>
        : piece
      )}
    </p>
  })
}

function App() {
  const [provider, setProvider] = useState('openrouter')
  const [apiBaseUrl, setApiBaseUrl] = useState(getInitialApiBaseUrl)
  const [messages, setMessages] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('zion-messages'))
      return Array.isArray(saved) && saved.length ? saved : [welcomeMessage]
    } catch { return [welcomeMessage] }
  })
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [rightPanel, setRightPanel] = useState(true)
  const [mobileNav, setMobileNav] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [health, setHealth] = useState({ loading: true, configured: [] })
  const [activeNav, setActiveNav] = useState('Chat')
  const endRef = useRef(null)
  const inputRef = useRef(null)

  const selectedProvider = useMemo(() => providerOptions.find((item) => item.id === provider), [provider])
  const isLive = health.configured.includes(provider)

  useEffect(() => {
    localStorage.setItem('zion-messages', JSON.stringify(messages.slice(-30)))
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  useEffect(() => {
    localStorage.setItem('zion-api-base-url', apiBaseUrl)
    setHealth((current) => ({ ...current, loading: true }))
    readAgentHealth(apiBaseUrl)
      .then((data) => setHealth({ loading: false, configured: data.configured || [] }))
      .catch(() => setHealth({ loading: false, configured: [] }))
  }, [apiBaseUrl])

  useEffect(() => {
    // Mantém a área útil estável no WebView Android, inclusive quando o teclado abre.
    const viewport = window.visualViewport
    const syncViewportHeight = () => {
      const height = viewport?.height || window.innerHeight
      document.documentElement.style.setProperty('--app-viewport-height', `${Math.round(height)}px`)
    }
    syncViewportHeight()
    window.addEventListener('resize', syncViewportHeight)
    viewport?.addEventListener('resize', syncViewportHeight)
    return () => {
      window.removeEventListener('resize', syncViewportHeight)
      viewport?.removeEventListener('resize', syncViewportHeight)
    }
  }, [])

  function notify(message) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }

  function resetChat() {
    setMessages([welcomeMessage])
    setDraft('')
    notify('Nova conversa iniciada')
    inputRef.current?.focus()
  }

  async function sendMessage(text = draft) {
    const content = text.trim()
    if (!content || isSending) return
    const userMessage = { id: crypto.randomUUID(), role: 'user', content, time: 'agora' }
    const outgoing = [...messages, userMessage]
    setMessages(outgoing)
    setDraft('')
    setIsSending(true)

    try {
      const data = await requestAgent({
        apiBaseUrl,
        provider,
        messages: outgoing.map(({ role, content: messageContent }) => ({ role, content: messageContent })),
      })
      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.content,
        time: 'agora',
        mode: data.mode,
        model: data.model,
      }])
      if (data.mode === 'live') setHealth((current) => ({ ...current, configured: [...new Set([...current.configured, provider])]}))
    } catch (error) {
      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `**Não consegui concluir esta etapa.**\n\n${error.message}\n\nVerifique a chave do provedor no servidor e tente novamente.`,
        time: 'agora',
        mode: 'error',
      }])
    } finally {
      setIsSending(false)
    }
  }

  function selectNav(label) {
    setActiveNav(label)
    if (label !== 'Chat') notify(`${label} estará disponível na próxima iteração`)
    setMobileNav(false)
  }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`} aria-label="Navegação principal">
      <div className="brand-row">
        <div className="brand-mark"><span>z</span></div>
        <div className="brand-type">zion<span>ai</span></div>
        <button className="icon-button mobile-close" onClick={() => setMobileNav(false)} aria-label="Fechar menu"><Icon name="close" /></button>
      </div>

      <button className="new-chat" onClick={resetChat}><Icon name="plus" size={17} /> <span>Nova conversa</span><kbd>⌘ K</kbd></button>

      <nav className="nav-list">
        {[
          ['Chat', 'chat'], ['Projetos', 'grid'], ['Biblioteca', 'library'], ['Fluxos', 'workflow'],
        ].map(([label, icon]) => <button key={label} onClick={() => selectNav(label)} className={`nav-item ${activeNav === label ? 'active' : ''}`}><Icon name={icon} /><span>{label}</span>{label === 'Projetos' && <em>2</em>}</button>)}
      </nav>

      <div className="sidebar-spacer" />
      <section className="usage-card" aria-label="Uso do plano">
        <div className="usage-title"><span>Créditos de agentes</span><strong>8/10</strong></div>
        <div className="usage-track"><i /></div>
        <p>Reinicia em 12 dias</p>
        <button onClick={() => setSettingsOpen(true)}>Ver plano <Icon name="chevron" size={14} /></button>
      </section>
      <button className="profile-row" onClick={() => setSettingsOpen(true)}>
        <span className="avatar">N</span><span className="profile-name">Naipe <small>Plano builder</small></span><Icon name="dots" size={18} />
      </button>
    </aside>

    <main className="main-stage">
      <header className="topbar">
        <div className="topbar-left">
          <button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Abrir menu"><Icon name="grid" /></button>
          <div className="breadcrumb"><span>Workspace pessoal</span><Icon name="chevron" size={14} /><b>Nova conversa</b></div>
        </div>
        <div className="topbar-actions">
          <button className="status-pill" onClick={() => setSettingsOpen(true)} title="Configurar provedor">
            <i className={health.loading ? 'checking' : isLive ? 'online' : 'offline'} />
            {health.loading ? 'Verificando' : isLive ? 'Agente online' : 'Demo local'}
          </button>
          <button className="icon-button top-action" onClick={() => notify('Nenhuma notificação nova')} aria-label="Notificações"><Icon name="bell" /></button>
          <button className="icon-button top-action" onClick={() => setSettingsOpen(true)} aria-label="Configurações"><Icon name="settings" /></button>
        </div>
      </header>

      <div className="workspace-grid">
        <section className="conversation-pane" aria-label="Conversa com Zion">
          <div className="conversation-topline">
            <div><p className="eyebrow">AGENTE DE PRODUTO</p><h1>Construa com clareza.</h1></div>
            <div className="conversation-tools">
              <button className="model-switch" onClick={() => setSettingsOpen(true)}><span className="model-dot">✦</span><span>{selectedProvider.name}</span><Icon name="chevron" size={14} /></button>
              <button className={`icon-button panel-toggle ${rightPanel ? 'selected' : ''}`} onClick={() => setRightPanel((value) => !value)} aria-label="Alternar painel de contexto"><Icon name="library" size={17} /></button>
            </div>
          </div>

          <div className="conversation-scroll">
            <div className="context-ribbon"><Icon name="spark" size={15} /><span>Memória curta ativada</span><i /> <span>{isLive ? 'Provedor conectado' : 'Resposta local até configurar uma chave'}</span></div>
            {messages.map((message, index) => <article className={`message ${message.role}`} key={message.id}>
              {message.role === 'assistant' && <div className="assistant-orb">z</div>}
              <div className="message-column">
                <div className="message-meta"><strong>{message.role === 'assistant' ? 'Zion' : 'Você'}</strong>{message.mode === 'live' && <span className="live-label">LIVE</span>}{message.mode === 'demo' && <span className="demo-label">DEMO</span>}<time>{message.time}</time></div>
                <div className={`message-bubble ${message.mode === 'error' ? 'message-error' : ''}`}>{renderText(message.content)}</div>
                {message.role === 'assistant' && index !== 0 && <div className="message-footer"><button onClick={() => navigator.clipboard?.writeText(message.content).then(() => notify('Resposta copiada'))}>Copiar</button><span>•</span><button onClick={() => notify('Obrigado — o feedback foi registado')}>Bom resultado</button></div>}
              </div>
            </article>)}
            {messages.length === 1 && <div className="starter-grid">{starterPrompts.map((prompt) => <button key={prompt.title} className="starter-card" onClick={() => sendMessage(prompt.text)}><span>{prompt.icon}</span><strong>{prompt.title}</strong><p>{prompt.text}</p><Icon name="chevron" size={15} /></button>)}</div>}
            {isSending && <article className="message assistant thinking"><div className="assistant-orb">z</div><div><div className="message-meta"><strong>Zion</strong><span className="generating">PENSANDO</span></div><div className="thinking-dots"><i /><i /><i /></div></div></article>}
            <div ref={endRef} />
          </div>

          <div className="composer-wrap">
            <div className="composer">
              <textarea ref={inputRef} rows="1" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage() } }} placeholder="Pergunte qualquer coisa ao Zion…" aria-label="Mensagem para Zion" />
              <div className="composer-bottom"><div className="composer-hints"><button onClick={() => notify('Anexos chegarão na próxima versão')} title="Anexar arquivo"><Icon name="paperclip" size={17} /></button><button className="tool-chip" onClick={() => setRightPanel(true)}><Icon name="terminal" size={15} /> Ferramentas</button></div><button className="send-button" disabled={!draft.trim() || isSending} onClick={() => sendMessage()} aria-label="Enviar mensagem"><Icon name="send" size={17} /></button></div>
            </div>
            <p className="composer-note">Zion pode errar. Confira decisões importantes e nunca envie segredos.</p>
          </div>
        </section>

        {rightPanel && <aside className="context-panel" aria-label="Contexto do agente">
          <div className="context-head"><div><p className="eyebrow">CONTEXT ENGINE</p><h2>Kit de construção</h2></div><button className="icon-button panel-close" onClick={() => setRightPanel(false)} aria-label="Fechar painel"><Icon name="close" size={17} /></button></div>
          <section className="agent-card">
            <div className="agent-card-top"><div className="tiny-orb">z</div><span className={isLive ? 'agent-live' : 'agent-demo'}>{isLive ? 'Pronto' : 'Demo'}</span></div>
            <h3>Zion · builder agent</h3><p>Planeja, estrutura e transforma ideias em entregas técnicas.</p>
            <div className="agent-card-footer"><span><Icon name="shield" size={14} /> Chaves no servidor</span><span><Icon name="database" size={14} /> Memória pronta</span></div>
          </section>
          <div className="panel-section-head"><span>STACK GRATUITA</span><button onClick={() => notify('Fonte: github.com/ripienaar/free-for-dev')}>ver guia</button></div>
          <div className="integration-list">{freeStack.slice(0, 5).map((tool) => <a className="integration" href={tool.url} target="_blank" rel="noreferrer" key={tool.id}><span className={`integration-mark ${tool.tone}`}>{tool.mark}</span><span className="integration-copy"><b>{tool.name}</b><small>{tool.tag}</small></span><Icon name="external" size={14} /></a>)}</div>
          <div className="panel-section-head lower"><span>PRÓXIMOS PASSOS</span></div>
          <ol className="steps"><li className="done"><i><Icon name="check" size={12} /></i><div><b>Interface do agente</b><small>Conversa, contexto e atalhos</small></div></li><li className={isLive ? 'done' : ''}><i>{isLive ? <Icon name="check" size={12} /> : '2'}</i><div><b>Conectar um modelo</b><small>{isLive ? 'Provedor está respondendo' : 'Adicione a variável de ambiente'}</small></div></li><li><i>3</i><div><b>Persistir memória</b><small>Aplique o schema no Supabase</small></div></li></ol>
          <button className="configure-banner" onClick={() => setSettingsOpen(true)}><span><Icon name="settings" size={16} /></span><div><b>Configurar agente</b><small>Modelo, chaves e memória</small></div><Icon name="chevron" size={15} /></button>
        </aside>}
      </div>
    </main>

    {mobileNav && <button className="sidebar-scrim" onClick={() => setMobileNav(false)} aria-label="Fechar menu" />}
    {toast && <div className="toast"><Icon name="check" size={16} /> {toast}</div>}
    {settingsOpen && <SettingsModal provider={provider} setProvider={setProvider} health={health} apiBaseUrl={apiBaseUrl} setApiBaseUrl={setApiBaseUrl} onClose={() => setSettingsOpen(false)} />}
  </div>
}

function SettingsModal({ provider, setProvider, health, apiBaseUrl, setApiBaseUrl, onClose }) {
  const selected = providerOptions.find((item) => item.id === provider)
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title" onMouseDown={(event) => event.stopPropagation()}>
      <header><div><p className="eyebrow">CONFIGURAÇÃO</p><h2 id="settings-title">Conecte o cérebro do Zion</h2><p className="modal-subtitle">A chave fica somente no servidor. O navegador conversa sempre pela rota <code>/api/chat</code>.</p></div><button className="icon-button" onClick={onClose} aria-label="Fechar"><Icon name="close" /></button></header>
      <div className="provider-options">{providerOptions.map((item) => <button className={`provider-option ${provider === item.id ? 'selected' : ''}`} key={item.id} onClick={() => setProvider(item.id)}><span className="provider-radio" /><span><b>{item.name}</b><small>{item.model}</small></span>{health.configured.includes(item.id) && <em>conectado</em>}</button>)}</div>
      <div className="mobile-api-field">
        <label htmlFor="api-base-url">URL pública da API <span>necessária no APK</span></label>
        <input id="api-base-url" type="url" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck="false" placeholder="https://api.seu-dominio.com" value={apiBaseUrl} onChange={(event) => setApiBaseUrl(normalizeApiBaseUrl(event.target.value))} />
        <p>Use uma URL HTTPS do servidor Zion. Vazio mantém a rota relativa no navegador e ativa demonstração local no APK.</p>
      </div>
      <div className="env-instruction"><div className="code-title"><span>1</span> No servidor, defina:</div><pre><code>{selected.env}=sua_chave_aqui</code></pre><div className="code-title"><span>2</span> Publique a API, informe a URL acima no APK e reinicie o servidor.</div></div>
      <div className="security-callout"><Icon name="shield" size={18} /><p><b>Segurança por padrão.</b> Não cole chaves no chat, em commits ou no frontend. O <code>.env</code> já é ignorado pelo Git.</p></div>
      <footer><a href="https://github.com/ripienaar/free-for-dev" target="_blank" rel="noreferrer">Explorar serviços gratuitos <Icon name="external" size={14} /></a><button className="primary-button" onClick={onClose}>Concluído <Icon name="check" size={16} /></button></footer>
    </section>
  </div>
}

createRoot(document.getElementById('root')).render(<App />)
