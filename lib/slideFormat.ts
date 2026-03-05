import type { PostData, PostFormat } from "@/lib/types";

export const STORY_SIZE = { width: 1080, height: 1920 } as const;
export const POST_SIZE = { width: 1080, height: 1350 } as const;

export const getSlideSize = (format: PostFormat) => {
  return format === "posteo" ? POST_SIZE : STORY_SIZE;
};

export const getPostFormat = (data: PostData): PostFormat => {
  return data.postType === "torneos" ? data.format : "historia";
};
