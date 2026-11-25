using FluentValidation;
using PlatinumOvertime_API.DTOs.Requests;

namespace PlatinumOvertime_API.Validators;

public class UpdateOvertimeConfigValidator : AbstractValidator<UpdateOvertimeConfigRequest>
{
    public UpdateOvertimeConfigValidator()
    {
        RuleFor(x => x.CountingPeriodStartDay).InclusiveBetween(1, 31);
        RuleFor(x => x.CountingPeriodEndDay).InclusiveBetween(1, 31);
        RuleFor(x => x.MaximumMonthlyOvertimeHours).GreaterThanOrEqualTo(0);
        RuleFor(x => x.ExceptionalMaximumOvertimeHours)
            .GreaterThanOrEqualTo(x => x.MaximumMonthlyOvertimeHours)
            .WithMessage("Exceptional maximum must be greater than or equal to the standard maximum.");
    }
}
