
import React, { useState, useEffect } from 'react';
import { FileUploader, FilePreview } from './components/FileUploader';
import { ResultViewer } from './components/ResultViewer';
import { CameraCapture } from './components/CameraCapture';
import { Logo } from './components/Logo';
import { extractLabelData } from './services/gemini';
import { ExtractionResult, ProcessingStatus } from './types';
import { Scan, Loader2, AlertCircle, Terminal, Sun, Moon, Info, Camera } from 'lucide-react';

const App: React.FC = () => {
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  // Dark mode state with persistence
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleFileSelect = (file: File, base64: string) => {
    setCurrentFile(file);
    setFileBase64(base64);
    setStatus(ProcessingStatus.IDLE);
    setResult(null);
    setError(null);
  };

  const handleCameraCapture = (base64: string) => {
    // Create a dummy file object for the captured image
    const capturedFile = new File([new Blob()], `captured-label-${Date.now()}.jpg`, { type: 'image/jpeg' });
    setCurrentFile(capturedFile);
    setFileBase64(base64);
    setIsCameraOpen(false);
    setStatus(ProcessingStatus.IDLE);
    setResult(null);
    setError(null);
    
    // Auto-process captured photos
    setTimeout(() => handleExtractWithData(base64, 'image/jpeg', capturedFile.name), 100);
  };

  const handleClear = () => {
    setCurrentFile(null);
    setFileBase64(null);
    setStatus(ProcessingStatus.IDLE);
    setResult(null);
    setError(null);
  };

  const handleExtractWithData = async (base64: string, mimeType: string, filename: string) => {
    setStatus(ProcessingStatus.PROCESSING);
    setError(null);

    try {
      const data = await extractLabelData(base64, mimeType);
      setResult({ filename, data: data });
      setStatus(ProcessingStatus.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to extract data. Please check the file and try again.");
      setStatus(ProcessingStatus.ERROR);
    }
  };

  const handleExtract = () => {
    if (!fileBase64 || !currentFile) return;
    handleExtractWithData(fileBase64, currentFile.type, currentFile.name);
  };

  return (
    <div className="min-h-screen font-sans pb-20 transition-colors duration-300">
      {isCameraOpen && (
        <CameraCapture 
          onCapture={handleCameraCapture} 
          onClose={() => setIsCameraOpen(false)} 
        />
      )}

      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 dark:bg-primary p-2 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-300">
              <Scan className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white leading-none tracking-tight">LabelLens AI</h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-bold uppercase tracking-widest">Intelligent Extraction</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Terminal className="w-3.5 h-3.5" />
              <span>Gemini 3 Flash</span>
            </div>
            
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="pl-2 border-l border-slate-200 dark:border-slate-800 flex items-center">
              <Logo className="w-10 h-10 drop-shadow-sm" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Intro Section */}
        {status === ProcessingStatus.IDLE && !result && (
          <div className="text-center mb-12 max-w-3xl mx-auto animate-in fade-in slide-in-from-top-4 duration-1000">
             <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-6 border border-blue-100 dark:border-blue-800">
                <Info className="w-3.5 h-3.5" />
                OCR + AI Semantic Analysis
             </span>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">
              Digitize Your Clothing Labels <span className="text-blue-600 dark:text-primary">Instantly</span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Professional-grade extraction for retail inventory. Upload labels to capture Brand, Style, Size, and Barcodes in structured formats.
            </p>
          </div>
        )}

        <div className="flex flex-col items-center space-y-10">
          
          {!currentFile ? (
            <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto">
                <button 
                  onClick={() => setIsCameraOpen(true)}
                  className="flex-1 w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[24px] shadow-xl shadow-blue-500/20 transition-all active:scale-95 text-lg font-bold"
                >
                  <Camera className="w-6 h-6" />
                  Live Scan Label
                </button>
                <div className="text-slate-400 font-bold text-xs uppercase tracking-widest px-4">OR</div>
                <div className="flex-1 w-full sm:w-auto">
                    {/* The FileUploader is now just a dropzone, but we can wrap it or style it as a secondary option */}
                </div>
              </div>

              <FileUploader 
                onFileSelected={handleFileSelect} 
                isProcessing={status === ProcessingStatus.PROCESSING}
              />
            </div>
          ) : (
            <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-500">
              <FilePreview file={currentFile} onClear={handleClear} />
              
              {status === ProcessingStatus.IDLE && (
                 <div className="flex flex-col items-center gap-4">
                    <button
                      onClick={handleExtract}
                      className="group relative inline-flex items-center justify-center px-10 py-4 text-lg font-bold text-white transition-all duration-300 bg-blue-600 dark:bg-primary rounded-2xl hover:bg-blue-700 dark:hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-1 active:scale-95 w-full sm:w-auto"
                    >
                      <Scan className="w-5 h-5 mr-3" />
                      Process Label Data
                    </button>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Powered by Google Gemini 3 High-Performance Vision</p>
                 </div>
              )}
            </div>
          )}

          {/* Processing Loader */}
          {status === ProcessingStatus.PROCESSING && (
            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="relative mb-8">
                <Loader2 className="w-20 h-20 text-blue-600 dark:text-primary animate-spin" />
                <div className="absolute inset-0 bg-blue-600 dark:bg-primary blur-3xl opacity-20 animate-pulse rounded-full"></div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white text-center">Reading Label Details...</h3>
              <div className="mt-4 flex flex-col items-center gap-2">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                  Detecting Barcodes
                </span>
                <span className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400">
                   <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping delay-150"></span>
                  Parsing Model Codes
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {status === ProcessingStatus.ERROR && (
            <div className="flex flex-col items-center gap-4 p-8 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 rounded-3xl border border-red-100 dark:border-red-900/20 max-w-md animate-in shake duration-500 shadow-xl shadow-red-500/5">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="text-center">
                <h4 className="font-bold text-lg mb-1">Extraction Failed</h4>
                <p className="text-sm opacity-80">{error}</p>
              </div>
              <button 
                onClick={() => setStatus(ProcessingStatus.IDLE)}
                className="mt-2 px-6 py-2 bg-red-100 dark:bg-red-800/40 hover:bg-red-200 dark:hover:bg-red-800/60 rounded-xl text-sm font-bold transition-all"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Results Grid */}
          {status === ProcessingStatus.SUCCESS && result && result.data && (
             <div className="w-full space-y-6">
                <div className="flex justify-center">
                  <button 
                    onClick={handleClear}
                    className="group text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-primary flex items-center gap-2 transition-all bg-white dark:bg-slate-900 px-6 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                  >
                    <span className="group-hover:-translate-x-1 transition-transform">←</span> 
                    New Scan / Upload
                  </button>
                </div>
                <ResultViewer data={result.data} />
             </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
