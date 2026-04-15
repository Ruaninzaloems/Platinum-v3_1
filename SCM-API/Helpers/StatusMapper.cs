namespace SCM_API.Helpers;

public static class StatusMapper
{
    private static readonly Dictionary<string, int> _requisitionStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        ["draft"] = 0, ["saved"] = 1, ["submitted"] = 2, ["supervisor_review"] = 3,
        ["supervisor_approved"] = 4, ["hod_review"] = 5, ["final_approved"] = 6,
        ["routed"] = 7, ["completed"] = 8, ["returned"] = 9, ["voided"] = 10,
        ["approved"] = 6, ["rejected"] = 9, ["pending"] = 2, ["amended"] = 1
    };

    private static readonly Dictionary<int, string> _requisitionStatusNames = new()
    {
        [0] = "draft", [1] = "saved", [2] = "submitted", [3] = "supervisor_review",
        [4] = "supervisor_approved", [5] = "hod_review", [6] = "final_approved",
        [7] = "routed", [8] = "completed", [9] = "returned", [10] = "voided"
    };

    private static readonly Dictionary<string, int> _quotationStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        ["draft"] = 0, ["open"] = 1, ["published"] = 1,
        ["closed"] = 2, ["evaluated"] = 3, ["awarded"] = 4,
        ["approved"] = 5, ["submitted"] = 6, ["cancelled"] = 7, ["rejected"] = 8
    };

    private static readonly Dictionary<int, string> _quotationStatusNames = new()
    {
        [0] = "draft", [1] = "open", [2] = "closed", [3] = "evaluated",
        [4] = "awarded", [5] = "approved", [6] = "submitted", [7] = "cancelled", [8] = "rejected"
    };

    private static readonly Dictionary<string, int> _orderStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        ["draft"] = 0, ["submitted"] = 1, ["approved"] = 2, ["dispatched"] = 3,
        ["received"] = 4, ["completed"] = 5, ["cancelled"] = 6, ["rejected"] = 7,
        ["declined"] = 8, ["voided"] = 9, ["pending"] = 1, ["partially_received"] = 4,
        ["final_approved"] = 2
    };

    private static readonly Dictionary<int, string> _orderStatusNames = new()
    {
        [0] = "draft", [1] = "submitted", [2] = "approved", [3] = "dispatched",
        [4] = "received", [5] = "completed", [6] = "cancelled", [7] = "rejected",
        [8] = "declined", [9] = "voided"
    };

    private static readonly Dictionary<string, int> _invoiceStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        ["draft"] = 0, ["submitted"] = 1, ["verified"] = 2, ["approved"] = 3,
        ["paid"] = 4, ["rejected"] = 5, ["voided"] = 6, ["pending"] = 1,
        ["matched"] = 2, ["processing"] = 1, ["payment_batched"] = 7,
        ["on_hold"] = 8, ["disputed"] = 9, ["match_exception"] = 10,
        ["final_approved"] = 3
    };

    private static readonly Dictionary<int, string> _invoiceStatusNames = new()
    {
        [0] = "draft", [1] = "submitted", [2] = "verified", [3] = "approved",
        [4] = "paid", [5] = "rejected", [6] = "voided", [7] = "payment_batched",
        [8] = "on_hold", [9] = "disputed", [10] = "match_exception"
    };

    private static readonly Dictionary<string, int> _grnStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        ["draft"] = 0, ["submitted"] = 1, ["approved"] = 2, ["rejected"] = 3,
        ["pending"] = 1, ["received"] = 2, ["voided"] = 4
    };

    private static readonly Dictionary<int, string> _grnStatusNames = new()
    {
        [0] = "draft", [1] = "submitted", [2] = "approved", [3] = "rejected",
        [4] = "voided"
    };

    private static readonly Dictionary<string, int> _graStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        ["draft"] = 0, ["pending_approval"] = 1, ["approved"] = 2, ["declined"] = 3,
        ["gra_created"] = 4, ["active"] = 5
    };

    private static readonly Dictionary<int, string> _graStatusNames = new()
    {
        [0] = "draft", [1] = "pending_approval", [2] = "approved", [3] = "declined",
        [4] = "gra_created", [5] = "active"
    };

    private static readonly Dictionary<string, int> _paymentStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        ["draft"] = 0, ["submitted"] = 1, ["approved"] = 2, ["processed"] = 3,
        ["paid"] = 4, ["rejected"] = 5, ["pending"] = 1, ["pending_approval"] = 1,
        ["eft_generated"] = 6, ["voided"] = 7, ["reversed"] = 8, ["cancelled"] = 9
    };

    private static readonly Dictionary<int, string> _paymentStatusNames = new()
    {
        [0] = "draft", [1] = "pending_approval", [2] = "approved", [3] = "processed",
        [4] = "paid", [5] = "rejected", [6] = "eft_generated", [7] = "voided",
        [8] = "reversed", [9] = "cancelled"
    };

    private static readonly Dictionary<string, int> _tenderStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        ["draft"] = 0, ["specifications"] = 1, ["published"] = 2, ["closed"] = 3,
        ["evaluation"] = 4, ["adjudication"] = 5, ["awarded"] = 6, ["contract_active"] = 7,
        ["cancelled"] = 8, ["void_requested"] = 9, ["voided"] = 10
    };

    private static readonly Dictionary<int, string> _tenderStatusNames = new()
    {
        [0] = "draft", [1] = "specifications", [2] = "published", [3] = "closed",
        [4] = "evaluation", [5] = "adjudication", [6] = "awarded", [7] = "contract_active",
        [8] = "cancelled", [9] = "void_requested", [10] = "voided"
    };

    private static readonly Dictionary<string, int> _informalTenderStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        ["draft"] = 0, ["published"] = 1, ["closed"] = 2, ["adjudicated"] = 3,
        ["awarded"] = 4, ["approved"] = 5, ["completed"] = 6, ["voided"] = 7,
        ["saved"] = 0, ["pending_approval"] = 5
    };

    private static readonly Dictionary<int, string> _informalTenderStatusNames = new()
    {
        [0] = "draft", [1] = "published", [2] = "closed", [3] = "adjudicated",
        [4] = "awarded", [5] = "approved", [6] = "completed", [7] = "voided"
    };

    private static readonly Dictionary<string, int> _vendorStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        ["pending"] = 0, ["active"] = 1, ["suspended"] = 2, ["blacklisted"] = 3,
        ["inactive"] = 4, ["approved"] = 1
    };

    private static readonly Dictionary<int, string> _vendorStatusNames = new()
    {
        [0] = "pending", [1] = "active", [2] = "suspended", [3] = "blacklisted", [4] = "inactive"
    };

    private static readonly Dictionary<string, int> _contractStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        ["draft"] = 0, ["active"] = 1, ["expired"] = 2, ["terminated"] = 3,
        ["suspended"] = 4, ["completed"] = 5, ["pending"] = 0
    };

    private static readonly Dictionary<int, string> _contractStatusNames = new()
    {
        [0] = "draft", [1] = "active", [2] = "expired", [3] = "terminated",
        [4] = "suspended", [5] = "completed"
    };

    public static int ToStatusId(string module, string? statusName)
    {
        if (string.IsNullOrEmpty(statusName)) return 0;
        var map = module.ToLowerInvariant() switch
        {
            "requisition" => _requisitionStatuses,
            "quotation" or "rfq" => _quotationStatuses,
            "order" or "po" => _orderStatuses,
            "invoice" => _invoiceStatuses,
            "grn" => _grnStatuses,
            "gra" or "return" => _graStatuses,
            "payment" or "batch" => _paymentStatuses,
            "tender" => _tenderStatuses,
            "informal_tender" or "informaltender" or "ift" => _informalTenderStatuses,
            "vendor" or "supplier" => _vendorStatuses,
            "contract" => _contractStatuses,
            _ => _requisitionStatuses
        };
        return map.TryGetValue(statusName, out var id) ? id : 0;
    }

    public static string ToStatusName(string module, int? statusId)
    {
        if (!statusId.HasValue) return "draft";
        var map = module.ToLowerInvariant() switch
        {
            "requisition" => _requisitionStatusNames,
            "quotation" or "rfq" => _quotationStatusNames,
            "order" or "po" => _orderStatusNames,
            "invoice" => _invoiceStatusNames,
            "grn" => _grnStatusNames,
            "gra" or "return" => _graStatusNames,
            "payment" or "batch" => _paymentStatusNames,
            "tender" => _tenderStatusNames,
            "informal_tender" or "informaltender" or "ift" => _informalTenderStatusNames,
            "vendor" or "supplier" => _vendorStatusNames,
            "contract" => _contractStatusNames,
            _ => _requisitionStatusNames
        };
        return map.TryGetValue(statusId.Value, out var name) ? name : "draft";
    }
}
