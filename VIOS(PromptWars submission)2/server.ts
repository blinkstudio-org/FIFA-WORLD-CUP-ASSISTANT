import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// Initialize Gemini API securely on the server side
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
} else {
  console.warn("WARNING: GEMINI_API_KEY environment variable is missing. AI features will fallback to deterministic simulated outputs.");
}

// In-memory cache to preserve Gemini API quota on free tier (limit 20 requests/day)
const predictionCache = new Map<string, any>();
const briefingCache = new Map<string, string>();
const chatCache = new Map<string, string>();

// Simple circuit-breaker state to avoid spamming the Gemini API once we know we've exhausted our free tier quota
let isQuotaExhausted = false;
let quotaExhaustResetTime = 0;

function checkQuotaStatus(): boolean {
  if (isQuotaExhausted) {
    if (Date.now() > quotaExhaustResetTime) {
      isQuotaExhausted = false;
      return true; // Try again after cooldown
    }
    return false; // Still in cooldown
  }
  return true;
}

function flagQuotaExhausted() {
  if (!isQuotaExhausted) {
    console.warn("[Gemini API] Free-tier quota limit reached (429/RESOURCE_EXHAUSTED). Entering 5-minute cooldown; using simulated backups to ensure seamless UI operation.");
    isQuotaExhausted = true;
    // Hold off on making external Gemini calls for 5 minutes (300,000 ms) to let quota reset
    quotaExhaustResetTime = Date.now() + 300000;
  }
}

// Utility to retry Gemini API operations with exponential backoff on transient errors (503, etc.)
async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorStatus = error.status || error.statusCode || (error.error && error.error.code);
    const errorMessage = (error.message || "").toUpperCase();
    
    const isQuotaExceeded =
      errorStatus === 429 ||
      errorMessage.includes("429") ||
      errorMessage.includes("RESOURCE_EXHAUSTED") ||
      errorMessage.includes("QUOTA") ||
      errorMessage.includes("RATE_LIMIT");

    if (isQuotaExceeded) {
      throw error; // Immediately throw, do not retry a quota exhaustion error
    }

    const isRetryable =
      errorStatus === 503 ||
      errorMessage.includes("503") ||
      errorMessage.includes("UNAVAILABLE") ||
      errorMessage.includes("TEMPORARY") ||
      errorMessage.includes("HIGH DEMAND");

    if (retries > 0 && isRetryable) {
      console.warn(`Gemini API returned retryable error. Retrying in ${delay}ms... (Retries left: ${retries}). Error:`, error.message || error);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

// Multi-model fallback logic to guarantee service when a model hits free-tier quota limits
async function generateWithFallback(
  params: {
    contents: any;
    config?: any;
  },
  modelsToTry: string[] = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"]
): Promise<any> {
  let lastError: any = null;

  for (const model of modelsToTry) {
    if (!aiClient) {
      throw new Error("Gemini API client is not initialized.");
    }

    try {
      console.info(`[Gemini API] Attempting generation with model: ${model}`);
      
      const response = await retryWithBackoff(() => aiClient!.models.generateContent({
        ...params,
        model,
      }));

      // If successful, return the response
      console.info(`[Gemini API] Successful generation with model: ${model}`);
      return response;
    } catch (err: any) {
      lastError = err;
      const errorMessage = (err.message || "").toUpperCase();
      const errStatus = err.status || err.statusCode || (err.error && err.error.code);

      const isQuotaExceeded =
        errStatus === 429 ||
        errorMessage.includes("429") ||
        errorMessage.includes("RESOURCE_EXHAUSTED") ||
        errorMessage.includes("QUOTA") ||
        errorMessage.includes("RATE_LIMIT");

      if (isQuotaExceeded) {
        console.warn(`[Gemini API] Model ${model} is rate-limited / quota exhausted. Trying next fallback model...`);
        continue;
      }

      console.warn(`[Gemini API] Model ${model} failed with error. Trying next fallback model... Error:`, err.message || err);
    }
  }

  // If we reach here, all models failed. Flag quota as exhausted if the last error was quota-related.
  if (lastError) {
    const errorMessage = (lastError.message || "").toUpperCase();
    const errStatus = lastError.status || lastError.statusCode || (lastError.error && lastError.error.code);
    const isQuotaExceeded =
      errStatus === 429 ||
      errorMessage.includes("429") ||
      errorMessage.includes("RESOURCE_EXHAUSTED") ||
      errorMessage.includes("QUOTA") ||
      errorMessage.includes("RATE_LIMIT");

    if (isQuotaExceeded) {
      flagQuotaExhausted();
    }
  }
  throw lastError || new Error("All fallback models failed.");
}

const app = express();
app.use(express.json());

const PORT = 3000;

// Types for Simulation State
interface GateState {
  id: string;
  name: string;
  occupancy: number; // percentage (0-100)
  queueTime: number; // minutes
  status: "open" | "closed" | "congested";
  volunteerCount: number;
}

interface ConcessionState {
  id: string;
  name: string;
  category: "food" | "merchandise" | "beverage";
  queueTime: number;
  sales: number; // USD
  stockLevel: number; // percentage
}

interface TransportState {
  metroWaitTime: number; // minutes
  metroCongestion: number; // percentage
  busWaitTime: number; // minutes
  rideShareWaitTime: number; // minutes
  parkingOccupancy: number; // percentage
  activeMetros: number;
  activeBuses: number;
}

interface SustainabilityState {
  electricityKw: number;
  waterLiters: number;
  foodWasteKg: number;
  trashKg: number;
  solarGenerationKw: number;
}

interface SecurityIncident {
  id: string;
  title: string;
  section: string;
  priority: "info" | "warning" | "critical" | "emergency";
  status: "active" | "resolved" | "monitoring";
  timestamp: string;
  description: string;
  assignedStaff: number;
}

interface AccessibilityRequest {
  id: string;
  type: "wheelchair" | "elderly" | "blind" | "deaf" | "language";
  location: string;
  status: "pending" | "dispatched" | "completed";
  description: string;
  assignedVolunteerId?: string;
}

interface StadiumState {
  timePassed: number; // minutes of the match day (-120 to +180)
  matchTimeLabel: string; // e.g. "Pre-match: T-45m", "First Half: 23'", "Half-time", etc.
  spectatorsInStadium: number;
  spectatorsOutsideGates: number;
  weather: {
    temp: number; // C
    condition: "Sunny" | "Cloudy" | "Raining" | "Heavy Rain" | "Clear Night";
    humidity: number; // percentage
  };
  scenario: string; // "normal", "heavy_rain", "medical_emergency", etc.
  gates: GateState[];
  concessions: ConcessionState[];
  transport: TransportState;
  sustainability: SustainabilityState;
  incidents: SecurityIncident[];
  accessibilityRequests: AccessibilityRequest[];
  volunteersTotal: number;
  volunteersActive: number;
}

// Global state variables
let currentScenario = "normal";
let matchTimeMinutes = -45; // Start at 45 minutes before kickoff (T-45m)
const MAX_SPECTATORS = 85000;

// Generate baseline state
function getBaseState(timeOffset: number, scenario: string): StadiumState {
  // Interpolate metrics based on T-minus offset
  // T-45m: massive crowd outside gates, filling stadium
  let spectatorsIn = 45000;
  let spectatorsOut = 32000;

  if (timeOffset >= 0 && timeOffset < 45) {
    // First half
    spectatorsIn = 81500;
    spectatorsOut = 2000;
  } else if (timeOffset >= 45 && timeOffset <= 60) {
    // Half time
    spectatorsIn = 83000;
    spectatorsOut = 200;
  } else if (timeOffset > 60 && timeOffset <= 105) {
    // Second half
    spectatorsIn = 83800;
    spectatorsOut = 100;
  } else if (timeOffset > 105) {
    // Post match
    spectatorsIn = 30000;
    spectatorsOut = 50000; // Leaving
  }

  // Set scenario-specific weather and details
  let temp = 22;
  let condition: "Sunny" | "Cloudy" | "Raining" | "Heavy Rain" | "Clear Night" = "Clear Night";
  if (scenario === "heavy_rain") {
    condition = "Heavy Rain";
    temp = 15;
  } else if (scenario === "normal") {
    condition = "Clear Night";
    temp = 20;
  }

  // Gates configuration
  const gates: GateState[] = [
    { id: "A", name: "Gate A (Metro North)", occupancy: 85, queueTime: 25, status: "open", volunteerCount: 30 },
    { id: "B", name: "Gate B (West Concourse)", occupancy: 40, queueTime: 10, status: "open", volunteerCount: 15 },
    { id: "C", name: "Gate C (Metro South)", occupancy: 92, queueTime: 35, status: "congested", volunteerCount: 35 },
    { id: "D", name: "Gate D (East Concourse)", occupancy: 65, queueTime: 18, status: "open", volunteerCount: 20 },
    { id: "E", name: "Gate E (VIP & Media)", occupancy: 30, queueTime: 5, status: "open", volunteerCount: 12 },
    { id: "F", name: "Gate F (Staff & Volunteers)", occupancy: 20, queueTime: 2, status: "open", volunteerCount: 10 },
  ];

  // Adjust gates based on scenarios
  if (scenario === "unexpected_surge") {
    gates[0].occupancy = 98;
    gates[0].queueTime = 48;
    gates[0].status = "congested";
    gates[2].occupancy = 99;
    gates[2].queueTime = 55;
    gates[2].status = "congested";
  } else if (scenario === "equipment_failure") {
    gates[2].status = "closed";
    gates[2].occupancy = 0;
    gates[2].queueTime = 0;
    // Gate A overflows
    gates[0].occupancy = 99;
    gates[0].queueTime = 52;
    gates[0].status = "congested";
  }

  // Concessions
  const concessions: ConcessionState[] = [
    { id: "food_east", name: "Food Zone East", category: "food", queueTime: 12, sales: 45000, stockLevel: 72 },
    { id: "food_west", name: "Food Zone West", category: "food", queueTime: 18, sales: 52000, stockLevel: 65 },
    { id: "fifa_store", name: "Official FIFA Fan Shop", category: "merchandise", queueTime: 25, sales: 185000, stockLevel: 45 },
    { id: "beverage_north", name: "Beverage Hub North", category: "beverage", queueTime: 5, sales: 30000, stockLevel: 80 },
    { id: "beverage_south", name: "Beverage Hub South", category: "beverage", queueTime: 8, sales: 35000, stockLevel: 78 },
  ];

  if (scenario === "high_food_demand") {
    concessions[0].queueTime = 30;
    concessions[1].queueTime = 35;
    concessions[2].queueTime = 45;
    concessions[0].stockLevel = 25;
    concessions[1].stockLevel = 18;
  }

  // Transport
  const transport: TransportState = {
    metroWaitTime: 4,
    metroCongestion: 75,
    busWaitTime: 8,
    rideShareWaitTime: 12,
    parkingOccupancy: 88,
    activeMetros: 12,
    activeBuses: 24,
  };

  if (scenario === "metro_delay") {
    transport.metroWaitTime = 22;
    transport.metroCongestion = 98;
    transport.activeMetros = 4;
    transport.rideShareWaitTime = 35;
  }

  // Sustainability
  const sustainability: SustainabilityState = {
    electricityKw: 1240,
    waterLiters: 18500,
    foodWasteKg: 42,
    trashKg: 310,
    solarGenerationKw: 340,
  };

  if (scenario === "power_outage") {
    sustainability.electricityKw = 450; // Auxiliary power only
    sustainability.solarGenerationKw = 0;
  }

  // Incidents
  const incidents: SecurityIncident[] = [];
  if (scenario === "medical_emergency") {
    incidents.push({
      id: "inc_001",
      title: "Medical Emergency: Heat Exhaustion",
      section: "Section 114, Row K",
      priority: "critical",
      status: "active",
      timestamp: "10:42 PM",
      description: "Spectator collapsed. First responders dispatched with stretcher.",
      assignedStaff: 4,
    });
  } else if (scenario === "security_threat") {
    incidents.push({
      id: "inc_002",
      title: "Uncontrolled Flare Ignition",
      section: "North Supporters Zone",
      priority: "emergency",
      status: "active",
      timestamp: "10:44 PM",
      description: "Active flares ignited in Section 204. Fire wardens and security squad moving in.",
      assignedStaff: 12,
    });
  } else if (scenario === "power_outage") {
    incidents.push({
      id: "inc_003",
      title: "Power Fault - Grid A",
      section: "Substation Block East",
      priority: "emergency",
      status: "active",
      timestamp: "10:40 PM",
      description: "Major power drop. Stadium switched to auxiliary UPS and diesel backup. Checking grid line.",
      assignedStaff: 8,
    });
  }

  // Accessibility Requests
  const accessibilityRequests: AccessibilityRequest[] = [
    { id: "acc_001", type: "wheelchair", location: "Gate A Escalators", status: "pending", description: "Spectator needs assistance boarding the stadium accessibility lift." },
    { id: "acc_002", type: "language", location: "Concourse Section 105", status: "dispatched", description: "Non-English speaker needs translation assistance for medical inquiry.", assignedVolunteerId: "vol_12" },
    { id: "acc_003", type: "elderly", location: "Gate C Plaza", status: "completed", description: "Assisted elderly couple to their seats in Section 102." },
  ];

  // Match Label
  let matchTimeLabel = `Pre-match: T${timeOffset}m`;
  if (timeOffset >= 0 && timeOffset < 45) {
    matchTimeLabel = `First Half: ${timeOffset}'`;
  } else if (timeOffset >= 45 && timeOffset <= 60) {
    matchTimeLabel = `Half-time: 15' break`;
  } else if (timeOffset > 60 && timeOffset <= 105) {
    matchTimeLabel = `Second Half: ${timeOffset - 15}'`;
  } else if (timeOffset > 105) {
    matchTimeLabel = `Post-match: FT +${timeOffset - 105}'`;
  }

  return {
    timePassed: timeOffset,
    matchTimeLabel,
    spectatorsInStadium: spectatorsIn,
    spectatorsOutsideGates: spectatorsOut,
    weather: { temp, condition, humidity: 75 },
    scenario,
    gates,
    concessions,
    transport,
    sustainability,
    incidents,
    accessibilityRequests,
    volunteersTotal: 250,
    volunteersActive: 185,
  };
}

// Generate a full 60-minute playback history (array of states from T-105m to current state)
const stateHistory: StadiumState[] = [];
for (let m = -105; m <= -45; m += 5) {
  stateHistory.push(getBaseState(m, "normal"));
}

let activeState = getBaseState(matchTimeMinutes, currentScenario);

// Helper to get state history
function updateActiveStateAndHistory(newScenario: string) {
  currentScenario = newScenario;
  activeState = getBaseState(matchTimeMinutes, currentScenario);
  
  // Replace the latest state in history
  const index = stateHistory.findIndex(s => s.timePassed === matchTimeMinutes);
  if (index !== -1) {
    stateHistory[index] = activeState;
  } else {
    stateHistory.push(activeState);
    if (stateHistory.length > 60) {
      stateHistory.shift();
    }
  }
}

// REST API Endpoints

// 1. Get current simulation state
app.get("/api/simulation/state", (req, res) => {
  res.json({
    activeState,
    history: stateHistory,
  });
});

// 2. Change active scenario
app.post("/api/simulation/scenario", (req, res) => {
  const { scenario } = req.body;
  if (scenario) {
    updateActiveStateAndHistory(scenario);
    predictionCache.clear();
    briefingCache.clear();
    chatCache.clear();
    res.json({ success: true, activeState });
  } else {
    res.status(400).json({ error: "Missing scenario name" });
  }
});

// 3. Update staff/gate configuration dynamically (User action)
app.post("/api/simulation/update", (req, res) => {
  const { gates, volunteersActive, incidents, accessibilityRequests } = req.body;
  if (gates) activeState.gates = gates;
  if (volunteersActive !== undefined) activeState.volunteersActive = volunteersActive;
  if (incidents) activeState.incidents = incidents;
  if (accessibilityRequests) activeState.accessibilityRequests = accessibilityRequests;

  // Sync to history
  const idx = stateHistory.findIndex(s => s.timePassed === activeState.timePassed);
  if (idx !== -1) {
    stateHistory[idx] = { ...activeState };
  }

  predictionCache.clear();
  briefingCache.clear();
  chatCache.clear();
  res.json({ success: true, activeState });
});

// 4. Tick simulation time forward manually
app.post("/api/simulation/tick", (req, res) => {
  matchTimeMinutes += 5;
  if (matchTimeMinutes > 180) {
    matchTimeMinutes = -105; // Wrap around to match start T-minus
  }
  activeState = getBaseState(matchTimeMinutes, currentScenario);
  stateHistory.push({ ...activeState });
  if (stateHistory.length > 60) {
    stateHistory.shift();
  }
  predictionCache.clear();
  briefingCache.clear();
  chatCache.clear();
  res.json({ success: true, activeState });
});

// 5. AI predictions based on state (Observation, Reasoning, Prediction, Actions, Confidence)
app.post("/api/simulation/prediction", async (req, res) => {
  try {
    const { agentType } = req.body || {};
    if (!agentType) {
      return res.status(400).json({ error: "Missing agentType" });
    }
    
    const cacheKey = `${agentType}_${activeState.scenario}`;
    if (predictionCache.has(cacheKey)) {
      return res.json(predictionCache.get(cacheKey));
    }

    const stateSummary = `
      Stadium State Summary:
      - Match Phase: ${activeState.matchTimeLabel || "N/A"}
      - Active Scenario: ${activeState.scenario || "N/A"}
      - Weather: ${activeState.weather?.temp ?? 20}°C, ${activeState.weather?.condition ?? "Clear"}
      - Spectators Inside: ${activeState.spectatorsInStadium ?? 0}
      - Spectators Outside Gates: ${activeState.spectatorsOutsideGates ?? 0}
      - Gates Status: ${activeState.gates?.map(g => `${g.name}: ${g.status} (Occupancy: ${g.occupancy}%, Queue: ${g.queueTime}m, Volunteers: ${g.volunteerCount})`).join("; ") || "None"}
      - Transport Status: Metro wait time ${activeState.transport?.metroWaitTime ?? 0}m, Bus wait time ${activeState.transport?.busWaitTime ?? 0}m, Parking occupancy ${activeState.transport?.parkingOccupancy ?? 0}%
      - Active Incidents: ${activeState.incidents?.map(i => `${i.title} in ${i.section} - Priority: ${i.priority}`).join("; ") || "None"}
      - Pending Accessibility Requests: ${activeState.accessibilityRequests?.filter(r => r.status === "pending").length ?? 0}
    `;

    let agentPrompt = "";
    let systemContext = "";

    switch (agentType) {
      case "crowd":
        systemContext = "You are the VIOS Crowd Intelligence Agent. You predict movement patterns, solve congestion issues, and recommend routing.";
        agentPrompt = `Analyze the current crowd density and gate queues. Write a contextual prediction and recommendation plan. Include:
        - Observation: Current bottlenecks
        - Reasoning: Why they are happening
        - Prediction: What will happen in 10-20 minutes
        - Recommended actions: Clear instruction for staff redirection
        - Expected impact: Result of actions
        - Confidence score (number 0-100)`;
        break;
      case "safety":
        systemContext = "You are the VIOS Safety & Security Agent. You monitor risks, incidents, emergency response, and evacuation planning.";
        agentPrompt = `Analyze current incidents or potential safety risks. Provide a detailed risk response. Include:
        - Observation: Safety issues or potential hazards
        - Reasoning: Underlying causes
        - Prediction: Risk escalation trajectory if unchecked
        - Recommended actions: Immediate security dispatch or response
        - Expected impact: Safety outcome
        - Confidence score (number 0-100)`;
        break;
      case "transport":
        systemContext = "You are the VIOS Transportation Agent. You coordinate metro, bus, ride-sharing, walking, and parking congestion.";
        agentPrompt = `Analyze transport delays, metro wait times, and gate queues. Create a transportation adjustment plan. Include:
        - Observation: Transport bottleneck status
        - Reasoning: Why delays are occurring
        - Prediction: Impact on fan exit or entry in 30 minutes
        - Recommended actions: Train frequencies, bus redirection, or signboard updates
        - Expected impact: Reduced wait times
        - Confidence score (number 0-100)`;
        break;
      case "sustainability":
        systemContext = "You are the VIOS Sustainability Agent. You reduce electricity, food waste, water, and trash footprints.";
        agentPrompt = `Analyze stadium power, food concessions queue times, and stock levels. Make optimization recommendations. Include:
        - Observation: Consumption metrics
        - Reasoning: Source of peaks or waste
        - Prediction: Consumables depletion or energy load over next hour
        - Recommended actions: Energy load-shedding, stock transfer, or waste collection routes
        - Expected impact: Carbon or water footprint reduction
        - Confidence score (number 0-100)`;
        break;
      case "accessibility":
        systemContext = "You are the VIOS Accessibility & Support Agent. You assist wheelchair, elderly, blind, deaf, and international fans.";
        agentPrompt = `Analyze the active accessibility requests and volunteer dispatch status. Recommend optimization. Include:
        - Observation: Outstanding accessibility requests
        - Reasoning: Volunteer bottleneck or physical constraints
        - Prediction: Fan satisfaction or delay issues
        - Recommended actions: Specific volunteer assignments and accessibility routing
        - Expected impact: Rapid assistance
        - Confidence score (number 0-100)`;
        break;
      case "fan":
        systemContext = "You are the VIOS Fan Experience Agent. You customize queue avoidance, food concessions timing, and personalized navigation.";
        agentPrompt = `Analyze food queues and official store wait times. Generate premium fan tips. Include:
        - Observation: High queue concessions or shops
        - Reasoning: Peak demand time
        - Prediction: Queue wait times in 15 minutes
        - Recommended actions: Mobile push alerts, alternative concession redirections
        - Expected impact: Reduced waiting times, elevated fan scores
        - Confidence score (number 0-100)`;
        break;
      default:
        systemContext = "You are the VIOS General Intelligence Agent.";
        agentPrompt = `Synthesize current stadium state and write an overarching operational forecast.`;
    }

    if (aiClient && checkQuotaStatus()) {
      try {
        const response = await generateWithFallback({
          contents: `${stateSummary}\n\n${agentPrompt}`,
          config: {
            systemInstruction: systemContext,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                observation: { type: Type.STRING, description: "Detailed summary of what is happening." },
                reasoning: { type: Type.STRING, description: "Why it is happening." },
                prediction: { type: Type.STRING, description: "What is going to happen next." },
                recommendedActions: { type: Type.STRING, description: "Actionable bullets or text for what to do now." },
                expectedImpact: { type: Type.STRING, description: "Operational and fan experience outcome." },
                confidenceScore: { type: Type.INTEGER, description: "Confidence percentage (e.g., 94)." },
              },
              required: ["observation", "reasoning", "prediction", "recommendedActions", "expectedImpact", "confidenceScore"],
            },
          },
        });
   
        let jsonText = (response.text || "").trim();
        if (jsonText.startsWith("```")) {
          jsonText = jsonText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
        }
        
        let data;
        try {
          data = JSON.parse(jsonText || "{}");
        } catch (parseErr) {
          console.warn("[Gemini API] Failed to parse response JSON. Text was:", jsonText);
          throw parseErr;
        }

        const requiredFields = ["observation", "reasoning", "prediction", "recommendedActions", "expectedImpact", "confidenceScore"];
        const hasAllFields = requiredFields.every(field => field in data);
        if (!hasAllFields) {
          console.warn("[Gemini API] Response was missing some required JSON fields. Using fallback merge.");
          const fallbackData = getDeterministicAgentOutput(agentType);
          data = { ...fallbackData, ...data };
        }

        predictionCache.set(cacheKey, data);
        return res.json(data);
      } catch (err: any) {
        console.warn(`[Gemini API] Prediction query failed for agent ${agentType}. Detailed error:`, err.message || err);
        console.warn(`[Gemini API] Falling back to simulated output for ${agentType}.`);
        return res.json(getDeterministicAgentOutput(agentType));
      }
    } else {
      return res.json(getDeterministicAgentOutput(agentType));
    }
  } catch (err: any) {
    console.error("Unhandleable prediction error:", err);
    return res.json(getDeterministicAgentOutput(req.body?.agentType || "crowd"));
  }
});

// 6. Executive Report (Summary of all stats every 5 minutes in elegant executive language)
app.post("/api/simulation/briefing", async (req, res) => {
  try {
    const cacheKey = activeState.scenario;
    if (briefingCache.has(cacheKey)) {
      return res.json({ briefing: briefingCache.get(cacheKey) });
    }

    const getGateWait = (id: string) => {
      const g = activeState.gates?.find(gate => gate.id === id);
      return g ? `${g.queueTime}m` : "N/A";
    };

    const stateSummary = `
      Stadium Status:
      - Phase: ${activeState.matchTimeLabel || "N/A"}
      - Scenario: ${activeState.scenario || "N/A"}
      - Total Spectators: ${activeState.spectatorsInStadium ?? 0} inside, ${activeState.spectatorsOutsideGates ?? 0} outside
      - Weather: ${activeState.weather?.temp ?? 20}°C, ${activeState.weather?.condition ?? "Clear"}
      - Gate Wait times: A (${getGateWait("A")}), B (${getGateWait("B")}), C (${getGateWait("C")}), D (${getGateWait("D")})
      - Transport Wait times: Metro (${activeState.transport?.metroWaitTime ?? 0}m), Bus (${activeState.transport?.busWaitTime ?? 0}m), Rideshare (${activeState.transport?.rideShareWaitTime ?? 0}m)
      - Incidents: ${activeState.incidents?.length ?? 0} active
      - Active volunteers: ${activeState.volunteersActive ?? 0}/${activeState.volunteersTotal ?? 0}
    `;

    if (aiClient && checkQuotaStatus()) {
      try {
        const response = await generateWithFallback({
          contents: `Generate an Executive Briefing suitable for a Stadium Director. Make it sound formal, authoritative, and strategic. Include:
          - Operational Health Assessment (Green/Yellow/Red status of different sectors)
          - Major Active Risks (if any)
          - Strategic Resource allocation actions
          - 30-minute Outlook.\n\nState Data:\n${stateSummary}`,
          config: {
            systemInstruction: "You are the VIOS Executive Briefing Agent, an AI that summarizes high-stakes stadium operations for FIFA Directors.",
          },
        });
        const briefingText = response.text || getFallbackBriefing();
        briefingCache.set(cacheKey, briefingText);
        return res.json({ briefing: briefingText });
      } catch (err: any) {
        console.warn("[Gemini API] Briefing query failed. Detailed error:", err.message || err);
        console.warn("[Gemini API] Falling back to simulated briefing.");
        return res.json({ briefing: getFallbackBriefing() });
      }
    } else {
      return res.json({ briefing: getFallbackBriefing() });
    }
  } catch (err: any) {
    console.error("Unhandleable briefing error:", err);
    return res.json({ briefing: getFallbackBriefing() });
  }
});

// 7. Dynamic Chat Command Center (Ask any natural language question)
app.post("/api/simulation/chat", async (req, res) => {
  try {
    const { question } = req.body || {};
    const normalizedQuestion = (question || "").trim().toLowerCase();
    
    const cacheKey = `${normalizedQuestion}_${activeState.scenario}`;
    if (chatCache.has(cacheKey)) {
      return res.json({ answer: chatCache.get(cacheKey) });
    }

    const stateSummary = `
      Current active stadium environment:
      - Match Label: ${activeState.matchTimeLabel || "N/A"}
      - Scenario: ${activeState.scenario || "N/A"}
      - Spectators: ${activeState.spectatorsInStadium ?? 0} inside / ${activeState.spectatorsOutsideGates ?? 0} queueing
      - Weather: ${activeState.weather?.temp ?? 20}°C, ${activeState.weather?.condition ?? "Clear"}
      - Gates: ${activeState.gates?.map(g => `${g.name} status is ${g.status} with queue time of ${g.queueTime} mins and ${g.volunteerCount} volunteers`).join("; ") || "None"}
      - Concessions: ${activeState.concessions?.map(c => `${c.name}: Wait time is ${c.queueTime}m, Stock level ${c.stockLevel}%`).join("; ") || "None"}
      - Transportation: Metro wait ${activeState.transport?.metroWaitTime ?? 0}m, bus wait ${activeState.transport?.busWaitTime ?? 0}m, rideshare wait ${activeState.transport?.rideShareWaitTime ?? 0}m
      - Sustainability: Grid draw ${activeState.sustainability?.electricityKw ?? 0}kW, Water ${activeState.sustainability?.waterLiters ?? 0}L, Trash ${activeState.sustainability?.trashKg ?? 0}kg
      - Active security incidents: ${activeState.incidents?.map(i => `[${i.priority}] ${i.title} in ${i.section} (${i.description})`).join("; ") || "None"}
      - Accessibility: ${activeState.accessibilityRequests?.map(r => `${r.type} request at ${r.location} (Status: ${r.status})`).join("; ") || "None"}
    `;

    if (aiClient && checkQuotaStatus()) {
      try {
        const response = await generateWithFallback({
          contents: `The operator asks: "${question}". Answer clearly, directly, and naturally. Ground your answer completely in the real-time stadium metrics. Offer practical, operational, AI-driven suggestions based on the metrics. Keep answers concise, highly executive, and tactical.`,
          config: {
            systemInstruction: "You are the VIOS Operational Chatbot, the core AI brain of the FIFA Venue Intelligence OS (VIOS).",
          },
        });
        const answerText = response.text || getSimulatedChatReply(question).answer;
        chatCache.set(cacheKey, answerText);
        return res.json({ answer: answerText });
      } catch (err: any) {
        console.warn("[Gemini API] Chat query failed. Detailed error:", err.message || err);
        console.warn("[Gemini API] Falling back to simulated answer.");
        return res.json(getSimulatedChatReply(question));
      }
    } else {
      return res.json(getSimulatedChatReply(question));
    }
  } catch (err: any) {
    console.error("Unhandleable chat error:", err);
    return res.json(getSimulatedChatReply(req.body?.question || ""));
  }
});

// Fallback response helper
function getFallbackBriefing(): string {
  return `### **VIOS EXECUTIVE BRIEFING — CONFIDENTIAL**
**MATCH DAY OPERATIONAL REPORT**
**Match Status:** ${activeState.matchTimeLabel}
**Scenario Status:** ${currentScenario.toUpperCase()}

#### **1. Overall Operational Health: YELLOW**
*   **Gate Concourse Integrity:** Stable at Western Gates, but experiencing critical bottlenecks at **Gate C (Metro South)** with queue times rising to ${activeState.gates[2].queueTime} minutes. 
*   **Transit Pipeline:** Active Metro congestion is high. Auxiliary Bus assets have been routed to alleviate pedestrian build-up.
*   **Stadium Fill Rate:** Inside spectator volume stands at ${activeState.spectatorsInStadium} fans (${Math.round((activeState.spectatorsInStadium / MAX_SPECTATORS) * 100)}% capacity).

#### **2. Active Strategic Incidents**
${activeState.incidents.map(i => `*   **[${i.priority.toUpperCase()}]** ${i.title} in *${i.section}*: ${i.description}. Security resources assigned: ${i.assignedStaff} members.`).join("\n") || "*   **NO ACTIVE CRITICAL ALERTS:** Stadium perimeter holds a secure baseline."}

#### **3. Recommended Directives**
*   **Deploy Support Volleys:** Immediately reallocate 15 volunteers from Gate B (low utilization) to Gate C to accelerate barcode scan rate.
*   **Digital Signage Dispatch:** Instruct transportation systems to flash digital signs redirecting incoming pedestrians from Metro South toward Gate D.
*   **Sustainability Load-Shedding:** High HVAC load detected on Concourse Level 3. Recommending micro-cooling adjustments of +1.5°C in unoccupied suites to conserve energy.`;
}

// Fallback deterministic predictions
function getDeterministicAgentOutput(type: string) {
  const defaults: Record<string, any> = {
    crowd: {
      observation: "Critical backup at Gate C (Metro South Concourse) with occupancy exceeding 90%.",
      reasoning: "Metro trains are arriving at 4-minute intervals, discharging approx. 1,500 fans each directly into the South Plaza. Simultaneously, scan lanes are working with under-staffed teams.",
      prediction: "Gate C wait times are expected to climb to 48 minutes within the next 10 minutes, causing a safety risk at ticket turnstiles.",
      recommendedActions: "1. Open 4 backup overflow gates on South-East perimeter. 2. Reditribute 15 volunteers from under-utilized Gate B. 3. Update stadium exterior displays to show Gate B queues are clear (10m wait).",
      expectedImpact: "Wait times at Gate C will decrease from 35m to under 15m. Pedestrian density will stabilize within 8 minutes.",
      confidenceScore: 94,
    },
    safety: {
      observation: activeState.incidents.length > 0 ? `Active incident: ${activeState.incidents[0].title}` : "All perimeter sensor metrics within normal operating bounds.",
      reasoning: activeState.incidents.length > 0 ? "Incident trigger matches high crowd density or active environmental stressors." : "Staggered gate entries and solid security deployments have maintained crowd spacing.",
      prediction: "Low to moderate security risks expected in next 30 minutes, unless egress begins with active crowd excitement.",
      recommendedActions: "Coordinate patrol sweeps around active areas. Keep medical emergency bays clear of transit gridlock.",
      expectedImpact: "Pre-emptive response times kept under 90 seconds. Crowd confidence matches FIFA security criteria.",
      confidenceScore: 89,
    },
    transport: {
      observation: `Metro line experiences queue times around ${activeState.transport.metroWaitTime} minutes.`,
      reasoning: "High frequency arrival trains discharging high passenger volumes colliding with localized queue bottle-necks at security gates.",
      prediction: "Incoming transit gridlock will fully dissipate within 20 minutes after match kickoff as crowd shifts inside.",
      recommendedActions: "Deploy express shuttle buses to Gate B. Advise Metro dispatch to space out arrival times by 1 minute to prevent queue piling.",
      expectedImpact: "Average wait times dropped by 12 minutes. Smooth flow rate inside stadium.",
      confidenceScore: 92,
    },
    sustainability: {
      observation: `Total electrical consumption is peak at ${activeState.sustainability.electricityKw}kW. Food waste rate is rising.`,
      reasoning: "Stadium illumination, high-demand kitchen ovens, and air conditioning are drawing maximum auxiliary grid power.",
      prediction: "Concession stock limits will reach exhaustion in East Food Zone within 20 minutes unless transfers are approved.",
      recommendedActions: "Initiate local food redistribution from backup stores. Optimize HVAC parameters in vacant VIP lounges (+2°C saving 12% power load).",
      expectedImpact: "Power peak reduced by 115kW. Concession stocks leveled. Minimal carbon waste.",
      confidenceScore: 95,
    },
    accessibility: {
      observation: "Accessibility requests show high wheelchair-assisted calls.",
      reasoning: "High density arrival paths make navigating standard pathways difficult for mobility-challenged fans.",
      prediction: "Delays in assistance will spike unless volunteer escorts are immediately assigned.",
      recommendedActions: "Deploy wheelchair-trained escorts to Gate A escalators immediately. Dedicate Volunteer #42 to guide Spanish medical translation call.",
      expectedImpact: "Accessibility response rate down to 3 minutes. Total fan inclusion guaranteed.",
      confidenceScore: 91,
    },
    fan: {
      observation: "Long waits (25 minutes) at Official FIFA Fan Shop causing fan distraction.",
      reasoning: "Everyone attempts to buy souvenirs before entering the seats during pre-match peak.",
      prediction: "Official FIFA Shop queue will bottleneck, causing fans to miss kickoff.",
      recommendedActions: "Push mobile notification: 'Skip pre-match queues. FIFA Store stands inside Section 120 are fully clear. Buy at half-time with 1-click mobile pickup.'",
      expectedImpact: "Queue wait dropped by 50% as sales shift online and inside. Maximized fan satisfaction.",
      confidenceScore: 93,
    },
  };
  return defaults[type] || defaults.crowd;
}

// Fallback natural language chat
function getSimulatedChatReply(q: string): { answer: string } {
  const query = q.toLowerCase();
  let answer = "";

  if (query.includes("congest") || query.includes("crowd") || query.includes("traffic")) {
    answer = `**VIOS Crowd Intelligence Analysis:**\n\nBased on real-time telemetry, **Gate C (Metro South)** is the primary point of congestion, currently running at **${activeState.gates[2].occupancy}% capacity** with wait times of **${activeState.gates[2].queueTime} minutes**.\n\n**Cause:** Three metro trains arrived consecutively within 10 minutes, generating a localized surge.\n\n**AI Recommendation:**\n1. Instruct stadium staff to open overflow lanes **C1 and C2** immediately.\n2. Dispatch 10 nearby volunteers to assist ticket scans.\n3. Turn on digital signs advising spectators to walk to **Gate B** which has an wait time of just **${activeState.gates[1].queueTime} minutes**.`;
  } else if (query.includes("rain") || query.includes("weather")) {
    answer = `**VIOS Meteorological & Operations Advisory:**\n\nUnder current conditions (**${activeState.weather.condition}** at **${activeState.weather.temp}°C**):\n\n- Concourse pedestrian speed has decreased by **15%** due to wet flooring surfaces.\n- Concessions near covered sections are seeing a **45% increase in traffic**.\n\n**Operational Plan:**\n1. Disseminate wet-floor warnings via P.A. system and digital displays.\n2. Mobilize cleaning teams to sweep entries of Gates A & C.\n3. Shift outdoor staff to undercover volunteer operations. Ensure all electronic equipment is covered with weatherproof shield.`;
  } else if (query.includes("evac") || query.includes("emergency") || query.includes("threat")) {
    answer = `**VIOS Emergency & Evacuation Blueprint:**\n\nIn the event of an immediate evacuation command, the AI has formulated a **perimeter evacuation split** based on current sector density:\n\n- **Sectors 100-115 (South & East):** Route through Gate C and Gate D (estimated clearance: 8.5 minutes).\n- **Sectors 116-230 (North & West):** Route through Gate A and Gate B (estimated clearance: 9.2 minutes).\n- **VIP & Media Blocks:** Direct egress via Gate E (VIP) to keep major corridors unblocked.\n\n*Note: Emergency lighting and digital directional arrows are programmed to sync instantly upon triggering the One-Click Emergency Evacuation Protocol.*`;
  } else {
    answer = `**VIOS Operations Brain:**\n\nI am currently tracking stadium metrics during the **${activeState.matchTimeLabel}** match phase under the **${activeState.scenario}** scenario.\n\n- Active Spectators: **${activeState.spectatorsInStadium}**\n- Transit Congestion: **${activeState.transport.metroCongestion}%**\n- Volley Staff: **${activeState.volunteersActive}/${activeState.volunteersTotal} Active**\n\nPlease let me know if you would like me to generate specialized recommendations for: **Gates Redirection**, **Staff Assignments**, **Sustainability conservation**, or **Security hazard assessment**!`;
  }

  return { answer };
}

// 8. Serve static React client files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FIFA Venue Intelligence OS (VIOS) Server running on http://localhost:${PORT}`);
  });
}

startServer();
