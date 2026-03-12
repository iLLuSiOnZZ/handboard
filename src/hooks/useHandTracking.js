  /**
 * useHandTracking.js
 * Initialises MediaPipe Hands and feeds frames from the webcam.
 * MediaPipe scripts are expected to be loaded via <script> tags in index.html
 * so window.Hands and window.Camera are available globally.
 */

import { useEffect, useRef } from 'react';

export function useHandTracking(videoRef, onResults, onReady) {
  const handsRef = useRef(null);
  const cameraRef = useRef(null);
  // Keep latest callback in a ref so the effect closure never goes stale
  const onResultsRef = useRef(onResults);
  const onReadyRef = useRef(onReady);

  useEffect(() => { onResultsRef.current = onResults; }, [onResults]);
  useEffect(() => { onReadyRef.current = onReady; }, [onReady]);

  useEffect(() => {
    // Poll until MediaPipe globals appear (CDN scripts may load async)
    let pollTimer = null;

    function init() {
      if (!window.Hands || !window.Camera) {
        pollTimer = setTimeout(init, 200);
        return;
      }

      const hands = new window.Hands({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`,
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.72,
        minTrackingConfidence: 0.55,
      });

      hands.onResults((results) => {
        if (onResultsRef.current) onResultsRef.current(results);
      });

      // Signal ready once model weights are downloaded
      hands.initialize().then(() => {
        if (onReadyRef.current) onReadyRef.current(true);
      }).catch(() => {
        // Fallback: model may already be ready if initialize() isn't available
        if (onReadyRef.current) onReadyRef.current(true);
      });

      handsRef.current = hands;

      if (!videoRef.current) return;

      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (handsRef.current && videoRef.current) {
            try {
              await handsRef.current.send({ image: videoRef.current });
            } catch (_) {
              // Ignore send errors during teardown
            }
          }
        },
        width: 640,
        height: 480,
      });

      camera.start();
      cameraRef.current = camera;
    }

    init();

    return () => {
      clearTimeout(pollTimer);
      cameraRef.current?.stop();
      handsRef.current?.close();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { handsRef, cameraRef };
}
