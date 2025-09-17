/**
 * Chart Data Utilities for SessionLineChart
 * Transforms comprehensive analysis data into chart-ready format
 */

import { SessionMetrics, PathwayIndicators } from '../types/types';

export interface ChartDataPoint {
  timestamp: string;
  sessionTimeSeconds: number;
  engagement_level: number;          // 0-100 scale
  therapeutic_alliance_score: number; // 0-100 scale
  emotional_state_score: number;     // 0-100 scale (wellness-based)
  techniques_count: number;          // Count of detected techniques
  effectiveness_score: number;       // 0-100 scale
  change_urgency_level: number;      // 0-100 scale
  jobId: number;                     // Track which analysis generated this
}

/**
 * Convert therapeutic alliance string to numeric score
 */
export const convertTherapeuticAlliance = (alliance: SessionMetrics['therapeutic_alliance'] | 'unknown'): number => {
  switch (alliance) {
    case 'strong': return 90;
    case 'moderate': return 60;
    case 'weak': return 30;
    case 'unknown': return 0;
    default: return 0;
  }
};

/**
 * Convert emotional state to wellness score (higher = better)
 */
export const convertEmotionalState = (state: SessionMetrics['emotional_state']): number => {
  switch (state) {
    case 'calm': return 100;
    case 'engaged': return 85;
    case 'anxious': return 45;
    case 'distressed': return 25;
    case 'dissociated': return 15;
    case 'unknown': return 0;
    default: return 0;
  }
};

/**
 * Convert pathway effectiveness to numeric score
 */
export const convertEffectiveness = (effectiveness: PathwayIndicators['current_approach_effectiveness']): number => {
  switch (effectiveness) {
    case 'effective': return 90;
    case 'struggling': return 50;
    case 'ineffective': return 20;
    case 'unknown': return 0;
    default: return 0;
  }
};

/**
 * Convert change urgency to numeric level
 */
export const convertChangeUrgency = (urgency: PathwayIndicators['change_urgency']): number => {
  switch (urgency) {
    case 'none': return 10;
    case 'monitor': return 30;
    case 'consider': return 60;
    case 'recommended': return 90;
    default: return 0;
  }
};

/**
 * Create a chart data point from comprehensive analysis data
 */
export const createChartDataPoint = (
  sessionMetrics: SessionMetrics,
  pathwayIndicators: PathwayIndicators,
  sessionTimeSeconds: number,
  jobId: number
): ChartDataPoint => {
  return {
    timestamp: new Date().toISOString(),
    sessionTimeSeconds,
    engagement_level: Math.round(sessionMetrics.engagement_level * 100), // Convert 0-1 to 0-100
    therapeutic_alliance_score: convertTherapeuticAlliance(sessionMetrics.therapeutic_alliance),
    emotional_state_score: convertEmotionalState(sessionMetrics.emotional_state),
    techniques_count: sessionMetrics.techniques_detected?.length || 0,
    effectiveness_score: convertEffectiveness(pathwayIndicators.current_approach_effectiveness),
    change_urgency_level: convertChangeUrgency(pathwayIndicators.change_urgency),
    jobId,
  };
};

/**
 * Generate interpolated data points for smooth chart rendering
 * This fills gaps between actual data points for better visualization
 */
export const interpolateChartData = (dataPoints: ChartDataPoint[], sessionDuration: number): ChartDataPoint[] => {
  if (dataPoints.length === 0) {
    return [];
  }

  // Sort by session time to ensure proper order
  const sortedPoints = [...dataPoints].sort((a, b) => a.sessionTimeSeconds - b.sessionTimeSeconds);
  
  // If we only have one point, just return it
  if (sortedPoints.length === 1) {
    return sortedPoints;
  }

  const interpolatedPoints: ChartDataPoint[] = [];
  
  // Add initial point if session started before first data point
  if (sortedPoints[0].sessionTimeSeconds > 60) {
    interpolatedPoints.push({
      ...sortedPoints[0],
      sessionTimeSeconds: 0,
      engagement_level: 0,
      therapeutic_alliance_score: 0,
      emotional_state_score: 0,
      techniques_count: 0,
      effectiveness_score: 0,
      change_urgency_level: 0,
      timestamp: new Date(Date.now() - sessionDuration * 1000).toISOString(),
      jobId: -1, // Mark as interpolated
    });
  }

  // Add all actual data points
  interpolatedPoints.push(...sortedPoints);

  return interpolatedPoints;
};

/**
 * Prune old data points to prevent memory issues
 * Keep only the last N points or points within time window
 */
export const pruneChartData = (dataPoints: ChartDataPoint[], maxPoints: number = 100): ChartDataPoint[] => {
  if (dataPoints.length <= maxPoints) {
    return dataPoints;
  }

  // Keep the most recent points
  return dataPoints.slice(-maxPoints);
};

/**
 * Get the latest values for each metric (for display purposes)
 */
export const getLatestMetrics = (dataPoints: ChartDataPoint[]) => {
  if (dataPoints.length === 0) {
    return {
      engagement_level: 0,
      therapeutic_alliance_score: 0,
      emotional_state_score: 0,
      techniques_count: 0,
      effectiveness_score: 0,
      change_urgency_level: 0,
    };
  }

  const latest = dataPoints[dataPoints.length - 1];
  return {
    engagement_level: latest.engagement_level,
    therapeutic_alliance_score: latest.therapeutic_alliance_score,
    emotional_state_score: latest.emotional_state_score,
    techniques_count: latest.techniques_count,
    effectiveness_score: latest.effectiveness_score,
    change_urgency_level: latest.change_urgency_level,
  };
};

/**
 * Format data for recharts consumption
 */
export const formatDataForChart = (dataPoints: ChartDataPoint[]) => {
  console.log('formatDataForChart - input dataPoints:', dataPoints);
  
  const formatted = dataPoints.map(point => ({
    time: Math.floor(point.sessionTimeSeconds / 60), // Convert to minutes for x-axis
    timeDisplay: `${Math.floor(point.sessionTimeSeconds / 60)}:${String(point.sessionTimeSeconds % 60).padStart(2, '0')}`,
    engagement: point.engagement_level,
    alliance: point.therapeutic_alliance_score,
    emotional: point.emotional_state_score,
    effectiveness: point.effectiveness_score,
    urgency: point.change_urgency_level,
    techniques: point.techniques_count,
    timestamp: point.timestamp,
    isInterpolated: point.jobId === -1,
  }));
  
  console.log('formatDataForChart - formatted data:', formatted);
  return formatted;
};
