import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppShell from "./components/AppShell";
import { useState, useRef, useEffect } from "react";

import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Subscription from "./pages/Subscription";
import Dashboard from "./pages/Dashboard";
import ImportData from "./pages/ImportData";
import AIChat from "./pages/AIChat";
import JarvisCore from "./components/JarvisCore";
import FinancialSummary from "./pages/financialSummary";
import SmartBudgetting from "./pages/SmartBudgeting";

export default function App() {
  const [chatMessages, setChatMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const chatContainerRef = useRef(null);
  const [isChatFading, setIsChatFading] = useState(false);

  const handleVoiceCommand = (text) => {
    setChatMessages(prev => [...prev, { 
      type: 'user', 
      text: text,
      timestamp: new Date().toISOString()
    }]);
  };

  const handleResponse = (response) => {
    setChatMessages(prev => [...prev, { 
      type: 'assistant', 
      text: response,
      timestamp: new Date().toISOString()
    }]);
  };

  const toggleListening = () => {
    setIsListening(!isListening);
  };

  const clearChat = () => {
    setChatMessages([]);
  };

  // Auto-scroll and fade effect
  useEffect(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
      
      if (isAtBottom) {
        container.scrollTop = container.scrollHeight;
      }
      
      // Check if chat is full and needs to fade
      if (chatMessages.length > 8) {
        setIsChatFading(true);
      } else {
        setIsChatFading(false);
      }
    }
  }, [chatMessages]);

  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />

            <Route
              path="/app/dashboard"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Dashboard />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/import"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <ImportData />
                  </AppShell>
                </ProtectedRoute>
              }
            />

            <Route
  path="/app/summary"
  element={
    <ProtectedRoute>
      <AppShell>
        <FinancialSummary />
      </AppShell>
    </ProtectedRoute>
  }
/>


     <Route
  path="/app/smart-budgetting"
  element={
    <ProtectedRoute>
      <AppShell>
        <SmartBudgetting />
      </AppShell>
    </ProtectedRoute>
  }
/>


            <Route
              path="/app/chat"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <AIChat />
                  </AppShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/app/jarvis"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <div style={{ 
                      width: '100%', 
                      height: 'calc(100vh - 80px)',
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '10px 20px 20px 20px',
                      background: '#0a0a12',
                      position: 'relative',
                    }}>
                      {/* Chat Messages Display - No separation line */}
                      <div style={{
                        flex: '0 0 auto',
                        maxHeight: '250px',
                        overflowY: 'auto',
                        padding: '12px 16px',
                        marginBottom: '8px',
                        borderRadius: '12px',
                        background: 'rgba(10, 10, 18, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.03)',
                        position: 'relative',
                        transition: 'all 0.5s ease',
                        opacity: isChatFading ? 0.7 : 1,
                        maskImage: isChatFading ? 'linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0))' : 'none',
                        WebkitMaskImage: isChatFading ? 'linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0))' : 'none',
                      }}
                      ref={chatContainerRef}
                    >
                      {chatMessages.length === 0 ? (
                        <div style={{
                          textAlign: 'center',
                          color: 'rgba(255, 255, 255, 0.25)',
                          fontFamily: 'monospace',
                          fontSize: '13px',
                          padding: '15px',
                          letterSpacing: '1px',
                        }}>
                          🎤 Speak to start conversation
                        </div>
                      ) : (
                        chatMessages.map((msg, index) => (
                          <div key={index} style={{
                            marginBottom: '8px',
                            padding: '8px 14px',
                            borderRadius: '8px',
                            background: msg.type === 'user' 
                              ? 'rgba(74, 144, 226, 0.08)' 
                              : 'rgba(226, 169, 74, 0.08)',
                            border: `1px solid ${msg.type === 'user' 
                              ? 'rgba(74, 144, 226, 0.1)' 
                              : 'rgba(226, 169, 74, 0.1)'}`,
                            fontFamily: 'monospace',
                            fontSize: '13px',
                            color: 'rgba(255, 255, 255, 0.85)',
                            animation: 'slideIn 0.3s ease-out',
                            transition: 'all 0.3s ease',
                          }}>
                            <div style={{
                              fontSize: '9px',
                              color: 'rgba(255, 255, 255, 0.2)',
                              marginBottom: '2px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.8px',
                              fontWeight: '600',
                            }}>
                              {msg.type === 'user' ? '👤 YOU' : '🤖 JARVIS'}
                            </div>
                            {msg.text}
                          </div>
                        ))
                      )}
                      
                      {/* Fade indicator when chat is full */}
                      {isChatFading && chatMessages.length > 0 && (
                        <div style={{
                          position: 'sticky',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '40px',
                          background: 'linear-gradient(to bottom, transparent, rgba(10, 10, 18, 0.8))',
                          pointerEvents: 'none',
                          marginTop: '-40px',
                        }} />
                      )}
                    </div>

                    {/* Chat Input with Voice Controls - Clean design */}
                    <div style={{
                      display: 'flex',
                      gap: '10px',
                      padding: '10px 14px',
                      marginBottom: '8px',
                      background: 'rgba(10, 10, 18, 0.4)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.03)',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      flex: '0 0 auto',
                    }}>
                      <button
                        onClick={toggleListening}
                        disabled={!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)}
                        style={{
                          padding: '10px 20px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          background: isListening 
                            ? 'rgba(255, 68, 68, 0.12)'
                            : 'rgba(74, 144, 226, 0.08)',
                          color: 'white',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) ? 'pointer' : 'not-allowed',
                          transition: 'all 0.3s ease',
                          fontFamily: 'monospace',
                          letterSpacing: '0.5px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          backdropFilter: 'blur(10px)',
                          whiteSpace: 'nowrap',
                          opacity: ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) ? 1 : 0.5,
                        }}
                        onMouseEnter={(e) => {
                          if (('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
                            e.currentTarget.style.transform = 'scale(1.02)';
                            e.currentTarget.style.borderColor = isListening 
                              ? 'rgba(255, 68, 68, 0.3)'
                              : 'rgba(74, 144, 226, 0.3)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                        }}
                      >
                        {isListening ? (
                          <>
                            <span style={{ fontSize: '16px' }}>⏹</span> Stop
                          </>
                        ) : (
                          <>
                            <span style={{ fontSize: '16px' }}>🎤</span> Talk
                          </>
                        )}
                      </button>

                      <div style={{
                        flex: 1,
                        color: 'rgba(255, 255, 255, 0.3)',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        padding: '6px 12px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.02)',
                        minWidth: '120px',
                      }}>
                        {!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) ? (
                          '⚠️ Not supported'
                        ) : isListening ? (
                          '🎤 Listening...'
                        ) : (
                          'Click Talk to speak'
                        )}
                      </div>

                      <button
                        onClick={clearChat}
                        style={{
                          padding: '10px 16px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.04)',
                          background: 'rgba(255, 255, 255, 0.02)',
                          color: 'rgba(255, 255, 255, 0.4)',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          fontFamily: 'monospace',
                          backdropFilter: 'blur(10px)',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)';
                        }}
                      >
                        ✕ Clear
                      </button>
                    </div>

                    {/* Jarvis Core - No separation line */}
                    <div style={{
                      flex: 1,
                      minHeight: '350px',
                      position: 'relative',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid rgba(255, 255, 255, 0.02)',
                    }}>
                      <JarvisCore 
                        mood="idle"
                        level={0.5}
                        size={800}
                        isListening={isListening}
                        onToggleListening={setIsListening}
                        onTranscript={(text) => {
                          // Don't add interim to chat, only final messages
                        }}
                        onVoiceCommand={handleVoiceCommand}
                        onResponse={handleResponse}
                      />
                    </div>

                    <style>{`
                      @keyframes slideIn {
                        from {
                          opacity: 0;
                          transform: translateY(-10px);
                        }
                        to {
                          opacity: 1;
                          transform: translateY(0);
                        }
                      }
                      
                      /* Custom scrollbar */
                      ::-webkit-scrollbar {
                        width: 4px;
                      }
                      ::-webkit-scrollbar-track {
                        background: rgba(255, 255, 255, 0.02);
                        border-radius: 10px;
                      }
                      ::-webkit-scrollbar-thumb {
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 10px;
                      }
                      ::-webkit-scrollbar-thumb:hover {
                        background: rgba(255, 255, 255, 0.2);
                      }
                    `}</style>
                  </div>
                </AppShell>
              </ProtectedRoute>
            }
            />
            
            <Route
              path="/app/subscription"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <div className="p-8 max-w-6xl mx-auto">
                      <p className="text-xs tracking-[0.25em] text-amber-500/80 font-mono uppercase mb-2">
                        Billing
                      </p>
                      <h1 className="font-display text-3xl text-bone mb-8">Your plan</h1>
                      <Subscription embedded />
                    </div>
                  </AppShell>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
}