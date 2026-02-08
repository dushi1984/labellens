
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCcw, Zap, ZapOff, X, AlertCircle } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const startCamera = useCallback(async () => {
    setIsInitializing(true);
    setError(null);
    try {
      // Clear previous stream if any
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          setIsReady(true);
          setIsInitializing(false);
        };
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      setIsInitializing(false);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDismissedError' || err.message?.includes('dismissed')) {
        setError("Camera permission was dismissed. Please click 'Grant Permission' and allow access when prompted.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError("No camera device found on this system.");
      } else {
        setError("Unable to access camera. Please check your browser settings and permissions.");
      }
    }
  }, [stream]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Only on mount

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && isReady) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
        onCapture(base64);
      }
    }
  };

  const toggleFlash = async () => {
    if (stream) {
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;
      if (capabilities.torch) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: !flash }] as any
          });
          setFlash(!flash);
        } catch (e) {
          console.error("Flash toggle failed", e);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="relative w-full h-full max-w-2xl mx-auto overflow-hidden">
        {/* Camera Preview */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-opacity duration-500 ${isReady ? 'opacity-100' : 'opacity-0'}`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Loading State */}
        {isInitializing && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-white/60 text-sm font-medium">Initializing camera...</p>
          </div>
        )}

        {/* Scanning Overlay (Only show when ready) */}
        {isReady && (
          <div className="absolute inset-0 pointer-events-none animate-in fade-in duration-700">
            <div className="absolute inset-0 border-[40px] border-black/40"></div>
            <div className="absolute inset-[40px] border-2 border-white/20 rounded-2xl">
              {/* Corners */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
              
              {/* Scanning Line */}
              <div className="absolute left-0 right-0 h-0.5 bg-primary/50 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-scan-line"></div>
            </div>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <p className="text-white/60 text-xs font-bold uppercase tracking-[0.2em] bg-black/40 backdrop-blur-md px-4 py-2 rounded-full">
                Align label within frame
              </p>
            </div>
          </div>
        )}

        {/* Close Button (Top Left) */}
        <div className="absolute top-6 left-6 z-10">
          <button 
            onClick={onClose}
            className="p-3 bg-black/40 backdrop-blur-md text-white rounded-full hover:bg-black/60 transition-all active:scale-95"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Flash Toggle (Top Right) */}
        {isReady && (
          <div className="absolute top-6 right-6 z-10">
            <button 
              onClick={toggleFlash}
              className={`p-3 backdrop-blur-md rounded-full transition-all active:scale-95 ${flash ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20' : 'bg-black/40 text-white'}`}
            >
              {flash ? <Zap className="w-6 h-6" /> : <ZapOff className="w-6 h-6" />}
            </button>
          </div>
        )}

        {/* Capture Control (Bottom Center) */}
        <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-8 px-6">
           <button 
             onClick={startCamera}
             className="p-4 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition-all border border-white/20 active:scale-90"
             title="Restart Camera"
           >
             <RefreshCcw className="w-6 h-6" />
           </button>

           <button 
             onClick={capturePhoto}
             disabled={!isReady}
             className="relative group disabled:opacity-50 disabled:scale-95 transition-all"
           >
             <div className="absolute -inset-2 bg-primary/20 rounded-full blur group-hover:bg-primary/30 transition-all animate-pulse"></div>
             <div className="relative w-20 h-20 bg-white rounded-full border-[6px] border-slate-200 flex items-center justify-center active:scale-90 transition-transform">
                <div className="w-14 h-14 bg-white border-2 border-slate-100 rounded-full"></div>
             </div>
           </button>

           <div className="w-14 h-14"></div> {/* Spacer for symmetry */}
        </div>

        {/* Error State View */}
        {error && (
          <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
            <div className="p-4 bg-red-500/10 rounded-3xl mb-6">
              <AlertCircle className="w-16 h-16 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Camera Permission Required</h3>
            <p className="text-slate-400 mb-8 max-w-xs leading-relaxed">{error}</p>
            
            <div className="flex flex-col w-full max-w-xs gap-3">
              <button 
                onClick={startCamera}
                className="w-full px-8 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-blue-600 transition-all active:scale-95 shadow-xl shadow-primary/20"
              >
                Grant Permission
              </button>
              <button 
                onClick={onClose}
                className="w-full px-8 py-4 bg-slate-800 text-slate-300 font-bold rounded-2xl hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
            </div>

            <div className="mt-8 flex items-start gap-3 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 max-w-xs text-left">
              <div className="p-1 bg-blue-500/20 rounded text-blue-400 mt-0.5">
                <Camera className="w-3.5 h-3.5" />
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                LabelLens AI uses your camera locally to detect and process garment labels. Images are processed in real-time and never stored.
              </p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scan-line {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan-line {
          animation: scan-line 3s linear infinite;
        }
      `}</style>
    </div>
  );
};
