import { useState, useRef, useEffect, useCallback } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useAnnotationStore, type ChatMessage } from '../store/useAnnotationStore';
import { callAiStream } from '../api/models';

export function ChatPanel() {
  const chatMessages = useAnnotationStore((s) => s.chatMessages);
  const addChatMessage = useAnnotationStore((s) => s.addChatMessage);
  const clearChat = useAnnotationStore((s) => s.clearChat);
  const selectedContent = useAnnotationStore((s) => s.selectedContent);
  const currentPage = useAnnotationStore((s) => s.currentPage);
  const elements = useAnnotationStore((s) => s.getPageElements());
  const setP3Content = useAnnotationStore((s) => s.setP3Content);
  const setSelectedContent = useAnnotationStore((s) => s.setSelectedContent);
  const setSelectedElementId = useAnnotationStore((s) => s.setSelectedElementId);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const buildPageContent = useCallback(() => {
    return [...elements]
      .sort((a, b) => a.order - b.order)
      .map((el) => {
        const t = el.category_type;
        if (t === 'equation' || t === 'formula' || t === 'display_formula') return el.latex || '';
        if (t === 'table') return el.html || '';
        if (t === 'doc_title') return `# ${el.markdown}`;
        if (t === 'paragraph_title') return `## ${el.markdown}`;
        return el.markdown || '';
      })
      .filter(Boolean)
      .join('\n\n');
  }, [elements]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [chatMessages]);


  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: input };
    addChatMessage(userMsg);
    setInput('');
    setLoading(true);

    const pageContent = buildPageContent();
    let prompt: string;
    if (selectedContent) {
      prompt = `用户选中的文档内容:\n${selectedContent}\n\n用户: ${input}`;
    } else {
      prompt = `当前页(第${currentPage}页)内容:\n${pageContent.slice(0, 3000)}\n\n用户: ${input}`;
    }

    addChatMessage({ role: 'assistant', content: '' });
    let accumulated = '';

    await callAiStream(
      'chat', prompt, {},
      (chunk) => {
        accumulated += chunk;
        useAnnotationStore.setState((state) => {
          const msgs = [...state.chatMessages];
          const last = msgs[msgs.length - 1];
          if (last?.role === 'assistant') {
            msgs[msgs.length - 1] = { ...last, content: accumulated };
          }
          return { chatMessages: msgs };
        });
      },
      () => setLoading(false),
      (err) => {
        const friendlyMsg = err.includes('Failed to fetch') || err.includes('404')
          ? `后端服务未启动。请运行: cd backend && python api_ocr.py`
          : `AI 请求失败: ${err}`;
        useAnnotationStore.setState((state) => {
          const msgs = [...state.chatMessages];
          if (msgs.length > 0) msgs[msgs.length - 1] = { role: 'assistant', content: friendlyMsg };
          return { chatMessages: msgs };
        });
        setLoading(false);
      },
    );
  }, [input, loading, buildPageContent, selectedContent, currentPage, addChatMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleRouteToP3 = useCallback((content: string, label: string) => {
    setP3Content(content, label);
  }, [setP3Content]);

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <span>AI 对话</span>
        <button className="chat-clear-btn" onClick={clearChat}>清空</button>
      </div>
      {selectedContent ? (
        <div className="chat-context">
          <span className="chat-context-text">已选中: {selectedContent.slice(0, 60)}...</span>
          <button
            className="chat-context-clear"
            onClick={() => { setSelectedContent(''); setSelectedElementId(null); }}
          >×</button>
        </div>
      ) : (
        <div className="chat-context muted">
          <span className="chat-context-text">上下文: 第{currentPage}页全文</span>
        </div>
      )}
      <div className="chat-messages" ref={listRef}>
        {chatMessages.length === 0 && (
          <div className="chat-empty">选中文档内容后开始对话，或点击上方按钮</div>
        )}
        {chatMessages.map((msg, i) => (
          <div key={i} className={`chat-msg ${msg.role}`}>
            <div className="chat-msg-content">
              <Markdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                {msg.content}
              </Markdown>
            </div>
            {msg.role === 'assistant' && msg.content.length > 60 && (
              <button
                className="chat-route-btn"
                onClick={() => handleRouteToP3(msg.content, 'AI 回复')}
              >
                查看详情
              </button>
            )}
          </div>
        ))}
        {loading && <div className="chat-msg assistant"><div className="chat-msg-content">处理中...</div></div>}
      </div>
      <div className="chat-input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入问题，Shift+Enter 换行"
          rows={2}
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading || !input.trim()}>发送</button>
      </div>
    </div>
  );
}
