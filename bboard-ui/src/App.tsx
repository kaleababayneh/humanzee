import React, { useEffect, useState } from 'react';
import { Box, Typography, Container, Alert } from '@mui/material';
import { SimpleBoard } from './components/SimpleBoard';
import { useDeployedBoardContext } from './hooks';
import { type BoardDeployment } from './contexts';
import { loadModels } from './utils/faceRecognition';
import { initDB } from './utils/storageService';

/**
 * The root bulletin board application component.
 */
const App: React.FC = () => {
  const boardApiProvider = useDeployedBoardContext();
  const [currentBoard, setCurrentBoard] = useState<BoardDeployment | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [faceModelsLoaded, setFaceModelsLoaded] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize face recognition on app start
  useEffect(() => {
    const initializeFaceRecognition = async () => {
      try {
        console.log('🔄 Initializing face recognition...');
        await loadModels();
        await initDB();
        setFaceModelsLoaded(true);
        console.log('✅ Face recognition initialized successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Face recognition initialization failed:', error);
        throw new Error(`Face recognition failed to load: ${errorMessage}`);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeFaceRecognition();
  }, []);

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

        {/* Face Recognition Status */}
        {isInitializing && (
          <Alert 
            severity="info" 
            sx={{ mb: 2, maxWidth: 600, mx: 'auto' }}
          >
            🔄 Initializing face recognition models...
            <br />
            <Typography variant="caption">
              Loading neural networks for real-time face detection and biometric analysis.
            </Typography>
          </Alert>
        )}
        
        {faceModelsLoaded && !isInitializing && (
          <Alert 
            severity="success" 
            sx={{ mb: 2, maxWidth: 600, mx: 'auto' }}
          >
            🔐 Real face recognition enabled with biometric security
          </Alert>
        )}

        {/* Main content - only show when face recognition is ready */}
        {!isInitializing && (
        <SimpleBoard
          deployedBoardAPI={currentBoard?.status === 'deployed' ? currentBoard.api : undefined}
          onCreateBoard={handleCreateBoard}
          onJoinBoard={handleJoinBoard}
          isConnecting={isConnecting}
          faceRecognitionAvailable={faceModelsLoaded}
        />
        )}
      </Container>
    </Box>
  );
};

export default App;
