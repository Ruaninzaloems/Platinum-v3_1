export const CIDMS_LEVEL_CONFIG = [
  { idKey: 'assetAccountGroupID',          descKey: 'assetAccountGroupDesc',          parentKey: null as string | null, label: 'Accounting Group',     childLabel: 'Accounting Sub-Group', childLabelPlural: 'Accounting Sub-Groups', color: '#7c3aed', bg: '#f5f3ff' },
  { idKey: 'assetAccountSubGroupID',        descKey: 'assetAccountSubGroupDesc',       parentKey: 'assetAccountGroupID',       label: 'Accounting Sub-Group', childLabel: 'Class',               childLabelPlural: 'Classes',              color: '#2563eb', bg: '#eff6ff' },
  { idKey: 'assetCIDMSClassID',             descKey: 'assetCIDMSClassDesc',            parentKey: 'assetAccountSubGroupID',    label: 'Class',               childLabel: 'Group Type',          childLabelPlural: 'Group Types',          color: '#0891b2', bg: '#ecfeff' },
  { idKey: 'assetCIDMSGroupTypeID',         descKey: 'assetCIDMSGroupTypeDesc',        parentKey: 'assetCIDMSClassID',         label: 'Group Type',          childLabel: 'Asset Type',          childLabelPlural: 'Asset Types',          color: '#059669', bg: '#f0fdf4' },
  { idKey: 'assetCIDMSAssetTypeID',         descKey: 'assetCIDMSAssetTypeDesc',        parentKey: 'assetCIDMSGroupTypeID',     label: 'Asset Type',          childLabel: 'Component Type',      childLabelPlural: 'Component Types',      color: '#d97706', bg: '#fffbeb' },
  { idKey: 'assetCIDMSComponentTypeID',     descKey: 'assetCIDMSComponentTypeDesc',    parentKey: 'assetCIDMSAssetTypeID',     label: 'Component Type',      childLabel: 'Sub-Component Type',  childLabelPlural: 'Sub-Component Types',  color: '#dc2626', bg: '#fff1f2' },
  { idKey: 'assetCIDMSSubComponentTypeID',  descKey: 'assetCIDMSSubComponentTypeDesc', parentKey: 'assetCIDMSComponentTypeID', label: 'Sub-Component Type',  childLabel: '',                    childLabelPlural: '',                     color: '#64748b', bg: '#f8fafc' },
];

export interface CidmsChainResult {
  cidmsAccountingGroupId: number | null;
  cidmsAccountingGroupDesc: string;
  cidmsAccountingSubGroupId: number | null;
  cidmsAccountingSubGroupDesc: string;
  cidmsClassId: number | null;
  cidmsClassDesc: string;
  cidmsGroupTypeId: number | null;
  cidmsGroupTypeDesc: string;
  cidmsAssetTypeId: number | null;
  cidmsAssetTypeDesc: string;
  cidmsComponentTypeId: number | null;
  cidmsComponentTypeDesc: string;
  cidmsSubComponentTypeId: number | null;
  cidmsSubComponentTypeDesc: string;
  selectedLevelIdx: number;
}
