namespace MssqlApi.Models;

public class ScmUnbundlingHeader
{
    public int AssetContractHeader_ID { get; set; }
    public int ContractID { get; set; }
    public int? AssetParentID { get; set; }
    public int VendorID { get; set; }
    public bool Enabled { get; set; }
    public bool? Complete { get; set; }
    public DateTime DateCaptured { get; set; }
    public int CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
}
