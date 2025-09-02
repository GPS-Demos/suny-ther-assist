import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Fab,
} from '@mui/material';
import {
  Home,
} from '@mui/icons-material';
import LandingPage from './LandingPage';
import NewSession from './NewSession';
import Patients from './Patients';
import Patient from './Patient';

const App: React.FC = () => {
  // Navigation state
  const [currentView, setCurrentView] = useState<'landing' | 'patients' | 'schedule' | 'newSession' | 'patient'>('landing');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Navigation handlers
  const handleNavigateToPatients = () => {
    setCurrentView('patients');
  };

  const handleNavigateToSchedule = () => {
    setCurrentView('schedule');
  };

  const handleNavigateToNewSession = () => {
    setCurrentView('newSession');
  };

  const handleNavigateToLanding = () => {
    setCurrentView('landing');
    setSelectedPatientId(null);
  };

  const handleNavigateToPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setCurrentView('patient');
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
        onNavigateToLanding={handleNavigateToLanding} 
        onNavigateToNewSession={handleNavigateToNewSession}
        onNavigateToPatient={handleNavigateToPatient}
      />
    );
  }

  if (currentView === 'patient' && selectedPatientId) {
    return (
      <Patient 
        patientId={selectedPatientId}
        onNavigateToLanding={handleNavigateToLanding}
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
        {/* Home Button */}
        <Box sx={{ position: 'fixed', top: 24, left: 24, zIndex: 1202 }}>
          <Fab
            color="primary"
            aria-label="home"
            onClick={handleNavigateToLanding}
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
            <Home />
          </Fab>
        </Box>
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          p: 3,
        }}>
          <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
            <Typography variant="h4" gutterBottom sx={{ color: 'var(--primary)', fontWeight: 600 }}>
              Schedule
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Schedule management functionality coming soon.
            </Typography>
          </Paper>
        </Box>
      </Box>
    );
  }

  // NewSession view - render the dedicated NewSession component
  return <NewSession onNavigateToLanding={handleNavigateToLanding} />;
};

export default App;
