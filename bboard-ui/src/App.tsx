import React, { useEffect, useState } from 'react';
import { Box, Typography, Container } from '@mui/material';
import { SimpleBoard } from './components/SimpleBoard';
import { useDeployedBoardContext } from './hooks';
import { type BoardDeployment } from './contexts';

/**
 * The root bulletin board application component.
 */
const App: React.FC = () => {
  const boardApiProvider = useDeployedBoardContext();
  const [currentBoard, setCurrentBoard] = useState<BoardDeployment | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleCreateBoard = () => {
    setIsConnecting(true);
    const boardDeployment$ = boardApiProvider.resolve();
    
    boardDeployment$.subscribe({
      next: (deployment) => {
        setCurrentBoard(deployment);
        setIsConnecting(false);
      },
      error: (error) => {
        console.error('Failed to create board:', error);
        setCurrentBoard({ status: 'failed', error });
        setIsConnecting(false);
      }
    });
  };

  const handleJoinBoard = (contractAddress: string) => {
    setIsConnecting(true);
    const boardDeployment$ = boardApiProvider.resolve(contractAddress);
    
    boardDeployment$.subscribe({
      next: (deployment) => {
        setCurrentBoard(deployment);
        setIsConnecting(false);
      },
      error: (error) => {
        console.error('Failed to join board:', error);
        setCurrentBoard({ status: 'failed', error });
        setIsConnecting(false);
      }
    });
  };

  return (
    <Box sx={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
      minHeight: '100vh',
      py: 2
    }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box textAlign="center" mb={4} py={3}>
          <Typography 
            variant="h3" 
            component="h1" 
            sx={{ 
              color: 'white', 
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            📋 Bulletin Board
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'rgba(255,255,255,0.8)', 
              mt: 1 
            }}
          >
            Decentralized messaging with zero-knowledge privacy
          </Typography>
        </Box>

        {/* Main content */}
        <SimpleBoard
          deployedBoardAPI={currentBoard?.status === 'deployed' ? currentBoard.api : undefined}
          onCreateBoard={handleCreateBoard}
          onJoinBoard={handleJoinBoard}
          isConnecting={isConnecting}
        />
      </Container>
    </Box>
  );
};

export default App;
