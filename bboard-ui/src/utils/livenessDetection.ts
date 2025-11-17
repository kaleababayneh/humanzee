import * as faceapi from 'face-api.js';

interface EyeState {
  leftEyeOpen: boolean;
  rightEyeOpen: boolean;
}

// Eye aspect ratio threshold - below this value, eye is considered closed
const EYE_AR_THRESHOLD = 0.28; // Tuned to detect blinks properly

export const detectEyeState = (
  landmarks: faceapi.FaceLandmarks68
): EyeState => {
  const positions = landmarks.positions;

  // Left eye landmarks (indices 36-41)
  const leftEye = positions.slice(36, 42);
  // Right eye landmarks (indices 42-47)
  const rightEye = positions.slice(42, 48);

  const leftEyeAR = calculateEyeAspectRatio(leftEye);
  const rightEyeAR = calculateEyeAspectRatio(rightEye);

  const leftOpen = leftEyeAR > EYE_AR_THRESHOLD;
  const rightOpen = rightEyeAR > EYE_AR_THRESHOLD;

  // Always log eye states for debugging
  console.log('👁️ Eyes - L:', leftEyeAR.toFixed(3), leftOpen ? '✓' : '✗', 
              'R:', rightEyeAR.toFixed(3), rightOpen ? '✓' : '✗',
              'Both:', (leftOpen && rightOpen) ? 'OPEN' : (!leftOpen && !rightOpen) ? 'CLOSED' : 'PARTIAL');

  return {
    leftEyeOpen: leftOpen,
    rightEyeOpen: rightOpen,
  };
};

const calculateEyeAspectRatio = (eyeLandmarks: faceapi.Point[]): number => {
  // Calculate vertical distances
  const v1 = euclideanDistance(eyeLandmarks[1], eyeLandmarks[5]);
  const v2 = euclideanDistance(eyeLandmarks[2], eyeLandmarks[4]);

  // Calculate horizontal distance
  const h = euclideanDistance(eyeLandmarks[0], eyeLandmarks[3]);

  // Eye aspect ratio
  const ear = (v1 + v2) / (2.0 * h);

  return ear;
};

const euclideanDistance = (p1: faceapi.Point, p2: faceapi.Point): number => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

export class LivenessDetector {
  private eyeStateHistory: boolean[] = [];
  private requiredBlinks = 1; // Just require 1 clear blink
  private maxHistoryLength = 50;

  reset() {
    this.eyeStateHistory = [];
    console.log('🔄 Liveness detector reset');
  }

  addFrame(eyeState: EyeState): boolean {
    // Both eyes should be in the same state
    const eyesClosed = !eyeState.leftEyeOpen && !eyeState.rightEyeOpen;
    
    this.eyeStateHistory.push(eyesClosed);

    // Keep history limited
    if (this.eyeStateHistory.length > this.maxHistoryLength) {
      this.eyeStateHistory.shift();
    }

    const hasBlink = this.hasDetectedBlinks();
    
    if (this.eyeStateHistory.length % 5 === 0) {
      const recent = this.eyeStateHistory.slice(-10).map(closed => closed ? 'C' : 'O').join('');
      console.log('📊 History length:', this.eyeStateHistory.length, 'Blinks detected:', this.getBlinkCount(), 'Verified:', hasBlink, 'Recent:', recent);
    }

    return hasBlink;
  }

  hasDetectedBlinks(): boolean {
    if (this.eyeStateHistory.length < 3) return false;

    // Look for transitions: open -> closed -> open
    // Count any complete blink cycle
    let blinkCount = 0;
    let wasOpen = false;
    let wasClosed = false;
    
    for (let i = 0; i < this.eyeStateHistory.length; i++) {
      const isClosed = this.eyeStateHistory[i];
      
      if (!isClosed) {
        // Eyes are open
        if (wasClosed && wasOpen) {
          // We had: open -> closed -> now open again = BLINK!
          blinkCount++;
          console.log('✓ 👁️ BLINK DETECTED! Total:', blinkCount, 'at frame:', i);
          wasClosed = false; // Reset to detect next blink
        }
        wasOpen = true;
      } else {
        // Eyes are closed
        if (wasOpen) {
          wasClosed = true;
        }
      }
    }

    return blinkCount >= this.requiredBlinks;
  }

  getProgress(): number {
    const detected = this.hasDetectedBlinks();
    return detected ? 1 : 0;
  }

  getBlinkCount(): number {
    if (this.eyeStateHistory.length < 3) return 0;

    let blinkCount = 0;
    let wasOpen = false;
    let wasClosed = false;
    
    for (let i = 0; i < this.eyeStateHistory.length; i++) {
      const isClosed = this.eyeStateHistory[i];
      
      if (!isClosed) {
        if (wasClosed && wasOpen) {
          blinkCount++;
          wasClosed = false;
        }
        wasOpen = true;
      } else {
        if (wasOpen) {
          wasClosed = true;
        }
      }
    }
    
    return Math.min(blinkCount, this.requiredBlinks);
  }
}