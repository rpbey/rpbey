'use client';

import {
  Bot,
  Code,
  Cpu,
  Loader2,
  Send,
  Sparkles,
  Terminal,
  User as UserIcon,
} from 'lucide-react';
import {
  useEffect,
  useEffect as useIsomorphicLayoutEffect,
  useRef,
  useState,
} from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface RyugaChatProps {
  user: {
    name?: string | null;
    image?: string | null;
  };
}

interface ToolCardProps {
  name: string;
  args?: string;
  result?: string;
}

function _ToolCard({ name, args, result }: ToolCardProps) {
  const [expanded, setExpanded] = useState(false);
  const displayResult =
    result && result.length > 150 ? `${result.slice(0, 150)}...` : result;

  return (
    <div className="my-2 border border-white/10 rounded-lg bg-black/40 overflow-hidden text-xs">
      <div
        className="flex items-center gap-2 p-2 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <Terminal size={14} className="text-red-400" />
        <span className="font-mono text-red-200">{name}</span>
        <span className="text-muted-foreground ml-auto">
          {expanded ? 'Hide' : 'Show'}
        </span>
      </div>

      {expanded && (
        <div className="p-3 space-y-2 border-t border-white/10">
          {args && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Code size={12} />
                <span>Arguments</span>
              </div>
              <pre className="bg-black/60 p-2 rounded text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap">
                {args}
              </pre>
            </div>
          )}

          {result && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Cpu size={12} />
                <span>Result</span>
              </div>
              <pre className="bg-black/60 p-2 rounded text-green-300 font-mono overflow-x-auto whitespace-pre-wrap">
                {result}
              </pre>
            </div>
          )}
        </div>
      )}

      {!expanded && displayResult && (
        <div className="px-3 py-2 text-gray-400 font-mono truncate border-t border-white/5">
          {displayResult}
        </div>
      )}
    </div>
  );
}

export function RyugaChat({ user }: RyugaChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load history
    fetch('/api/bot/chat')
      .then((res) => res.json())
      .then((data) => {
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        } else {
          // Default welcome if no history
          setMessages([
            {
              id: 'welcome',
              role: 'assistant',
              content: `Hmpf. Tu oses déranger l'Empereur Dragon ? Parle, ${user.name || 'Blader'}, et sois bref.`,
              timestamp: Date.now(),
            },
          ]);
        }
      })
      .catch(console.error);
  }, [user.name]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useIsomorphicLayoutEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const tempId = Date.now().toString();
    const userMsg: Message = {
      id: tempId,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/bot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content }),
      });

      if (!response.ok) {
        throw new Error('Erreur de communication avec Ryuga');
      }

      const data = await response.json();

      const botMsg: Message = {
        id: data.id || (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || '...',
        timestamp: data.timestamp || Date.now(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (_error) {
      toast({
        title: 'Erreur',
        description: 'Ryuga refuse de répondre pour le moment.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-black/40">
      {/* Background Ambience */}
      <div className="absolute inset-0 gemini-glow opacity-60" />

      {/* Chat Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth chat-scroll z-10"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex w-full max-w-[85%] gap-4 animate-message-in',
              msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto',
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-full border shadow-lg',
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-blue-600 to-cyan-500 border-blue-400/30 text-white'
                  : 'ryuga-dragon-gradient border-red-500/30 text-red-100',
              )}
            >
              {msg.role === 'user' ? <UserIcon size={18} /> : <Bot size={18} />}
            </div>

            {/* Bubble */}
            <div
              className={cn(
                'rounded-2xl px-5 py-3 text-sm shadow-md overflow-hidden relative',
                msg.role === 'user'
                  ? 'bg-blue-600/20 border border-blue-500/30 text-blue-50'
                  : 'glass-morphism text-gray-100',
              )}
            >
              {/* Dragon/Gemini subtle accent for bot messages */}
              {msg.role === 'assistant' && (
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-500 to-transparent opacity-50" />
              )}

              {/* Special parsing for tool calls if present in text (custom format) */}
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                className="prose dark:prose-invert prose-sm max-w-none break-words prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10"
                components={{
                  pre: ({ node, ...props }) => (
                    <div
                      className="overflow-auto w-full my-3 bg-black/60 p-3 rounded-lg border border-white/10 shadow-inner"
                      {...props}
                    />
                  ),
                  code: ({ node, ...props }) => (
                    <code
                      className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono border border-white/5"
                      {...props}
                    />
                  ),
                  a: ({ node, ...props }) => (
                    <a
                      className="text-red-400 hover:text-red-300 underline underline-offset-4"
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props}
                    />
                  ),
                  strong: ({ node, ...props }) => (
                    <strong className="font-bold text-red-200" {...props} />
                  ),
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex w-full max-w-[80%] gap-4 mr-auto animate-pulse">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-500/30 ryuga-dragon-gradient text-red-100">
              <Sparkles size={18} className="animate-spin duration-[3s]" />
            </div>
            <div className="rounded-2xl px-5 py-3 text-sm glass-morphism text-muted-foreground italic flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              L'Empereur analyse...
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-md z-20">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-3 max-w-4xl mx-auto relative"
        >
          <div className="relative flex-1">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question..."
              className="w-full bg-white/5 border-white/10 focus:border-red-500/50 focus:ring-red-500/20 pl-4 pr-4 py-6 rounded-xl text-base shadow-inner transition-all"
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="h-auto px-6 rounded-xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white shadow-lg shadow-red-900/20 border border-red-500/20 transition-all hover:scale-105 active:scale-95"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Send size={20} />
            )}
            <span className="sr-only">Envoyer</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
