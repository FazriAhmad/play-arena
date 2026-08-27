<?php

namespace App\Mail;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/** Modul 10 — reminder H-1 & H-2jam, satu-satunya kanal otomatis (WA di alur ini murni manual click-to-chat). */
class BookingReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Booking $booking, public string $type) {}

    public function envelope(): Envelope
    {
        $label = $this->type === 'reminder_h1' ? 'Besok' : '2 Jam Lagi';

        return new Envelope(
            subject: "Pengingat Booking: Main {$label} — PlayArena",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.booking-reminder',
            with: [
                'booking' => $this->booking,
                'isH1' => $this->type === 'reminder_h1',
            ],
        );
    }
}
