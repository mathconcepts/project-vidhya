/**
 * ChatPage — "Anytime Smart Tutor" chat surface.
 * Mobile-first, streaming SSE, spring micro-interactions, Fraunces empty state.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Trash2, BookOpen } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { useStorageMode } from '@/hooks/useStorageMode';
import { CameraInput } from '@/components/app/CameraInput';
import NextStepChip, { type NextStepData } from '@/components/app/NextStepChip';
import { streamGroundedChat } from '@/lib/gbrain/client';
import { extractErrorDetail } from '@/lib/api-error';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

// Categorized by intent so the user can orient quickly
const SUGGESTIONS = [
  { text: 'Explain this concept with a worked example', dot: 'bg-violet-400' },
  { text: 'Where should I focus to maximise my score?', dot: 'bg-emerald-400' },
  { text: 'Check my answer — did I get this right?', dot: 'bg-amber-400' },
  { text: 'Give me 3 practice problems on integration', dot: 'bg-sky-400' },
];

// Three animated dots that bounce in sequence — replaces Loader2 "Thinking..."
function ThinkingDots() {
  return (
    <span className="flex items-center gap-1 py-0.5" aria-label="Thinking">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-surface-500"
          animate={{ y: [0, -4, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.15,
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{ base64: string; mimeType: string } | null>(null);
  const [nextSteps, setNextSteps] = useState<Record<string, NextStepData>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Pre-fill from URL param (e.g. /chat?prompt=Explain+eigenvalues)
  useEffect(() => {
    const prompt = searchParams.get('prompt');
    if (prompt) {
      setInput(prompt.slice(0, 500));
      setSearchParams({}, { replace: true });
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [searchParams, setSearchParams]);

  // Load chat history on mount
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

  // Auto-scroll on new messages
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

    // Multimodal background analysis — never blocks the chat UX
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
          () => { /* done handled by finally */ },
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
            if (data.type === 'chunk') {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: last.content + data.content };
                }
                return updated;
              });
            }
          } catch { /* skip non-JSON lines */ }
        }
      }
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
    <div className="flex flex-col h-[calc(100dvh-128px)] -m-4">
      {/* Grounding indicator */}
      {effectiveMode === 'indexeddb' && groundingCount > 0 && (
        <div className="mx-4 mt-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
          <BookOpen size={11} className="text-emerald-400 shrink-0" />
          <p className="text-[10px] text-emerald-300">
            Grounded in your materials — {groundingCount} chunk{groundingCount === 1 ? '' : 's'} available
          </p>
        </div>
      )}

      {/* Messages or empty state */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ overscrollBehavior: 'contain' }}
      >
        {isEmpty ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center h-full gap-6"
          >
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-emerald-500/10 border border-violet-500/20 flex items-center justify-center shadow-xl shadow-violet-500/10">
              <Sparkles className="w-6 h-6 text-violet-400" />
            </div>

            {/* Heading: Fraunces per design system (violet = AI/Tutor signature) */}
            <div className="text-center space-y-2">
              <h2 className="font-display text-2xl font-bold text-white tracking-tight">
                Your Anytime Tutor
              </h2>
              <p className="text-surface-400 text-sm max-w-xs leading-relaxed">
                Concepts explained clearly. Problems solved step-by-step. Ask anything.
              </p>
            </div>

            {/* Suggestion chips */}
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {SUGGESTIONS.map((s, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.07, duration: 0.3 }}
                  onClick={() => sendMessage(s.text)}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface-900/80 border border-surface-800 hover:border-surface-700 hover:bg-surface-900 transition-all text-left group cursor-pointer"
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${s.dot} shrink-0`} />
                  <span className="text-xs text-surface-300 group-hover:text-white transition-colors leading-snug">
                    {s.text}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            <AnimatePresence mode="popLayout">
              {messages.map((msg, idx) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{
                    type: 'spring',
                    stiffness: 380,
                    damping: 28,
                    delay: idx === messages.length - 1 ? 0 : 0,
                  }}
                  className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-violet-600 to-violet-700 text-white rounded-br-md shadow-md shadow-violet-900/30'
                        : 'bg-surface-800/80 text-surface-200 rounded-bl-md border border-surface-700/50 border-l-2 border-l-violet-500/30'
                    }`}
                  >
                    {msg.content || <ThinkingDots />}
                  </div>

                  {msg.role === 'assistant' && nextSteps[msg.id] && !isStreaming && (
                    <div className="max-w-[85%] w-full">
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
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="border-t border-surface-800/80 bg-surface-950/95 backdrop-blur-md px-4 py-3">
        {attachedImage && (
          <div className="max-w-3xl mx-auto mb-2">
            <CameraInput
              onCapture={(b, m) => setAttachedImage({ base64: b, mimeType: m })}
              onClear={() => setAttachedImage(null)}
              preview={attachedImage.base64}
              compact
            />
          </div>
        )}
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-2.5 rounded-xl text-surface-500 hover:text-surface-300 hover:bg-surface-800 transition-colors flex-shrink-0 cursor-pointer"
              title="Clear chat"
              aria-label="Clear chat"
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
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your exam..."
              rows={1}
              inputMode="text"
              enterKeyHint="send"
              className="w-full resize-none rounded-xl bg-surface-900 border border-surface-700 px-4 py-3 pr-12 text-sm text-white placeholder-surface-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all max-h-32"
              style={{ minHeight: '44px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = '44px';
                target.style.height = Math.min(target.scrollHeight, 128) + 'px';
              }}
            />
            {/* Send button with spring press deformation */}
            <motion.button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isStreaming}
              whileTap={input.trim() && !isStreaming ? { scale: 0.88 } : {}}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className="absolute right-2 bottom-2 p-2 rounded-lg bg-violet-600 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-violet-500 transition-colors cursor-pointer"
              aria-label="Send message"
            >
              {isStreaming ? (
                <ThinkingDots />
              ) : (
                <Send size={16} />
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
