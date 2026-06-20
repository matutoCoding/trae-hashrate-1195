// 电池健康度等级
export type BatteryHealthLevel = 'A' | 'B' | 'C' | 'D';

// 批次状态
export type BatchStatus = 'in_stock' | 'in_use' | 'recalled' | 'expired';

// 召回状态
export type RecallStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

// 叫号状态
export type TicketStatus = 'waiting' | 'calling' | 'serving' | 'completed' | 'passed' | 'void';

// 电池流向动作
export type FlowAction = 'inbound' | 'outbound' | 'swap_in' | 'swap_out' | 'recall';

// 电池信息
export interface Battery {
  id: string;
  code: string;
  batchId: string;
  healthLevel: BatteryHealthLevel;
  capacity: number;
  cycleCount: number;
  manufactureDate: string;
  expireDate: string;
  currentOwnerId?: string;
  currentOwnerName?: string;
  currentStationId?: string;
  status: 'idle' | 'in_station' | 'in_car' | 'charging' | 'recalled';
}

// 电池批次
export interface BatteryBatch {
  id: string;
  batchNo: string;
  supplier: string;
  totalQuantity: number;
  availableQuantity: number;
  inUseQuantity: number;
  recalledQuantity: number;
  healthLevel: BatteryHealthLevel;
  manufactureDate: string;
  expireDate: string;
  inboundDate: string;
  inspector: string;
  remark?: string;
  status: BatchStatus;
  batteries?: Battery[];
}

// 流向记录
export interface FlowRecord {
  id: string;
  batteryId: string;
  batteryCode: string;
  batchId: string;
  batchNo: string;
  action: FlowAction;
  actionLabel: string;
  timestamp: string;
  operator: string;
  stationId?: string;
  stationName?: string;
  ownerId?: string;
  ownerName?: string;
  ownerPhone?: string;
  vehiclePlate?: string;
  remark?: string;
}

// 召回记录
export interface RecallRecord {
  id: string;
  recallNo: string;
  batchId: string;
  batchNo: string;
  reason: string;
  createdAt: string;
  createdBy: string;
  totalBatteries: number;
  completedCount: number;
  affectedOwners: number;
  status: RecallStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  batteries?: Battery[];
  affectedOwnerList?: AffectedOwner[];
}

// 受影响车主
export interface AffectedOwner {
  id: string;
  name: string;
  phone: string;
  vehiclePlate: string;
  batteryId: string;
  batteryCode: string;
  notified: boolean;
  contacted: boolean;
  replaced: boolean;
  replaceDate?: string;
}

// 排队取号
export interface QueueTicket {
  id: string;
  ticketNo: string;
  sequence: number;
  createdAt: string;
  calledAt?: string;
  completedAt?: string;
  status: TicketStatus;
  ownerName: string;
  ownerPhone: string;
  vehiclePlate: string;
  serviceType: 'swap' | 'charge' | 'check';
  serviceTypeLabel: string;
  passCount: number;
  estimatedWaitTime?: number;
  stationId: string;
  stationName: string;
}

// 换电站
export interface SwapStation {
  id: string;
  name: string;
  address: string;
  availableBatteries: number;
  totalBatteries: number;
  waitingCount: number;
}

// 工作台统计
export interface DashboardStats {
  todayInbound: number;
  todaySwap: number;
  todayRecall: number;
  activeRecalls: number;
  waitingQueue: number;
  totalBatteries: number;
  healthyRate: number;
  stationCount: number;
}
