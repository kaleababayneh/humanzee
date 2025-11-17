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
import { type DeployedBBoardAPI, type BBoardDerivedState } from '../../../api/src/index';
import { type Post } from '../../../contract/src/index';

interface SimpleBoardProps {
  deployedBoardAPI?: DeployedBBoardAPI;
  onCreateBoard?: () => void;
  onJoinBoard?: (address: string) => void;
  isConnecting?: boolean; // Add loading state prop
}

export const SimpleBoard: React.FC<SimpleBoardProps> = ({ 
  deployedBoardAPI, 
  onCreateBoard, 
  onJoinBoard,
  isConnecting = false
}) => {
  const [userName, setUserName] = useState('');
  const [liveliness, setLiveliness] = useState<number>(100); // Default to max value
  const [isSignedIn, setIsSignedIn] = useState(false);
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
    if (!userName.trim() || !deployedBoardAPI) return;

    // For now, just mark as signed in - we'll create credentials when posting
    setIsSignedIn(true);
    setError('');
    
    // Prefill message editor with a signed hint
    setMessage((prev) => prev && prev.trim() !== '' ? prev : `Signed by ${userName}`);
  }, [userName, deployedBoardAPI]);

  const handleSignOut = useCallback(() => {
    setIsSignedIn(false);
    setUserName('');
    setMessage('');
    setLiveliness(100); // Reset to default
  }, []);

  const handlePostMessage = useCallback(async () => {
    if (!deployedBoardAPI || !message.trim() || !userName.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      console.log('📤 Posting message using authorizeAndPost', { message, author: userName, liveliness });

      // Use the same method that works in CLI - authorizeAndPost now accepts liveliness parameter
      await deployedBoardAPI.authorizeAndPost(userName, message, userName, BigInt(liveliness));

      // Clear message after successful post
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post message');
    } finally {
      setIsLoading(false);
    }
  }, [deployedBoardAPI, userName, message, liveliness]);

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
              <Chip
                icon={<PersonIcon />}
                label={userName}
                onDelete={handleSignOut}
                color="primary"
                variant="outlined"
              />
            ) : null
          }
        />
      </Card>

      {/* Sign in section */}
      {!isSignedIn && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  label="Your Name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  size="small"
                  placeholder="Enter your name..."
                  sx={{ flexGrow: 1 }}
                  onKeyPress={(e) => e.key === 'Enter' && handleSignIn()}
                />
                <TextField
                  label="Liveliness"
                  type="number"
                  value={liveliness}
                  onChange={(e) => setLiveliness(Math.max(1, Math.min(100, Number(e.target.value))))}
                  size="small"
                  inputProps={{ min: 1, max: 100 }}
                  sx={{ width: '120px' }}
                  helperText="1-100"
                />
                <Button
                  variant="contained"
                  onClick={handleSignIn}
                  disabled={!userName.trim() }
                  startIcon={isLoading ? <CircularProgress size={16} /> : <EditIcon />}
                >
                  {'Sign'}
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Liveliness determines credential freshness (higher = more live, max 100)
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Post message section */}
      {isSignedIn && (
        <Card sx={{ mb: 3 }}>
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