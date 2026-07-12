import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Mic, MicOff, Sparkles, RefreshCw, Volume2 } from "lucide-react";
import { StadiumState } from "../types";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

interface AIChatProps {
  state?: StadiumState;
}

export default function AIChat({ state }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg_init_1",
      sender: "ai",
      text: "VIOS Operations Brain online. System links secured. Ask me anything about stadium egress, queue mitigations, emergency evacuations, or active tactical scenarios.",
      timestamp: "10:00 PM",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioWave, setAudioWave] = useState<number[]>([12, 18, 14, 28, 45, 12, 8, 15, 30, 20]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Voice Interaction visual simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setAudioWave(Array.from({ length: 12 }, () => Math.floor(Math.random() * 40) + 5));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const lastScenarioRef = useRef<string>("");
  const lastEvacActiveRef = useRef<boolean>(false);

  // Automated reactive multi-scenario AI alerts & acting
  useEffect(() => {
    if (!state) return;
    const currentScenario = state.scenario;
    const isEvacActive = state.incidents.some(
      (i) =>
        i.priority === "emergency" ||
        i.title.toLowerCase().includes("evacuation") ||
        i.description.toLowerCase().includes("evacuation")
    );

    // 1. Prioritized Evacuation Protocol Dispatch
    if (isEvacActive && !lastEvacActiveRef.current) {
      lastEvacActiveRef.current = true;
      lastScenarioRef.current = currentScenario;

      const hasEvacMessage = messages.some((m) => m.id.startsWith("msg_evac_"));
      if (!hasEvacMessage) {
        const evacMsg: ChatMessage = {
          id: "msg_evac_" + Date.now(),
          sender: "ai",
          text: `🚨 **VIOS VENUE-WIDE CRITICAL EVACUATION DIRECTION PROTOCOL ACTIVE** 🚨\n\nAll stadium sectors are flashing red. Direct egress lines have been optimized based on live load-density metrics to ensure zero-casualty crowd dissipation:\n\n1. **NORTH STANDS & REAR PLAZA (Sectors 100-115 & 201-210):**\n   - **Primary Gateway:** **Gate A (Metro North)** (Distance: ~120m, Status: Forced Open, Queue Wait: ~3 mins).\n   - **Egress Path:** Main north portals are fully cleared. Calming PA audio loops activated.\n\n2. **WEST CLUB & PRESS BOX (Sectors 131-140 & 226-235):**\n   - **Primary Gateway:** **Gate B (West Concourse)** (Distance: ~130m, Status: Forced Open).\n   - **Egress Path:** Main west escalators unlocked and reversed for continuous descending crowd flow.\n\n3. **SOUTH DECK & LOWER BOWL (Sectors 126-130 & 221-225):**\n   - **Primary Gateway:** **Gate C (Metro South)** (Distance: ~110m, Status: Forced Open).\n   - **Egress Path:** High-congestion buffer zones opened. Emergency shuttle trains queued on standby.\n\n4. **EAST CONCOURSE & FAMILY DECK (Sectors 116-125 & 211-220):**\n   - **Primary Gateway:** **Gate D (East Concourse)** (Distance: ~140m, Status: Forced Open).\n   - **Egress Path:** Fire safety partition walls retracted to form direct open-air exit conduits.\n\n5. **VIP SUITES & SUITE DECK:**\n   - **Primary Gateway:** **Gate E (VIP Entrance)**.\n   - **Egress Path:** Kept exclusively for suites to avoid crowding general spectator pathways.\n\n🛡️ **PRE-EMPTIVE CRUSH-PREVENTION MEASURES DEPLOYED:**\n- All LED Ribbon boards redirected to show high-contrast green escape arrows.\n- Metro trains switched to continuous shuttle loop; 40 emergency buses deployed on standby.\n- Calming PA voice announcements active at all pinch-points to govern exit pacing.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, evacMsg]);
      }
      return;
    }

    if (!isEvacActive) {
      lastEvacActiveRef.current = false;
    }

    // 2. Standard Scenario Reactive Alerts
    if (currentScenario !== lastScenarioRef.current) {
      lastScenarioRef.current = currentScenario;
      
      const scenarioAlerts: Record<string, string> = {
        normal: `🟢 **FIFA VENUE INTELLIGENCE OS (VIOS) CORE BASES RESTORED** 🟢\n\nAll stadium sectors, ingress lines, and transit loops have been successfully normalized. Continuous IoT sensor grids report zero active bottlenecks, with stadium temperatures holding at a comfortable 20°C. Operations are holding at peak performance.`,
        heavy_rain: `🌧️ **WEATHER DEVIATION: STORM CONVERGENCE MITIGATIONS DEPLOYED** 🌧️\n\nA localized severe downpour has been detected. Operational adjustments have been dynamically auto-dispatched:\n\n1. **CONCOURSE FLUIDITY:** Opened secondary shelter spaces inside East Concourse to relieve crowd clustering.\n2. **ACCESSWAY SECURITY:** Deployed wet-weather traction mats at all external stairs. Sector 102 medical teams put on alert for slip hazards.\n3. **SPECTATOR GUIDANCE:** Screen ribbon system updated to suggest purchasing umbrellas at official FIFA shops.`,
        medical_emergency: `🚑 **CRITICAL HEALTH DISPATCH: HEAT EXHAUSTION DETECTED** 🚑\n\nAn emergency bio-metric alert has been triggered from Lower Section 114 (Row K):\n\n1. **MEDIC OUTSIDE ENTRANCE:** First Responder Team 4 has been dispatched from East Station with a trauma stretcher (ETA: 1m 45s).\n2. **ACCESS CORRIDORS:** Nearby volunteer guides instructed to hold back incoming pedestrian lines to keep first-responder corridors open.\n3. **CCTV LOCK:** Zone camera 14 locked on location coordinates.`,
        power_outage: `⚡ **POWER LOSS CRITICAL DETECTED: AUXILIARY GENERATION ACTIVE** ⚡\n\nA main utility substation failure has severed primary grid power to Substation Block East:\n\n1. **UPS & GENERATOR BRIDGING:** Auxiliary batteries and primary backup generators started seamlessly within 120ms.\n2. **LOAD SHEDDING ACTIONS:** Non-essential concourse retail signage and climate systems shed. Field floodlights and emergency PA circuits remain at 100% load.\n3. **RESPONSE TEAM:** Electrical engineering taskforce dispatched to local grid line.`,
        metro_delay: `🚆 **TRANSIT INTERRUPT INTRUSION: METRO DELAY ON SOUTH PLAZA** 🚆\n\nA signaling malfunction on the Metro South Line has halted southbound departures, causing severe spectator crowd backups at South Plaza (Gate C):\n\n1. **BUS SHUTTLE FLUIDITY:** Triggered emergency transport link: 24 active high-capacity shuttle buses routed to Gate C to bypass metro delays.\n2. **WAYFINDING SIGNAGE:** Digital displays and dynamic ribbon boards updated to direct patrons toward Metro North and Gate B.\n3. **PACING VECTORS:** Gate C turnstiles throttled to ensure pedestrian flow remains steady and secure.`,
        vip_arrival: `👑 **HIGH-PROFILE SECURITY INBOUND PROTOCOL ACTIVATED** 👑\n\nDignitary motorcades are approaching the VIP concourse loop at Gate E:\n\n1. **ISOLATION FIELD:** Perimeter barriers secured around Gate E; all general public ingress rerouted to Gate D.\n2. **ESCORT UNIT COORDINATION:** Tactical liaison officers deployed to lead media blocks.\n3. **STAFF ALLOCATION:** 12 bilingual volunteers dispatched to VIP luxury boxes to coordinate language accessibility.`,
        equipment_failure: `🔧 **EQUIPMENT NETWORK MALFUNCTION: GATE C OVERLOAD** 🔧\n\nRFID/NFC scanning turnstiles at Gate C have suffered a major network drop:\n\n1. **PATRON DIVERSION:** Active spectator routing rerouted via mobile push alerts to Gate A and Gate B.\n2. **MANUAL ESCORT TEAMS:** Volunteers dispatched with handheld mobile validator tablets to process tickets manually at Gate C.\n3. **SYSTEM TELEMETRY:** Network engineers are rebooting local switches.`,
        high_food_demand: `🍔 **CONCESSION QUEUE SPIKE: EAST/WEST COLLISION** 🍔\n\nSensors detect concessions queue wait times exceeding 30 minutes, with hot items depleted to under 25% stock levels:\n\n1. **MOBILE ORDER BOOST:** Dynamic signage switched to offer mobile pickup options.\n2. **STOCK BALANCING:** Initiated inventory transfers from overstocked hub zones.\n3. **REDIRECT SUGGESTIONS:** Video screens showing live short-queue concessions (Beverage North: <3m wait).`
      };

      const customMsg = scenarioAlerts[currentScenario];
      if (customMsg) {
        const autoMsg: ChatMessage = {
          id: `msg_auto_${currentScenario}_${Date.now()}`,
          sender: "ai",
          text: customMsg,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, autoMsg]);
      }
    }
  }, [state, messages]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setLoading(true);

    try {
      const response = await fetch("/api/simulation/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: textToSend }),
      });
      if (!response.ok) throw new Error("Chat failure");
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Chat returned non-JSON response");
      }
      const data = await response.json();

      const aiMsg: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        sender: "ai",
        text: data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      const offlineMsg: ChatMessage = {
        id: `msg_ai_err_${Date.now()}`,
        sender: "ai",
        text: "I was unable to consult my primary neural cores. Restoring last-known operational patterns for the requested sector.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, offlineMsg]);
    } finally {
      setLoading(false);
    }
  };

  const toggleVoiceRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      // Simulate voice-to-text input on stop
      const simulatedVoiceQueries = [
        "What is causing congestion?",
        "Predict next 30 minutes.",
        "Show evacuation strategy.",
        "What if heavy rain starts now?",
      ];
      const randomQuery = simulatedVoiceQueries[Math.floor(Math.random() * simulatedVoiceQueries.length)];
      handleSendMessage(randomQuery);
    } else {
      setIsRecording(true);
    }
  };

  const suggestedQueries = [
    { label: "What is causing congestion?", q: "What is causing congestion?" },
    { label: "Predict next 30m", q: "Predict next 30 minutes." },
    { label: "Evacuation strategy", q: "Show evacuation strategy." },
    { label: "What if rain starts?", q: "What if heavy rain starts now?" },
  ];

  return (
    <div className="tactical-card h-full flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden min-h-[480px]">
      {/* Panel Header */}
      <div className="border-b border-orange-500/10 p-4 bg-slate-950/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/15 text-orange-400 border border-orange-500/20 rounded-lg animate-pulse">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-slate-100 text-sm tracking-tight flex items-center gap-1.5 uppercase">
              VIOS OPERATIONS CHAT
            </h3>
            <p className="text-[10px] font-mono text-slate-500 uppercase">
              MODEL: GEMINI-3.5-FLASH-COGNITIVE // TYPE: GROUNDED AGENT
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-orange-500 animate-ping" />
          <span className="font-mono text-[9px] text-orange-400 uppercase tracking-widest">SECURE LINK</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {messages.map((msg) => {
          const isAI = msg.sender === "ai";
          return (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[85%] ${
                isAI ? "self-start items-start" : "self-end items-end"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[9px] text-slate-500 uppercase">
                  {isAI ? "VIOS_BRAIN" : "OPERATOR_COMMANDER"}
                </span>
                <span className="font-mono text-[8px] text-slate-600">{msg.timestamp}</span>
              </div>
              <div
                className={`p-3.5 rounded-2xl text-xs font-sans leading-relaxed whitespace-pre-wrap ${
                  isAI
                    ? "bg-slate-950/80 border border-orange-500/10 text-slate-200 rounded-tl-none"
                    : "bg-orange-500/10 border border-orange-500/25 text-orange-300 rounded-tr-none shadow-[0_0_15px_rgba(249,115,22,0.05)]"
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="self-start items-start max-w-[85%] flex flex-col">
            <span className="font-mono text-[9px] text-slate-500 mb-1 uppercase">VIOS_BRAIN</span>
            <div className="bg-slate-950/80 border border-orange-500/10 p-3 rounded-2xl rounded-tl-none flex items-center gap-2 text-xs font-mono text-slate-400">
              <RefreshCw className="w-3.5 h-3.5 text-orange-400 animate-spin" />
              <span>COGNITIVE GRAPH ANALYSIS IN PROGRESS...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Quick Queries Pills */}
      <div className="px-4 pb-2 pt-1 flex flex-wrap gap-1.5 bg-slate-950/20">
        {suggestedQueries.map((pill, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(pill.q)}
            className="px-2.5 py-1 text-[10px] font-sans border border-orange-500/15 bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:border-orange-500/30 hover:bg-slate-900 rounded-full transition-all cursor-pointer"
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Input Tray */}
      <div className="p-4 border-t border-orange-500/10 bg-slate-950/40 flex flex-col gap-3">
        {/* Animated Speech capture waveform */}
        {isRecording && (
          <div className="flex items-center justify-between bg-orange-500/5 border border-orange-500/20 rounded-xl px-4 py-2 animate-pulse">
            <div className="flex items-center gap-2 text-orange-400 text-[10px] font-mono">
              <Volume2 className="w-3.5 h-3.5 animate-bounce" />
              <span>CAPTURING VOICE PERIMETER AUDIO INGEST...</span>
            </div>
            <div className="flex items-end gap-1.5 h-6">
              {audioWave.map((h, i) => (
                <div
                  key={i}
                  className="w-0.5 bg-orange-500 rounded-full transition-all duration-100"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Voice Input Mic Button */}
          <button
            onClick={toggleVoiceRecording}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              isRecording
                ? "bg-rose-500 text-slate-950 border-rose-500 animate-pulse"
                : "bg-slate-950 text-slate-400 border-orange-500/20 hover:text-slate-200 hover:border-orange-500/40"
            }`}
            title={isRecording ? "Stop voice input" : "Start voice input"}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputValue)}
            placeholder="Type your strategic query (e.g. what is causing congestion?)..."
            className="flex-1 min-w-0 px-4 py-3 bg-slate-950 border border-orange-500/20 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50"
          />

          {/* Send Button */}
          <button
            onClick={() => handleSendMessage(inputValue)}
            className="p-3 bg-orange-500 hover:bg-orange-400 text-slate-950 rounded-xl font-medium transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_20px_rgba(249,115,22,0.5)] cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
