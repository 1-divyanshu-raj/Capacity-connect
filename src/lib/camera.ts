/**
 * Camera & Hardware Biometric Sensor Utility
 * 
 * Safely checks hardware camera availability and requests webcam permissions
 * for high-speed 1-to-N face vector recognition and biometric clearance.
 */

export interface CameraDeviceStatus {
  available: boolean;
  deviceCount: number;
  devices: MediaDeviceInfo[];
  error: string | null;
}

export interface CameraAccessResult {
  success: boolean;
  stream: MediaStream | null;
  error: string | null;
  errorCode?: 'NOT_SUPPORTED' | 'PERMISSION_DENIED' | 'NOT_FOUND' | 'NOT_READABLE' | 'UNKNOWN';
  devicesAvailable: boolean;
}

export type PermissionStateResult = 'granted' | 'denied' | 'prompt' | 'unsupported';

/**
 * Checks whether any video input hardware devices (webcams/cameras) are connected to the host.
 */
export async function checkCameraAvailability(): Promise<CameraDeviceStatus> {
  if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return {
      available: false,
      deviceCount: 0,
      devices: [],
      error: 'MediaDevices API is not supported in this environment.'
    };
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((device) => device.kind === 'videoinput');

    return {
      available: videoDevices.length > 0,
      deviceCount: videoDevices.length,
      devices: videoDevices,
      error: null
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to enumerate media hardware devices.';
    return {
      available: false,
      deviceCount: 0,
      devices: [],
      error: message
    };
  }
}

/**
 * Checks the current browser permission status for camera access if supported by Permissions API.
 */
export async function checkCameraPermissionStatus(): Promise<PermissionStateResult> {
  if (typeof window === 'undefined' || !navigator.permissions || !navigator.permissions.query) {
    return 'unsupported';
  }

  try {
    // Note: 'camera' name can throw on some browsers that only accept standard names
    const status = await navigator.permissions.query({ name: 'camera' as unknown as PermissionName });
    return status.state as PermissionStateResult;
  } catch {
    return 'unsupported';
  }
}

/**
 * Safely requests camera permissions and retrieves a live MediaStream.
 * Catches and translates hardware or security errors into user-friendly diagnostic codes.
 *
 * @param customConstraints Optional custom MediaTrackConstraints or video settings
 */
export async function requestWebcamStream(
  customConstraints?: MediaTrackConstraints
): Promise<CameraAccessResult> {
  if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      success: false,
      stream: null,
      error: 'Webcam video access API (navigator.mediaDevices.getUserMedia) is not supported in this browser.',
      errorCode: 'NOT_SUPPORTED',
      devicesAvailable: false
    };
  }

  // Pre-check hardware device availability
  const availability = await checkCameraAvailability();
  if (!availability.available && !availability.error) {
    return {
      success: false,
      stream: null,
      error: 'No camera hardware device found connected to this system.',
      errorCode: 'NOT_FOUND',
      devicesAvailable: false
    };
  }

  const defaultConstraints: MediaStreamConstraints = {
    video: {
      facingMode: 'user',
      width: { ideal: 640 },
      height: { ideal: 480 },
      ...customConstraints
    },
    audio: false
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(defaultConstraints);
    return {
      success: true,
      stream,
      error: null,
      devicesAvailable: true
    };
  } catch (err: unknown) {
    let errorMessage = 'Failed to acquire video stream.';
    let errorCode: CameraAccessResult['errorCode'] = 'UNKNOWN';

    if (err instanceof DOMException || (err as Record<string, unknown>).name) {
      const errorName = (err as Record<string, unknown>).name;
      switch (errorName) {
        case 'NotAllowedError':
        case 'PermissionDeniedError':
          errorMessage = 'Camera permission was denied. Please allow camera access in your browser address bar.';
          errorCode = 'PERMISSION_DENIED';
          break;
        case 'NotFoundError':
        case 'DevicesNotFoundError':
          errorMessage = 'No camera or video capture hardware detected on this device.';
          errorCode = 'NOT_FOUND';
          break;
        case 'NotReadableError':
        case 'TrackStartError':
          errorMessage = 'Camera hardware is currently in use by another application or operating system process.';
          errorCode = 'NOT_READABLE';
          break;
        case 'OverconstrainedError':
          errorMessage = 'Camera does not meet requested resolution/constraints. Retrying with basic settings...';
          // Fallback retry with default unconstrained video
          try {
            const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            return {
              success: true,
              stream: fallbackStream,
              error: null,
              devicesAvailable: true
            };
          } catch {
            errorMessage = 'Camera constraints could not be satisfied.';
          }
          break;
        default:
          errorMessage = err instanceof Error ? err.message : String(err);
          errorCode = 'UNKNOWN';
      }
    } else if (err instanceof Error) {
      errorMessage = err.message;
    }

    return {
      success: false,
      stream: null,
      error: errorMessage,
      errorCode,
      devicesAvailable: availability.available
    };
  }
}

/**
 * Safely stops all active tracks on a MediaStream to release camera hardware and indicator LED.
 */
export function stopWebcamStream(stream: MediaStream | null | undefined): void {
  if (!stream) return;
  try {
    stream.getTracks().forEach((track) => {
      if (track.readyState === 'live') {
        track.stop();
      }
    });
  } catch (err) {
    console.warn('Error stopping camera stream tracks:', err);
  }
}
