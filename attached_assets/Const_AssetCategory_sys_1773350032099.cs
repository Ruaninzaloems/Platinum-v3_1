namespace AssetManagement.Models
{
    public class Const_AssetCategory_sys
    {
        public int AssetCategoryID { get; set; }
        public string AssetCategoryDesc { get; set; } = string.Empty;
        public bool Enabled { get; set; }
        public DateTime DateCaptured { get; set; }
        public int CapturerID { get; set; }
        public DateTime? DateModified { get; set; }
        public int? ModifierID { get; set; }
        public bool? RevaluationByCostModel { get; set; }
        public bool? RevaluationByRevalutionModel { get; set; }
        public bool? Default { get; set; }
        public int? TypeID { get; set; }
        public bool? RequireStatus { get; set; }
    }
}
