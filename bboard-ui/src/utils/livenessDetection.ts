import * as faceapi from 'face-api.js';

interface EyeState {
  leftEyeOpen: boolean;
  rightEyeOpen: boolean;
}

interface HeadPose {
  yaw: number;   // Left/Right rotation (-1 to 1, negative = left, positive = right)
  pitch: number; // Up/Down rotation (-1 to 1)
  roll: number;  // Tilt rotation (-1 to 1)
}

// Eye aspect ratio threshold - below this value, eye is considered closed
const EYE_AR_THRESHOLD = 0.28;

// Head rotation thresholds
const HEAD_ROTATION_THRESHOLD = 0.3; // Minimum rotation required for detection
const REQUIRED_ROTATION_ANGLE = 25; // Degrees

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

  return {
    leftEyeOpen: leftOpen,
    rightEyeOpen: rightOpen,
  };
};

export const detectHeadPose = (
  landmarks: faceapi.FaceLandmarks68
): HeadPose => {
  const positions = landmarks.positions;

  // Key facial landmarks for pose estimation
  const noseTip = positions[30];        // Nose tip
  const leftEyeCorner = positions[36];  // Left eye corner
  const rightEyeCorner = positions[45]; // Right eye corner
  const leftMouth = positions[48];      // Left mouth corner
  const rightMouth = positions[54];     // Right mouth corner
  const chin = positions[8];            // Chin center
  const forehead = positions[27];       // Between eyebrows

  // Calculate face center as a simple object
  const faceCenterX = (leftEyeCorner.x + rightEyeCorner.x) / 2;
  const faceCenterY = (leftEyeCorner.y + rightEyeCorner.y) / 2;

  // Calculate eye line angle for roll
  const eyeDistance = euclideanDistance(leftEyeCorner, rightEyeCorner);
  const eyeAngle = Math.atan2(rightEyeCorner.y - leftEyeCorner.y, rightEyeCorner.x - leftEyeCorner.x);
  const roll = Math.sin(eyeAngle);

  // Calculate yaw (left/right rotation) based on nose position relative to eye center
  const noseOffset = noseTip.x - faceCenterX;
  const faceWidth = eyeDistance;
  const yaw = Math.max(-1, Math.min(1, (noseOffset / faceWidth) * 3));

  // Calculate pitch (up/down) based on nose position relative to eye line
  const noseVerticalOffset = noseTip.y - faceCenterY;
  const eyeToChinDistance = Math.sqrt(
    Math.pow(faceCenterX - chin.x, 2) + Math.pow(faceCenterY - chin.y, 2)
  );
  const pitch = Math.max(-1, Math.min(1, (noseVerticalOffset / eyeToChinDistance) * 2));

  return { yaw, pitch, roll };
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
  private headPoseHistory: HeadPose[] = [];
  private requiredBlinks = 1;
  private maxHistoryLength = 100;
  private blinkDetected = false;
  private leftRotationDetected = false;
  private rightRotationDetected = false;

  reset() {
    this.eyeStateHistory = [];
    this.headPoseHistory = [];
    this.blinkDetected = false;
    this.leftRotationDetected = false;
    this.rightRotationDetected = false;
    console.log('🔄 Liveness detector reset');
  }

  addFrame(eyeState: EyeState, headPose: HeadPose): boolean {
    // Track eye states for blink detection
    const eyesClosed = !eyeState.leftEyeOpen && !eyeState.rightEyeOpen;
    this.eyeStateHistory.push(eyesClosed);

    // Track head poses for rotation detection
    this.headPoseHistory.push(headPose);

    // Keep history limited
    if (this.eyeStateHistory.length > this.maxHistoryLength) {
      this.eyeStateHistory.shift();
    }
    if (this.headPoseHistory.length > this.maxHistoryLength) {
      this.headPoseHistory.shift();
    }

    // Check for blink detection
    if (!this.blinkDetected) {
      this.blinkDetected = this.hasDetectedBlinks();
    }

    // Check for head rotations
    if (!this.leftRotationDetected) {
      this.leftRotationDetected = this.hasDetectedLeftRotation();
    }
    if (!this.rightRotationDetected) {
      this.rightRotationDetected = this.hasDetectedRightRotation();
    }

    const allActionsComplete = this.blinkDetected && this.leftRotationDetected && this.rightRotationDetected;

    // Log progress periodically
    if (this.headPoseHistory.length % 10 === 0) {
      const currentYaw = headPose.yaw.toFixed(2);
      console.log(`🎯 Liveness Progress: Blink(${this.blinkDetected ? '✓' : '✗'}) ` +
                  `Left(${this.leftRotationDetected ? '✓' : '✗'}) ` +
                  `Right(${this.rightRotationDetected ? '✓' : '✗'}) ` +
                  `Yaw: ${currentYaw}`);
    }

    return allActionsComplete;
  }

  hasDetectedBlinks(): boolean {
    if (this.eyeStateHistory.length < 3) return false;

    // Look for transitions: open -> closed -> open
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
          console.log('✓ 👁️ BLINK DETECTED! Total:', blinkCount);
          wasClosed = false;
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

  hasDetectedLeftRotation(): boolean {
    if (this.headPoseHistory.length < 10) return false;

    // Look for significant left rotation (negative yaw)
    return this.headPoseHistory.some(pose => pose.yaw < -HEAD_ROTATION_THRESHOLD);
  }

  hasDetectedRightRotation(): boolean {
    if (this.headPoseHistory.length < 10) return false;

    // Look for significant right rotation (positive yaw)
    return this.headPoseHistory.some(pose => pose.yaw > HEAD_ROTATION_THRESHOLD);
  }

  getProgress(): number {
    const completedActions = [
      this.blinkDetected,
      this.leftRotationDetected,
      this.rightRotationDetected
    ].filter(Boolean).length;

    return completedActions / 3; // 3 total actions required
  }

  getCompletedActions(): { blink: boolean; leftRotation: boolean; rightRotation: boolean } {
    return {
      blink: this.blinkDetected,
      leftRotation: this.leftRotationDetected,
      rightRotation: this.rightRotationDetected
    };
  }

  getCurrentInstruction(): string {
    if (!this.blinkDetected) return 'Blink your eyes';
    if (!this.leftRotationDetected) return 'Turn your head left';
    if (!this.rightRotationDetected) return 'Turn your head right';
    return 'Liveness verification complete!';
  }
}