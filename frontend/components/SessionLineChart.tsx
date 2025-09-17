import React from 'react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area } from 'recharts';
import { Box, Typography } from '@mui/material';
import { formatDuration } from '../utils/timeUtils';
import { ChartDataPoint, formatDataForChart, interpolateChartData } from '../utils/chartDataUtils';

interface SessionLineChartProps {
  duration: number;
  chartData?: ChartDataPoint[];
  isLiveSession?: boolean;
}

const SessionLineChart: React.FC<SessionLineChartProps> = ({ 
  duration, 
  chartData = [], 
  isLiveSession = false 
}) => {
  // Only show chart if we have at least 2 real data points
  const data = React.useMemo(() => {
    console.log('SessionLineChart - chartData length:', chartData.length, 'duration:', duration);
    
    if (chartData.length >= 2) {
      // Use only real chart data, no interpolation to avoid extra tick marks
      const formattedData = formatDataForChart(chartData);
      console.log('SessionLineChart - using real data:', formattedData);
      return formattedData;
    } else {
      console.log('SessionLineChart - insufficient data points, showing empty chart');
      return [];
    }
  }, [chartData, duration]);

  // Custom tooltip to show real data values
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box sx={{
          backgroundColor: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          p: 1.5,
          boxShadow: 2,
        }}>
          <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>
            {data.timeDisplay || `${label} min`}
          </Typography>
          {payload.map((item: any, index: number) => (
            <Typography 
              key={index}
              variant="caption" 
              sx={{ 
                color: item.color, 
                display: 'block',
                fontSize: '11px'
              }}
            >
              {item.name}: {item.value}%
            </Typography>
          ))}
          {data.isInterpolated && (
            <Typography variant="caption" sx={{ color: '#666', fontSize: '10px', fontStyle: 'italic' }}>
              Interpolated
            </Typography>
          )}
        </Box>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={100}>
      <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <defs>
          <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0b57d0" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#0b57d0" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorAlliance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#9254ea" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#9254ea" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis 
          type="category"
          dataKey="timeDisplay" 
          tick={{ fontSize: 10 }} 
          axisLine={false}
          tickLine={false}
          interval={0}
        />
        <YAxis 
          tick={{ fontSize: 10 }} 
          axisLine={false}
          tickLine={false}
          domain={[0, 100]}
        />
        <Tooltip content={<CustomTooltip />} />
        
        {/* Engagement Level - Blue area */}
        <Area 
          type="monotone" 
          dataKey="engagement" 
          stroke="#0b57d0" 
          fillOpacity={1} 
          fill="url(#colorEngagement)"
          strokeWidth={2}
          name="Engagement Level"
        />
        
        {/* Therapeutic Alliance - Purple area */}
        <Area 
          type="monotone" 
          dataKey="alliance" 
          stroke="#9254ea" 
          fillOpacity={0.7} 
          fill="url(#colorAlliance)"
          strokeWidth={2}
          name="Therapeutic Alliance"
        />
        
        {/* Emotional State - Red line */}
        <Line 
          type="monotone" 
          dataKey="emotional" 
          stroke="#ef4444" 
          strokeWidth={2} 
          dot={false}
          name="Emotional State"
        />
        
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default SessionLineChart;
