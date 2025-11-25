import axios from "axios";

export async function getStreamsFromAttachment(attachments) {
  const streams = [];

  for (const item of attachments) {
    try {
      const response = await axios.get(item.url, { responseType: "stream" });
      const ext = item.type === "photo" ? "jpg" : item.type === "animated_image" ? "gif" : item.type;
      const filename = `${Date.now()}-${Math.floor(Math.random() * 9999)}.${ext}`;
      response.data.path = filename;
      streams.push(response.data);
    } catch (err) {
      console.error("❌ Failed to fetch attachment stream:", err);
    }
  }

  return streams;
}