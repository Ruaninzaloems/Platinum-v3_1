namespace SCM_API.Helpers;

public static class DictHelper
{
    public static string? GetString(Dictionary<string, object?> dict, string key)
    {
        if (dict.TryGetValue(key, out var val) && val != null)
            return val.ToString();
        return null;
    }

    public static int? GetNullableInt(Dictionary<string, object?> dict, string key)
    {
        if (!dict.TryGetValue(key, out var val) || val == null) return null;
        if (val is int i) return i;
        if (val is long l) return (int)l;
        if (val is decimal d) return (int)d;
        if (val is double dbl) return (int)dbl;
        if (val is string s && int.TryParse(s, out var parsed)) return parsed;
        try { return Convert.ToInt32(val); } catch { return null; }
    }

    public static decimal? GetNullableDecimal(Dictionary<string, object?> dict, string key)
    {
        if (!dict.TryGetValue(key, out var val) || val == null) return null;
        if (val is decimal d) return d;
        if (val is double dbl) return (decimal)dbl;
        if (val is int i) return i;
        if (val is long l) return l;
        if (val is string s && decimal.TryParse(s, out var parsed)) return parsed;
        try { return Convert.ToDecimal(val); } catch { return null; }
    }

    public static bool GetBool(Dictionary<string, object?> dict, string key, bool defaultValue = false)
    {
        if (!dict.TryGetValue(key, out var val) || val == null) return defaultValue;
        if (val is bool b) return b;
        if (val is string s) return s.Equals("true", StringComparison.OrdinalIgnoreCase);
        return defaultValue;
    }

    public static DateTime? GetNullableDateTime(Dictionary<string, object?> dict, string key)
    {
        if (!dict.TryGetValue(key, out var val) || val == null) return null;
        if (val is DateTime dt) return dt;
        if (val is string s && DateTime.TryParse(s, out var parsed)) return parsed;
        return null;
    }
}
