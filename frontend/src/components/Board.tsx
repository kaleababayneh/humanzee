// Legacy Board component - deprecated, use SimpleBoard instead
import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

export interface BoardProps {
  boardDeployment$?: any;
}

export const Board: React.FC<Readonly<BoardProps>> = ({ boardDeployment$ }) => {
  return (
    <Card sx={{ width: 275, height: 300 }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          Legacy board component - use SimpleBoard instead
        </Typography>
      </CardContent>
    </Card>
  );
};
