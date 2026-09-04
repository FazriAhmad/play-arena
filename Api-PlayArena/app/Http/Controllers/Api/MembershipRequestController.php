<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Court;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Modul 21 — pendaftaran member LEWAT WEB (keputusan user 2026-08-29: bukan
 * WA), admin ACC/tolak dari Kelola Pelanggan (`CustomerController`).
 *
 * **Update 2026-09-04**: pengajuan sekarang WAJIB menyertakan jadwal tetap
 * mingguan (lapangan + hari + jam + durasi) — itulah inti membership-nya:
 * begitu di-ACC, sistem otomatis membuatkan booking di jam yang sama tiap
 * minggu selama sebulan. Jadi ini bukan sekadar "nyalain flag member".
 */
class MembershipRequestController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        abort_if($user->is_member && $user->membership_expires_at?->isFuture(), 422, 'Anda sudah member aktif.');
        abort_if($user->membership_requested_at, 422, 'Permintaan Anda sudah menunggu diproses admin.');

        $data = $request->validate([
            'court_id' => ['required', 'integer', 'exists:courts,id'],
            'day_of_week' => ['required', 'integer', 'between:0,6'],
            'start_hour' => ['required', 'integer', 'min:0', 'max:23'],
            'duration_hours' => ['required', 'integer', 'min:1', 'max:12'],
        ]);

        $court = Court::with('venue.owner.membershipPlan')->findOrFail($data['court_id']);
        $venue = $court->venue;
        $plan = $venue->owner->membershipPlan;

        abort_unless($court->is_active, 422, 'Lapangan ini sedang tidak aktif.');
        abort_unless($court->sport === 'Bulu Tangkis', 422, 'Membership baru tersedia untuk lapangan badminton.');
        abort_unless($plan && $plan->is_active, 422, 'Venue ini belum membuka pendaftaran membership.');

        $endHour = $data['start_hour'] + $data['duration_hours'];
        abort_if(
            $data['start_hour'] < $venue->open_hour || $endHour > $venue->close_hour,
            422,
            "Venue ini buka jam {$venue->open_hour}:00–{$venue->close_hour}:00."
        );

        // Durasi tidak boleh melebihi jatah jam mingguan yang ditetapkan owner —
        // jadwal tetap ini MEMANG realisasi dari kuota itu, bukan tambahan di luarnya.
        if ($plan->badminton_quota_hours_per_week) {
            abort_if(
                $data['duration_hours'] > $plan->badminton_quota_hours_per_week,
                422,
                "Maksimal {$plan->badminton_quota_hours_per_week} jam per minggu untuk member."
            );
        }

        $user->update([
            'membership_requested_at' => now(),
            'membership_court_id' => $court->id,
            'membership_day_of_week' => $data['day_of_week'],
            'membership_start_hour' => $data['start_hour'],
            'membership_duration_hours' => $data['duration_hours'],
        ]);

        return response()->json(['data' => $user->fresh()->load('membershipCourt:id,name,venue_id')]);
    }
}
