import { useState, useEffect, useRef } from "react";
import { Send, Mic, MicOff, Wallet, TrendingUp, Target, Sparkles } from "lucide-react";
import JarvisCore from "../components/JarvisCore";
import Panel from "../components/Panel";
import { useData } from "../context/DataContext";

// API URL from environment
const API_URL = import.meta.env?.VITE_API_BASE_URL;

const MOOD_LABEL = {
  idle: "STANDING BY",
  listening: "LISTENING",
  thinking: "PROCESSING",
  speaking: "RESPONDING",
  happy: "POSITIVE SIGNAL",
  concerned: "FLAGGED",
};

function currency(n) {
  const abs = Math.abs(n);
  return `${n < 0 ? "-" : ""}$${abs.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

// Agent configurations
const AGENTS = {
  budget: {
    id: "budget",
    name: "Financial Coach",
    icon: Wallet,
    subtitle: "Smart Allocation Agent",
    status: "Analyzing spending...",
    color: "amber",
    description: "Hello! I'm your Financial Coach. How can I help you manage your finances today?",
    initialMessage: "Hi, I am your Financial Coach. Ask me about budget allocation, spending patterns, or get personalized recommendations.",
    endpoint: "/ai/chat/transaction",
    buildFallbackReply: function(query, transactions) {
      const q = query.toLowerCase();
      const spend = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
      
      const byCategory = {};
      transactions
        .filter((t) => t.amount < 0)
        .forEach((t) => {
          byCategory[t.category] = (byCategory[t.category] || 0) + Math.abs(t.amount);
        });
      const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
      
      if (transactions.length === 0) {
        return { text: "I don't have any transactions loaded yet. Please import data to get started with budget planning.", mood: "concerned" };
      }
      
      if (/budget|allocate|spending|category/.test(q)) {
        if (sorted.length === 0) return { text: "I don't see any spending data yet. Start tracking your expenses to get budget insights.", mood: "idle" };
        let response = `Based on your spending, I recommend the following budget allocation:\n\n`;
        sorted.slice(0, 5).forEach(([cat, amt]) => {
          const pct = ((amt / spend) * 100).toFixed(1);
          response += `• ${cat}: ${currency(amt)} (${pct}% of total)\n`;
        });
        response += `\nTotal spend: ${currency(spend)}`;
        return { text: response, mood: "happy" };
      }
      
      if (/recommend|suggestion|advice/.test(q)) {
        const top = sorted[0];
        if (top && (top[1] / spend) > 0.3) {
          return { 
            text: `I notice ${top[0]} is ${((top[1]/spend)*100).toFixed(1)}% of your spending. Consider setting a monthly budget of ${currency(top[1] * 0.8)} to save 20% in this category.`, 
            mood: "concerned" 
          };
        }
        return { text: "Your spending is well distributed. Continue monitoring your top categories to maintain healthy budget allocation.", mood: "happy" };
      }
      
      return { text: "I can help you with budget allocation, spending analysis, and savings recommendations. What would you like to know?", mood: "idle" };
    }
  },
  Investment: {
    id: "Investment",
    name: "Investment Advisor",
    icon: TrendingUp,
    subtitle: "Real-time Monitoring",
    status: "Tracking transactions...",
    color: "cyan",
    description: "Track your expenses in real-time and get insights on your spending habits.",
    initialMessage: "Hi, I am your Investment Advisor. Ask me about your investment portfolio, market trends, or get personalized advice.",
    endpoint: "/ai/chat/transaction",
    buildFallbackReply: function(query, transactions) {
      const q = query.toLowerCase();
      const expenses = transactions.filter((t) => t.amount < 0);
      const total = expenses.reduce((s, t) => s + Math.abs(t.amount), 0);
      
      if (transactions.length === 0) {
        return { text: "No transactions tracked yet. Import your data to start tracking investments.", mood: "concerned" };
      }
      
      if (/recent|latest|last/.test(q)) {
        const recent = transactions.slice(-5).reverse();
        let response = "Your 5 most recent transactions:\n\n";
        recent.forEach(t => {
          response += `• ${t.category}: ${currency(t.amount)} (${t.date || 'Unknown date'})\n`;
        });
        return { text: response, mood: "idle" };
      }
      
      if (/total|spend|amount/.test(q)) {
        return { 
          text: `Total expenses tracked: ${currency(total)} across ${expenses.length} transactions.`, 
          mood: total > 10000 ? "concerned" : "happy" 
        };
      }
      
      if (/alert|monitor|track/.test(q)) {
        const large = expenses.filter(t => Math.abs(t.amount) > 1000);
        if (large.length > 0) {
          let response = `⚠️ Large transactions detected:\n\n`;
          large.slice(0, 3).forEach(t => {
            response += `• ${currency(t.amount)} in ${t.category}\n`;
          });
          return { text: response, mood: "concerned" };
        }
        return { text: "No large transactions detected. Your spending patterns appear normal.", mood: "happy" };
      }
      
      return { text: "I can show you recent transactions, total spending, or alert you to unusual patterns. What would you like to know?", mood: "idle" };
    }
  },
  savings: {
    id: "savings",
    name: "Savings Coach",
    icon: Target,
    subtitle: "Goal Achievement",
    status: "Finding opportunities...",
    color: "emerald",
    description: "Optimize your savings and achieve your financial goals faster.",
    initialMessage: "Hi, I am your Savings Coach. Ask me about savings goals, optimization strategies, or get personalized tips.",
    endpoint: "/ai/chat/transaction",
    buildFallbackReply: function(query, transactions) {
      const q = query.toLowerCase();
      const revenue = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
      const spend = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
      const net = revenue - spend;
      
      if (transactions.length === 0) {
        return { text: "I need transaction data to identify savings opportunities. Please import your data first.", mood: "concerned" };
      }
      
      if (/goal|target|save/.test(q)) {
        const savingsRate = revenue > 0 ? ((net / revenue) * 100).toFixed(1) : 0;
        return { 
          text: `Current savings rate: ${savingsRate}%\n\nBased on your income of ${currency(revenue)}, you could save ${currency(revenue * 0.2)} per month by aiming for a 20% savings rate.\n\n${net > 0 ? 'You\'re on track!' : 'Consider reducing expenses to reach your savings goals.'}`,
          mood: net > 0 ? "happy" : "concerned"
        };
      }
      
      if (/opportunity|optimize|improve/.test(q)) {
        const byCategory = {};
        transactions
          .filter((t) => t.amount < 0)
          .forEach((t) => {
            byCategory[t.category] = (byCategory[t.category] || 0) + Math.abs(t.amount);
          });
        const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
        
        if (sorted.length === 0) return { text: "No spending data to analyze for optimization opportunities.", mood: "idle" };
        
        const top = sorted[0];
        const savingsPotential = top[1] * 0.15;
        return {
          text: `💡 Optimization opportunity: Reducing ${top[0]} by 15% could save ${currency(savingsPotential)} monthly.\n\nOther suggestions:\n• Review subscription services\n• Compare insurance rates\n• Negotiate bills and utilities`,
          mood: "happy"
        };
      }
      
      return { text: "I can help you set savings goals, find optimization opportunities, and track your progress. What would you like to explore?", mood: "idle" };
    }
  }
};

export default function SmartBudgeting() {
  const { transactions, user, token } = useData();
  const [selectedAgent, setSelectedAgent] = useState("budget");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [mood, setMood] = useState("idle");
  const [level, setLevel] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(typeof window !== "undefined" ? window.speechSynthesis : null);
  const voicesRef = useRef([]);

  // Reset messages when agent changes
  useEffect(() => {
    const agent = AGENTS[selectedAgent];
    setMessages([
      {
        role: "assistant",
        text: agent.initialMessage,
      },
    ]);
    setMood("idle");
  }, [selectedAgent]);

  // Preload TTS voices
  useEffect(() => {
    if (!synthesisRef.current) return;
    const loadVoices = () => {
      voicesRef.current = synthesisRef.current.getVoices();
    };
    loadVoices();
    synthesisRef.current.onvoiceschanged = loadVoices;
    return () => {
      synthesisRef.current?.cancel();
    };
  }, []);

  // Get auth token helper
  const getAuthToken = () => {
    return token || localStorage.getItem('token') || localStorage.getItem('authToken') || user?.token;
  };

  function speak(text) {
    if (!synthesisRef.current || !text) return;
    synthesisRef.current.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.98;
    utter.pitch = 1;
    utter.volume = 1;
    utter.lang = "en-US";
    const voices = voicesRef.current.length ? voicesRef.current : synthesisRef.current.getVoices();
    const preferred = voices.find((v) =>
      ["Google", "Samantha", "Microsoft", "Daniel", "Alex", "Victoria", "Zira", "David", "Karen"].some((name) =>
        v.name.includes(name)
      )
    );
    if (preferred) utter.voice = preferred;
    synthesisRef.current.speak(utter);
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (mood === "speaking" || mood === "thinking") {
      const id = setInterval(() => setLevel(Math.random() * 0.8 + 0.2), 120);
      return () => clearInterval(id);
    }
    setLevel(0);
  }, [mood]);

  function streamText(text, mood) {
    setMood("speaking");
    let acc = "";
    let i = 0;
    setMessages((m) => [...m, { role: "assistant", text: "" }]);
    const id = setInterval(() => {
      if (i < text.length) {
        acc += text[i];
        i++;
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", text: acc };
          return copy;
        });
      }
      if (i >= text.length) {
        clearInterval(id);
        setMood(mood);
        setTimeout(() => setMood("idle"), 1600);
        setIsLoading(false);
      }
    }, 14);
  }

 async function sendToAI(userMessage) {
  const authToken = getAuthToken();
  
  if (!authToken) {
    setMood("concerned");
    const errorMsg = "Please log in to use the AI assistant.";
    setMessages((m) => [...m, { role: "assistant", text: errorMsg }]);
    setTimeout(() => setMood("idle"), 1600);
    setIsLoading(false);
    return;
  }

  // Get user ID - try multiple sources
  let userId = null;
  
  // 1. Try from user object
  if (user) {
    userId = user.id || user._id || user.userId || user.uuid || user.email;
  }
  
  // 2. Try from localStorage
  if (!userId) {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        userId = parsed.id || parsed._id || parsed.userId || parsed.uuid || parsed.email;
      }
    } catch (e) {}
  }
  
  // 3. Try from token - decode JWT to get user ID
  if (!userId && authToken) {
    try {
      // JWT tokens are base64 encoded
      const parts = authToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        userId = payload.id || payload._id || payload.userId || payload.uuid || payload.sub || payload.email;
      }
    } catch (e) {}
  }
  
  // 4. If still no userId, fetch from backend
  if (!userId) {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const data = await response.json();
      if (data.success && data.user) {
        userId = data.user.id || data.user._id || data.user.userId || data.user.uuid;
        // Store for future use
        if (userId) {
          try {
            localStorage.setItem('userId', userId);
          } catch (e) {}
        }
      }
    } catch (e) {
      console.error('Failed to fetch user from backend:', e);
    }
  }
  
  // 5. Last resort - use email or 'anonymous'
  if (!userId) {
    userId = user?.email || 'anonymous';
  }

  const currentAgent = AGENTS[selectedAgent];
  
  // Determine which endpoint to use
  const apiUrl = `${API_URL}${currentAgent.endpoint}`;
  const requestBody = {
    user_id: userId,
    question: userMessage
  };

  console.log(`📡 Calling AI service: ${apiUrl}`);
  console.log(`📤 Request body:`, requestBody);
  console.log(`👤 User ID:`, userId);
  console.log(`🔑 Auth token:`, authToken ? 'Present' : 'Missing');

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log(`📥 Response:`, data);

    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || `Server error: ${response.status}`);
    }

    if (data.success) {
      let aiResponse = data.response || data.analysis?.response || data.message;
      
      if (data.csv_files_loaded) {
        aiResponse = `📊 Based on ${data.total_files || 0} CSV file(s) (${data.total_rows || 0} transactions):\n\n${aiResponse}`;
      }

      let responseMood = "idle";
      if (aiResponse.toLowerCase().includes('recommend') || aiResponse.toLowerCase().includes('suggestion')) {
        responseMood = "happy";
      } else if (aiResponse.toLowerCase().includes('alert') || aiResponse.toLowerCase().includes('concern')) {
        responseMood = "concerned";
      }

      return { text: aiResponse, mood: responseMood };
    } else {
      throw new Error(data.response || data.message || 'Unknown error from AI service');
    }

  } catch (error) {
    console.error('AI Chat Error:', error);
    
    console.log('⚠️ Falling back to local agent response');
    const fallbackReply = currentAgent.buildFallbackReply(userMessage, transactions);
    
    let fallbackText = fallbackReply.text;
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      fallbackText = `⚠️ AI service is currently unavailable. Using offline mode:\n\n${fallbackText}`;
    } else if (error.message.includes('Authentication')) {
      fallbackText = `🔐 ${error.message}\n\n${fallbackText}`;
    }
    
    return { text: fallbackText, mood: fallbackReply.mood || "concerned" };
  }
}


  async function handleSend(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text) return;
    
    // Add user message
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setMood("listening");
    setIsLoading(true);
    
    // Show thinking state after a moment (matching working model)
    setTimeout(async () => {
      setMood("thinking");
      
      try {
        // Send to AI backend
        const result = await sendToAI(text);
        
        // Stream the response
        if (result && result.text) {
          streamText(result.text, result.mood || "idle");
          speak(result.text);
        } else {
          throw new Error('No response from AI');
        }
      } catch (error) {
        console.error('Chat error:', error);
        setIsLoading(false);
        setMood("concerned");
        const errorMsg = "Sorry, I encountered an error. Please try again.";
        setMessages((m) => [...m, { role: "assistant", text: errorMsg }]);
        setTimeout(() => setMood("idle"), 1600);
      }
    }, 350 + Math.random() * 300);
  }

  function toggleMic() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMood("concerned");
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Voice input isn't supported in this browser. Try Chrome, or type your question." },
      ]);
      setTimeout(() => setMood("idle"), 1400);
      return;
    }
    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onstart = () => {
      setIsRecording(true);
      setMood("listening");
    };
    rec.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join("");
      setInput(transcript);
    };
    rec.onend = () => {
      setIsRecording(false);
      setMood("idle");
    };
    rec.onerror = () => {
      setIsRecording(false);
      setMood("idle");
    };
    recognitionRef.current = rec;
    rec.start();
  }

  const currentAgent = AGENTS[selectedAgent];
  const AgentIcon = currentAgent.icon;

  return (
    <div className="h-screen flex flex-col relative bg-void-950/90 backdrop-blur-sm" style={{ paddingBottom: "70px" }}>
      
      {/* Agent Selection - Centered, compact */}
      <div className="absolute top-10 left-0 right-0 z-30 bg-void-950/95 border-b border-void-700/40 px-4 py-2">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2">
            {Object.values(AGENTS).map((agent) => {
              const Icon = agent.icon;
              const isSelected = selectedAgent === agent.id;
              const colorMap = {
                amber: "text-amber-400",
                cyan: "text-cyan-400",
                emerald: "text-emerald-400"
              };
              const bgColorMap = {
                amber: "bg-amber-500/10 border-amber-500/30",
                cyan: "bg-cyan-500/10 border-cyan-500/30",
                emerald: "bg-emerald-500/10 border-emerald-500/30"
              };
              return (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-md  ${
                    isSelected 
                      ? `${bgColorMap[agent.color]} border` 
                      : "hover:bg-void-800/50 border border-transparent"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${colorMap[agent.color]}`} />
                  <span className={`${isSelected ? "text-bone" : "text-bone/50"}`}>
                    {agent.name}
                  </span>
                  {isSelected && (
                    <div className={`w-1 h-1 rounded-full bg-${agent.color}-400 animate-pulse`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Jarvis Core - Behind chat, as background */}
      <div className="absolute top-[-200px] inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] opacity-80">
          <JarvisCore 
            mood={mood} 
            level={level} 
            size={500}
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Jarvis Status Overlay - Shows on top but behind chat */}
      <div className="absolute top-[650px] left-6 right-0 z-5 flex flex-col items-center pointer-events-none" style={{ paddingTop: "10px" }}>
        <p className="text-[9px] font-mono tracking-[0.2em] text-amber-500/50">
          {MOOD_LABEL[mood]}
        </p>
        <p className="text-[8px] font-mono text-bone/20">
          {currentAgent.name} · {currentAgent.subtitle}
        </p>
        <p className="text-[8px] font-mono text-bone/20 mt-0.5">
          {isLoading ? "Thinking..." : currentAgent.status}
        </p>
      </div>

      {/* Chat Messages - In front of Jarvis */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 mt-6 pt-[90px] pb-4 relative z-10" style={{ minHeight: "100vh", marginBottom: "70px" }}>
        <div className="max-w-4xl mx-auto space-y-2 pt-1">
          {/* Initial Agent Description - Semi-transparent background */}
          <div className="mb-2 p-2.5 rounded-lg bg-void-800/60 backdrop-blur-sm border border-void-700/30">
            <div className="flex items-start gap-2">
              <AgentIcon className={`w-4 h-4 text-${currentAgent.color}-400 mt-0.5 flex-shrink-0`} />
              <p className="text-xs text-bone/70 leading-relaxed">
                {currentAgent.description}
              </p>
            </div>
          </div>
          
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} w-full`}>
              <div
                className={`rounded-lg px-4 py-2.5 text-sm leading-relaxed max-w-[85%] backdrop-blur-sm ${
                  m.role === "user"
                    ? `bg-${currentAgent.color}-500/20 border border-${currentAgent.color}-500/30 text-bone ml-auto`
                    : "bg-void-800/80 backdrop-blur-sm border border-void-600/40 text-bone/90 mr-auto"
                }`}
              >
                <span className="whitespace-pre-wrap text-[13px]">{m.text}</span>
                {m.role === "assistant" && i === messages.length - 1 && mood === "speaking" && (
                  <span className="inline-block w-1 h-3 bg-amber-400 ml-0.5 align-middle animate-pulseSoft" />
                )}
              </div>
            </div>
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start w-full">
              <div className="rounded-lg px-4 py-2.5 bg-void-800/80 backdrop-blur-sm border border-void-600/40 text-bone/90 mr-auto">
                <span className="text-[13px]">Thinking</span>
                <span className="inline-block ml-1">
                  <span className="inline-block w-1 h-1 bg-amber-400 rounded-full mx-0.5 animate-pulse" />
                  <span className="inline-block w-1 h-1 bg-amber-400 rounded-full mx-0.5 animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <span className="inline-block w-1 h-1 bg-amber-400 rounded-full mx-0.5 animate-pulse" style={{ animationDelay: '0.4s' }} />
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Form - On top of everything */}
      <form
        onSubmit={handleSend}
        className="fixed bottom-0 left-0 right-0 border-t border-void-700/40 px-6 py-2.5 flex justify-center bg-void-950/90 backdrop-blur-sm z-30"
      >
        <div className="w-full max-w-4xl mx-auto flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMic}
            className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center border transition-colors ${
              isRecording
                ? "bg-ember-500/20 border-ember-500 text-ember-500"
                : "bg-void-800 border-void-600 text-bone/50 hover:text-amber-400"
            }`}
            aria-label="Toggle voice input"
            disabled={isLoading}
          >
            {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask ${currentAgent.name} about...`}
            className="flex-1 bg-void-900/80 backdrop-blur-sm border border-void-600 rounded-full px-4 py-2 text-xs text-bone focus-ring placeholder:text-bone/30"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              isLoading || !input.trim()
                ? "bg-void-700 text-void-500 cursor-not-allowed"
                : "bg-amber-500 hover:bg-amber-400 text-void-950"
            }`}
            aria-label="Send message"
          >
            <Send size={14} />
          </button>
        </div>
      </form>
    </div>
  );
}