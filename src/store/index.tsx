import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
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
  setSelectedStationId: (id: string) => void;
  callNextTicket: () => void;
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
    serviceType: 'swap' | 'charge' | 'check';
    ownerName: string;
    ownerPhone: string;
    vehiclePlate: string;
  }) => QueueTicket;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const mockVehiclePlates = [
  '京A·12345', '京B·66666', '京C·88888', '京D·11111', '京E·22222',
  '京F·33333', '京G·44444', '京H·55555', '京J·77777', '京K·99999',
];
const mockOwnerNames = ['钱伟', '孙浩', '周敏', '吴迪', '郑超', '冯磊', '韩雪', '朱琳', '何涛', '郭静'];
const mockOwnerPhones = [
  '13811112222', '13822223333', '13833334444', '13844445555', '13855556666',
  '13866667777', '13877778888', '13888889999', '13899990000', '13800001111',
];

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

  const setSelectedStationId = useCallback((id: string) => {
    setState(prev => ({ ...prev, selectedStationId: id }));
  }, []);

  const callNextTicket = useCallback(() => {
    setState(prev => {
      const tickets = [...prev.queueTickets];
      const currentCalling = tickets.find(t => t.status === 'calling');
      const waitingList = tickets
        .filter(t => t.status === 'waiting')
        .sort((a, b) => a.sequence - b.sequence);

      const updatedTickets = tickets.map(t => {
        if (currentCalling && t.id === currentCalling.id) {
          return { ...t, status: 'passed' as const, passCount: t.passCount + 1 };
        }
        return t;
      });

      if (waitingList.length > 0) {
        const nextIdx = updatedTickets.findIndex(t => t.id === waitingList[0].id);
        updatedTickets[nextIdx] = {
          ...updatedTickets[nextIdx],
          status: 'calling' as const,
          calledAt: new Date().toISOString(),
        };
      }

      return { ...prev, queueTickets: updatedTickets };
    });
  }, []);

  const handlePassTicket = useCallback((ticketId: string) => {
    setState(prev => {
      const tickets = [...prev.queueTickets];
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
      const tickets = [...prev.queueTickets];
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

    matchedBatteries.forEach((batt, index) => {
      const hasOwner = batt.status === 'in_car' && batt.currentOwnerName;
      if (hasOwner) {
        const statusLabelMap: Record<string, string> = {
          in_car: '已装车使用',
          in_station: '电站待换',
          charging: '充电中',
          recalled: '已召回',
          idle: '闲置',
        };
        result.push({
          id: `fo_${batt.id}`,
          name: batt.currentOwnerName || mockOwnerNames[index % mockOwnerNames.length],
          phone: mockOwnerPhones[index % mockOwnerPhones.length],
          vehiclePlate: mockVehiclePlates[index % mockVehiclePlates.length],
          batteryId: batt.id,
          batteryCode: batt.code,
          status: batt.status,
          statusLabel: statusLabelMap[batt.status] || batt.status,
          healthLevel: batt.healthLevel,
          capacity: batt.capacity,
        });
      }
    });

    return result;
  }, [searchBatteriesByBatchNo]);

  const addBatch = useCallback<AppContextType['addBatch']>((payload) => {
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
    const sampleCount = Math.min(payload.totalQuantity, 8);
    const newBatteries: Battery[] = [];
    const codeSuffix = payload.batchNo.slice(-4) || 'NEW';
    for (let i = 0; i < sampleCount; i++) {
      const capBase = healthCapMap[payload.healthLevel];
      newBatteries.push({
        id: `bat_${Date.now()}_${i}`,
        code: `BAT-${codeSuffix}-${String(1000 + i).padStart(4, '0')}`,
        batchId: newBatchId,
        healthLevel: payload.healthLevel,
        capacity: Math.max(70, capBase - i),
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

  const addTicket = useCallback<AppContextType['addTicket']>((payload) => {
    const station = state.stations.find(s => s.id === state.selectedStationId);
    const now = new Date();

    setState(prev => {
      const stationTickets = prev.queueTickets.filter(t => t.stationId === prev.selectedStationId);
      const maxSeq = stationTickets.length > 0
        ? Math.max(...stationTickets.map(t => t.sequence))
        : 0;

      const existingA = stationTickets.filter(t => t.ticketNo.startsWith('A')).length;
      const newNo = `A${String(existingA + 1).padStart(3, '0')}`;
      const waitingCount = stationTickets.filter(t => t.status === 'waiting').length;
      const estWait = waitingCount * 8;

      const serviceTypeLabelMap: Record<string, string> = {
        swap: '换电服务',
        charge: '充电服务',
        check: '电池检测',
      };

      const newTicket: QueueTicket = {
        id: `t_${Date.now()}`,
        ticketNo: newNo,
        sequence: maxSeq + 1,
        createdAt: now.toISOString().replace('T', ' ').slice(0, 19),
        status: 'waiting',
        ownerName: payload.ownerName,
        ownerPhone: payload.ownerPhone,
        vehiclePlate: payload.vehiclePlate,
        serviceType: payload.serviceType,
        serviceTypeLabel: serviceTypeLabelMap[payload.serviceType],
        passCount: 0,
        estimatedWaitTime: estWait,
        stationId: prev.selectedStationId,
        stationName: station?.name || '站点',
      };

      const newStats = { ...prev.dashboardStats };
      if (payload.serviceType === 'swap') {
        newStats.waitingQueue = prev.dashboardStats.waitingQueue + 1;
      }

      const newStations = prev.stations.map(s =>
        s.id === prev.selectedStationId
          ? { ...s, waitingCount: s.waitingCount + 1 }
          : s
      );

      return {
        ...prev,
        queueTickets: [newTicket, ...prev.queueTickets],
        dashboardStats: newStats,
        stations: newStations,
      };
    });

    const stationTickets = state.queueTickets.filter(t => t.stationId === state.selectedStationId);
    const existingA = stationTickets.filter(t => t.ticketNo.startsWith('A')).length;
    const waitingCount = stationTickets.filter(t => t.status === 'waiting').length;
    const serviceTypeLabelMap: Record<string, string> = {
      swap: '换电服务',
      charge: '充电服务',
      check: '电池检测',
    };
    return {
      id: `t_${Date.now()}`,
      ticketNo: `A${String(existingA + 1).padStart(3, '0')}`,
      sequence: stationTickets.length + 1,
      createdAt: now.toISOString().replace('T', ' ').slice(0, 19),
      status: 'waiting',
      ownerName: payload.ownerName,
      ownerPhone: payload.ownerPhone,
      vehiclePlate: payload.vehiclePlate,
      serviceType: payload.serviceType,
      serviceTypeLabel: serviceTypeLabelMap[payload.serviceType],
      passCount: 0,
      estimatedWaitTime: waitingCount * 8,
      stationId: state.selectedStationId,
      stationName: station?.name || '站点',
    };
  }, [state.selectedStationId, state.stations, state.queueTickets]);

  return (
    <AppContext.Provider
      value={{
        ...state,
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
