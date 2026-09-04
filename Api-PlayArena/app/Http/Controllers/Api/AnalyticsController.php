<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\AuthorizesVenue;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Venue;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Modul 18 — Dashboard Analitik. Owner ATAU staff/petugas venue terkait
 * (lewat AuthorizesVenue, sama seperti Modul 04/07). **Update 2026-09-04**:
 * `petugas` sempat dilarang di sini, lalu dibuka lagi atas keputusan user
 * ("jadi hanya tidak bisa buka laporan saja") — satu-satunya yang tertutup
 * untuk non-owner sekarang cuma Laporan Pendapatan (Modul 19). Semua angka
 * dihitung dari booking yang benar-benar terjadi (confirmed/completed) —
 * yang masih menunggu ACC/bayar atau sudah dibatalkan/ditolak tidak ikut
 * dihitung karena belum tentu (atau tidak jadi) terpakai.
 */
class AnalyticsController extends Controller
{
    use AuthorizesVenue;

    private const COUNTED_STATUSES = ['confirmed', 'completed'];

    public function index(Request $request): JsonResponse
    {
        $venue = Venue::findOrFail($request->integer('venue_id'));
        $this->authorizeVenueStaff($request->user(), $venue);

        $bookingsForVenue = fn (): Builder => Booking::query()
            ->whereHas('court', fn ($q) => $q->where('venue_id', $venue->id))
            ->whereIn('status', self::COUNTED_STATUSES);

        return response()->json([
            'data' => [
                'heatmap' => $this->heatmap($bookingsForVenue()),
                'top_courts' => $this->topCourts($bookingsForVenue()),
                'trend' => $this->trend($bookingsForVenue()),
                'occupancy_rate' => $this->occupancyRate($venue, $bookingsForVenue()),
            ],
        ]);
    }

    /** Jam paling laris: jumlah booking per (hari-dalam-minggu, jam mulai), 90 hari terakhir supaya polanya cukup kelihatan. */
    private function heatmap(Builder $query): array
    {
        return $query->where('starts_at', '>=', now()->subDays(90))
            ->get(['starts_at'])
            ->groupBy(fn (Booking $b) => $b->starts_at->dayOfWeek.'-'.$b->starts_at->hour)
            ->map(fn ($group, $key) => [
                'day_of_week' => (int) explode('-', $key)[0],
                'hour' => (int) explode('-', $key)[1],
                'count' => $group->count(),
            ])
            ->values()
            ->all();
    }

    /** Lapangan paling sering dibooking, 90 hari terakhir. */
    private function topCourts(Builder $query): array
    {
        return $query->where('starts_at', '>=', now()->subDays(90))
            ->selectRaw('court_id, count(*) as bookings_count')
            ->groupBy('court_id')
            ->orderByDesc('bookings_count')
            ->with('court:id,name')
            ->limit(10)
            ->get()
            ->map(fn ($row) => [
                'court_id' => $row->court_id,
                'name' => $row->court->name,
                'bookings_count' => $row->bookings_count,
            ])
            ->all();
    }

    /** Tren booking harian, 30 hari terakhir (frontend bisa persempit ke 7 hari sendiri). */
    private function trend(Builder $query): array
    {
        $counts = $query->where('starts_at', '>=', now()->startOfDay()->subDays(29))
            ->get(['starts_at'])
            ->groupBy(fn (Booking $b) => $b->starts_at->toDateString())
            ->map->count();

        return collect(range(0, 29))
            ->map(fn ($i) => now()->startOfDay()->subDays(29 - $i)->toDateString())
            ->map(fn ($date) => ['date' => $date, 'count' => $counts->get($date, 0)])
            ->all();
    }

    /** Okupansi: jam terpakai / jam tersedia, 30 hari terakhir (H-1 ke belakang — hari ini belum penuh terlewati). */
    private function occupancyRate(Venue $venue, Builder $query): float
    {
        $periodStart = now()->startOfDay()->subDays(30);
        $periodEnd = now()->startOfDay();

        $bookedHours = $query->where('status', 'completed')
            ->where('starts_at', '>=', $periodStart)
            ->where('starts_at', '<', $periodEnd)
            ->get(['starts_at', 'ends_at'])
            ->sum(fn (Booking $b) => $b->starts_at->diffInHours($b->ends_at));

        $activeCourts = $venue->courts()->where('is_active', true)->count();
        $dailyHours = max(0, $venue->close_hour - $venue->open_hour);
        $availableHours = $activeCourts * $dailyHours * 30;

        return $availableHours > 0 ? round($bookedHours / $availableHours, 4) : 0.0;
    }
}
