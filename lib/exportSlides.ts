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
  };
};

const waitForImages = async (node: HTMLElement): Promise<void> => {
  const images = Array.from(node.querySelectorAll("img"));

  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }

          const done = () => resolve();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
        }),
    ),
  );
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
  saveAs(blob, makeSlideName(index, filePrefix));
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
  saveAs(blob, `${filePrefix}.zip`);
}
