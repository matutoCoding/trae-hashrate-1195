import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { mockBatches, mockBatteries, mockFlowRecords } from '@/data/batch';
import { mockRecalls, mockAffectedOwners } from '@/data/recall';
import { mockQueueTickets, mockStations, mockDashboardStats } from '@/data/queue';
import type { BatteryBatch, Battery, FlowRecord, RecallRecord, AffectedOwner, QueueTicket, SwapStation, DashboardStats, BatteryHealthLevel } from '@/types';

export interface FlowOwnerInfo {
  id: string;
  name: string;
  phone: string;
  vehiclePlate: string;
  batteryId: string;
  batteryCode: string;
  status: 'in_car' | 'in_station' | 'charging' | 'recalled' | 'idle';
  statusLabel: string;
  healthLevel: BatteryHealthLevel;
  capacity: number;
}

interface AppState {
  batches: BatteryBatch[];
  batteries: Battery[];
  flowRecords: FlowRecord[];
  recalls: RecallRecord[];
  affectedOwners: AffectedOwner[];
  queueTickets: QueueTicket[];
  stations: SwapStation[];
  dashboardStats: DashboardStats;
  selectedStationId: string;
}

interface AppContextType extends AppState {
  currentCallingTicket: QueueTicket | null;
  setSelectedStationId: (id: string) => void;
  callNextTicket: () => QueueTicket | null;
  handlePassTicket: (ticketId: string) => void;
  handleRequeue: (ticketId: string) => void;
  searchBatteriesByBatchNo: (batchNo: string) => Battery[];
  searchOwnersByBatchNo: (batchNo: string) => AffectedOwner[];
  searchFlowOwnersByBatchNo: (batchNo: string) => FlowOwnerInfo[];
  addBatch: (payload: {
    batchNo: string;
    supplier: string;
    manufactureDate: string;
    expireDate: string;
    inspector: string;
    healthLevel: BatteryHealthLevel;
    totalQuantity: number;
    remark?: string;
  }) => BatteryBatch;
  addTicket: (payload: {
    ownerName: string;
    ownerPhone: string;
    vehiclePlate: string;
    serviceType: 'swap' | 'charge' | 'check' | 'consult';
    remark?: string;
  }) => QueueTicket;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    batches: mockBatches,
    batteries: mockBatteries,
    flowRecords: mockFlowRecords,
    recalls: mockRecalls,
    affectedOwners: mockAffectedOwners,
    queueTickets: mockQueueTickets,
    stations: mockStations,
    dashboardStats: mockDashboardStats,
    selectedStationId: 'st001',
  });

  const currentCallingTicket = useMemo(() => {
    return state.queueTickets.find(
      t => t.status === 'calling' && t.stationId === state.selectedStationId
    ) || null;
  }, [state.queueTickets, state.selectedStationId]);

  const setSelectedStationId = useCallback((id: string) => {
    setState(prev => ({ ...prev, selectedStationId: id }));
  }, []);

  const callNextTicket = useCallback((): QueueTicket | null => {
    let result: QueueTicket | null = null;

    setState(prev => {
      const tickets = prev.queueTickets.map(t => ({ ...t }));

      const currentCalling = tickets.find(
        t => t.status === 'calling' && t.stationId === prev.selectedStationId
      );

      if (currentCalling) {
        const idx = tickets.findIndex(t => t.id === currentCalling.id);
        const newPassCount = tickets[idx].passCount + 1;
        if (newPassCount >= 3) {
          tickets[idx] = { ...tickets[idx], status: 'void', passCount: newPassCount };
        } else {
          const maxSequence = Math.max(...tickets.map(t => t.sequence));
          tickets[idx] = {
            ...tickets[idx],
            status: 'waiting',
            passCount: newPassCount,
            sequence: maxSequence + 1,
          };
        }
      }

      const waitingList = tickets
        .filter(t => t.status === 'waiting' && t.stationId === prev.selectedStationId)
        .sort((a, b) => a.sequence - b.sequence);

      if (waitingList.length > 0) {
        const nextIdx = tickets.findIndex(t => t.id === waitingList[0].id);
        tickets[nextIdx] = {
          ...tickets[nextIdx],
          status: 'calling',
          calledAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        };
        result = tickets[nextIdx];
      }

      return { ...prev, queueTickets: tickets };
    });

    return result;
  }, []);

  const handlePassTicket = useCallback((ticketId: string) => {
    setState(prev => {
      const tickets = prev.queueTickets.map(t => ({ ...t }));
      const idx = tickets.findIndex(t => t.id === ticketId);
      if (idx === -1) return prev;

      const ticket = tickets[idx];
      const newPassCount = ticket.passCount + 1;
      const isVoid = newPassCount >= 3;

      if (isVoid) {
        tickets[idx] = { ...ticket, status: 'void', passCount: newPassCount };
      } else {
        const maxSequence = Math.max(...tickets.map(t => t.sequence));
        tickets[idx] = {
          ...ticket,
          status: 'waiting',
          passCount: newPassCount,
          sequence: maxSequence + 1,
        };
      }

      return { ...prev, queueTickets: tickets };
    });
  }, []);

  const handleRequeue = useCallback((ticketId: string) => {
    setState(prev => {
      const tickets = prev.queueTickets.map(t => ({ ...t }));
      const idx = tickets.findIndex(t => t.id === ticketId);
      if (idx === -1) return prev;

      const maxSequence = Math.max(...tickets.map(t => t.sequence));
      tickets[idx] = {
        ...tickets[idx],
        status: 'waiting',
        sequence: maxSequence + 1,
        passCount: tickets[idx].passCount,
      };

      return { ...prev, queueTickets: tickets };
    });
  }, []);

  const searchBatteriesByBatchNo = useCallback((batchNo: string) => {
    const keyword = batchNo.toLowerCase();
    const matched = state.batches.filter(b => b.batchNo.toLowerCase().includes(keyword));
    if (matched.length === 0) return [];
    const batchIds = matched.map(b => b.id);
    return state.batteries.filter(b => batchIds.includes(b.batchId));
  }, [state.batches, state.batteries]);

  const searchOwnersByBatchNo = useCallback((batchNo: string) => {
    const keyword = batchNo.toLowerCase();
    const matched = state.batches.filter(b => b.batchNo.toLowerCase().includes(keyword));
    if (matched.length === 0) return [];
    const batchIds = matched.map(b => b.id);
    const batchBatteryIds = state.batteries.filter(b => batchIds.includes(b.batchId)).map(b => b.id);
    return state.affectedOwners.filter(o => batchBatteryIds.includes(o.batteryId));
  }, [state.batches, state.batteries, state.affectedOwners]);

  const searchFlowOwnersByBatchNo = useCallback((batchNo: string): FlowOwnerInfo[] => {
    const matchedBatteries = searchBatteriesByBatchNo(batchNo);
    const result: FlowOwnerInfo[] = [];

    const statusLabelMap: Record<string, string> = {
      in_car: '已装车使用',
      in_station: '电站待换',
      charging: '充电中',
      recalled: '已召回',
      idle: '闲置',
    };

    matchedBatteries.forEach(batt => {
      if (batt.status !== 'in_car') return;

      const swapOutFlow = state.flowRecords
        .filter(f => f.batteryId === batt.id && f.action === 'swap_out')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

      const ownerName = swapOutFlow?.ownerName || batt.currentOwnerName || '';
      if (!ownerName) return;

      result.push({
        id: `fo_${batt.id}`,
        name: ownerName,
        phone: swapOutFlow?.ownerPhone || '',
        vehiclePlate: swapOutFlow?.vehiclePlate || '',
        batteryId: batt.id,
        batteryCode: batt.code,
        status: batt.status,
        statusLabel: statusLabelMap[batt.status] || batt.status,
        healthLevel: batt.healthLevel,
        capacity: batt.capacity,
      });
    });

    return result;
  }, [searchBatteriesByBatchNo, state.flowRecords]);

  const addBatch = useCallback((payload: {
    batchNo: string;
    supplier: string;
    manufactureDate: string;
    expireDate: string;
    inspector: string;
    healthLevel: BatteryHealthLevel;
    totalQuantity: number;
    remark?: string;
  }): BatteryBatch => {
    const now = new Date();
    const newBatchId = `batch_${Date.now()}`;
    const todayStr = now.toISOString().slice(0, 10);

    const newBatch: BatteryBatch = {
      id: newBatchId,
      batchNo: payload.batchNo,
      supplier: payload.supplier,
      totalQuantity: payload.totalQuantity,
      availableQuantity: payload.totalQuantity,
      inUseQuantity: 0,
      recalledQuantity: 0,
      healthLevel: payload.healthLevel,
      manufactureDate: payload.manufactureDate,
      expireDate: payload.expireDate,
      inboundDate: todayStr,
      inspector: payload.inspector,
      remark: payload.remark,
      status: 'in_stock',
      batteries: [],
    };

    const healthCapMap: Record<BatteryHealthLevel, number> = { A: 98, B: 93, C: 85, D: 70 };
    const newBatteries: Battery[] = [];
    const codeSuffix = payload.batchNo.slice(-4) || 'NEW';
    const count = payload.totalQuantity;
    for (let i = 0; i < count; i++) {
      const capBase = healthCapMap[payload.healthLevel];
      newBatteries.push({
        id: `bat_${Date.now()}_${i}`,
        code: `BAT-${codeSuffix}-${String(1000 + i).padStart(4, '0')}`,
        batchId: newBatchId,
        healthLevel: payload.healthLevel,
        capacity: Math.max(70, capBase - Math.floor(i / 10)),
        cycleCount: Math.floor(Math.random() * 10),
        manufactureDate: payload.manufactureDate,
        expireDate: payload.expireDate,
        status: 'in_station',
        currentStationId: state.selectedStationId,
      });
    }

    const firstBattery = newBatteries[0];
    const newFlow: FlowRecord = {
      id: `flow_${Date.now()}`,
      batteryId: firstBattery?.id || '',
      batteryCode: firstBattery?.code || '',
      batchId: newBatchId,
      batchNo: payload.batchNo,
      action: 'inbound',
      actionLabel: '入库',
      timestamp: now.toISOString().replace('T', ' ').slice(0, 19),
      operator: payload.inspector,
      stationName: '中央仓',
      remark: payload.remark,
    };

    setState(prev => ({
      ...prev,
      batches: [newBatch, ...prev.batches],
      batteries: [...newBatteries, ...prev.batteries],
      flowRecords: [newFlow, ...prev.flowRecords],
      dashboardStats: {
        ...prev.dashboardStats,
        todayInbound: prev.dashboardStats.todayInbound + payload.totalQuantity,
        totalBatteries: prev.dashboardStats.totalBatteries + payload.totalQuantity,
      },
    }));

    return newBatch;
  }, [state.selectedStationId]);

  const addTicket = useCallback((payload: {
    ownerName: string;
    ownerPhone: string;
    vehiclePlate: string;
    serviceType: 'swap' | 'charge' | 'check' | 'consult';
    remark?: string;
  }): QueueTicket => {
    let result: QueueTicket | null = null;

    setState(prev => {
      const station = prev.stations.find(s => s.id === prev.selectedStationId);
      const stationTickets = prev.queueTickets.filter(t => t.stationId === prev.selectedStationId);
      const maxSeq = stationTickets.length > 0
        ? Math.max(...stationTickets.map(t => t.sequence))
        : 0;
      const existingA = stationTickets.filter(t => t.ticketNo.startsWith('A')).length;
      const newNo = `A${String(existingA + 1).padStart(3, '0')}`;
      const waitingCount = stationTickets.filter(t => t.status === 'waiting').length;

      const serviceTypeLabelMap: Record<string, string> = {
        swap: '换电服务',
        charge: '充电服务',
        check: '电池检测',
        consult: '业务咨询',
      };

      const newTicket: QueueTicket = {
        id: `t_${Date.now()}`,
        ticketNo: newNo,
        sequence: maxSeq + 1,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        status: 'waiting',
        ownerName: payload.ownerName,
        ownerPhone: payload.ownerPhone,
        vehiclePlate: payload.vehiclePlate,
        serviceType: payload.serviceType,
        serviceTypeLabel: serviceTypeLabelMap[payload.serviceType] || payload.serviceType,
        passCount: 0,
        estimatedWaitTime: waitingCount * 8,
        stationId: prev.selectedStationId,
        stationName: station?.name || '站点',
      };

      result = newTicket;

      const newStations = prev.stations.map(s =>
        s.id === prev.selectedStationId
          ? { ...s, waitingCount: s.waitingCount + 1 }
          : s
      );

      return {
        ...prev,
        queueTickets: [newTicket, ...prev.queueTickets],
        dashboardStats: {
          ...prev.dashboardStats,
          waitingQueue: prev.dashboardStats.waitingQueue + 1,
        },
        stations: newStations,
      };
    });

    return result!;
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        currentCallingTicket,
        setSelectedStationId,
        callNextTicket,
        handlePassTicket,
        handleRequeue,
        searchBatteriesByBatchNo,
        searchOwnersByBatchNo,
        searchFlowOwnersByBatchNo,
        addBatch,
        addTicket,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used within AppProvider');
  return ctx;
};
