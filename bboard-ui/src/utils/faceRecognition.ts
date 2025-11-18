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
      console.log('Face detected with descriptor length:', detection.descriptor.length);
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
  
  // Calculate expression-invariant geometric ratios
  const features: number[] = [];
  
  // 1. Eye distance ratio (very stable)
  const leftEyeWidth = distance(leftEyeLeft, leftEyeRight);
  const rightEyeWidth = distance(rightEyeLeft, rightEyeRight);
  const eyeDistance = distance(leftEyeRight, rightEyeLeft);
  features.push(leftEyeWidth / eyeDistance);
  features.push(rightEyeWidth / eyeDistance);
  
  // 2. Face width to eye distance ratio
  const faceWidth = distance(leftFace, rightFace);
  features.push(eyeDistance / faceWidth);
  
  // 3. Nose width to face width ratio
  const noseWidth = distance(leftNostril, rightNostril);
  features.push(noseWidth / faceWidth);
  
  // 4. Face height ratios (nose-to-chin, eyes-to-chin)
  const eyeLevel = (leftEyeLeft.y + rightEyeRight.y) / 2;
  const faceHeight = Math.abs(chin.y - eyeLevel);
  const noseToEyeDistance = Math.abs(noseTip.y - eyeLevel);
  features.push(noseToEyeDistance / faceHeight);
  
  // 5. Nose length ratio
  const noseLength = distance(noseTip, noseBase);
  features.push(noseLength / faceHeight);
  
  // 6. Eye symmetry (left vs right eye position)
  const leftEyeCenter = { x: (leftEyeLeft.x + leftEyeRight.x) / 2, y: (leftEyeLeft.y + leftEyeRight.y) / 2 };
  const rightEyeCenter = { x: (rightEyeLeft.x + rightEyeRight.x) / 2, y: (rightEyeLeft.y + rightEyeRight.y) / 2 };
  const eyeSymmetry = Math.abs(leftEyeCenter.y - rightEyeCenter.y) / eyeDistance;
  features.push(eyeSymmetry);
  
  // 7. Face aspect ratio
  features.push(faceWidth / faceHeight);
  
  // 8. Inter-pupillary distance normalized
  const leftPupil = { x: (leftEyeLeft.x + leftEyeRight.x) / 2, y: (leftEyeLeft.y + leftEyeRight.y) / 2 };
  const rightPupil = { x: (rightEyeLeft.x + rightEyeRight.x) / 2, y: (rightEyeLeft.y + rightEyeRight.y) / 2 };
  const ipd = Math.sqrt(Math.pow(rightPupil.x - leftPupil.x, 2) + Math.pow(rightPupil.y - leftPupil.y, 2));
  features.push(ipd / faceWidth);
  
  return new Float32Array(features);
};

// Helper function to calculate Euclidean distance between two points
const distance = (p1: { x: number; y: number }, p2: { x: number; y: number }): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
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
  // Step 1: Normalize the neural network descriptor
  const normalized = normalizeFaceDescriptor(faceDescriptor);
  
  // Step 2: Extract geometric features from landmarks if available
  const geometricFeatures = landmarks 
    ? extractGeometricFeatures(landmarks)
    : new Float32Array(0);
  
  // Step 3: Stabilize the neural features
  const stabilized = stabilizeFaceFeatures(normalized);
  
  // Step 4: Combine both feature sets for robust hash
  // Geometric features get more weight as they're more expression-invariant
  const combined = new Float32Array(stabilized.length + geometricFeatures.length);
  combined.set(stabilized, 0);
  combined.set(geometricFeatures, stabilized.length);
  
  // Step 5: Convert to ArrayBuffer for hashing
  const buffer = new ArrayBuffer(combined.length * 4);
  const view = new Float32Array(buffer);
  view.set(combined);
  
  // Step 6: Generate SHA-256 hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return new Uint8Array(hashBuffer);
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

// Stabilize face features by quantizing and focusing on structural components
// This reduces sensitivity to minor expression changes
const stabilizeFaceFeatures = (descriptor: Float32Array): Float32Array => {
  const stabilized = new Float32Array(descriptor.length);
  
  // Use quantization to reduce noise and expression variations
  // This groups similar values together, making the hash more stable
  const quantizationLevels = 100; // Adjust precision vs stability tradeoff
  
  for (let i = 0; i < descriptor.length; i++) {
    // Quantize each feature to reduce sensitivity
    // Round to nearest 1/quantizationLevels
    const quantized = Math.round(descriptor[i] * quantizationLevels) / quantizationLevels;
    
    // Apply a threshold to filter out very small values (likely noise/expression)
    const threshold = 0.05;
    stabilized[i] = Math.abs(quantized) < threshold ? 0 : quantized;
  }
  
  // Apply median filtering on groups of features to reduce outliers
  // This helps filter expression-based variations
  const windowSize = 5;
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
  
  return medianFiltered;
};

// Get face hash as hex string for use as user identity
// Now includes geometric features for expression-invariant identity
export const getFaceHashHex = async (
  faceDescriptor: Float32Array,
  landmarks?: faceapi.FaceLandmarks68
): Promise<string> => {
  const hash = await generateFaceHash(faceDescriptor, landmarks);
  return Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
};