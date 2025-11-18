import React, { useCallback, useEffect, useState } from 'react';
import { type DeployedBBoardAPI, type BBoardDerivedState } from '../../../api/src/index';
import { type Proposal, type Vote, type Comment } from '../../../contract/src/index';
import { type BoardDeployment } from '../contexts';
import { FaceScan } from './SimpleFaceScan';

// Simple CSS styles
const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'system-ui, sans-serif',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '40px',
    borderBottom: '2px solid #e0e0e0',
    paddingBottom: '20px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    margin: '0 0 10px 0',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    margin: '0',
  },
  card: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    backgroundColor: '#fafafa',
  },
  proposalCard: {
    border: '2px solid #2196f3',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '30px',
    backgroundColor: '#f8f9ff',
  },
  button: {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    cursor: 'pointer',
    margin: '5px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  buttonPrimary: {
    backgroundColor: '#2196f3',
    color: 'white',
  },
  buttonSuccess: {
    backgroundColor: '#4caf50',
    color: 'white',
  },
  buttonDanger: {
    backgroundColor: '#f44336',
    color: 'white',
  },
  buttonSecondary: {
    backgroundColor: '#757575',
    color: 'white',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '16px',
    marginBottom: '10px',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '16px',
    marginBottom: '10px',
    minHeight: '80px',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const,
  },
  voteStats: {
    display: 'flex',
    gap: '20px',
    marginTop: '15px',
  },
  voteCount: {
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  voteFor: {
    backgroundColor: '#e8f5e8',
    color: '#2e7d32',
  },
  voteAgainst: {
    backgroundColor: '#ffebee',
    color: '#c62828',
  },
  status: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
  },
  statusActive: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
  },
  statusPassed: {
    backgroundColor: '#e8f5e8',
    color: '#2e7d32',
  },
  statusRejected: {
    backgroundColor: '#ffebee',
    color: '#c62828',
  },
  loading: {
    textAlign: 'center' as const,
    padding: '40px',
    fontSize: '18px',
    color: '#666',
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '16px',
    borderRadius: '4px',
    marginBottom: '20px',
    border: '1px solid #ffcdd2',
  },
  success: {
    backgroundColor: '#e8f5e8',
    color: '#2e7d32',
    padding: '16px',
    borderRadius: '4px',
    marginBottom: '20px',
    border: '1px solid #c8e6c9',
  },
  commentList: {
    maxHeight: '300px',
    overflowY: 'auto' as const,
  },
  comment: {
    padding: '10px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    marginBottom: '8px',
    fontSize: '14px',
  },
  vote: {
    padding: '8px',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    marginBottom: '6px',
    fontSize: '14px',
  },
  buttonRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const,
    marginTop: '15px',
  },
};

interface VotingBoardProps {
  deployedBoardAPI?: DeployedBBoardAPI;
  onCreateBoard?: () => void;
  onJoinBoard?: (address: string) => void;
  isConnecting?: boolean;
  faceRecognitionAvailable?: boolean;
  currentBoard?: BoardDeployment | null;
}

export const VotingBoard: React.FC<VotingBoardProps> = ({ 
  deployedBoardAPI, 
  onCreateBoard, 
  onJoinBoard,
  isConnecting = false,
  faceRecognitionAvailable = false,
  currentBoard
}) => {
  const [boardState, setBoardState] = useState<BBoardDerivedState | null>(null);
  const [userIdentity, setUserIdentity] = useState('');
  const [commentText, setCommentText] = useState('');
  const [joinAddress, setJoinAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showFaceScan, setShowFaceScan] = useState(false);
  const [pendingAction, setPendingAction] = useState<'voteFor' | 'voteAgainst' | 'comment' | null>(null);

  // Subscribe to board state changes
  useEffect(() => {
    if (!deployedBoardAPI) return;

    const subscription = deployedBoardAPI.state$.subscribe({
      next: (state) => setBoardState(state),
      error: (error) => {
        console.error('State subscription error:', error);
        setMessage({ type: 'error', text: `State error: ${error.message}` });
      },
    });

    return () => subscription.unsubscribe();
  }, [deployedBoardAPI]);

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }, []);

  const handleVoteFor = useCallback(async () => {
    if (!userIdentity.trim()) {
      showMessage('error', 'Please enter a user identity');
      return;
    }

    if (faceRecognitionAvailable) {
      setPendingAction('voteFor');
      setShowFaceScan(true);
      return;
    }

    await executeVoteFor(userIdentity);
  }, [userIdentity, faceRecognitionAvailable]);

  const handleVoteAgainst = useCallback(async () => {
    if (!userIdentity.trim()) {
      showMessage('error', 'Please enter a user identity');
      return;
    }

    if (faceRecognitionAvailable) {
      setPendingAction('voteAgainst');
      setShowFaceScan(true);
      return;
    }

    await executeVoteAgainst(userIdentity);
  }, [userIdentity, faceRecognitionAvailable]);

  const handleComment = useCallback(async () => {
    if (!userIdentity.trim()) {
      showMessage('error', 'Please enter a user identity');
      return;
    }
    if (!commentText.trim()) {
      showMessage('error', 'Please enter a comment');
      return;
    }

    if (faceRecognitionAvailable) {
      setPendingAction('comment');
      setShowFaceScan(true);
      return;
    }

    await executeComment(userIdentity, commentText);
  }, [userIdentity, commentText, faceRecognitionAvailable]);

  const executeVoteFor = async (identity: string) => {
    setLoading(true);
    try {
      await deployedBoardAPI?.authorizeAndVoteFor(identity, BigInt(100));
      showMessage('success', 'Vote FOR submitted successfully!');
    } catch (error: any) {
      showMessage('error', `Failed to vote FOR: ${error.message}`);
    }
    setLoading(false);
  };

  const executeVoteAgainst = async (identity: string) => {
    setLoading(true);
    try {
      await deployedBoardAPI?.authorizeAndVoteAgainst(identity, BigInt(100));
      showMessage('success', 'Vote AGAINST submitted successfully!');
    } catch (error: any) {
      showMessage('error', `Failed to vote AGAINST: ${error.message}`);
    }
    setLoading(false);
  };

  const executeComment = async (identity: string, comment: string) => {
    setLoading(true);
    try {
      await deployedBoardAPI?.authorizeAndComment(identity, comment, BigInt(100));
      showMessage('success', 'Comment submitted successfully!');
      setCommentText('');
    } catch (error: any) {
      showMessage('error', `Failed to comment: ${error.message}`);
    }
    setLoading(false);
  };

  const handleExecuteProposal = async () => {
    setLoading(true);
    try {
      await deployedBoardAPI?.executeProposal();
      showMessage('success', 'Proposal executed successfully!');
    } catch (error: any) {
      showMessage('error', `Failed to execute proposal: ${error.message}`);
    }
    setLoading(false);
  };

  const onFaceRecognized = useCallback(async (faceHash: string) => {
    setShowFaceScan(false);
    const faceIdentity = faceHash;

    try {
      switch (pendingAction) {
        case 'voteFor':
          await executeVoteFor(faceIdentity);
          break;
        case 'voteAgainst':
          await executeVoteAgainst(faceIdentity);
          break;
        case 'comment':
          await executeComment(faceIdentity, commentText);
          break;
      }
    } catch (error: any) {
      showMessage('error', `Action failed: ${error.message}`);
    }

    setPendingAction(null);
  }, [pendingAction, commentText]);

  const onFaceScanCancel = useCallback(() => {
    setShowFaceScan(false);
    setPendingAction(null);
  }, []);

  if (showFaceScan) {
    return (
      <div style={styles.container}>
        <FaceScan
          onFaceRecognized={onFaceRecognized}
          onCancel={onFaceScanCancel}
        />
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          Connecting to voting contract...
        </div>
      </div>
    );
  }

  if (!deployedBoardAPI) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Midnight Voting dApp</h1>
          <p style={styles.subtitle}>Decentralized governance with privacy</p>
        </div>

        <div style={styles.card}>
          <h2>Get Started</h2>
          <div style={styles.buttonRow}>
            <button 
              style={{...styles.button, ...styles.buttonPrimary}}
              onClick={onCreateBoard}
            >
              Create New Voting Contract
            </button>
          </div>
          
          <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eee' }} />
          
          <h3>Join Existing Contract</h3>
          <input
            type="text"
            placeholder="Enter contract address"
            value={joinAddress}
            onChange={(e) => setJoinAddress(e.target.value)}
            style={styles.input}
          />
          <button 
            style={{...styles.button, ...styles.buttonSecondary}}
            onClick={() => onJoinBoard?.(joinAddress)}
            disabled={!joinAddress.trim()}
          >
            Join Contract
          </button>
        </div>
      </div>
    );
  }

  if (!boardState) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          Loading voting contract data...
        </div>
      </div>
    );
  }

  const proposal = boardState.proposal;
  const getStatusStyle = (executed: number) => {
    switch (executed) {
      case 0: return { ...styles.status, ...styles.statusActive };
      case 1: return { ...styles.status, ...styles.statusRejected };
      case 2: return { ...styles.status, ...styles.statusPassed };
      default: return styles.status;
    }
  };

  const getStatusText = (executed: number) => {
    switch (executed) {
      case 0: return 'Active';
      case 1: return 'Rejected';
      case 2: return 'Passed';
      default: return 'Unknown';
    }
  };

  const isVotingOpen = proposal.executed === 0;
  const deadline = new Date(Number(proposal.deadline_timestamp) * 1000);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Voting Contract</h1>
        <p style={styles.subtitle}>Contract: {deployedBoardAPI.deployedContractAddress}</p>
      </div>

      {message && (
        <div style={message.type === 'success' ? styles.success : styles.error}>
          {message.text}
        </div>
      )}

      {/* Proposal Details */}
      <div style={styles.proposalCard}>
        <h2>Proposal #{proposal.id}</h2>
        <p style={{ fontSize: '18px', margin: '10px 0' }}>{proposal.description}</p>
        
        <div style={styles.voteStats}>
          <div style={{...styles.voteCount, ...styles.voteFor}}>
            FOR: {proposal.votes_for.toString()}
          </div>
          <div style={{...styles.voteCount, ...styles.voteAgainst}}>
            AGAINST: {proposal.votes_against.toString()}
          </div>
          <div style={getStatusStyle(proposal.executed)}>
            {getStatusText(proposal.executed)}
          </div>
        </div>

        <p style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
          Deadline: {deadline.toLocaleString()}
        </p>
      </div>

      {/* Voting Interface */}
      {isVotingOpen && (
        <div style={styles.card}>
          <h3>Cast Your Vote</h3>
          <input
            type="text"
            placeholder="Enter your identity (e.g., user@example.com)"
            value={userIdentity}
            onChange={(e) => setUserIdentity(e.target.value)}
            style={styles.input}
          />
          
          <div style={styles.buttonRow}>
            <button 
              style={{...styles.button, ...styles.buttonSuccess}}
              onClick={handleVoteFor}
              disabled={loading || !userIdentity.trim()}
            >
              Vote FOR
            </button>
            <button 
              style={{...styles.button, ...styles.buttonDanger}}
              onClick={handleVoteAgainst}
              disabled={loading || !userIdentity.trim()}
            >
              Vote AGAINST
            </button>
          </div>
        </div>
      )}

      {/* Comments */}
      <div style={styles.card}>
        <h3>Comments</h3>
        
        {proposal.executed !== 1 && ( // Not rejected
          <>
            <input
              type="text"
              placeholder="Enter your identity"
              value={userIdentity}
              onChange={(e) => setUserIdentity(e.target.value)}
              style={styles.input}
            />
            <textarea
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              style={styles.textarea}
            />
            <button 
              style={{...styles.button, ...styles.buttonPrimary}}
              onClick={handleComment}
              disabled={loading || !userIdentity.trim() || !commentText.trim()}
            >
              Add Comment
            </button>
          </>
        )}

        <div style={styles.commentList}>
          {boardState.comments.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>No comments yet</p>
          ) : (
            boardState.comments.map((comment, index) => (
              <div key={index} style={styles.comment}>
                <strong>{comment.commenter_hash.slice(0, 8)}...:</strong> {comment.comment}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Authority Actions */}
      {boardState.isAuthority && proposal.executed === 0 && (
        <div style={styles.card}>
          <h3>Authority Actions</h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
            As the contract authority, you can execute the proposal after the deadline.
          </p>
          <button 
            style={{...styles.button, ...styles.buttonSecondary}}
            onClick={handleExecuteProposal}
            disabled={loading}
          >
            Execute Proposal
          </button>
        </div>
      )}

      {/* Vote History */}
      <div style={styles.card}>
        <h3>Vote History ({boardState.votes.length} votes)</h3>
        {boardState.votes.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No votes cast yet</p>
        ) : (
          <div style={styles.commentList}>
            {boardState.votes.map((vote, index) => (
              <div key={index} style={styles.vote}>
                <strong>{vote.voter_hash.slice(0, 8)}...:</strong> 
                <span style={{ 
                  color: vote.vote_type ? '#2e7d32' : '#c62828',
                  fontWeight: 'bold',
                  marginLeft: '8px'
                }}>
                  {vote.vote_type ? 'FOR' : 'AGAINST'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {loading && (
        <div style={styles.loading}>
          Processing transaction...
        </div>
      )}
    </div>
  );
};