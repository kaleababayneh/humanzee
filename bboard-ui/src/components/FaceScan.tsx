import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Stack,
  CircularProgress,
  Alert,
  LinearProgress,
  Chip,
  Avatar,
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import FaceIcon from '@mui/icons-material/Face';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface FaceScanProps {
  userName: string;
  onScanComplete: (result: {
    success: boolean;
    liveliness: number;
    faceId: string;
    error?: string;
  }) => void;
  onCancel: () => void;
}

interface BiometricResult {
  liveliness: number;
  faceId: string;
  confidence: number;
}

export const FaceScan: React.FC<FaceScanProps> = ({
  userName,
  onScanComplete,
  onCancel
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [result, setResult] = useState<BiometricResult | null>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const [showMockCamera, setShowMockCamera] = useState(false);

  // Mock biometric analysis
  const performBiometricAnalysis = useCallback((): Promise<BiometricResult> => {
    return new Promise((resolve) => {
      const steps = [
        'Initializing camera...',
        'Detecting face...',
        'Analyzing facial features...',
        'Checking eye movement...',
        'Detecting micro-expressions...',
        'Verifying liveliness...',
        'Generating biometric signature...',
        'Finalizing analysis...'
      ];

      let stepIndex = 0;
      const stepInterval = setInterval(() => {
        if (stepIndex < steps.length) {
          setCurrentStep(steps[stepIndex]);
          setScanProgress(((stepIndex + 1) / steps.length) * 100);
          stepIndex++;
        } else {
          clearInterval(stepInterval);
          
          // Generate mock biometric result
          const liveliness = Math.floor(Math.random() * 31) + 70; // 70-100
          const confidence = Math.floor(Math.random() * 21) + 80; // 80-100
          const faceId = `face_${userName}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          
          setTimeout(() => {
            resolve({
              liveliness,
              faceId,
              confidence
            });
          }, 500);
        }
      }, 600); // Each step takes 600ms
    });
  }, [userName]);

  const startFaceScan = useCallback(async () => {
    setIsScanning(true);
    setShowMockCamera(true);
    setScanProgress(0);
    setCurrentStep('');
    setResult(null);

    try {
      const biometricResult = await performBiometricAnalysis();
      setResult(biometricResult);
      
      // Check if biometric scan was successful
      if (biometricResult.confidence >= 85 && biometricResult.liveliness >= 70) {
        setTimeout(() => {
          onScanComplete({
            success: true,
            liveliness: biometricResult.liveliness,
            faceId: biometricResult.faceId
          });
        }, 1000);
      } else {
        setTimeout(() => {
          onScanComplete({
            success: false,
            liveliness: biometricResult.liveliness,
            faceId: biometricResult.faceId,
            error: 'Biometric verification failed. Please try again.'
          });
        }, 1000);
      }
    } catch (error) {
      onScanComplete({
        success: false,
        liveliness: 0,
        faceId: '',
        error: 'Face scan failed. Please try again.'
      });
    } finally {
      setIsScanning(false);
    }
  }, [onScanComplete, performBiometricAnalysis]);

  // Mock camera feed effect
  useEffect(() => {
    if (!showMockCamera) return;

    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || !videoRef.current) return;

    // Create animated mock camera feed
    let frame = 0;
    const animate = () => {
      if (!showMockCamera) return;
      
      // Create gradient background simulating camera feed
      const gradient = ctx.createRadialGradient(160, 120, 0, 160, 120, 200);
      gradient.addColorStop(0, `hsl(${(frame * 2) % 360}, 20%, 30%)`);
      gradient.addColorStop(1, `hsl(${(frame * 2 + 180) % 360}, 20%, 10%)`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 320, 240);
      
      // Add scanning overlay
      if (isScanning) {
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(80, 60, 160, 120);
        
        // Add scanning line
        const scanLine = (frame * 3) % 240;
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, scanLine);
        ctx.lineTo(320, scanLine);
        ctx.stroke();
      }
      
      // Update canvas in DOM
      if (videoRef.current) {
        const existingCanvas = videoRef.current.querySelector('canvas');
        if (existingCanvas) {
          existingCanvas.remove();
        }
        canvas.style.width = '100%';
        canvas.style.height = 'auto';
        canvas.style.borderRadius = '8px';
        videoRef.current.appendChild(canvas);
      }
      
      frame++;
      requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      setShowMockCamera(false);
    };
  }, [showMockCamera, isScanning]);

  const getLivelinessColor = (liveliness: number) => {
    if (liveliness >= 90) return 'success';
    if (liveliness >= 80) return 'warning';
    return 'error';
  };

  const getLivelinessLabel = (liveliness: number) => {
    if (liveliness >= 95) return 'Excellent';
    if (liveliness >= 90) return 'Very Good';
    if (liveliness >= 80) return 'Good';
    if (liveliness >= 70) return 'Acceptable';
    return 'Poor';
  };

  return (
    <Card sx={{ maxWidth: 500, mx: 'auto' }}>
      <CardContent>
        <Stack spacing={3}>
          {/* Header */}
          <Box textAlign="center">
            <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 2, width: 56, height: 56 }}>
              <SecurityIcon fontSize="large" />
            </Avatar>
            <Typography variant="h5" gutterBottom>
              Biometric Authentication
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Scan your face for identity verification
            </Typography>
            <Chip 
              icon={<FaceIcon />} 
              label={`User: ${userName}`} 
              variant="outlined" 
              sx={{ mt: 1 }}
            />
          </Box>

          {/* Camera Feed */}
          <Box
            sx={{
              height: 200,
              bgcolor: 'grey.100',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}
            ref={videoRef}
          >
            {!showMockCamera && (
              <Stack alignItems="center" spacing={1}>
                <CameraAltIcon sx={{ fontSize: 48, color: 'grey.400' }} />
                <Typography color="text.secondary">
                  Camera Preview
                </Typography>
              </Stack>
            )}
          </Box>

          {/* Scanning Progress */}
          {isScanning && (
            <Stack spacing={2}>
              <LinearProgress variant="determinate" value={scanProgress} />
              <Typography variant="body2" textAlign="center">
                {currentStep}
              </Typography>
            </Stack>
          )}

          {/* Results */}
          {result && (
            <Alert 
              severity={result.confidence >= 85 ? "success" : "warning"}
              icon={result.confidence >= 85 ? <CheckCircleIcon /> : undefined}
            >
              <Typography variant="subtitle2" gutterBottom>
                Biometric Analysis Complete
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                <Chip
                  size="small"
                  label={`Liveliness: ${result.liveliness}% (${getLivelinessLabel(result.liveliness)})`}
                  color={getLivelinessColor(result.liveliness)}
                />
                <Chip
                  size="small"
                  label={`Confidence: ${result.confidence}%`}
                  color={result.confidence >= 85 ? 'success' : 'warning'}
                />
              </Stack>
            </Alert>
          )}

          {/* Action Buttons */}
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={isScanning}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={startFaceScan}
              disabled={isScanning}
              startIcon={isScanning ? <CircularProgress size={16} /> : <SecurityIcon />}
              fullWidth
            >
              {isScanning ? 'Scanning...' : 'Start Face Scan'}
            </Button>
          </Stack>

          {/* Instructions */}
          <Typography variant="caption" color="text.secondary" textAlign="center">
            Look directly at the camera and keep your face in the frame during scanning.
            The system will automatically detect your liveliness level.
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};