import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Container,
} from '@mui/material';
import {
  People,
  CalendarToday,
  Add,
} from '@mui/icons-material';

interface LandingPageProps {
  onNavigateToPatients: () => void;
  onNavigateToSchedule: () => void;
  onNavigateToNewSession: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToPatients,
  onNavigateToSchedule,
  onNavigateToNewSession,
}) => {
  const tiles = [
    {
      title: 'Patients',
      icon: <People sx={{ 
        fontSize: 48, 
        color: 'white',
        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
      }} />,
      description: 'View and manage patient records and session histories',
      onClick: onNavigateToPatients,
      gradient: 'linear-gradient(135deg, #0b57d0 0%, #00639b 100%)',
    },
    {
      title: 'Schedule',
      icon: <CalendarToday sx={{ 
        fontSize: 48, 
        color: 'white',
        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
      }} />,
      description: 'Manage appointments and session scheduling',
      onClick: onNavigateToSchedule,
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    },
    {
      title: 'New Session',
      icon: <Add sx={{ 
        fontSize: 48, 
        color: 'white',
        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
      }} />,
      description: 'Start a new therapy session with real-time analysis',
      onClick: onNavigateToNewSession,
      gradient: 'linear-gradient(135deg, #673ab7 0%, #512da8 100%)',
    },
  ];

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'var(--background-gradient)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <Box sx={{
        background: 'linear-gradient(135deg, rgba(11, 87, 208, 0.95) 0%, rgba(0, 99, 155, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.1)',
        py: 4,
      }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h2"
              sx={{
                color: 'white',
                fontWeight: 700,
                mb: 2,
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
              }}
            >
              Ther-Assist
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: 400,
                maxWidth: 600,
                mx: 'auto',
              }}
            >
              AI-Powered Therapy Assistant for Enhanced Clinical Practice
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ flex: 1, py: 6 }}>
        <Grid container spacing={4} justifyContent="center">
          {tiles.map((tile, index) => (
            <Grid item xs={12} sm={6} md={4} key={tile.title}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.08)',
                  '&:hover': {
                    boxShadow: '0 25px 50px -8px rgba(0, 0, 0, 0.15)',
                    transform: 'translateY(-8px)',
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                }}
              >
                <CardActionArea
                  onClick={tile.onClick}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    p: 0,
                  }}
                >
                  {/* Gradient Header */}
                  <Box
                    sx={{
                      background: tile.gradient,
                      p: 3,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      minHeight: 120,
                    }}
                  >
                    {tile.icon}
                  </Box>

                  {/* Content */}
                  <CardContent sx={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'center',
                    textAlign: 'center',
                    p: 3,
                  }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 600,
                        mb: 2,
                        color: 'var(--primary)',
                      }}
                    >
                      {tile.title}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: 'text.secondary',
                        lineHeight: 1.6,
                      }}
                    >
                      {tile.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Additional Info Section */}
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Paper
            sx={{
              p: 4,
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '16px',
              maxWidth: 800,
              mx: 'auto',
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                mb: 2,
                color: 'var(--primary)',
              }}
            >
              Advanced AI-Driven Clinical Support
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                lineHeight: 1.8,
              }}
            >
              Ther-Assist provides real-time guidance, evidence-based recommendations, 
              and comprehensive session analysis to enhance therapeutic outcomes. 
              Our platform integrates seamlessly with your clinical workflow to support 
              better patient care and professional development.
            </Typography>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default LandingPage;
