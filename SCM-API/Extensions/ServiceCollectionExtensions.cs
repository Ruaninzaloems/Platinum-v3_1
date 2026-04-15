using SCM_API.Helpers;
using SCM_API.Repositories;
using SCM_API.Repositories.Interfaces;
using SCM_API.Services;
using SCM_API.Services.Interfaces;

namespace SCM_API.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddSingleton<DbAvailabilityChecker>();
        services.AddHttpContextAccessor();
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

        services.AddScoped<IAuthRepository, AuthRepository>();
        services.AddScoped<IAuthService, AuthService>();

        services.AddScoped<IConfigRepository, ConfigRepository>();
        services.AddScoped<IConfigService, ConfigService>();

        services.AddScoped<IRequisitionRepository, RequisitionRepository>();
        services.AddScoped<IRequisitionService, RequisitionService>();

        services.AddScoped<IQuotationRepository, QuotationRepository>();
        services.AddScoped<IQuotationService, QuotationService>();
        services.AddScoped<IPppfaScoringService, PppfaScoringService>();

        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IOrderService, OrderService>();

        services.AddScoped<IInvoiceRepository, InvoiceRepository>();
        services.AddScoped<IInvoiceService, InvoiceService>();

        services.AddScoped<IPaymentRepository, PaymentRepository>();
        services.AddScoped<IPaymentService, PaymentService>();

        services.AddScoped<ITenderRepository, TenderRepository>();
        services.AddScoped<ITenderService, TenderService>();

        services.AddScoped<IContractRepository, ContractRepository>();
        services.AddScoped<IContractService, ContractService>();

        services.AddScoped<IVendorRepository, VendorRepository>();
        services.AddScoped<IVendorService, VendorService>();
        services.AddScoped<IVendorManagementRepository, VendorManagementRepository>();

        services.AddScoped<IInventoryRepository, InventoryRepository>();
        services.AddScoped<IInventoryService, InventoryService>();
        services.AddScoped<IInventorySettingsService, InventorySettingsService>();
        services.AddScoped<IInventoryBusinessLogicService, InventoryBusinessLogicService>();

        services.AddScoped<IGrnGraRepository, GrnGraRepository>();
        services.AddScoped<IGrnGraService, GrnGraService>();

        services.AddScoped<IDashboardRepository, DashboardRepository>();
        services.AddScoped<IDashboardService, DashboardService>();

        services.AddScoped<IDemandService, DemandService>();
        services.AddScoped<IAuditService, AuditService>();
        services.AddScoped<IReportService, ReportService>();
        services.AddScoped<IDocumentService, DocumentService>();
        services.AddScoped<INotificationService, NotificationServiceImpl>();
        services.AddScoped<IBudgetIntegrationService, BudgetIntegrationService>();
        services.AddScoped<IIntegrationService, IntegrationService>();
        services.AddScoped<IWorkflowService, WorkflowService>();
        services.AddScoped<IDelegationService, DelegationService>();
        services.AddScoped<ISegregationService, SegregationService>();
        services.AddScoped<IInformalTenderRepository, InformalTenderRepository>();
        services.AddScoped<IInformalTenderService, InformalTenderService>();
        services.AddScoped<IGovernanceService, GovernanceService>();
        services.AddScoped<IScmConfigService, ScmConfigService>();
        services.AddScoped<IWaterInventoryService, WaterInventoryService>();
        services.AddScoped<ILandInventoryService, LandInventoryService>();
        services.AddScoped<IVendorManagementService, VendorManagementService>();

        return services;
    }
}
