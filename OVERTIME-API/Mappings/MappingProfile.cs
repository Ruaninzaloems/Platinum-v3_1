using AutoMapper;
using PlatinumOvertime_API.DTOs.Requests;
using PlatinumOvertime_API.DTOs.Responses;
using PlatinumOvertime_API.Models.Domain;

namespace PlatinumOvertime_API.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<OvertimeConfig, OvertimeConfigDto>();
        CreateMap<UpdateOvertimeConfigRequest, OvertimeConfig>();

        CreateMap<PositionApprovalConfig, PositionApprovalConfigDto>();
        CreateMap<PositionReportingRelationship, ReportingRelationshipDto>();
        CreateMap<TemporaryActingAppointment, ActingAppointmentDto>();
    }
}
