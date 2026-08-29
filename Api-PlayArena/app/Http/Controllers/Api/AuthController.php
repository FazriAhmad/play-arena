<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;

class AuthController extends Controller
{
    /** Registrasi mandiri — cuma untuk Pelanggan. Staff/Owner dibuat lewat StaffController. */
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:30', 'unique:users,phone'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'password' => $data['password'],
            'is_active' => true,
        ]);
        $user->assignRole('pelanggan');

        $token = $user->createToken('auth')->plainTextToken;

        return response()->json([
            'data' => $this->formatUser($user),
            'token' => $token,
        ], 201);
    }

    /** Login pakai email atau nomor HP + password. Berlaku untuk semua peran. */
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'login' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['login'])
            ->orWhere('phone', $data['login'])
            ->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            abort(422, 'Email/nomor HP atau password salah.');
        }

        if (! $user->is_active) {
            abort(403, 'Akun Anda tidak aktif. Hubungi admin.');
        }

        $token = $user->createToken('auth')->plainTextToken;

        return response()->json([
            'data' => $this->formatUser($user),
            'token' => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Berhasil keluar.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->formatUser($request->user())]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        $status = Password::sendResetLink($request->only('email'));

        if ($status !== Password::RESET_LINK_SENT) {
            abort(422, __($status));
        }

        return response()->json(['message' => 'Tautan reset password sudah dikirim ke email Anda.']);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)],
        ]);

        $status = Password::reset($data, function (User $user, string $password) {
            $user->forceFill(['password' => $password, 'remember_token' => Str::random(60)])->save();
        });

        if ($status !== Password::PASSWORD_RESET) {
            abort(422, __($status));
        }

        return response()->json(['message' => 'Password berhasil diubah, silakan login ulang.']);
    }

    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'is_active' => $user->is_active,
            'is_member' => $user->is_member,
            'membership_expires_at' => $user->membership_expires_at,
            'membership_requested_at' => $user->membership_requested_at,
            'role' => $user->getRoleNames()->first(),
            'venue_ids' => $user->venues()->pluck('venues.id'),
        ];
    }
}
