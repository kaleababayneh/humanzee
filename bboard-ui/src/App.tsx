import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Alert, 
  CircularProgress,
  Stack,
  Avatar 
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { keyframes } from '@emotion/react';
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

  // Add floating animation
  const float = keyframes`
    0% { transform: translateY(0px); }
    50% { transform: translateY(-15px); }
    100% { transform: translateY(0px); }
  `;

  const glow = keyframes`
    0%, 100% { box-shadow: 0 0 30px rgba(102, 126, 234, 0.4); }
    50% { box-shadow: 0 0 50px rgba(102, 126, 234, 0.8); }
  `;

  const sparkle = keyframes`
    0%, 100% { opacity: 1; transform: scale(1) rotate(0deg); }
    25% { opacity: 0.8; transform: scale(1.1) rotate(90deg); }
    50% { opacity: 1; transform: scale(1) rotate(180deg); }
    75% { opacity: 0.8; transform: scale(1.1) rotate(270deg); }
  `;

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
    console.log('🚀 App: handleCreateBoard called');
    setIsConnecting(true);
    console.log('🔄 App: Starting board deployment...');
    const boardDeployment$ = boardApiProvider.resolve();
    
    boardDeployment$.subscribe({
      next: (deployment) => {
        console.log('📊 App: Board deployment status update:', deployment.status);
        setCurrentBoard(deployment);
        if (deployment.status !== 'in-progress') {
          setIsConnecting(false);
        }
      },
      error: (error) => {
        console.error('❌ App: Failed to create board:', error);
        setCurrentBoard({ status: 'failed', error });
        setIsConnecting(false);
      }
    });
  };

  const handleJoinBoard = (contractAddress: string) => {
    console.log('🔄 Attempting to join board with address:', contractAddress);
    setIsConnecting(true);
    const boardDeployment$ = boardApiProvider.resolve(contractAddress);
    
    boardDeployment$.subscribe({
      next: (deployment) => {
        console.log('📋 Board join deployment update:', deployment.status);
        setCurrentBoard(deployment);
        if (deployment.status !== 'in-progress') {
          setIsConnecting(false);
        }
      },
      error: (error) => {
        console.error('❌ Failed to join board:', error);
        setCurrentBoard({ status: 'failed', error });
        setIsConnecting(false);
      }
    });
  };

  return (
    <Box sx={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 
          'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),' +
          'radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),' +
          'radial-gradient(circle at 40% 40%, rgba(102, 126, 234, 0.2) 0%, transparent 50%)',
        animation: `${sparkle} 20s ease-in-out infinite`,
      },
    }}>
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, py: 4 }}>
        {/* Beautiful Header */}
        
          <Box textAlign="center" mb={6} py={4}>
            <Avatar 
              sx={{ 
                width: 120, 
                height: 120, 
                mx: 'auto', 
                mb: 4,
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)',
                backdropFilter: 'blur(20px)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                animation: `${float} 6s ease-in-out infinite`,
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
              }}
            >
              <Typography sx={{ fontSize: '4rem' }}>🔐</Typography>
            </Avatar>
            <Typography 
              variant="h2" 
              component="h1" 
              sx={{ 
                color: 'white', 
                fontWeight: 800,
                textShadow: '2px 2px 20px rgba(0,0,0,0.3)',
                background: 'linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.8) 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
              }}
            >
              Biometric Bulletin Board
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                color: 'rgba(255,255,255,0.9)', 
                fontWeight: 300,
                textShadow: '1px 1px 10px rgba(0,0,0,0.3)',
                maxWidth: 600,
                mx: 'auto',
                lineHeight: 1.4,
              }}
            >
              Next-generation messaging with face recognition authentication on blockchain
            </Typography>
          </Box>
        

        {/* Face Recognition Status */}
        {isInitializing && (
          
            <Alert 
              severity="info" 
              sx={{ 
                mb: 4, 
                maxWidth: 700, 
                mx: 'auto',
                background: 'rgba(59, 130, 246, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: 3,
                color: 'white',
                '& .MuiAlert-icon': { color: '#60a5fa' },
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <CircularProgress size={24} sx={{ color: '#60a5fa' }} />
                <Box>
                  <Typography variant="body1" fontWeight={600} gutterBottom>
                    🧠 Initializing Neural Networks
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Loading 4 face recognition models: TinyFaceDetector, FaceLandmark68, FaceRecognition, SSDMobileNet
                  </Typography>
                </Box>
              </Stack>
            </Alert>
          
        )}
        
        {faceModelsLoaded && !isInitializing && (
          
            <Alert 
              severity="success" 
              sx={{ 
                mb: 4, 
                maxWidth: 700, 
                mx: 'auto',
                background: 'rgba(16, 185, 129, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 3,
                color: 'white',
                '& .MuiAlert-icon': { color: '#34d399' },
                animation: `${glow} 4s ease-in-out infinite`,
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <CheckCircleIcon sx={{ fontSize: 28, color: '#34d399' }} />
                <Box>
                  <Typography variant="body1" fontWeight={600} gutterBottom>
                    ✅ Biometric System Ready
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Real face recognition enabled • Liveness detection active • 128-dim descriptors ready
                  </Typography>
                </Box>
              </Stack>
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
              currentBoard={currentBoard}
            />
          
        )}
      </Container>
    </Box>
  );
};

export default App;
