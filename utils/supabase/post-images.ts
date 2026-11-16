import type { SupabaseClient } from "@supabase/supabase-js";

export const POST_IMAGES_BUCKET = "post-images";
export const SIGNED_IMAGE_URL_TTL_SECONDS = 60 * 60;

export function buildPostImageStoragePath(params: {
  daycareId: string;
  postId: string;
  fileName: string;
}): string {
  const sanitizedName = params.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uniquePrefix = crypto.randomUUID();
  return `${params.daycareId}/${params.postId}/${uniquePrefix}-${sanitizedName}`;
}

export async function createSignedPostImageUrl(
  supabase: SupabaseClient,
  storagePath: string,
  expiresIn: number = SIGNED_IMAGE_URL_TTL_SECONDS,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(POST_IMAGES_BUCKET)
    .createSignedUrl(storagePath, expiresIn);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}

export async function createSignedPostImageUrls(
  supabase: SupabaseClient,
  storagePaths: string[],
  expiresIn: number = SIGNED_IMAGE_URL_TTL_SECONDS,
): Promise<Map<string, string>> {
  const uniquePaths = [...new Set(storagePaths.filter(Boolean))];
  const entries = await Promise.all(
    uniquePaths.map(async (path) => {
      const signedUrl = await createSignedPostImageUrl(supabase, path, expiresIn);
      return [path, signedUrl] as const;
    }),
  );

  const result = new Map<string, string>();
  for (const [path, signedUrl] of entries) {
    if (signedUrl) {
      result.set(path, signedUrl);
    }
  }
  return result;
}
