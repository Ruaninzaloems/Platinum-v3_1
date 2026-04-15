import { Money, Attachment } from './shared.model';

export interface StockItem {
  id: string;
  itemCode: string;
  description: string;
  category: string;
  subcategory?: string;
  unspscCode?: string;
  unitOfMeasure: string;
  currentStock: number;
  minimumLevel: number;
  reorderLevel: number;
  reorderQuantity: number;
  maximumLevel: number;
  averageCost: Money;
  lastPurchasePrice: Money;
  totalStockValue: Money;
  warehouse: string;
  binLocation?: string;
  isActive: boolean;
  leadTimeDays: number;
  lastReceivedDate?: string;
  lastIssuedDate?: string;
  lastCountDate?: string;
  abcClassification: 'A' | 'B' | 'C';
  movementType: 'fast' | 'medium' | 'slow' | 'non-moving';
}

export interface StockMovement {
  id: string;
  movementNumber: string;
  itemRef: string;
  itemCode: string;
  itemDescription: string;
  movementType: 'receipt' | 'issue' | 'transfer' | 'adjustment' | 'return' | 'write_off';
  quantity: number;
  unitCost: Money;
  totalValue: Money;
  fromLocation?: string;
  toLocation?: string;
  referenceType?: string;
  referenceNumber?: string;
  reason?: string;
  performedBy: { id: string; name: string; };
  performedAt: string;
  approvedBy?: { id: string; name: string; };
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string;
  manager: { id: string; name: string; };
  isActive: boolean;
  totalItems: number;
  totalValue: Money;
}

export interface StockCount {
  id: string;
  countNumber: string;
  warehouse: string;
  countDate: string;
  status: 'planned' | 'in_progress' | 'completed' | 'approved';
  countType: 'full' | 'cycle' | 'spot';
  totalItems: number;
  countedItems: number;
  varianceItems: number;
  varianceValue: Money;
  conductedBy: { id: string; name: string; };
  approvedBy?: { id: string; name: string; };
}

export interface InventoryDonation {
  donationId: number;
  donationDate?: string;
  donationFullName?: string;
  commodityId?: number;
  quantity?: number;
  unitCost?: number;
  totalValue?: number;
  storeId?: number;
  isApproved?: boolean;
  statusId?: number;
  finYear?: string;
  enabled?: boolean;
  dateCaptured?: string;
  capturerId?: number;
  notes?: string;
}

export interface InventoryDisposal {
  disposalId: number;
  disposalTypeId?: number;
  disposalCategoryId?: number;
  disposalDate?: string;
  finYear?: string;
  storeId?: number;
  receiverName?: string;
  reference?: string;
  notes?: string;
  statusId?: number;
  enabled?: boolean;
  dateCaptured?: string;
  capturerId?: number;
  approverId?: number;
  dateApproved?: string;
  rejectedReason?: string;
  lineItems?: InventoryDisposalLineItem[];
}

export interface InventoryDisposalLineItem {
  disposalLineItemId: number;
  disposalId?: number;
  storeId?: number;
  commodityId?: number;
  quantityToDispose?: number;
  salesUnitPrice?: number;
  statusId?: number;
  unitCost?: number;
  disposalValue?: number;
  binLocation?: string;
  enabled?: boolean;
}

export interface InventoryCorrection {
  inventoryCorrectionId: number;
  correctRefNumber?: string;
  commodityId?: number;
  correctionType?: string;
  quantity?: number;
  unitCost?: number;
  totalCost?: number;
  commodityDr?: string;
  commodityCr?: string;
  storeId?: number;
  statusId?: number;
  finYear?: string;
  enabled?: boolean;
  dateCaptured?: string;
  capturerId?: number;
  reason?: string;
}

export interface InventoryValuation {
  valuationId: number;
  inventoryId?: number;
  commodityId?: number;
  storeId?: number;
  finYear?: string;
  valuationMethodId?: number;
  quantity?: number;
  unitCost?: number;
  valuatedCost?: number;
  statusId?: number;
  enabled?: boolean;
  dateCaptured?: string;
  capturerId?: number;
  approverId?: number;
  dateApproved?: string;
  rejectedReason?: string;
}

export interface InventoryTransferItem {
  transferId: number;
  transferNumber?: string;
  fromStoreId?: number;
  toStoreId?: number;
  requestedBy?: number;
  requestedDate?: string;
  statusId?: number;
  comments?: string;
  finYear?: string;
  enabled?: boolean;
  lineItems?: any[];
}

export interface ClosurePeriod {
  monthEndExceptionId: number;
  storeId?: number;
  finYear?: string;
  period?: number;
  closureDate?: string;
  closedBy?: number;
  statusId?: number;
  exceptionType?: string;
  exceptionDescription?: string;
  enabled?: boolean;
  dateCaptured?: string;
  capturerId?: number;
}

export interface StoreCommodityLink {
  inventoryId: number;
  commodityId?: number;
  storeId?: number;
  binLocationId?: number;
  quantityOnHand?: number;
  averageCost?: number;
  totalValue?: number;
  enabled?: boolean;
}

export interface ProcurementPipelineItem {
  id: number;
  stage: string;
  referenceNumber?: string;
  description?: string;
  vendor?: string;
  value?: number;
  status?: string;
  dateCreated?: string;
  lastUpdated?: string;
}

export interface InventoryDashboard {
  totalItems: number;
  totalValue: number;
  lowStock: number;
  reorderRequired: number;
  categories: any[];
}

export interface InventoryRequisitionItem {
  invRequisitionId: number;
  storeId?: number;
  requisitionDate?: string;
  isApproved?: boolean;
  finYear?: string;
  requestedById?: number;
  invRequisitionNumber?: string;
  statusId?: number;
  enabled?: boolean;
  lineItems?: any[];
}

export interface HighValueAsset {
  inventoryHighValueId: number;
  commodityId?: number;
  storeId?: number;
  assetTag?: string;
  serialNumber?: string;
  description?: string;
  unitCost?: number;
  statusId?: number;
  finYear?: string;
  enabled?: boolean;
}
