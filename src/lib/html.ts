export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function formValue(form: HTMLFormElement, name: string): string {
  const value = new FormData(form).get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function numberValue(form: HTMLFormElement, name: string): number {
  const raw = formValue(form, name);
  return raw ? Number(raw) : 0;
}

export function nullableNumberValue(form: HTMLFormElement, name: string): number | null {
  const raw = formValue(form, name);
  return raw ? Number(raw) : null;
}

export function checkboxValue(form: HTMLFormElement, name: string): boolean {
  return new FormData(form).get(name) === "on";
}

export function csvLines(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}
