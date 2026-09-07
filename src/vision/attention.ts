import type { Detection } from "@mediapipe/tasks-vision";

export type AttentionState =
  | "focused"
  | "away"
  | "absent";

export interface AttentionResult {
  state: AttentionState;
  yaw: number;
  pitch: number;
  hasFace: boolean;
}

export interface AttentionSettings {
  sensitivity: number;
  countLookingDown: boolean;
}

interface Keypoint {
  x: number;
  y: number;
}

function calculatePose(
  keypoints: Keypoint[]
) {
  const eyes = [
    keypoints[0],
    keypoints[1],
  ].sort((a, b) => a.x - b.x);

  const nose = keypoints[2];
  const mouth = keypoints[3];

  const tragions = [
    keypoints[4],
    keypoints[5],
  ].sort((a, b) => a.x - b.x);

  const span =
    tragions[1].x -
    tragions[0].x;

  let yaw: number;

  if (span > 0.02) {
    yaw =
      ((nose.x -
        tragions[0].x) /
        span -
        0.5) *
      2;
  } else {
    const eyeMid =
      (eyes[0].x +
        eyes[1].x) /
      2;

    const distance =
      Math.max(
        0.0001,
        eyes[1].x -
          eyes[0].x
      );

    yaw =
      (nose.x - eyeMid) /
      distance;
  }

  const eyeMidY =
    (eyes[0].y +
      eyes[1].y) /
    2;

  const height =
    mouth.y - eyeMidY;

  const pitch =
    height > 0.01
      ? ((nose.y -
          eyeMidY) /
          height -
          0.5) *
        2
      : 0;

  return {
    yaw: Math.max(
      -1.5,
      Math.min(1.5, yaw)
    ),

    pitch: Math.max(
      -1.5,
      Math.min(1.5, pitch)
    ),
  };
}

export function classifyAttention(
  detection: Detection | null,
  settings: AttentionSettings,
  yawOffset = 0,
  pitchOffset = 0
): AttentionResult {
  // No face detected
  if (
    !detection ||
    !detection.keypoints ||
    detection.keypoints.length < 6
  ) {
    return {
      state: "absent",
      yaw: 0,
      pitch: 0,
      hasFace: false,
    };
  }

  const pose =
    calculatePose(
      detection.keypoints
    );

  const yaw = pose.yaw;
  const pitch = pose.pitch;

  const yawDifference =
    Math.abs(
      yaw - yawOffset
    );

  const yawThreshold =
    settings.sensitivity / 100;

  // Looking left or right
  if (
    yawDifference >
    yawThreshold
  ) {
    return {
      state: "away",
      yaw,
      pitch,
      hasFace: true,
    };
  }

  // Optional looking up/down detection
  if (
    settings.countLookingDown &&
    Math.abs(
      pitch - pitchOffset
    ) > 0.5
  ) {
    return {
      state: "away",
      yaw,
      pitch,
      hasFace: true,
    };
  }

  return {
    state: "focused",
    yaw,
    pitch,
    hasFace: true,
  };
}