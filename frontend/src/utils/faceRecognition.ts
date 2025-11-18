import * as faceapi from 'face-api.js';

let modelsLoaded = false;

export const loadModels = async (): Promise<void> => {
  if (modelsLoaded) return;

  const MODEL_URL = '/models';
  
  try {
    console.log('Loading face recognition models from:', MODEL_URL);
    
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    ]);

    console.log('✓ All models loaded successfully');
    modelsLoaded = true;
  } catch (error) {
    console.error('Error loading models:', error);
    throw new Error('Failed to load face recognition models');
  }
};

export const detectSingleFace = async (
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
): Promise<faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<faceapi.WithFaceDetection<{}>>> | undefined> => {
  try {
    const detection = await faceapi
      .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (detection) {
      console.log('🎭 FACE DETECTION RESULT:', {
        descriptorLength: detection.descriptor.length,
        confidence: detection.detection.score,
        faceBox: {
          x: Math.round(detection.detection.box.x),
          y: Math.round(detection.detection.box.y), 
          width: Math.round(detection.detection.box.width),
          height: Math.round(detection.detection.box.height)
        },
        landmarksCount: detection.landmarks.positions.length,
        descriptorPreview: Array.from(detection.descriptor.slice(0, 10)).map(v => v.toFixed(3))
      });
    } else {
      console.log('❌ No face detected in current frame');
    }

    return detection;
  } catch (error) {
    console.error('Error detecting face:', error);
    return undefined;
  }
};

// Extract geometric facial features from landmarks (expression-invariant)
// These are structural measurements that don't change with expressions
export const extractGeometricFeatures = (landmarks: faceapi.FaceLandmarks68): Float32Array => {
  const positions = landmarks.positions;
  
  console.log('📐 EXTRACTING GEOMETRIC FEATURES (Expression-Invariant)...');
  
  // Key facial points (these are expression-invariant structural features)
  const leftEyeLeft = positions[36];   // Left corner of left eye
  const leftEyeRight = positions[39];  // Right corner of left eye
  const rightEyeLeft = positions[42];  // Left corner of right eye
  const rightEyeRight = positions[45]; // Right corner of right eye
  const noseTip = positions[30];       // Nose tip
  const noseBase = positions[33];      // Nose base
  const leftNostril = positions[31];   // Left nostril
  const rightNostril = positions[35];  // Right nostril
  const leftFace = positions[0];       // Left jawline
  const rightFace = positions[16];     // Right jawline
  const chin = positions[8];           // Chin point
  const leftTemple = positions[17];    // Left eyebrow start
  const rightTemple = positions[26];   // Right eyebrow end
  const forehead = positions[24];      // Center between eyebrows
  
  // Calculate expression-invariant geometric ratios
  const features: number[] = [];
  
  // 1. Eye distance ratios (very stable across expressions)
  const leftEyeWidth = distance(leftEyeLeft, leftEyeRight);
  const rightEyeWidth = distance(rightEyeLeft, rightEyeRight);
  const eyeDistance = distance(leftEyeRight, rightEyeLeft);
  features.push(leftEyeWidth / eyeDistance);
  features.push(rightEyeWidth / eyeDistance);
  features.push(leftEyeWidth / rightEyeWidth); // Eye symmetry
  
  // 2. Face proportions (bone structure - doesn't change with expressions)
  const faceWidth = distance(leftFace, rightFace);
  const templeWidth = distance(leftTemple, rightTemple);
  features.push(eyeDistance / faceWidth);
  features.push(templeWidth / faceWidth);
  
  // 3. Nose structure ratios (cartilage-based, expression-invariant)
  const noseWidth = distance(leftNostril, rightNostril);
  const noseLength = distance(noseTip, noseBase);
  features.push(noseWidth / faceWidth);
  features.push(noseLength / faceWidth);
  features.push(noseWidth / noseLength); // Nose aspect ratio
  
  // 4. Vertical face proportions (skeletal structure)
  const eyeLevel = (leftEyeLeft.y + rightEyeRight.y) / 2;
  const faceHeight = Math.abs(chin.y - eyeLevel);
  const upperFaceHeight = Math.abs(forehead.y - eyeLevel);
  const noseToEyeDistance = Math.abs(noseTip.y - eyeLevel);
  const noseToChinDistance = Math.abs(chin.y - noseTip.y);
  
  features.push(noseToEyeDistance / faceHeight);
  features.push(noseToChinDistance / faceHeight);
  features.push(upperFaceHeight / faceHeight);
  features.push(faceHeight / faceWidth); // Overall face aspect ratio
  
  // 5. Inter-ocular measurements (very stable)
  const leftPupil = { x: (leftEyeLeft.x + leftEyeRight.x) / 2, y: (leftEyeLeft.y + leftEyeRight.y) / 2 };
  const rightPupil = { x: (rightEyeLeft.x + rightEyeRight.x) / 2, y: (rightEyeLeft.y + rightEyeRight.y) / 2 };
  const ipd = distance(leftPupil, rightPupil);
  features.push(ipd / faceWidth);
  features.push(ipd / faceHeight);
  
  // 6. Facial symmetry measurements (bone structure)
  const faceCenter = { x: (leftFace.x + rightFace.x) / 2, y: (leftFace.y + rightFace.y) / 2 };
  const noseDeviation = Math.abs(noseTip.x - faceCenter.x) / faceWidth;
  const chinDeviation = Math.abs(chin.x - faceCenter.x) / faceWidth;
  features.push(noseDeviation);
  features.push(chinDeviation);
  
  // 7. Angular measurements (bone structure angles)
  const leftJawAngle = calculateAngle(leftFace, chin, { x: leftFace.x, y: chin.y });
  const rightJawAngle = calculateAngle(rightFace, chin, { x: rightFace.x, y: chin.y });
  const noseAngle = calculateAngle(leftNostril, noseTip, rightNostril);
  features.push(leftJawAngle / 180); // Normalize to 0-1
  features.push(rightJawAngle / 180);
  features.push(noseAngle / 180);
  
  // 8. Additional ratios for uniqueness
  const eyeToNoseDistance = distance({ x: (leftPupil.x + rightPupil.x) / 2, y: (leftPupil.y + rightPupil.y) / 2 }, noseTip);
  const eyeToChinDistance = distance({ x: (leftPupil.x + rightPupil.x) / 2, y: (leftPupil.y + rightPupil.y) / 2 }, chin);
  features.push(eyeToNoseDistance / eyeToChinDistance);
  
  const result = new Float32Array(features);
  
  // Round geometric features for ultimate stability
  for (let i = 0; i < result.length; i++) {
    result[i] = Math.round(result[i] * 1000) / 1000; // 3 decimal places for stability
  }
  
  console.log('📐 Geometric Features Extracted (Ultra-Stable):', {
    featureCount: features.length,
    eyeRatios: Array.from(result.slice(0, 3)).map(f => f.toFixed(4)),
    faceProportions: Array.from(result.slice(3, 5)).map(f => f.toFixed(4)),
    noseStructure: Array.from(result.slice(5, 8)).map(f => f.toFixed(4)),
    verticalProportions: Array.from(result.slice(8, 12)).map(f => f.toFixed(4)),
    interOcular: Array.from(result.slice(12, 14)).map(f => f.toFixed(4)),
    symmetry: Array.from(result.slice(14, 16)).map(f => f.toFixed(4)),
    angles: Array.from(result.slice(16, 19)).map(f => f.toFixed(4)),
    additionalRatios: Array.from(result.slice(19)).map(f => f.toFixed(4)),
    stabilityNote: 'All values rounded to 3 decimal places for maximum consistency'
  });
  
  return result;
};

// Helper function to calculate Euclidean distance between two points
const distance = (p1: { x: number; y: number }, p2: { x: number; y: number }): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

// Helper function to calculate angle between three points (in degrees)
const calculateAngle = (p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }): number => {
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
  
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  
  const cos = dot / (mag1 * mag2);
  const angle = Math.acos(Math.max(-1, Math.min(1, cos))) * (180 / Math.PI);
  
  return angle;
};

export const compareFaces = (
  descriptor1: Float32Array,
  descriptor2: Float32Array | number[],
  threshold: number = 0.6
): boolean => {
  const desc2 = descriptor2 instanceof Float32Array 
    ? descriptor2 
    : new Float32Array(descriptor2);
  
  const distance = faceapi.euclideanDistance(descriptor1, desc2);
  return distance < threshold;
};

export const findBestMatch = (
  queryDescriptor: Float32Array,
  knownDescriptors: { id: string; username: string; descriptor: number[] }[],
  threshold: number = 0.6
): { id: string; username: string; distance: number } | null => {
  let bestMatch: { id: string; username: string; distance: number } | null = null;

  for (const known of knownDescriptors) {
    const distance = faceapi.euclideanDistance(
      queryDescriptor,
      new Float32Array(known.descriptor)
    );

    if (distance < threshold) {
      if (!bestMatch || distance < bestMatch.distance) {
        bestMatch = { ...known, distance };
      }
    }
  }

  return bestMatch;
};

// Generate a robust, expression-invariant hash from face descriptor and landmarks
// This combines normalized descriptor with geometric features for maximum stability
export const generateFaceHash = async (
  faceDescriptor: Float32Array,
  landmarks?: faceapi.FaceLandmarks68
): Promise<Uint8Array> => {
  console.log('🔄 GENERATING EXPRESSION-INVARIANT FACE HASH...');
  console.log('📊 Input Data:', {
    descriptorLength: faceDescriptor.length,
    hasLandmarks: !!landmarks,
    landmarksCount: landmarks?.positions?.length || 0,
    descriptorStats: {
      min: Math.min(...faceDescriptor),
      max: Math.max(...faceDescriptor),
      mean: faceDescriptor.reduce((a, b) => a + b, 0) / faceDescriptor.length
    },
    descriptorSample: Array.from(faceDescriptor.slice(0, 10)).map(v => v.toFixed(6))
  });
  
  // Step 1: Normalize the neural network descriptor
  const normalized = normalizeFaceDescriptor(faceDescriptor);
  console.log('✅ Step 1: Descriptor normalized:', {
    originalSample: Array.from(faceDescriptor.slice(0, 5)).map(v => v.toFixed(6)),
    normalizedSample: Array.from(normalized.slice(0, 5)).map(v => v.toFixed(6))
  });
  
  // Step 2: Extract geometric features from landmarks if available
  const geometricFeatures = landmarks 
    ? extractGeometricFeatures(landmarks)
    : new Float32Array(0);
  
  if (landmarks) {
    console.log('✅ Step 2: Geometric features extracted:', {
      featureCount: geometricFeatures.length,
      features: Array.from(geometricFeatures).map(v => v.toFixed(4))
    });
  } else {
    console.log('⚠️ Step 2: No landmarks available, using descriptor only');
  }
  
  // Step 3: Stabilize the neural features
  const stabilized = stabilizeFaceFeatures(normalized);
  console.log('✅ Step 3: Neural features stabilized:', {
    normalizedSample: Array.from(normalized.slice(0, 5)).map(v => v.toFixed(6)),
    stabilizedSample: Array.from(stabilized.slice(0, 5)).map(v => v.toFixed(6))
  });
  
  // Step 4: Combine both feature sets for robust hash
  // Give MUCH MORE weight to geometric features as they're more stable
  // Repeat geometric features multiple times to increase their influence
  const geometricWeight = 5; // Multiply geometric features by 5
  const weightedGeometric = new Float32Array(geometricFeatures.length * geometricWeight);
  for (let i = 0; i < geometricWeight; i++) {
    weightedGeometric.set(geometricFeatures, i * geometricFeatures.length);
  }
  
  const combined = new Float32Array(stabilized.length + weightedGeometric.length);
  combined.set(stabilized, 0);
  combined.set(weightedGeometric, stabilized.length);
  
  console.log('✅ Step 4: Features combined with geometric weight:', {
    totalLength: combined.length,
    neuralFeatures: stabilized.length,
    geometricFeatures: geometricFeatures.length,
    weightedGeometricFeatures: weightedGeometric.length,
    geometricWeight: geometricWeight,
    combinedStats: {
      min: Math.min(...combined),
      max: Math.max(...combined),
      nonZeroCount: Array.from(combined).filter(v => Math.abs(v) > 0.001).length
    }
  });
  
  // Step 5: Convert to ArrayBuffer for hashing
  const buffer = new ArrayBuffer(combined.length * 4);
  const view = new Float32Array(buffer);
  view.set(combined);
  
  // Step 6: Generate SHA-256 hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashBytes = new Uint8Array(hashBuffer);
  
  console.log('🎯 FINAL EXPRESSION-INVARIANT HASH:', {
    hashLength: hashBytes.length,
    hashHex: Array.from(hashBytes.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join('') + '...',
    fullHash: Array.from(hashBytes).map(b => b.toString(16).padStart(2, '0')).join('')
  });
  
  return hashBytes;
};

// Normalize face descriptor to be expression-invariant
// This focuses on structural facial geometry rather than expression-dependent features
const normalizeFaceDescriptor = (descriptor: Float32Array): Float32Array => {
  // Calculate mean and standard deviation for normalization
  let sum = 0;
  let sumSquares = 0;
  
  for (let i = 0; i < descriptor.length; i++) {
    sum += descriptor[i];
    sumSquares += descriptor[i] * descriptor[i];
  }
  
  const mean = sum / descriptor.length;
  const variance = (sumSquares / descriptor.length) - (mean * mean);
  const stdDev = Math.sqrt(Math.max(variance, 0.000001)); // Prevent division by zero
  
  // Z-score normalization - centers around 0 with unit variance
  const normalized = new Float32Array(descriptor.length);
  for (let i = 0; i < descriptor.length; i++) {
    normalized[i] = (descriptor[i] - mean) / stdDev;
  }
  
  // Apply L2 normalization for consistent magnitude
  let magnitude = 0;
  for (let i = 0; i < normalized.length; i++) {
    magnitude += normalized[i] * normalized[i];
  }
  magnitude = Math.sqrt(magnitude);
  
  const l2Normalized = new Float32Array(descriptor.length);
  for (let i = 0; i < normalized.length; i++) {
    l2Normalized[i] = normalized[i] / (magnitude || 1);
  }
  
  return l2Normalized;
};

// Stabilize face features by aggressive quantization for consistent hashing
// This ensures the same person always gets the same hash regardless of minor variations
const stabilizeFaceFeatures = (descriptor: Float32Array): Float32Array => {
  console.log('🔧 Starting aggressive feature stabilization for consistent hashing...');
  
  const stabilized = new Float32Array(descriptor.length);
  
  // Use VERY aggressive quantization to ensure consistency
  // This dramatically reduces precision but ensures same person = same hash
  const quantizationLevels = 10; // Much more aggressive quantization for consistency
  
  for (let i = 0; i < descriptor.length; i++) {
    // Quantize each feature very aggressively
    const quantized = Math.round(descriptor[i] * quantizationLevels) / quantizationLevels;
    
    // Apply a higher threshold to eliminate more noise
    const threshold = 0.15; // Higher threshold for more stability
    stabilized[i] = Math.abs(quantized) < threshold ? 0 : quantized;
  }
  
  // Apply stronger median filtering with larger window
  const windowSize = 9; // Larger window for more smoothing
  const medianFiltered = new Float32Array(descriptor.length);
  
  for (let i = 0; i < descriptor.length; i++) {
    const window: number[] = [];
    for (let j = Math.max(0, i - Math.floor(windowSize / 2)); 
         j < Math.min(descriptor.length, i + Math.floor(windowSize / 2) + 1); 
         j++) {
      window.push(stabilized[j]);
    }
    window.sort((a, b) => a - b);
    medianFiltered[i] = window[Math.floor(window.length / 2)];
  }
  
  // Additional step: Round to fixed decimal places for ultra-consistency
  const ultraStabilized = new Float32Array(descriptor.length);
  for (let i = 0; i < medianFiltered.length; i++) {
    // Round to 2 decimal places for maximum stability
    ultraStabilized[i] = Math.round(medianFiltered[i] * 100) / 100;
  }
  
  console.log('🔧 Aggressive stabilization complete:', {
    quantizationLevels,
    threshold: 0.15,
    windowSize,
    originalRange: [Math.min(...descriptor), Math.max(...descriptor)],
    stabilizedRange: [Math.min(...ultraStabilized), Math.max(...ultraStabilized)],
    zeroCount: Array.from(ultraStabilized).filter(v => v === 0).length,
    uniqueValues: new Set(Array.from(ultraStabilized)).size
  });
  
  return ultraStabilized;
};

// Face Database for storing and comparing descriptors
class FaceRegistry {
  private static instance: FaceRegistry;
  private faceDatabase: Map<string, { descriptor: Float32Array; username: string; timestamp: number }> = new Map();

  static getInstance(): FaceRegistry {
    if (!FaceRegistry.instance) {
      FaceRegistry.instance = new FaceRegistry();
    }
    return FaceRegistry.instance;
  }

  // Register a new face and return consistent identity
  registerFace(descriptor: Float32Array, username?: string): string {
    console.log('🔍 CHECKING FOR EXISTING FACE REGISTRATION...');
    
    // Check if this face already exists (same person trying to register again)
    const existingMatch = this.findBestMatch(descriptor, 0.6);
    
    if (existingMatch) {
      console.log('✅ EXISTING FACE FOUND - Using existing identity:', existingMatch.id);
      console.log('🎯 Returning consistent identity for same person');
      return existingMatch.id;
    }
    
    // New face - create new identity
    const newId = this.generateFaceBasedId(descriptor);
    const finalUsername = username || `user_${Date.now()}`;
    
    this.faceDatabase.set(newId, {
      descriptor: new Float32Array(descriptor), // Store copy
      username: finalUsername,
      timestamp: Date.now()
    });
    
    console.log('🆕 NEW FACE REGISTERED:', {
      id: newId,
      username: finalUsername,
      totalRegistered: this.faceDatabase.size
    });
    
    return newId;
  }

  // Find best match for a face
  findBestMatch(queryDescriptor: Float32Array, threshold: number = 0.6): { id: string; username: string; distance: number } | null {
    let bestMatch: { id: string; username: string; distance: number } | null = null;

    console.log('🔍 Searching through', this.faceDatabase.size, 'registered faces...');
    
    for (const [id, stored] of this.faceDatabase) {
      const distance = faceapi.euclideanDistance(queryDescriptor, stored.descriptor);
      console.log(`� Face ${id.substring(0, 8)}... distance: ${distance.toFixed(4)}`);
      
      if (distance < threshold) {
        if (!bestMatch || distance < bestMatch.distance) {
          bestMatch = { id, username: stored.username, distance };
        }
      }
    }

    if (bestMatch) {
      console.log('✅ MATCH FOUND:', {
        id: bestMatch.id,
        username: bestMatch.username,
        distance: bestMatch.distance,
        confidence: ((1 - bestMatch.distance) * 100).toFixed(1) + '%'
      });
    } else {
      console.log('❌ NO MATCH FOUND - All distances above threshold');
    }

    return bestMatch;
  }

  // Generate a stable ID based on face descriptor
  private generateFaceBasedId(descriptor: Float32Array): string {
    // Use a simple hash of the normalized descriptor for ID generation
    const normalized = this.normalizeDescriptor(descriptor);
    const hashInput = Array.from(normalized).join(',');
    
    // Simple hash function for consistent IDs
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16);
  }

  private normalizeDescriptor(descriptor: Float32Array): Float32Array {
    // Light normalization for ID generation (not for comparison)
    const normalized = new Float32Array(descriptor.length);
    for (let i = 0; i < descriptor.length; i++) {
      // Round to 2 decimal places for stable ID generation
      normalized[i] = Math.round(descriptor[i] * 100) / 100;
    }
    return normalized;
  }
}

// Get face registry instance
const faceRegistry = FaceRegistry.getInstance();

// Enhanced face authentication with multiple validation
class FaceAuthenticator {
  private consecutiveMatches: Map<string, number> = new Map();
  private requiredMatches = 3; // Require 3 consecutive matches
  private maxAttempts = 10;
  private currentAttempts = 0;

  reset() {
    this.consecutiveMatches.clear();
    this.currentAttempts = 0;
    console.log('🔄 Face authenticator reset');
  }

  // Authenticate a face with multiple validation
  async authenticate(descriptor: Float32Array): Promise<{ success: boolean; id?: string; username?: string; confidence?: number } | null> {
    this.currentAttempts++;
    
    const match = faceRegistry.findBestMatch(descriptor, 0.6);
    
    if (match) {
      // Increment consecutive matches for this face
      const current = this.consecutiveMatches.get(match.id) || 0;
      this.consecutiveMatches.set(match.id, current + 1);
      
      // Clear other potential matches
      for (const [id, count] of this.consecutiveMatches) {
        if (id !== match.id) {
          this.consecutiveMatches.set(id, 0);
        }
      }
      
      const consecutiveCount = this.consecutiveMatches.get(match.id) || 0;
      
      console.log(`🔄 Authentication progress: ${consecutiveCount}/${this.requiredMatches} for user ${match.username}`);
      
      if (consecutiveCount >= this.requiredMatches) {
        console.log('✅ AUTHENTICATION SUCCESS:', {
          user: match.username,
          id: match.id,
          consecutiveMatches: consecutiveCount,
          confidence: ((1 - match.distance) * 100).toFixed(1) + '%'
        });
        
        return {
          success: true,
          id: match.id,
          username: match.username,
          confidence: (1 - match.distance) * 100
        };
      }
      
      return null; // Need more consecutive matches
      
    } else {
      // No match found - reset consecutive matches
      this.consecutiveMatches.clear();
      
      if (this.currentAttempts >= this.maxAttempts) {
        console.log('❌ AUTHENTICATION FAILED: Max attempts reached');
        return {
          success: false
        };
      }
      
      return null; // Keep trying
    }
  }

  getProgress(): number {
    const maxConsecutive = Math.max(...Array.from(this.consecutiveMatches.values()), 0);
    return maxConsecutive / this.requiredMatches;
  }
}

// Export the authenticator for use in components
export { FaceAuthenticator };

// Export registry for debugging
export const getFaceRegistry = () => FaceRegistry.getInstance();
export const getFaceHashHex = async (
  faceDescriptor: Float32Array,
  landmarks?: faceapi.FaceLandmarks68,
  isRegistration: boolean = false
): Promise<string> => {
  console.log('🎭 FACE IDENTIFICATION USING REGISTRATION-BASED APPROACH');
  console.log('📋 Process Overview:', {
    approach: 'Direct descriptor comparison (like facething)',
    step1: 'Register or find existing face in database',
    step2: 'Return consistent identity ID',
    advantage: 'Same person always gets same ID regardless of minor variations'
  });
  
  if (isRegistration) {
    // Registration mode - create or return existing identity
    const identityId = faceRegistry.registerFace(faceDescriptor);
    console.log('✅ REGISTRATION COMPLETE - Identity ID:', identityId);
    return identityId;
  } else {
    // Authentication mode - find existing identity
    const match = faceRegistry.findBestMatch(faceDescriptor, 0.6);
    if (match) {
      console.log('✅ AUTHENTICATION SUCCESS - Identity ID:', match.id);
      return match.id;
    } else {
      // If no match found during authentication, auto-register as new user
      const identityId = faceRegistry.registerFace(faceDescriptor);
      console.log('🆕 AUTO-REGISTRATION - New Identity ID:', identityId);
      return identityId;
    }
  }
};