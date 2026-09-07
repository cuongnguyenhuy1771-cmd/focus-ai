import { useEffect, useRef, useState } from "react";

import {
  detectFace,
  loadFaceDetector,
} from "../vision/detector";

import {
  classifyAttention,
  type AttentionState,
} from "../vision/attention";

interface CameraProps {
  enabled: boolean;
  onAttentionChange: (
    state: AttentionState
  ) => void;
}

function Camera({
  enabled,
  onAttentionChange,
}: CameraProps) {
  const videoRef =
    useRef<HTMLVideoElement | null>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  const animationRef =
    useRef<number | null>(null);

  const lastVideoTime =
    useRef(-1);

  const yawRef =
    useRef(0);

  const pitchRef =
    useRef(0);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      onAttentionChange("absent");
      return;
    }

    let cancelled = false;

    async function startCamera() {
      try {
        setError(null);

        // =============================
        // Load MediaPipe
        // =============================

        await loadFaceDetector();

        if (cancelled) {
          return;
        }

        // =============================
        // Request camera access
        // =============================

        const stream =
          await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: "user",
            },
            audio: false,
          });

        if (cancelled) {
          stream
            .getTracks()
            .forEach((track) => {
              track.stop();
            });

          return;
        }

        streamRef.current = stream;

        // =============================
        // Get video element
        // =============================

        const video = videoRef.current;

        if (video === null) {
          stream
            .getTracks()
            .forEach((track) => {
              track.stop();
            });

          streamRef.current = null;

          return;
        }

        // From this point onward, videoElement
        // is guaranteed to be an HTMLVideoElement.
        const videoElement: HTMLVideoElement =
          video;

        videoElement.srcObject = stream;

        await videoElement.play();

        if (cancelled) {
          return;
        }

        // =============================
        // Detection loop
        // =============================

        function detectionLoop(
          timestamp: number
        ) {
          if (cancelled) {
            return;
          }

          if (
            videoElement.readyState >= 2 &&
            videoElement.currentTime !==
              lastVideoTime.current
          ) {
            lastVideoTime.current =
              videoElement.currentTime;

            // Detect face
            const detection =
              detectFace(
                videoElement,
                timestamp
              );

            // Determine attention state
            const result =
              classifyAttention(
                detection,
                {
                  sensitivity: 22,
                  countLookingDown: false,
                },
                yawRef.current,
                pitchRef.current
              );

            // =============================
            // Smooth head movement
            // =============================

            if (result.hasFace) {
              yawRef.current +=
                (result.yaw -
                  yawRef.current) *
                0.35;

              pitchRef.current +=
                (result.pitch -
                  pitchRef.current) *
                0.35;
            }

            // Send result to App
            onAttentionChange(
              result.state
            );
          }

          animationRef.current =
            requestAnimationFrame(
              detectionLoop
            );
        }

        animationRef.current =
          requestAnimationFrame(
            detectionLoop
          );
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Camera error:",
          err
        );

        setError(
          "Unable to start the camera or face detector."
        );

        onAttentionChange(
          "absent"
        );
      }
    }

    startCamera();

    // =============================
    // Cleanup
    // =============================

    return () => {
      cancelled = true;

      // Stop detection loop
      if (
        animationRef.current !== null
      ) {
        cancelAnimationFrame(
          animationRef.current
        );

        animationRef.current = null;
      }

      // Stop webcam
      if (streamRef.current !== null) {
        streamRef.current
          .getTracks()
          .forEach((track) => {
            track.stop();
          });

        streamRef.current = null;
      }

      // Reset detection state
      lastVideoTime.current = -1;

      yawRef.current = 0;
      pitchRef.current = 0;

      onAttentionChange(
        "absent"
      );
    };
  }, [
    enabled,
    onAttentionChange,
  ]);

  return (
    <div>
      <div className="camera-preview">
        {enabled ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
          />
        ) : (
          <div className="camera-placeholder">
            <div className="camera-icon">
              ◉
            </div>

            <p>
              Camera is off
            </p>

            <span>
              Enable the camera to
              track your focus.
            </span>
          </div>
        )}
      </div>

      {error && (
        <p className="camera-error">
          {error}
        </p>
      )}
    </div>
  );
}

export default Camera;