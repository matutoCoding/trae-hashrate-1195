import { BatteryHealthLevel, BatchStatus, RecallStatus, TicketStatus, FlowAction } from '@/types';

export const getHealthLevelColor = (level: BatteryHealthLevel): string => {
  const colorMap: Record<BatteryHealthLevel, string> = {
    A: '#00B42A',
    B: '#0FC6C2',
    C: '#FF7D00',
    D: '#F53F3F',
  };
  return colorMap[level];
};

export const getHealthLevelLabel = (level: BatteryHealthLevel): string => {
  const labelMap: Record<BatteryHealthLevel, string> = {
    A: 'A级优秀',
    B: 'B级良好',
    C: 'C级一般',
    D: 'D级较差',
  };
  return labelMap[level];
};

export const getHealthLevelBgColor = (level: BatteryHealthLevel): string => {
  const colorMap: Record<BatteryHealthLevel, string> = {
    A: 'rgba(0, 180, 42, 0.1)',
    B: 'rgba(15, 198, 194, 0.1)',
    C: 'rgba(255, 125, 0, 0.1)',
    D: 'rgba(245, 63, 63, 0.1)',
  };
  return colorMap[level];
};

export const getBatchStatusLabel = (status: BatchStatus): string => {
  const labelMap: Record<BatchStatus, string> = {
    in_stock: '在库中',
    in_use: '使用中',
    recalled: '已召回',
    expired: '已过期',
  };
  return labelMap[status];
};

export const getBatchStatusColor = (status: BatchStatus): string => {
  const colorMap: Record<BatchStatus, string> = {
    in_stock: '#00B42A',
    in_use: '#165DFF',
    recalled: '#F53F3F',
    expired: '#86909C',
  };
  return colorMap[status];
};

export const getRecallStatusLabel = (status: RecallStatus): string => {
  const labelMap: Record<RecallStatus, string> = {
    pending: '待启动',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消',
  };
  return labelMap[status];
};

export const getRecallStatusColor = (status: RecallStatus): string => {
  const colorMap: Record<RecallStatus, string> = {
    pending: '#FF7D00',
    in_progress: '#165DFF',
    completed: '#00B42A',
    cancelled: '#86909C',
  };
  return colorMap[status];
};

export const getTicketStatusLabel = (status: TicketStatus): string => {
  const labelMap: Record<TicketStatus, string> = {
    waiting: '等待中',
    calling: '叫号中',
    serving: '服务中',
    completed: '已完成',
    passed: '已过号',
    void: '已作废',
  };
  return labelMap[status];
};

export const getTicketStatusColor = (status: TicketStatus): string => {
  const colorMap: Record<TicketStatus, string> = {
    waiting: '#165DFF',
    calling: '#FF7D00',
    serving: '#0FC6C2',
    completed: '#00B42A',
    passed: '#F7BA1E',
    void: '#F53F3F',
  };
  return colorMap[status];
};

export const getFlowActionLabel = (action: FlowAction): string => {
  const labelMap: Record<FlowAction, string> = {
    inbound: '入库',
    outbound: '出库',
    swap_in: '换入电站',
    swap_out: '换出装车',
    recall: '召回',
  };
  return labelMap[action];
};

export const getFlowActionColor = (action: FlowAction): string => {
  const colorMap: Record<FlowAction, string> = {
    inbound: '#00B42A',
    outbound: '#165DFF',
    swap_in: '#0FC6C2',
    swap_out: '#722ED1',
    recall: '#F53F3F',
  };
  return colorMap[action];
};

export const getPriorityLabel = (priority: string): string => {
  const labelMap: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急',
  };
  return labelMap[priority] || priority;
};

export const getPriorityColor = (priority: string): string => {
  const colorMap: Record<string, string> = {
    low: '#86909C',
    medium: '#165DFF',
    high: '#FF7D00',
    urgent: '#F53F3F',
  };
  return colorMap[priority] || '#86909C';
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${mi}`;
};

export const maskPhone = (phone: string): string => {
  if (phone.length !== 11) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(7);
};

export const getDaysUntilExpire = (expireDate: string): number => {
  const now = new Date();
  const expire = new Date(expireDate);
  const diff = expire.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};
