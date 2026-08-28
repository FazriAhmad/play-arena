<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\AuthorizesVenue;
use App\Http\Controllers\Concerns\CancelsBookings;
use App\Http\Controllers\Concerns\CreatesBookings;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Court;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Modul 07 — Kelola Booking Masuk. Sisi Staff/Owner: gerbang ACC wajib
 * untuk setiap booking baru, konfirmasi pembayaran manual (transfer
 * langsung ke rekening venue, di luar Midtrans — Modul 06 belum
 * terintegrasi), input booking walk-in, dan pembatalan booking (Modul 09,
 * alasan wajib — beda dari pembatalan pelanggan sendiri yang opsional).
 */
class ManageBookingController extends Controller
{
    use AuthorizesVenue;
    use CancelsBookings;
    use CreatesBookings;

    /** Daftar booking masuk untuk venue yang dikelola user login — filter status/tanggal/lapangan. */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $venueIds = $user->hasRole('owner')
            ? $user->ownedVenues()->pluck('id')
            : $user->venues()->pluck('id');

        $bookings = Booking::query()
            ->whereHas('court', fn ($q) => $q->whereIn('venue_id', $venueIds))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('date'), fn ($q) => $q->whereDate('starts_at', $request->string('date')))
            ->when($request->filled('court_id'), fn ($q) => $q->where('court_id', $request->integer('court_id')))
            ->with(['court:id,name,venue_id,price_per_hour', 'court.venue:id,name', 'pelanggan:id,name,phone', 'refunds'])
            ->orderByDesc('starts_at')
            ->get();

        return response()->json(['data' => $bookings]);
    }

    public function accept(Request $request, Booking $booking): JsonResponse
    {
        $this->authorizeVenueStaff($request->user(), $booking->court->venue);
        abort_unless($booking->status === 'menunggu_acc', 422, 'Booking ini sudah diproses sebelumnya.');

        $booking->update(['status' => 'menunggu_bayar']);

        return response()->json(['data' => $booking->fresh()]);
    }

    public function reject(Request $request, Booking $booking): JsonResponse
    {
        $this->authorizeVenueStaff($request->user(), $booking->court->venue);
        abort_unless($booking->status === 'menunggu_acc', 422, 'Booking ini sudah diproses sebelumnya.');

        $data = $request->validate(['reason' => ['required', 'string', 'max:255']]);
        $booking->update(['status' => 'rejected', 'reject_reason' => $data['reason']]);

        return response()->json(['data' => $booking->fresh()]);
    }

    /** Modul 09 — pembatalan oleh Staff/Owner, alasan wajib diisi. Kebijakan refund sama seperti pembatalan pelanggan. */
    public function cancel(Request $request, Booking $booking): JsonResponse
    {
        $this->authorizeVenueStaff($request->user(), $booking->court->venue);
        $data = $request->validate(['reason' => ['required', 'string', 'max:255']]);

        $booking = $this->cancelBooking($booking, $data['reason']);

        return response()->json(['data' => $booking->load('refunds')]);
    }

    /** Konfirmasi pembayaran manual — transfer langsung ke rekening venue, di luar Midtrans. */
    public function confirmPayment(Request $request, Booking $booking): JsonResponse
    {
        $this->authorizeVenueStaff($request->user(), $booking->court->venue);
        abort_unless($booking->status === 'menunggu_bayar', 422, 'Booking ini belum menunggu pembayaran.');

        $hours = $booking->starts_at->diffInHours($booking->ends_at);
        $amount = max(0, $booking->court->price_per_hour * $hours - ($booking->discount_amount ?? 0));
        Payment::create([
            'booking_id' => $booking->id,
            'method' => 'manual',
            'amount' => $amount,
            'status' => 'paid',
            'confirmed_by' => $request->user()->id,
            'confirmed_at' => now(),
        ]);
        $booking->update(['status' => 'confirmed']);

        return response()->json(['data' => $booking->fresh()]);
    }

    /** Booking walk-in — pelanggan datang langsung, bayar di tempat, langsung confirmed. */
    public function walkIn(Request $request, Court $court): JsonResponse
    {
        $venue = $court->venue;
        $this->authorizeVenueStaff($request->user(), $venue);
        abort_unless($court->is_active, 404);

        $data = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'start_hour' => ['required', 'integer', 'min:0', 'max:23'],
            'duration_hours' => ['required', 'integer', 'min:1', 'max:12'],
            'guest_name' => ['required', 'string', 'max:255'],
            'contact_wa' => ['required', 'string', 'max:30'],
        ]);

        $booking = $this->createBooking($court, $venue, $data, [
            'guest_name' => $data['guest_name'],
            'created_by' => $request->user()->id,
            'status' => 'confirmed',
        ]);

        Payment::create([
            'booking_id' => $booking->id,
            'method' => 'manual',
            'amount' => $court->price_per_hour * $data['duration_hours'],
            'status' => 'paid',
            'confirmed_by' => $request->user()->id,
            'confirmed_at' => now(),
        ]);

        return response()->json(['data' => $booking->fresh()], 201);
    }
}
