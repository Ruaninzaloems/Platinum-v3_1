using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace PlatinumOvertime_API.Data;

/// <summary>
/// System.Text.Json converter for <see cref="bool?"/> that accepts JSON
/// number tokens (0 → false, non-zero → true) as well as true/false/null.
///
/// Required for AAAA_ConfigSettings.perMuni_SetupRequirements which is
/// exported as 0/1 integers in the Platinum JSON seed files, even though the
/// production SQL Server column type is bit (and the C# model uses bool?).
/// </summary>
public sealed class NullableIntToBoolJsonConverter : JsonConverter<bool?>
{
    public override bool? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        return reader.TokenType switch
        {
            JsonTokenType.Null => null,
            JsonTokenType.True => true,
            JsonTokenType.False => false,
            JsonTokenType.Number => reader.GetInt32() != 0,
            _ => throw new JsonException(
                $"NullableIntToBoolJsonConverter: cannot convert token '{reader.TokenType}' to bool?.")
        };
    }

    public override void Write(Utf8JsonWriter writer, bool? value, JsonSerializerOptions options)
    {
        if (value is null) writer.WriteNullValue();
        else writer.WriteBooleanValue(value.Value);
    }
}

/// <summary>
/// System.Text.Json converter for <see cref="string"/> that accepts JSON
/// Number tokens and converts them to their string representation.
/// Required for Payroll_Position.HierarchyNo which is a numeric value in the
/// seed JSON but a varchar column in production.
/// </summary>
public sealed class NullableStringFromNumberJsonConverter : JsonConverter<string?>
{
    public override string? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        return reader.TokenType switch
        {
            JsonTokenType.Null   => null,
            JsonTokenType.String => reader.GetString(),
            JsonTokenType.Number => reader.GetDecimal().ToString(CultureInfo.InvariantCulture),
            _ => throw new JsonException(
                $"NullableStringFromNumberJsonConverter: cannot convert token '{reader.TokenType}' to string?.")
        };
    }

    public override void Write(Utf8JsonWriter writer, string? value, JsonSerializerOptions options)
    {
        if (value is null) writer.WriteNullValue();
        else writer.WriteStringValue(value);
    }
}

/// <summary>
/// System.Text.Json converter for <see cref="int?"/> that accepts JSON
/// String tokens and parses them as integers.
/// Required for Payroll_Position.EmployeeId which is stored as a quoted
/// numeric string ("266") in the seed JSON but an integer column in production.
/// </summary>
public sealed class NullableIntFromStringJsonConverter : JsonConverter<int?>
{
    public override int? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        return reader.TokenType switch
        {
            JsonTokenType.Null   => null,
            JsonTokenType.Number => reader.GetInt32(),
            JsonTokenType.String => int.TryParse(reader.GetString(), out var v) ? v : (int?)null,
            _ => throw new JsonException(
                $"NullableIntFromStringJsonConverter: cannot convert token '{reader.TokenType}' to int?.")
        };
    }

    public override void Write(Utf8JsonWriter writer, int? value, JsonSerializerOptions options)
    {
        if (value is null) writer.WriteNullValue();
        else writer.WriteNumberValue(value.Value);
    }
}

/// <summary>
/// System.Text.Json converter for <see cref="DateTime?"/> that handles the
/// OADate (OLE Automation / Excel serial) numeric format used in Platinum
/// Payroll's JSON seed exports.
///
/// Platinum exports dates as floating-point OADate serials
/// (e.g. 45812.585 ≈ 2025-06-15). Production SQL Server stores the same
/// data as true <c>datetime</c> columns, so domain models use
/// <see cref="DateTime?"/>. This converter bridges the gap at seeding time.
///
/// Token handling:
///   Null   → null
///   Number → DateTime.FromOADate(value)
///   String → DateTime.Parse(value)  (ISO-8601 strings pass through)
/// </summary>
public sealed class OADateJsonConverter : JsonConverter<DateTime?>
{
    public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        switch (reader.TokenType)
        {
            case JsonTokenType.Null:
                return null;

            case JsonTokenType.Number:
                var oaDate = reader.GetDouble();
                // FromOADate returns Kind=Unspecified; Npgsql 6+ requires Utc for timestamptz.
                return DateTime.SpecifyKind(DateTime.FromOADate(oaDate), DateTimeKind.Utc);

            case JsonTokenType.String:
                var s = reader.GetString();
                if (string.IsNullOrWhiteSpace(s)) return null;
                var parsed = DateTime.Parse(s, System.Globalization.CultureInfo.InvariantCulture,
                    System.Globalization.DateTimeStyles.AssumeUniversal | System.Globalization.DateTimeStyles.AdjustToUniversal);
                return DateTime.SpecifyKind(parsed, DateTimeKind.Utc);

            default:
                throw new JsonException(
                    $"OADateJsonConverter: cannot convert JSON token '{reader.TokenType}' to DateTime?.");
        }
    }

    public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
    {
        if (value is null)
            writer.WriteNullValue();
        else
            writer.WriteStringValue(value.Value.ToString("O", System.Globalization.CultureInfo.InvariantCulture));
    }
}

