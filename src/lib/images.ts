import { getSupabaseClient } from "./supabase";

const allowedImageTypes = ["image/png", "image/jpeg", "image/webp"];

export function validateImage(file: File): string | null {
  if (!allowedImageTypes.includes(file.type)) {
    return "صيغة الصورة غير مدعومة. استخدم PNG أو JPG أو WebP.";
  }

  return null;
}

export async function uploadImage(bucket: string, file: File): Promise<string> {
  const validationError = validateImage(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const filename = `${crypto.randomUUID()}.${extension}`;
  const path = `${new Date().getFullYear()}/${filename}`;
  const supabase = getSupabaseClient();

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false
  });

  if (error) {
    throw new Error(`تعذر رفع الصورة: ${error.message}`);
  }

  return path;
}
