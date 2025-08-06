import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { AppState, Message, Page, SelfAssessment, CaseworkerAnalysis, SupervisorAnalysis } from '../types/types';
import { createChatSession, createMentorshipChatSession, createSimulationChatSession, analyzeCaseworkerPerformance, analyzeSupervisorCoaching } from '../services/geminiService';
import { ASSESSMENT_CRITERIA, SIMULATION_SYSTEM_PROMPT, GENERAL_QA_SYSTEM_PROMPT, SIMULATION_SCENARIOS, SIMULATION_PREFILL_EXAMPLES, SELF_ASSESSMENT_EXAMPLES, SUPERVISOR_FEEDBACK_EXAMPLES } from '../utils/constants';
import { 
    BotIcon, UserIcon, SendIcon, SparklesIcon, ClipboardIcon, 
    CheckCircleIcon, LightbulbIcon, ChatBubbleLeftRightIcon, QuestionMarkCircleIcon,
    MagicWandIcon
} from '../utils/icons';
import SplashScreen from './SplashScreen';
import StreamingAnalysisDisplay from './StreamingAnalysisDisplay';
import AnalysisDisplay from './AnalysisDisplay';
import ThinkingBox from './ThinkingBox';
import SupervisorAnalysisDisplay from './SupervisorAnalysisDisplay';


//region --- UI Components ---

const Header = ({ 
    currentView, 
    onViewChange,
    onTitleClick
}: { 
    currentView: 'caseworker' | 'supervisor',
    onViewChange: (view: 'caseworker' | 'supervisor') => void,
    onTitleClick: () => void
}) => {
    return (
        <header className="text-center relative" style={{marginBottom: 0}}>
            <h1 className="h1 cursor-pointer" onClick={onTitleClick}>
              <span>Social Work</span> <span style={{color: 'var(--primary)'}}>Coaching Simulator</span>
            </h1>
            <div className="flex justify-center gap-2 mt-4">
                <button 
                    onClick={() => onViewChange('caseworker')}
                    className={currentView === 'caseworker' ? 'btn-primary' : 'btn-secondary'}
                >
                    Caseworker View
                </button>
                <button 
                    onClick={() => onViewChange('supervisor')}
                    className={currentView === 'supervisor' ? 'btn-primary' : 'btn-secondary'}
                >
                    Supervisor View
                </button>
            </div>
        </header>
    );
};

const AboutCurriculumLink = () => {
    const [showAboutModal, setShowAboutModal] = useState(false);
    
    return (
        <div className="text-center" style={{
            marginTop: 'var(--unit-6)',
            marginBottom: 'var(--unit-8)'
        }}>
            <div className="relative inline-block">
                <button
                    className="about-curriculum-trigger"
                    onMouseEnter={() => setShowAboutModal(true)}
                    onMouseLeave={() => setShowAboutModal(false)}
                    onClick={() => setShowAboutModal(!showAboutModal)}
                    aria-label="About Core Curriculum"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 'var(--unit-2)',
                        color: 'var(--on-surface-variant)',
                        fontSize: '0.875rem',
                        padding: 'var(--unit-2) var(--unit-3)',
                        borderRadius: 'var(--unit-5)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--surface-container-low)';
                        e.currentTarget.style.color = 'var(--primary)';
                    }}
                    onMouseOut={(e) => {
                        if (!showAboutModal) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--on-surface-variant)';
                        }
                    }}
                >
                    <QuestionMarkCircleIcon className="w-5 h-5" />
                    <span>About Core Curriculum</span>
                </button>
                {showAboutModal && (
                    <div 
                        className="about-modal"
                        onMouseEnter={() => setShowAboutModal(true)}
                        onMouseLeave={() => setShowAboutModal(false)}
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            marginTop: 'var(--unit-2)',
                            width: '896px',
                            maxWidth: '90vw',
                            maxHeight: '70vh',
                            backgroundColor: 'var(--surface)',
                            border: '1px solid var(--outline-variant)',
                            borderRadius: 'var(--unit-3)',
                            padding: 'var(--unit-5)',
                            boxShadow: '0 4px 20px var(--shadow)',
                            zIndex: 1000,
                            animation: 'modalFadeIn 0.3s ease-out',
                            overflowY: 'auto',
                            textAlign: 'left'
                        }}
                    >
                        <h3 className="h5 mb-3" style={{textAlign: 'left'}}>About the Core Curriculum</h3>
                        <p style={{fontSize: '0.875rem', lineHeight: '1.6', color: 'var(--on-surface-variant)', marginBottom: 'var(--unit-3)', textAlign: 'left'}}>
                            This simulator is built around evidence-based practice behaviors essential for effective social work. The curriculum framework is derived from the Arkansas Division of Children and Family Services competency model.
                        </p>
                        <p style={{fontSize: '0.875rem', lineHeight: '1.6', color: 'var(--on-surface-variant)', marginBottom: 'var(--unit-3)', textAlign: 'left'}}>
                            Each simulation and feedback session focuses on developing these core competencies:
                        </p>
                        
                        <div style={{marginBottom: 'var(--unit-4)'}}>
                            {ASSESSMENT_CRITERIA.map((criterion) => (
                                <div key={criterion.key} style={{
                                    marginBottom: 'var(--unit-3)',
                                    padding: 'var(--unit-3)',
                                    backgroundColor: 'var(--surface-container-low)',
                                    borderRadius: 'var(--unit-2)',
                                    border: '1px solid var(--outline-variant)'
                                }}>
                                    <h4 style={{
                                        fontSize: '0.925rem',
                                        fontWeight: '600',
                                        color: 'var(--on-surface)',
                                        marginBottom: 'var(--unit-1)',
                                        textAlign: 'left'
                                    }}>
                                        {criterion.title}
                                    </h4>
                                    <p style={{
                                        fontSize: '0.825rem',
                                        lineHeight: '1.5',
                                        color: 'var(--on-surface-variant)',
                                        textAlign: 'left',
                                        margin: 0
                                    }}>
                                        {criterion.description}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <p style={{fontSize: '0.875rem', lineHeight: '1.6', color: 'var(--on-surface-variant)', textAlign: 'left'}}>
                            The AI provides real-time coaching aligned with these standards, helping both new and experienced workers refine their skills in a safe, supportive environment.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

const ChatInterface = ({
  history,
  onSendMessage,
  isLoading,
  placeholder = "Send a message...",
  chatTitle,
  initialMessage,
  onPrefillExample,
  showPrefillButton = false,
}: {
  history: Message[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
  chatTitle: string;
  initialMessage?: Message;
  onPrefillExample?: () => void;
  showPrefillButton?: boolean;
}) => {
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isLoading]);

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSend();
    }
  };
  
  const allMessages = initialMessage ? [initialMessage, ...history] : history;

  return (
    <div className="chat-container" style={{ position: 'relative' }}>
      {showPrefillButton && onPrefillExample && (
        <button
          onClick={onPrefillExample}
          className="glossy-chip-surface"
          style={{
            position: 'absolute',
            top: 'var(--unit-6)',
            right: 'var(--unit-6)',
            zIndex: 10
          }}
        >
          <MagicWandIcon className="w-4 h-4" />
          <span>Prefill Example</span>
        </button>
      )}
      <h2 className="h4 mb-4">{chatTitle}</h2>
      <div className="flex-grow overflow-y-auto pr-2 space-y-4">
        {allMessages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.role === 'user' ? 'user' : ''}`}>
            {msg.role === 'model' && (
              <div className="chat-icon gradient-bot-icon">
                <BotIcon />
              </div>
            )}
            <div className={`chat-bubble ${msg.role}`}>
              <p style={{fontSize: '0.875rem', lineHeight: '1.5', whiteSpace: 'pre-wrap'}}>{msg.parts}</p>
            </div>
            {msg.role === 'user' && (
              <div className="chat-icon gradient-user-icon">
                <UserIcon />
              </div>
            )}
          </div>
        ))}
         {isLoading && (
            <div className="chat-message">
              <div className="chat-icon gradient-bot-icon">
                <BotIcon />
              </div>
              <div className="chat-bubble model">
                <div className="typing-indicator">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                </div>
              </div>
            </div>
          )}
        <div ref={chatEndRef} />
      </div>
      <div className="chat-input-wrapper gradient-input-container">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="chat-input"
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !newMessage}
          className="chat-send-button gradient-send-button"
          aria-label="Send message"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
};


const LoadingIndicator = ({text}: {text: string}) => (
    <div className="loading-indicator">
        <div className="loading-spinner"></div>
        <h3 className="h4 mt-6">{text}</h3>
    </div>
);

//endregion

//region --- Page Components ---

const HomePage = ({ onSelectPage }: { onSelectPage: (page: Page) => void }) => (
    <div className="max-w-4xl mx-auto">
        <p className="text-center mt-4 max-w-2xl mx-auto mb-8" style={{fontSize: '1.125rem', color: 'var(--on-surface-variant)'}}>
          An AI partner to help you practice, get feedback, and grow your professional skills.
        </p>
        <div className="grid grid-cols-2 gap-6 mb-8">
            <article onClick={() => onSelectPage('scenario-selection')} className="card card-clickable">
                <ChatBubbleLeftRightIcon className="w-12 h-12 mb-3" style={{color: 'var(--primary)'}} />
                <h3 className="h4">Counseling Simulation</h3>
                <p style={{color: 'var(--on-surface-variant)', fontSize: '0.875rem', marginTop: 'var(--unit-1)'}}>Engage in a realistic role-play scenario to practice your skills.</p>
            </article>
            <article onClick={() => onSelectPage('qa')} className="card card-clickable">
                <QuestionMarkCircleIcon className="w-12 h-12 mb-3" style={{color: 'var(--primary)'}} />
                <h3 className="h4">General Feedback / Q&A</h3>
                <p style={{color: 'var(--on-surface-variant)', fontSize: '0.875rem', marginTop: 'var(--unit-1)'}}>Ask questions about the curriculum and best practices.</p>
            </article>
        </div>
    </div>
);

const ScenarioSelectionPage = ({ onScenarioSelect }: { onScenarioSelect: (scenario: typeof SIMULATION_SCENARIOS[0]) => void }) => {
    const [selectedScenario, setSelectedScenario] = useState<typeof SIMULATION_SCENARIOS[0] | null>(null);
    const scenariosRef = useRef<HTMLDivElement>(null);
    const caseSummaryRef = useRef<HTMLDivElement>(null);

    // Autoscroll to scenarios when page loads
    useEffect(() => {
        setTimeout(() => {
            scenariosRef.current?.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }, 100); // Small delay to ensure DOM is ready
    }, []);

    // Autoscroll to case summary when a scenario is selected
    useEffect(() => {
        if (selectedScenario) {
            setTimeout(() => {
                caseSummaryRef.current?.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }, 100); // Small delay to ensure DOM updates
        }
    }, [selectedScenario]);

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h2 className="h2 mb-4">Select a Practice Scenario</h2>
                <p style={{color: 'var(--on-surface-variant)', fontSize: '1.125rem'}}>
                    Choose a case scenario to practice your social work skills. Each scenario is based on real case files and will provide a realistic role-play experience.
                </p>
            </div>

            <div className="space-y-6">
                <div className="card" ref={scenariosRef}>
                    <h3 className="h4 mb-4">Available Scenarios</h3>
                    <div className="space-y-3">
                        {SIMULATION_SCENARIOS.map((scenario) => (
                            <div 
                                key={scenario.id}
                                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                    selectedScenario?.id === scenario.id 
                                        ? 'border-blue-500 bg-blue-50' 
                                        : 'border-gray-300 hover:border-gray-400'
                                }`}
                                onClick={() => setSelectedScenario(scenario)}
                            >
                                <div className="flex items-start gap-3">
                                    <input
                                        type="radio"
                                        name="scenario"
                                        checked={selectedScenario?.id === scenario.id}
                                        onChange={() => setSelectedScenario(scenario)}
                                        className="w-4 h-4 text-blue-600 mt-1"
                                    />
                                    <div className="flex-1">
                                        <h4 className="h5 mb-2">{scenario.title}</h4>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            {scenario.id === 'cooper' && 'Domestic violence and substance use allegations involving Sara Cooper and her partner Shawn.'}
                                            {scenario.id === 'baskin' && 'Physical abuse concerns after 14-year-old Karina comes to school with injuries.'}
                                            {scenario.id === 'rich' && 'Neglect case involving untreated dental issues and missed medical appointments.'}
                                            {scenario.id === 'tasi' && 'Neglect allegations including sibling violence and children left unsupervised.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {selectedScenario && (
                    <div className="card" ref={caseSummaryRef}>
                        <h3 className="h4 mb-4">Case Summary: {selectedScenario.title}</h3>
                        <p style={{color: 'var(--on-surface-variant)', fontSize: '0.875rem', lineHeight: '1.6', marginBottom: 'var(--unit-4)'}}>
                            {selectedScenario.summary}
                        </p>
                        <button 
                            onClick={() => onScenarioSelect(selectedScenario)}
                            className="btn-glossy-blue"
                        >
                            Start Simulation
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const SimulationPage = ({ onComplete }: { onComplete: (transcript: Message[], assessment: SelfAssessment | null) => void }) => {
    const [chatSession] = useState(() => createChatSession(SIMULATION_SYSTEM_PROMPT));
    const [history, setHistory] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    const handleSendMessage = useCallback(async (message: string) => {
        setIsLoading(true);
        const userMessage: Message = { role: 'user', parts: message };
        setHistory(prev => [...prev, userMessage]);

        try {
            const stream = await chatSession.sendMessageStream({ message });
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk.text;
            }
            const modelMessage: Message = { role: 'model', parts: fullResponse };
            setHistory(prev => [...prev, modelMessage]);
            if (fullResponse.toLowerCase().includes("have to go") || fullResponse.toLowerCase().includes("that's all i have time for")) {
                setIsFinished(true);
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred.';
            setHistory(prev => [...prev, { role: 'model', parts: `Sorry, an error occurred: ${errorMsg}` }]);
        } finally {
            setIsLoading(false);
        }
    }, [chatSession]);

    return (
        <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)]">
             <ChatInterface
                chatTitle="Simulation: Unexpected Home Visit"
                history={history}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                placeholder={isFinished ? "Simulation ended." : "Your response..."}
                initialMessage={{role: 'model', parts: "Who are you? What do you want?"}}
             />
             {(isFinished || history.length >= 10) && (
                 <div className="mt-4 text-center">
                    <button 
                        onClick={() => onComplete(history, null)}
                        className="btn-glossy-blue"
                    >
                        Finish and begin self-assessment
                    </button>
                 </div>
             )}
        </div>
    );
};

const SimulationPageWithScenario = ({ scenario, onComplete }: { scenario: typeof SIMULATION_SCENARIOS[0], onComplete: (transcript: Message[], assessment: SelfAssessment | null) => void }) => {
    const [chatSession] = useState(() => createSimulationChatSession(scenario.id));
    const [history, setHistory] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [hasPrefilled, setHasPrefilled] = useState(false);
    const [prefilledAssessment, setPrefilledAssessment] = useState<SelfAssessment | null>(null);

    const handleSendMessage = useCallback(async (message: string) => {
        setIsLoading(true);
        const userMessage: Message = { role: 'user', parts: message };
        setHistory(prev => [...prev, userMessage]);

        try {
            let fullResponse = '';
            const stream = await chatSession.sendMessageStream({ message });
            for await (const chunk of stream) {
                fullResponse += chunk.text;
            }
            const modelMessage: Message = { role: 'model', parts: fullResponse };
            setHistory(prev => [...prev, modelMessage]);
            if (fullResponse.toLowerCase().includes("have to go") || fullResponse.toLowerCase().includes("that's all i have time for")) {
                setIsFinished(true);
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred.';
            setHistory(prev => [...prev, { role: 'model', parts: `Sorry, an error occurred: ${errorMsg}` }]);
        } finally {
            setIsLoading(false);
        }
    }, [chatSession]);

    const handlePrefillExample = useCallback(() => {
        const scenarioExamples = SIMULATION_PREFILL_EXAMPLES[scenario.id as keyof typeof SIMULATION_PREFILL_EXAMPLES];
        if (!scenarioExamples || scenarioExamples.length === 0) return;

        // Select a random example
        const randomExample = scenarioExamples[Math.floor(Math.random() * scenarioExamples.length)];
        
        // Set the history and the corresponding assessment
        setHistory(randomExample.messages);
        setPrefilledAssessment(randomExample.assessment);
        setHasPrefilled(true);
        
        // Mark as finished since these are complete examples
        setIsFinished(true);
    }, [scenario.id]);

    const simulationGreeting = {
        role: 'model' as const,
        parts: "Can I help you?"
    };

    return (
        <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)]">
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Scenario: {scenario.title}</h3>
                <p className="text-blue-700 text-sm">{scenario.summary}</p>
            </div>
             <ChatInterface
                chatTitle={`Simulation: ${scenario.title}`}
                history={history}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                placeholder={isFinished ? "Simulation ended." : "Your response..."}
                initialMessage={simulationGreeting}
                onPrefillExample={handlePrefillExample}
                showPrefillButton={!hasPrefilled && history.length === 0}
             />
             {(isFinished || history.length >= 10) && (
                 <div className="mt-4 text-center">
                    <button 
                        onClick={() => onComplete(history, prefilledAssessment)}
                        className="btn-glossy-blue"
                    >
                        Finish and begin self-assessment
                    </button>
                 </div>
             )}
        </div>
    );
};

const ReviewPage = ({ 
    simulationTranscript,
    prefilledAssessment,
    onComplete,
}: { 
    simulationTranscript: Message[];
    prefilledAssessment: SelfAssessment | null;
    onComplete: (data: {selfAssessment: SelfAssessment, caseworkerAnalysis: CaseworkerAnalysis, supervisorFeedback: string, supervisorAnalysis: SupervisorAnalysis}) => void;
}) => {
    type Stage = 'self-assessment' | 'caseworker-analysis' | 'caseworker-analysis-complete' | 'final';
    const [stage, setStage] = useState<Stage>('self-assessment');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selfAssessment, setSelfAssessment] = useState<SelfAssessment>({});
    const [caseworkerAnalysis, setCaseworkerAnalysis] = useState<CaseworkerAnalysis | null>(null);
    const [supervisorFeedback, setSupervisorFeedback] = useState('');
    const [supervisorAnalysis, setSupervisorAnalysis] = useState<SupervisorAnalysis | null>(null);
    
    // Streaming state
    const [streamingText, setStreamingText] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [thinkingComplete, setThinkingComplete] = useState(false);
    const [savedThinkingContent, setSavedThinkingContent] = useState<string[]>([]);
    const [savedResponseContent, setSavedResponseContent] = useState<string>('');
    const [savedRawResponseChunks, setSavedRawResponseChunks] = useState<string[]>([]);

    // Scroll to top when component mounts (when starting self-assessment)
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handlePrefillSelfAssessment = () => {
        // If a prefilled assessment exists from the simulation, use it.
        if (prefilledAssessment) {
            setSelfAssessment(prefilledAssessment);
        } else {
            // Otherwise, select a random example for users who didn't prefill the transcript
            const randomExample = SELF_ASSESSMENT_EXAMPLES[Math.floor(Math.random() * SELF_ASSESSMENT_EXAMPLES.length)];
            setSelfAssessment(randomExample.assessment);
        }
        
        // Auto-scroll to bottom after a brief delay to ensure state updates
        setTimeout(() => {
            window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
    };

    const handleSelfAssessmentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setStreamingText('');
        setIsStreaming(true);
        setIsThinking(false);
        setThinkingComplete(false);
        setStage('caseworker-analysis');
        
        try {
            const { analysis, rawResponseChunks } = await analyzeCaseworkerPerformance(
                simulationTranscript, 
                selfAssessment,
                (text, metadata) => {
                    setStreamingText(text);
                    if (metadata) {
                        setIsThinking(metadata.isThinking || false);
                        setThinkingComplete(metadata.thinkingComplete || false);

                        if (metadata.rawResponseChunks) {
                            setSavedRawResponseChunks(metadata.rawResponseChunks);
                        }
                        
                        // Extract and save thinking content and response when thinking is complete
                        if (metadata.thinkingComplete && text.includes('THINKING_COMPLETE')) {
                            const parts = text.split('THINKING_COMPLETE');
                            if (parts.length >= 2) {
                                // Extract thinking content
                                const thinkingPart = parts[0].trim();
                                if (thinkingPart) {
                                    const thinkingSections = thinkingPart
                                        .split(/\n\n+/)
                                        .filter(section => section.trim())
                                        .map(section => section.trim());
                                    
                                    if (thinkingSections.length > 0) {
                                        setSavedThinkingContent(thinkingSections);
                                    }
                                }
                                
                                // Extract response content (everything after THINKING_COMPLETE)
                                const responsePart = parts.slice(1).join('THINKING_COMPLETE').trim();
                                if (responsePart) {
                                    setSavedResponseContent(responsePart);
                                }
                            }
                        }
                    }
                }
            );
            setCaseworkerAnalysis(analysis);
            setSavedRawResponseChunks(rawResponseChunks); // Save all raw chunks
            setIsStreaming(false);
            setStage('caseworker-analysis-complete');
            
            // Transition directly to final view if analysis was successful
            if (analysis) {
                // Brief pause before transitioning to final view
                setTimeout(() => {
                    setStage('final');
                }, 1500);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            // Don't reset stage - stay on current view to show error with thinking box
        } finally {
            setIsLoading(false);
            setIsStreaming(false);
        }
    };


    // Don't return early on error - show error along with thinking box for debugging

    const renderContent = () => {
        // Only show error display if there's an actual error and we're in an analysis stage
        if (error && (stage === 'caseworker-analysis' || stage === 'caseworker-analysis-complete')) {
            return (
                <div className="space-y-4">
                    <div className="bg-red-100 text-red-700 p-4 rounded-md border border-red-300">
                        <h3 className="font-semibold mb-2">Error</h3>
                        <p>{error}</p>
                    </div>
                    
                    {/* Still show thinking box if available - helpful for debugging */}
                    {(savedThinkingContent.length > 0 || savedResponseContent) && (
                        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200">
                            <div className="flex items-center gap-3 mb-4">
                                <SparklesIcon className="w-8 h-8 text-blue-600" />
                                <h2 className="text-2xl font-bold text-slate-800">AI Processing Log</h2>
                            </div>
                    <ThinkingBox 
                        thinkingContent={savedThinkingContent}
                        responseContent={savedResponseContent}
                        rawResponseChunks={savedRawResponseChunks}
                        isThinkingComplete={true}
                        initialExpanded={true}
                    />
                            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-amber-700 text-sm">
                                    The analysis failed, but the AI's thinking process above may help identify the issue.
                                </p>
                            </div>
                        </div>
                    )}
                    
                    <button 
                        onClick={() => {
                            setError(null);
                            setStage('self-assessment');
                        }}
                        className="btn-secondary"
                    >
                        Try Again
                    </button>
                </div>
            );
        }
        
        switch(stage) {
            case 'self-assessment':
                return (
                    <form onSubmit={handleSelfAssessmentSubmit} className="self-assessment-form">
                        <button
                            type="button"
                            onClick={handlePrefillSelfAssessment}
                            className="glossy-chip-surface"
                            style={{
                                position: 'absolute',
                                top: 'var(--unit-6)',
                                right: 'var(--unit-6)',
                                zIndex: 10
                            }}
                        >
                            <MagicWandIcon className="w-4 h-4" />
                            <span>Prefill Example</span>
                        </button>
                        <h3 className="assessment-title">Post-Simulation Self-Assessment</h3>
                        <p className="assessment-subtitle">Reflect on your performance during the simulation based on the core criteria.</p>
                        <div className="assessment-criteria-container">
                            {ASSESSMENT_CRITERIA.map(c => (
                                <div key={c.key} className="assessment-criterion">
                                    <label className="criterion-label" htmlFor={c.key}>
                                        {c.title}
                                    </label>
                                    <p className="criterion-description">{c.description}</p>
                                    <textarea
                                        id={c.key}
                                        rows={3}
                                        required
                                        value={selfAssessment[c.key] || ''}
                                        className="criterion-textarea"
                                        onChange={e => setSelfAssessment(s => ({ ...s, [c.key]: e.target.value }))}
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="assessment-submit-container">
                            <button type="submit" className="btn-submit-assessment">
                                <SparklesIcon className="w-5 h-5" />
                                Submit for AI analysis
                            </button>
                        </div>
                    </form>
                );
            case 'caseworker-analysis':
            case 'caseworker-analysis-complete':
                return (
                    <StreamingAnalysisDisplay 
                        streamingText={streamingText}
                        isComplete={stage === 'caseworker-analysis-complete'}
                        isThinking={isThinking}
                        thinkingComplete={thinkingComplete}
                        rawResponseChunks={savedRawResponseChunks}
                    />
                );
            case 'final':
                return (
                    <div>
                        {caseworkerAnalysis && (
                            <AnalysisDisplay 
                                analysis={caseworkerAnalysis} 
                                thinkingContent={savedThinkingContent}
                                responseContent={savedResponseContent}
                                rawResponseChunks={savedRawResponseChunks}
                            />
                        )}
                    </div>
                );
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
           {renderContent()}
        </div>
    );
};

const QAPage = () => {
    const [chatSession] = useState(() => createMentorshipChatSession(GENERAL_QA_SYSTEM_PROMPT));
    const [history, setHistory] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSendMessage = useCallback(async (message: string) => {
        setIsLoading(true);
        const userMessage: Message = { role: 'user', parts: message };
        setHistory(prev => [...prev, userMessage]);

        try {
            const stream = await chatSession.sendMessageStream({ message });
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk.text;
            }
            const modelMessage: Message = { role: 'model', parts: fullResponse };
            setHistory(prev => [...prev, modelMessage]);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred.';
            setHistory(prev => [...prev, { role: 'model', parts: `Sorry, an error occurred: ${errorMsg}` }]);
        } finally {
            setIsLoading(false);
        }
    }, [chatSession]);

    return (
        <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)]">
            <ChatInterface
                chatTitle="Q&A with AI Mentor"
                history={history}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                placeholder="Ask a question about social work practice..."
                initialMessage={{role: 'model', parts: "Hello! I'm here to help answer your questions about the core curriculum and best practices in social work. Feel free to ask me anything about the assessment criteria, simulation scenarios, or how to improve your skills."}}
            />
        </div>
    );
};

const SupervisorDashboard = ({ onBack }: { onBack: () => void }) => {
    const [transcriptInput, setTranscriptInput] = useState('');
    const [supervisorFeedback, setSupervisorFeedback] = useState('');
    const [supervisorAnalysis, setSupervisorAnalysis] = useState<SupervisorAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'input' | 'loading' | 'results'>('input');
    const [selectedTranscriptIndex, setSelectedTranscriptIndex] = useState<number | null>(null);
    const [streamingText, setStreamingText] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [thinkingComplete, setThinkingComplete] = useState(false);
    const [savedThinkingContent, setSavedThinkingContent] = useState<string[]>([]);
    const [savedResponseContent, setSavedResponseContent] = useState<string>('');
    const [savedRawResponseChunks, setSavedRawResponseChunks] = useState<string[]>([]);

    // Prepare historical transcripts for the dropdown
    const historicalTranscripts = Object.entries(SIMULATION_PREFILL_EXAMPLES).flatMap(([scenarioId, examples]) => 
        examples.map((ex, index) => {
            const feedbackKey = scenarioId as keyof typeof SUPERVISOR_FEEDBACK_EXAMPLES;
            return {
                name: `${scenarioId.charAt(0).toUpperCase() + scenarioId.slice(1)} Family - Example ${index + 1}`,
                transcript: ex.messages.map(msg => `${msg.role === 'user' ? 'Caseworker' : 'Parent'}: ${msg.parts}`).join('\n'),
                feedback: SUPERVISOR_FEEDBACK_EXAMPLES[feedbackKey]?.[index] || ''
            };
        })
    );

    const handleTranscriptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedIndex = e.target.selectedIndex;
        if (selectedIndex > 0) {
            const selectedExample = historicalTranscripts[selectedIndex - 1];
            setTranscriptInput(selectedExample.transcript);
            setSelectedTranscriptIndex(selectedIndex - 1);
        } else {
            setTranscriptInput('');
            setSelectedTranscriptIndex(null);
        }
        setSupervisorFeedback(''); // Clear feedback on any dropdown change
    };

    const handlePrefill = () => {
        if (selectedTranscriptIndex !== null) {
            const selectedExample = historicalTranscripts[selectedTranscriptIndex];
            setSupervisorFeedback(selectedExample.feedback);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setStreamingText('');
        setIsStreaming(true);
        setIsThinking(false);
        setThinkingComplete(false);
        setViewMode('loading');

        try {
            const transcriptMessages: Message[] = transcriptInput
                .split('\n')
                .filter(line => line.trim())
                .map((line, index) => ({
                    role: index % 2 === 0 ? 'user' : 'model' as 'user' | 'model',
                    parts: line.trim()
                }));

            const analysis = await analyzeSupervisorCoaching(
                supervisorFeedback,
                transcriptMessages,
                (text, metadata) => {
                    setStreamingText(text);
                    if (metadata) {
                        setIsThinking(metadata.isThinking || false);
                        setThinkingComplete(metadata.thinkingComplete || false);
                        if (metadata.rawResponseChunks) {
                            setSavedRawResponseChunks(metadata.rawResponseChunks);
                        }
                        if (metadata.thinkingComplete && text.includes('THINKING_COMPLETE')) {
                            const parts = text.split('THINKING_COMPLETE');
                            if (parts.length >= 2) {
                                const thinkingPart = parts[0].trim();
                                if (thinkingPart) {
                                    const thinkingSections = thinkingPart
                                        .split(/\n\n+/)
                                        .filter(section => section.trim())
                                        .map(section => section.trim());
                                    if (thinkingSections.length > 0) {
                                        setSavedThinkingContent(thinkingSections);
                                    }
                                }
                                const responsePart = parts.slice(1).join('THINKING_COMPLETE').trim();
                                if (responsePart) {
                                    setSavedResponseContent(responsePart);
                                }
                            }
                        }
                    }
                }
            );
            setSupervisorAnalysis(analysis);
            setViewMode('results');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        } finally {
            setIsLoading(false);
            setIsStreaming(false);
        }
    };

    const reset = () => {
        setTranscriptInput('');
        setSupervisorFeedback('');
        setSupervisorAnalysis(null);
        setViewMode('input');
    };

    const renderContent = () => {
        if (viewMode === 'loading') {
            return <StreamingAnalysisDisplay 
                streamingText={streamingText}
                isComplete={!isStreaming}
                isThinking={isThinking}
                thinkingComplete={thinkingComplete}
                rawResponseChunks={savedRawResponseChunks}
            />;
        }

        if (viewMode === 'results' && supervisorAnalysis) {
            return (
                <div>
                    <SupervisorAnalysisDisplay 
                        analysis={supervisorAnalysis}
                        thinkingContent={savedThinkingContent}
                        responseContent={savedResponseContent}
                        rawResponseChunks={savedRawResponseChunks}
                    />
                    <div className="text-center mt-6">
                        <button onClick={reset} className="btn-secondary">
                            Try Another Example
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <form onSubmit={handleSubmit} className="self-assessment-form">
                <h3 className="assessment-title">Supervisor Coaching Practice</h3>
                <p className="assessment-subtitle">
                    Practice providing effective feedback. Enter a transcript and your coaching notes, then get AI analysis on your supervisory approach.
                </p>
                <div className="assessment-criteria-container">
                    <div className="assessment-criterion">
                        <label className="criterion-label" htmlFor="transcript-select">
                            Simulation Transcript
                        </label>
                        <p className="criterion-description">Select a historical transcript or paste one into the text area below.</p>
                        <select
                            id="transcript-select"
                            onChange={handleTranscriptChange}
                            className="criterion-select"
                            style={{ marginBottom: 'var(--unit-3)' }}
                        >
                            <option value="">Select a transcript...</option>
                            {historicalTranscripts.map((item, index) => (
                                <option key={index} value={item.transcript}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                        <textarea
                            id="transcript"
                            rows={8}
                            required
                            value={transcriptInput}
                            onChange={(e) => setTranscriptInput(e.target.value)}
                            className="criterion-textarea"
                            placeholder="The selected transcript will appear here, or you can paste your own."
                        />
                    </div>

                    <div className="assessment-criterion">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--unit-2)' }}>
                            <label className="criterion-label" htmlFor="feedback" style={{ marginBottom: 0 }}>
                                Your Supervisor Feedback
                            </label>
                            <button
                                type="button"
                                onClick={handlePrefill}
                                className="glossy-chip-surface"
                                disabled={selectedTranscriptIndex === null}
                            >
                                <MagicWandIcon className="w-4 h-4" />
                                <span>Prefill Example</span>
                            </button>
                        </div>
                        <p className="criterion-description">Write your coaching feedback for the caseworker based on the transcript above.</p>
                        <textarea
                            id="feedback"
                            rows={6}
                            required
                            value={supervisorFeedback}
                            onChange={(e) => setSupervisorFeedback(e.target.value)}
                            className="criterion-textarea"
                            placeholder="e.g., 'Great job building rapport. For next time, let's focus on asking more open-ended questions to gather details.'"
                        />
                    </div>
                </div>
                <div className="assessment-submit-container">
                    <button
                        type="submit"
                        className="btn-submit-assessment"
                        disabled={!transcriptInput.trim() || !supervisorFeedback.trim()}
                    >
                        <SparklesIcon className="w-5 h-5" />
                        Get AI Analysis
                    </button>
                </div>
            </form>
        );
    };

    return (
        <div className="max-w-4xl mx-auto">
            {error && (
                <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">
                    <strong>Error:</strong> {error}
                </div>
            )}
            {renderContent()}
        </div>
    );
};

//endregion

//region --- Main App Component ---

export default function App() {
    const [appState, setAppState] = useState<AppState>({
        page: 'home',
        currentView: 'caseworker',
        showSplash: true
    });
    const [selectedScenario, setSelectedScenario] = useState<typeof SIMULATION_SCENARIOS[0] | null>(null);
    const [simulationTranscript, setSimulationTranscript] = useState<Message[]>([]);
    const [prefilledSelfAssessment, setPrefilledSelfAssessment] = useState<SelfAssessment | null>(null);
    const [contentVisible, setContentVisible] = useState(false);

    const handleSplashComplete = (persona: 'caseworker' | 'supervisor') => {
        setAppState(prev => ({ 
            ...prev, 
            showSplash: false,
            currentView: persona 
        }));
        // Add a small delay before showing content for smooth transition
        setTimeout(() => {
            setContentVisible(true);
        }, 100);
    };

    const handlePageChange = (page: Page) => {
        setAppState(prev => ({ ...prev, page }));
    };

    const handleViewChange = (view: 'caseworker' | 'supervisor') => {
        setAppState(prev => ({ 
            ...prev, 
            currentView: view,
            page: 'home'
        }));
    };

    const handleGoHome = () => {
        setAppState(prev => ({ ...prev, page: 'home' }));
        setSelectedScenario(null);
        setSimulationTranscript([]);
        setPrefilledSelfAssessment(null);
    };

    const handleScenarioSelect = (scenario: typeof SIMULATION_SCENARIOS[0]) => {
        setSelectedScenario(scenario);
        handlePageChange('simulation-with-scenario');
    };

    const handleSimulationComplete = (transcript: Message[], assessment: SelfAssessment | null) => {
        setSimulationTranscript(transcript);
        setPrefilledSelfAssessment(assessment);
        handlePageChange('review');
    };

    const handleReviewComplete = (data: any) => {
        console.log('Review complete:', data);
        handleGoHome();
    };

    if (appState.showSplash) {
        return <SplashScreen onComplete={handleSplashComplete} />;
    }

    return (
        <div className={`container ${contentVisible ? 'fade-in' : ''}`} style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div style={{ flex: 1 }}>
                <Header 
                    currentView={appState.currentView}
                    onViewChange={handleViewChange}
                    onTitleClick={handleGoHome}
                />
                <AboutCurriculumLink />

                {appState.currentView === 'caseworker' ? (
                    <>
                        {appState.page === 'home' && <HomePage onSelectPage={handlePageChange} />}
                        {appState.page === 'scenario-selection' && <ScenarioSelectionPage onScenarioSelect={handleScenarioSelect} />}
                        {appState.page === 'simulation' && <SimulationPage onComplete={handleSimulationComplete} />}
                        {appState.page === 'simulation-with-scenario' && selectedScenario && (
                            <SimulationPageWithScenario 
                                scenario={selectedScenario} 
                                onComplete={handleSimulationComplete} 
                            />
                        )}
                        {appState.page === 'review' && (
                            <ReviewPage 
                                simulationTranscript={simulationTranscript}
                                prefilledAssessment={prefilledSelfAssessment}
                                onComplete={handleReviewComplete}
                            />
                        )}
                        {appState.page === 'qa' && <QAPage />}
                    </>
                ) : (
                    <SupervisorDashboard onBack={handleGoHome} />
                )}
            </div>
            
            {/* Footer */}
            <footer style={{
                marginTop: 'var(--unit-10)',
                paddingTop: 'var(--unit-8)',
                paddingBottom: 'var(--unit-8)',
                textAlign: 'center'
            }}>
                <div className="flex items-center gap-2" style={{
                    justifyContent: 'center'
                }}>
                    <img 
                        src="/google.png" 
                        alt="Google logo" 
                        className="h-6 w-auto"
                        style={{ height: '24px', width: 'auto' }}
                    />
                    <span className="text-xs" style={{
                        fontSize: '0.75rem',
                        color: 'var(--on-surface-variant)'
                    }}>
                        Built by <a href="mailto:gabbyburke@google.com" className="text-blue-300 hover:text-white transition-colors" style={{
                            color: 'var(--primary)',
                            textDecoration: 'none'
                        }}>Gabby Burke</a> and <a href="mailto:williszhang@google.com" className="text-blue-300 hover:text-white transition-colors" style={{
                            color: 'var(--primary)',
                            textDecoration: 'none'
                        }}>Willis Zhang</a>
                    </span>
                </div>
            </footer>
        </div>
    );
}

//endregion
