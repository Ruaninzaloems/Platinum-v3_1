SELECT *
  FROM [EMS_Mnquma].[dbo].[SCM_AssetUnbundling_Header]
  where DateCaptured > '2025/06/30'
  order by AssetContractHeader_ID desc
