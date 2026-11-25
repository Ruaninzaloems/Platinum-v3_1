using AssetManagement.Data;
using Dapper;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.AspNetCore.Hosting;
using iText.Html2pdf;

namespace AssetManagement.Services;

public class EmailService
{
    private readonly DbConnectionFactory _db;
    private readonly string _uploadPath;

    public EmailService(DbConnectionFactory db, IWebHostEnvironment env)
    {
        _db = db;
        _uploadPath = Path.Combine(env.ContentRootPath, "uploads", "asset-docs");
        Directory.CreateDirectory(_uploadPath);
    }

    public static Dictionary<string, string> BuildBaseTokens(
        string assetId = "",
        string assetDescription = "",
        string assetClass = "",
        string assetType = "",
        string category = "",
        string approvalDate = "") => new Dictionary<string, string>
    {
        ["AssetId"]          = assetId,
        ["AssetDescription"] = assetDescription,
        ["AssetClass"]       = assetClass,
        ["AssetType"]        = assetType,
        ["Category"]         = category,
        ["ApprovalDate"]     = string.IsNullOrEmpty(approvalDate) ? DateTime.Now.ToString("dd MMM yyyy") : approvalDate,
    };

    public async Task<Dictionary<string, string>> BuildAssetBaseTokensAsync(
        System.Data.Common.DbConnection conn,
        int assetId,
        string approvalDate = "")
    {
        try
        {
            var asset = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT a.""Description""                  AS ""AssetDescription"",
                       COALESCE(cls.""AssetClassDesc"", '') AS ""AssetClass"",
                       COALESCE(at2.""AssetTypeDesc"",  '') AS ""AssetType"",
                       COALESCE(cat.""AssetCategoryDesc"", '') AS ""AssetCategory""
                FROM ""Asset_Register_Items"" a
                LEFT JOIN ""Const_AssetClass_sys"" cls ON a.""AssetClass_ID"" = cls.""AssetClass_ID""
                LEFT JOIN ""Const_AssetType_Sys"" at2 ON a.""AssetType_ID""  = at2.""AssetType_ID""
                LEFT JOIN ""Const_AssetCategory_sys"" cat ON a.""AssetCategory_ID"" = cat.""AssetCategoryID""
                WHERE a.""AssetRegisterItem_ID"" = @assetId", new { assetId });
            return BuildBaseTokens(
                assetId.ToString(),
                (string)(asset?.AssetDescription ?? ""),
                (string)(asset?.AssetClass ?? ""),
                (string)(asset?.AssetType ?? ""),
                (string)(asset?.AssetCategory ?? ""),
                approvalDate);
        }
        catch
        {
            return BuildBaseTokens(assetId.ToString(), approvalDate: approvalDate);
        }
    }

    public async Task SendTransactionEmailsAsync(string transactionType, Dictionary<string, string>? tokens = null)
    {
        // Auto-merge system-level tokens; caller-provided tokens take precedence
        var merged = new Dictionary<string, string>
        {
            ["Timestamp"]    = DateTime.Now.ToString("dd MMM yyyy HH:mm"),
            ["SystemName"]   = "Platinum Asset Management System",
            ["Municipality"] = "Mnquma Local Municipality",
        };
        if (tokens != null)
            foreach (var kv in tokens)
                merged[kv.Key] = kv.Value;
        tokens = merged;

        try
        {
            await using var conn = _db.CreateConnection();
            await conn.OpenAsync();

            var settings = await conn.QueryFirstOrDefaultAsync<dynamic>(
                @"SELECT * FROM ""Asset_EmailSettings"" LIMIT 1");
            if (settings == null)
            {
                Console.Error.WriteLine($"[EmailService] No email settings configured — skipping {transactionType} notification.");
                return;
            }

            string smtpHost = (string)(settings.smtp_host ?? "");
            if (string.IsNullOrEmpty(smtpHost))
            {
                Console.Error.WriteLine($"[EmailService] SMTP host not set — skipping {transactionType} notification.");
                return;
            }

            string fromEmail = (string)(settings.from_email ?? "");
            if (string.IsNullOrEmpty(fromEmail))
            {
                Console.Error.WriteLine($"[EmailService] From-email not set — skipping {transactionType} notification.");
                return;
            }

            var templates = await conn.QueryAsync<dynamic>(
                @"SELECT * FROM ""Asset_EmailTemplates"" WHERE ""TransactionType"" = @transactionType AND ""IsActive"" = 1",
                new { transactionType });

            int smtpPort = (int)(settings.smtp_port ?? 587);
            string fromName = (string)(settings.from_name ?? "");
            string username = (string)(settings.smtp_username ?? "");
            string password = (string)(settings.smtp_password ?? "");
            bool useTls = ((int)(settings.use_tls ?? 1)) == 1;
            var socketOptions = ResolveSocketOptions(smtpPort, useTls);

            foreach (var template in templates)
            {
                string subject = ApplyTokens((string)(template.TemplateTitle ?? ""), tokens);
                string body = ApplyTokens((string)(template.MessageContent ?? ""), tokens);
                string recipientsRaw = (string)(template.RecipientEmails ?? "");
                int templateId = (int)(template.id ?? 0);

                var recipients = recipientsRaw
                    .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .Where(r => r.Contains('@')).ToList();

                if (!recipients.Any()) continue;

                string status = "Success";
                string? errorMsg = null;

                try
                {
                    await SendMailKitAsync(smtpHost, smtpPort, socketOptions, username, password,
                        fromEmail, fromName, recipients, subject, body);
                }
                catch (Exception ex)
                {
                    status = "Failed";
                    errorMsg = ex.Message;
                    Console.Error.WriteLine($"[EmailService] SMTP send failed for template {templateId} ({transactionType}): {ex.Message}");
                }

                try
                {
                    await conn.ExecuteAsync(
                        @"INSERT INTO ""Asset_EmailLog"" (""TemplateID"", ""TransactionType"", ""Recipients"", ""Subject"", ""Status"", ""ErrorMessage"")
                          VALUES (@templateId, @transactionType, @recipients, @subject, @status, @errorMsg)",
                        new { templateId, transactionType, recipients = string.Join(", ", recipients), subject, status, errorMsg });
                }
                catch (Exception logEx)
                {
                    Console.Error.WriteLine($"[EmailService] Failed to write email log for template {templateId}: {logEx.Message}");
                }

                // Generate PDF and attach to asset document store
                if (tokens != null && tokens.TryGetValue("AssetId", out var assetIdStr)
                    && int.TryParse(assetIdStr, out int assetIdInt) && assetIdInt > 0)
                {
                    try
                    {
                        string safeTxnType = System.Text.RegularExpressions.Regex.Replace(transactionType, @"[^\w]", "_");
                        string pdfFileName = $"Email_{safeTxnType}_{assetIdInt}_{DateTime.Now:yyyyMMdd}.pdf";
                        string uniqueName = $"{Guid.NewGuid()}-{pdfFileName}";
                        string filePath = Path.Combine(_uploadPath, uniqueName);

                        byte[] pdfBytes = GeneratePdfBytes(body, subject);
                        await File.WriteAllBytesAsync(filePath, pdfBytes);

                        await conn.ExecuteAsync(@"
                            INSERT INTO ""Asset_Documents""
                                (""entity_type"", ""entity_id"", ""file_name"", ""file_path"", ""file_size"",
                                 ""mime_type"", ""uploaded_by"", ""description"", ""asset_register_item_id"", ""transaction_type"")
                            VALUES
                                (@entityType, @entityId, @fileName, @storedName, @fileSize,
                                 @mimeType, 1, @description, @assetId, @txnType)",
                            new {
                                entityType    = "email",
                                entityId      = assetIdInt.ToString(),
                                fileName      = pdfFileName,
                                storedName    = uniqueName,
                                fileSize      = pdfBytes.Length,
                                mimeType      = "application/pdf",
                                assetId       = assetIdInt,
                                txnType       = transactionType,
                                description   = $"Email notification: {subject}",
                            });
                    }
                    catch (Exception pdfEx)
                    {
                        Console.Error.WriteLine($"[EmailService] PDF attach failed for {transactionType} asset {assetIdStr}: {pdfEx.GetType().FullName}: {pdfEx.Message}");
                        Console.Error.WriteLine($"[EmailService] PDF stack: {pdfEx.StackTrace}");
                        if (pdfEx.InnerException != null)
                            Console.Error.WriteLine($"[EmailService] PDF inner: {pdfEx.InnerException.GetType().FullName}: {pdfEx.InnerException.Message}\n{pdfEx.InnerException.StackTrace}");
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[EmailService] Unhandled error sending {transactionType} emails: {ex.Message}");
        }
    }

    public async Task TestConnectionAsync(string toEmail)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var settings = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT * FROM ""Asset_EmailSettings"" LIMIT 1");
        if (settings == null) throw new Exception("No email settings configured.");

        string smtpHost = (string)(settings.smtp_host ?? "");
        if (string.IsNullOrEmpty(smtpHost)) throw new Exception("SMTP host not configured.");

        int smtpPort = (int)(settings.smtp_port ?? 587);
        string fromName = (string)(settings.from_name ?? "");
        string fromEmail = (string)(settings.from_email ?? "");
        if (string.IsNullOrEmpty(fromEmail)) throw new Exception("From-email not configured.");
        string username = (string)(settings.smtp_username ?? "");
        string password = (string)(settings.smtp_password ?? "");
        bool useTls = ((int)(settings.use_tls ?? 1)) == 1;
        var socketOptions = ResolveSocketOptions(smtpPort, useTls);

        await SendMailKitAsync(smtpHost, smtpPort, socketOptions, username, password,
            fromEmail, fromName, new List<string> { toEmail },
            "Asset Management System - Test Email",
            "This is a test email from the Platinum Asset Management System. Your email configuration is working correctly.");
    }

    private static bool IsHtmlBody(string body) =>
        !string.IsNullOrEmpty(body) &&
        System.Text.RegularExpressions.Regex.IsMatch(body, @"<(p|br|div|span|h[1-6]|ul|ol|li|strong|em|table|td|th|a|img|b|i|u)\b", System.Text.RegularExpressions.RegexOptions.IgnoreCase);

    private static string StripHtml(string html)
    {
        if (string.IsNullOrEmpty(html)) return html;
        // Replace block-level tags with newlines so paragraphs are preserved
        html = System.Text.RegularExpressions.Regex.Replace(html, @"</?(p|br|div|li|h[1-6])[^>]*>", "\n", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        // Strip remaining tags
        html = System.Text.RegularExpressions.Regex.Replace(html, @"<[^>]+>", "");
        // Decode HTML entities
        html = System.Net.WebUtility.HtmlDecode(html);
        // Collapse excessive blank lines
        html = System.Text.RegularExpressions.Regex.Replace(html, @"\n{3,}", "\n\n");
        return html.Trim();
    }

    private static byte[] GeneratePdfBytes(string bodyHtml, string subject)
    {
        string fullHtml = BuildPdfHtml(subject, bodyHtml);
        var ms = new MemoryStream();
        HtmlConverter.ConvertToPdf(fullHtml, ms);
        return ms.ToArray();
    }

    private static string BuildPdfHtml(string subject, string body)
    {
        string escapedSubject = System.Net.WebUtility.HtmlEncode(subject);
        string safeBody = IsHtmlBody(body)
            ? body
            : System.Net.WebUtility.HtmlEncode(body).Replace("\n", "<br/>");
        return "<!DOCTYPE html><html><head><meta charset=\"utf-8\"/><style>" +
               "body{font-family:Arial,Helvetica,sans-serif;font-size:11pt;color:#222;margin:40px;}" +
               "h1{font-size:14pt;margin:0 0 4px;}" +
               "hr{border:none;border-top:1px solid #ccc;margin-bottom:12px;}" +
               "p{margin:0 0 8px;}ul,ol{margin:0 0 8px;padding-left:20px;}" +
               "h2{font-size:12pt;}h3{font-size:11pt;}" +
               "table{border-collapse:collapse;width:100%;margin:8px 0;}" +
               "th,td{border:1px solid #ccc;padding:6px 10px;font-size:10pt;text-align:left;}" +
               "th{background:#f1f5f9;font-weight:bold;}" +
               "img{max-width:100%;height:auto;}" +
               ".footer{color:#888;font-size:9pt;margin-top:20px;}" +
               "</style></head><body>" +
               $"<h1>{escapedSubject}</h1><hr/>" +
               safeBody +
               $"<p class=\"footer\">Generated: {DateTime.Now:dd MMM yyyy HH:mm}</p>" +
               "</body></html>";
    }

    private static async Task SendMailKitAsync(
        string host, int port, SecureSocketOptions socketOptions,
        string username, string password,
        string fromEmail, string fromName,
        List<string> recipients, string subject, string body)
    {
        bool isHtml = IsHtmlBody(body);
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(fromName, fromEmail));
        message.Subject = subject;
        if (isHtml)
        {
            var builder = new BodyBuilder { HtmlBody = body };
            message.Body = builder.ToMessageBody();
        }
        else
        {
            message.Body = new TextPart("plain") { Text = body };
        }
        foreach (var r in recipients)
            message.To.Add(MailboxAddress.Parse(r));

        using var client = new SmtpClient();
        client.ServerCertificateValidationCallback = (s, c, h, e) =>
        {
            if (e != System.Net.Security.SslPolicyErrors.None)
                Console.Error.WriteLine($"[EmailService] Certificate warning ({e}) — proceeding anyway.");
            return true;
        };

        await client.ConnectAsync(host, port, socketOptions);
        if (!string.IsNullOrEmpty(username))
            await client.AuthenticateAsync(username, password);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }

    private static SecureSocketOptions ResolveSocketOptions(int port, bool useTls)
    {
        if (port == 465) return SecureSocketOptions.SslOnConnect;
        if (useTls) return SecureSocketOptions.StartTls;
        return SecureSocketOptions.None;
    }

    private static string ApplyTokens(string text, Dictionary<string, string>? tokens)
    {
        if (string.IsNullOrEmpty(text)) return text;
        if (tokens != null)
            foreach (var kv in tokens)
                text = text.Replace($"{{{kv.Key}}}", kv.Value, StringComparison.OrdinalIgnoreCase);
        // Strip any remaining unresolved {TokenName} placeholders
        text = System.Text.RegularExpressions.Regex.Replace(text, @"\{[A-Za-z][A-Za-z0-9_]*\}", "");
        return text;
    }
}
