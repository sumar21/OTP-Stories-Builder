import { saveAs } from "file-saver";
import JSZip from "jszip";
import { toPng } from "html-to-image";
import { getSlideSize } from "@/lib/slideFormat";
import type { PostFormat, SlideData } from "@/lib/types";

const buildCaptureConfig = (format: PostFormat) => {
  const size = getSlideSize(format);

  return {
    cacheBust: true,
    pixelRatio: 1,
    width: size.width,
    height: size.height,
    canvasWidth: size.width,
    canvasHeight: size.height,
    backgroundColor: "#0b38d6",
  };
};

const isMobileChrome = (): boolean => {
  if (typeof navigator === "undefined") {
    return false;
  }

  const ua = navigator.userAgent;
  return /CriOS/i.test(ua) || (/Android/i.test(ua) && /Chrome/i.test(ua));
};

const triggerAnchorDownload = (href: string, fileName: string): void => {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = fileName;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
};

const shareBlob = async (blob: Blob, fileName: string): Promise<boolean> => {
  if (typeof navigator === "undefined" || typeof File === "undefined") {
    return false;
  }

  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
  };

  if (typeof nav.share !== "function") {
    return false;
  }

  try {
    const file = new File([blob], fileName, { type: blob.type || "application/octet-stream" });
    const shareData = { files: [file], title: fileName } as ShareData;
    if (typeof nav.canShare === "function" && !nav.canShare(shareData)) {
      return false;
    }
    await nav.share(shareData);
    return true;
  } catch {
    return false;
  }
};

const downloadBlob = async (blob: Blob, fileName: string): Promise<void> => {
  if (!isMobileChrome()) {
    saveAs(blob, fileName);
    return;
  }

  if (await shareBlob(blob, fileName)) {
    return;
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    triggerAnchorDownload(objectUrl, fileName);
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
  }
};

const waitForImage = (img: HTMLImageElement): Promise<void> => {
  return new Promise((resolve) => {
    // Some mobile browsers mark offscreen lazy images as complete without decoded pixels.
    if (img.complete && img.naturalWidth > 0) {
      resolve();
      return;
    }

    img.loading = "eager";

    let settled = false;
    const timeoutId = window.setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      resolve();
    }, 3000);

    const done = () => {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(timeoutId);
      resolve();
    };

    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", done, { once: true });

    if (typeof img.decode === "function") {
      void img.decode().then(done).catch(() => {
        // decode() may reject for SVGs or pending resources; load/error listeners handle completion.
      });
    }
  });
};

const waitForImages = async (node: HTMLElement): Promise<void> => {
  const images = Array.from(node.querySelectorAll("img"));
  await Promise.all(images.map((img) => waitForImage(img)));
};

const waitForNodeReady = async (node: HTMLElement): Promise<void> => {
  await document.fonts.ready;
  await waitForImages(node);
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
};

const makeSlideName = (index: number, filePrefix: string): string =>
  `${filePrefix}_${String(index + 1).padStart(2, "0")}.png`;

export async function exportCurrentSlidePng(
  node: HTMLElement,
  index: number,
  format: PostFormat,
  filePrefix = "otp_slide",
): Promise<void> {
  await waitForNodeReady(node);
  const dataUrl = await toPng(node, buildCaptureConfig(format));
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  await downloadBlob(blob, makeSlideName(index, filePrefix));
}

export async function exportAllSlidesZip(
  slides: SlideData[],
  renderForExport: (slide: SlideData) => Promise<HTMLElement>,
  format: PostFormat,
  filePrefix = "otp_slide",
): Promise<void> {
  const zip = new JSZip();
  const captureConfig = buildCaptureConfig(format);

  for (const slide of slides) {
    const node = await renderForExport(slide);
    await waitForNodeReady(node);
    const dataUrl = await toPng(node, captureConfig);
    const base64 = dataUrl.split(",")[1];
    zip.file(makeSlideName(slide.slideIndex, filePrefix), base64, { base64: true });
  }

  const blob = await zip.generateAsync({ type: "blob" });
  await downloadBlob(blob, `${filePrefix}.zip`);
}
