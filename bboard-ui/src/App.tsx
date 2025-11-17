// This file is part of midnightntwrk/example-counter.
// Copyright (C) 2025 Midnight Foundation
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// You may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
