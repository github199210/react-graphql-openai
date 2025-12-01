import { useMemo, useState } from 'react';

function Message({ role, content, pending }) {
  return (
    <div className={`message ${role}`}>
      <div className="bubble">
        <div className="meta">
          <span className="pill">{role === 'assistant' ? 'AI' : '你'}</span>
          {pending && <span className="typing">•••</span>}
        </div>
        <div className="content">{content}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: '嗨，我是你的 AI 助手。告诉我你想讨论什么吧。'
    }
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const placeholder = useMemo(() => {
    if (isSending) return 'AI 正在思考...';
    if (!messages.length) return '向 AI 说点什么';
    return '按 Enter 发送，Shift+Enter 换行';
  }, [isSending, messages.length]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed
    };

    const history = [...messages, userMessage];
    setMessages(history);
    setInput('');
    setIsSending(true);

    try {
      const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // body: JSON.stringify({ query: 'query getMsg($input:String){ answer(input:$input) }' ,variables:{input:input}})
                body: JSON.stringify({ query: 'query { users { id} }'})

      });

      if (!response.data) {
        throw new Error(`请求失败：${response.status}`);
      }

      const data = await response.data;
      const reply = data?.answer || 'AI 暂时没有回复，请稍后再试。';

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: reply }
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content:
            '出错了，我现在无法回复。请检查后端是否正在运行或者稍后再试。'
        }
      ]);
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="page">
      <main className="chat-card">
        <section className="messages" aria-live="polite">
          {messages.map((message) => (
            <Message
              key={message.id}
              role={message.role}
              content={message.content}
              pending={isSending && message.role === 'assistant' && message.id === messages[messages.length - 1].id}
            />
          ))}
          {isSending && (
            <div className="system-note">AI 正在生成回复...</div>
          )}
        </section>

        <form className="composer" onSubmit={handleSubmit}>
          <textarea
            value={input}
            placeholder={placeholder}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
          />
          <div className="composer__actions">
            <div className="tip">Shift+Enter 换行</div>
            <button type="submit" disabled={isSending || !input.trim()}>
              {isSending ? '发送中…' : '发送'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
