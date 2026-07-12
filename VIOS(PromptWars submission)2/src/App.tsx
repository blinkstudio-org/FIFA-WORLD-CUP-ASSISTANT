import React, { useState, useEffect } from "react";
import { StadiumState, GateState, SecurityIncident, AccessibilityRequest, WorkspaceRole } from "./types";
import DigitalTwin from "./components/DigitalTwin";
import ScenarioSimulator from "./components/ScenarioSimulator";
import TimelinePlayback from "./components/TimelinePlayback";
import PredictionsPanel from "./components/PredictionsPanel";
import AIChat from "./components/AIChat";
import ExecutiveBriefing from "./components/ExecutiveBriefing";
import { useGateCongestionMonitor } from "./hooks/useGateCongestionMonitor";
import {
  Shield,
  Activity,
  Users,
  Bus,
  Leaf,
  Smile,
  Clock,
  AlertTriangle,
  Cpu,
  Tv,
  CheckCircle,
  TrendingUp,
  Sliders,
  Send,
  SlidersHorizontal,
  Flame,
  Zap,
  Power,
  VolumeX,
  FileText
} from "lucide-react";

export default function App() {
  const [stadiumState, setStadiumState] = useState<StadiumState | null>(null);
  const [history, setHistory] = useState<StadiumState[]>([]);
  const [playbackIndex, setPlaybackIndex] = useState<number>(-1);
  const [activeRole, setActiveRole] = useState<WorkspaceRole>("operations");
  const [inspectionInfo, setInspectionInfo] = useState<string>(
    "Ready. Click any stadium sector or gate on the Digital Twin to inspect telemetry."
  );
  const [customNotification, setCustomNotification] = useState<{
    text: string;
    type: "info" | "warning" | "critical" | "emergency";
  } | null>(null);
  const [congestionThreshold, setCongestionThreshold] = useState<number>(25);

  // Automated gate congestion alert monitor hook
  useGateCongestionMonitor(stadiumState, setCustomNotification, congestionThreshold, 80);

  // UTC Real-time clock simulator
  const [utcTime, setUtcTime] = useState<string>("");

  // Update clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setUtcTime(now.toISOString().replace("T", " ").substring(0, 19) + " UTC");
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch live simulation state from Express server
  const fetchSimulationState = async () => {
    try {
      const response = await fetch("/api/simulation/state");
      if (!response.ok) throw new Error("Failed to load server state");
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response for state query");
      }
      const data = await response.json();
      setStadiumState(data.activeState);
      setHistory(data.history);
      
      // If we are not currently replaying history, match playbackIndex to latest present item
      if (playbackIndex === -1 || playbackIndex === data.history.length - 2) {
        setPlaybackIndex(data.history.length - 1);
      }
    } catch (err) {
      console.error("Error fetching simulation state:", err);
    }
  };

  useEffect(() => {
    fetchSimulationState();
    // Poll the server state every 10 seconds for real-time live-telemetry updates
    const poll = setInterval(fetchSimulationState, 10000);
    return () => clearInterval(poll);
  }, []);

  // Send updated metrics to server for Digital Twin sync
  const updateServerState = async (updates: Partial<StadiumState>) => {
    if (!stadiumState) return;
    try {
      const response = await fetch("/api/simulation/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to sync client updates");
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response for update query");
      }
      const data = await response.json();
      setStadiumState(data.activeState);
      // Re-fetch history to sync graphs
      fetchSimulationState();
    } catch (err) {
      console.error("Error updating server state:", err);
    }
  };

  // Switch Scenarios
  const handleSelectScenario = async (scenario: string) => {
    try {
      const response = await fetch("/api/simulation/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario }),
      });
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Server returned non-JSON response for scenario change");
        }
        const data = await response.json();
        setStadiumState(data.activeState);
        setCustomNotification({
          text: `AI Model updated: Loading strategic predictions for stressors [${scenario.toUpperCase()}]`,
          type: scenario === "normal" ? "info" : "warning",
        });
        setTimeout(() => setCustomNotification(null), 6000);
        fetchSimulationState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // One-Click Emergency Mode Evacuation Trigger
  const handleTriggerEmergencyEvacuation = async () => {
    try {
      // Direct evac state updates
      const updatedGates: GateState[] = (stadiumState?.gates || []).map(g => ({
        ...g,
        status: "open", // Force all gates open
        occupancy: 95,
        queueTime: 3
      }));

      const emergencyIncident: SecurityIncident = {
        id: "inc_evac_" + Date.now(),
        title: "CRITICAL: ONE-CLICK EMERGENCY EVACUATION",
        section: "GLOBAL VENUE-WIDE COMMAND",
        priority: "emergency",
        status: "active",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        description: "Stadium perimeter evacuation authorized. Emergency lighting synced. All digital screens redirected.",
        assignedStaff: 45
      };

      const nextState: StadiumState = {
        ...stadiumState!,
        scenario: "security_threat",
        gates: updatedGates,
        incidents: [emergencyIncident, ...(stadiumState?.incidents || [])],
        spectatorsOutsideGates: 85000
      };

      // Optimistically update local React state for instantaneous sub-millisecond render response
      setStadiumState(nextState);

      await updateServerState({
        scenario: "security_threat",
        gates: updatedGates,
        incidents: [emergencyIncident, ...(stadiumState?.incidents || [])],
        spectatorsOutsideGates: 85000 // Aligns transit queues for immediate egress
      });

      setCustomNotification({
        text: "ALERT: VENUE-WIDE ONE-CLICK EVACUATION MODE ACTIVATED! Emergency protocols broadcast to all spectator mobile apps.",
        type: "emergency",
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger manual tick forward (+5 minutes)
  const handleTickTime = async () => {
    try {
      const response = await fetch("/api/simulation/tick", { method: "POST" });
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Server returned non-JSON response for manual tick");
        }
        const data = await response.json();
        setStadiumState(data.activeState);
        fetchSimulationState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // User Actions within the workspace panes

  // Stadium Operations: Modify gate status or staff allocation
  const handleGateAction = (gateId: string, action: "open" | "close" | "congested", volunteers?: number) => {
    if (!stadiumState) return;
    const nextGates = stadiumState.gates.map((g) => {
      if (g.id === gateId) {
        const nextStatus = action === "congested" ? "congested" : action === "close" ? "closed" : "open";
        // Calculate new queue times based on state overrides
        let nextQueue = g.queueTime;
        if (nextStatus === "closed") nextQueue = 0;
        else if (nextStatus === "congested") nextQueue = 45;
        else nextQueue = Math.max(5, Math.round(30 - (volunteers || g.volunteerCount) * 0.6));

        return {
          ...g,
          status: nextStatus as "open" | "closed" | "congested",
          volunteerCount: volunteers !== undefined ? volunteers : g.volunteerCount,
          queueTime: nextQueue,
        };
      }
      return g;
    });
    updateServerState({ gates: nextGates });
  };

  // Security: Resolve active security or medical incident
  const handleResolveIncident = (incidentId: string) => {
    if (!stadiumState) return;
    const nextIncidents = stadiumState.incidents.map((i) =>
      i.id === incidentId ? { ...i, status: "resolved" as const } : i
    ).filter(i => i.status !== "resolved"); // Remove solved ones to clear Digital Twin radar

    updateServerState({ incidents: nextIncidents });
    setCustomNotification({
      text: "Security Command: Incident resolved. Digital Twin telemetry updated.",
      type: "info",
    });
    setTimeout(() => setCustomNotification(null), 4000);
  };

  // Volunteers: Assign escort to accessibility requests
  const handleAssignVolunteer = (requestId: string, volId: string) => {
    if (!stadiumState) return;
    const nextRequests = stadiumState.accessibilityRequests.map((r) =>
      r.id === requestId ? { ...r, status: "dispatched" as const, assignedVolunteerId: volId } : r
    );
    updateServerState({
      accessibilityRequests: nextRequests,
      volunteersActive: Math.min(stadiumState.volunteersTotal, stadiumState.volunteersActive + 1),
    });
  };

  // Volunteers: Resolve accessibility assistance request
  const handleCompleteAccessibilityRequest = (requestId: string) => {
    if (!stadiumState) return;
    const nextRequests = stadiumState.accessibilityRequests.map((r) =>
      r.id === requestId ? { ...r, status: "completed" as const } : r
    );
    updateServerState({ accessibilityRequests: nextRequests });
  };

  // Transportation Command: Sliders update wait times
  const handleTransitDials = (activeShuttles: number, metroFrequencyMinutes: number) => {
    if (!stadiumState) return;
    // Calculate simulated results of operator edits
    const nextMetroWait = Math.max(2, metroFrequencyMinutes);
    const nextMetroCongestion = Math.max(20, 100 - (12 - nextMetroWait) * 6);
    const nextBusWait = Math.max(3, Math.round(25 - activeShuttles * 0.5));

    updateServerState({
      transport: {
        ...stadiumState.transport,
        metroWaitTime: nextMetroWait,
        metroCongestion: nextMetroCongestion,
        busWaitTime: nextBusWait,
        activeBuses: activeShuttles,
      },
    });
  };

  // Sustainability: Load shedding HVAC
  const handleActivateLoadShedding = () => {
    if (!stadiumState) return;
    updateServerState({
      sustainability: {
        ...stadiumState.sustainability,
        electricityKw: Math.max(300, stadiumState.sustainability.electricityKw - 180),
      },
    });
    setCustomNotification({
      text: "Sustainability Command: Active HVAC power-shedding initiated. Load reduced by 180kW.",
      type: "info",
    });
    setTimeout(() => setCustomNotification(null), 4000);
  };

  // Sustainability: Reallocate food stock
  const handleLevelConcessionStocks = () => {
    if (!stadiumState) return;
    const nextConcessions = stadiumState.concessions.map(c => ({
      ...c,
      stockLevel: c.stockLevel < 40 ? 65 : c.stockLevel,
      queueTime: Math.max(5, c.queueTime - 8)
    }));
    updateServerState({ concessions: nextConcessions });
    setCustomNotification({
      text: "Sustainability Command: Food stocks rebalanced across Concourse East/West zones.",
      type: "info",
    });
    setTimeout(() => setCustomNotification(null), 4000);
  };

  // Fan experience: Dispatch alert
  const handleTriggerMobilePopup = (alertMessage: string) => {
    setCustomNotification({
      text: `FAN MOBILE PUSH DISPATCHED: "${alertMessage}"`,
      type: "info",
    });
    setTimeout(() => setCustomNotification(null), 6000);
  };

  // Handle Playback historical states selection
  const handleSelectHistoricalState = (idx: number) => {
    setPlaybackIndex(idx);
  };

  // Determine what state is rendered in the HUD/Twin (current state vs historical state scrub)
  const isPlaybackMode = playbackIndex !== -1 && playbackIndex < history.length - 1;
  const activeDisplayState = isPlaybackMode && history[playbackIndex] ? history[playbackIndex] : stadiumState;

  if (!activeDisplayState) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-mono gap-4">
        <Cpu className="w-10 h-10 text-emerald-400 animate-spin" />
        <span className="text-xs text-slate-400 tracking-widest animate-pulse">BOOTING FIFA VENUE INTELLIGENCE OS (VIOS) CORE...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08090c] text-slate-100 font-sans p-6 overflow-x-hidden relative select-none tactical-grid-bg">
      {/* Background Gradients */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-orange-500/4 rounded-full blur-[150px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-red-500/4 rounded-full blur-[150px] pointer-events-none" />

      {/* Floating Global Custom Notifications (Slide-in) */}
      {customNotification && (
        <div className="fixed top-6 right-6 z-50 animate-bounce">
          <div
            className={`border rounded-xl px-5 py-4 flex items-start gap-3 shadow-2xl backdrop-blur-xl ${
              customNotification.type === "emergency"
                ? "bg-rose-950/90 border-rose-500 text-rose-100 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                : customNotification.type === "critical"
                ? "bg-red-950/90 border-red-500 text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                : customNotification.type === "warning"
                ? "bg-amber-950/90 border-amber-500 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                : "bg-[#12141c]/95 border-orange-500 text-slate-100 shadow-[0_0_20px_rgba(249,115,22,0.2)]"
            } max-w-md`}
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 animate-pulse" />
            <div>
              <div className="text-xs font-bold font-mono tracking-wide uppercase">
                {customNotification.type === "emergency" ? "CRITICAL EMERGENCY PROTOCOL" : "TACTICAL ALERT"}
              </div>
              <p className="text-xs mt-1 leading-relaxed font-sans">{customNotification.text}</p>
            </div>
          </div>
        </div>
      )}

      {/* 1. FUTURISTIC HUD COMMAND HEADER */}
      <header className="border border-orange-500/15 bg-[#12141c]/80 backdrop-blur-xl rounded-2xl p-4.5 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl text-slate-950 font-display font-black tracking-tight shadow-[0_0_20px_rgba(249,115,22,0.35)]">
            VIOS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-lg tracking-tight text-slate-100 uppercase">
                FIFA VENUE INTELLIGENCE OS
              </h1>
              <span className="text-[10px] bg-orange-500/10 border border-orange-500/20 text-orange-400 font-mono px-2 py-0.5 rounded animate-pulse">
                v2026.1
              </span>
            </div>
            <p className="text-xs font-mono text-slate-500 mt-0.5 tracking-wider uppercase">
              "THE AI BRAIN BEHIND EVERY MATCH" // ESTADIO AZTECA / METLIFE STADIUM CENTRAL Command
            </p>
          </div>
        </div>

        {/* Global HUD metrics / Status ticker */}
        <div className="flex flex-wrap items-center gap-6 md:gap-8 bg-slate-950/80 border border-orange-500/10 px-5 py-3 rounded-xl">
          <div className="flex flex-col">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Clock className="w-3 h-3 text-orange-400" /> SYSTEM TIMESTAMP
            </span>
            <span className="text-xs font-mono font-bold text-orange-100 mt-0.5">{utcTime}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">MATCH PHASE</span>
            <span className="text-xs font-mono font-bold text-orange-400 mt-0.5 uppercase tracking-wide flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
              {activeDisplayState.matchTimeLabel}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">ACTIVE STRESSOR</span>
            <span className={`text-xs font-mono font-bold mt-0.5 uppercase ${
              activeDisplayState.scenario !== "normal" ? "text-rose-400 animate-pulse" : "text-slate-400"
            }`}>
              {activeDisplayState.scenario.replace("_", " ")}
            </span>
          </div>

          <button
            onClick={handleTickTime}
            className="px-3 py-1.5 bg-[#12141c] border border-orange-500/20 hover:border-orange-500/40 text-orange-400 hover:text-orange-200 rounded font-mono text-[10px] transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            title="Advance timeline simulator by +5 minutes"
          >
            <TrendingUp className="w-3.5 h-3.5 text-orange-400" /> +5m TICK
          </button>

          {/* CRITICAL ONE-CLICK EVACUATION RED BUTTON */}
          <button
            onClick={handleTriggerEmergencyEvacuation}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 active:scale-95 text-white font-sans font-bold text-xs rounded-lg transition-all shadow-[0_0_20px_rgba(244,63,94,0.4)] flex items-center gap-2 uppercase tracking-wide cursor-pointer"
          >
            <Power className="w-4 h-4 text-rose-100" /> EMERGENCY EVAC
          </button>
        </div>
      </header>

      {/* 2. ROLE WORKSPACES COMMAND DOCK SELECTOR */}
      <nav className="mb-6 border border-orange-500/10 bg-[#12141c]/50 p-2 rounded-xl flex flex-wrap items-center justify-between gap-2 shadow-lg">
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[10px] font-mono text-slate-500 mr-2 uppercase tracking-widest pl-2">WORK WORKSPACES:</span>
          {(
            [
              { id: "operations", name: "Stadium Operations", icon: Tv, color: "text-orange-400" },
              { id: "security", name: "Security Command", icon: Shield, color: "text-rose-400" },
              { id: "volunteers", name: "Volunteer Coordination", icon: Users, color: "text-emerald-400" },
              { id: "transportation", name: "Transportation Command", icon: Bus, color: "text-amber-400" },
              { id: "sustainability", name: "Sustainability Manager", icon: Leaf, color: "text-emerald-400" },
              { id: "fan", name: "Fan Experience", icon: Smile, color: "text-purple-400" },
            ] as const
          ).map((role) => {
            const Icon = role.icon;
            const isSelected = activeRole === role.id;
            return (
              <button
                key={role.id}
                onClick={() => setActiveRole(role.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-medium font-sans transition-all duration-200 cursor-pointer active:scale-95 ${
                  isSelected
                    ? "bg-slate-950 border-orange-500/40 text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.1)]"
                    : "bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-950/40"
                }`}
              >
                <Icon className={`w-4 h-4 ${role.color}`} />
                <span>{role.name}</span>
              </button>
            );
          })}
        </div>

        {/* Inspection Display Banner */}
        <div className="bg-slate-950/80 px-4 py-2 rounded-lg border border-orange-500/20 text-[10px] font-mono text-slate-400 flex-1 md:flex-initial text-left max-w-md truncate">
          <span className="text-orange-400 font-bold uppercase">INSPECT:</span> {inspectionInfo}
        </div>
      </nav>

      {/* 3. DUAL COLUMN PRIMARY DASHBOARD ENGINE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-6">
        {/* Left Column: ACTIVE ROLE OPERATOR PANEL (6 / 12 wide) */}
        <section className="lg:col-span-6 flex flex-col">
          <div className="tactical-card p-6 flex-1 flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            {/* Operator Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div>
                <h2 className="font-sans font-bold text-slate-100 tracking-tight text-md uppercase">
                  {activeRole === "operations" && "STADIUM OPERATIONS COMMAND"}
                  {activeRole === "security" && "SECURITY COMMAND SYSTEM"}
                  {activeRole === "volunteers" && "VOLUNTEER ENGAGEMENT ENGINE"}
                  {activeRole === "transportation" && "TRANSPORTATION LOGISTICS HUB"}
                  {activeRole === "sustainability" && "SUSTAINABILITY FOOTPRINT ANALYZER"}
                  {activeRole === "fan" && "FAN EXPERIENCE CUSTOMIZATION"}
                </h2>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  Manual overrides, sector dispatches, and active operations checklists.
                </p>
              </div>
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            </div>

            {/* Render Role-Specific Controls */}
            <div className="flex-1 my-2">
              {/* STADIUM OPERATIONS VIEW */}
              {activeRole === "operations" && (
                <div className="space-y-4 font-sans">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">SPECTATOR VELOCITY IN</span>
                      <span className="text-xl font-bold text-emerald-400 font-mono mt-1 block">1,450 / min</span>
                      <span className="text-[9px] font-mono text-slate-500 block mt-1">PEAK EXPECTED IN 12 MINS</span>
                    </div>
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">AVERAGE SCAN FAILURE</span>
                      <span className="text-xl font-bold text-slate-300 font-mono mt-1 block">1.4%</span>
                      <span className="text-[9px] font-mono text-slate-500 block mt-1">WITHIN TARGET LEVEL (&lt;3%)</span>
                    </div>
                  </div>

                  {/* Automated Congestion Threshold Selector */}
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-orange-500/10 space-y-3 shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
                        AUTO CONGESTION ALERT THRESHOLD
                      </span>
                      <span className="text-xs font-mono font-bold text-orange-400">
                        {congestionThreshold} mins
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="45"
                      step="1"
                      value={congestionThreshold}
                      onChange={(e) => setCongestionThreshold(parseInt(e.target.value))}
                      className="w-full accent-orange-500 bg-slate-800 rounded-lg h-1 appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-slate-500">
                      <span>STRICT (5m)</span>
                      <span>MODERATE (25m)</span>
                      <span>LENIENT (45m)</span>
                    </div>
                  </div>

                  <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-1.5 mt-2">GATE TURNS-YIELD MODIFIER</h3>
                  <div className="space-y-2.5">
                    {activeDisplayState.gates.map((g) => (
                      <div key={g.id} className="flex items-center justify-between bg-slate-950/60 p-3.5 rounded-xl border border-slate-850">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-100">{g.name}</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase ${
                              g.status === "congested" ? "text-orange-400 bg-orange-500/10" : g.status === "closed" ? "text-rose-400 bg-rose-500/10" : "text-emerald-400 bg-emerald-500/10"
                            }`}>
                              {g.status}
                            </span>
                          </div>
                          <p className="text-[10px] font-mono text-slate-400 mt-1">
                            Scan Wait: <span className="text-slate-100 font-bold">{g.queueTime} mins</span> // Staff: <span className="text-slate-100 font-bold">{g.volunteerCount} active</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 ml-4">
                          <button
                            onClick={() => handleGateAction(g.id, "open")}
                            className="px-2 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] rounded hover:bg-emerald-500/20 transition-all font-mono uppercase"
                          >
                            Open
                          </button>
                          <button
                            onClick={() => handleGateAction(g.id, "congested")}
                            className="px-2 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] rounded hover:bg-orange-500/20 transition-all font-mono uppercase"
                          >
                            Surge
                          </button>
                          <button
                            onClick={() => handleGateAction(g.id, "close")}
                            className="px-2 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] rounded hover:bg-rose-500/20 transition-all font-mono uppercase"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECURITY COMMAND VIEW */}
              {activeRole === "security" && (
                <div className="space-y-4 font-sans">
                  <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 flex items-start gap-3">
                    <Shield className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0 animate-pulse" />
                    <div>
                      <h4 className="font-bold text-slate-100 text-xs uppercase tracking-wide">ACTIVE EMERGENCY BROADCAST INTEGRITY</h4>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        Evacuation signs are synchronized. Audio perimeter sirens and fire sprinklers are mapped to the automated safety relay.
                      </p>
                    </div>
                  </div>

                  <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-1.5">ACTIVE FIELD INCIDENTS</h3>
                  <div className="space-y-3">
                    {activeDisplayState.incidents.length === 0 ? (
                      <div className="text-center py-10 bg-slate-950/40 rounded-xl border border-slate-850 border-dashed text-slate-500 text-xs">
                        No active security incidents detected. Perimeter sensors holding green baseline.
                      </div>
                    ) : (
                      activeDisplayState.incidents.map((inc) => (
                        <div key={inc.id} className="bg-slate-950/60 p-4 rounded-xl border border-rose-500/20 flex flex-col gap-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold bg-rose-500 text-slate-950`}>
                                  {inc.priority}
                                </span>
                                <h4 className="font-bold text-xs text-slate-200">{inc.title}</h4>
                              </div>
                              <p className="text-[10px] font-mono text-rose-400 mt-1">
                                LOCATION: {inc.section} // TRIGGERED: {inc.timestamp}
                              </p>
                            </div>
                            <span className="text-xs font-mono text-slate-500">ASSIGNED STAFF: {inc.assignedStaff}</span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/30 p-2.5 rounded border border-slate-900">
                            {inc.description}
                          </p>
                          <div className="flex items-center gap-2 ml-auto">
                            <button
                              onClick={() => {
                                const nextIncs = activeDisplayState.incidents.map(i =>
                                  i.id === inc.id ? { ...i, assignedStaff: i.assignedStaff + 4 } : i
                                );
                                updateServerState({ incidents: nextIncs });
                              }}
                              className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded text-[10px] font-mono uppercase"
                            >
                              +4 SQUAD
                            </button>
                            <button
                              onClick={() => handleResolveIncident(inc.id)}
                              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded text-[10px] font-mono uppercase"
                            >
                              RESOLVE
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* VOLUNTEER COORDINATION VIEW */}
              {activeRole === "volunteers" && (
                <div className="space-y-4 font-sans">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850 text-center">
                      <span className="text-[9px] font-mono text-slate-500 uppercase block">VOLUNTEERS TOTAL</span>
                      <span className="text-lg font-bold text-slate-100 font-mono mt-1 block">{activeDisplayState.volunteersTotal}</span>
                    </div>
                    <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850 text-center">
                      <span className="text-[9px] font-mono text-slate-500 uppercase block">ON SECTOR SHIFT</span>
                      <span className="text-lg font-bold text-emerald-400 font-mono mt-1 block">{activeDisplayState.volunteersActive}</span>
                    </div>
                    <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850 text-center">
                      <span className="text-[9px] font-mono text-slate-500 uppercase block">STANDBY POOL</span>
                      <span className="text-lg font-bold text-slate-400 font-mono mt-1 block">
                        {activeDisplayState.volunteersTotal - activeDisplayState.volunteersActive}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-1.5 mt-2">ACTIVE ESCORT & LANGUAGE INCOMING CALLS</h3>
                  <div className="space-y-2.5">
                    {activeDisplayState.accessibilityRequests.map((req) => (
                      <div key={req.id} className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-200">
                              [ACCESS-{req.type.toUpperCase()}]
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase ${
                              req.status === "completed" ? "text-slate-400 bg-slate-500/10" : req.status === "dispatched" ? "text-sky-400 bg-sky-500/10" : "text-amber-400 bg-amber-500/10 animate-pulse"
                            }`}>
                              {req.status}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 uppercase">LOC: {req.location}</span>
                        </div>
                        <p className="text-xs text-slate-400">{req.description}</p>
                        {req.assignedVolunteerId && (
                          <div className="text-[10px] font-mono text-slate-500">
                            ASSIGNED ESCORT: <span className="text-sky-400">VOLUNTEER #{req.assignedVolunteerId}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 ml-auto mt-1">
                          {req.status === "pending" && (
                            <button
                              onClick={() => handleAssignVolunteer(req.id, "ESC_" + Math.floor(Math.random() * 80 + 10))}
                              className="px-2.5 py-1 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] rounded hover:bg-sky-500/20 transition-all font-mono uppercase"
                            >
                              DISPATCH STAFF
                            </button>
                          )}
                          {req.status !== "completed" && (
                            <button
                              onClick={() => handleCompleteAccessibilityRequest(req.id)}
                              className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] rounded hover:bg-emerald-500/20 transition-all font-mono uppercase"
                            >
                              COMPLETE
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TRANSPORTATION VIEW */}
              {activeRole === "transportation" && (
                <div className="space-y-4 font-sans">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">METRO TRANSIT WAIT</span>
                      <span className="text-xl font-bold text-slate-100 font-mono mt-1 block">
                        {activeDisplayState.transport.metroWaitTime} mins
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 block mt-1">
                        CONGESTION: <span className="text-slate-300 font-bold">{activeDisplayState.transport.metroCongestion}%</span>
                      </span>
                    </div>
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">BUS wait TIME</span>
                      <span className="text-xl font-bold text-slate-100 font-mono mt-1 block">
                        {activeDisplayState.transport.busWaitTime} mins
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 block mt-1">
                        ACTIVE ESCORT COY: <span className="text-slate-300 font-bold">{activeDisplayState.transport.activeBuses} buses</span>
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-1.5 mt-2">TRANSIT PIE ADJUSTMENTS</h3>
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-mono text-slate-400">
                        <span>METRO TRAIN SPACING TIME</span>
                        <span className="text-slate-100 font-bold">{activeDisplayState.transport.metroWaitTime} min intervals</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="12"
                        value={activeDisplayState.transport.metroWaitTime}
                        onChange={(e) => handleTransitDials(activeDisplayState.transport.activeBuses, parseInt(e.target.value))}
                        className="w-full accent-emerald-500 bg-slate-800 rounded-lg h-1.5 appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-mono text-slate-400">
                        <span>ACTIVE EMERGENCY BUS SHUTTLES</span>
                        <span className="text-slate-100 font-bold">{activeDisplayState.transport.activeBuses} shuttles deployed</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="40"
                        value={activeDisplayState.transport.activeBuses}
                        onChange={(e) => handleTransitDials(parseInt(e.target.value), activeDisplayState.transport.metroWaitTime)}
                        className="w-full accent-emerald-500 bg-slate-800 rounded-lg h-1.5 appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-1.5 mt-2">DIGITAL TRANSIT SIGNBOARDS PREVIEW</h3>
                  <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/20 text-emerald-400 font-mono text-xs space-y-2 uppercase leading-relaxed shadow-inner">
                    <div>[DIGITAL_LED_NORTH_PLAZA] // FEED: BROADCAST_ON</div>
                    <div className="text-slate-100 font-bold animate-pulse">&gt;&gt; NOTICE: USE METRO NORTH PERIMETER AS GATE A IS RUNNING FREE-FLOW (WAIT TIME: 5M). REDIRECT METRO SOUTH TRAFFIC.</div>
                  </div>
                </div>
              )}

              {/* SUSTAINABILITY MANAGER VIEW */}
              {activeRole === "sustainability" && (
                <div className="space-y-4 font-sans">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">GRID POWER DRAW</span>
                      <span className="text-xl font-bold text-slate-100 font-mono mt-1 block">
                        {activeDisplayState.sustainability.electricityKw} kW
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 block mt-1">
                        SOLAR INPUT: <span className="text-emerald-400 font-bold">+{activeDisplayState.sustainability.solarGenerationKw}kW</span>
                      </span>
                    </div>
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">WATER DRAW RATE</span>
                      <span className="text-xl font-bold text-slate-100 font-mono mt-1 block">
                        {activeDisplayState.sustainability.waterLiters.toLocaleString()} L/h
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 block mt-1">
                        STABLE RECYCLED WATER USED
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-1.5 mt-2">RESOURCE SHIELD CONTROLS</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={handleActivateLoadShedding}
                      className="p-4 bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/60 rounded-xl text-left transition-all"
                    >
                      <Zap className="w-5 h-5 text-amber-400 mb-2" />
                      <h4 className="font-bold text-xs text-slate-200">HVAC LOAD SHEDDING</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                        Optimize temperature in unoccupied luxury lounges to conserve power.
                      </p>
                    </button>

                    <button
                      onClick={handleLevelConcessionStocks}
                      className="p-4 bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/60 rounded-xl text-left transition-all"
                    >
                      <Sliders className="w-5 h-5 text-emerald-400 mb-2" />
                      <h4 className="font-bold text-xs text-slate-200">STOCK BALANCING</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                        Rebalance food vendor inventories to mitigate waste from overstocking.
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* FAN EXPERIENCE VIEW */}
              {activeRole === "fan" && (
                <div className="space-y-4 font-sans">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">FAN SATISFACTION SCORE</span>
                      <span className="text-xl font-bold text-emerald-400 font-mono mt-1 block">4.8 / 5.0</span>
                      <span className="text-[9px] font-mono text-slate-500 block mt-1">FIFA WORLD CUP AVERAGE: 4.5</span>
                    </div>
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">CONCESSION OVER-QUEUE</span>
                      <span className="text-xl font-bold text-orange-400 font-mono mt-1 block">3 zones</span>
                      <span className="text-[9px] font-mono text-slate-500 block mt-1">QUEUE TIME REDIRECTS RECOMMENDED</span>
                    </div>
                  </div>

                  <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-1.5 mt-2">DISPATCH REAL-TIME MOBILE MOBILE PRESETS</h3>
                  <div className="space-y-2.5">
                    {[
                      { title: "SOUVENIR QUEUE BYPASS ALERT", msg: "Avoid MetLife Fan shop queues. Official FIFA kiosk inside Section 112 holds clear checkout. Mobile order now!" },
                      { title: "SOUTH TRANSIT CONGESTION OVERRIDE", msg: "Pedestrian build-up high at Gate C. Change route to Gate B which holds short lines (10m wait). Enjoy kickoff!" },
                      { title: "HALF-TIME BEVERAGE FLASH ORDER", msg: "Order drinks via your seat code now. Express collection bar Section 105 is clear." },
                    ].map((push, idx) => (
                      <div key={idx} className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-sky-400 uppercase">{push.title}</span>
                          <span className="text-[9px] font-mono text-slate-500">DISPATCH READY</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{push.msg}</p>
                        <button
                          onClick={() => handleTriggerMobilePopup(push.msg)}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded text-[10px] font-mono uppercase ml-auto flex items-center gap-1 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" /> SEND POPUP
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right Column: DIGITAL TWIN VIEWPORT & HISTORIC TIMELINE (5 / 12 wide) */}
        <section className="lg:col-span-6 flex flex-col justify-between gap-6">
          <div className="flex-1">
            <DigitalTwin
              state={activeDisplayState}
              onSelectSection={(info) => setInspectionInfo(info)}
              onGateAction={handleGateAction}
              onResolveIncident={handleResolveIncident}
              onLevelConcessionStocks={handleLevelConcessionStocks}
              onAssignVolunteer={handleAssignVolunteer}
              onCompleteAccessibilityRequest={handleCompleteAccessibilityRequest}
              onUpdateServerState={updateServerState}
              onSelectScenario={handleSelectScenario}
            />
          </div>
          <div>
            <TimelinePlayback
              history={history}
              currentIndex={isPlaybackMode ? playbackIndex : history.length - 1}
              onSelectHistoricalState={handleSelectHistoricalState}
            />
          </div>
        </section>
      </div>

      {/* 4. EXECUTIVE BRIEFING & CHAT ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-6">
        <div className="lg:col-span-6 flex flex-col">
          <ExecutiveBriefing state={activeDisplayState} />
        </div>
        <div className="lg:col-span-6 flex flex-col">
          <AIChat state={activeDisplayState} />
        </div>
      </div>

      {/* 5. COGNITIVE AGENTS & SCENARIO PLANNERS */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <PredictionsPanel state={activeDisplayState} />
        <ScenarioSimulator 
          currentScenario={activeDisplayState.scenario} 
          onSelectScenario={handleSelectScenario}
          state={activeDisplayState}
          onUpdateServerState={updateServerState}
        />
      </div>

      {/* High-Tech Footer HUD */}
      <footer className="border-t border-slate-900 pt-6 mt-8 pb-4 text-center text-[10px] font-mono text-slate-500 tracking-wider flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          FIFA COGNITIVE INTELLIGENCE & DIGITAL TWIN OS v10.4 // DESIGNED IN YEAR 2035
        </div>
        <div className="flex items-center gap-3">
          <span>HOST_INGRESS: PORT_3000</span>
          <span>|</span>
          <span>UTILITY_MODE: DECRYPTION_ON</span>
          <span>|</span>
          <span className="text-emerald-400">STATUS: OPTIMAL</span>
        </div>
      </footer>
    </div>
  );
}
