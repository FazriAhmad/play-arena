@component('mail::message')
# Pengingat Jadwal Main {{ $isH1 ? 'Besok' : '2 Jam Lagi' }}

Halo {{ $booking->pelanggan->name }},

Ini pengingat booking Anda di **{{ $booking->court->venue->name }}**:

@component('mail::panel')
**Lapangan:** {{ $booking->court->name }} ({{ $booking->court->sport }})<br>
**Tanggal:** {{ $booking->starts_at->translatedFormat('l, d F Y') }}<br>
**Jam:** {{ $booking->starts_at->format('H:i') }}–{{ $booking->ends_at->format('H:i') }}
@endcomponent

Jangan lupa datang tepat waktu ya. Sampai jumpa di lapangan!

Terima kasih,<br>
{{ config('app.name') }}
@endcomponent
