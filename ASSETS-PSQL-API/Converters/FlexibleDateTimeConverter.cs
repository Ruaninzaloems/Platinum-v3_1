using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

public class FlexibleDateTimeConverter : JsonConverter<DateTime>
{
    private static readonly string[] Formats = new[]
    {
        "yyyy-MM-dd", "yyyy/MM/dd", "yyyy-MM-ddTHH:mm:ss", "yyyy-MM-ddTHH:mm:ss.fff",
        "yyyy-MM-ddTHH:mm:ssZ", "yyyy-MM-ddTHH:mm:ss.fffZ",
        "yyyy/MM/dd HH:mm:ss", "dd/MM/yyyy", "dd-MM-yyyy",
        "MM/dd/yyyy", "MM-dd-yyyy"
    };

    public static DateTime ParseFlexible(string? str)
    {
        if (string.IsNullOrEmpty(str)) return default;
        if (DateTime.TryParseExact(str, Formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var result))
            return result;
        if (DateTime.TryParse(str, CultureInfo.InvariantCulture, DateTimeStyles.None, out result))
            return result;
        return DateTime.Parse(str);
    }

    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        return ParseFlexible(reader.GetString());
    }

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToString("yyyy-MM-ddTHH:mm:ss"));
    }
}

public class FlexibleNullableDateTimeConverter : JsonConverter<DateTime?>
{
    public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null) return null;
        var str = reader.GetString();
        if (string.IsNullOrEmpty(str)) return null;
        return FlexibleDateTimeConverter.ParseFlexible(str);
    }

    public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
    {
        if (value.HasValue)
            writer.WriteStringValue(value.Value.ToString("yyyy-MM-ddTHH:mm:ss"));
        else
            writer.WriteNullValue();
    }
}
