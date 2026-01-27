'use client';

import {
  SmartToy as BotIcon,
  Send as SendIcon,
  Person as UserIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const animations = `
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  @keyframes message-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
`;

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

export function RyugaChat({ user }: RyugaChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Removed unused theme

  useEffect(() => {
    fetch('/api/bot/chat')
      .then((res) => res.json())
      .then((data) => {
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        } else {
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

  useLayoutEffect(() => {
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

      if (!response.ok) throw new Error('Erreur de communication');

      const data = await response.json();

      const botMsg: Message = {
        id: data.id || (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || '...',
        timestamp: data.timestamp || Date.now(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'background.default',
        backgroundImage:
          'radial-gradient(circle at 50% 50%, rgba(220, 38, 38, 0.1) 0%, rgba(0, 0, 0, 0) 70%)',
      }}
    >
      <style>{animations}</style>

      {/* Chat Area */}
      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          scrollBehavior: 'smooth',
        }}
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <Box
              key={msg.id}
              sx={{
                display: 'flex',
                gap: 2,
                flexDirection: isUser ? 'row-reverse' : 'row',
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: { xs: '90%', md: '80%' },
                animation: 'message-in 0.3s ease-out forwards',
              }}
            >
              {/* Avatar */}
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  bgcolor: isUser ? 'primary.main' : 'transparent',
                  background: !isUser
                    ? 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%)'
                    : undefined,
                  boxShadow: 3,
                  border: '1px solid',
                  borderColor: isUser ? 'primary.light' : 'error.main',
                }}
              >
                {isUser ? (
                  <UserIcon sx={{ color: 'white' }} />
                ) : (
                  <BotIcon sx={{ color: '#fecaca' }} />
                )}
              </Box>

              {/* Bubble */}
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  px: 3,
                  borderRadius: 3,
                  bgcolor: isUser ? 'primary.dark' : 'rgba(30, 30, 30, 0.8)',
                  backdropFilter: 'blur(10px)',
                  color: isUser ? 'primary.contrastText' : 'text.primary',
                  border: '1px solid',
                  borderColor: isUser
                    ? 'primary.main'
                    : 'rgba(255,255,255,0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {!isUser && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: 4,
                      height: '100%',
                      background:
                        'linear-gradient(to bottom, #ef4444, transparent)',
                    }}
                  />
                )}

                <Box className="markdown-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: (props) => (
                        <Typography
                          variant="body2"
                          component="p"
                          sx={{ mb: 1, lineHeight: 1.6 }}
                          {...props}
                        />
                      ),
                      a: (props) => (
                        <Typography
                          component="a"
                          sx={{
                            color: 'error.light',
                            textDecoration: 'underline',
                          }}
                          target="_blank"
                          rel="noopener noreferrer"
                          {...props}
                        />
                      ),
                      code: (props) => (
                        <Box
                          component="span"
                          sx={{
                            fontFamily: 'monospace',
                            bgcolor: 'rgba(255,255,255,0.1)',
                            px: 0.5,
                            py: 0.25,
                            borderRadius: 0.5,
                            fontSize: '0.85em',
                          }}
                          {...props}
                        />
                      ),
                      pre: (props) => (
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 1.5,
                            my: 1.5,
                            bgcolor: 'rgba(0,0,0,0.4)',
                            overflow: 'auto',
                            borderRadius: 2,
                          }}
                        >
                          <pre {...props} />
                        </Paper>
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </Box>
              </Paper>
            </Box>
          );
        })}

        {isLoading && (
          <Box sx={{ display: 'flex', gap: 2, maxWidth: '80%' }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%)',
                border: '1px solid',
                borderColor: 'error.main',
              }}
            >
              <BotIcon
                sx={{ color: '#fecaca', animation: 'spin 3s linear infinite' }}
              />
            </Box>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                px: 3,
                borderRadius: 3,
                bgcolor: 'rgba(30, 30, 30, 0.6)',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <CircularProgress size={16} color="error" />
              <Typography
                variant="body2"
                fontStyle="italic"
                color="text.secondary"
              >
                L'Empereur analyse...
              </Typography>
            </Paper>
          </Box>
        )}
      </Box>

      {/* Input Area */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          backdropFilter: 'blur(20px)',
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          style={{ maxWidth: 900, margin: '0 auto', display: 'flex', gap: 12 }}
        >
          <TextField
            fullWidth
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez votre question..."
            variant="outlined"
            disabled={isLoading}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                bgcolor: 'rgba(255,255,255,0.03)',
                '&.Mui-focused fieldset': {
                  borderColor: 'error.main',
                },
              },
            }}
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            variant="contained"
            sx={{
              borderRadius: 3,
              px: 3,
              background: 'linear-gradient(to right, #b91c1c, #dc2626)',
              '&:hover': {
                background: 'linear-gradient(to right, #991b1b, #b91c1c)',
              },
            }}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              <SendIcon />
            )}
          </Button>
        </form>
      </Box>
    </Box>
  );
}
