<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\CreatesBookings;
use App\Http\Controllers\Controller;
use App\Models\Court;
use App\Models\RecurringGroup;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Modul 11 — booking berulang (mis. tim futsal mingguan). Generate booking
 * individual per sesi lewat CreatesBookings yang sama dengan Modul 05 —
 * "tidak ada jalur pintas" berarti tiap sesi tunduk penuh pada jam
 * operasional, blocked_slots, dan exclusion constraint DB. Kalau satu
 * sesi bentrok, sesi itu ditandai gagal & dilaporkan — bukan seluruh
 * rangkaian batal.
 */
class RecurringBookingController extends Controller
{
    use CreatesBookings;

    private const MAX_SESSIONS = 52;

    public function store(Request $request, Court $court): JsonResponse
    {
        abort_unless($court->is_active, 404);
        $venue = $court->venue;

        $data = $request->validate([
            'day_of_week' => ['required', 'integer', 'between:0,6'],
            'start_hour' => ['required', 'integer', 'min:0', 'max:23'],
            'duration_hours' => ['required', 'integer', 'min:1', 'max:12'],
            'starts_on' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'mode' => ['required', 'in:until_date,session_count'],
            'ends_on' => ['required_if:mode,until_date', 'date_format:Y-m-d', 'after_or_equal:starts_on'],
            'session_count' => ['required_if:mode,session_count', 'integer', 'min:1', 'max:'.self::MAX_SESSIONS],
            'contact_wa' => ['required', 'string', 'max:30'],
        ]);

        $dates = $this->generateDates($data);

        $group = RecurringGroup::create([
            'court_id' => $court->id,
            'pelanggan_id' => $request->user()->id,
            'day_of_week' => $data['day_of_week'],
            'start_hour' => $data['start_hour'],
            'duration_hours' => $data['duration_hours'],
            'starts_on' => $data['starts_on'],
            'ends_on' => $data['ends_on'] ?? null,
            'session_count' => $data['session_count'] ?? null,
            'contact_wa' => $data['contact_wa'],
        ]);

        $created = [];
        $failed = [];

        foreach ($dates as $date) {
            try {
                $booking = $this->createBooking($court, $venue, [
                    'date' => $date->toDateString(),
                    'start_hour' => $data['start_hour'],
                    'duration_hours' => $data['duration_hours'],
                    'contact_wa' => $data['contact_wa'],
                ], [
                    'pelanggan_id' => $request->user()->id,
                    'status' => 'menunggu_acc',
                    'recurring_group_id' => $group->id,
                ]);
                $created[] = $booking;
            } catch (HttpException $e) {
                $failed[] = ['date' => $date->toDateString(), 'reason' => $e->getMessage()];
            }
        }

        return response()->json([
            'data' => [
                'recurring_group_id' => $group->id,
                'created' => $created,
                'failed' => $failed,
            ],
        ], 201);
    }

    /** @return list<Carbon> */
    private function generateDates(array $data): array
    {
        $cursor = Carbon::parse($data['starts_on'], config('app.timezone'))->startOfDay();
        while ($cursor->dayOfWeek !== $data['day_of_week']) {
            $cursor->addDay();
        }

        $dates = [];
        if ($data['mode'] === 'session_count') {
            for ($i = 0; $i < $data['session_count']; $i++) {
                $dates[] = $cursor->copy();
                $cursor->addWeek();
            }

            return $dates;
        }

        $endsOn = Carbon::parse($data['ends_on'], config('app.timezone'))->endOfDay();
        while ($cursor->lte($endsOn) && count($dates) < self::MAX_SESSIONS) {
            $dates[] = $cursor->copy();
            $cursor->addWeek();
        }

        return $dates;
    }
}
