
import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        reject(new Error("Unable to read report file."));
        return;
      }

      resolve(result.split(",")[1]);
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function downloadFile(blob, filename) {
  if (!(blob instanceof Blob)) {
    throw new Error("Invalid report file.");
  }

  // Keep normal website downloads unchanged.
  if (!Capacitor.isNativePlatform()) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }

  // Save the generated report inside Android app cache.
  const base64 = await blobToBase64(blob);

  const result = await Filesystem.writeFile({
    path: filename,
    data: base64,
    directory: Directory.Cache,
    recursive: true,
  });

  const fileUri = result.uri;

  // Open Android's native share/save options.
  await Share.share({
  title: filename,
  text: "Your report is ready.",
  files: [fileUri],
  dialogTitle: "Save or share report",
});
}

