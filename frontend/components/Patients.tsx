import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Fab,
} from '@mui/material';
import {
  ArrowBack,
  Search,
  Visibility,
  Phone,
  Email,
  Edit,
} from '@mui/icons-material';
import { Patient } from '../types/types';
import { mockPatients } from '../utils/mockPatients';

interface PatientsProps {
  onNavigateBack: () => void;
  onNavigateToNewSession: () => void;
  onNavigateToPatient: (patientId: string) => void;
}

const Patients: React.FC<PatientsProps> = ({ onNavigateBack, onNavigateToNewSession, onNavigateToPatient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>(mockPatients);

  // Filter patients based on search term
  React.useEffect(() => {
    if (searchTerm) {
      const filtered = mockPatients.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.primaryConcern?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(mockPatients);
    }
  }, [searchTerm]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
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
        pb: 4, // Add bottom padding
      }}>
        <Paper 
          elevation={3}
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            minHeight: 'calc(100vh - 80px)', // Adjust for reduced padding
            borderRadius: 2,
          }}
        >
          {/* Header */}
          <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
            {/* Back Button */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
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
              <Typography 
                variant="h4" 
                sx={{ 
                  color: 'var(--primary)', 
                  fontWeight: 600,
                }}
              >
                Patients
              </Typography>
            </Box>
            
            {/* Search Bar */}
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search patients by name or condition..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ maxWidth: 400 }}
            />
          </Box>

          {/* Patient List */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Age</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Primary Concern</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Next Session</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Last Session</TableCell>
                    <TableCell sx={{ fontWeight: 600, minWidth: 300 }}>Last Session Summary</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Patient Since</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow 
                      key={patient.id}
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                            {patient.name}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            {patient.contactInfo?.phone && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Phone sx={{ fontSize: 12, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {patient.contactInfo.phone}
                                </Typography>
                              </Box>
                            )}
                            {patient.contactInfo?.email && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Email sx={{ fontSize: 12, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {patient.contactInfo.email}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{patient.age}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {patient.primaryConcern || 'Not specified'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2"
                          color={patient.nextVisit ? 'text.primary' : 'text.secondary'}
                        >
                          {formatDate(patient.nextVisit)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(patient.lastVisit)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 300 }}>
                        <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
                          {patient.lastVisitSummary || 'No summary available'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(patient.patientSince)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton 
                            size="small" 
                            color="primary"
                            aria-label="view patient details"
                            onClick={() => onNavigateToPatient(patient.id)}
                          >
                            <Visibility />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="secondary"
                            aria-label="start new session"
                            onClick={onNavigateToNewSession}
                          >
                            <Edit />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Summary Footer */}
          <Box sx={{ 
            p: 2, 
            borderTop: '1px solid #e0e0e0',
            backgroundColor: '#f5f5f5'
          }}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredPatients.length} of {mockPatients.length} patients
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Patients;
