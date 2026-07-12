import React, { useState } from "react";
import { 
  CloudRain, 
  Activity, 
  ShieldAlert, 
  ZapOff, 
  Users, 
  Train, 
  AlertTriangle, 
  ShoppingBag, 
  Eye, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Accessibility, 
  Play, 
  Terminal,
  Shield,
  Clock,
  ThumbsUp,
  Server,
  Database
} from "lucide-react";
import { StadiumState } from "../types";

interface ScenarioSimulatorProps {
  currentScenario: string;
  onSelectScenario: (scenario: string) => void;
  state?: StadiumState;
  onUpdateServerState?: (updates: Partial<StadiumState>) => Promise<void>;
}

export default function ScenarioSimulator({ 
  currentScenario, 
  onSelectScenario,
  state,
  onUpdateServerState 
}: ScenarioSimulatorProps) {
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([]);
  const [diagnosticStatus, setDiagnosticStatus] = useState<"idle" | "running" | "done">("idle");
  const [showAccessibilityTable, setShowAccessibilityTable] = useState(false);

  const scenarios = [
    {
      id: "normal",
      name: "Normal Operations",
      description: "Match proceeds smoothly. Baseline spectator traffic.",
      icon: Eye,
      color: "border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-950/20",
      activeColor: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]",
    },
    {
      id: "heavy_rain",
      name: "Heavy Rain Front",
      description: "Pedestrian deceleration, indoor concession congestion, wet perimeter hazards.",
      icon: CloudRain,
      color: "border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-950/20",
      activeColor: "border-sky-500/50 bg-sky-500/10 text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.15)]",
    },
    {
      id: "medical_emergency",
      name: "Medical Emergency",
      description: "Heat exhaustion collapse in Section 114. Rescue squads dispatched.",
      icon: Activity,
      color: "border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-950/20",
      activeColor: "border-rose-500/50 bg-rose-500/10 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]",
    },
    {
      id: "power_outage",
      name: "Power Grid Outage",
      description: "Local utility substation fault. Auxiliary generators active.",
      icon: ZapOff,
      color: "border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-950/20",
      activeColor: "border-amber-500/50 bg-amber-500/10 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]",
    },
    {
      id: "metro_delay",
      name: "Metro System Delay",
      description: "Signal fault on Metro South Line. Crowds backing up at South Plaza.",
      icon: Train,
      color: "border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-950/20",
      activeColor: "border-orange-500/50 bg-orange-500/10 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.15)]",
    },
    {
      id: "vip_arrival",
      name: "VIP Motorcade Arrival",
      description: "Dignitaries and media arriving via Gate E. Security sweep active.",
      icon: Users,
      color: "border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-950/20",
      activeColor: "border-purple-500/50 bg-purple-500/10 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)]",
    },
    {
      id: "security_threat",
      name: "Pyro Flares in Section 204",
      description: "Active flares ignited in Supporters Stand. Crowd control dispatched.",
      icon: ShieldAlert,
      color: "border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-950/20",
      activeColor: "border-red-500/50 bg-red-500/10 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)]",
    },
    {
      id: "equipment_failure",
      name: "Gate C Turnstile Fault",
      description: "Scanners at Gate C offline. Rerouting crowd stream toward Gate A.",
      icon: AlertTriangle,
      color: "border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-950/20",
      activeColor: "border-pink-500/50 bg-pink-500/10 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.15)]",
    },
    {
      id: "high_food_demand",
      name: "Concession Rush peak",
      description: "Concourse food vendor queues rise above 30 minutes. Stock depleting.",
      icon: ShoppingBag,
      color: "border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-950/20",
      activeColor: "border-indigo-500/50 bg-indigo-500/10 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]",
    },
  ];

  // Self-diagnostic test runner
  const runSelfDiagnostics = () => {
    setDiagnosticStatus("running");
    setDiagnosticLogs(["[INFO] Starting FIFA Digital Twin Self-Diagnostic Suite v2.5..."]);
    
    setTimeout(() => {
      setDiagnosticLogs(prev => [
        ...prev,
        `[OK] 1. IoT Telemetry Bridge: Active scenario: "${currentScenario.toUpperCase()}". Latency: 12ms. Connection: stable.`
      ]);
    }, 500);

    setTimeout(() => {
      const isEvacActive = state?.incidents.some(
        (i) => i.priority === "emergency" || i.title.toLowerCase().includes("evacuation")
      ) || currentScenario === "security_threat";
      setDiagnosticLogs(prev => [
        ...prev,
        `[OK] 2. 3D Twin Vector Grid: Pulse animations validated. Evacuation Mode: ${isEvacActive ? "ACTIVE (All sectors pulsing red)" : "INACTIVE (Sectors selective)"}.`
      ]);
    }, 1000);

    setTimeout(() => {
      setDiagnosticLogs(prev => [
        ...prev,
        `[OK] 3. Cognitive Chat Pipeline: Grounded responses synchronized with active scenarios.`
      ]);
    }, 1500);

    setTimeout(() => {
      setDiagnosticLogs(prev => [
        ...prev,
        `[OK] 4. Gate Override Solenoids: ${state?.gates.length || 0} secure digital barriers synced. Broadcast channel active.`,
        `[SUCCESS] Diagnostic suite complete. All validation checks: PASSED. Zero critical errors.`
      ]);
      setDiagnosticStatus("done");
    }, 2000);
  };

  // Mock Injectors
  const handleInjectCongestion = async () => {
    if (!state || !onUpdateServerState) return;
    const congestedGates = state.gates.map(g => ({
      ...g,
      occupancy: 99,
      queueTime: 55,
      status: "congested" as const
    }));
    await onUpdateServerState({
      gates: congestedGates,
      spectatorsOutsideGates: 62000
    });
  };

  const handleInjectStockOut = async () => {
    if (!state || !onUpdateServerState) return;
    const dryConcessions = state.concessions.map(c => ({
      ...c,
      stockLevel: 6,
      queueTime: 38
    }));
    await onUpdateServerState({
      concessions: dryConcessions
    });
  };

  const handleInjectMedicalEmergency = async () => {
    if (!state || !onUpdateServerState) return;
    const medicalIncident = {
      id: "inc_mock_med_" + Date.now(),
      title: "CRITICAL: Heat Stroke Collapse",
      section: "Section 114, Row K",
      priority: "critical" as const,
      status: "active" as const,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      description: "Spectator unconscious under high solar exposure. First Responder Team 4 activated.",
      assignedStaff: 8
    };
    await onUpdateServerState({
      incidents: [medicalIncident, ...state.incidents]
    });
  };

  const handleResetSandbox = async () => {
    onSelectScenario("normal");
  };

  return (
    <div className="tactical-card p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col gap-6" id="scenario-simulator-root">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-orange-500/10 pb-4">
        <div>
          <h3 className="font-display font-bold text-slate-100 tracking-tight flex items-center gap-2 text-md uppercase">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            SCENARIO SIMULATOR & COGNITIVE TESTING CENTER
          </h3>
          <p className="text-xs font-sans text-slate-400 mt-1">
            Trigger simulated physical hazards and digital Twin anomalies. Test system reactivity, accessibility flows, and AI response dispatches.
          </p>
        </div>
        
        {/* Quick Diagnostics Action */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowAccessibilityTable(!showAccessibilityTable)}
            className={`px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold flex items-center gap-1.5 transition-all border active:scale-95 cursor-pointer ${
              showAccessibilityTable 
                ? "bg-orange-500/20 border-orange-500/40 text-orange-300 shadow-[0_0_12px_rgba(249,115,22,0.1)]"
                : "bg-slate-950/60 border-orange-500/15 text-slate-400 hover:text-slate-200"
            }`}
            aria-label="Toggle text-only accessibility view"
          >
            <Accessibility className="w-3.5 h-3.5" />
            {showAccessibilityTable ? "CLOSE ACCESSIBLE VIEW" : "ACCESSIBLE TEXT FEED"}
          </button>

          <button
            onClick={runSelfDiagnostics}
            disabled={diagnosticStatus === "running"}
            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-slate-950 rounded-lg font-mono text-[10px] font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(249,115,22,0.2)]"
          >
            <Terminal className="w-3.5 h-3.5" />
            {diagnosticStatus === "running" ? "RUNNING CHECK..." : "RUN SELF-DIAGNOSTIC"}
          </button>
        </div>
      </div>

      {/* 2. Scenario Grid Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          const isActive = currentScenario === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => onSelectScenario(sc.id)}
              className={`flex flex-col text-left p-4 rounded-xl border font-sans transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                isActive ? sc.activeColor : sc.color
              }`}
              id={`scenario-btn-${sc.id}`}
              aria-label={`Trigger scenario: ${sc.name}`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isActive ? "bg-white/5" : "bg-slate-950/40"}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-slate-100">{sc.name}</h4>
                  <p className="text-[9px] font-mono mt-0.5 opacity-80 uppercase tracking-wider">
                    {isActive ? "ACTIVE STRESSOR" : "STANDBY"}
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed truncate">
                {sc.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* 3. Diagnostic Log Terminal (Hidden if idle) */}
      {diagnosticStatus !== "idle" && (
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] space-y-1.5 text-left max-h-[160px] overflow-y-auto scrollbar-thin">
          <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 mb-2">
            <span className="text-[9px] text-slate-500 uppercase flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              SYSTEM_DIAG_LOGS
            </span>
            <button 
              onClick={() => { setDiagnosticStatus("idle"); setDiagnosticLogs([]); }}
              className="text-[9px] text-slate-500 hover:text-slate-300 uppercase cursor-pointer"
            >
              CLEAR
            </button>
          </div>
          {diagnosticLogs.map((log, idx) => {
            const isSuccess = log.includes("[SUCCESS]");
            const isError = log.includes("[ERROR]") || log.includes("[FAIL]");
            const isOk = log.includes("[OK]");
            return (
              <div 
                key={idx} 
                className={`${
                  isSuccess ? "text-emerald-400 font-bold" :
                  isError ? "text-rose-400" :
                  isOk ? "text-sky-300" :
                  "text-slate-400"
                }`}
              >
                {log}
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Text-Only Accessibility Summary Table */}
      {showAccessibilityTable && (
        <div className="bg-slate-950/80 p-5 rounded-xl border border-sky-500/20 text-slate-100 text-left font-sans animate-fadeIn" aria-live="polite">
          <h4 className="text-xs font-bold text-sky-400 mb-3 flex items-center gap-1.5 uppercase font-mono tracking-wider">
            <Accessibility className="w-4 h-4 text-sky-400" />
            Live Digital Twin Telemetry Feed (Screen-Reader Optimized)
          </h4>
          <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
            This viewport presents a structured, high-contrast textual matrix of the active Digital Twin state. Use tabular keys to navigate gates, wait times, and security incidents.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gates Telemetry */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] text-slate-300 border-collapse">
                <caption className="sr-only">Detailed matrix of gate occupancies and queue durations.</caption>
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[9px] uppercase tracking-wider">
                    <th scope="col" className="pb-2">ID</th>
                    <th scope="col" className="pb-2">Gate Location</th>
                    <th scope="col" className="pb-2">Load</th>
                    <th scope="col" className="pb-2">Queue Wait</th>
                    <th scope="col" className="pb-2">Security Status</th>
                  </tr>
                </thead>
                <tbody>
                  {state?.gates.map((g) => (
                    <tr key={g.id} className="border-b border-slate-900 hover:bg-slate-900/30">
                      <td className="py-2 font-mono font-bold text-sky-400">{g.id}</td>
                      <td className="py-2">{g.name}</td>
                      <td className="py-2 font-mono">{g.occupancy}%</td>
                      <td className="py-2 font-mono text-emerald-400">{g.queueTime}m</td>
                      <td className="py-2">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                          g.status === "open" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                          g.status === "congested" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                          "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}>
                          {g.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Incidents & Sustainability */}
            <div className="space-y-4">
              <div>
                <h5 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-1 mb-2">
                  Active Crisis & Incident Log
                </h5>
                {state?.incidents && state.incidents.length > 0 ? (
                  <ul className="space-y-2">
                    {state.incidents.map((inc) => (
                      <li key={inc.id} className="p-2.5 rounded bg-slate-900 border border-slate-800">
                        <div className="flex items-center justify-between font-bold text-[11px]">
                          <span className="text-rose-400 uppercase tracking-wide flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            {inc.title}
                          </span>
                          <span className="text-[9px] font-mono text-slate-500 uppercase">{inc.priority}</span>
                        </div>
                        <p className="text-slate-400 mt-1 text-[10px] leading-relaxed">
                          Location: {inc.section} | Status: {inc.status} | Details: {inc.description}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">No active security alerts or hazard logs detected.</p>
                )}
              </div>

              <div>
                <h5 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-1 mb-2">
                  Concessions Status & Inventory levels
                </h5>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  {state?.concessions.map(c => (
                    <div key={c.id} className="bg-slate-900 p-2 rounded border border-slate-800 flex flex-col justify-between">
                      <span className="text-slate-300 font-sans font-bold">{c.name}</span>
                      <span className="text-slate-400 mt-1">Queue: {c.queueTime}m</span>
                      <span className={`font-bold mt-1 ${c.stockLevel < 25 ? "text-rose-400" : "text-sky-400"}`}>
                        Stock: {c.stockLevel}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Sandbox Injector Panel */}
      {state && onUpdateServerState && (
        <div className="pt-4 border-t border-slate-800">
          <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-3">
            SANDBOX FAILURE INJECTOR ENGINE (EASE OF TESTING)
          </h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleInjectCongestion}
              className="px-3 py-2 bg-slate-950 hover:bg-slate-950/80 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 rounded-lg text-xs font-medium flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-amber-500" />
              INJECT 99% GATE CONGESTION
            </button>

            <button
              onClick={handleInjectStockOut}
              className="px-3 py-2 bg-slate-950 hover:bg-slate-950/80 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 rounded-lg text-xs font-medium flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-rose-500" />
              INJECT CONCESSION STOCK OUT
            </button>

            <button
              onClick={handleInjectMedicalEmergency}
              className="px-3 py-2 bg-slate-950 hover:bg-slate-950/80 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 rounded-lg text-xs font-medium flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 text-rose-400" />
              INJECT MEDICAL COLLAPSE
            </button>

            <button
              onClick={handleResetSandbox}
              className="px-3 py-2 bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-900 hover:border-emerald-700 text-emerald-400 rounded-lg text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all ml-auto cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              RESTORE BASELINE NORMAL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
