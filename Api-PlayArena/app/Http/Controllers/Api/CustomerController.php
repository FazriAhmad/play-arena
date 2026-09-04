<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\CreatesBookings;
use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Modul 15 — basis pelanggan sisi Owner. Cuma pelanggan yang pernah booking
 * di venue milik owner login ATAU yang sedang mengajukan permintaan member
 * (Modul 21, lewat web — lihat MembershipRequestController) yang muncul di
 * sini — bukan seluruh pelanggan platform.
 */
class CustomerController extends Controller
{
    use CreatesBookings;

    /** Dipakai kalau owner belum mengisi kuota sesi/bulan di plan — 4 minggu ≈ sebulan. */
    private const DEFAULT_SESSIONS_PER_MONTH = 4;

    public function index(Request $request): JsonResponse
    {
        $venueIds = $request->user()->ownedVenues()->pluck('id');

        $customers = User::query()
            ->where($this->visibilityScope($venueIds))
            ->withCount(['bookingsAsCustomer as bookings_count' => fn ($q) => $q->whereHas('court', fn ($c) => $c->whereIn('venue_id', $venueIds)),
            ])
            // Jadwal tetap ikut dikirim supaya admin tahu slot apa yang diminta SEBELUM meng-ACC.
            ->with('membershipCourt:id,name,venue_id')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'phone', 'is_member', 'membership_expires_at', 'membership_requested_at',
                'membership_court_id', 'membership_day_of_week', 'membership_start_hour', 'membership_duration_hours']);

        $customers->each(fn ($customer) => $this->attachStats($customer, $venueIds));

        return response()->json(['data' => $customers]);
    }

    /** Riwayat booking pelanggan ini, dibatasi ke venue milik owner login. */
    public function show(Request $request, User $customer): JsonResponse
    {
        $venueIds = $request->user()->ownedVenues()->pluck('id');
        abort_unless(
            User::where('id', $customer->id)->where($this->visibilityScope($venueIds))->exists(),
            404,
            'Pelanggan ini belum pernah booking di venue Anda.'
        );

        $this->attachStats($customer, $venueIds);
        $customer->setRelation('bookings', $customer->bookingsAsCustomer()
            ->whereHas('court', fn ($c) => $c->whereIn('venue_id', $venueIds))
            ->with(['court:id,name,venue_id', 'court.venue:id,name'])
            ->orderByDesc('starts_at')
            ->get(['id', 'court_id', 'starts_at', 'ends_at', 'status']));

        return response()->json(['data' => $customer]);
    }

    public function update(Request $request, User $customer): JsonResponse
    {
        $venueIds = $request->user()->ownedVenues()->pluck('id');
        abort_unless(
            User::where('id', $customer->id)->where($this->visibilityScope($venueIds))->exists(),
            404,
            'Pelanggan ini belum pernah booking di venue Anda.'
        );

        $data = $request->validate([
            'is_member' => ['sometimes', 'boolean'],
            // Tolak permintaan member (Modul 21) tanpa menjadikan member — beda dari is_member:false
            // yang mencabut member yang SUDAH aktif; ini buat permintaan yang belum pernah di-ACC.
            'reject_request' => ['sometimes', 'boolean'],
        ]);

        $schedule = null;

        if (array_key_exists('is_member', $data)) {
            // Modul 21 — jadi member selalu berarti "bayar 1 bulan penuh dari sekarang", bukan
            // cuma nyalain flag permanen. Nonaktifkan langsung mencabut hak diskon saat itu juga.
            $customer->is_member = $data['is_member'];
            $customer->membership_expires_at = $data['is_member'] ? now()->addMonth() : null;
            $customer->membership_requested_at = null;
            $customer->save();

            // Inti membership (2026-09-04): begitu di-ACC, jadwal tetap mingguan yang
            // dipilih pelanggan langsung dibuatkan bookingnya untuk sebulan ke depan.
            if ($data['is_member']) {
                $schedule = $this->generateMembershipBookings($customer->fresh());
            }
        } elseif (! empty($data['reject_request'])) {
            $customer->membership_requested_at = null;
            $customer->save();
        } else {
            $customer->save();
        }

        return response()->json([
            'data' => $customer->fresh()->load('membershipCourt:id,name,venue_id'),
            'schedule' => $schedule,
        ]);
    }

    /**
     * Buatkan booking jadwal tetap member: hari dan jam yang sama tiap minggu
     * selama sebulan. Tiap sesi tetap lewat `CreatesBookings` yang sama dengan
     * booking biasa — jadi tunduk penuh pada jam operasional, blocked_slots,
     * dan exclusion constraint anti-double-booking (tidak ada jalur pintas).
     *
     * Sesi yang bentrok DILAPORKAN gagal, tidak menggagalkan sesi lain —
     * pola sama seperti Booking Berulang (Modul 11). Semua sesi GRATIS penuh
     * karena memang itu wujud dari biaya membership yang sudah dibayar.
     *
     * @return array{created: list<string>, failed: list<array{date: string, reason: string}>}
     */
    private function generateMembershipBookings(User $customer): array
    {
        $court = $customer->membershipCourt;

        if (! $court || $customer->membership_day_of_week === null) {
            return ['created' => [], 'failed' => []];
        }

        $venue = $court->venue;
        $sessions = $venue->owner->membershipPlan?->badminton_quota_sessions_per_month
            ?? self::DEFAULT_SESSIONS_PER_MONTH;
        $subtotal = $court->price_per_hour * $customer->membership_duration_hours;

        // Mulai dari kejadian berikutnya hari terpilih; kalau slot hari ini sudah
        // lewat jamnya, langsung geser ke minggu depan (bukan dibiarkan gagal).
        $cursor = now()->startOfDay();
        while ($cursor->dayOfWeek !== (int) $customer->membership_day_of_week) {
            $cursor->addDay();
        }
        if ($cursor->copy()->setTime($customer->membership_start_hour, 0)->lt(now())) {
            $cursor->addWeek();
        }

        $created = [];
        $failed = [];

        for ($i = 0; $i < $sessions; $i++) {
            $date = $cursor->copy()->addWeeks($i)->toDateString();

            try {
                $this->createBooking($court, $venue, [
                    'date' => $date,
                    'start_hour' => $customer->membership_start_hour,
                    'duration_hours' => $customer->membership_duration_hours,
                    'contact_wa' => $customer->phone ?? '-',
                ], [
                    'pelanggan_id' => $customer->id,
                    'status' => 'confirmed',
                    'member_discount_amount' => $subtotal,
                ]);
                $created[] = $date;
            } catch (HttpException $e) {
                $failed[] = ['date' => $date, 'reason' => $e->getMessage()];
            }
        }

        return ['created' => $created, 'failed' => $failed];
    }

    /**
     * Pelanggan tetap terlihat kalau SALAH SATU: pernah booking, sedang
     * mengajukan permintaan member, ATAU sudah jadi member aktif — yang
     * terakhir ini penting supaya member yang di-ACC padahal belum pernah
     * booking (mis. langsung daftar member duluan) tidak hilang dari
     * daftar begitu `membership_requested_at` dikosongkan pas di-ACC.
     *
     * @return \Closure(Builder): void
     */
    private function visibilityScope(Collection $venueIds): \Closure
    {
        return fn (Builder $q) => $q
            ->whereHas('bookingsAsCustomer', fn ($b) => $b->whereHas('court', fn ($c) => $c->whereIn('venue_id', $venueIds)))
            ->orWhereNotNull('membership_requested_at')
            ->orWhere('is_member', true);
    }

    private function attachStats(User $customer, Collection $venueIds): void
    {
        $customer->total_spent = Payment::where('status', 'paid')
            ->whereHas('booking', fn ($q) => $q->where('pelanggan_id', $customer->id)
                ->whereHas('court', fn ($c) => $c->whereIn('venue_id', $venueIds))
            )
            ->sum('amount');

        $customer->last_booking_at = $customer->bookingsAsCustomer()
            ->whereHas('court', fn ($c) => $c->whereIn('venue_id', $venueIds))
            ->max('starts_at');
    }
}
