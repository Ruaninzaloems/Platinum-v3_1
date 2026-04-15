using System.Data;
using Dapper;

namespace MssqlApi.Data;

public class DateOnlyTypeHandler : SqlMapper.TypeHandler<DateOnly>
{
    public override void SetValue(IDbDataParameter parameter, DateOnly value)
    {
        parameter.DbType = DbType.Date;
        parameter.Value = value.ToDateTime(TimeOnly.MinValue);
    }

    public override DateOnly Parse(object value)
    {
        if (value is DateTime dt)
            return DateOnly.FromDateTime(dt);
        if (value is DateOnly d)
            return d;
        return DateOnly.FromDateTime(Convert.ToDateTime(value));
    }
}

public class NullableDateOnlyTypeHandler : SqlMapper.TypeHandler<DateOnly?>
{
    public override void SetValue(IDbDataParameter parameter, DateOnly? value)
    {
        parameter.DbType = DbType.Date;
        parameter.Value = value.HasValue ? value.Value.ToDateTime(TimeOnly.MinValue) : DBNull.Value;
    }

    public override DateOnly? Parse(object value)
    {
        if (value is DBNull || value == null)
            return null;
        if (value is DateTime dt)
            return DateOnly.FromDateTime(dt);
        if (value is DateOnly d)
            return d;
        return DateOnly.FromDateTime(Convert.ToDateTime(value));
    }
}
