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

// Generate a unique hash from face descriptor for identity
export const generateFaceHash = async (faceDescriptor: Float32Array): Promise<Uint8Array> => {
  // Convert Float32Array to ArrayBuffer
  const buffer = new ArrayBuffer(faceDescriptor.length * 4);
  const view = new Float32Array(buffer);
  view.set(faceDescriptor);
  
  // Generate SHA-256 hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return new Uint8Array(hashBuffer);
};

// Get face hash as hex string for use as user identity
export const getFaceHashHex = async (faceDescriptor: Float32Array): Promise<string> => {
  const hash = await generateFaceHash(faceDescriptor);
  return Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
};