using System.Data.Common;
using Dapper;

namespace AssetManagement.Services;

public class LocationService
{
    public async Task<IEnumerable<dynamic>> GetRoomsWithAssetsAsync(DbConnection conn)
    {
        return await conn.QueryAsync<dynamic>(@"
            SELECT DISTINCT
                r.""Room_ID""                       AS ""id"",
                r.""RoomDesc""                      AS ""roomDesc"",
                COALESCE(f.""Floor_ID"", 0)         AS ""floorId"",
                COALESCE(f.""FloorDesc"", '')       AS ""floorDesc"",
                COALESCE(b.""Building_ID"", 0)      AS ""buildingId"",
                COALESCE(b.""BuildingDesc"", '')    AS ""buildingDesc""
            FROM ""Const_Room"" r
            JOIN ""Asset_Register_Items"" a ON a.""Room_ID"" = r.""Room_ID""
            LEFT JOIN ""Const_Floor""    f ON f.""Floor_ID""    = r.""FloorID""
            LEFT JOIN ""Const_Building"" b ON b.""Building_ID"" = f.""BuildingID""
            WHERE COALESCE(a.""Decommissioning"", 0) = 0
            ORDER BY COALESCE(b.""BuildingDesc"", ''), COALESCE(f.""FloorDesc"", ''), r.""RoomDesc""");
    }

    public async Task<IEnumerable<dynamic>> GetRoomAssetDetailsAsync(DbConnection conn,
        string? fromRoom = null, string? toRoom = null,
        int? custodianId = null, int? departmentId = null, int? divisionId = null)
    {
        var conditions = new List<string>
        {
            @"a.""Room_ID"" IS NOT NULL",
            @"COALESCE(a.""Decommissioning"", 0) = 0",
            @"(@fromRoom IS NULL OR r.""RoomDesc"" >= @fromRoom)",
            @"(@toRoom   IS NULL OR r.""RoomDesc"" <= @toRoom)",
            @"(@custodianId  IS NULL OR a.""Custodian_ID"" = @custodianId)",
            @"(@departmentId IS NULL OR CAST(NULLIF(a.""MunicipalDepartment_ID"", '') AS INTEGER) = @departmentId)",
            @"(@divisionId   IS NULL OR a.""DivisionID"" = @divisionId)"
        };

        var where = string.Join(" AND ", conditions);
        var sql = $@"
            SELECT
                a.""AssetRegisterItem_ID""                                              AS ""assetId"",
                COALESCE(a.""Barcode"", '')                                             AS ""barcode"",
                COALESCE(a.""Description"", '')                                        AS ""description"",
                COALESCE(a.""SerialNumber"", '')                                       AS ""serialNumber"",
                COALESCE(a.""Make"", '')                                               AS ""make"",
                COALESCE(a.""Model"", '')                                              AS ""model"",
                COALESCE(a.""Quantity"", 1)::NUMERIC                                   AS ""quantity"",
                COALESCE(a.""QuantityCaption"", '')                                    AS ""quantityCaption"",
                COALESCE(a.""CarryingAmountClosingBalance"", 0)::NUMERIC               AS ""carryingValue"",
                a.""AssetType_ID""                                                     AS ""assetTypeId"",
                COALESCE(t.""AssetTypeDesc"", '')                                      AS ""assetType"",
                a.""AssetCategory_ID""                                                 AS ""assetCategoryId"",
                COALESCE(cat.""AssetCategoryDesc"", '')                                AS ""assetCategory"",
                a.""Room_ID""                                                          AS ""roomId"",
                COALESCE(r.""RoomDesc"", '')                                           AS ""roomDesc"",
                COALESCE(f.""Floor_ID"", 0)::INTEGER                                  AS ""floorId"",
                COALESCE(f.""FloorDesc"", '')                                          AS ""floorDesc"",
                COALESCE(b.""Building_ID"", 0)::INTEGER                               AS ""buildingId"",
                COALESCE(b.""BuildingDesc"", '')                                       AS ""buildingDesc"",
                a.""Custodian_ID""                                                     AS ""custodianId"",
                CAST(NULLIF(a.""MunicipalDepartment_ID"", '') AS INTEGER)              AS ""departmentId"",
                a.""DivisionID""                                                       AS ""divisionId""
            FROM ""Asset_Register_Items"" a
            LEFT JOIN ""Const_Room""              r   ON r.""Room_ID""      = a.""Room_ID""
            LEFT JOIN ""Const_Floor""             f   ON f.""Floor_ID""     = r.""FloorID""
            LEFT JOIN ""Const_Building""          b   ON b.""Building_ID""  = f.""BuildingID""
            LEFT JOIN ""Const_AssetType_Sys""     t   ON t.""AssetType_ID"" = a.""AssetType_ID""
            LEFT JOIN ""Const_AssetCategory_sys"" cat ON cat.""AssetCategoryID"" = a.""AssetCategory_ID""
            WHERE {where}
            ORDER BY b.""BuildingDesc"", f.""FloorDesc"", r.""RoomDesc"", a.""Description""";

        return await conn.QueryAsync<dynamic>(sql,
            new { fromRoom, toRoom, custodianId, departmentId, divisionId });
    }
}
