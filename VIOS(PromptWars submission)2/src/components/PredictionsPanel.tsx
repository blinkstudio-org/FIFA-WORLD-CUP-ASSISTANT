import React, { useState, useEffect } from "react";
import { StadiumState, AIPrediction } from "../types";
import { Users, Shield, Bus, Leaf, Accessibility, Smile, ArrowRight, RefreshCw, Cpu } from "lucide-react";

interface PredictionsPanelProps {
  state: StadiumState;
}

export default function PredictionsPanel({ state }: PredictionsPanelProps) {
  const [activeAgent, setActiveAgent] = useState<string>("crowd");
  const [prediction, setPrediction] = useState<AIPrediction | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const agents = [
    { id: "crowd", name: "Crowd Intelligence Agent", icon: Users, desc: "Predicts pedestrian bottlenecks, gate lines, and models stadium ingress/egress velocities." },
    { id: "safety", name: "Safety & Security Agent", icon: Shield, desc: "Monitors incident escalations, flare sensors, medical distress patterns, and evacuation spacing." },
    { id: "transport", name: "Transportation Agent", icon: Bus, desc: "Coordinates metro frequencies, bus shuttle dispatches, ride-share wait pools, and arterial road delays." },
    { id: "sustainability", name: "Sustainability Agent", icon: Leaf, desc: "Optimizes micro-grid electrical demands, concession food transfers, and schedules waste collection." },
    { id: "accessibility", name: "Accessibility & Support Agent", icon: Accessibility, desc: "Coordinates wheelchair queues, elderly mobility support, multilingual translators, and sensory assistance." },
    { id: "fan", name: "Fan Experience Agent", icon: Smile, desc: "Monitors souvenir stock depletes, concession food times, and designs personalized exit routing alerts." },
  ];

  const fetchAgentPrediction = async (agentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/simulation/prediction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentType: agentId }),
      });
      if (!response.ok) throw new Error("Failed to consult Gemini Core");
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Prediction returned non-JSON response");
      }
      const data = await response.json();
      setPrediction(data);
    } catch (err: any) {
      console.error(err);
      setError("AI core is temporarily busy. Initializing offline backup protocols...");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentPrediction(activeAgent);
  }, [activeAgent, state.scenario]); // Re-fetch on agent switch or scenario shift!

  const ActiveIcon = agents.find(a => a.id === activeAgent)?.icon || Cpu;

  return (
    <div className="tactical-card p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col gap-6">
      <div className="flex items-center justify-between pb-2 border-b border-orange-500/10">
        <div>
          <h3 className="font-display font-bold text-slate-100 tracking-tight text-sm flex items-center gap-2 uppercase">
            <Cpu className="w-4 h-4 text-orange-400 animate-pulse" />
            FIFA COGNITIVE AGENT DIRECTORY
          </h3>
          <p className="text-xs font-sans text-slate-400 mt-1">
            Activate dedicated neural agents to analyze telemetry segments and execute autonomous calculations.
          </p>
        </div>
        <button
          onClick={() => fetchAgentPrediction(activeAgent)}
          className="p-2.5 bg-slate-950 hover:bg-slate-900 active:scale-95 text-slate-400 hover:text-slate-200 border border-orange-500/20 rounded-lg transition-all min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer"
          title="Recalculate models"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Agents Selection Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5">
        {agents.map((ag) => {
          const Icon = ag.icon;
          const isActive = activeAgent === ag.id;
          return (
            <button
              key={ag.id}
              onClick={() => setActiveAgent(ag.id)}
              className={`flex flex-col items-center justify-center text-center p-3.5 rounded-xl border font-sans transition-all duration-300 active:scale-95 cursor-pointer ${
                isActive
                  ? "border-orange-500/50 bg-orange-500/10 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.15)]"
                  : "border-orange-500/10 bg-slate-950/40 text-slate-400 hover:border-orange-500/30 hover:text-slate-200"
              }`}
            >
              <Icon className={`w-5 h-5 mb-2 ${isActive ? "animate-pulse" : ""}`} />
              <span className="text-[11px] font-medium leading-tight">{ag.name.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Agent Work Deck */}
      <div className="bg-slate-950/40 border border-orange-500/10 p-5 rounded-2xl flex-1 flex flex-col justify-between">
        {/* Agent Info Banner */}
        <div className="flex items-start gap-4 pb-4 border-b border-orange-500/10">
          <div className="p-3 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl">
            <ActiveIcon className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-display font-bold text-slate-100 text-sm">
              {agents.find(a => a.id === activeAgent)?.name}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {agents.find(a => a.id === activeAgent)?.desc}
            </p>
          </div>
        </div>

        {/* Cognitive Prediction Result */}
        <div className="flex-1 my-5 flex flex-col justify-center">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 font-mono text-xs text-slate-500">
              <RefreshCw className="w-8 h-8 text-orange-400 animate-spin" />
              <div className="flex flex-col items-center gap-1 text-[10px] mt-2">
                <span className="text-orange-400 tracking-widest animate-pulse">ESTABLISHING QUANTUM LINK TO GEMINI CORE...</span>
                <span>RETRIEVING SPECTATOR TELEMETRY COORDINATES...</span>
                <span>COMPILING TEMPORAL EGRESS FLOW VELOCITIES...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-rose-400 font-mono text-xs">{error}</p>
            </div>
          ) : prediction ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
              {/* Detailed Core Reasoning Block */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                <div>
                  <h5 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">OBSERVATION</h5>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed bg-slate-900/30 p-2.5 rounded border border-slate-900">{prediction.observation}</p>
                </div>
                <div>
                  <h5 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">REASONING ARCHITECTURE</h5>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed bg-slate-900/30 p-2.5 rounded border border-slate-900">{prediction.reasoning}</p>
                </div>
                <div>
                  <h5 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">PREDICTIVE PATH (15M-30M FORECAST)</h5>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed bg-slate-900/30 p-2.5 rounded border border-slate-900">{prediction.prediction}</p>
                </div>
                <div>
                  <h5 className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">AI GENERATED ACTION PLAN</h5>
                  <div className="text-xs text-emerald-300 mt-1 leading-relaxed bg-emerald-500/5 p-3 rounded border border-emerald-500/20 whitespace-pre-line">
                    {prediction.recommendedActions}
                  </div>
                </div>
              </div>

              {/* Confidence & Impact Sidebar */}
              <div className="lg:col-span-4 border-l border-slate-900 pl-6 flex flex-col justify-between gap-6">
                {/* Confidence radial or display block */}
                <div className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-900/40 border border-slate-800">
                  <div className="relative flex items-center justify-center w-24 h-24">
                    {/* Ring background */}
                    <svg className="absolute w-full h-full transform -rotate-90">
                      <circle cx="48" cy="48" r="40" stroke="#1e293b" strokeWidth="6" fill="transparent" />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="#10b981"
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 40}
                        strokeDashoffset={2 * Math.PI * 40 * (1 - prediction.confidenceScore / 100)}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="flex flex-col items-center">
                      <span className="font-mono text-2xl font-bold text-slate-100">{prediction.confidenceScore}%</span>
                      <span className="text-[8px] font-mono text-slate-500 uppercase">CONFIDENCE</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="inline-block px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      HIGH CONFIDENCE RATING
                    </span>
                  </div>
                </div>

                {/* Expected Impact card */}
                <div className="bg-sky-950/20 border border-sky-500/20 p-4 rounded-xl">
                  <h6 className="text-[10px] font-mono text-sky-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" /> EXPECTED IMPACT
                  </h6>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {prediction.expectedImpact}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-xs text-slate-500">
              Select an agent to calculate intelligence parameters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
