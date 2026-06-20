import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { mockBatches, mockBatteries, mockFlowRecords } from '@/data/batch';
import { mockRecalls, mockAffectedOwners } from '@/data/recall';
import { mockQueueTickets, mockStations, mockDashboardStats } from '@/data/queue';
import type { BatteryBatch, Battery, FlowRecord, RecallRecord, AffectedOwner, QueueTicket, SwapStation, DashboardStats } from '@/types';

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
        passCount: 0,
      };

      return { ...prev, queueTickets: tickets };
    });
  }, []);

  const searchBatteriesByBatchNo = useCallback((batchNo: string) => {
    const batch = state.batches.find(b => b.batchNo.includes(batchNo));
    if (!batch) return [];
    return state.batteries.filter(b => b.batchId === batch.id);
  }, [state.batches, state.batteries]);

  const searchOwnersByBatchNo = useCallback((batchNo: string) => {
    const batch = state.batches.find(b => b.batchNo.includes(batchNo));
    if (!batch) return [];
    const batchBatteryIds = state.batteries.filter(b => b.batchId === batch.id).map(b => b.id);
    return state.affectedOwners.filter(o => batchBatteryIds.includes(o.batteryId));
  }, [state.batches, state.batteries, state.affectedOwners]);

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
