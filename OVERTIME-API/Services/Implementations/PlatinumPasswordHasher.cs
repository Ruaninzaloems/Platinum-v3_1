using System.Security.Cryptography;

namespace PlatinumOvertime_API.Services.Implementations;

/// <summary>
/// Verifies passwords stored in the Platinum HR &amp; Payroll PBKDF2 format.
///
/// Stored format: {iterations}:{base64(salt)}:{base64(hash)}
///   e.g. 1000:isZt80AvtGyoJrmHwbqbIArE44lmYgOj:gmJ/uPfUHk6GgX8HSJN3OxbkeabDPix8
///
/// Algorithm: PBKDF2-HMAC-SHA1 via <see cref="Rfc2898DeriveBytes"/>.
/// Salt and hash are each 24 bytes, base-64 encoded.
/// Comparison is constant-time to prevent timing attacks.
///
/// New passwords are hashed with PBKDF2-HMAC-SHA256, 10 000 iterations,
/// 24-byte random salt and 24-byte output — compatible with current
/// Platinum HR format and verifiable by the existing <see cref="Verify"/> method.
/// </summary>
public static class PlatinumPasswordHasher
{
    private const int DefaultIterations = 10_000;
    private const int SaltBytes         = 24;
    private const int HashBytes         = 24;

    /// <summary>
    /// Produces a new hash string in the Platinum PBKDF2 format using
    /// PBKDF2-HMAC-SHA256 and a cryptographically-random 24-byte salt.
    /// </summary>
    public static string Hash(string plaintext)
    {
        if (string.IsNullOrWhiteSpace(plaintext))
            throw new ArgumentException("Password must not be empty.", nameof(plaintext));

        var salt = RandomNumberGenerator.GetBytes(SaltBytes);
        using var pbkdf2 = new Rfc2898DeriveBytes(
            plaintext, salt, DefaultIterations, HashAlgorithmName.SHA256);
        var hash = pbkdf2.GetBytes(HashBytes);

        return $"{DefaultIterations}:{Convert.ToBase64String(salt)}:{Convert.ToBase64String(hash)}";
    }

    public static bool Verify(string inputPassword, string? storedHash)
    {
        if (string.IsNullOrWhiteSpace(storedHash)) return false;

        var parts = storedHash.Split(':', 3);
        if (parts.Length != 3) return false;
        if (!int.TryParse(parts[0], out var iterations) || iterations < 1) return false;

        byte[] salt, expectedHash;
        try
        {
            salt         = Convert.FromBase64String(parts[1]);
            expectedHash = Convert.FromBase64String(parts[2]);
        }
        catch (FormatException) { return false; }

        // Try SHA256 first (current Platinum HR format), then SHA1 (legacy hashes).
        foreach (var algorithm in new[] { HashAlgorithmName.SHA256, HashAlgorithmName.SHA1 })
        {
            using var pbkdf2 = new Rfc2898DeriveBytes(
                inputPassword, salt, iterations, algorithm);
            var actualHash = pbkdf2.GetBytes(expectedHash.Length);
            if (CryptographicOperations.FixedTimeEquals(actualHash, expectedHash))
                return true;
        }

        return false;
    }
}
