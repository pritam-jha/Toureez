import { useState } from 'react';
import { sendChatMessage, type ChatMessage } from '../../lib/api/chat';
import { Card } from '../../components/ui';

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hi! I'm your Toureez travel assistant. Ask me anything about destinations or packages." },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!input.trim()) return;
    const next = [...messages, { role: 'user' as const, content: input }].slice(-10);
    setMessages(next);
    setInput('');
    setSending(true);

    const res = await sendChatMessage(next);
    setSending(false);

    setMessages((prev) => [...prev, { role: 'assistant', content: res.data?.reply ?? res.error ?? 'Sorry, something went wrong.' }]);
  }

  return (
    <div className="site-content">
      <h1>Travel Assistant</h1>
      <div className="chat-thread">
        {messages.map((m, i) => (
          <Card key={i} className={`chat-bubble ${m.role === 'user' ? 'mine' : 'theirs'}`}>
            {m.content}
          </Card>
        ))}
        {sending && <Card className="chat-bubble theirs">Typing…</Card>}
      </div>
      <div className="chat-input-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about destinations, packages…"
        />
        <button className="btn btn-primary" onClick={handleSend} disabled={sending}>Send</button>
      </div>
    </div>
  );
}
