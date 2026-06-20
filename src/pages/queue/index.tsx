import React, { useState, useMemo } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store';
import QueueCard from '@/components/QueueCard';
import { ServiceType } from '@/types';
import styles from './index.module.scss';

const statusChips = [
  { key: 'all', label: '全部' },
  { key: 'waiting', label: '等待中' },
  { key: 'calling', label: '叫号中' },
  { key: 'serving', label: '服务中' },
  { key: 'passed', label: '过号' },
  { key: 'completed', label: '已完成' },
  { key: 'void', label: '作废' },
];

const serviceTypeList: Array<{ key: ServiceType; icon: string; name: string; desc: string }> = [
  { key: 'swap', icon: '🔋', name: '换电', desc: '约3-5分钟' },
  { key: 'charge', icon: '⚡', name: '快充', desc: '约20-30分钟' },
  { key: 'check', icon: '🔧', name: '检修', desc: '约15-30分钟' },
  { key: 'consult', icon: '💬', name: '咨询', desc: '约5-10分钟' },
];

const serviceTypeIconMap: Record<string, string> = {
  swap: '🔋 换电',
  charge: '⚡ 快充',
  check: '🔧 检修',
  consult: '💬 咨询',
};

const QueuePage: React.FC = () => {
  const {
    queueTickets,
    stations,
    selectedStationId,
    setSelectedStationId,
    currentCallingTicket,
    callNextTicket,
    addTicket,
  } = useAppStore();

  const [activeChip, setActiveChip] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    ownerName: '',
    phone: '',
    vehiclePlate: '',
    serviceType: 'swap' as ServiceType,
    remark: '',
  });

  const filteredTickets = useMemo(() => {
    return queueTickets
      .filter(t => t.stationId === selectedStationId)
      .filter(t => activeChip === 'all' || t.status === activeChip)
      .sort((a, b) => {
        if (a.status === 'calling' && b.status !== 'calling') return -1;
        if (b.status === 'calling' && a.status !== 'calling') return 1;
        if (a.status === 'serving' && b.status !== 'serving') return -1;
        if (b.status === 'serving' && a.status !== 'serving') return 1;
        return a.sequence - b.sequence;
      });
  }, [queueTickets, selectedStationId, activeChip]);

  const stats = useMemo(() => {
    const stationTickets = queueTickets.filter(t => t.stationId === selectedStationId);
    return {
      waiting: stationTickets.filter(t => t.status === 'waiting').length,
      serving: stationTickets.filter(t => t.status === 'serving' || t.status === 'calling').length,
      completed: stationTickets.filter(t => t.status === 'completed').length,
    };
  }, [queueTickets, selectedStationId]);

  const handleTicketClick = (id: string) => {
    Taro.navigateTo({ url: `/pages/ticket-detail/index?id=${id}` });
  };

  const handleNewTicket = () => {
    setForm({
      ownerName: '',
      phone: '',
      vehiclePlate: '',
      serviceType: 'swap',
      remark: '',
    });
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const validateAndSubmit = () => {
    if (!form.ownerName.trim()) {
      Taro.showToast({ title: '请输入车主姓名', icon: 'none' });
      return;
    }
    if (!form.phone.trim() || form.phone.length < 7) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }
    if (!form.vehiclePlate.trim()) {
      Taro.showToast({ title: '请输入车牌号', icon: 'none' });
      return;
    }

    const newTicket = addTicket({
      ownerName: form.ownerName.trim(),
      ownerPhone: form.phone.trim(),
      vehiclePlate: form.vehiclePlate.trim().toUpperCase(),
      serviceType: form.serviceType,
      remark: form.remark.trim() || undefined,
    });

    Taro.showToast({ title: `取号成功 ${newTicket.ticketNo}`, icon: 'success' });
    setShowModal(false);

    setTimeout(() => {
      Taro.navigateTo({ url: `/pages/ticket-detail/index?id=${newTicket.id}` });
    }, 700);
  };

  const handleCallNext = () => {
    const next = callNextTicket();
    if (next) {
      Taro.showToast({ title: `叫号 ${next.ticketNo} - ${next.ownerName}`, icon: 'none' });
    } else {
      Taro.showToast({ title: '暂无等待中的号码', icon: 'none' });
    }
  };

  const onChange = (key: keyof typeof form, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  return (
    <ScrollView scrollY className={styles.page}>
      {currentCallingTicket && (
        <View className={styles.currentCall}>
          <View className={styles.callBadge}>🔔 正在叫号</View>
          <Text className={styles.callLabel}>CURRENT CALLING</Text>
          <Text className={styles.callTicketNo}>{currentCallingTicket.ticketNo}</Text>
          <View className={styles.callInfo}>
            <View className={styles.callOwner}>
              <View className={styles.callAvatar}>
                {currentCallingTicket.ownerName.slice(0, 1)}
              </View>
              <Text className={styles.callName}>{currentCallingTicket.ownerName}</Text>
            </View>
            <Text className={styles.callPlate}>{currentCallingTicket.vehiclePlate}</Text>
            <Text className={styles.callService}>
              {serviceTypeIconMap[currentCallingTicket.serviceType] || currentCallingTicket.serviceTypeLabel}
            </Text>
            {currentCallingTicket.passCount > 0 && (
              <Text style={{
                fontSize: 22,
                color: '#FF7D00',
                padding: '4rpx 12rpx',
                background: 'rgba(255,125,0,0.15)',
                borderRadius: 8,
              }}>
                已过号{currentCallingTicket.passCount}次
              </Text>
            )}
          </View>
        </View>
      )}

      <View className={styles.statsRow}>
        <View className={styles.statBox}>
          <Text className={classnames(styles.statNum, styles.statNumWait)}>{stats.waiting}</Text>
          <Text className={styles.statDesc}>等待中</Text>
        </View>
        <View className={styles.statBox}>
          <Text className={classnames(styles.statNum, styles.statNumServing)}>{stats.serving}</Text>
          <Text className={styles.statDesc}>服务中</Text>
        </View>
        <View className={styles.statBox}>
          <Text className={classnames(styles.statNum, styles.statNumDone)}>{stats.completed}</Text>
          <Text className={styles.statDesc}>已完成</Text>
        </View>
      </View>

      <ScrollView scrollX className={styles.stationSelector}>
        {stations.map(st => (
          <View
            key={st.id}
            className={classnames(styles.stationItem, st.id === selectedStationId && styles.stationActive)}
            onClick={() => setSelectedStationId(st.id)}
          >
            <Text className={styles.stationName}>📍 {st.name}</Text>
            <Text className={styles.stationAvailable}>等待 {st.waitingCount} 人</Text>
          </View>
        ))}
      </ScrollView>

      <View className={styles.sectionHeader}>
        <Text className={styles.sectionTitle}>
          <View className={styles.titleBar} />
          队列列表
        </Text>
        <View className={styles.statusChips}>
          {statusChips.map(chip => (
            <View
              key={chip.key}
              className={classnames(styles.chip, activeChip === chip.key && styles.chipActive)}
              onClick={() => setActiveChip(chip.key)}
            >
              {chip.label}
            </View>
          ))}
        </View>
      </View>

      {filteredTickets.length > 0 ? (
        filteredTickets.map(ticket => (
          <View key={ticket.id} onClick={() => handleTicketClick(ticket.id)}>
            <QueueCard ticket={ticket} />
          </View>
        ))
      ) : (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>🎫</Text>
          <Text className={styles.emptyText}>当前状态暂无号码</Text>
        </View>
      )}

      <View className={styles.bottomBar}>
        <View className={classnames(styles.btn, styles.btnPrimary)} onClick={handleCallNext}>
          🔊 叫下一位
        </View>
        <View className={classnames(styles.btn, styles.btnWarning)} onClick={handleNewTicket}>
          ＋ 新车取号
        </View>
      </View>

      {showModal && (
        <View className={styles.modalMask} onClick={closeModal}>
          <ScrollView
            scrollY
            className={styles.modalSheet}
            onClick={(e) => e.stopPropagation()}
          >
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>新车取号登记</Text>
              <View className={styles.modalClose} onClick={closeModal}>×</View>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>
                <Text className={styles.requiredDot}>*</Text>服务类型
              </Text>
              <View className={styles.serviceOptions}>
                {serviceTypeList.map(svc => (
                  <View
                    key={svc.key}
                    className={classnames(
                      styles.serviceOption,
                      form.serviceType === svc.key && styles.serviceOptionActive
                    )}
                    onClick={() => onChange('serviceType', svc.key)}
                  >
                    <Text className={styles.serviceIcon}>{svc.icon}</Text>
                    <Text className={styles.serviceName}>{svc.name}</Text>
                    <Text className={styles.serviceDesc}>{svc.desc}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>
                <Text className={styles.requiredDot}>*</Text>车主姓名
              </Text>
              <Input
                className={classnames(styles.formInput, styles.formInputFocused)}
                placeholder="请输入车主姓名"
                placeholderClass="ph"
                value={form.ownerName}
                onInput={(e) => onChange('ownerName', e.detail.value)}
              />
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>
                <Text className={styles.requiredDot}>*</Text>联系电话
              </Text>
              <Input
                className={classnames(styles.formInput, styles.formInputFocused)}
                type="number"
                placeholder="请输入手机号"
                placeholderClass="ph"
                value={form.phone}
                onInput={(e) => onChange('phone', e.detail.value)}
              />
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>
                <Text className={styles.requiredDot}>*</Text>车牌号
              </Text>
              <Input
                className={classnames(styles.formInput, styles.formInputFocused)}
                placeholder="如：京AD88888"
                placeholderClass="ph"
                value={form.vehiclePlate}
                onInput={(e) => onChange('vehiclePlate', e.detail.value)}
              />
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>备注（选填）</Text>
              <Input
                className={classnames(styles.formInput, styles.formInputFocused)}
                placeholder="如：加急、车辆问题简述"
                placeholderClass="ph"
                value={form.remark}
                onInput={(e) => onChange('remark', e.detail.value)}
              />
            </View>

            <View className={styles.formActions}>
              <View className={styles.btnCancel} onClick={closeModal}>取消</View>
              <View className={styles.btnSubmit} onClick={validateAndSubmit}>确认取号</View>
            </View>
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
};

export default QueuePage;
