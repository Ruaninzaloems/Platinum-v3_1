using System.Text.Json;
using System.Text.Json.Serialization;

namespace MssqlApi.Data;

public class NullableBoolJsonConverter : JsonConverter<bool?>
{
    public override bool? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        switch (reader.TokenType)
        {
            case JsonTokenType.True:
                return true;
            case JsonTokenType.False:
                return false;
            case JsonTokenType.Null:
                return null;
            case JsonTokenType.Number:
                reader.TryGetInt32(out int intVal);
                return intVal != 0;
            case JsonTokenType.String:
                var str = reader.GetString();
                if (bool.TryParse(str, out bool boolResult)) return boolResult;
                if (int.TryParse(str, out int strInt)) return strInt != 0;
                return null;
            default:
                return null;
        }
    }

    public override void Write(Utf8JsonWriter writer, bool? value, JsonSerializerOptions options)
    {
        if (value.HasValue)
            writer.WriteBooleanValue(value.Value);
        else
            writer.WriteNullValue();
    }
}

public class BoolJsonConverter : JsonConverter<bool>
{
    public override bool Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        switch (reader.TokenType)
        {
            case JsonTokenType.True:
                return true;
            case JsonTokenType.False:
                return false;
            case JsonTokenType.Number:
                reader.TryGetInt32(out int intVal);
                return intVal != 0;
            case JsonTokenType.String:
                var str = reader.GetString();
                if (bool.TryParse(str, out bool boolResult)) return boolResult;
                if (int.TryParse(str, out int strInt)) return strInt != 0;
                return false;
            default:
                return false;
        }
    }

    public override void Write(Utf8JsonWriter writer, bool value, JsonSerializerOptions options)
    {
        writer.WriteBooleanValue(value);
    }
}
