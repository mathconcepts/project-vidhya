/**
 * ChatPage — "Anytime Smart Tutor" chat surface.
 * Mobile-first, streaming SSE, Clarity light theme.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Send, BookOpen, Trash2, Upload } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { useStorageMode } from '@/hooks/useStorageMode';
import { useActiveExam } from '@/hooks/useActiveExam';
import { CameraInput } from '@/components/app/CameraInput';
import { isDemoMode } from '@/lib/demoMode';
import NextStepChip, { type NextStepData } from '@/components/app/NextStepChip';
import { streamGroundedChat } from '@/lib/gbrain/client';
import { extractErrorDetail } from '@/lib/api-error';
import { ChatBubble } from '@/components/ui/ChatBubble';
import { EmptyState } from '@/components/ui/EmptyState';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

const FALLBACK_SUGGESTIONS = [
  'Explain a key concept with a worked example',
  'Where should I focus to maximise my exam score?',
  'Walk me through a tricky topic step-by-step',
  'Give me 3 practice problems',
];

function ThinkingDots() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} aria-label="Thinking">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.5)',
            display: 'inline-block',
            animation: `bounce 0.6s ${i * 0.15}s infinite ease-in-out`,
          }}
        />
      ))}
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}`}</style>
    </span>
  );
}

function TutorThinkingDots() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} aria-label="Thinking">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--text-tertiary)',
            display: 'inline-block',
            animation: `bounce 0.6s ${i * 0.15}s infinite ease-in-out`,
          }}
        />
      ))}
    </span>
  );
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function ChatPage() {
  const sessionId = useSession();
  const navigate = useNavigate();
  const { effectiveMode, groundingCount } = useStorageMode();
  const [searchParams, setSearchParams] = useSearchParams();
  const { exam: activeExam } = useActiveExam();
  const suggestions = (activeExam?.starter_prompts?.length ?? 0) > 0
    ? activeExam!.starter_prompts.map((s: any) => s.text ?? s)
    : FALLBACK_SUGGESTIONS;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{ base64: string; mimeType: string } | null>(null);
  const [nextSteps, setNextSteps] = useState<Record<string, NextStepData>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const prompt = searchParams.get('prompt');
    if (prompt) {
      setInput(prompt.slice(0, 500));
      setSearchParams({}, { replace: true });
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!sessionId || loaded) return;
    fetch(`${API_BASE}/api/chat/${sessionId}`)
      .then(r => r.ok ? r.json() : { messages: [] })
      .then(data => {
        if (data.messages?.length) {
          setMessages(data.messages.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            created_at: m.created_at,
          })));
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [sessionId, loaded]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming || !sessionId) return;

    const currentImage = attachedImage;
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: currentImage ? `[Photo attached] ${text.trim()}` : text.trim(),
    };

    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput('');
    setAttachedImage(null);
    setIsStreaming(true);

    if (currentImage) {
      const assistantId = assistantMsg.id;
      fetch(`${API_BASE}/api/multimodal/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: currentImage.base64,
          image_mime_type: currentImage.mimeType,
          text: text.trim() || undefined,
          session_id: sessionId,
          scope: 'mcq-rigorous',
        }),
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.next_step) {
            setNextSteps(prev => ({ ...prev, [assistantId]: data.next_step }));
          }
        })
        .catch(() => { /* silent */ });
    }

    try {
      if (effectiveMode === 'indexeddb') {
        await streamGroundedChat(
          sessionId,
          text.trim(),
          messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
          (chunk) => {
            setMessages(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last.role === 'assistant') {
                updated[updated.length - 1] = { ...last, content: last.content + chunk };
              }
              return updated;
            });
          },
          () => { /* done */ },
          (err) => { throw new Error(err); },
        );
        setIsStreaming(false);
        return;
      }

      const chatBody: any = {
        sessionId,
        message: text.trim(),
        history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
      };
      if (currentImage) {
        chatBody.image = currentImage.base64;
        chatBody.imageMimeType = currentImage.mimeType;
      }

      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatBody),
      });

      if (!response.ok) {
        const detail = await extractErrorDetail(response, 'Chat request failed');
        throw new Error(detail);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No response body');

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'chunk' && data.content) {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: last.content + data.content };
                }
                return updated;
              });
            } else if (data.type === 'error') {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === 'assistant' && !last.content) {
                  updated[updated.length - 1] = {
                    ...last,
                    content: data.content || 'Sorry, I had trouble responding. Please try again.',
                  };
                }
                return updated;
              });
            }
          } catch { /* skip */ }
        }
      }
      // Fallback: if stream ended with no content (e.g. empty LLM response), show an error
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.role === 'assistant' && !last.content) {
          updated[updated.length - 1] = {
            ...last,
            content: 'Sorry, I had trouble responding. Please try again.',
          };
        }
        return updated;
      });
    } catch (err) {
      console.error('[chat] Error:', err);
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.role === 'assistant' && !last.content) {
          updated[updated.length - 1] = { ...last, content: 'Sorry, I had trouble responding. Please try again.' };
        }
        return updated;
      });
    }

    setIsStreaming(false);
  }, [sessionId, isStreaming, messages, attachedImage, effectiveMode]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => setMessages([]);
  const isEmpty = messages.length === 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: isDemoMode() ? 'calc(100dvh - 284px)' : 'calc(100dvh - 128px)', // demo: 50px nav + 220px banner padding + 14px buffer
        margin: '0 -20px',
      }}
    >
      {/* Grounding indicator */}
      {effectiveMode === 'indexeddb' && groundingCount > 0 && (
        <div
          style={{
            margin: '0 16px 8px',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(52,199,89,.08)',
            border: '1px solid rgba(52,199,89,.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <BookOpen size={11} style={{ color: 'var(--green-ink)', flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: 'var(--text-caption2)', color: 'var(--green-ink)' }}>
            Grounded in your materials — {groundingCount} chunk{groundingCount === 1 ? '' : 's'} available
          </p>
        </div>
      )}

      {/* Messages or empty state */}
      <div
        style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', overscrollBehavior: 'contain' }}
      >
        {isEmpty ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 24,
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <h2
                style={{
                  margin: '0 0 6px',
                  fontSize: 'var(--text-title2)',
                  fontWeight: 'var(--weight-bold)',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.018em',
                }}
              >
                Your Anytime Tutor
              </h2>
              <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--text-secondary)', maxWidth: 280, lineHeight: 'var(--leading-normal)' }}>
                Concepts explained clearly. Problems solved step-by-step.
              </p>
              {activeExam && (
                <p style={{ margin: '6px 0 0', fontSize: 'var(--text-caption)', color: 'var(--indigo-ink)' }}>
                  {activeExam.name}
                </p>
              )}
            </div>

            {/* Suggestion rows — plain list */}
            <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column' }}>
              {suggestions.map((s: string, i: number) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 0',
                    borderBottom: i < suggestions.length - 1 ? 'var(--hairline) solid var(--separator)' : 'none',
                    background: 'none',
                    border: 'none',
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    borderBottomColor: i < suggestions.length - 1 ? 'var(--separator)' : 'transparent',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--indigo)', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 'var(--text-body)', color: 'var(--text-primary)', lineHeight: 'var(--leading-tight)' }}>{s}</span>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: 19 }}>›</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {messages.map((msg, idx) => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <ChatBubble from={msg.role === 'user' ? 'student' : 'tutor'}>
                  {msg.content || (msg.role === 'assistant' && isStreaming && idx === messages.length - 1
                    ? <TutorThinkingDots />
                    : msg.content)}
                </ChatBubble>

                {msg.role === 'assistant' && nextSteps[msg.id] && !isStreaming && (
                  <div style={{ maxWidth: '85%' }}>
                    <NextStepChip
                      step={nextSteps[msg.id]}
                      onAccept={(step) => {
                        if (step.action === 'practice_problems' && step.target.concept_id) {
                          navigate(`/smart-practice?concept=${step.target.concept_id}`);
                        } else if (step.action === 'explain_concept' && step.target.concept_id) {
                          setInput(`Explain ${step.target.concept_id.replace(/-/g, ' ')} with a worked example`);
                          inputRef.current?.focus();
                        } else if (step.action === 'build_syllabus') {
                          navigate('/snap?mode=diagnostic');
                        } else if (step.action === 'review_misconception' && step.target.concept_id) {
                          setInput(`Help me understand where I went wrong on ${step.target.concept_id.replace(/-/g, ' ')}`);
                          inputRef.current?.focus();
                        } else if (step.action === 'save_to_notes') {
                          navigate('/materials');
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div
        style={{
          borderTop: 'var(--hairline) solid var(--separator)',
          background: 'var(--material-thick)',
          backdropFilter: 'var(--blur-nav)',
          WebkitBackdropFilter: 'var(--blur-nav)',
          padding: '10px 16px',
        }}
      >
        {attachedImage && (
          <div style={{ maxWidth: 720, margin: '0 auto 8px' }}>
            <CameraInput
              onCapture={(b, m) => setAttachedImage({ base64: b, mimeType: m })}
              onClear={() => setAttachedImage(null)}
              preview={attachedImage.base64}
              compact
            />
          </div>
        )}
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              title="Clear chat"
              aria-label="Clear chat"
              style={{
                padding: 10,
                borderRadius: 'var(--radius-xs)',
                border: 'none',
                background: 'none',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <Trash2 size={18} />
            </button>
          )}
          <CameraInput
            onCapture={(b, m) => setAttachedImage({ base64: b, mimeType: m })}
            onClear={() => setAttachedImage(null)}
            preview={null}
            compact
          />
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your exam…"
              rows={1}
              inputMode="text"
              enterKeyHint="send"
              style={{
                width: '100%',
                resize: 'none',
                borderRadius: 'var(--radius-capsule)',
                background: 'var(--surface-fill)',
                border: 'var(--hairline) solid var(--separator)',
                padding: '11px 48px 11px 16px',
                fontSize: 'var(--text-body)',
                fontFamily: 'var(--font-sans)',
                color: 'var(--text-primary)',
                outline: 'none',
                minHeight: 44,
                maxHeight: 128,
                lineHeight: 'var(--leading-normal)',
                boxSizing: 'border-box',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = '44px';
                target.style.height = Math.min(target.scrollHeight, 128) + 'px';
              }}
              onFocus={(e) => {
                (e.target as HTMLTextAreaElement).style.boxShadow = 'inset 0 0 0 2px var(--indigo)';
              }}
              onBlur={(e) => {
                (e.target as HTMLTextAreaElement).style.boxShadow = 'none';
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isStreaming}
              aria-label="Send message"
              style={{
                position: 'absolute',
                right: 6,
                bottom: 6,
                width: 34,
                height: 34,
                borderRadius: '50%',
                border: 'none',
                background: input.trim() && !isStreaming ? 'var(--indigo)' : 'var(--surface-fill)',
                color: input.trim() && !isStreaming ? '#fff' : 'var(--text-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: input.trim() && !isStreaming ? 'pointer' : 'default',
                transition: 'background var(--dur-fast) var(--ease-standard)',
              }}
            >
              {isStreaming ? <ThinkingDots /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
