SELECT cdi.*
  FROM [EMS_Mnquma].[dbo].[SCM_ContractDetailItems] cdi
inner join SCM_AssetUnbundling_Header auh on cdi.ContractID = auh.ContractID
  where auh.DateCaptured > '2025/06/30'
