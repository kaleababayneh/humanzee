import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Typography,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  Avatar,
  Container,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import MessageIcon from '@mui/icons-material/Message';
import SendIcon from '@mui/icons-material/Send';
import EditIcon from '@mui/icons-material/Edit';
import SecurityIcon from '@mui/icons-material/Security';
import LinkIcon from '@mui/icons-material/Link';
import AddIcon from '@mui/icons-material/Add';
import FaceIcon from '@mui/icons-material/Face';
import VerifiedIcon from '@mui/icons-material/Verified';
import { keyframes } from '@emotion/react';
import { type DeployedBBoardAPI, type BBoardDerivedState } from '../../../api/src/index';
import { type Post } from '../../../contract/src/index';
import { FaceScan } from './FaceScan';
import { getFaceHashHex } from '../utils/faceRecognition';

interface SimpleBoardProps {
  deployedBoardAPI?: DeployedBBoardAPI;
  onCreateBoard?: () => void;
  onJoinBoard?: (address: string) => void;
  isConnecting?: boolean; // Add loading state prop
  faceRecognitionAvailable?: boolean; // Add face recognition availability
}

export const SimpleBoard: React.FC<SimpleBoardProps> = ({ 
  deployedBoardAPI, 
  onCreateBoard, 
  onJoinBoard,
  isConnecting = false,
  faceRecognitionAvailable = false
}) => {
  // Remove userName state - no longer needed
  const [faceIdentity, setFaceIdentity] = useState<string>(''); // Face hash as identity
  const [displayName, setDisplayName] = useState<string>(''); // Short display name
  const [liveliness, setLiveliness] = useState<number>(100); // Will be set by face scan
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isBiometricVerified, setIsBiometricVerified] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null);
  const [showFaceScan, setShowFaceScan] = useState(false);
  const [message, setMessage] = useState('');
  const [boardState, setBoardState] = useState<BBoardDerivedState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [contractAddress, setContractAddress] = useState('');

  // Subscribe to board state updates
  useEffect(() => {
    if (!deployedBoardAPI) return;

    const subscription = deployedBoardAPI.state$.subscribe({
      next: (state) => {
        setBoardState(state);
        setError('');
      },
      error: (err) => {
        setError(err.message || 'Failed to load board state');
      }
    });

    return () => subscription.unsubscribe();
  }, [deployedBoardAPI]);

  const handleSignIn = useCallback(() => {
    if (!deployedBoardAPI) return;

    // Start biometric authentication flow
    setShowFaceScan(true);
    setError('');
  }, [deployedBoardAPI]);

  const handleFaceScanComplete = useCallback(async (
    faceData: Float32Array, 
    detectedLiveliness: number
  ) => {
    setShowFaceScan(false);
    
    try {
      setIsLoading(true);
      
      // Generate face hash as identity
      const faceHash = await getFaceHashHex(faceData);
      setFaceIdentity(faceHash);
      setFaceDescriptor(faceData);
      setLiveliness(detectedLiveliness);
      setIsBiometricVerified(true);
      setIsSignedIn(true);
      
      // Generate a display name from face hash
      const shortDisplayName = `User_${faceHash.substring(0, 8)}`;
      setDisplayName(shortDisplayName);
      
      console.log('🎭 Face-based identity generated:', {
        faceHash: faceHash.substring(0, 16) + '...', 
        liveliness: detectedLiveliness,
        displayName: shortDisplayName,
        descriptorLength: faceData.length
      });
      
      setError('');
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to process face scan:', error);
      setError('Failed to generate biometric identity');
      setIsBiometricVerified(false);
      setIsSignedIn(false);
      setIsLoading(false);
    }
  }, []);

  const handleFaceScanCancel = useCallback(() => {
    setShowFaceScan(false);
    setError('');
  }, []);

  const handleSignOut = useCallback(() => {
    setIsSignedIn(false);
    setIsBiometricVerified(false);
    setFaceIdentity('');
    setDisplayName('');
    setFaceDescriptor(null);
    setMessage('');
    setLiveliness(100); // Reset to default
    setError('');
  }, []);

  const handlePostMessage = useCallback(async () => {
    if (!deployedBoardAPI || !message.trim() || !faceIdentity || !isBiometricVerified) return;

    setIsLoading(true);
    setError('');

    try {
      console.log('📤 Posting message using authorizeAndPost', { 
        message, 
        faceHash: faceIdentity.substring(0, 16) + '...', 
        displayName,
        liveliness,
        descriptorLength: faceDescriptor?.length
      });

      // Use face hash as user identity for the API call
      await deployedBoardAPI.authorizeAndPost(faceIdentity, message, displayName, BigInt(liveliness));

      // Clear message after successful post
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post message');
    } finally {
      setIsLoading(false);
    }
  }, [deployedBoardAPI, faceIdentity, displayName, message, liveliness, isBiometricVerified, faceDescriptor]);

  const handleCreateBoard = useCallback(() => {
    setError('');
    onCreateBoard?.();
  }, [onCreateBoard]);

  const handleJoinBoard = useCallback(() => {
    if (!contractAddress.trim()) return;
    setError('');
    onJoinBoard?.(contractAddress);
  }, [contractAddress, onJoinBoard]);

  // Add floating animation keyframes
  const float = keyframes`
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
  `;

  const glow = keyframes`
    0%, 100% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.3); }
    50% { box-shadow: 0 0 30px rgba(102, 126, 234, 0.6); }
  `;

  // Format contract address for display
  const getShortAddress = (address: string) => {
    if (address.length <= 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  // Format timestamp for posts
  const formatTimestamp = (timestamp: number) => {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  // If no board is connected, show connection interface
  if (!deployedBoardAPI) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
        <Card 
          sx={{ 
            maxWidth: 700, 
            mx: 'auto',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            animation: `${float} 6s ease-in-out infinite`,
          }}
        >
            <CardContent sx={{ p: 6 }}>
              <Stack spacing={4} alignItems="center">
                {/* Beautiful Header */}
                <Box textAlign="center">
                  <Avatar 
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      mx: 'auto', 
                      mb: 3,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      animation: `${glow} 3s ease-in-out infinite`,
                    }}
                  >
                    <MessageIcon sx={{ fontSize: 40 }} />
                  </Avatar>
                  <Typography 
                    variant="h3" 
                    gutterBottom
                    sx={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      backgroundClip: 'text',
                      textFillColor: 'transparent',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontWeight: 800,
                    }}
                  >
                    🚀 Biometric Bulletin Board
                  </Typography>
                  <Typography 
                    variant="h6" 
                    color="rgba(255, 255, 255, 0.9)" 
                    sx={{ mb: 4, fontWeight: 400 }}
                  >
                    Secure messaging with face recognition authentication
                  </Typography>
                </Box>

                {/* Connection Options */}
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ width: '100%' }}>
                  <Box sx={{ flex: 1 }}>
                    
                      <Card 
                        sx={{ 
                          height: '100%',
                          background: 'rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          transition: 'all 0.3s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-8px)',
                            boxShadow: '0 20px 40px rgba(102, 126, 234, 0.4)',
                          },
                        }}
                      >
                        <CardContent sx={{ p: 4, textAlign: 'center' }}>
                          <AddIcon sx={{ fontSize: 48, color: '#667eea', mb: 2 }} />
                          <Typography variant="h6" color="rgba(255, 255, 255, 0.9)" gutterBottom>
                            Create New Board
                          </Typography>
                          <Typography variant="body2" color="rgba(255, 255, 255, 0.7)" sx={{ mb: 3 }}>
                            Deploy a fresh bulletin board smart contract
                          </Typography>
                          <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            onClick={handleCreateBoard}
                            disabled={isConnecting}
                            startIcon={isConnecting ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                            sx={{ 
                              py: 1.5,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                              },
                            }}
                          >
                            {isConnecting ? 'Creating...' : 'Create Board'}
                          </Button>
                        </CardContent>
                      </Card>
                    
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    
                      <Card 
                        sx={{ 
                          height: '100%',
                          background: 'rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          transition: 'all 0.3s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-8px)',
                            boxShadow: '0 20px 40px rgba(236, 72, 153, 0.4)',
                          },
                        }}
                      >
                        <CardContent sx={{ p: 4, textAlign: 'center' }}>
                          <LinkIcon sx={{ fontSize: 48, color: '#ec4899', mb: 2 }} />
                          <Typography variant="h6" color="rgba(255, 255, 255, 0.9)" gutterBottom>
                            Join Existing Board
                          </Typography>
                          <Typography variant="body2" color="rgba(255, 255, 255, 0.7)" sx={{ mb: 3 }}>
                            Connect to an existing smart contract
                          </Typography>
                          <Stack spacing={2}>
                            <TextField
                              label="Contract Address"
                              value={contractAddress}
                              onChange={(e) => setContractAddress(e.target.value)}
                              fullWidth
                              size="medium"
                              placeholder="0x..."
                              sx={{
                                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.8)' },
                                '& .MuiOutlinedInput-root': {
                                  color: 'rgba(255, 255, 255, 0.9)',
                                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                                  '&.Mui-focused fieldset': { borderColor: '#ec4899' },
                                },
                              }}
                            />
                            <Button
                              variant="outlined"
                              onClick={handleJoinBoard}
                              disabled={!contractAddress.trim() || isConnecting}
                              startIcon={<LinkIcon />}
                              sx={{ 
                                py: 1.5,
                                borderColor: '#ec4899',
                                color: '#ec4899',
                                '&:hover': {
                                  borderColor: '#ec4899',
                                  backgroundColor: 'rgba(236, 72, 153, 0.1)',
                                },
                              }}
                            >
                              Join Board
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    
                  </Box>
                </Stack>

                {error && (
                  
                    <Alert 
                      severity="error" 
                      onClose={() => setError('')}
                      sx={{ 
                        width: '100%',
                        background: 'rgba(239, 68, 68, 0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: 'rgba(255, 255, 255, 0.9)',
                      }}
                    >
                      {error}
                    </Alert>
                  
                )}
              </Stack>
            </CardContent>
          </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Beautiful Header with board info */}
      
        <Card 
          sx={{ 
            mb: 4,
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ py: 3 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
              <Box>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundClip: 'text',
                    textFillColor: 'transparent',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 700,
                    mb: 1,
                  }}
                >
                  📋 Biometric Bulletin Board
                </Typography>
                <Tooltip title={deployedBoardAPI.deployedContractAddress}>
                  <Chip
                    icon={<LinkIcon />}
                    label={`Contract: ${getShortAddress(deployedBoardAPI.deployedContractAddress)}`}
                    variant="outlined"
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.8)',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      '&:hover': {
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  />
                </Tooltip>
              </Box>
              {isSignedIn && (
                <Stack direction="row" spacing={2} alignItems="center">
                  <Chip
                    icon={<SecurityIcon />}
                    label={`Liveliness: ${liveliness}%`}
                    color={liveliness >= 85 ? 'success' : liveliness >= 75 ? 'warning' : 'default'}
                    sx={{ 
                      fontWeight: 600,
                      '&.MuiChip-colorSuccess': {
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                      },
                      '&.MuiChip-colorWarning': {
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: 'white',
                      },
                    }}
                  />
                  <Chip
                    icon={<VerifiedIcon />}
                    label={displayName}
                    onDelete={handleSignOut}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      fontWeight: 600,
                      '& .MuiChip-deleteIcon': { 
                        color: 'rgba(255, 255, 255, 0.8)',
                        '&:hover': { color: 'white' },
                      },
                    }}
                  />
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>
      

      {/* Face Scan Authentication */}
      {showFaceScan && (
        <FaceScan
          onScanComplete={handleFaceScanComplete}
          onCancel={handleFaceScanCancel}
        />
      )}

      {/* Biometric Authentication section */}
      {!isSignedIn && !showFaceScan && (
        
          <Card 
            sx={{ 
              mb: 4,
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={3} alignItems="center">
                <Box textAlign="center">
                  <Avatar 
                    sx={{ 
                      width: 72, 
                      height: 72, 
                      mx: 'auto', 
                      mb: 2,
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      animation: `${glow} 4s ease-in-out infinite`,
                    }}
                  >
                    <FaceIcon sx={{ fontSize: 36 }} />
                  </Avatar>
                  <Typography 
                    variant="h5" 
                    gutterBottom
                    sx={{ 
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      backgroundClip: 'text',
                      textFillColor: 'transparent',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontWeight: 700,
                    }}
                  >
                    🔐 Biometric Authentication
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
                    Scan your face to generate a unique biometric identity for posting messages.
                    Your face will be converted to a cryptographic hash for secure identification.
                  </Typography>
                </Box>
                
                <Button
                  variant="contained"
                  onClick={handleSignIn}
                  disabled={!faceRecognitionAvailable}
                  startIcon={<SecurityIcon />}
                  size="large"
                  sx={{ 
                    px: 6,
                    py: 2,
                    fontSize: '1.1rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 40px rgba(16, 185, 129, 0.5)',
                    },
                    '&:disabled': {
                      background: 'rgba(156, 163, 175, 0.3)',
                      color: 'rgba(156, 163, 175, 0.8)',
                    },
                  }}
                >
                  Start Face Scan Authentication
                </Button>
                
                <Stack direction="row" spacing={4} sx={{ mt: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <VerifiedIcon sx={{ color: '#10b981', fontSize: 20 }} />
                    <Typography variant="caption" color="text.secondary">
                      Real camera with liveness detection
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <SecurityIcon sx={{ color: '#10b981', fontSize: 20 }} />
                    <Typography variant="caption" color="text.secondary">
                      Face descriptor converted to unique hash
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PersonIcon sx={{ color: '#10b981', fontSize: 20 }} />
                    <Typography variant="caption" color="text.secondary">
                      No personal data stored
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        
      )}

      {/* Loading state during face scan processing */}
      {isLoading && (
        
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" sx={{ py: 2 }}>
                <CircularProgress size={24} sx={{ color: '#667eea' }} />
                <Typography variant="h6" color="text.primary">
                  Processing biometric identity...
                </Typography>
              </Stack>
              <LinearProgress 
                sx={{ 
                  mt: 2,
                  background: 'rgba(102, 126, 234, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  },
                }} 
              />
            </CardContent>
          </Card>
        
      )}

      {/* Post message section */}
      {isSignedIn && isBiometricVerified && (
        
          <Card 
            sx={{ 
              mb: 4,
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: 3,
            }}
          >
            <CardHeader 
              avatar={
                <Avatar 
                  sx={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    width: 48,
                    height: 48,
                  }}
                >
                  <EditIcon />
                </Avatar>
              }
              title={
                <Typography variant="h6" fontWeight={700}>
                  📝 Compose Message
                </Typography>
              }
              subheader={
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                  <Chip 
                    size="small" 
                    label={`ID: ${displayName}`} 
                    sx={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      fontWeight: 500,
                    }}
                  />
                  <Chip 
                    size="small" 
                    label={`Hash: ${faceIdentity.substring(0, 12)}...`} 
                    variant="outlined"
                    sx={{ borderColor: 'rgba(102, 126, 234, 0.5)', color: '#667eea' }}
                  />
                  <Chip 
                    size="small" 
                    label={`Liveliness: ${liveliness}%`} 
                    sx={{
                      background: liveliness >= 85 
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                        : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: 'white',
                      fontWeight: 500,
                    }}
                  />
                </Stack>
              }
            />
            <CardContent sx={{ pt: 0 }}>
              <Stack spacing={3}>
                <TextField
                  label="Write a message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  multiline
                  rows={4}
                  fullWidth
                  placeholder="What's on your mind? Share your thoughts with the community..."
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '1rem',
                      '&.Mui-focused': {
                        boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.15)',
                      },
                    },
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      handlePostMessage();
                    }
                  }}
                />
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SecurityIcon sx={{ fontSize: 16 }} />
                    Press Ctrl+Enter to post • Secured by biometric authentication
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={handlePostMessage}
                    disabled={!message.trim() || isLoading}
                    startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                    size="large"
                    sx={{ 
                      px: 4,
                      py: 1.5,
                      background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                      boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 40px rgba(59, 130, 246, 0.5)',
                      },
                      '&:disabled': {
                        background: 'rgba(156, 163, 175, 0.3)',
                        color: 'rgba(156, 163, 175, 0.8)',
                      },
                    }}
                  >
                    {isLoading ? 'Posting...' : 'Post Message'}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        
      )}

      {/* Error display */}
      {error && (
        
          <Alert 
            severity="error" 
            sx={{ 
              mb: 4,
              borderRadius: 2,
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              backdropFilter: 'blur(10px)',
              '& .MuiAlert-icon': {
                color: '#ef4444',
              },
            }} 
            onClose={() => setError('')}
          >
            <Typography variant="body1" fontWeight={600}>
              {error}
            </Typography>
          </Alert>
        
      )}

      {/* Posts list */}
      
        <Card 
          sx={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 3,
          }}
        >
          <CardHeader
            avatar={
              <Avatar 
                sx={{ 
                  background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                  width: 48,
                  height: 48,
                }}
              >
                <MessageIcon />
              </Avatar>
            }
            title={
              <Typography variant="h6" fontWeight={700}>
                📝 Community Messages
              </Typography>
            }
            subheader={
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                <Chip 
                  size="small" 
                  label={`${boardState?.posts.length || 0} message${(boardState?.posts.length || 0) !== 1 ? 's' : ''}`}
                  sx={{ 
                    background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                    color: 'white',
                    fontWeight: 500,
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  Real-time blockchain updates
                </Typography>
              </Stack>
            }
          />
          <CardContent>
            {!boardState?.posts.length ? (
              <Box textAlign="center" sx={{ py: 8 }}>
                <Avatar 
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    mx: 'auto', 
                    mb: 3,
                    background: 'linear-gradient(135deg, rgba(156, 163, 175, 0.2) 0%, rgba(107, 114, 128, 0.2) 100%)',
                    animation: `${float} 6s ease-in-out infinite`,
                  }}
                >
                  <MessageIcon sx={{ fontSize: 40, color: 'rgba(156, 163, 175, 0.8)' }} />
                </Avatar>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No messages yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isSignedIn ? 'Be the first to post a message!' : 'Sign in with face scan to post a message.'}
                </Typography>
              </Box>
            ) : (
              <Stack spacing={3}>
                {boardState.posts.slice().reverse().map((post: Post, index: number) => (
                  
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 3,
                        background: index % 2 === 0 
                          ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)'
                          : 'linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: 3,
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                          borderColor: index % 2 === 0 ? 'rgba(102, 126, 234, 0.3)' : 'rgba(236, 72, 153, 0.3)',
                        },
                      }}
                    >
                      <Stack direction="row" spacing={2}>
                        <Avatar 
                          sx={{ 
                            background: index % 2 === 0 
                              ? 'linear-gradient(135deg, #667eea 0%, #10b981 100%)'
                              : 'linear-gradient(135deg, #ec4899 0%, #3b82f6 100%)',
                            width: 44,
                            height: 44,
                          }}
                        >
                          <PersonIcon />
                        </Avatar>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <SecurityIcon sx={{ fontSize: 14 }} />
                              Biometrically Verified • Post #{Number(post.id)}
                            </Typography>
                            <Chip
                              size="small"
                              label={formatTimestamp(Number(post.timestamp))}
                              variant="outlined"
                              sx={{ 
                                fontSize: '0.75rem',
                                height: 24,
                                borderColor: 'rgba(156, 163, 175, 0.3)',
                                color: 'rgba(107, 114, 128, 0.8)',
                              }}
                            />
                          </Stack>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              mb: 1, 
                              fontWeight: 500,
                              lineHeight: 1.6,
                              wordBreak: 'break-word',
                            }}
                          >
                            {post.message}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <VerifiedIcon sx={{ fontSize: 16, color: '#10b981' }} />
                            <Typography variant="caption" color="text.secondary">
                              Authenticated with face recognition
                            </Typography>
                          </Stack>
                        </Box>
                      </Stack>
                    </Paper>
                  
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      
    </Container>
  );
};