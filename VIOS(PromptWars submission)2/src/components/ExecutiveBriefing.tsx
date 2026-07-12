import React, { useState, useEffect } from "react";
import { StadiumState } from "../types";
import { FileText, RefreshCw, Award, Download, Share2 } from "lucide-react";

interface ExecutiveBriefingProps {
  state: StadiumState;
}

export default function ExecutiveBriefing({ state }: ExecutiveBriefingProps) {
  const [briefing, setBriefing] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBriefing = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/simulation/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error("Failed to compile briefing");
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Briefing returned non-JSON response");
      }
      const data = await response.json();
      setBriefing(data.briefing);
    } catch (err) {
      console.error(err);
      setError("Briefing compiler offline. Reassembling core parameters...");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBriefing();
  }, [state.scenario]); // Re-fetch on scenario shifts!

  // Simple Markdown parsing for rendering raw text neatly
  const renderBriefingContent = (text: string) => {
    if (!text) return null;
    
    return text.split("\n").map((line, index) => {
      if (line.startsWith("###")) {
        return <h4 key={index} className="text-sm font-display font-bold text-slate-100 uppercase tracking-wide mt-4 mb-2 border-b border-orange-500/10 pb-1.5">{line.replace("###", "").trim()}</h4>;
      }
      if (line.startsWith("####")) {
        return <h5 key={index} className="text-xs font-display font-semibold text-orange-400 uppercase tracking-wide mt-3 mb-1.5">{line.replace("####", "").trim()}</h5>;
      }
      if (line.startsWith("**")) {
        return <p key={index} className="text-xs font-sans text-slate-300 font-bold mt-2 leading-relaxed">{line.replace(/\*\*/g, "")}</p>;
      }
      if (line.startsWith("*") || line.startsWith("-")) {
        return (
          <div key={index} className="flex items-start gap-2.5 my-1 ml-2 text-xs font-sans text-slate-300 leading-relaxed">
            <span className="text-orange-500 mt-1">•</span>
            <span>{line.replace(/^[\*\-\+]\s*/, "").replace(/\*\*/g, "")}</span>
          </div>
        );
      }
      return <p key={index} className="text-xs font-sans text-slate-300 my-1 leading-relaxed">{line.replace(/\*\*/g, "")}</p>;
    });
  };

  return (
    <div className="tactical-card p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col gap-6">
      <div className="flex items-center justify-between pb-2 border-b border-orange-500/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/15 border border-orange-500/20 text-orange-400 rounded-lg">
            <FileText className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-display font-bold text-slate-100 tracking-tight flex items-center gap-2 uppercase text-sm">
              EXECUTIVE BRIEFING CORE
            </h3>
            <p className="text-xs font-sans text-slate-400 mt-0.5">
              Automated high-level summarizing agent compiling operational intelligence for venue directors.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchBriefing}
            className="p-2.5 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-orange-500/20 rounded-lg transition-all cursor-pointer"
            title="Recompile report"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Briefing Document Paper */}
      <div className="relative bg-slate-950/80 border border-orange-500/10 p-6 rounded-2xl flex-1 flex flex-col justify-between overflow-hidden shadow-inner font-mono text-xs">
        {/* Decorative corner borders */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-orange-500/40" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-orange-500/40" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-orange-500/40" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-orange-500/40" />

        {/* Paper Watermark / Header */}
        <div className="flex items-center justify-between opacity-45 mb-4 border-b border-orange-500/10 pb-3 text-[10px]">
          <span className="flex items-center gap-1 font-sans text-orange-400"><Award className="w-3.5 h-3.5" /> FIFA VENUE OS v10.4</span>
          <span>REPORT DATE: {new Date().toLocaleDateString()}</span>
          <span className="font-sans text-orange-400/80 font-bold uppercase tracking-widest">CLASSIFIED</span>
        </div>

        {/* Content Area */}
        <div className="flex-1 my-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 font-mono text-xs text-slate-500">
              <RefreshCw className="w-6 h-6 text-orange-400 animate-spin" />
              <span className="animate-pulse">COMPILING EXECUTIVE STATE MATRICES...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-rose-400">
              {error}
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[440px] overflow-y-auto pr-1">
              {renderBriefingContent(briefing)}
            </div>
          )}
        </div>

        {/* Report Footer Actions */}
        <div className="border-t border-orange-500/10 pt-4 mt-4 flex items-center justify-between text-[10px] text-slate-500">
          <div>
            GEN: AUTOMATIC INTEL // METRIC ID: {state.timePassed}M_OFF
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1 hover:text-slate-300 transition-colors cursor-pointer">
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
            <button className="flex items-center gap-1 hover:text-slate-300 transition-colors cursor-pointer">
              <Share2 className="w-3.5 h-3.5" /> DIRECT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
