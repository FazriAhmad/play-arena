<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Court;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Modul 13 — rating & ulasan per lapangan. Hanya pelanggan yang bookingnya
 * berstatus "completed" boleh review (dicek lewat booking_id, satu booking
 * cuma boleh satu review) — mencegah review palsu dari orang yang belum
 * pernah main.
 */
class ReviewController extends Controller
{
    public function store(Request $request, Booking $booking): JsonResponse
    {
        abort_unless($booking->pelanggan_id === $request->user()->id, 403, 'Bukan booking Anda.');
        abort_unless($booking->status === 'completed', 422, 'Cuma booking yang sudah selesai main yang bisa direview.');
        abort_if($booking->review()->exists(), 422, 'Booking ini sudah direview.');

        $data = $request->validate([
            'rating' => ['required', 'integer', 'between:1,5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $review = Review::create($data + [
            'court_id' => $booking->court_id,
            'pelanggan_id' => $booking->pelanggan_id,
            'booking_id' => $booking->id,
        ]);

        return response()->json(['data' => $review], 201);
    }

    /** Daftar ulasan publik per lapangan — dipakai halaman detail venue. */
    public function index(Court $court): JsonResponse
    {
        $reviews = $court->reviews()
            ->with('pelanggan:id,name')
            ->latest()
            ->get(['id', 'pelanggan_id', 'rating', 'comment', 'created_at']);

        return response()->json(['data' => $reviews]);
    }
}
