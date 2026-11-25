using FluentValidation;
using PlatinumOvertime_API.DTOs.Requests;

namespace PlatinumOvertime_API.Validators;

public class UpdatePositionApprovalConfigValidator : AbstractValidator<UpdatePositionApprovalConfigRequest>
{
    public UpdatePositionApprovalConfigValidator()
    {
        RuleForEach(x => x.ReportingRelationships).ChildRules(c =>
        {
            c.RuleFor(r => r.ReportsToPositionId).NotEmpty();
            c.RuleFor(r => r.StartDate).NotEmpty();
            c.RuleFor(r => r).Must(r => r.EndDate is null || r.EndDate >= r.StartDate)
                .WithMessage("Reporting relationship End Date cannot be before Start Date.");
        });

        RuleForEach(x => x.ActingAppointments).ChildRules(c =>
        {
            c.RuleFor(a => a.ActingEmployeeId).NotEmpty();
            c.RuleFor(a => a.ActingInPositionId).NotEmpty();
            c.RuleFor(a => a.StartDate).NotEmpty();
            c.RuleFor(a => a.EndDate).NotEmpty();
            c.RuleFor(a => a).Must(a => a.EndDate >= a.StartDate)
                .WithMessage("Acting appointment End Date cannot be before Start Date.");
        });
    }
}
