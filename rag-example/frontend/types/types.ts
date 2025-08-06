import type { Chat } from '@google/genai';

export type Page = 'home' | 'scenario-selection' | 'simulation' | 'simulation-with-scenario' | 'review' | 'qa';

export interface Message {
  role: 'user' | 'model';
  parts: string;
  speaker?: string;
}

export interface SelfAssessment {
  [criterionKey: string]: string;
}

export interface CriterionAnalysis {
  criterion: string;
  met: boolean;
  score: string;
  evidence: string;
  feedback: string;
}

export interface TranscriptCitation {
  number: number;
  marker: string;
  quote: string;
  speaker: string;
}

export interface CurriculumCitation {
  number: number;
  source: string;
  text: string;
  uri: string;
  pages?: string;
}

export interface CaseworkerAnalysis {
  overallSummary: string;
  strengths: string[];
  areasForImprovement: {
    area: string;
    suggestion: string;
  }[];
  criteriaAnalysis?: CriterionAnalysis[];
  transcriptCitations?: TranscriptCitation[];
  citations?: CurriculumCitation[];
}

export interface SupervisorAnalysis {
    feedbackOnStrengths: string;
    feedbackOnCritique: string;
    overallTone: string;
    transcriptCitations?: TranscriptCitation[];
    citations?: CurriculumCitation[];
}

export interface AppState {
  page: Page;
  currentView: 'caseworker' | 'supervisor';
  showSplash: boolean;
}
