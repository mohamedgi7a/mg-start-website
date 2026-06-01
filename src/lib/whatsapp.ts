const MG_START_WHATSAPP_NUMBER = "966590947866";

export function createWhatsAppUrl(message: string): string {
  const text = encodeURIComponent(message);
  return `https://api.whatsapp.com/send?phone=${MG_START_WHATSAPP_NUMBER}&text=${text}`;
}
