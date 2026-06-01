import { getSupabaseClient } from "./supabase";

export function getPublicImageUrl(bucket: string | null, path: string | null): string | null {
  if (!bucket || !path) {
    return null;
  }

  const supabase = getSupabaseClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
