import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Fab,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Grid,
  Divider,
  Button,
  IconButton,
} from '@mui/material';
import {
  ArrowBack,
  Person,
  Phone,
  Email,
  CalendarToday,
  MedicalServices,
  Add,
  Edit,
  Delete,
} from '@mui/icons-material';
import { Patient as PatientType } from '../types/types';
import { mockPatients } from '../utils/mockPatients';

interface PatientProps {
  patientId: string;
  onNavigateBack: () => void;
  onNavigateToNewSession: (patientId?: string) => void;
}

const Patient: React.FC<PatientProps> = ({ patientId, onNavigateBack, onNavigateToNewSession }) => {
  const patient = mockPatients.find(p => p.id === patientId);
  const sessionHistory = patient?.sessionHistory || [];

  if (!patient) {
    return (
      <Box sx={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--background-gradient)',
      }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error">
            Patient not found
          </Typography>
        </Paper>
      </Box>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'paused':
        return 'warning';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'active':
        return {
          backgroundColor: '#4caf50',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#45a049',
          }
        };
      case 'paused':
        return {
          backgroundColor: '#ff9800',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#f57c00',
          }
        };
      case 'inactive':
        return {
          backgroundColor: '#f44336',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#d32f2f',
          }
        };
      default:
        return {
          backgroundColor: '#9e9e9e',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#757575',
          }
        };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'paused':
        return 'Paused';
      case 'inactive':
        return 'Inactive';
      default:
        return 'Unknown';
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'var(--background-gradient)',
    }}>
      {/* Main Content */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        p: 3,
        gap: 3,
      }}>
        {/* Patient Information Card */}
        <Paper elevation={3} sx={{ borderRadius: 2 }}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
              {/* Back Button */}
              <Fab
                size="medium"
                color="primary"
                aria-label="back"
                onClick={onNavigateBack}
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
              <Avatar
                sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: 'var(--primary)',
                  fontSize: '2rem',
                  fontWeight: 600,
                }}
              >
                {patient.name.split(' ').map(n => n[0]).join('')}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'var(--primary)' }}>
                  {patient.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                  <Chip 
                    label={getStatusLabel(patient.status)}
                    size="small"
                    sx={getStatusStyles(patient.status)}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Age {patient.age}
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => onNavigateToNewSession(patientId)}
                sx={{
                  background: 'linear-gradient(135deg, #0b57d0 0%, #00639b 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #00639b 0%, #0b57d0 100%)',
                    transform: 'scale(1.02)',
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 4px 12px -2px rgba(11, 87, 208, 0.35)',
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                }}
              >
                New Session
              </Button>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Person color="primary" />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Contact Information
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {patient.contactInfo?.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Phone sx={{ fontSize: 20, color: 'text.secondary' }} />
                          <Typography variant="body1">
                            {patient.contactInfo.phone}
                          </Typography>
                        </Box>
                      )}
                      {patient.contactInfo?.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Email sx={{ fontSize: 20, color: 'text.secondary' }} />
                          <Typography variant="body1">
                            {patient.contactInfo.email}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <MedicalServices color="primary" />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Treatment Information
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Primary Concern
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {patient.primaryConcern || 'Not specified'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Patient Since
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(patient.patientSince)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <CalendarToday color="primary" />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Session Schedule
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Next Session
                        </Typography>
                        <Typography variant="body1">
                          {patient.nextVisit ? formatDate(patient.nextVisit) : 'Not scheduled'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Last Session
                        </Typography>
                        <Typography variant="body1">
                          {patient.lastVisit ? formatDate(patient.lastVisit) : 'No previous session'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Last Session Summary
                    </Typography>
                    <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                      {patient.lastVisitSummary || 'No summary available for the last session.'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* Session History */}
        <Paper elevation={3} sx={{ borderRadius: 2 }}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: 'var(--primary)', mb: 3 }}>
              Session History
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Session Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
                    <TableCell sx={{ fontWeight: 600, minWidth: 400 }}>Session Summary</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 120 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sessionHistory.map((session) => (
                    <TableRow key={session.id} hover>
                      <TableCell>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {formatDate(session.date)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {session.duration} minutes
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                          {session.summary}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            sx={{
                              color: 'var(--primary)',
                              '&:hover': {
                                backgroundColor: 'rgba(11, 87, 208, 0.1)',
                                transform: 'scale(1.1)',
                              },
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                            aria-label="edit session"
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            sx={{
                              color: '#f44336',
                              '&:hover': {
                                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                                transform: 'scale(1.1)',
                              },
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                            aria-label="delete session"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ 
              p: 2, 
              mt: 2,
              borderTop: '1px solid #e0e0e0',
              backgroundColor: '#f5f5f5',
              borderRadius: '0 0 8px 8px'
            }}>
              <Typography variant="body2" color="text.secondary">
                Showing {sessionHistory.length} previous sessions
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Patient;
