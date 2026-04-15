using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/cidms-sub-component-types")]
public class WipClassificationController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    public WipClassificationController(DbConnectionFactory db) => _db = db;

    [HttpGet("with-hierarchy")]
    public async Task<IActionResult> GetWithHierarchy()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(@"
            SELECT
                s.""AssetCIDMSSubComponentTypeID""  AS ""cidmsSubComponentTypeId"",
                s.""AssetCIDMSSubComponentTypeDesc"" AS ""cidmsSubComponentTypeDesc"",
                ct.""AssetCIDMSComponentTypeID""    AS ""cidmsComponentTypeId"",
                ct.""AssetCIDMSComponentTypeDesc""  AS ""cidmsComponentTypeDesc"",
                at2.""AssetCIDMSAssetTypeID""       AS ""cidmsAssetTypeId"",
                at2.""AssetCIDMSAssetTypeDesc""     AS ""cidmsAssetTypeDesc"",
                gt.""AssetCIDMSGroupTypeID""        AS ""cidmsGroupTypeId"",
                gt.""AssetCIDMSGroupTypeDesc""      AS ""cidmsGroupTypeDesc"",
                cl.""AssetCIDMSClassID""            AS ""cidmsClassId"",
                cl.""AssetCIDMSClassDesc""          AS ""cidmsClassDesc"",
                sg.""AssetAccountSubGroupID""       AS ""cidmsAccountingSubGroupId"",
                sg.""AssetAccountSubGroupDesc""     AS ""cidmsAccountingSubGroupDesc"",
                ag.""AssetAccountGroupID""          AS ""cidmsAccountingGroupId"",
                ag.""AssetAccountGroupDesc""        AS ""cidmsAccountingGroupDesc""
            FROM ""Const_Asset_CIDMS_SubComponent_Type"" s
            LEFT JOIN ""Const_Asset_CIDMS_Component_Type"" ct
                ON s.""AssetCIDMSComponentTypeID"" = ct.""AssetCIDMSComponentTypeID""
            LEFT JOIN ""Const_Asset_CIDMS_Asset_Type"" at2
                ON ct.""AssetCIDMSAssetTypeID"" = at2.""AssetCIDMSAssetTypeID""
            LEFT JOIN ""Const_Asset_CIDMS_Group_Type"" gt
                ON at2.""AssetCIDMSGroupTypeID"" = gt.""AssetCIDMSGroupTypeID""
            LEFT JOIN ""Const_Asset_CIDMS_Class"" cl
                ON gt.""AssetCIDMSClassID"" = cl.""AssetCIDMSClassID""
            LEFT JOIN ""Const_Asset_CIDMS_Accounting_Sub_Group"" sg
                ON cl.""AssetAccountSubGroupID"" = sg.""AssetAccountSubGroupID""
            LEFT JOIN ""Const_Asset_CIDMS_Accounting_Group"" ag
                ON sg.""AssetAccountGroupID"" = ag.""AssetAccountGroupID""
            ORDER BY s.""AssetCIDMSSubComponentTypeID""");
        return Ok(items);
    }
}
