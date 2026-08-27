<?php

namespace App\Console\Commands;

use App\Mail\BookingReminderMail;
use App\Models\Booking;
use App\Models\NotificationLog;
use Carbon\Carbon;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

/**
 * Modul 10 — reminder H-1 & H-2jam sebelum jadwal main, satu-satunya
 * notifikasi otomatis di alur ini (konfirmasi ACC tetap WA manual
 * click-to-chat, lihat Modul 07). Jendela waktu dilebarkan 30 menit
 * (bukan pas H-24/H-2) supaya tidak kelewat kalau scheduler telat satu
 * ketukan — notification_logs mencegah kirim dobel walau tertangkap di
 * beberapa ketukan cron sekaligus.
 */
#[Signature('bookings:send-reminders')]
#[Description('Kirim reminder email H-1 dan H-2jam untuk booking confirmed')]
class SendBookingReminders extends Command
{
    public function handle(): void
    {
        $this->sendWindow('reminder_h1', now()->addHours(24));
        $this->sendWindow('reminder_h2jam', now()->addHours(2));
    }

    private function sendWindow(string $type, Carbon $target): void
    {
        $bookings = Booking::where('status', 'confirmed')
            ->whereNotNull('pelanggan_id')
            ->whereBetween('starts_at', [$target->copy()->subMinutes(15), $target->copy()->addMinutes(15)])
            ->whereDoesntHave('notificationLogs', fn ($q) => $q->where('type', $type))
            ->with(['pelanggan:id,name,email', 'court:id,name,sport,venue_id', 'court.venue:id,name'])
            ->get();

        foreach ($bookings as $booking) {
            Mail::to($booking->pelanggan->email)->send(new BookingReminderMail($booking, $type));
            NotificationLog::create([
                'booking_id' => $booking->id,
                'channel' => 'email',
                'type' => $type,
                'status' => 'sent',
                'sent_at' => now(),
            ]);
        }

        $this->info(count($bookings)." reminder {$type} terkirim.");
    }
}
