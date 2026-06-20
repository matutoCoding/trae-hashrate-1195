import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store';
import QueueCard from '@/components/QueueCard';
import { TicketStatus } from '@/types';
import { getTicketStatusColor } from '@/utils';
import styles from './index.module.scss';

const statusFilters: Array<{ key: 'all' | TicketStatus; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'waiting', label: '等待' },
  { key: 'calling', label: '叫号' },
  { key: 'passed', label: '过号' },
  { key: 'completed', label: '完成' },
];

const QueuePage: React.FC = () => {
  const { queueTickets, stations, selectedStationId, setSelectedStationId, callNextTicket, handlePassTicket } = useAppStore();
  const [activeStatus, setActiveStatus] = useState<'all' | TicketStatus>('all');

  const currentStation = stations.find(s => s.id === selectedStationId);
  const stationTickets = useMemo(() => {
    return queueTickets.filter(t => t.stationId === selectedStationId);
  }, [queueTickets, selectedStationId]);

  const callingTicket = stationTickets.find(t => t.status === 'calling');
  const servingTicket = stationTickets.find(t => t.status === 'serving');
  const waitingCount = stationTickets.filter(t => t.status === 'waiting').length;
  const completedCount = stationTickets.filter(t => t.status === 'completed').length;

  const displayList = useMemo(() => {
    let list = stationTickets;
    if (activeStatus !== 'all') {
      list = list.filter(t => t.status === activeStatus);
    }
    const order: Record<string, number> = {
      calling: 0,
      serving: 1,
      waiting: 2,
      passed: 3,
      completed: 4,
      void: 5,
    };
    return [...list].sort((a, b) => {
      if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
      return a.sequence - b.sequence;
    });
  }, [stationTickets, activeStatus]);

  const handleNextCall = () => {
    callNextTicket();
    Taro.vibrateShort({ type: 'medium' });
  };

  const handleCurrentPass = () => {
    if (!callingTicket) return;
    const willVoid = callingTicket.passCount + 1 >= 3;
    Taro.showModal({
      title: willVoid ? '过号作废确认' : '过号重排确认',
      content: willVoid
        ? `车主已连续过号${callingTicket.passCount}次，本次过号后将自动作废，是否继续？`
        : `叫号中的 ${callingTicket.ticketNo} ${callingTicket.ownerName} 未到，过号后将重排队尾。`,
      confirmColor: willVoid ? '#F53F3F' : '#FF7D00',
      confirmText: willVoid ? '确认作废' : '确认过号',
      success: (res) => {
        if (res.confirm) {
          handlePassTicket(callingTicket.id);
          Taro.showToast({
            title: willVoid ? '已作废' : '已重排队尾',
            icon: 'none',
          });
          if (!willVoid) {
            setTimeout(() => callNextTicket(), 500);
          }
        }
      },
    });
  };

  const handleNewTicket = () => {
    Taro.showActionSheet({
      itemList: ['换电服务', '充电服务', '电池检测'],
      success: () => {
        Taro.showToast({ title: '取号成功', icon: 'success' });
      },
    });
  };

  const goTicketDetail = (id: string) => {
    Taro.navigateTo({ url: `/pages/ticket-detail/index?id=${id}` });
  };

  return (
    <ScrollView scrollY className={styles.page}>
      {callingTicket ? (
        <View className={styles.currentCall}>
          <View className={styles.callBadge}>📢 叫号中</View>
          <Text className={styles.callLabel}>当前叫号 · 请前往办理</Text>
          <Text className={styles.callTicketNo}>{callingTicket.ticketNo}</Text>
          <View className={styles.callInfo}>
            <View className={styles.callOwner}>
              <View className={styles.callAvatar}>{callingTicket.ownerName.charAt(0)}</View>
              <Text className={styles.callName}>{callingTicket.ownerName}</Text>
            </View>
            <Text className={styles.callPlate}>{callingTicket.vehiclePlate}</Text>
            <Text className={styles.callService}>{callingTicket.serviceTypeLabel}</Text>
          </View>
        </View>
      ) : (
        <View className={styles.currentCall} style={{ background: 'linear-gradient(135deg, #E8FBF9 0%, #FFFFFF 100%)', borderColor: 'rgba(15, 198, 194, 0.3)' }}>
          <Text className={styles.callLabel} style={{ color: '#0FC6C2' }}>队列状态 · 暂无叫号</Text>
          <Text className={styles.callTicketNo} style={{ color: '#0FC6C2', fontSize: 56 }}>
            {currentStation?.name}
          </Text>
          <Text className={styles.callInfo} style={{ fontSize: 24, color: '#86909C' }}>
            请点击下方「叫下一号」开始叫号服务
          </Text>
        </View>
      )}

      <View className={styles.statsRow}>
        <View className={styles.statBox}>
          <Text className={`${styles.statNum} ${styles.statNumWait}`}>{waitingCount}</Text>
          <Text className={styles.statDesc}>等待中</Text>
        </View>
        <View className={styles.statBox}>
          <Text className={`${styles.statNum} ${styles.statNumServing}`}>{servingTicket ? 1 : 0}</Text>
          <Text className={styles.statDesc}>服务中</Text>
        </View>
        <View className={styles.statBox}>
          <Text className={`${styles.statNum} ${styles.statNumDone}`}>{completedCount}</Text>
          <Text className={styles.statDesc}>已完成</Text>
        </View>
      </View>

      <ScrollView scrollX className={styles.stationSelector}>
        {stations.map(station => (
          <View
            key={station.id}
            className={classnames(
              styles.stationItem,
              selectedStationId === station.id && styles.stationActive
            )}
            onClick={() => setSelectedStationId(station.id)}
          >
            <Text className={styles.stationName}>{station.name.slice(0, 6)}</Text>
            <Text className={styles.stationAvailable}>
              电池{station.availableBatteries}/{station.totalBatteries} · 等{station.waitingCount}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View className={styles.sectionHeader}>
        <Text className={styles.sectionTitle}>
          <View className={styles.titleBar} />
          队列列表
        </Text>
        <View className={styles.statusChips}>
          {statusFilters.map(f => (
            <Text
              key={f.key}
              className={classnames(
                styles.chip,
                activeStatus === f.key && styles.chipActive
              )}
              style={activeStatus === f.key ? { background: f.key === 'all' ? '#165DFF' : getTicketStatusColor(f.key as TicketStatus) } : undefined}
              onClick={() => setActiveStatus(f.key)}
            >
              {f.label}
            </Text>
          ))}
        </View>
      </View>

      {displayList.length > 0 ? (
        displayList.map(ticket => (
          <QueueCard
            key={ticket.id}
            ticket={ticket}
            onClick={() => goTicketDetail(ticket.id)}
          />
        ))
      ) : (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>🎫</Text>
          <Text className={styles.emptyText}>暂无该状态的取号记录</Text>
        </View>
      )}

      <View className={styles.bottomBar}>
        <View className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleNextCall}>
          叫下一号
        </View>
        {callingTicket && (
          <View className={`${styles.btn} ${styles.btnWarning}`} onClick={handleCurrentPass}>
            当前车主未到
          </View>
        )}
        {!callingTicket && (
          <View className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleNewTicket} style={{ background: 'linear-gradient(135deg, #722ED1, #9E64FF)', boxShadow: '0 4rpx 16rpx rgba(114, 46, 209, 0.3)' }}>
            + 新车取号
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default QueuePage;
