import React, { useRef, useState, useEffect } from 'react';
import { FaCamera, FaTimes } from 'react-icons/fa';

interface CameraProps {
  onCapture: (imageSrc: string) => void;
  onClose: () => void;
}

export default function Camera({ onCapture, onClose }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    // Start camera when component mounts
    startCamera();

    // Clean up when component unmounts
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      // Request access to the user's camera
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use the rear camera if available
      });

      // If successful, update state and set video source
      setHasPermission(true);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setErrorMessage('Could not access camera. Please make sure you have granted camera permissions.');
      setHasPermission(false);
    }
  };

  const stopCamera = () => {
    // Stop all tracks in the stream to release the camera
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const captureImage = () => {
    if (!canvasRef.current || !videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame on the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get the image as a data URL
    const imageSrc = canvas.toDataURL('image/jpeg');
    
    // Pass the image to the parent component
    onCapture(imageSrc);
    
    // Stop the camera
    stopCamera();
    
    // Close the camera component
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <button 
        className="absolute top-4 right-4 text-white p-2 rounded-full bg-gray-800/50" 
        onClick={onClose}
      >
        <FaTimes className="w-6 h-6" />
      </button>

      {errorMessage ? (
        <div className="text-white text-center p-4">
          <p className="mb-4">{errorMessage}</p>
          <button 
            className="btn btn-primary" 
            onClick={startCamera}
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          <video 
            ref={videoRef} 
            className="w-full h-full object-cover" 
            autoPlay 
            playsInline
          />
          
          {/* Capture UI */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center">
            <button 
              className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg"
              onClick={captureImage}
            >
              <FaCamera className="text-gray-900 w-8 h-8" />
            </button>
          </div>
          
          {/* Viewfinder overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="w-full h-full border-2 border-white/30">
              {/* Receipt guiding rectangle */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 border-dashed border-primary-500 w-4/5 h-3/5 rounded-lg"></div>
            </div>
          </div>
          
          {/* Hidden canvas for capturing images */}
          <canvas ref={canvasRef} className="hidden" />
        </>
      )}
    </div>
  );
} 