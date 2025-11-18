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
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import MessageIcon from '@mui/icons-material/Message';
import SendIcon from '@mui/icons-material/Send';
import EditIcon from '@mui/icons-material/Edit';
import SecurityIcon from '@mui/icons-material/Security';
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
      <Card sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
        <CardHeader
          title="🔗 Connect to Bulletin Board"
          titleTypographyProps={{ variant: 'h5', textAlign: 'center' }}
        />
        <CardContent>
          <Stack spacing={3}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleCreateBoard}
              disabled={isConnecting}
              startIcon={isConnecting ? <CircularProgress size={20} /> : <MessageIcon />}
            >
              Create New Board
            </Button>
            
            <Divider>OR</Divider>
            
            <Stack direction="row" spacing={2}>
              <TextField
                label="Contract Address"
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                fullWidth
                size="small"
                placeholder="0x..."
              />
              <Button
                variant="outlined"
                onClick={handleJoinBoard}
                disabled={!contractAddress.trim() || isConnecting}
              >
                Join
              </Button>
            </Stack>

            {error && (
              <Alert severity="error" onClose={() => setError('')}>
                {error}
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 2 }}>
      {/* Header with board info */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="📋 Bulletin Board"
          subheader={`Contract: ${(deployedBoardAPI.deployedContractAddress)}`}
          action={
            isSignedIn ? (
              <Stack direction="row" spacing={1}>
                <Chip
                  icon={<SecurityIcon />}
                  label={`Liveliness: ${liveliness}%`}
                  color={liveliness >= 85 ? 'success' : liveliness >= 75 ? 'warning' : 'default'}
                  size="small"
                />
                <Chip
                  icon={<PersonIcon />}
                  label={displayName}
                  onDelete={handleSignOut}
                  color="primary"
                  variant="outlined"
                />
              </Stack>
            ) : null
          }
        />
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
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🔐 Biometric Authentication
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Scan your face to generate a unique biometric identity for posting messages.
              Your face will be converted to a cryptographic hash for secure identification.
            </Typography>
            
            <Button
              variant="contained"
              onClick={handleSignIn}
              disabled={!faceRecognitionAvailable}
              startIcon={<SecurityIcon />}
              fullWidth
              size="large"
            >
              Start Face Scan Authentication
            </Button>
            
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              ✅ Real camera with liveness detection<br/>
              ✅ Face descriptor converted to unique identity hash<br/>
              ✅ No personal data stored - only mathematical hash
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Loading state during face scan processing */}
      {isLoading && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <CircularProgress size={20} />
              <Typography>Processing biometric identity...</Typography>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Post message section */}
      {isSignedIn && isBiometricVerified && (
        <Card sx={{ mb: 3 }}>
          <CardHeader 
            title="📝 Compose Message"
            subheader={`Identity: ${displayName} | Hash: ${faceIdentity.substring(0, 16)}... | Liveliness: ${liveliness}%`}
          />
          <CardContent>
            <Stack spacing={2}>
              <TextField
                label="Write a message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                multiline
                rows={3}
                fullWidth
                placeholder="What's on your mind?"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handlePostMessage();
                  }
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Press Ctrl+Enter to post
                </Typography>
                <Button
                  variant="contained"
                  onClick={handlePostMessage}
                  disabled={!message.trim() || isLoading}
                  startIcon={isLoading ? <CircularProgress size={16} /> : <SendIcon />}
                >
                  Post Message
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Posts list */}
      <Card>
        <CardHeader
          title="📝 Messages"
          subheader={`${boardState?.posts.length || 0} message${(boardState?.posts.length || 0) !== 1 ? 's' : ''}`}
        />
        <CardContent>
          {!boardState?.posts.length ? (
            <Typography color="text.secondary" textAlign="center" py={3}>
              No messages yet. {isSignedIn ? 'Be the first to post!' : 'Sign in to post a message.'}
            </Typography>
          ) : (
            <Stack spacing={2}>
              {boardState.posts.slice().reverse().map((post: Post, index: number) => (
                <Paper key={post.id} elevation={1} sx={{ p: 2 }}>
                  <Stack direction="row" spacing={2}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <PersonIcon />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        {post.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Posted at {formatTimestamp(Number(post.timestamp))} • ID: {Number(post.id)}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};