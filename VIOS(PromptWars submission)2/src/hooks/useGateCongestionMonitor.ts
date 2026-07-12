import React, { useEffect, useRef } from "react";
import { StadiumState } from "../types";

/**
 * Custom hook to monitor gate congestion and automatically trigger critical alerts.
 * 
 * @param stadiumState The active stadium state.
 * @param setCustomNotification Callback to update the custom notification state.
 * @param queueThresholdMinutes The queue wait time in minutes to trigger an alert.
 * @param occupancyThresholdPercent The occupancy percentage to trigger an alert.
 */
export function useGateCongestionMonitor(
  stadiumState: StadiumState | null,
  setCustomNotification: React.Dispatch<
    React.SetStateAction<{
      text: string;
      type: "info" | "warning" | "critical" | "emergency";
    } | null>
  >,
  queueThresholdMinutes: number = 25,
  occupancyThresholdPercent: number = 80
) {
  // Store the set of gate IDs that have already triggered a notification for the current congestion event
  const notifiedGatesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!stadiumState || !stadiumState.gates) {
      return;
    }

    const currentCongestedIds = new Set<string>();

    stadiumState.gates.forEach((gate) => {
      const isCongested =
        gate.queueTime >= queueThresholdMinutes ||
        gate.occupancy >= occupancyThresholdPercent ||
        gate.status === "congested";

      if (isCongested) {
        currentCongestedIds.add(gate.id);

        // Only notify if we haven't already notified for this gate's current congestion
        if (!notifiedGatesRef.current.has(gate.id)) {
          const description =
            gate.status === "congested"
              ? "marked as CONGESTED"
              : gate.queueTime >= queueThresholdMinutes
              ? `wait time reached ${gate.queueTime} mins`
              : `occupancy reached ${gate.occupancy}%`;

          setCustomNotification({
            text: `CRITICAL CONGESTION: ${gate.name} is ${description}! Action required: dispatch volunteers or open backup turnstiles.`,
            type: "critical",
          });

          // Auto-clear after 10 seconds unless replaced
          setTimeout(() => {
            setCustomNotification((curr) => {
              if (curr && curr.text.includes(gate.name) && curr.type === "critical") {
                return null;
              }
              return curr;
            });
          }, 10000);
        }
      }
    });

    // Update the ref to contain only the gates that are currently congested.
    // If a gate is no longer congested, it is removed from this Set, allowing future alerts if it congests again.
    notifiedGatesRef.current = currentCongestedIds;
  }, [stadiumState, setCustomNotification, queueThresholdMinutes, occupancyThresholdPercent]);
}
