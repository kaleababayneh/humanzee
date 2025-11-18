#!/bin/bash

# Create models directory in public folder
mkdir -p public/models

echo "📥 Downloading face-api.js models..."

# Base URL for models
BASE_URL="https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"

# Download TinyFaceDetector model
echo "⬇️  Downloading TinyFaceDetector..."
curl -L "${BASE_URL}/tiny_face_detector_model-weights_manifest.json" -o "public/models/tiny_face_detector_model-weights_manifest.json"
curl -L "${BASE_URL}/tiny_face_detector_model-shard1" -o "public/models/tiny_face_detector_model-shard1"

# Download Face Landmark 68 model
echo "⬇️  Downloading FaceLandmark68..."
curl -L "${BASE_URL}/face_landmark_68_model-weights_manifest.json" -o "public/models/face_landmark_68_model-weights_manifest.json"
curl -L "${BASE_URL}/face_landmark_68_model-shard1" -o "public/models/face_landmark_68_model-shard1"

# Download Face Recognition model
echo "⬇️  Downloading FaceRecognition..."
curl -L "${BASE_URL}/face_recognition_model-weights_manifest.json" -o "public/models/face_recognition_model-weights_manifest.json"
curl -L "${BASE_URL}/face_recognition_model-shard1" -o "public/models/face_recognition_model-shard1"
curl -L "${BASE_URL}/face_recognition_model-shard2" -o "public/models/face_recognition_model-shard2"

# Download SSD MobileNet model
echo "⬇️  Downloading SSDMobileNet..."
curl -L "${BASE_URL}/ssd_mobilenetv1_model-weights_manifest.json" -o "public/models/ssd_mobilenetv1_model-weights_manifest.json"
curl -L "${BASE_URL}/ssd_mobilenetv1_model-shard1" -o "public/models/ssd_mobilenetv1_model-shard1"
curl -L "${BASE_URL}/ssd_mobilenetv1_model-shard2" -o "public/models/ssd_mobilenetv1_model-shard2"

echo "✅ All models downloaded successfully!"
echo "🔧 Models are now available in public/models/"