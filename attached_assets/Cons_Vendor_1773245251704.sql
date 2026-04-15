SELECT *
  FROM [EMS_Mnquma].[dbo].[Cons_Vendor] cv
  inner join SCM_AssetUnbundling_Header auh on cv.Vendor_ID = auh.VendorID
  where auh.DateCaptured > '2025/06/30'
