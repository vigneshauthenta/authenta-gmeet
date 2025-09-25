function isGMeet() {
  return window.location.hostname.includes("meet.google.com");
}

async function getToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["token"], ({ token }) => {
      resolve(token);
    });
  });
}

// Utility: Poll for processing status
async function pollMediaStatus(mid, token, maxTries = 20) {
  let tries = 0;
  let media;
  while (tries < maxTries) {
    const statusResponse = await fetch(
      `https://platform.authenta.ai/api/media/${mid}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    media = await statusResponse.json();
    if (media.status === "PROCESSED") break;
    await new Promise((resolve) =>
      setTimeout(resolve, media.status === "UPLOADED" ? 5000 : 1500)
    );
    tries++;
  }
  if (media.status !== "PROCESSED") throw new Error("Processing timed out");
  return media;
}

// Main upload function, similar to uploadSingle in your hook
async function uploadVideoFile({ file, modelType = "DF-1", onProgress }) {
  const token = await getToken();
  if (!token) throw new Error("Not logged in.");

  // Step 1: POST metadata
  const metaResponse = await fetch("https://platform.authenta.ai/api/media", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: file.name.replace(/\.[^/.]+$/, ""),
      contentType: file.type,
      size: file.size,
      modelType,
    }),
  });
  const metaData = await metaResponse.json();
  if (!metaResponse.ok) {
    throw new Error(metaData.message || "Failed to get upload URL");
  }

  // Step 2: PUT the video to uploadUrl (with progress if possible)
  await fetch(metaData.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (onProgress) onProgress(100);

  // Step 3: Poll for processing status
  const media = await pollMediaStatus(metaData.mid, token);
  return media;
}

// Record and upload the user's video
async function recordAndSendOwnVideo() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    let chunks = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const file = new File([blob], "gmeet-own-user-video.webm", { type: "video/webm" });

      try {
        // Optionally, show progress UI here
        const media = await uploadVideoFile({
          file,
          modelType: "DF-1",
          onProgress: (progress) => {
            // You can update a progress bar here if you wish
            console.log(`Upload progress: ${progress}%`);
          },
        });
        // Optionally, handle/display the result here
        console.log("Video processed:", media);
      } catch (err) {
        console.error("Upload failed:", err.message);
      }
    };

    recorder.start();
    setTimeout(() => recorder.stop(), 10000); // 10 seconds
  } catch (err) {
    console.error("Own video recording failed:", err);
  }
}

if (isGMeet()) {
  recordAndSendOwnVideo();
}