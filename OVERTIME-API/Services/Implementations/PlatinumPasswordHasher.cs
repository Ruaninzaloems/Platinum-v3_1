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
/// </summary>
public static class PlatinumPasswordHasher
{
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
