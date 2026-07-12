// TypeScript types for FIFA Venue Intelligence OS (VIOS)

export interface GateState {
  id: string;
  name: string;
  occupancy: number; // percentage (0-100)
  queueTime: number; // minutes
  status: "open" | "closed" | "congested";
  volunteerCount: number;
}

export interface ConcessionState {
  id: string;
  name: string;
  category: "food" | "merchandise" | "beverage";
  queueTime: number;
  sales: number;
  stockLevel: number;
}

export interface TransportState {
  metroWaitTime: number;
  metroCongestion: number;
  busWaitTime: number;
  rideShareWaitTime: number;
  parkingOccupancy: number;
  activeMetros: number;
  activeBuses: number;
}

export interface SustainabilityState {
  electricityKw: number;
  waterLiters: number;
  foodWasteKg: number;
  trashKg: number;
  solarGenerationKw: number;
}

export interface SecurityIncident {
  id: string;
  title: string;
  section: string;
  priority: "info" | "warning" | "critical" | "emergency";
  status: "active" | "resolved" | "monitoring";
  timestamp: string;
  description: string;
  assignedStaff: number;
}

export interface AccessibilityRequest {
  id: string;
  type: "wheelchair" | "elderly" | "blind" | "deaf" | "language";
  location: string;
  status: "pending" | "dispatched" | "completed";
  description: string;
  assignedVolunteerId?: string;
}

export interface StadiumState {
  timePassed: number;
  matchTimeLabel: string;
  spectatorsInStadium: number;
  spectatorsOutsideGates: number;
  weather: {
    temp: number;
    condition: "Sunny" | "Cloudy" | "Raining" | "Heavy Rain" | "Clear Night";
    humidity: number;
  };
  scenario: string;
  gates: GateState[];
  concessions: ConcessionState[];
  transport: TransportState;
  sustainability: SustainabilityState;
  incidents: SecurityIncident[];
  accessibilityRequests: AccessibilityRequest[];
  volunteersTotal: number;
  volunteersActive: number;
}

export interface AIPrediction {
  observation: string;
  reasoning: string;
  prediction: string;
  recommendedActions: string;
  expectedImpact: string;
  confidenceScore: number;
}

export type WorkspaceRole = 
  | "operations" 
  | "security" 
  | "volunteers" 
  | "transportation" 
  | "sustainability" 
  | "fan";
