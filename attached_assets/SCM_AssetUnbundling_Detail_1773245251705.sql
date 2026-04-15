  select aud.* from SCM_AssetUnbundling_Header auh
  inner join [EMS_Mnquma].[dbo].[SCM_ContractDetailItems] cdi on auh.ContractID = cdi.ContractID
  inner join [EMS_Mnquma].[dbo].[SCM_AssetUnbundling_Detail] aud on cdi.ContractDetailItems_ID = aud.ContractDetailItemId
  where auh.DateCaptured > '2025/06/30'