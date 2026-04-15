SELECT cd.*
  FROM [EMS_Mnquma].[dbo].[SCM_ContractDetails] cd
  inner join SCM_AssetUnbundling_Header auh on cd.Contract_ID = auh.ContractID
  where auh.DateCaptured > '2025/06/30'
