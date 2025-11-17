import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { detectSingleFace } from '../utils/faceRecognition';

interface WebcamProps {
  onFaceDetected?: (descriptor: Float32Array, landmarks?: faceapi.FaceLandmarks68) => void;
  showDetection?: boolean;
}

export const Webcam: React.FC<WebcamProps> = ({ 
  onFaceDetected, 
  showDetection = true 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string>('');
  const detectionIntervalRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    startVideo();
    return () => {
      stopVideo();
    };
  }, []);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
        setError('');
      }
    } catch (err) {
      setError('Unable to access camera. Please grant camera permissions.');
      console.error('Error accessing camera:', err);
    }
  };

  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      setIsStreaming(false);
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
  };

  const handleVideoPlay = () => {
    console.log('Video started playing');
    if (showDetection && canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      console.log('Starting face detection interval');
      
      detectionIntervalRef.current = window.setInterval(async () => {
        if (!video.paused && !video.ended) {
          const detection = await detectSingleFace(video);

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }

          if (detection) {
            // Draw detection box
            if (showDetection) {
              const resizedDetections = faceapi.resizeResults(detection, {
                width: canvas.width,
                height: canvas.height,
              });
              faceapi.draw.drawDetections(canvas, resizedDetections);
              faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
            }

            // Call callback with descriptor
            if (onFaceDetected && detection.descriptor) {
              console.log('Webcam: Passing landmarks:', !!detection.landmarks, 'positions:', detection.landmarks?.positions?.length);
              onFaceDetected(detection.descriptor, detection.landmarks);
            }
          }
        }
      }, 100);
    }
  };

  return (
    <div className="webcam-container">
      {error && <div className="error-message">{error}</div>}
      <div className="video-wrapper">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          onPlay={handleVideoPlay}
          className="video-feed"
        />
        {showDetection && (
          <canvas ref={canvasRef} className="detection-canvas" />
        )}
      </div>
      {!isStreaming && !error && (
        <div className="loading">Starting camera...</div>
      )}
    </div>
  );
};