import React from 'react';
import Webcam from 'react-webcam';
import { Camera, X } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext.js';

interface CameraCaptureProps {
  onCapture: (img: string) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const webcamRef = React.useRef<any>(null);
  const { t } = useTranslation();
  const WebcamComponent = Webcam as any;

  const capture = React.useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      onCapture(imageSrc);
      onClose();
    }
  }, [webcamRef, onCapture, onClose]);

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[150] flex items-center justify-center p-4" id="camera-capture-modal">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t('settings.capturePhoto')}</h3>
          <button id="close-camera-btn" onClick={onClose} className="p-2 bg-white dark:bg-slate-900 rounded-xl text-slate-400 hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-8 space-y-6">
          <div className="relative rounded-[2rem] overflow-hidden border-4 border-slate-100 dark:border-slate-800 shadow-inner aspect-[4/3] bg-black">
            <WebcamComponent
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full h-full object-cover"
              videoConstraints={{ facingMode: "user" }}
            />
            <div className="absolute inset-0 border-[1.5rem] border-blue-600/10 pointer-events-none rounded-[1.8rem]" />
          </div>
          <button 
            id="take-photo-btn"
            onClick={capture}
            className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <Camera size={20} /> {t('settings.takePhotoNow')}
          </button>
        </div>
      </div>
    </div>
  );
};
