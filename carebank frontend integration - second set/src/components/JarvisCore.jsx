import { useEffect, useRef, useState } from "react";

const MOOD_PRESETS = {
  idle: {
    hue: 38,
    hue2: 42,
    rotSpeed: 0.0007,
    counterSpeed: 0.0004,
    jitter: 0.55,
    pull: 0.0,
    pulseSpeed: 0.0012,
    pulseDepth: 0.12,
    coreBrightness: 0.7,
    flicker: 0.02,
    lineOpacity: 0.16,
    particleSpeed: 0.4,
    turbulence: 0.3,
    glowIntensity: 0.5,
  },
  listening: {
    hue: 30,
    hue2: 195,
    rotSpeed: 0.0013,
    counterSpeed: 0.0009,
    jitter: 0.35,
    pull: 0.18,
    pulseSpeed: 0.004,
    pulseDepth: 0.16,
    coreBrightness: 0.9,
    flicker: 0.015,
    lineOpacity: 0.24,
    particleSpeed: 0.6,
    turbulence: 0.2,
    glowIntensity: 0.7,
  },
  thinking: {
    hue: 36,
    hue2: 200,
    rotSpeed: 0.0026,
    counterSpeed: 0.0021,
    jitter: 1.15,
    pull: -0.12,
    pulseSpeed: 0.0065,
    pulseDepth: 0.22,
    coreBrightness: 0.85,
    flicker: 0.05,
    lineOpacity: 0.28,
    particleSpeed: 0.8,
    turbulence: 0.5,
    glowIntensity: 0.6,
  },
  speaking: {
    hue: 34,
    hue2: 46,
    rotSpeed: 0.0018,
    counterSpeed: 0.0012,
    jitter: 0.8,
    pull: 0.05,
    pulseSpeed: 0.009,
    pulseDepth: 0.32,
    coreBrightness: 1.05,
    flicker: 0.03,
    lineOpacity: 0.3,
    particleSpeed: 0.9,
    turbulence: 0.4,
    glowIntensity: 0.8,
  },
  happy: {
    hue: 42,
    hue2: 50,
    rotSpeed: 0.0022,
    counterSpeed: 0.0016,
    jitter: 0.7,
    pull: -0.2,
    pulseSpeed: 0.0075,
    pulseDepth: 0.3,
    coreBrightness: 1.15,
    flicker: 0.02,
    lineOpacity: 0.3,
    particleSpeed: 0.7,
    turbulence: 0.3,
    glowIntensity: 0.9,
  },
  concerned: {
    hue: 12,
    hue2: 4,
    rotSpeed: 0.0007,
    counterSpeed: 0.0004,
    jitter: 1.4,
    pull: 0.12,
    pulseSpeed: 0.0022,
    pulseDepth: 0.14,
    coreBrightness: 0.65,
    flicker: 0.12,
    lineOpacity: 0.2,
    particleSpeed: 0.3,
    turbulence: 0.6,
    glowIntensity: 0.4,
  },
};

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export default function JarvisCore({ 
  mood = "idle", 
  level = 0, 
  size = 800,
  className = "",
  onTranscript = null,
  onResponse = null,
  onVoiceCommand = null,
  isListening = false,
  onToggleListening = null,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const [interimTranscript, setInterimTranscript] = useState("");
  
  const stateRef = useRef({
    current: { ...MOOD_PRESETS.idle },
    nodes: [],
    t: 0,
    time: 0,
  });
  const moodRef = useRef(mood);
  const levelRef = useRef(level);
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(window.speechSynthesis);
  const isProcessingRef = useRef(false);
  const lastFinalTranscriptRef = useRef("");
  const shouldAutoRestartRef = useRef(true);
  const interimTranscriptRef = useRef("");

  // Check browser support
  useEffect(() => {
    const hasRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    const hasSynthesis = 'speechSynthesis' in window;
    
    if (!hasRecognition) {
      setError("Speech recognition not supported. Please use Chrome, Edge, or Safari.");
      setIsSupported(false);
    }
    
    if (!hasSynthesis) {
      setError(prev => prev + " Text-to-speech not supported.");
      setIsSupported(false);
    }
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (!isSupported) return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.maxAlternatives = 1;

    recognitionRef.current.onstart = () => {
      console.log('🎤 Voice recognition started');
      setError("");
      setInterimTranscript("");
      interimTranscriptRef.current = "";
      shouldAutoRestartRef.current = true;
      if (onToggleListening) {
        onToggleListening(true);
      }
    };

    recognitionRef.current.onresult = (event) => {
      let finalTranscript = '';
      let interimText = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimText += transcript;
        }
      }
      
      // Show interim transcript in chat
      if (interimText) {
        interimTranscriptRef.current = interimText;
        setInterimTranscript(interimText);
        if (onTranscript) {
          onTranscript(interimText + " ...");
        }
      }
      
      // Process final command automatically
      if (finalTranscript && finalTranscript !== lastFinalTranscriptRef.current && !isProcessingRef.current) {
        console.log('✅ Final transcript:', finalTranscript);
        lastFinalTranscriptRef.current = finalTranscript;
        setTranscript(finalTranscript);
        setInterimTranscript("");
        interimTranscriptRef.current = "";
        
        // Send final to chat (USER MESSAGE)
        if (onTranscript) {
          onTranscript(finalTranscript);
        }
        
        // Process voice command with voice response
        processVoiceCommand(finalTranscript);
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error('❌ Speech recognition error:', event.error);
      
      if (event.error === 'not-allowed') {
        setError("Microphone access denied. Please allow microphone access.");
        shouldAutoRestartRef.current = false;
      } else if (event.error === 'no-speech') {
        console.log('No speech detected, continuing...');
      } else if (event.error === 'audio-capture') {
        setError("No microphone found. Please connect a microphone.");
        shouldAutoRestartRef.current = false;
      } else {
        setError(`Error: ${event.error}`);
      }
    };

    recognitionRef.current.onend = () => {
      console.log('🎤 Voice recognition ended');

      // The mic can go idle/mute on its own (browser silence-timeout) before
      // a result is ever marked "final". If we're still holding an unsent
      // interim transcript at that point, treat it as final and send it now
      // instead of silently dropping it.
      const pending = interimTranscriptRef.current.trim();
      if (
        isListening &&
        pending &&
        pending !== lastFinalTranscriptRef.current &&
        !isProcessingRef.current
      ) {
        console.log('📤 Mic muted itself — auto-sending pending transcript:', pending);
        lastFinalTranscriptRef.current = pending;
        setTranscript(pending);
        setInterimTranscript("");
        interimTranscriptRef.current = "";

        if (onTranscript) {
          onTranscript(pending);
        }

        // Don't race with the manual restart logic below — processVoiceCommand's
        // speech response will restart the mic itself once it's done talking.
        shouldAutoRestartRef.current = false;
        processVoiceCommand(pending);
        return;
      }

      // Only auto-restart if we should and still listening
      if (shouldAutoRestartRef.current && isListening && isSupported && !isProcessingRef.current) {
        try {
          setTimeout(() => {
            if (isListening && !isProcessingRef.current) {
              recognitionRef.current.start();
              console.log('🔄 Auto-restarting recognition');
            }
          }, 300);
        } catch (e) {
          console.log('Auto-restart failed:', e);
        }
      } else if (!isListening) {
        if (onToggleListening) {
          onToggleListening(false);
        }
        if (!isSpeaking) {
          moodRef.current = "idle";
        }
      }
    };

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error('Error stopping recognition:', e);
        }
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, [isSupported, onTranscript, onToggleListening, isListening]);

  // Control listening from parent
  useEffect(() => {
    if (!isSupported || !recognitionRef.current) return;
    
    if (isListening && !isProcessingRef.current) {
      try {
        recognitionRef.current.start();
        setTranscript("Listening...");
        moodRef.current = "listening";
        setError("");
        shouldAutoRestartRef.current = true;
        console.log('▶️ Starting recognition');
      } catch (error) {
        console.error('Error starting recognition:', error);
        if (error.message && error.message.includes('already started')) {
          // Already started, ignore
        } else {
          setError("Failed to start voice recognition: " + error.message);
        }
      }
    } else if (!isListening) {
      try {
        shouldAutoRestartRef.current = false;
        recognitionRef.current.stop();
        setInterimTranscript("");
        interimTranscriptRef.current = "";
        console.log('⏹️ Stopping recognition');
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
  }, [isListening, isSupported]);

  const processVoiceCommand = (command) => {
    if (!command || isProcessingRef.current) return;
    
    isProcessingRef.current = true;
    const lowerCommand = command.toLowerCase().trim();
    let response = "";
    
    console.log('🤔 Processing command:', lowerCommand);
    
    // Enhanced command processing
    if (lowerCommand.includes('hello') || lowerCommand.includes('hi') || lowerCommand.includes('hey')) {
      response = "Hello! How can I help you today?";
    } else if (lowerCommand.includes('time') || lowerCommand.includes('clock')) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString();
      response = `The current time is ${timeStr}`;
    } else if (lowerCommand.includes('date') || lowerCommand.includes('today')) {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      response = `Today's date is ${dateStr}`;
    } else if (lowerCommand.includes('help')) {
      response = "I can tell you the time, date, or have a conversation. Just ask me anything! Try saying 'hello', 'what time is it?', or 'tell me a joke'.";
    } else if (lowerCommand.includes('thank')) {
      response = "You're welcome! Happy to help.";
    } else if (lowerCommand.includes('goodbye') || lowerCommand.includes('bye') || lowerCommand.includes('see you')) {
      response = "Goodbye! Have a great day!";
    } else if (lowerCommand.includes('joke') || lowerCommand.includes('funny')) {
      const jokes = [
        "Why don't scientists trust atoms? Because they make up everything!",
        "What do you call a fake noodle? An impasta!",
        "Why did the scarecrow win an award? Because he was outstanding in his field!",
        "What do you call a bear with no teeth? A gummy bear!",
        "Why don't eggs tell jokes? They'd crack each other up!"
      ];
      response = jokes[Math.floor(Math.random() * jokes.length)];
    } else if (lowerCommand.includes('how are you') || lowerCommand.includes('how are ya')) {
      response = "I'm functioning optimally, thank you for asking! How can I assist you?";
    } else if (lowerCommand.includes('weather') || lowerCommand.includes('temperature')) {
      response = "I don't have access to weather data yet, but I'm learning! Try asking me the time or a joke instead.";
    } else if (lowerCommand.includes('name') || lowerCommand.includes('who are you')) {
      response = "I'm Jarvis, your AI voice assistant! I'm here to help you with questions and commands.";
    } else {
      response = `I heard you say: "${command}". I'm still learning to respond to that. Try saying 'hello', 'help', or 'tell me a joke'!`;
    }
    
    console.log('💬 Response:', response);
    
    // Send response to chat (AI MESSAGE)
    if (onVoiceCommand) {
      onVoiceCommand(response);
    }
    
    if (onResponse) {
      onResponse(response);
    }
    
    // SPEAK THE RESPONSE using browser TTS
    speakResponse(response);
  };

 const speakResponse = (text) => {
  if (!text) {
    console.log('❌ Cannot speak: No text');
    isProcessingRef.current = false;
    return;
  }
  
  // Cancel any ongoing speech
  if (synthesisRef.current) {
    synthesisRef.current.cancel();
  }
  
  setIsSpeaking(true);
  moodRef.current = "speaking";
  setError("");
  
  console.log('🔊 Speaking:', text);
  
  // Function to actually speak
  const doSpeak = () => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.lang = 'en-US';
    
    // Get available voices
    const voices = synthesisRef.current.getVoices();
    console.log(`📢 Found ${voices.length} voices`);
    
    if (voices.length > 0) {
      // Try to find the best voice
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google') || 
        voice.name.includes('Samantha') ||
        voice.name.includes('Microsoft') ||
        voice.name.includes('Daniel') ||
        voice.name.includes('Alex') ||
        voice.name.includes('Victoria') ||
        voice.name.includes('Zira') ||
        voice.name.includes('David') ||
        voice.name.includes('Karen')
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
        console.log('🎤 Using voice:', preferredVoice.name);
      } else {
        utterance.voice = voices[0];
        console.log('🎤 Using default voice:', voices[0].name);
      }
    } else {
      console.warn('⚠️ No voices available, using default');
    }
    
    // Set up event handlers
    utterance.onstart = () => {
      console.log('🔊 Started speaking');
    };
    
    utterance.onend = () => {
      console.log('✅ Speech ended');
      setIsSpeaking(false);
      moodRef.current = "idle";
      isProcessingRef.current = false;
      
      // Restart mic if needed
      if (isListening) {
        shouldAutoRestartRef.current = true;
        try {
          if (recognitionRef.current) {
            recognitionRef.current.start();
            console.log('🔄 Mic restarted after speech');
          }
        } catch (e) {
          console.log('Mic already running or restart failed:', e);
        }
      }
    };
    
    utterance.onerror = (event) => {
      console.error('❌ Speech synthesis error:', event);
      console.error('Error details:', {
        error: event.error,
        message: event.message,
        type: event.type
      });
      
      setIsSpeaking(false);
      moodRef.current = "idle";
      isProcessingRef.current = false;
      
      // Don't show error for 'canceled' (it's normal)
      if (event.error !== 'canceled') {
        setError(`Speech error: ${event.error || 'Unknown error'}`);
      }
    };
    
    // Try to speak
    try {
      console.log('🎯 Speaking...');
      synthesisRef.current.speak(utterance);
    } catch (error) {
      console.error('❌ Error speaking:', error);
      setIsSpeaking(false);
      moodRef.current = "idle";
      isProcessingRef.current = false;
      setError(`Speech error: ${error.message}`);
    }
  };
  
  // Check if voices are already loaded
  const voices = synthesisRef.current.getVoices();
  if (voices.length > 0) {
    console.log('✅ Voices already loaded, speaking now');
    doSpeak();
  } else {
    console.log('⏳ Voices not loaded yet, waiting...');
    
    // Set up voice loading handler
    const handleVoicesChanged = () => {
      const newVoices = synthesisRef.current.getVoices();
      console.log(`📢 Voices loaded: ${newVoices.length}`);
      if (newVoices.length > 0) {
        // Remove listener to prevent multiple calls
        synthesisRef.current.onvoiceschanged = null;
        doSpeak();
      }
    };
    
    // Try to load voices
    synthesisRef.current.onvoiceschanged = handleVoicesChanged;
    
    // Fallback: Try again after 2 seconds even if no voices loaded
    setTimeout(() => {
      const newVoices = synthesisRef.current.getVoices();
      if (newVoices.length > 0) {
        synthesisRef.current.onvoiceschanged = null;
        console.log('✅ Voices loaded (timeout fallback)');
        doSpeak();
      } else {
        console.warn('⚠️ Still no voices after 2 seconds, trying anyway');
        synthesisRef.current.onvoiceschanged = null;
        doSpeak();
      }
    }, 2000);
  }
};

  // Load voices on component mount
  useEffect(() => {
    if (synthesisRef.current) {
      const loadVoices = () => {
        const voices = synthesisRef.current.getVoices();
        console.log('📢 Voices loaded:', voices.length);
        if (voices.length > 0) {
          console.log('Available voices:', voices.map(v => v.name).join(', '));
        }
      };
      loadVoices();
      synthesisRef.current.onvoiceschanged = loadVoices;
    }
  }, []);

  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    
    if (!canvas || !container) return;
    
    const ctx = canvas.getContext("2d", { 
      alpha: false,
      willReadFrequently: false,
    });
    
    const rect = container.getBoundingClientRect();
    const containerSize = Math.min(rect.width, rect.height, size);
    const displaySize = Math.max(containerSize, 400);
    
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = displaySize * dpr;
    canvas.height = displaySize * dpr;
    canvas.style.width = displaySize + "px";
    canvas.style.height = displaySize + "px";
    canvas.style.position = "absolute";
    canvas.style.top = "50%";
    canvas.style.left = "50%";
    canvas.style.transform = "translate(-50%, -50%)";
    ctx.scale(dpr, dpr);

    const cx = displaySize / 2;
    const cy = displaySize / 2;
    const maxR = displaySize * 0.46;

    const rings = 6;
    const nodes = [];
    for (let r = 0; r < rings; r++) {
      const ringR = maxR * (0.32 + (r / rings) * 0.68);
      const count = Math.round(18 + r * 9);
      for (let i = 0; i < count; i++) {
        const baseAngle = (i / count) * Math.PI * 2;
        nodes.push({
          ring: r,
          baseAngle,
          angle: baseAngle,
          baseR: ringR,
          radiusJitter: (Math.random() - 0.5) * maxR * 0.09,
          speedMul: 0.6 + Math.random() * 0.8,
          phase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.6 + Math.random() * 1.8,
          size: 1.2 + Math.random() * 2.8,
        });
      }
    }
    
    stateRef.current.nodes = nodes;

    let raf;
    
    const render = (timestamp) => {
      const st = stateRef.current;
      const target = MOOD_PRESETS[moodRef.current] || MOOD_PRESETS.idle;
      const lv = levelRef.current;
      
      const currentTime = timestamp / 1000;
      st.time = currentTime;

      const k = 0.045;
      for (const key of Object.keys(target)) {
        st.current[key] = lerp(st.current[key], target[key], k);
      }

      st.t += 1;
      
      ctx.fillStyle = "#0a0a12";
      ctx.fillRect(0, 0, displaySize, displaySize);

      const c = st.current;
      const flicker = 1 - c.flicker + Math.random() * c.flicker * 2;
      const pulse = Math.sin(st.t * c.pulseSpeed) * c.pulseDepth + 1;
      const energy = 1 + level * 0.6;

      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 1.5);
      bgGrad.addColorStop(0, `hsla(${c.hue}, 70%, 30%, 0.05)`);
      bgGrad.addColorStop(1, `hsla(${c.hue2}, 50%, 20%, 0)`);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, displaySize, displaySize);

      ctx.save();
      ctx.strokeStyle = `hsla(${c.hue}, 90%, 60%, 0.08)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, maxR * 1.02, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      const coreR = maxR * 0.24 * pulse * energy;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 2.6);
      grad.addColorStop(0, `hsla(${c.hue}, 100%, 78%, ${0.95 * c.coreBrightness * flicker})`);
      grad.addColorStop(0.35, `hsla(${c.hue}, 95%, 62%, ${0.45 * c.coreBrightness})`);
      grad.addColorStop(1, `hsla(${c.hue2}, 90%, 50%, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * 2.6, 0, Math.PI * 2);
      ctx.fill();

      const pixelSize = Math.max(4, coreR * 0.12);
      const corePixels = Math.floor(coreR * 0.55 / pixelSize);
      ctx.fillStyle = `hsla(${c.hue}, 100%, 90%, ${0.9 * flicker})`;
      for (let i = -corePixels; i <= corePixels; i++) {
        for (let j = -corePixels; j <= corePixels; j++) {
          const dist = Math.sqrt(i*i + j*j);
          if (dist <= corePixels) {
            const x = cx + i * pixelSize;
            const y = cy + j * pixelSize;
            const alpha = 1 - (dist / corePixels) * 0.5;
            ctx.globalAlpha = alpha * 0.9 * flicker;
            ctx.fillRect(x - pixelSize/2, y - pixelSize/2, pixelSize, pixelSize);
          }
        }
      }
      ctx.globalAlpha = 1;

      const positions = [];
      for (const n of nodes) {
        const dirMul = n.ring % 2 === 0 ? 1 : -1;
        const speed = (c.rotSpeed * dirMul + (dirMul < 0 ? -c.counterSpeed : c.counterSpeed) * 0.4) * n.speedMul;
        n.angle = n.baseAngle + st.t * speed;

        const jitterAmt = Math.sin(st.t * 0.01 * n.twinkleSpeed + n.phase) * c.jitter * (maxR * 0.012);
        const pull = c.pull * maxR * 0.18 * Math.sin(st.t * 0.006 + n.ring);
        const r = n.baseR + n.radiusJitter + jitterAmt - pull;

        const x = cx + Math.cos(n.angle) * r;
        const y = cy + Math.sin(n.angle) * r * 0.94;
        positions.push({ x, y, ring: n.ring, size: n.size });
      }

      ctx.lineWidth = 0.6;
      for (let i = 0; i < positions.length; i += 3) {
        const a = positions[i];
        const b = positions[(i + 7) % positions.length];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxR * 0.5) {
          const op = (1 - dist / (maxR * 0.5)) * c.lineOpacity;
          ctx.strokeStyle = `hsla(${c.hue}, 85%, 65%, ${op})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      for (const p of positions) {
        const depthOp = 0.35 + (p.ring / rings) * 0.55;
        const sizeVar = p.size * (0.8 + energy * 0.3);
        const brightness = 68 + p.ring * 2;
        const pixelSize2 = Math.max(3, sizeVar * 0.6);
        const numPixels = Math.max(1, Math.floor(sizeVar / pixelSize2));
        
        const glowSize = sizeVar * 3;
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
        glow.addColorStop(0, `hsla(${c.hue}, 95%, ${brightness + 20}%, ${0.2 * depthOp * flicker})`);
        glow.addColorStop(0.5, `hsla(${c.hue}, 90%, ${brightness}%, ${0.1 * depthOp * flicker})`);
        glow.addColorStop(1, `hsla(${c.hue}, 85%, ${brightness - 20}%, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = `hsla(${c.hue}, 95%, ${brightness}%, ${depthOp * flicker})`;
        for (let i = -numPixels; i <= numPixels; i++) {
          for (let j = -numPixels; j <= numPixels; j++) {
            const dist = Math.sqrt(i*i + j*j);
            if (dist <= numPixels) {
              const x = p.x + i * pixelSize2;
              const y = p.y + j * pixelSize2;
              const alpha = 1 - (dist / numPixels) * 0.3;
              ctx.globalAlpha = alpha * depthOp * flicker;
              ctx.fillRect(x - pixelSize2/2, y - pixelSize2/2, pixelSize2, pixelSize2);
            }
          }
        }
        ctx.globalAlpha = 1;
      }

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(st.t * 0.0016);
      ctx.strokeStyle = `hsla(${c.hue2}, 90%, 65%, 0.5)`;
      ctx.lineWidth = 2;
      for (let a = 0; a < 4; a++) {
        const start = (a / 4) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(0, 0, maxR * 1.09, start, start + 0.32);
        ctx.stroke();
      }
      ctx.restore();

      ctx.fillStyle = `hsla(${c.hue}, 50%, 60%, 0.3)`;
      ctx.font = `${Math.min(displaySize * 0.018, 10)}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const status = isListening ? "● LISTENING" : isSpeaking ? "● SPEAKING" : "○ IDLE";
      const statusColor = isListening ? "#4a90e2" : isSpeaking ? "#e2a94a" : "#666";
      ctx.fillStyle = statusColor;
      ctx.globalAlpha = 0.6;
      ctx.fillText(status, cx, displaySize * 0.05);
      ctx.globalAlpha = 1;

      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(render);
    };
    
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [size, isListening, isSpeaking, level]);

  return (
    <div 
      ref={containerRef}
      className={className}
      // style={{
      //   width: "100%",
      //   height: "100%",
      //   minHeight: "400px",
      //   minWidth: "400px",
      //   position: "relative",
      //   background: "#0a0a12",
      //   overflow: "hidden",
      //   borderRadius: "12px",
      //   boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8)",
      // }}
      style={{
  width: "40%",
  height: "100%",
  minHeight: "400px",
  minWidth: "400px",
  padding: "30px",
  marginTop: "100px",
  position: "relative",
  background: "transparent",
  overflow: "hidden",
  borderRadius: "25%",
  backdropFilter: "blur(1px)",
  WebkitBackdropFilter: "blur(10px)",
}}
    >
      {/* <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          maxWidth: "1000px",
          maxHeight: "1000px",
          aspectRatio: "1/1",
          objectFit: "contain",
        }}
        aria-label={`AI presence indicator, current state: ${mood}`}
      /> */}

      <canvas
  ref={canvasRef}
  style={{
    display: "block",
    width: "100%",
    height: "100%",
    maxWidth: "1000px",
    maxHeight: "1000px",
    aspectRatio: "1/1",
    objectFit: "contain",
    borderRadius: "50%",
  }}
  aria-label={`AI presence indicator, current state: ${mood}`}
/>
      
      {error && (
        <div style={{
          position: "absolute",
          bottom: "80px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(255, 68, 68, 0.15)",
          border: "1px solid rgba(255, 68, 68, 0.3)",
          borderRadius: "8px",
          padding: "10px 20px",
          color: "#ff6b6b",
          fontSize: "12px",
          fontFamily: "monospace",
          maxWidth: "80%",
          textAlign: "center",
          backdropFilter: "blur(10px)",
          zIndex: 10,
        }}>
          {error}
        </div>
      )}
      
      {isListening && !isSpeaking && (
        <div style={{
          position: "absolute",
          bottom: "80px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(74, 144, 226, 0.1)",
          border: "1px solid rgba(74, 144, 226, 0.2)",
          borderRadius: "8px",
          padding: "8px 16px",
          color: "#4a90e2",
          fontSize: "12px",
          fontFamily: "monospace",
          backdropFilter: "blur(10px)",
          zIndex: 10,
          animation: "pulse 1.5s ease-in-out infinite",
        }}>
          🎤 Listening... Speak now
        </div>
      )}
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

export { MOOD_PRESETS };