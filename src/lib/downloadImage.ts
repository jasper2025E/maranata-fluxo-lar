/**
 * Downloads an image from a URL by fetching it as a blob.
 * Works for both same-origin and CORS-enabled URLs.
 */
export async function downloadImage(url: string, filename?: string) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const ext = blob.type.split("/")[1] || "png";
    const name = filename || `download-${Date.now()}.${ext}`;

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error("Error downloading image:", error);
    // Fallback: open in new tab
    window.open(url, "_blank");
  }
}
