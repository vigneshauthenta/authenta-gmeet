async function getToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["token"], ({ token }) => {
      resolve(token);
    });
  });
}

function showStatus(message) {
  let overlay = document.getElementById("authenta-status-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "authenta-status-overlay";
    Object.assign(overlay.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      zIndex: 99999,
      background: "#222",
      color: "#fff",
      padding: "16px 24px",
      borderRadius: "8px",
      fontSize: "16px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      fontFamily: "sans-serif",
      transition: "opacity 0.3s",
    });
    document.body.appendChild(overlay);
  }
  overlay.textContent = message;
  overlay.style.display = "block";
}

function hideStatus() {
  const overlay = document.getElementById("authenta-status-overlay");
  if (overlay) overlay.style.display = "none";
}

async function uploadVideoFile({ file, modelType = "DF-1", onProgress }) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function () {
      chrome.runtime.sendMessage(
        {
          type: "uploadVideo",
          fileData: Array.from(new Uint8Array(reader.result)),

          fileName: file.name,
          fileType: file.type,
          modelType,
        },
        (response) => {
          if (response && response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response.media);
          }
        }
      );
    };
    reader.onerror = function (e) {
      reject(new Error("Failed to read file"));
    };
    reader.readAsArrayBuffer(file);
  });
};

const analyzedParticipants = new Set();

function isOwnTile(tile) {
  const label = tile.getAttribute('aria-label') || '';
  return /you\b/i.test(label);
}

function observeParticipantVideos(onNewVideo) {
  const seen = new Set();
  function scan() {
    const videos = document.querySelectorAll('[data-participant-id] video');
    videos.forEach(video => {
      const tile = video.closest('[data-participant-id]');
      if (!tile) return;
      const participantId = tile.getAttribute('data-participant-id'); 
      if (
        participantId &&
        !seen.has(participantId) &&
        !analyzedParticipants.has(participantId) &&
        !isOwnTile(tile)
      ) {
        seen.add(participantId);
        onNewVideo(video, participantId);
      }
    });
  }
  scan();
  const observer = new MutationObserver(() => scan());
  observer.observe(document.body, { childList: true, subtree: true });
}

async function recordTileVideo(video, participantId, durationMs = 5000, fps = 10) {
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    setTimeout(() => recordTileVideo(video, participantId, durationMs, fps), 500);
    return;
  }
  analyzedParticipants.add(participantId); // Mark as analyzed

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
  let chunks = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  recorder.onstop = async () => {
    const blob = new Blob(chunks, { type: "video/webm" });
    const file = new File([blob], "gmeet-participant-tile.webm", { type: "video/webm" });
    showStatus("Uploading participant tile video...");
    try {
      const media = await uploadVideoFile({
        file,
        modelType: "DF-1",
        onProgress: (progress) => {
          showStatus(`Uploading tile video... ${progress}%`);
        },
      });
      showStatus("Processing tile video...");
      setTimeout(() => {
        showStatus("Done! Tile video processed.");
      }, 1000);
      setTimeout(hideStatus, 3000);
      console.log("Tile video processed:", media);
    } catch (err) {
      showStatus("Upload failed: " + err.message); 
    }
  };

  recorder.start();

  // Draw frames to canvas at the desired FPS
  let running = true;
  function drawFrame() {
    if (!running) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setTimeout(drawFrame, 1000 / fps);
  }
  drawFrame();

  setTimeout(() => {
    running = false;
    recorder.stop();
  }, durationMs);
}

observeParticipantVideos((video, participantId) => { 
  console.log("New participant video detected!", participantId, video);
  recordTileVideo(video, participantId, 5000, 10); // Record for 5 seconds at 10 FPS
}); 
