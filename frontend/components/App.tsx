import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Fab,
} from '@mui/material';
import {
  ArrowBack,
} from '@mui/icons-material';
import LandingPage from './LandingPage';
import NewSession from './NewSession';
import NewTherSession from './NewTherSession';
import Patients from './Patients';
import Patient from './Patient';
import LoginPage from './LoginPage';
import { useAuth } from '../contexts/AuthContext';

const App: React.FC = () => {
  const { currentUser } = useAuth();

  // Navigation state
  const [currentView, setCurrentView] = useState<'landing' | 'patients' | 'schedule' | 'newSession' | 'patient'>('landing');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [sessionPatientId, setSessionPatientId] = useState<string | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<Array<{
    view: 'landing' | 'patients' | 'schedule' | 'newSession' | 'patient';
    patientId?: string | null;
    sessionPatientId?: string | null;
  }>>([]);

  // If user is not authenticated, show login page
  if (!currentUser) {
    return <LoginPage />;
  }

  // Navigation handlers
  const pushToHistory = (view: typeof currentView, patientId?: string | null) => {
    setNavigationHistory(prev => [...prev, { view: currentView, patientId: selectedPatientId }]);
  };

  const handleNavigateToPatients = () => {
    pushToHistory(currentView, selectedPatientId);
    setCurrentView('patients');
  };

  const handleNavigateToSchedule = () => {
    pushToHistory(currentView, selectedPatientId);
    setCurrentView('schedule');
  };

  const handleNavigateToNewSession = (patientId?: string) => {
    pushToHistory(currentView, selectedPatientId);
    setSessionPatientId(patientId || null);
    setCurrentView('newSession');
  };

  const handleNavigateToLanding = () => {
    setCurrentView('landing');
    setSelectedPatientId(null);
    setNavigationHistory([]);
  };

  const handleNavigateToPatient = (patientId: string) => {
    pushToHistory(currentView, selectedPatientId);
    setSelectedPatientId(patientId);
    setCurrentView('patient');
  };

  const handleGoBack = () => {
    if (navigationHistory.length > 0) {
      const previousView = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory(prev => prev.slice(0, -1));
      setCurrentView(previousView.view);
      setSelectedPatientId(previousView.patientId || null);
    } else {
      // If no history, go to landing page
      handleNavigateToLanding();
    }
  };

  // Render the appropriate view based on current state
  if (currentView === 'landing') {
    return (
      <LandingPage
        onNavigateToPatients={handleNavigateToPatients}
        onNavigateToSchedule={handleNavigateToSchedule}
        onNavigateToNewSession={handleNavigateToNewSession}
      />
    );
  }

  if (currentView === 'patients') {
    return (
      <Patients 
        onNavigateBack={handleGoBack} 
        onNavigateToNewSession={handleNavigateToNewSession}
        onNavigateToPatient={handleNavigateToPatient}
      />
    );
  }

  if (currentView === 'patient' && selectedPatientId) {
    return (
      <Patient 
        patientId={selectedPatientId}
        onNavigateBack={handleGoBack}
        onNavigateToNewSession={handleNavigateToNewSession}
      />
    );
  }

  if (currentView === 'schedule') {
    return (
      <Box sx={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        background: 'var(--background-gradient)',
        overflow: 'hidden',
      }}>
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          p: 3,
        }}>
          <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
            {/* Back Button and Title Row */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, position: 'relative' }}>
              <Fab
                size="medium"
                color="primary"
                aria-label="back"
                onClick={handleGoBack}
                sx={{
                  background: 'linear-gradient(135deg, #0b57d0 0%, #00639b 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #00639b 0%, #0b57d0 100%)',
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 8px 20px -4px rgba(11, 87, 208, 0.35)',
                }}
              >
                <ArrowBack />
              </Fab>
              <Typography 
                variant="h4" 
                sx={{ 
                  color: 'var(--primary)', 
                  fontWeight: 600,
                  position: 'absolute',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '100%',
                  textAlign: 'center'
                }}
              >
                Schedule
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary">
              Schedule management functionality coming soon.
            </Typography>
          </Paper>
        </Box>
      </Box>
    );
  }

  // NewSession view - render the dedicated NewTherSession component
  return <NewTherSession onNavigateBack={handleGoBack} patientId={sessionPatientId} />;
};

export default App;
