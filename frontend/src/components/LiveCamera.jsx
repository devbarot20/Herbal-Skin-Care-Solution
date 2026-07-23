import { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { Camera, RefreshCw, CheckCircle2 } from 'lucide-react';
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';
import { supabase } from '../supabaseClient';
import { getApiUrl } from '../config';

export default function LiveCamera({ onResult, token }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isActive, setIsActive] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [captured, setCaptured] = useState(false);

    // Face detection state
    const [faceDetector, setFaceDetector] = useState(null);
    const [isAligned, setIsAligned] = useState(false);
    const [alignmentProgress, setAlignmentProgress] = useState(0); // 0 to 100

    // Refs for detection loop
    const requestRef = useRef();
    const lastVideoTimeRef = useRef(-1);
    const alignedStartTimeRef = useRef(null);

    // Initialize MediaPipe
    useEffect(() => {
        const initializeFaceDetector = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
                );
                const detector = await FaceDetector.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    minDetectionConfidence: 0.7,
                    minSuppressionThreshold: 0.3
                });
                setFaceDetector(detector);
            } catch (err) {
                console.error("Failed to initialize Face Detector", err);
            }
        };
        initializeFaceDetector();

        return () => {
            if (faceDetector) faceDetector.close();
        };
    }, []);

    const captureAndAnalyze = useCallback(async () => {
        if (!videoRef.current || isAnalyzing || captured) return;

        // Freeze frame and stop camera
        setCaptured(true);
        setIsAligned(false);
        setIsActive(false);

        const canvas = canvasRef.current;
        const video = videoRef.current;

        // Optimize resolution: Scale down large camera feeds to max 640px to speed up network payload
        const maxDim = 640;
        let w = video.videoWidth || 640;
        let h = video.videoHeight || 480;
        if (w > maxDim || h > maxDim) {
            if (w > h) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
            } else {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
            }
        }
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Stop video tracks
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }

        try {
            setIsAnalyzing(true);

            // 1. Check active Supabase session
            if (!token) {
                alert("Please log in first to save scans!");
                setCaptured(false);
                setIsAnalyzing(false);
                return;
            }

            // 2. Convert canvas to compressed base64 JPEG (75% quality)
            const base64Image = canvas.toDataURL('image/jpeg', 0.75);

            // 3. Send to FastAPI /predict-frame with 25s timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 25000);

            const res = await fetch(`${getApiUrl()}/predict-frame`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ image: base64Image }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!res.ok) {
                throw new Error(`Server returned status ${res.status}`);
            }

            const result = await res.json();
            onResult(result);
        } catch (err) {
            console.error("Frame analysis failed:", err);
            const msg = err.name === 'AbortError'
                ? 'Server response timed out. The backend server might be starting up (Render free tier sleeps after 15 minutes of inactivity). Please try again in a few seconds.'
                : `Analysis failed (${err.message || 'Network error'}). Make sure the backend server is running.`;
            alert(msg);
            setCaptured(false); // allow retry
        } finally {
            setIsAnalyzing(false);
        }
    }, [isAnalyzing, captured, onResult, token]);

    // Face detection loop
    const detectFaces = useCallback(async () => {
        if (!faceDetector || !videoRef.current || videoRef.current.readyState < 2 || captured || !isActive) {
            if (!captured && isActive) {
                requestRef.current = requestAnimationFrame(detectFaces);
            }
            return;
        }

        const video = videoRef.current;
        let startTimeMs = performance.now();

        if (video.currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = video.currentTime;

            try {
                const results = faceDetector.detectForVideo(video, startTimeMs);

                // Alignment Logic
                if (results.detections.length === 1) {
                    const face = results.detections[0];
                    const bbox = face.boundingBox;

                    // Convert bounding box to percentages
                    const widthPct = bbox.width / video.videoWidth;
                    // const heightPct = bbox.height / video.videoHeight;
                    const centerX = (bbox.originX + bbox.width / 2) / video.videoWidth;
                    const centerY = (bbox.originY + bbox.height / 2) / video.videoHeight;

                    // Check if face is centered and large enough (relative to the dotted frame)
                    // The dotted frame is a square in the center (approx 50-60% of width/height)
                    const isCenteredX = centerX > 0.35 && centerX < 0.65;
                    const isCenteredY = centerY > 0.35 && centerY < 0.65;
                    const isRightSize = widthPct > 0.2 && widthPct < 0.6; // Face should fill a good portion

                    if (isCenteredX && isCenteredY && isRightSize) {
                        setIsAligned(true);

                        if (!alignedStartTimeRef.current) {
                            alignedStartTimeRef.current = startTimeMs;
                        }

                        // Calculate progress (1 second = 100%)
                        const elapsed = startTimeMs - alignedStartTimeRef.current;
                        const progress = Math.min(100, (elapsed / 1000) * 100);
                        setAlignmentProgress(progress);

                        // Capture after 1 second of perfect alignment
                        if (progress >= 100 && !captured) {
                            captureAndAnalyze();
                            return; // Stop loop
                        }
                    } else {
                        // Reset if poorly aligned
                        setIsAligned(false);
                        setAlignmentProgress(0);
                        alignedStartTimeRef.current = null;
                    }
                } else {
                    // Reset if no face or multiple faces
                    setIsAligned(false);
                    setAlignmentProgress(0);
                    alignedStartTimeRef.current = null;
                }
            } catch (err) {
                console.error("Detection error:", err);
            }
        }

        requestRef.current = requestAnimationFrame(detectFaces);
    }, [faceDetector, captured, isActive, captureAndAnalyze]);

    useEffect(() => {
        if (isActive && !captured) {
            requestRef.current = requestAnimationFrame(detectFaces);
        }
        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [isActive, captured, detectFaces]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" } // Prefer front camera
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsActive(true);
                setCaptured(false);
                setIsAligned(false);
                setAlignmentProgress(0);
                alignedStartTimeRef.current = null;
            }
        } catch (err) {
            console.error("Error accessing webcam:", err);
            alert("Could not access webcam. Please check permissions.");
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setIsActive(false);
            setCaptured(false);
            setIsAligned(false);
            setAlignmentProgress(0);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => stopCamera();
    }, []);

    return (
        <div className="space-y-6">
            <div className="glass-card aspect-[4/5] relative flex items-center justify-center border-2 border-herbal-accent/30 overflow-hidden bg-black rounded-2xl">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover transition-opacity duration-300 ${(isActive || captured) ? 'opacity-100' : 'opacity-0'} ${!isActive && captured ? 'brightness-75' : ''}`}
                    style={{ transform: 'scaleX(-1)' }} // Mirror the video for front camera
                />

                {/* Captured Frame display via Canvas if video stops rendering on pause */}
                <canvas
                    ref={canvasRef}
                    className={`absolute inset-0 w-full h-full object-cover origin-center ${captured ? 'block' : 'hidden'}`}
                    style={{ transform: 'scaleX(-1)' }} // Keep mirrored state
                />

                {/* Dotted Alignment Frame */}
                {isActive && !captured && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="relative w-2/3 max-w-xs aspect-[3/4] flex flex-col items-center justify-center">
                            {/* Corner markers */}
                            <div className={`absolute inset-0 border-2 border-dashed rounded-[40px] transition-colors duration-300 ${isAligned ? 'border-green-400 border-solid bg-green-400/10' : 'border-white/50'}`}></div>

                            {/* Progress Ring (only visible when aligned) */}
                            {isAligned && (
                                <svg className="absolute w-32 h-32 transform -rotate-90 pointer-events-none transition-opacity duration-200">
                                    <circle cx="64" cy="64" r="56" stroke="transparent" strokeWidth="4" fill="none" />
                                    <circle
                                        cx="64" cy="64" r="56"
                                        stroke="#4ade80"
                                        strokeWidth="6"
                                        fill="none"
                                        strokeDasharray="352"
                                        strokeDashoffset={352 - (352 * alignmentProgress) / 100}
                                        className="transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(74,222,128,0.5)]"
                                    />
                                </svg>
                            )}

                            {/* Alignment Instructions */}
                            <div className="absolute -bottom-16 text-center w-full">
                                <span className={`px-4 py-1.5 rounded-full text-sm font-bold backdrop-blur-md transition-colors duration-300 ${isAligned ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-black/40 text-white/80 border border-white/20'}`}>
                                    {isAligned ? 'Hold still...' : 'Align face within frame'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Start Camera Button */}
                {!isActive && !captured && (
                    <button
                        onClick={startCamera}
                        className="absolute flex flex-col items-center gap-4 text-herbal-accent hover:scale-110 transition-transform"
                    >
                        <div className="w-20 h-20 rounded-full bg-herbal-accent/10 border border-herbal-accent/20 flex items-center justify-center backdrop-blur-sm">
                            <Camera className="w-10 h-10" />
                        </div>
                        <span className="font-bold text-xl text-white tracking-tight">Turn on Camera</span>
                        {!faceDetector && (
                            <span className="text-xs text-herbal-light/50 bg-black/40 px-3 py-1 rounded-full">
                                Loading AI Engine...
                            </span>
                        )}
                    </button>
                )}

                {/* Captured State Overlay */}
                {captured && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-herbal-accent text-herbal-dark px-4 py-1.5 rounded-full text-sm font-black tracking-tighter shadow-lg shadow-herbal-accent/20">
                        <CheckCircle2 className="w-4 h-4" />
                        IMAGE CAPTURED
                    </div>
                )}

                {/* Analyzing Indicator */}
                {isAnalyzing && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-herbal-dark/90 px-6 py-3 rounded-2xl text-sm text-herbal-accent border border-herbal-accent/30 shadow-xl backdrop-blur-md w-max">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span className="font-bold">Analyzing Skin Features...</span>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex gap-4">
                {(isActive || captured) && (
                    <button
                        onClick={startCamera}
                        disabled={isAnalyzing}
                        className="flex-1 bg-white/5 text-white border border-white/10 py-4 rounded-xl font-bold hover:bg-white/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-5 h-5" />
                        {captured ? 'Retake Photo' : 'Restart Camera'}
                    </button>
                )}
                {isActive && !captured && (
                    <button
                        onClick={stopCamera}
                        className="flex-1 bg-red-500/10 text-red-500 border border-red-500/20 py-4 rounded-xl font-bold hover:bg-red-500/20 transition-colors"
                    >
                        Stop
                    </button>
                )}
            </div>
        </div>
    );
}
