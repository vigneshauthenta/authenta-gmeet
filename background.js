chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get("token", (data) => {
    if (!data.token) {
      chrome.tabs.create({ url: "options/options.html" });
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "uploadVideo") {
    chrome.storage.local.get(["token"], async ({ token }) => {
      if (!token) {
        sendResponse({ error: "Not logged in." });
        return;
      }
      try {
        const file = new File(
          [new Uint8Array(message.fileData)],
          message.fileName,
          { type: message.fileType }
        ); 
        const safeContentType = file.type || "video/webm";  

        const metaResponse = await fetch("https://platform.authenta.ai/api/media", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: file.name.replace(/\.[^/.]+$/, ""),
            contentType: safeContentType,
            size: file.size,
            modelType: message.modelType,
          }),
        });


        console.log("Meta API response:", metaResponse);
        let metaData;
        try {
          metaData = await metaResponse.json();
        } catch (jsonErr) {
          const text = await metaResponse.text();
          console.error("Meta API error: Response not JSON", text);
          throw new Error("API response not JSON: " + text);
        }
        if (!metaResponse.ok) {
          console.error("Meta API error:", metaData);
          throw new Error((metaData && metaData.message) || "Failed to get upload URL");
        }

        const uploadResponse = await fetch(metaData.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!uploadResponse.ok) throw new Error("Upload failed");

        let tries = 0;
        let media;
        while (tries < 20) {
          const statusResponse = await fetch(
            `https://platform.authenta.ai/api/media/${metaData.mid}`,
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
        if (media.status !== "PROCESSED")
          throw new Error("Processing timed out");

        sendResponse({ media });
      } catch (err) {
        sendResponse({ error: err.message });
      }
    });
    return true;
  }
}); 

