import React, { useState, useEffect, useRef } from "react";
import { StadiumState, GateState, SecurityIncident, ConcessionState } from "../types";
import {
  Shield,
  Users,
  Activity,
  HelpCircle,
  Flame,
  Zap,
  CloudRain,
  AlertTriangle,
  Compass,
  RotateCcw,
  Play,
  Pause,
  ChevronRight,
  Check,
  Sliders,
  Siren,
  Sparkles
} from "lucide-react";

interface DigitalTwinProps {
  state: StadiumState;
  onSelectSection: (sectionInfo: string) => void;
  onGateAction?: (gateId: string, action: "open" | "close" | "congested", volunteers?: number) => void;
  onResolveIncident?: (incidentId: string) => void;
  onLevelConcessionStocks?: () => void;
  onAssignVolunteer?: (requestId: string, volunteerId: string) => void;
  onCompleteAccessibilityRequest?: (requestId: string) => void;
  onUpdateServerState?: (updates: Partial<StadiumState>) => Promise<void>;
  onSelectScenario?: (scenario: string) => void;
}

interface SelectedEntity {
  type: "sector" | "gate" | "concession" | "field";
  id: string;
}

export default function DigitalTwin({
  state,
  onSelectSection,
  onGateAction,
  onResolveIncident,
  onLevelConcessionStocks,
  onAssignVolunteer,
  onCompleteAccessibilityRequest,
  onUpdateServerState,
  onSelectScenario
}: DigitalTwinProps) {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null);

  // 3D Canvas Perspective States
  const [rotateZ, setRotateZ] = useState<number>(-30);
  const [rotateX, setRotateX] = useState<number>(55);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);

  // Drag states
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isTouching, setIsTouching] = useState<boolean>(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Auto rotate tick hook
  useEffect(() => {
    if (!isAutoRotating) return;

    let frameId: number;
    const tick = () => {
      setRotateZ((prev) => (prev + 0.15) % 360);
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [isAutoRotating]);

  // Global Mouse Events listener for drag-to-rotate
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setRotateZ((prev) => (prev + deltaX * 0.5) % 360);
      setRotateX((prev) => Math.max(15, Math.min(85, prev - deltaY * 0.4)));
      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, dragStart]);

  // Global Touch Events listener for mobile rotation gestures
  useEffect(() => {
    if (!isTouching) return;

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - touchStart.x;
      const deltaY = e.touches[0].clientY - touchStart.y;
      setRotateZ((prev) => (prev + deltaX * 0.5) % 360);
      setRotateX((prev) => Math.max(15, Math.min(85, prev - deltaY * 0.4)));
      setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    };

    const handleGlobalTouchEnd = () => {
      setIsTouching(false);
    };

    window.addEventListener("touchmove", handleGlobalTouchMove);
    window.addEventListener("touchend", handleGlobalTouchEnd);
    return () => {
      window.removeEventListener("touchmove", handleGlobalTouchMove);
      window.removeEventListener("touchend", handleGlobalTouchEnd);
    };
  }, [isTouching, touchStart]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setIsAutoRotating(false); // Stop auto-rotate on interaction
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsTouching(true);
      setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setIsAutoRotating(false);
    }
  };

  const handleResetView = () => {
    setRotateZ(-30);
    setRotateX(55);
    setIsAutoRotating(false);
  };

  // Keyboard accessibility helper
  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action();
    }
  };

  // Density colors mapping
  const getDensityColor = (density: number) => {
    if (density < 40) return "#10b981"; // Emerald
    if (density < 70) return "#f59e0b"; // Amber
    if (density < 88) return "#f97316"; // Orange
    return "#f43f5e"; // Rose
  };

  // Stadium sectors baseline mappings
  const sectors = [
    {
      id: "north_supporters",
      name: "North Supporters Zone",
      density: state.scenario === "unexpected_surge" || state.scenario === "security_threat" ? 95 : 78,
      capacity: 18000,
      type: "seating"
    },
    {
      id: "east_concourse",
      name: "East Concourse (Tiers 1-3)",
      density: state.scenario === "high_food_demand" ? 92 : 62,
      capacity: 22000,
      type: "seating"
    },
    {
      id: "south_deck",
      name: "South Deck & Family Zone",
      density: state.scenario === "unexpected_surge" ? 96 : 84,
      capacity: 20000,
      type: "seating"
    },
    {
      id: "west_club",
      name: "West VIP Club Suites",
      density: state.scenario === "vip_arrival" ? 85 : 35,
      capacity: 15000,
      type: "seating"
    },
    {
      id: "field_pitch",
      name: "FIFA World Cup Pitch",
      density: 0,
      capacity: 22,
      type: "field"
    }
  ];

  const isEvacMode =
    state.scenario === "security_threat" ||
    state.incidents.some(
      (i) =>
        i.priority === "emergency" ||
        i.section.toLowerCase().includes("global") ||
        i.title.toLowerCase().includes("evacuation")
    );

  const getSectorAlertState = (sectorId: string) => {
    if (isEvacMode) return true;
    return state.incidents.some((i) => {
      const lowerSec = i.section.toLowerCase();
      if (sectorId === "north_supporters") return lowerSec.includes("north");
      if (sectorId === "east_concourse") return lowerSec.includes("east") || lowerSec.includes("114");
      if (sectorId === "south_deck") return lowerSec.includes("south") || lowerSec.includes("gate c");
      if (sectorId === "west_club") return lowerSec.includes("west") || lowerSec.includes("substation");
      return false;
    });
  };

  const handleSectorClick = (sector: typeof sectors[0]) => {
    setSelectedEntity({ type: "sector", id: sector.id });
    onSelectSection(
      `${sector.name} — Spectator Load: ${Math.round(sector.capacity * (sector.density / 100)).toLocaleString()} / ${sector.capacity.toLocaleString()} (${sector.density}% Density)`
    );
  };

  // Dynamic Inspector Side Card Renderer
  const renderLocationInspector = () => {
    if (!selectedEntity) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-6 h-full font-sans">
          <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 text-slate-500 mb-4 animate-pulse">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest">SYSTEM INTEGRATED OVERVIEW</h4>
          <p className="text-[11px] text-slate-500 mt-2 max-w-[220px] leading-relaxed">
            Select any interactive sector, perimeter gate, or vendor concession on the 3D Digital Twin to drill down into localized telemetry & active operations.
          </p>

          <div className="w-full mt-6 space-y-2.5">
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-850/80 flex items-center justify-between text-left">
              <span className="text-[10px] font-mono text-slate-400">STADIUM SECURITY</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 uppercase border border-emerald-500/20">
                SECURE
              </span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-850/80 flex items-center justify-between text-left">
              <span className="text-[10px] font-mono text-slate-400">ACTIVE INCIDENTS</span>
              <span
                className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                  state.incidents.length > 0
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {state.incidents.length} ALERTS
              </span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-850/80 flex items-center justify-between text-left">
              <span className="text-[10px] font-mono text-slate-400">STAFF SHIFTS ACTIVE</span>
              <span className="text-slate-200 font-mono text-[10px] font-bold">
                {state.volunteersActive} / {state.volunteersTotal} ({Math.round((state.volunteersActive / state.volunteersTotal) * 100)}%)
              </span>
            </div>
          </div>
        </div>
      );
    }

    // 1. SECTOR INSPECTION
    if (selectedEntity.type === "sector") {
      const sectorId = selectedEntity.id;
      const sectorData = sectors.find((s) => s.id === sectorId);
      if (!sectorData) return null;

      // Filter incidents in this sector
      const sectorIncidents = state.incidents.filter((i) => {
        if (sectorId === "north_supporters") return i.section.toLowerCase().includes("north");
        if (sectorId === "east_concourse") return i.section.toLowerCase().includes("east") || i.section.includes("114");
        if (sectorId === "south_deck") return i.section.toLowerCase().includes("south") || i.section.toLowerCase().includes("gate c");
        if (sectorId === "west_club") return i.section.toLowerCase().includes("west") || i.section.toLowerCase().includes("substation");
        return false;
      });

      const sectorAccRequests = state.accessibilityRequests.filter((req) => {
        if (sectorId === "north_supporters") return req.location.toLowerCase().includes("north");
        if (sectorId === "east_concourse") return req.location.toLowerCase().includes("east");
        if (sectorId === "south_deck") return req.location.toLowerCase().includes("south");
        if (sectorId === "west_club") return req.location.toLowerCase().includes("west");
        return false;
      });

      const estSpectators = Math.round(sectorData.capacity * (sectorData.density / 100));

      return (
        <div className="space-y-4 font-sans h-full flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
              <div>
                <span className="text-[9px] font-mono text-sky-400 uppercase block tracking-wider">SECTOR INSPECTOR</span>
                <h4 className="text-xs font-bold text-slate-100 tracking-tight mt-0.5">{sectorData.name}</h4>
              </div>
              <span className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
                <Users className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850/80">
                <span className="text-[9px] font-mono text-slate-500 uppercase block">DENSITY PROFILE</span>
                <span className="text-sm font-mono font-bold text-slate-200 mt-1 block">
                  {sectorData.density}%
                </span>
                <div className="w-full bg-slate-900 rounded-full h-1 mt-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${sectorData.density}%`,
                      backgroundColor: getDensityColor(sectorData.density)
                    }}
                  />
                </div>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850/80">
                <span className="text-[9px] font-mono text-slate-500 uppercase block">EST. SPECTATORS</span>
                <span className="text-sm font-mono font-bold text-slate-100 mt-1 block">
                  {estSpectators.toLocaleString()}
                </span>
                <span className="text-[8px] font-mono text-slate-500 block mt-0.5">
                  MAX CAP: {sectorData.capacity.toLocaleString()}
                </span>
              </div>
            </div>

            {sectorIncidents.length > 0 ? (
              <div className="mt-3 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
                <div className="flex items-center gap-2 text-rose-400 text-[10px] font-mono font-bold uppercase animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{sectorIncidents.length} ACTIVE ALERTS</span>
                </div>
                <div className="mt-1.5 space-y-1">
                  {sectorIncidents.map((inc) => (
                    <div key={inc.id} className="flex justify-between items-center text-[10px] gap-2">
                      <span className="text-slate-300 font-medium truncate flex-1">{inc.title}</span>
                      <button
                        onClick={() => onResolveIncident?.(inc.id)}
                        className="px-1.5 py-0.5 bg-rose-500 text-white rounded font-mono text-[8px] hover:bg-rose-600 transition-all cursor-pointer whitespace-nowrap"
                      >
                        RESOLVE
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-mono text-emerald-400 uppercase font-bold">Sector Area Clean & Secured</span>
              </div>
            )}

            {sectorAccRequests.length > 0 && (
              <div className="mt-2.5 bg-sky-500/5 border border-sky-500/10 rounded-lg p-2 text-[10px]">
                <span className="text-sky-400 font-mono font-bold uppercase block mb-1">LOCAL DISPATCH STANDBY:</span>
                <div className="space-y-1">
                  {sectorAccRequests.map((req) => (
                    <div key={req.id} className="flex items-center justify-between">
                      <span className="text-slate-400 truncate max-w-[130px]">{req.description}</span>
                      <button
                        onClick={() => onCompleteAccessibilityRequest?.(req.id)}
                        className="text-emerald-400 font-mono font-bold hover:underline cursor-pointer"
                      >
                        MARK DONE
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850/80">
            <span className="text-[9px] font-mono text-slate-400 uppercase font-bold block mb-1.5">TESTING / SIMULATED STRESS INJECTOR</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  if (onSelectScenario) onSelectScenario("unexpected_surge");
                }}
                className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 rounded text-[9px] font-mono font-bold uppercase transition-all text-center cursor-pointer"
              >
                INJECT SURGE
              </button>
              <button
                onClick={async () => {
                  if (!onUpdateServerState) return;
                  const randomId = "inc_sec_" + Math.floor(Math.random() * 1000);
                  const mockIncident: SecurityIncident = {
                    id: randomId,
                    title: `Pyro/Smoke alert reported`,
                    section: sectorData.name,
                    priority: "critical",
                    status: "active",
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    description: "Pyrotechnics smoke detected. Security dispatch coordinates requested.",
                    assignedStaff: 8
                  };
                  await onUpdateServerState({
                    incidents: [mockIncident, ...state.incidents]
                  });
                }}
                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded text-[9px] font-mono font-bold uppercase transition-all text-center cursor-pointer"
              >
                INJECT ALERT
              </button>
            </div>
          </div>
        </div>
      );
    }

    // 2. GATE INSPECTION
    if (selectedEntity.type === "gate") {
      const gateId = selectedEntity.id;
      const gate = state.gates.find((g) => g.id === gateId);
      if (!gate) return null;

      return (
        <div className="space-y-4 font-sans h-full flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
              <div>
                <span className="text-[9px] font-mono text-amber-400 uppercase block tracking-wider">GATE CONTROL DECK</span>
                <h4 className="text-xs font-bold text-slate-100 tracking-tight mt-0.5">{gate.name}</h4>
              </div>
              <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase bg-slate-900 border border-slate-800 text-slate-400">
                GATE {gate.id}
              </span>
            </div>

            <div className="mt-3.5 space-y-2">
              <span className="text-[9px] font-mono text-slate-500 uppercase block">OVERRIDE GATE GATEWAY STATE</span>
              <div className="grid grid-cols-3 gap-1">
                {(["open", "congested", "closed"] as const).map((st) => {
                  const isActive = gate.status === (st === "closed" ? "closed" : st);
                  const btnColor =
                    st === "open"
                      ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                      : st === "congested"
                      ? "border-orange-500/30 text-orange-400 bg-orange-500/10"
                      : "border-rose-500/30 text-rose-400 bg-rose-500/10";

                  return (
                    <button
                      key={st}
                      onClick={() => onGateAction?.(gate.id, st === "closed" ? "close" : st)}
                      className={`px-1.5 py-1 text-[9px] font-mono font-bold uppercase rounded border transition-all cursor-pointer ${
                        isActive
                          ? btnColor + " ring-1 ring-white/20"
                          : "border-slate-800 text-slate-500 bg-transparent hover:text-slate-300"
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3.5">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850/80">
                <span className="text-[9px] font-mono text-slate-500 uppercase block">QUEUE TIME</span>
                <span
                  className={`text-base font-mono font-bold mt-1 block ${
                    gate.queueTime > 25
                      ? "text-rose-400"
                      : gate.queueTime > 15
                      ? "text-orange-400"
                      : "text-emerald-400"
                  }`}
                >
                  {gate.queueTime} mins
                </span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850/80">
                <span className="text-[9px] font-mono text-slate-500 uppercase block">OCCUPANCY LOAD</span>
                <span className="text-base font-mono font-bold text-slate-200 mt-1 block">
                  {gate.occupancy}%
                </span>
              </div>
            </div>

            <div className="mt-3.5 bg-slate-950/60 p-2.5 rounded-lg border border-slate-850/80">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-400 uppercase">VOLUNTEER STAFF SHIFT</span>
                <span className="text-emerald-400 font-bold">{gate.volunteerCount} Deployed</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={gate.volunteerCount}
                onChange={(e) =>
                  onGateAction?.(
                    gate.id,
                    gate.status === "closed"
                      ? "close"
                      : gate.status === "congested"
                      ? "congested"
                      : "open",
                    parseInt(e.target.value)
                  )
                }
                className="w-full mt-2 accent-emerald-500 bg-slate-800 rounded-lg h-1.5 cursor-pointer"
              />
              <span className="text-[8px] font-mono text-slate-500 block mt-1 leading-relaxed">
                *Increasing volunteer staff improves processing and decreases queue times.
              </span>
            </div>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850/80">
            <span className="text-[9px] font-mono text-slate-400 uppercase font-bold block mb-1.5">EMERGENCY TESTS</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => onGateAction?.(gate.id, "close", 0)}
                className="px-1.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded text-[8px] font-mono font-bold uppercase transition-all text-center cursor-pointer"
              >
                SIMULATE BREAKDOWN
              </button>
              <button
                onClick={() => onGateAction?.(gate.id, "open", 45)}
                className="px-1.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded text-[8px] font-mono font-bold uppercase transition-all text-center cursor-pointer"
              >
                FORCE OVER-STAFF
              </button>
            </div>
          </div>
        </div>
      );
    }

    // 3. CONCESSION INSPECTION
    if (selectedEntity.type === "concession") {
      const concessionId = selectedEntity.id;
      const concession = state.concessions.find((con) => con.id === concessionId);
      if (!concession) return null;

      const stockColor =
        concession.stockLevel < 35
          ? "text-rose-400"
          : concession.stockLevel < 60
          ? "text-orange-400"
          : "text-emerald-400";

      return (
        <div className="space-y-4 font-sans h-full flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
              <div>
                <span className="text-[9px] font-mono text-sky-400 uppercase block tracking-wider">CONCESSION CONSOLE</span>
                <h4 className="text-xs font-bold text-slate-100 tracking-tight mt-0.5">{concession.name}</h4>
              </div>
              <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase bg-slate-900 border border-slate-800 text-sky-400">
                {concession.category.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3.5">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850/80">
                <span className="text-[9px] font-mono text-slate-500 uppercase block">STOCK LEVEL</span>
                <span className={`text-base font-mono font-bold mt-1 block ${stockColor}`}>
                  {concession.stockLevel}%
                </span>
                <div className="w-full bg-slate-900 rounded-full h-1 mt-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${concession.stockLevel}%`,
                      backgroundColor:
                        concession.stockLevel < 35
                          ? "#f43f5e"
                          : concession.stockLevel < 60
                          ? "#f97316"
                          : "#10b981"
                    }}
                  />
                </div>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850/80">
                <span className="text-[9px] font-mono text-slate-500 uppercase block">QUEUE DELAY</span>
                <span className="text-base font-mono font-bold text-slate-200 mt-1 block">
                  {concession.queueTime} mins
                </span>
                <span className="text-[8px] font-mono text-slate-500 block mt-0.5">
                  SPEED: {concession.queueTime > 20 ? "SLOW CONGESTED" : "EFFICIENT"}
                </span>
              </div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850/80 mt-2.5 flex items-center justify-between">
              <span className="text-[9px] font-mono text-slate-500 uppercase">ACCUMULATED REVENUE</span>
              <span className="text-xs font-mono font-bold text-slate-100">
                ${concession.sales.toLocaleString()} USD
              </span>
            </div>

            <div className="mt-3.5">
              <button
                onClick={async () => {
                  if (!onLevelConcessionStocks || !onUpdateServerState) return;
                  onLevelConcessionStocks();
                  const nextConcessions = state.concessions.map((c) =>
                    c.id === concessionId
                      ? { ...c, stockLevel: 95, queueTime: Math.max(3, Math.round(c.queueTime / 2)) }
                      : c
                  );
                  await onUpdateServerState({ concessions: nextConcessions });
                }}
                className="w-full p-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs font-mono uppercase tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer border-none"
              >
                <Sliders className="w-3.5 h-3.5" /> RESTOCK / REBALANCE NOW
              </button>
            </div>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850/80">
            <span className="text-[9px] font-mono text-slate-400 uppercase font-bold block mb-1.5">SANDBOX OVERRIDES</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={async () => {
                  if (!onUpdateServerState) return;
                  const nextConcessions = state.concessions.map((c) =>
                    c.id === concessionId ? { ...c, stockLevel: 15, queueTime: 38 } : c
                  );
                  await onUpdateServerState({ concessions: nextConcessions });
                }}
                className="px-1.5 py-1 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 rounded text-[8px] font-mono font-bold uppercase transition-all text-center cursor-pointer"
              >
                SIMULATE DEPLETION
              </button>
              <button
                onClick={async () => {
                  if (!onUpdateServerState) return;
                  const nextConcessions = state.concessions.map((c) =>
                    c.id === concessionId
                      ? { ...c, sales: c.sales + 12000, stockLevel: Math.max(10, c.stockLevel - 15) }
                      : c
                  );
                  await onUpdateServerState({ concessions: nextConcessions });
                }}
                className="px-1.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-400 rounded text-[8px] font-mono font-bold uppercase transition-all text-center cursor-pointer"
              >
                HAPPY HOUR SURGE
              </button>
            </div>
          </div>
        </div>
      );
    }

    // 4. FIELD INSPECTION
    if (selectedEntity.type === "field") {
      return (
        <div className="space-y-4 font-sans h-full flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
              <div>
                <span className="text-[9px] font-mono text-emerald-400 uppercase block tracking-wider">ARENA CORE DECK</span>
                <h4 className="text-xs font-bold text-slate-100 tracking-tight mt-0.5">FIFA Pitch & Main Arena</h4>
              </div>
              <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                FIELD
              </span>
            </div>

            <div className="mt-3 bg-slate-950 p-3 rounded-lg border border-slate-850/80 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-500">MATCH STATE</span>
                <span className="text-slate-100 font-bold">{state.matchTimeLabel || "82' (2ND HALF)"}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-500">POWER DRAW MATRIX</span>
                <span className="text-emerald-400 font-bold">SOLAR ACTIVE (+{state.sustainability.solarGenerationKw}kW)</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-500">ENVIRONMENT CLIMATE</span>
                <span className="text-slate-100 font-bold">
                  {state.weather.temp}°C, {state.weather.condition}
                </span>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <span className="text-[9px] font-mono text-slate-500 uppercase block">VENUE EMERGENCY BROADCAST</span>
              <button
                onClick={async () => {
                  if (!onUpdateServerState) return;
                  const alarmIncident: SecurityIncident = {
                    id: "inc_siren_" + Date.now(),
                    title: "AUXILIARY SIREN BROADCAST TEST",
                    section: "FIFA Pitch & Main Arena",
                    priority: "warning",
                    status: "active",
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    description: "Manual test of auxiliary evacuation sirens complete. Perimeter lighting synced.",
                    assignedStaff: 12
                  };
                  await onUpdateServerState({
                    incidents: [alarmIncident, ...state.incidents]
                  });
                }}
                className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 font-bold rounded-lg text-[10px] font-mono uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Siren className="w-3.5 h-3.5" /> TRIGGER SIREN TEST
              </button>
            </div>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850/80">
            <span className="text-[9px] font-mono text-slate-400 uppercase font-bold block mb-1">SYSTEM CALIBRATION</span>
            <p className="text-[8px] font-mono text-slate-500 leading-normal mb-2">
              Calibrates simulation state parameters to standard default settings, resolving all stress.
            </p>
            <button
              onClick={() => {
                if (onSelectScenario) {
                  onSelectScenario("normal");
                  setSelectedEntity(null);
                }
              }}
              className="w-full py-1.5 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/20 text-sky-400 font-bold rounded-md text-[9px] font-mono uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> RESET VENUE PARAMETERS
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="tactical-card relative p-5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col justify-between h-full min-h-[500px]">
      {/* Top HUD Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-orange-500/10 z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            <h3 className="font-display font-bold text-slate-100 text-sm tracking-tight uppercase flex items-center gap-1.5">
              <span>FIFA STADIUM DIGITAL TWIN</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-orange-400 tracking-normal normal-case font-normal border border-orange-500/20">
                ROTATABLE
              </span>
            </h3>
          </div>
          <p className="text-[10px] font-mono text-slate-500 mt-0.5 uppercase">
            GEOLOC: DFW-METROPLEX // TWIN STATUS: SYNCED REAL-TIME
          </p>
        </div>

        {/* 3D Model Control Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setRotateZ((prev) => (prev - 15) % 360)}
            aria-label="Rotate Stadium Left"
            className="px-3 py-2 bg-slate-950 hover:bg-slate-800 active:scale-95 active:bg-slate-900 text-slate-300 hover:text-white rounded border border-slate-800 hover:border-slate-700 text-[11px] font-mono font-bold uppercase transition-all cursor-pointer min-h-[36px] flex items-center justify-center"
          >
            Rot L
          </button>
          <button
            onClick={() => setRotateZ((prev) => (prev + 15) % 360)}
            aria-label="Rotate Stadium Right"
            className="px-3 py-2 bg-slate-950 hover:bg-slate-800 active:scale-95 active:bg-slate-900 text-slate-300 hover:text-white rounded border border-slate-800 hover:border-slate-700 text-[11px] font-mono font-bold uppercase transition-all cursor-pointer min-h-[36px] flex items-center justify-center"
          >
            Rot R
          </button>
          <button
            onClick={() => setRotateX((prev) => Math.max(15, prev - 8))}
            aria-label="Tilt Stadium Up"
            className="px-3 py-2 bg-slate-950 hover:bg-slate-800 active:scale-95 active:bg-slate-900 text-slate-300 hover:text-white rounded border border-slate-800 hover:border-slate-700 text-[11px] font-mono font-bold uppercase transition-all cursor-pointer min-h-[36px] flex items-center justify-center"
          >
            Tilt Up
          </button>
          <button
            onClick={() => setRotateX((prev) => Math.min(85, prev + 8))}
            aria-label="Tilt Stadium Down"
            className="px-3 py-2 bg-slate-950 hover:bg-slate-800 active:scale-95 active:bg-slate-900 text-slate-300 hover:text-white rounded border border-slate-800 hover:border-slate-700 text-[11px] font-mono font-bold uppercase transition-all cursor-pointer min-h-[36px] flex items-center justify-center"
          >
            Tilt Dn
          </button>
          <button
            onClick={() => {
              setIsAutoRotating(!isAutoRotating);
              setIsDragging(false);
            }}
            aria-label={isAutoRotating ? "Pause auto-rotation" : "Start auto-rotation"}
            className={`px-3 py-2 rounded border text-[11px] font-mono font-bold uppercase transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer min-h-[36px] justify-center ${
              isAutoRotating
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            {isAutoRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>AUTO</span>
          </button>
          <button
            onClick={handleResetView}
            aria-label="Reset View Perspective"
            className="px-3 py-2 bg-slate-950 hover:bg-slate-800 active:scale-95 text-slate-400 hover:text-slate-200 rounded border border-slate-800 hover:border-slate-700 text-[11px] font-mono transition-all cursor-pointer min-h-[36px] flex items-center justify-center"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Primary Dual-Pane Responsive Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch my-4 flex-1">
        {/* LEFT COLUMN: INTERACTIVE 3D ROTATABLE SVG CANVAS */}
        <div className="xl:col-span-7 bg-slate-950/40 rounded-xl border border-slate-850/60 p-4 flex flex-col justify-between relative min-h-[360px] overflow-hidden">
          {/* Subtle Grid / Technical Design backing */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

          {/* Halo rings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full border border-slate-800/20 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full border border-dashed border-slate-800/10 pointer-events-none" />

          {/* Instruction Tooltip */}
          <div className="absolute top-2 left-2 z-10 pointer-events-none bg-slate-950/60 backdrop-blur-sm px-2 py-1 rounded text-[8px] font-mono text-slate-500 uppercase">
            &lt;Click + Drag model to rotate / Click sectors to inspect&gt;
          </div>

          {/* Rotatable Stage Container wrapper */}
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className={`flex-1 flex items-center justify-center select-none cursor-grab active:cursor-grabbing relative overflow-visible ${
              isDragging || isTouching ? "cursor-grabbing" : ""
            }`}
            style={{
              perspective: "1200px",
              perspectiveOrigin: "50% 50%",
            }}
          >
            <div
              className="relative w-full max-w-[420px] aspect-square"
              style={{
                transform: `rotateX(${rotateX}deg) rotateZ(${rotateZ}deg)`,
                transformStyle: "preserve-3d",
                transition: isDragging || isTouching ? "none" : "transform 0.4s ease-out"
              }}
            >
              {/* Common SVG Filters & Gradients defined in a hidden flat layer */}
              <svg className="absolute w-0 h-0 pointer-events-none">
                <defs>
                  <radialGradient id="fieldGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </radialGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
              </svg>

              {/* Layer 0: Ground Shadow & Exterior Plaza (Z = -30px) */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  transform: "translateZ(-30px)",
                  transformStyle: "preserve-3d",
                }}
              >
                <svg viewBox="0 0 500 500" className="w-full h-full">
                  {/* Outer shadow base */}
                  <ellipse cx="250" cy="250" rx="230" ry="190" fill="#020617" opacity="0.7" filter="blur(12px)" />
                  <ellipse cx="250" cy="250" rx="210" ry="170" fill="#000000" opacity="0.85" filter="blur(6px)" />

                  {/* Concentric paved pathways */}
                  <ellipse cx="250" cy="250" rx="245" ry="205" fill="none" stroke="rgba(51, 65, 85, 0.25)" strokeWidth="1" strokeDasharray="6 6" />
                  <ellipse cx="250" cy="250" rx="230" ry="190" fill="none" stroke="rgba(51, 65, 85, 0.35)" strokeWidth="1" />
                  <ellipse cx="250" cy="250" rx="215" ry="175" fill="none" stroke="rgba(51, 65, 85, 0.2)" strokeWidth="1" strokeDasharray="3 3" />

                  {/* Radial entry walkways */}
                  {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
                    const rad = (deg * Math.PI) / 180;
                    return (
                      <line
                        key={deg}
                        x1={250 + 215 * Math.cos(rad)}
                        y1={250 + 175 * Math.sin(rad)}
                        x2={250 + 245 * Math.cos(rad)}
                        y2={250 + 205 * Math.sin(rad)}
                        stroke="rgba(51, 65, 85, 0.3)"
                        strokeWidth="1.5"
                      />
                    );
                  })}

                  {/* Exterior Plaza Transit Indicators */}
                  <g transform="translate(130, 15)">
                    <rect x="0" y="0" width="90" height="25" rx="5" fill="#020617" opacity="0.85" stroke="#1e293b" strokeWidth="1.2" />
                    <text x="45" y="15" fill="#94a3b8" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">METRO NORTH</text>
                    <circle cx="10" cy="12.5" r="4.5" fill={state.scenario === "metro_delay" ? "#f43f5e" : "#10b981"} />
                  </g>

                  <g transform="translate(280, 460)">
                    <rect x="0" y="0" width="90" height="25" rx="5" fill="#020617" opacity="0.85" stroke="#1e293b" strokeWidth="1.2" />
                    <text x="45" y="15" fill="#94a3b8" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">METRO SOUTH</text>
                    <circle cx="10" cy="12.5" r="4.5" fill={state.scenario === "metro_delay" ? "#f43f5e" : "#10b981"} />
                  </g>
                </svg>
              </div>

              {/* Layer 1: Green Playing Pitch & Fields (Z = 0px) */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  transform: "translateZ(0px)",
                  transformStyle: "preserve-3d",
                }}
              >
                <svg viewBox="0 0 500 500" className="w-full h-full pointer-events-none">
                  {/* Playing Pitch Boundary Outer Glow */}
                  <ellipse cx="250" cy="250" rx="104" ry="74" fill="url(#fieldGlow)" opacity="0.8" />

                  {/* Playing Field Base (FIFA Turf Grass Green) */}
                  <ellipse
                    cx="250"
                    cy="250"
                    rx="100"
                    ry="70"
                    fill="#064e3b"
                    stroke="#059669"
                    strokeWidth="2.5"
                    className="transition-all duration-300 cursor-pointer hover:fill-[#047857] pointer-events-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEntity({ type: "field", id: "field_pitch" });
                      onSelectSection("FIFA World Cup Pitch — Core Arena Field Operations Active");
                    }}
                  />

                  {/* Grass Lawn Cut Stripes (using clipping path to fit the field) */}
                  <g clipPath="url(#fieldClip)" opacity="0.12" className="pointer-events-none">
                    {[-90, -70, -50, -30, -10, 10, 30, 50, 70, 90].map((x, i) => (
                      <rect
                        key={i}
                        x={250 + x}
                        y={150}
                        width="12"
                        height="200"
                        fill="#34d399"
                        transform={`skewX(14) translate(${-x * 0.15}, 0)`}
                      />
                    ))}
                  </g>

                  <clipPath id="fieldClip">
                    <ellipse cx="250" cy="250" rx="98" ry="68" />
                  </clipPath>

                  {/* Pitch White Regulation Markings */}
                  <g opacity="0.5" className="pointer-events-none">
                    <ellipse cx="250" cy="250" rx="94" ry="64" fill="none" stroke="#ffffff" strokeWidth="1" />
                    <line x1="250" y1="186" x2="250" y2="314" stroke="#ffffff" strokeWidth="1" />
                    <ellipse cx="250" cy="250" rx="20" ry="14" fill="none" stroke="#ffffff" strokeWidth="1" />
                    <circle cx="250" cy="250" r="1.5" fill="#ffffff" />
                    
                    {/* Penalty box details - Left */}
                    <rect x="156" y="222" width="22" height="56" fill="none" stroke="#ffffff" strokeWidth="1" />
                    <rect x="156" y="234" width="8" height="32" fill="none" stroke="#ffffff" strokeWidth="1" />
                    <path d="M 178 242 A 10 10 0 0 1 178 258" fill="none" stroke="#ffffff" strokeWidth="1" />

                    {/* Penalty box details - Right */}
                    <rect x="322" y="222" width="22" height="56" fill="none" stroke="#ffffff" strokeWidth="1" />
                    <rect x="336" y="234" width="8" height="32" fill="none" stroke="#ffffff" strokeWidth="1" />
                    <path d="M 322 242 A 10 10 0 0 0 322 258" fill="none" stroke="#ffffff" strokeWidth="1" />
                  </g>

                  {/* 3D Wireframe Net Goals */}
                  <g stroke="#ffffff" strokeWidth="1.2" fill="none" opacity="0.75" className="pointer-events-none">
                    {/* Left goal */}
                    <line x1="156" y1="241" x2="152" y2="241" />
                    <line x1="156" y1="259" x2="152" y2="259" />
                    <line x1="152" y1="241" x2="152" y2="259" />
                    
                    {/* Right goal */}
                    <line x1="344" y1="241" x2="348" y2="241" />
                    <line x1="344" y1="259" x2="348" y2="259" />
                    <line x1="348" y1="241" x2="348" y2="259" />
                  </g>

                  {/* Active Match Dynamic Player Dots */}
                  <g opacity="0.85" className="pointer-events-none">
                    {/* USA Stars Team A (Cyan) */}
                    <circle cx="232" cy="236" r="2.2" fill="#0ea5e9" filter="drop-shadow(0 0 2px #0ea5e9)" />
                    <circle cx="212" cy="264" r="2.2" fill="#0ea5e9" filter="drop-shadow(0 0 2px #0ea5e9)" />
                    <circle cx="226" cy="276" r="2.2" fill="#0ea5e9" filter="drop-shadow(0 0 2px #0ea5e9)" />
                    <circle cx="186" cy="248" r="2.2" fill="#0ea5e9" filter="drop-shadow(0 0 2px #0ea5e9)" />

                    {/* Rival Stars Team B (Rose) */}
                    <circle cx="268" cy="264" r="2.2" fill="#f43f5e" filter="drop-shadow(0 0 2px #f43f5e)" />
                    <circle cx="288" cy="236" r="2.2" fill="#f43f5e" filter="drop-shadow(0 0 2px #f43f5e)" />
                    <circle cx="274" cy="224" r="2.2" fill="#f43f5e" filter="drop-shadow(0 0 2px #f43f5e)" />
                    <circle cx="314" cy="252" r="2.2" fill="#f43f5e" filter="drop-shadow(0 0 2px #f43f5e)" />

                    {/* Referee (Neon Yellow) */}
                    <circle cx="248" cy="256" r="1.8" fill="#eab308" />
                  </g>
                </svg>
              </div>

              {/* Layer 2: Lower Bowl Seating Tier (Z = 25px) */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  transform: "translateZ(25px)",
                  transformStyle: "preserve-3d",
                }}
              >
                <svg viewBox="0 0 500 500" className="w-full h-full pointer-events-none">
                  {/* Seating structure outer ring border */}
                  <ellipse cx="250" cy="250" rx="146" ry="106" fill="none" stroke="#334155" strokeWidth="2" opacity="0.4" />

                  {/* Concentric row ridges inside lower bowl sectors */}
                  <ellipse cx="250" cy="250" rx="124" ry="84" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 2" opacity="0.4" />
                  <ellipse cx="250" cy="250" rx="134" ry="94" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 3" opacity="0.4" />
                  <ellipse cx="250" cy="250" rx="144" ry="104" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="5 2" opacity="0.4" />

                  {/* Concentric Seating Paths (Scale 0.83 for nested lower bowl look) */}
                  <g transform="translate(250, 250) scale(0.83) translate(-250, -250)">
                    {/* SECTOR 1: North Supporters */}
                    <path
                      d="M 100 210 A 180 140 0 0 1 400 210 L 370 220 A 140 100 0 0 0 130 220 Z"
                      fill={getSectorAlertState("north_supporters") ? "#f43f5e" : getDensityColor(sectors[0].density)}
                      fillOpacity={
                        hoveredSection === "north_supporters" ||
                        (selectedEntity?.type === "sector" && selectedEntity.id === "north_supporters")
                          ? "0.75"
                          : getSectorAlertState("north_supporters")
                          ? "0.55"
                          : "0.3"
                      }
                      stroke={
                        getSectorAlertState("north_supporters")
                          ? "#ef4444"
                          : selectedEntity?.type === "sector" && selectedEntity.id === "north_supporters"
                          ? "#ffffff"
                          : getDensityColor(sectors[0].density)
                      }
                      strokeWidth={
                        getSectorAlertState("north_supporters")
                          ? "4"
                          : selectedEntity?.type === "sector" && selectedEntity.id === "north_supporters"
                          ? "3.5"
                          : "1"
                      }
                      className={`transition-all duration-300 cursor-pointer hover:fill-opacity-55 focus:outline-none pointer-events-auto ${
                        getSectorAlertState("north_supporters") ? "animate-pulse" : ""
                      }`}
                      tabIndex={0}
                      role="button"
                      aria-label="North Supporters Zone lower level"
                      onMouseEnter={() => setHoveredSection("north_supporters")}
                      onMouseLeave={() => setHoveredSection(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSectorClick(sectors[0]);
                      }}
                      onKeyDown={(e) => handleKeyDown(e, () => handleSectorClick(sectors[0]))}
                    />

                    {/* SECTOR 2: East Concourse */}
                    <path
                      d="M 400 210 A 180 140 0 0 1 350 350 L 325 320 A 140 100 0 0 0 370 220 Z"
                      fill={getSectorAlertState("east_concourse") ? "#f43f5e" : getDensityColor(sectors[1].density)}
                      fillOpacity={
                        hoveredSection === "east_concourse" ||
                        (selectedEntity?.type === "sector" && selectedEntity.id === "east_concourse")
                          ? "0.75"
                          : getSectorAlertState("east_concourse")
                          ? "0.55"
                          : "0.3"
                      }
                      stroke={
                        getSectorAlertState("east_concourse")
                          ? "#ef4444"
                          : selectedEntity?.type === "sector" && selectedEntity.id === "east_concourse"
                          ? "#ffffff"
                          : getDensityColor(sectors[1].density)
                      }
                      strokeWidth={
                        getSectorAlertState("east_concourse")
                          ? "4"
                          : selectedEntity?.type === "sector" && selectedEntity.id === "east_concourse"
                          ? "3.5"
                          : "1"
                      }
                      className={`transition-all duration-300 cursor-pointer hover:fill-opacity-55 focus:outline-none pointer-events-auto ${
                        getSectorAlertState("east_concourse") ? "animate-pulse" : ""
                      }`}
                      tabIndex={0}
                      role="button"
                      aria-label="East Concourse lower level"
                      onMouseEnter={() => setHoveredSection("east_concourse")}
                      onMouseLeave={() => setHoveredSection(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSectorClick(sectors[1]);
                      }}
                      onKeyDown={(e) => handleKeyDown(e, () => handleSectorClick(sectors[1]))}
                    />

                    {/* SECTOR 3: South Deck */}
                    <path
                      d="M 350 350 A 180 140 0 0 1 150 350 L 175 320 A 140 100 0 0 0 325 320 Z"
                      fill={getSectorAlertState("south_deck") ? "#f43f5e" : getDensityColor(sectors[2].density)}
                      fillOpacity={
                        hoveredSection === "south_deck" ||
                        (selectedEntity?.type === "sector" && selectedEntity.id === "south_deck")
                          ? "0.75"
                          : getSectorAlertState("south_deck")
                          ? "0.55"
                          : "0.3"
                      }
                      stroke={
                        getSectorAlertState("south_deck")
                          ? "#ef4444"
                          : selectedEntity?.type === "sector" && selectedEntity.id === "south_deck"
                          ? "#ffffff"
                          : getDensityColor(sectors[2].density)
                      }
                      strokeWidth={
                        getSectorAlertState("south_deck")
                          ? "4"
                          : selectedEntity?.type === "sector" && selectedEntity.id === "south_deck"
                          ? "3.5"
                          : "1"
                      }
                      className={`transition-all duration-300 cursor-pointer hover:fill-opacity-55 focus:outline-none pointer-events-auto ${
                        getSectorAlertState("south_deck") ? "animate-pulse" : ""
                      }`}
                      tabIndex={0}
                      role="button"
                      aria-label="South Deck lower level"
                      onMouseEnter={() => setHoveredSection("south_deck")}
                      onMouseLeave={() => setHoveredSection(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSectorClick(sectors[2]);
                      }}
                      onKeyDown={(e) => handleKeyDown(e, () => handleSectorClick(sectors[2]))}
                    />

                    {/* SECTOR 4: West VIP */}
                    <path
                      d="M 150 350 A 180 140 0 0 1 100 210 L 130 220 A 140 100 0 0 0 175 320 Z"
                      fill={getSectorAlertState("west_club") ? "#f43f5e" : getDensityColor(sectors[3].density)}
                      fillOpacity={
                        hoveredSection === "west_club" ||
                        (selectedEntity?.type === "sector" && selectedEntity.id === "west_club")
                          ? "0.75"
                          : getSectorAlertState("west_club")
                          ? "0.55"
                          : "0.3"
                      }
                      stroke={
                        getSectorAlertState("west_club")
                          ? "#ef4444"
                          : selectedEntity?.type === "sector" && selectedEntity.id === "west_club"
                          ? "#ffffff"
                          : getDensityColor(sectors[3].density)
                      }
                      strokeWidth={
                        getSectorAlertState("west_club")
                          ? "4"
                          : selectedEntity?.type === "sector" && selectedEntity.id === "west_club"
                          ? "3.5"
                          : "1"
                      }
                      className={`transition-all duration-300 cursor-pointer hover:fill-opacity-55 focus:outline-none pointer-events-auto ${
                        getSectorAlertState("west_club") ? "animate-pulse" : ""
                      }`}
                      tabIndex={0}
                      role="button"
                      aria-label="West VIP lower level"
                      onMouseEnter={() => setHoveredSection("west_club")}
                      onMouseLeave={() => setHoveredSection(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSectorClick(sectors[3]);
                      }}
                      onKeyDown={(e) => handleKeyDown(e, () => handleSectorClick(sectors[3]))}
                    />
                  </g>

                  {/* Level Titles / Floating annotations */}
                  <g opacity="0.6" fontSize="8.5" fontFamily="monospace" fontWeight="bold" fill="#e2e8f0" textAnchor="middle" className="pointer-events-none select-none">
                    <text x="250" y="185">LOWER N STAND</text>
                    <text x="335" y="254">LOWER EAST</text>
                    <text x="250" y="322">LOWER S DECK</text>
                    <text x="165" y="254">LOWER WEST</text>
                  </g>
                </svg>
              </div>

              {/* Layer 3: VIP Luxury Suites & Scrolling LED Ribbon (Z = 44px) */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  transform: "translateZ(44px)",
                  transformStyle: "preserve-3d",
                }}
              >
                <svg viewBox="0 0 500 500" className="w-full h-full">
                  {/* Scrolling LED Digital Board Ring */}
                  <ellipse
                    cx="250"
                    cy="250"
                    rx="155"
                    ry="115"
                    fill="none"
                    stroke={isEvacMode ? "#ef4444" : "#0ea5e9"}
                    strokeWidth={isEvacMode ? "6" : "3"}
                    strokeDasharray={isEvacMode ? "8 4" : "14 7"}
                    opacity="0.9"
                    className={isEvacMode ? "animate-pulse" : ""}
                  >
                    <animate attributeName="stroke-dashoffset" values="0;360" dur={isEvacMode ? "4s" : "15s"} repeatCount="indefinite" />
                  </ellipse>
                  <ellipse cx="250" cy="250" rx="155" ry="115" fill="none" stroke={isEvacMode ? "#ef4444" : "#0ea5e9"} strokeWidth="0.5" opacity="0.5" />

                  {/* VIP Suite Glowing Glass Boxes */}
                  <ellipse
                    cx="250"
                    cy="250"
                    rx="160"
                    ry="120"
                    fill="none"
                    stroke={isEvacMode ? "#f43f5e" : "#eab308"}
                    strokeWidth={isEvacMode ? "3" : "1.8"}
                    strokeDasharray={isEvacMode ? "10 5" : "5 10"}
                    opacity="0.8"
                    className={isEvacMode ? "animate-pulse" : ""}
                  />
                </svg>
              </div>

              {/* Layer 4: Upper Bowl Seating Tier (Z = 55px) */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  transform: "translateZ(55px)",
                  transformStyle: "preserve-3d",
                }}
              >
                <svg viewBox="0 0 500 500" className="w-full h-full pointer-events-none">
                  {/* Fine concentric seat rows inside upper bowl */}
                  <ellipse cx="250" cy="250" rx="204" ry="164" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
                  <ellipse cx="250" cy="250" rx="214" ry="174" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />

                  {/* Upper Seating Paths (Scale 1.03 for overlapping upper tier layout) */}
                  <g transform="translate(250, 250) scale(1.03) translate(-250, -250)">
                    {/* SECTOR 1: North Supporters */}
                    <path
                      d="M 100 210 A 180 140 0 0 1 400 210 L 370 220 A 140 100 0 0 0 130 220 Z"
                      fill={getSectorAlertState("north_supporters") ? "#f43f5e" : getDensityColor(sectors[0].density)}
                      fillOpacity={
                        hoveredSection === "north_supporters" ||
                        (selectedEntity?.type === "sector" && selectedEntity.id === "north_supporters")
                          ? "0.85"
                          : getSectorAlertState("north_supporters")
                          ? "0.55"
                          : "0.26"
                      }
                      stroke={
                        getSectorAlertState("north_supporters")
                          ? "#ef4444"
                          : selectedEntity?.type === "sector" && selectedEntity.id === "north_supporters"
                          ? "#ffffff"
                          : getDensityColor(sectors[0].density)
                      }
                      strokeWidth={
                        getSectorAlertState("north_supporters")
                          ? "4.5"
                          : selectedEntity?.type === "sector" && selectedEntity.id === "north_supporters"
                          ? "3"
                          : "0.8"
                      }
                      className={`transition-all duration-300 cursor-pointer hover:fill-opacity-60 focus:outline-none pointer-events-auto ${
                        getSectorAlertState("north_supporters") ? "animate-pulse" : ""
                      }`}
                      tabIndex={0}
                      role="button"
                      aria-label="North Supporters Zone upper level"
                      onMouseEnter={() => setHoveredSection("north_supporters")}
                      onMouseLeave={() => setHoveredSection(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSectorClick(sectors[0]);
                      }}
                      onKeyDown={(e) => handleKeyDown(e, () => handleSectorClick(sectors[0]))}
                    />

                    {/* SECTOR 2: East Concourse */}
                    <path
                      d="M 400 210 A 180 140 0 0 1 350 350 L 325 320 A 140 100 0 0 0 370 220 Z"
                      fill={getSectorAlertState("east_concourse") ? "#f43f5e" : getDensityColor(sectors[1].density)}
                      fillOpacity={
                        hoveredSection === "east_concourse" ||
                        (selectedEntity?.type === "sector" && selectedEntity.id === "east_concourse")
                          ? "0.85"
                          : getSectorAlertState("east_concourse")
                          ? "0.55"
                          : "0.26"
                      }
                      stroke={
                        getSectorAlertState("east_concourse")
                          ? "#ef4444"
                          : selectedEntity?.type === "sector" && selectedEntity.id === "east_concourse"
                          ? "#ffffff"
                          : getDensityColor(sectors[1].density)
                      }
                      strokeWidth={
                        getSectorAlertState("east_concourse")
                          ? "4.5"
                          : selectedEntity?.type === "sector" && selectedEntity.id === "east_concourse"
                          ? "3"
                          : "0.8"
                      }
                      className={`transition-all duration-300 cursor-pointer hover:fill-opacity-60 focus:outline-none pointer-events-auto ${
                        getSectorAlertState("east_concourse") ? "animate-pulse" : ""
                      }`}
                      tabIndex={0}
                      role="button"
                      aria-label="East Concourse upper level"
                      onMouseEnter={() => setHoveredSection("east_concourse")}
                      onMouseLeave={() => setHoveredSection(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSectorClick(sectors[1]);
                      }}
                      onKeyDown={(e) => handleKeyDown(e, () => handleSectorClick(sectors[1]))}
                    />

                    {/* SECTOR 3: South Deck */}
                    <path
                      d="M 350 350 A 180 140 0 0 1 150 350 L 175 320 A 140 100 0 0 0 325 320 Z"
                      fill={getSectorAlertState("south_deck") ? "#f43f5e" : getDensityColor(sectors[2].density)}
                      fillOpacity={
                        hoveredSection === "south_deck" ||
                        (selectedEntity?.type === "sector" && selectedEntity.id === "south_deck")
                          ? "0.85"
                          : getSectorAlertState("south_deck")
                          ? "0.55"
                          : "0.26"
                      }
                      stroke={
                        getSectorAlertState("south_deck")
                          ? "#ef4444"
                          : selectedEntity?.type === "sector" && selectedEntity.id === "south_deck"
                          ? "#ffffff"
                          : getDensityColor(sectors[2].density)
                      }
                      strokeWidth={
                        getSectorAlertState("south_deck")
                          ? "4.5"
                          : selectedEntity?.type === "sector" && selectedEntity.id === "south_deck"
                          ? "3"
                          : "0.8"
                      }
                      className={`transition-all duration-300 cursor-pointer hover:fill-opacity-60 focus:outline-none pointer-events-auto ${
                        getSectorAlertState("south_deck") ? "animate-pulse" : ""
                      }`}
                      tabIndex={0}
                      role="button"
                      aria-label="South Deck upper level"
                      onMouseEnter={() => setHoveredSection("south_deck")}
                      onMouseLeave={() => setHoveredSection(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSectorClick(sectors[2]);
                      }}
                      onKeyDown={(e) => handleKeyDown(e, () => handleSectorClick(sectors[2]))}
                    />

                    {/* SECTOR 4: West VIP */}
                    <path
                      d="M 150 350 A 180 140 0 0 1 100 210 L 130 220 A 140 100 0 0 0 175 320 Z"
                      fill={getSectorAlertState("west_club") ? "#f43f5e" : getDensityColor(sectors[3].density)}
                      fillOpacity={
                        hoveredSection === "west_club" ||
                        (selectedEntity?.type === "sector" && selectedEntity.id === "west_club")
                          ? "0.85"
                          : getSectorAlertState("west_club")
                          ? "0.55"
                          : "0.26"
                      }
                      stroke={
                        getSectorAlertState("west_club")
                          ? "#ef4444"
                          : selectedEntity?.type === "sector" && selectedEntity.id === "west_club"
                          ? "#ffffff"
                          : getDensityColor(sectors[3].density)
                      }
                      strokeWidth={
                        getSectorAlertState("west_club")
                          ? "4.5"
                          : selectedEntity?.type === "sector" && selectedEntity.id === "west_club"
                          ? "3"
                          : "0.8"
                      }
                      className={`transition-all duration-300 cursor-pointer hover:fill-opacity-60 focus:outline-none pointer-events-auto ${
                        getSectorAlertState("west_club") ? "animate-pulse" : ""
                      }`}
                      tabIndex={0}
                      role="button"
                      aria-label="West VIP upper level"
                      onMouseEnter={() => setHoveredSection("west_club")}
                      onMouseLeave={() => setHoveredSection(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSectorClick(sectors[3]);
                      }}
                      onKeyDown={(e) => handleKeyDown(e, () => handleSectorClick(sectors[3]))}
                    />
                  </g>

                  {/* Level Titles / Floating annotations */}
                  <g opacity="0.75" fontSize="9" fontFamily="monospace" fontWeight="bold" fill="#ffffff" textAnchor="middle" className="pointer-events-none select-none">
                    <text x="250" y="112">UPPER N DECK</text>
                    <text x="382" y="254">UPPER EAST</text>
                    <text x="250" y="396">UPPER S STAND</text>
                    <text x="118" y="254">UPPER WEST</text>
                  </g>
                </svg>
              </div>

              {/* Layer 5: Interactive Concessions & Perimeter Gates (Z = 18px) */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  transform: "translateZ(18px)",
                  transformStyle: "preserve-3d",
                }}
              >
                <svg viewBox="0 0 500 500" className="w-full h-full pointer-events-none">
                  {/* Concourse walkway line */}
                  <ellipse cx="250" cy="250" rx="180" ry="140" fill="none" stroke="rgba(30, 41, 59, 0.6)" strokeWidth="3" opacity="0.6" />

                  {/* INTERACTIVE CLICKABLE CONCESSION STANDS */}
                  {state.concessions.map((con) => {
                    let cx = 250;
                    let cy = 250;
                    if (con.id === "food_east") {
                      cx = 330;
                      cy = 240;
                    } else if (con.id === "food_west") {
                      cx = 170;
                      cy = 240;
                    } else if (con.id === "fifa_store") {
                      cx = 250;
                      cy = 150;
                    } else if (con.id === "beverage_north") {
                      cx = 205;
                      cy = 190;
                    } else if (con.id === "beverage_south") {
                      cx = 295;
                      cy = 310;
                    }

                    const isSelected = selectedEntity?.type === "concession" && selectedEntity.id === con.id;
                    const color =
                      con.stockLevel < 35 ? "#f43f5e" : con.stockLevel < 60 ? "#f97316" : "#0ea5e9";

                    return (
                      <g
                        key={con.id}
                        className="cursor-pointer focus:outline-none pointer-events-auto"
                        tabIndex={0}
                        role="button"
                        aria-label={`Concession ${con.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEntity({ type: "concession", id: con.id });
                          onSelectSection(
                            `${con.name} — Wait Queue: ${con.queueTime}m, Stock Level: ${con.stockLevel}%, Total Sales: $${con.sales.toLocaleString()}`
                          );
                        }}
                        onKeyDown={(e) =>
                          handleKeyDown(e, () => {
                            setSelectedEntity({ type: "concession", id: con.id });
                            onSelectSection(
                              `${con.name} — Wait Queue: ${con.queueTime}m, Stock Level: ${con.stockLevel}%, Total Sales: $${con.sales.toLocaleString()}`
                            );
                          })
                        }
                      >
                        {con.stockLevel < 35 && (
                          <ellipse cx={cx} cy={cy} rx="15" ry="10" fill="none" stroke="#f43f5e" strokeWidth="1.5">
                            <animate attributeName="rx" values="6;16;6" dur="2s" repeatCount="indefinite" />
                            <animate attributeName="ry" values="4;11;4" dur="2s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite" />
                          </ellipse>
                        )}
                        {/* Kiosk geometry prism */}
                        <polygon
                          points={`${cx},${cy - 8} ${cx + 7},${cy - 4} ${cx + 7},${cy + 4} ${cx},${cy + 8} ${cx - 7},${cy + 4} ${cx - 7},${cy - 4}`}
                          fill={isSelected ? "#ffffff" : "#020617"}
                          stroke={isSelected ? "#ffffff" : color}
                          strokeWidth={isSelected ? "2.5" : "1.8"}
                        />
                        <circle cx={cx} cy={cy} r="3" fill={isSelected ? "#020617" : color} />
                        <text
                          x={cx}
                          y={cy - 12}
                          fill={isSelected ? "#ffffff" : "#94a3b8"}
                          fontSize="7.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                          textAnchor="middle"
                          className="pointer-events-none select-none"
                        >
                          {con.id === "fifa_store" ? "STORE" : con.id === "food_east" ? "F_EAST" : "F_WEST"}
                        </text>
                      </g>
                    );
                  })}

                  {/* INTERACTIVE CLICKABLE PERIMETER GATES */}
                  {state.gates.map((gate, index) => {
                    const angles = [240, 180, 300, 0, 120, 60];
                    const rad = (angles[index] * Math.PI) / 180;
                    const x = 250 + 215 * Math.cos(rad);
                    const y = 250 + 175 * Math.sin(rad);

                    const isSelected = selectedEntity?.type === "gate" && selectedEntity.id === gate.id;
                    const color =
                      gate.status === "congested"
                        ? "#f97316"
                        : gate.status === "closed"
                        ? "#f43f5e"
                        : "#10b981";

                    return (
                      <g
                        key={gate.id}
                        className="cursor-pointer focus:outline-none pointer-events-auto"
                        tabIndex={0}
                        role="button"
                        aria-label={`Gate ${gate.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEntity({ type: "gate", id: gate.id });
                          onSelectSection(`Gate ${gate.id} — Wait: ${gate.queueTime}m, Staff: ${gate.volunteerCount}`);
                        }}
                        onKeyDown={(e) =>
                          handleKeyDown(e, () => {
                            setSelectedEntity({ type: "gate", id: gate.id });
                            onSelectSection(`Gate ${gate.id} — Wait: ${gate.queueTime}m, Staff: ${gate.volunteerCount}`);
                          })
                        }
                      >
                        {(gate.status !== "open" || isSelected) && (
                          <ellipse
                            cx={x}
                            cy={y}
                            rx={isSelected ? "18" : "14"}
                            ry={isSelected ? "13" : "9"}
                            fill="none"
                            stroke={isSelected ? "#ffffff" : color}
                            strokeWidth="1.5"
                          >
                            <animate attributeName="rx" values="6;20;6" dur="2s" repeatCount="indefinite" />
                            <animate attributeName="ry" values="4;14;4" dur="2s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite" />
                          </ellipse>
                        )}
                        <circle
                          cx={x}
                          cy={y}
                          r={isSelected ? "11" : "8"}
                          fill={isSelected ? "#ffffff" : color}
                          stroke="#020617"
                          strokeWidth="2"
                        />
                        <text
                          x={x}
                          y={y + 3}
                          fill={isSelected ? "#020617" : "#ffffff"}
                          fontSize="8.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                          textAnchor="middle"
                          className="pointer-events-none select-none"
                        >
                          {gate.id}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Layer 6: Tensile Steel Open Roof Canopy (Z = 85px) */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  transform: "translateZ(85px)",
                  transformStyle: "preserve-3d",
                }}
              >
                <svg viewBox="0 0 500 500" className="w-full h-full">
                  {/* Outer structural tension ring */}
                  <ellipse cx="250" cy="250" rx="222" ry="182" fill="none" stroke="#475569" strokeWidth="3" opacity="0.85" />

                  {/* Glass pane segments radial shading */}
                  <path
                    d="M 250 50 A 220 180 0 1 1 249.9 50 L 249.9 140 A 120 85 0 1 0 250 140 Z"
                    fill="url(#canopyGradient)"
                    stroke="#334155"
                    strokeWidth="1.5"
                    opacity="0.6"
                  />

                  <defs>
                    <radialGradient id="canopyGradient" cx="50%" cy="50%" r="50%">
                      <stop offset="60%" stopColor="#0b1329" />
                      <stop offset="85%" stopColor="#1e293b" />
                      <stop offset="100%" stopColor="#0284c7" />
                    </radialGradient>
                  </defs>

                  {/* Roof Support Trusses */}
                  {[-180, -150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map((deg) => {
                    const rad = (deg * Math.PI) / 180;
                    return (
                      <line
                        key={deg}
                        x1={250 + 120 * Math.cos(rad)}
                        y1={250 + 85 * Math.sin(rad)}
                        x2={250 + 220 * Math.cos(rad)}
                        y2={250 + 180 * Math.sin(rad)}
                        stroke="#38bdf8"
                        strokeWidth="1.5"
                        opacity="0.5"
                      />
                    );
                  })}

                  {/* Inner ring (Oculus opening over field) */}
                  <ellipse cx="250" cy="250" rx="120" ry="85" fill="none" stroke="#38bdf8" strokeWidth="3" opacity="0.9" filter="drop-shadow(0 0 4px #0ea5e9)" />
                </svg>
              </div>

              {/* Layer 7: Floating Scoreboard / Center Jumbotron (Z = 110px) */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  transform: "translateZ(110px)",
                  transformStyle: "preserve-3d",
                }}
              >
                <svg viewBox="0 0 500 500" className="w-full h-full">
                  {/* Scoreboard suspension cables connected to inner oculus ring */}
                  <line x1="165" y1="210" x2="230" y2="242" stroke="#64748b" strokeWidth="1" opacity="0.7" />
                  <line x1="335" y1="210" x2="270" y2="242" stroke="#64748b" strokeWidth="1" opacity="0.7" />
                  <line x1="165" y1="290" x2="230" y2="258" stroke="#64748b" strokeWidth="1" opacity="0.7" />
                  <line x1="335" y1="290" x2="270" y2="258" stroke="#64748b" strokeWidth="1" opacity="0.7" />

                  {/* Scoreboard hexagon body */}
                  <polygon
                    points="230,242 270,242 282,250 270,258 230,258 218,250"
                    fill="#020617"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    opacity="0.95"
                    filter="drop-shadow(0 0 5px rgba(56,189,248,0.4))"
                  />
                  
                  {/* Jumbotron Digital text readout */}
                  <text x="250" y="249" fill="#38bdf8" fontSize="7" fontFamily="monospace" fontWeight="bold" textAnchor="middle" opacity="0.95">
                    {state.matchTimeLabel || "82' LIVE"}
                  </text>
                  <text x="250" y="256.5" fill="#10b981" fontSize="5.5" fontFamily="monospace" textAnchor="middle" opacity="0.9">
                    {state.scenario === "vip_arrival" ? "VIP INBOUND" : "DALLAS USA '26"}
                  </text>

                  {/* Scoreboard Blinking Live Recording Node */}
                  <circle cx="224" cy="248.5" r="1.2" fill="#f43f5e">
                    <animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite" />
                  </circle>
                </svg>
              </div>

              {/* Layer 8: 3D Perimeter Structural Steel Support Columns (Z = -30px to Z = 85px) */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
                const rad = (angle * Math.PI) / 180;
                const cx = 250 + 221 * Math.cos(rad);
                const cy = 250 + 181 * Math.sin(rad);

                const pctX = (cx / 500) * 100;
                const pctY = (cy / 500) * 100;

                return (
                  <div
                    key={angle}
                    className="absolute pointer-events-none"
                    style={{
                      left: `${pctX}%`,
                      top: `${pctY}%`,
                      width: "4px",
                      height: "115px", // Spans Z range of 115px
                      transformOrigin: "bottom center",
                      transform: `translate(-50%, -100%) rotateX(-90deg) translateZ(-30px)`,
                      background: "linear-gradient(to top, rgba(30,41,59,0.1), rgba(56,189,248,0.2), rgba(148,163,184,0.1))",
                      borderLeft: "1.2px solid rgba(56,189,248,0.18)",
                      borderRight: "1.2px solid rgba(56,189,248,0.18)",
                    }}
                  />
                );
              })}

              {/* Layer 9: Security Alarms, Fire/Pyro & Active Incident Beacons (Z = 125px floating) */}
              {state.incidents.map((inc) => {
                let x = 250;
                let y = 250;

                const sectionLower = inc.section.toLowerCase();
                if (sectionLower.includes("114") || sectionLower.includes("east")) {
                  x = 390;
                  y = 250;
                } else if (sectionLower.includes("north")) {
                  x = 250;
                  y = 100;
                } else if (sectionLower.includes("substation") || sectionLower.includes("west")) {
                  x = 110;
                  y = 250;
                } else if (sectionLower.includes("gate c") || sectionLower.includes("south")) {
                  x = 250;
                  y = 390;
                }

                const pctX = (x / 500) * 100;
                const pctY = (y / 500) * 100;

                return (
                  <React.Fragment key={inc.id}>
                    {/* 1. Ground level glowing incident footprint rings */}
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: `${pctX}%`,
                        top: `${pctY}%`,
                        width: "50px",
                        height: "50px",
                        marginLeft: "-25px",
                        marginTop: "-25px",
                        transform: "translateZ(15px)",
                        transformStyle: "preserve-3d",
                      }}
                    >
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <ellipse cx="50" cy="50" rx="40" ry="25" fill="none" stroke="#f43f5e" strokeWidth="2.5" filter="url(#glow)">
                          <animate attributeName="rx" values="15;42;15" dur="1.2s" repeatCount="indefinite" />
                          <animate attributeName="ry" values="9;28;9" dur="1.2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="1;0;1" dur="1.2s" repeatCount="indefinite" />
                        </ellipse>
                        <ellipse cx="50" cy="50" rx="15" ry="10" fill="#f43f5e" fillOpacity="0.35" stroke="#f43f5e" strokeWidth="1" />
                      </svg>
                    </div>

                    {/* 2. Vertically extending laser beacons standing perpendicular to stadium surface */}
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: `${pctX}%`,
                        top: `${pctY}%`,
                        width: "3px",
                        height: "115px",
                        transformOrigin: "bottom center",
                        transform: `translate(-50%, -100%) rotateX(-90deg) translateZ(10px)`,
                        background: "linear-gradient(to top, rgba(244, 63, 94, 0.1), rgba(244, 63, 94, 0.8), rgba(244, 63, 94, 0.1))",
                        boxShadow: "0 0 8px rgba(244, 63, 94, 0.9)",
                      }}
                    />

                    {/* 3. Floating physical warning hexagon indicator (floats above jumbotron level) */}
                    <div
                      className="absolute cursor-pointer flex items-center justify-center group"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSection(`Incident Alert: ${inc.title} reported in ${inc.section}`);
                      }}
                      style={{
                        left: `${pctX}%`,
                        top: `${pctY}%`,
                        width: "28px",
                        height: "28px",
                        marginLeft: "-14px",
                        marginTop: "-14px",
                        transform: "translateZ(125px)",
                        transformStyle: "preserve-3d",
                      }}
                    >
                      <div className="w-full h-full bg-slate-950 border-2 border-rose-500 text-rose-500 rounded-full flex items-center justify-center shadow-[0_0_18px_rgba(244,63,94,0.7)] hover:scale-125 transition-all duration-300 animate-bounce">
                        <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Environmental parameters HUD */}
          <div className="absolute top-10 left-2 flex flex-col gap-1.5 bg-slate-950/85 backdrop-blur-md p-2 rounded-lg border border-slate-800 text-[9px] text-slate-400 font-mono tracking-wider pointer-events-none">
            <div className="text-slate-200 font-bold border-b border-slate-800 pb-0.5">ENV SENSORS</div>
            <div className="flex justify-between gap-4">
              <span>TEMP:</span>
              <span className="text-slate-100 font-bold">{state.weather.temp}°C</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>HUMID:</span>
              <span className="text-slate-100">{state.weather.humidity}%</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>SKY:</span>
              <span className="text-sky-400 font-bold">{state.weather.condition.toUpperCase()}</span>
            </div>
          </div>

          {/* Compass HUD */}
          <div className="absolute bottom-2 left-2 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-lg border border-slate-800/80 text-[9px] font-mono text-slate-400 flex items-center gap-2 pointer-events-none">
            <div className="relative w-8 h-8 rounded-full border border-slate-800 flex items-center justify-center bg-slate-950">
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full transition-transform duration-200"
                style={{ transform: `rotate(${-rotateZ - 30}deg)` }}
              >
                <polygon points="50,15 58,50 50,42 42,50" fill="#f43f5e" />
                <polygon points="50,85 58,50 50,42 42,50" fill="#94a3b8" />
                <text x="50" y="12" fill="#f43f5e" fontSize="15" fontWeight="bold" textAnchor="middle">N</text>
                <text x="50" y="96" fill="#94a3b8" fontSize="13" fontWeight="bold" textAnchor="middle">S</text>
              </svg>
            </div>
            <div>
              <div className="text-slate-300 font-bold">COMPASS HUD</div>
              <div className="text-slate-500 text-[8px]">YAW: {Math.round(rotateZ)}°</div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAIL TELEMETRY INSPECTOR & DIAGNOSTIC PANEL */}
        <div className="xl:col-span-5 bg-slate-950/85 border border-slate-850 p-4 rounded-xl flex flex-col justify-between relative min-h-[360px] overflow-hidden shadow-inner">
          <div className="absolute top-0 right-0 p-2 pointer-events-none">
            <span className="text-[7px] font-mono text-slate-600 block">PANEL_REF: VIOS_INS_3.1</span>
          </div>
          {renderLocationInspector()}
        </div>
      </div>

      {/* Bottom Mini Metrics Strip */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 z-10 flex items-center justify-between font-mono text-xs mt-1">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-slate-500 text-[9px] uppercase">SPECTATORS IN VENUE</div>
            <div className="text-slate-100 font-bold text-xs tracking-wide">
              {state.spectatorsInStadium.toLocaleString()}{" "}
              <span className="text-[10px] text-slate-500 font-normal">
                ({Math.round((state.spectatorsInStadium / 85000) * 100)}% Cap)
              </span>
            </div>
          </div>
        </div>
        <div className="h-6 w-px bg-slate-800 mx-3" />
        <div>
          <div className="text-slate-500 text-[9px] text-right uppercase">METRO CONGESTION QUEUE</div>
          <div className="text-amber-400 font-bold text-xs text-right">
            {state.spectatorsOutsideGates.toLocaleString()} <span className="text-[9px] text-slate-500 font-normal normal-case">waiting</span>
          </div>
        </div>
      </div>
    </div>
  );
}
