/** Modul 10 — link wa.me click-to-chat, bukan WhatsApp Business API (lihat keputusan PRD). */
export function buildWaLink(adminWa: string, message: string): string {
  const digits = adminWa.replace(/\D/g, '');
  const normalized = digits.startsWith('0') ? '62' + digits.slice(1) : digits;

  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

/** Modul 21 — pendaftaran member tetap manual (lihat ManageMembershipPage), ini cuma buka chat ke admin. */
export function buildMembershipWaMessage(params: { customerName: string; venueName: string; price: number }): string {
  const { customerName, venueName, price } = params;

  return (
    `Halo Admin ${venueName}, saya ${customerName} ingin daftar member bulanan (Rp${price.toLocaleString('id-ID')}/bulan).\n\n` +
    `Mohon info cara pembayarannya. Terima kasih.`
  );
}

export function buildBookingWaMessage(params: {
  customerName: string;
  venueName: string;
  courtName: string;
  date: string;
  timeRange: string;
  bookingId: number;
}): string {
  const { customerName, venueName, courtName, date, timeRange, bookingId } = params;

  return (
    `Halo Admin ${venueName}, saya ${customerName} ingin konfirmasi booking:\n\n` +
    `Lapangan: ${courtName}\n` +
    `Tanggal: ${date}\n` +
    `Jam: ${timeRange}\n` +
    `Booking ID: #${bookingId}\n\n` +
    `Mohon di-ACC. Terima kasih.`
  );
}
