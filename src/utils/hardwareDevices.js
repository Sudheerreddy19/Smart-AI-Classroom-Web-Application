/**
 * hardwareDevices.js
 * Centralized hardware device manager for cameras and microphones.
 * Handles device enumeration, explicit external device prioritization (iBall Phocus 18B),
 * and localStorage preference persistence.
 */

const STORAGE_KEYS = {
  CAMERA: 'smart_classroom_preferred_camera_id',
  MIC: 'smart_classroom_preferred_mic_id',
};

/**
 * Enumerate all media devices and prioritize external hardware
 */
export async function getHardwareDevices() {
  if (!navigator?.mediaDevices?.enumerateDevices) {
    return { cameras: [], microphones: [], preferredCamera: null, preferredMic: null };
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === 'videoinput');
    const audioDevices = devices.filter(d => d.kind === 'audioinput');

    // Find external iBall webcam or USB camera (strict preference)
    const savedCamId = localStorage.getItem(STORAGE_KEYS.CAMERA);
    let preferredCam = videoDevices.find(d => d.deviceId === savedCamId);

    if (!preferredCam) {
      preferredCam = videoDevices.find(d => {
        const label = (d.label || '').toLowerCase();
        return label.includes('iball') || label.includes('phocus') || label.includes('external') || label.includes('usb') || label.includes('general webcam');
      });
    }

    // If external not found by explicit keyword, find any non-built-in webcam (avoiding 'integrated', 'internal', 'wide vision', 'hp', 'laptop')
    if (!preferredCam && videoDevices.length > 1) {
      preferredCam = videoDevices.find(d => {
        const label = (d.label || '').toLowerCase();
        return !label.includes('integrated') && !label.includes('internal') && !label.includes('hp ') && !label.includes('wide vision');
      });
    }

    // Fallback only if no other device exists
    if (!preferredCam && videoDevices.length > 0) {
      preferredCam = videoDevices[videoDevices.length - 1]; // External USB cams usually appear after built-in index 0
    }

    // Find external microphone
    const savedMicId = localStorage.getItem(STORAGE_KEYS.MIC);
    let preferredMic = audioDevices.find(d => d.deviceId === savedMicId);

    if (!preferredMic) {
      preferredMic = audioDevices.find(d => {
        const label = (d.label || '').toLowerCase();
        return label.includes('iball') || label.includes('phocus') || label.includes('external') || label.includes('usb');
      });
    }

    if (!preferredMic && audioDevices.length > 0) {
      preferredMic = audioDevices[0];
    }

    return {
      cameras: videoDevices,
      microphones: audioDevices,
      preferredCamera: preferredCam || null,
      preferredMic: preferredMic || null,
    };
  } catch (err) {
    console.warn('Error enumerating hardware devices:', err);
    return { cameras: [], microphones: [], preferredCamera: null, preferredMic: null };
  }
}

/**
 * Get getUserMedia video constraint prioritizing iBall external webcam
 */
export async function getPreferredCameraConstraints(idealWidth = 640, idealHeight = 480) {
  const { preferredCamera } = await getHardwareDevices();

  const videoConstraints = {
    width: { ideal: idealWidth },
    height: { ideal: idealHeight },
  };

  if (preferredCamera?.deviceId) {
    videoConstraints.deviceId = { exact: preferredCamera.deviceId };
  } else {
    videoConstraints.facingMode = 'user';
  }

  return { video: videoConstraints, audio: false };
}

/**
 * Save user preferred camera ID
 */
export function setPreferredCameraId(deviceId) {
  if (deviceId) {
    localStorage.setItem(STORAGE_KEYS.CAMERA, deviceId);
  }
}

/**
 * Save user preferred microphone ID
 */
export function setPreferredMicrophoneId(deviceId) {
  if (deviceId) {
    localStorage.setItem(STORAGE_KEYS.MIC, deviceId);
  }
}
