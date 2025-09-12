import React from 'react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area } from 'recharts';
import { Box, Typography } from '@mui/material';
import { formatDuration } from '../utils/timeUtils';

interface SessionLineChartProps {
  duration: number;
}

const SessionLineChart: React.FC<SessionLineChartProps> = ({ duration }) => {
  const data = Array.from({ length: Math.floor(duration / 60) + 1 }, (_, i) => {
    const time = i * 60;
    return {
      time: formatDuration(time),
      emotionalState: Math.floor(Math.random() * 10),
      engagementLevel: Math.floor(Math.random() * 10),
      therapeuticAlliance: Math.floor(Math.random() * 10),
    };
  });

  return (
    <ResponsiveContainer width="100%" height={100}>
      <ComposedChart data={data}>
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
        <XAxis dataKey="time" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Area type="monotone" dataKey="engagementLevel" stroke="#0b57d0" fillOpacity={1} fill="url(#colorEngagement)" />
        <Area type="monotone" dataKey="therapeuticAlliance" stroke="#9254ea" fillOpacity={1} fill="url(#colorAlliance)" />
        <Line type="monotone" dataKey="emotionalState" stroke="#ef4444" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default SessionLineChart;
