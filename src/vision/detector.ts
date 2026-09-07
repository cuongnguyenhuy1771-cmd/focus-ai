import {
  FaceDetector,
  FilesetResolver,
  type Detection,
} from "@mediapipe/tasks-vision";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite";

let detector: FaceDetector | null = null;

export async function loadFaceDetector(): Promise<FaceDetector> {
  if (detector) {
    return detector;
  }

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  detector = await FaceDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: MODEL_URL,
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    minDetectionConfidence: 0.5,
  });

  return detector;
}

export function detectFace(
  video: HTMLVideoElement,
  timestamp: number
): Detection | null {
  if (!detector) {
    return null;
  }

  try {
    const result = detector.detectForVideo(video, timestamp);

    if (
      result.detections &&
      result.detections.length > 0
    ) {
      return result.detections[0];
    }

    return null;
  } catch (error) {
    console.error("Face detection error:", error);
    return null;
  }
}