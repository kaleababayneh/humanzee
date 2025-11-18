import React, { useEffect, useState } from 'react';
import { VotingBoard } from './components/VotingBoard';
import { useDeployedBoardContext } from './hooks';
import { type BoardDeployment } from './contexts';

const styles = {
  app: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px 0',
    fontFamily: 'system-ui, sans-serif',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '40px',
    color: 'white',
  },
  title: {
    fontSize: '42px',
    fontWeight: 'bold',
    margin: '20px 0 10px 0',
    textShadow: '2px 2px 20px rgba(0,0,0,0.3)',
  },
  subtitle: {
    fontSize: '20px',
    margin: '0 0 20px 0',
    opacity: 0.9,
    textShadow: '1px 1px 10px rgba(0,0,0,0.3)',
  },
  icon: {
    fontSize: '80px',
    marginBottom: '20px',
  },
  status: {
    maxWidth: '600px',
    margin: '0 auto 30px auto',
    padding: '16px 20px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
  },
  statusInfo: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    color: 'white',
  },
  statusSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: 'white',
  },
  spinner: {
    display: 'inline-block',
    width: '20px',
    height: '20px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  mainContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
  },
};

// Add CSS animation for spinner
const spinnerStyle = document.createElement('style');
spinnerStyle.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(spinnerStyle);

/**
 * The root voting application component.
 */
const App: React.FC = () => {
  const boardApiProvider = useDeployedBoardContext();
  const [currentBoard, setCurrentBoard] = useState<BoardDeployment | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [faceModelsLoaded, setFaceModelsLoaded] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize face recognition on app start - CRITICAL for voting security
  useEffect(() => {
    const initializeFaceRecognition = async () => {
      try {
        console.log('🔄 Initializing face recognition models...');
        
        // Import face recognition utilities dynamically to handle loading
        const { loadModels } = await import('./utils/faceRecognition');
        const { initDB } = await import('./utils/storageService');
        
        // Load all required face recognition models
        await loadModels();
        await initDB();
        
        setFaceModelsLoaded(true);
        console.log('✅ Face recognition models loaded successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Face recognition initialization failed:', error);
        
        // Face recognition is critical - show error but don't block the app completely
        setFaceModelsLoaded(false);
        console.warn('⚠️ Running without face recognition - SECURITY REDUCED');
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
    <div style={styles.app}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.icon}>🗳️</div>
        <h1 style={styles.title}>Midnight DAO Voting dApp</h1>
        <p style={styles.subtitle}>
          Decentralized governance with privacy and face recognition
        </p>
      </div>

      {/* Status Messages */}
      {isInitializing && (
        <div style={{...styles.status, ...styles.statusInfo}}>
          <div style={styles.spinner}></div>
          {' '}🧠 Initializing biometric authentication system...
        </div>
      )}

      {/* Main Content */}
      {!isInitializing && (
        <div style={styles.mainContent}>
          <VotingBoard
            deployedBoardAPI={currentBoard?.status === 'deployed' ? currentBoard.api : undefined}
            onCreateBoard={handleCreateBoard}
            onJoinBoard={handleJoinBoard}
            isConnecting={isConnecting}
            faceRecognitionAvailable={faceModelsLoaded}
            currentBoard={currentBoard}
          />
        </div>
      )}
    </div>
  );
};

export default App;
