<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\AuthorizesVenue;
use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Refund;
use App\Models\Venue;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Modul 19 — Laporan Pendapatan. Owner SAJA (beda dari Modul 18 yang
 * booking-count operasional boleh dilihat staff — ini data finansial,
 * pola yang sama seperti Modul 14/15/16 yang dianggap keputusan
 * pemasaran/kepemilikan, bukan operasional harian staff). Pendapatan
 * bersih = pembayaran lunas (`payments` status paid) dikurangi refund yang
 * jadi hak pelanggan (`refunds` status entitled/processed — forfeited
 * amount-nya memang sudah 0, jadi aman ikut dijumlah tanpa filter status).
 */
class RevenueController extends Controller
{
    use AuthorizesVenue;

    public function index(Request $request): JsonResponse
    {
        [$venue, $from, $to] = $this->resolveScope($request);

        $payments = $this->paymentsQuery($venue, $from, $to)
            ->with('booking:id,court_id', 'booking.court:id,name')
            ->get(['id', 'booking_id', 'method', 'confirmed_at', 'amount']);
        $refunded = $this->refundedAmount($venue, $from, $to);
        $gross = (int) $payments->sum('amount');

        return response()->json(['data' => [
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'summary' => [
                'gross' => $gross,
                'refunded' => $refunded,
                'net' => $gross - $refunded,
                'transactions_count' => $payments->count(),
            ],
            'daily' => $this->dailyBreakdown($venue, $from, $to, $payments),
            'by_court' => $this->byCourt($payments),
            'by_method' => $this->byMethod($payments),
        ]]);
    }

    /** Export CSV transaksi (pembayaran &amp; refund) — dipakai owner buat rekonsiliasi di luar sistem. */
    public function export(Request $request): Response
    {
        [$venue, $from, $to] = $this->resolveScope($request);

        $rows = $this->paymentsQuery($venue, $from, $to)
            ->with('booking:id,court_id,pelanggan_id,guest_name', 'booking.court:id,name', 'booking.pelanggan:id,name')
            ->get()
            ->map(fn (Payment $p) => [
                $p->confirmed_at?->toDateTimeString(),
                $p->booking_id,
                $p->booking->court->name,
                $p->booking->guest_name ?? $p->booking->pelanggan?->name ?? '-',
                $p->method,
                'Pembayaran',
                $p->amount,
            ])
            ->concat(
                Refund::query()
                    ->whereIn('status', ['entitled', 'processed'])
                    ->whereBetween('created_at', [$from, $to])
                    ->whereHas('booking.court', fn ($q) => $q->where('venue_id', $venue->id))
                    ->with('booking:id,court_id,pelanggan_id,guest_name', 'booking.court:id,name', 'booking.pelanggan:id,name')
                    ->get()
                    ->map(fn (Refund $r) => [
                        $r->created_at->toDateTimeString(),
                        $r->booking_id,
                        $r->booking->court->name,
                        $r->booking->guest_name ?? $r->booking->pelanggan?->name ?? '-',
                        '-',
                        'Refund',
                        -$r->amount,
                    ])
            )
            ->sortBy(0);

        $csv = implode(',', ['Tanggal', 'Booking ID', 'Lapangan', 'Pelanggan', 'Metode', 'Jenis', 'Jumlah'])."\n";
        foreach ($rows as $row) {
            $csv .= implode(',', array_map(fn ($v) => '"'.str_replace('"', '""', (string) $v).'"', $row))."\n";
        }

        $filename = "laporan-pendapatan-{$venue->id}-{$from->toDateString()}_{$to->toDateString()}.csv";

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /** @return array{0: Venue, 1: Carbon, 2: Carbon} */
    private function resolveScope(Request $request): array
    {
        $venue = Venue::findOrFail($request->integer('venue_id'));
        $this->authorizeOwner($request->user(), $venue);

        $data = $request->validate([
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d'],
        ]);

        $from = isset($data['from']) ? Carbon::parse($data['from'])->startOfDay() : now()->startOfMonth();
        $to = isset($data['to']) ? Carbon::parse($data['to'])->endOfDay() : now()->endOfDay();

        return [$venue, $from, $to];
    }

    private function paymentsQuery(Venue $venue, Carbon $from, Carbon $to): Builder
    {
        return Payment::query()
            ->where('status', 'paid')
            ->whereBetween('confirmed_at', [$from, $to])
            ->whereHas('booking.court', fn ($q) => $q->where('venue_id', $venue->id));
    }

    private function refundedAmount(Venue $venue, Carbon $from, Carbon $to): int
    {
        return (int) Refund::query()
            ->whereIn('status', ['entitled', 'processed'])
            ->whereBetween('created_at', [$from, $to])
            ->whereHas('booking.court', fn ($q) => $q->where('venue_id', $venue->id))
            ->sum('amount');
    }

    private function dailyBreakdown(Venue $venue, Carbon $from, Carbon $to, $payments): array
    {
        $refundsByDate = Refund::query()
            ->whereIn('status', ['entitled', 'processed'])
            ->whereBetween('created_at', [$from, $to])
            ->whereHas('booking.court', fn ($q) => $q->where('venue_id', $venue->id))
            ->get(['amount', 'created_at'])
            ->groupBy(fn (Refund $r) => $r->created_at->toDateString())
            ->map->sum('amount');

        $grossByDate = $payments->groupBy(fn (Payment $p) => $p->confirmed_at->toDateString())->map->sum('amount');

        $days = (int) $from->copy()->startOfDay()->diffInDays($to->copy()->startOfDay());

        return collect(range(0, $days))
            ->map(fn ($i) => $from->copy()->addDays($i)->toDateString())
            ->map(fn ($date) => [
                'date' => $date,
                'gross' => (int) $grossByDate->get($date, 0),
                'refunded' => (int) $refundsByDate->get($date, 0),
                'net' => (int) $grossByDate->get($date, 0) - (int) $refundsByDate->get($date, 0),
            ])
            ->all();
    }

    private function byCourt($payments): array
    {
        return $payments->groupBy(fn (Payment $p) => $p->booking->court_id)
            ->map(fn ($group, $courtId) => [
                'court_id' => (int) $courtId,
                'name' => $group->first()->booking->court->name,
                'gross' => (int) $group->sum('amount'),
                'transactions_count' => $group->count(),
            ])
            ->sortByDesc('gross')
            ->values()
            ->all();
    }

    private function byMethod($payments): array
    {
        return $payments->groupBy('method')
            ->map(fn ($group, $method) => [
                'method' => $method,
                'gross' => (int) $group->sum('amount'),
                'transactions_count' => $group->count(),
            ])
            ->values()
            ->all();
    }
}
