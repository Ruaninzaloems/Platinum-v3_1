using Microsoft.EntityFrameworkCore;
using SCM_API.Models.Domain;

namespace SCM_API.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<Requisition> Requisitions { get; set; }
    public DbSet<RequisitionServiceDetail> RequisitionServiceDetails { get; set; }
    public DbSet<RequisitionServiceDetailFund> RequisitionServiceDetailFunds { get; set; }
    public DbSet<RequisitionDocument> RequisitionDocuments { get; set; }
    public DbSet<RequisitionBillOfQuantity> RequisitionBillOfQuantities { get; set; }
    public DbSet<RequisitionAssignBuyer> RequisitionAssignBuyers { get; set; }
    public DbSet<RequisitionApprovalSetup> RequisitionApprovalSetups { get; set; }

    public DbSet<Quotation> Quotations { get; set; }
    public DbSet<QuotationServiceDetail> QuotationServiceDetails { get; set; }
    public DbSet<QuotationServiceDetailFund> QuotationServiceDetailFunds { get; set; }
    public DbSet<QuotationVendor> QuotationVendors { get; set; }
    public DbSet<QuotationServiceVendorDetail> QuotationServiceVendorDetails { get; set; }
    public DbSet<QuotationRequisition> QuotationRequisitions { get; set; }

    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderTypeDetail> OrderTypeDetails { get; set; }
    public DbSet<OrderTypeDetailFund> OrderTypeDetailFunds { get; set; }
    public DbSet<OrderSplitDetail> OrderSplitDetails { get; set; }
    public DbSet<OrderDocument> OrderDocuments { get; set; }
    public DbSet<CessionAgreement> CessionAgreements { get; set; }

    public DbSet<Invoice> Invoices { get; set; }
    public DbSet<InvoiceDetail> InvoiceDetails { get; set; }
    public DbSet<InvoiceDetailFund> InvoiceDetailFunds { get; set; }
    public DbSet<InvoiceDocument> InvoiceDocuments { get; set; }
    public DbSet<InvoiceCreditDebitNote> InvoiceCreditDebitNotes { get; set; }
    public DbSet<ServiceInvoice> ServiceInvoices { get; set; }

    public DbSet<PaymentHeader> PaymentHeaders { get; set; }
    public DbSet<PaymentDetail> PaymentDetails { get; set; }
    public DbSet<Cashbook> Cashbooks { get; set; }
    public DbSet<CashbookVote> CashbookVotes { get; set; }
    public DbSet<EftFile> EftFiles { get; set; }
    public DbSet<SundryPayment> SundryPayments { get; set; }
    public DbSet<RemittanceAdvice> RemittanceAdvices { get; set; }
    public DbSet<CreditorsInterest> CreditorsInterests { get; set; }

    public DbSet<Tender> Tenders { get; set; }
    public DbSet<TenderVendor> TenderVendors { get; set; }
    public DbSet<TenderEvaluation> TenderEvaluations { get; set; }
    public DbSet<TenderAdjudication> TenderAdjudications { get; set; }
    public DbSet<TenderDocument> TenderDocuments { get; set; }
    public DbSet<TenderAwardedVendor> TenderAwardedVendors { get; set; }
    public DbSet<TenderFunctionality> TenderFunctionalities { get; set; }

    public DbSet<ContractDetail> ContractDetails { get; set; }
    public DbSet<ContractDocument> ContractDocuments { get; set; }
    public DbSet<PaymentCertificate> PaymentCertificates { get; set; }
    public DbSet<PaymentCertificateDetail> PaymentCertificateDetails { get; set; }
    public DbSet<ContractMilestone> ContractMilestones { get; set; }
    public DbSet<ProcurementPlan> ProcurementPlans { get; set; }
    public DbSet<RetentionRegister> RetentionRegisters { get; set; }
    public DbSet<ContractExtensionAndVariation> ContractExtensionsAndVariations { get; set; }
    public DbSet<ContractPerformance> ContractPerformances { get; set; }
    public DbSet<ContractServiceRequest> ContractServiceRequests { get; set; }
    public DbSet<ContractDetailItem> ContractDetailItems { get; set; }

    public DbSet<Vendor> Vendors { get; set; }
    public DbSet<VendorBankingDetail> VendorBankingDetails { get; set; }
    public DbSet<VendorContactDetail> VendorContactDetails { get; set; }
    public DbSet<VendorOwner> VendorOwners { get; set; }
    public DbSet<VendorRegistration> VendorRegistrations { get; set; }
    public DbSet<VendorDocumentDetail> VendorDocumentDetails { get; set; }
    public DbSet<VendorIssueRegister> VendorIssueRegisters { get; set; }
    public DbSet<VendorIssueRegisterDetail> VendorIssueRegisterDetails { get; set; }
    public DbSet<VendorShareHolderDetail> VendorShareHolderDetails { get; set; }
    public DbSet<VendorBusinessArea> VendorBusinessAreas { get; set; }
    public DbSet<VendorProfessionalBody> VendorProfessionalBodies { get; set; }

    public DbSet<Commodity> Commodities { get; set; }
    public DbSet<InventoryItem> InventoryItems { get; set; }
    public DbSet<InventoryIssue> InventoryIssues { get; set; }
    public DbSet<InventoryIssueLineItem> InventoryIssueLineItems { get; set; }
    public DbSet<InventoryReturn> InventoryReturns { get; set; }
    public DbSet<InventoryReturnLineItem> InventoryReturnLineItems { get; set; }
    public DbSet<InventoryTransfer> InventoryTransfers { get; set; }
    public DbSet<InventoryTransferLineItem> InventoryTransferLineItems { get; set; }
    public DbSet<Stocktake> Stocktakes { get; set; }
    public DbSet<StocktakeLineItem> StocktakeLineItems { get; set; }
    public DbSet<BinLocation> BinLocations { get; set; }
    public DbSet<InventoryDisposal> InventoryDisposals { get; set; }
    public DbSet<InventoryDisposalLineItem> InventoryDisposalLineItems { get; set; }
    public DbSet<InventoryDonation> InventoryDonations { get; set; }
    public DbSet<InventoryCorrection> InventoryCorrections { get; set; }
    public DbSet<InventoryValuation> InventoryValuations { get; set; }
    public DbSet<InventoryValueHistory> InventoryValueHistories { get; set; }
    public DbSet<InventoryGrnDetail> InventoryGrnDetails { get; set; }
    public DbSet<InventoryRequisition> InventoryRequisitions { get; set; }
    public DbSet<InventoryRequisitionLineItem> InventoryRequisitionLineItems { get; set; }
    public DbSet<DeptRequisition> DeptRequisitions { get; set; }
    public DbSet<DeptRequisitionLineItem> DeptRequisitionLineItems { get; set; }
    public DbSet<HighValueItem> HighValueItems { get; set; }
    public DbSet<HighValueLineItem> HighValueLineItems { get; set; }
    public DbSet<MonthEndException> MonthEndExceptions { get; set; }
    public DbSet<InventoryDisposalTypeCategory> InventoryDisposalTypeCategories { get; set; }

    public DbSet<AutoBinCode> AutoBinCodes { get; set; }
    public DbSet<CommodityClassification> CommodityClassifications { get; set; }
    public DbSet<CommodityType> CommodityTypes { get; set; }
    public DbSet<CommoditySubType> CommoditySubTypes { get; set; }
    public DbSet<CommodityTypeSubTypeMapping> CommodityTypeSubTypeMappings { get; set; }
    public DbSet<UnitOfIssue> UnitsOfIssue { get; set; }
    public DbSet<MeasureGroupCategory> MeasureGroupCategories { get; set; }
    public DbSet<InventoryScoaItemSetup> InventoryScoaItemSetups { get; set; }
    public DbSet<CommodityClassificationScoaItem> CommodityClassificationScoaItems { get; set; }
    public DbSet<CommodityClassificationScoaExpense> CommodityClassificationScoaExpenses { get; set; }
    public DbSet<CommodityClassificationScoaCostFormula> CommodityClassificationScoaCostFormulas { get; set; }
    public DbSet<InvenMonthEnd> InvenMonthEnds { get; set; }
    public DbSet<InvenTakeOnSettings> InvenTakeOnSettings { get; set; }
    public DbSet<UserStorePermission> UserStorePermissions { get; set; }
    public DbSet<WaterRouteName> WaterRouteNames { get; set; }
    public DbSet<WaterRoute> WaterRoutes { get; set; }
    public DbSet<WaterRouteNode> WaterRouteNodes { get; set; }
    public DbSet<InventoryReporting> InventoryReportings { get; set; }

    public DbSet<CommodityVendor> CommodityVendors { get; set; }
    public DbSet<CommodityUomMap> CommodityUomMaps { get; set; }
    public DbSet<CommodityScoaFunction> CommodityScoaFunctions { get; set; }
    public DbSet<VendorBarcode> VendorBarcodes { get; set; }
    public DbSet<InvenNotification> InvenNotifications { get; set; }
    public DbSet<TransferLocationDetail> TransferLocationDetails { get; set; }
    public DbSet<InvenInvoiceAdjustment> InvenInvoiceAdjustments { get; set; }
    public DbSet<IssueSerialNo> IssueSerialNos { get; set; }
    public DbSet<ReconciliationException> ReconciliationExceptions { get; set; }
    public DbSet<CommodityTakeOnSettings> CommodityTakeOnSettings { get; set; }
    public DbSet<CommodityTakeOnInfo> CommodityTakeOnInfos { get; set; }
    public DbSet<ValuationRejectionReason> ValuationRejectionReasons { get; set; }

    public DbSet<Grn> Grns { get; set; }
    public DbSet<GrnDetail> GrnDetails { get; set; }
    public DbSet<GrnDocument> GrnDocuments { get; set; }
    public DbSet<Gra> Gras { get; set; }
    public DbSet<GraDetail> GraDetails { get; set; }
    public DbSet<GrnApprovalSetup> GrnApprovalSetups { get; set; }
    public DbSet<ServiceEntrySheet> ServiceEntrySheets { get; set; }
    public DbSet<ServiceEntrySheetDetail> ServiceEntrySheetDetails { get; set; }
    public DbSet<AssetUnbundlingHeader> AssetUnbundlingHeaders { get; set; }
    public DbSet<AssetUnbundlingDetail> AssetUnbundlingDetails { get; set; }

    public DbSet<Department> Departments { get; set; }
    public DbSet<Division> Divisions { get; set; }
    public DbSet<Employee> Employees { get; set; }
    public DbSet<Store> Stores { get; set; }
    public DbSet<Vote> Votes { get; set; }
    public DbSet<ScmVendorStatus> ScmVendorStatuses { get; set; }
    public DbSet<Bank> Banks { get; set; }
    public DbSet<FinancialYear> FinancialYears { get; set; }
    public DbSet<ConfigSetting> ConfigSettings { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<NotificationDetail> NotificationDetails { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }
    public DbSet<Document> Documents { get; set; }
    public DbSet<GeneralRequest> GeneralRequests { get; set; }
    public DbSet<DeviationsRegister> DeviationsRegisters { get; set; }
    public DbSet<UnauthorisedExpenditureRegister> UnauthorisedExpenditureRegisters { get; set; }
    public DbSet<UserDashboardConfiguration> UserDashboardConfigurations { get; set; }
    public DbSet<ProcessBoundary> ProcessBoundaries { get; set; }
    public DbSet<ScmPreferencePointThreshold> ScmPreferencePointThresholds { get; set; }
    public DbSet<ScmDeviationMotivation> ScmDeviationMotivations { get; set; }
    public DbSet<ScmDeviationApproval> ScmDeviationApprovals { get; set; }
    public DbSet<ScmEvaluationMethod> ScmEvaluationMethods { get; set; }
    public DbSet<ScmServiceType> ScmServiceTypes { get; set; }
    public DbSet<ScmTenderApproval> ScmTenderApprovals { get; set; }
    public DbSet<ScmApprovalType> ScmApprovalTypes { get; set; }
    public DbSet<ScmProcurementGoal> ScmProcurementGoals { get; set; }
    public DbSet<DemandPlan> DemandPlans { get; set; }
    public DbSet<DemandPlanItem> DemandPlanItems { get; set; }
    public DbSet<NeedsAssessment> NeedsAssessments { get; set; }
    public DbSet<InformalTender> InformalTenders { get; set; }
    public DbSet<InformalTenderVendor> InformalTenderVendors { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<UserRole> UserRoles { get; set; }
    public DbSet<UserTransactionAuthorize> UserTransactionAuthorizations { get; set; }

    public DbSet<SysWorkFlow> SysWorkFlows { get; set; }
    public DbSet<SysWorkFlowSection> SysWorkFlowSections { get; set; }
    public DbSet<SysWorkFlowSectionAudit> SysWorkFlowSectionAudits { get; set; }
    public DbSet<SysPermission> SysPermissions { get; set; }
    public DbSet<SysRoleName> SysRoleNames { get; set; }
    public DbSet<SysRolePermission> SysRolePermissions { get; set; }
    public DbSet<SysRolePermissionSection> SysRolePermissionSections { get; set; }
    public DbSet<ContractApproval> ContractApprovals { get; set; }
    public DbSet<Delegation> Delegations { get; set; }
    public DbSet<DelegationThreshold> DelegationThresholds { get; set; }
    public DbSet<SegregationRule> SegregationRules { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Requisition>(entity =>
        {
            entity.HasMany(r => r.ServiceDetails).WithOne(d => d.Requisition).HasForeignKey(d => d.RequisitionId);
            entity.HasMany(r => r.Documents).WithOne().HasForeignKey(d => d.GenRequestId);
        });

        modelBuilder.Entity<Quotation>(entity =>
        {
            entity.HasMany(q => q.ServiceDetails).WithOne(d => d.Quotation).HasForeignKey(d => d.QuotationId);
            entity.HasMany(q => q.Vendors).WithOne(v => v.Quotation).HasForeignKey(v => v.QuotationId);
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasMany(o => o.OrderDetails).WithOne(d => d.Order).HasForeignKey(d => d.OrderId);
            entity.HasMany(o => o.OrderDocuments).WithOne(d => d.Order).HasForeignKey(d => d.OrderId);
            entity.HasMany(o => o.SplitDetails).WithOne(d => d.Order).HasForeignKey(d => d.OrderId);
            entity.HasOne(o => o.Vendor).WithMany().HasForeignKey(o => o.VendorId);
        });

        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.HasMany(i => i.InvoiceDetails).WithOne(d => d.Invoice).HasForeignKey(d => d.InvoiceId);
            entity.HasMany(i => i.InvoiceDocuments).WithOne(d => d.Invoice).HasForeignKey(d => d.InvoiceId);
        });

        modelBuilder.Entity<PaymentHeader>(entity =>
        {
            entity.HasMany(p => p.PaymentDetails).WithOne(d => d.PaymentHeader).HasForeignKey(d => d.PaymentHeaderId);
        });

        modelBuilder.Entity<Tender>(entity =>
        {
            entity.HasMany(t => t.TenderVendors).WithOne(v => v.Tender).HasForeignKey(v => v.TenderId);
            entity.HasMany(t => t.TenderDocuments).WithOne(d => d.Tender).HasForeignKey(d => d.TenderId);
            entity.HasMany(t => t.TenderEvaluations).WithOne(e => e.Tender).HasForeignKey(e => e.TenderId);
            entity.HasMany(t => t.TenderAdjudications).WithOne(a => a.Tender).HasForeignKey(a => a.TenderId);
        });

        modelBuilder.Entity<ContractDetail>(entity =>
        {
            entity.HasMany(c => c.ContractDocuments).WithOne(d => d.ContractDetail).HasForeignKey(d => d.ContractDetailsId);
            entity.HasMany(c => c.Milestones).WithOne(m => m.ContractDetail).HasForeignKey(m => m.ContractId);
            entity.HasMany(c => c.PaymentCertificates).WithOne(p => p.ContractDetail).HasForeignKey(p => p.ContractId);
            entity.HasMany(c => c.DetailItems).WithOne(i => i.ContractDetail).HasForeignKey(i => i.ContractDetailsId);
        });

        modelBuilder.Entity<PaymentCertificate>(entity =>
        {
            entity.HasMany(p => p.Details).WithOne(d => d.PaymentCertificate).HasForeignKey(d => d.PaymentCertificateId);
        });

        modelBuilder.Entity<Vendor>(entity =>
        {
            entity.HasMany(v => v.BankingDetails).WithOne(b => b.Vendor).HasForeignKey(b => b.VendorId);
            entity.HasMany(v => v.ContactDetails).WithOne(c => c.Vendor).HasForeignKey(c => c.VendorId);
            entity.HasMany(v => v.Owners).WithOne(o => o.Vendor).HasForeignKey(o => o.VendorId);
        });

        modelBuilder.Entity<VendorRegistration>(entity =>
        {
            entity.HasMany(r => r.ShareHolders).WithOne(s => s.Registration).HasForeignKey(s => s.VendorId);
            entity.HasMany(r => r.BusinessAreas).WithOne(b => b.Registration).HasForeignKey(b => b.VendorId);
        });

        modelBuilder.Entity<VendorIssueRegister>(entity =>
        {
            entity.HasMany(i => i.Details).WithOne(d => d.Issue).HasForeignKey(d => d.IssueId);
        });

        modelBuilder.Entity<InventoryIssue>(entity =>
        {
            entity.HasMany(i => i.LineItems).WithOne(l => l.Issue).HasForeignKey(l => l.IssueId);
        });

        modelBuilder.Entity<InventoryReturn>(entity =>
        {
            entity.HasMany(r => r.LineItems).WithOne(l => l.Return).HasForeignKey(l => l.ReturnId);
        });

        modelBuilder.Entity<InventoryTransfer>(entity =>
        {
            entity.HasMany(t => t.LineItems).WithOne(l => l.Transfer).HasForeignKey(l => l.TransferId);
        });

        modelBuilder.Entity<Stocktake>(entity =>
        {
            entity.HasMany(s => s.LineItems).WithOne(l => l.Stocktake).HasForeignKey(l => l.StocktakeId);
        });

        modelBuilder.Entity<InventoryDisposal>(entity =>
        {
            entity.HasMany(d => d.LineItems).WithOne(l => l.Disposal).HasForeignKey(l => l.DisposalId);
        });

        modelBuilder.Entity<InventoryRequisition>(entity =>
        {
            entity.HasMany(r => r.LineItems).WithOne(l => l.Requisition).HasForeignKey(l => l.InvRequisitionId);
        });

        modelBuilder.Entity<DeptRequisition>(entity =>
        {
            entity.HasMany(d => d.LineItems).WithOne(l => l.DeptRequisition).HasForeignKey(l => l.DeptRequisitionId);
        });

        modelBuilder.Entity<HighValueItem>(entity =>
        {
            entity.HasMany(h => h.LineItems).WithOne(l => l.HighValueItem).HasForeignKey(l => l.HighValueId);
        });

        modelBuilder.Entity<Grn>(entity =>
        {
            entity.HasMany(g => g.GrnDetails).WithOne(d => d.Grn).HasForeignKey(d => d.GrnId);
            entity.HasMany(g => g.GrnDocuments).WithOne(d => d.Grn).HasForeignKey(d => d.GrnId);
        });

        modelBuilder.Entity<Gra>(entity =>
        {
            entity.HasMany(g => g.GraDetails).WithOne(d => d.Gra).HasForeignKey(d => d.GraId);
        });

        modelBuilder.Entity<ServiceEntrySheet>(entity =>
        {
            entity.HasMany(s => s.Details).WithOne(d => d.ServiceEntry).HasForeignKey(d => d.ServiceEntryId);
        });

        modelBuilder.Entity<AssetUnbundlingHeader>(entity =>
        {
            entity.HasMany(h => h.Details).WithOne(d => d.Header).HasForeignKey(d => d.AssetUnbundlingId);
        });

        modelBuilder.Entity<QuotationVendor>(entity =>
        {
            entity.HasOne(qv => qv.Vendor).WithMany().HasForeignKey(qv => qv.VendorId);
        });

        modelBuilder.Entity<DemandPlan>(entity =>
        {
            entity.HasMany(dp => dp.Items).WithOne(i => i.DemandPlan).HasForeignKey(i => i.DemandPlanId);
        });

        modelBuilder.Entity<InformalTender>(entity =>
        {
            entity.HasMany(it => it.Vendors).WithOne(v => v.InformalTender).HasForeignKey(v => v.InformalTenderId);
        });

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasKey(ur => new { ur.UserId, ur.RoleId });
            entity.HasOne(ur => ur.User).WithMany(u => u.UserRoles).HasForeignKey(ur => ur.UserId);
            entity.HasOne(ur => ur.Role).WithMany().HasForeignKey(ur => ur.RoleId);
        });

        modelBuilder.Entity<UserTransactionAuthorize>(entity =>
        {
            entity.HasOne(ta => ta.User).WithMany(u => u.TransactionAuthorizations).HasForeignKey(ta => ta.UserId);
        });

        modelBuilder.Entity<SysWorkFlow>(entity =>
        {
            entity.HasMany(w => w.Sections).WithOne(s => s.WorkFlow).HasForeignKey(s => s.WorkFlowId);
        });

        modelBuilder.Entity<SysRolePermission>(entity =>
        {
            entity.HasKey(rp => new { rp.PermissionId, rp.RoleId });
        });

        modelBuilder.Entity<SysRolePermissionSection>(entity =>
        {
            entity.HasKey(rps => new { rps.RoleId, rps.WorkFlowSectionId });
        });
    }
}
