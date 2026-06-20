import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store';
import StatusTag from '@/components/StatusTag';
import {
  getTicketStatusLabel,
  getTicketStatusColor,
  maskPhone,
  formatDateTime,
} from '@/utils';
import styles from './index.module.scss';

const TicketDetailPage: React.FC = () => {
  const router = useRouter();
  const { queueTickets, handleRequeue, handlePassTicket, callNextTicket } = useAppStore();
  const id = router.params.id;

  const ticket = useMemo(() => queueTickets.find(t => t.id === id), [queueTickets, id]);

  if (!ticket) {
    return (
      <View className={styles.page}>
        <View style={{ textAlign: 'center', padding: 120, color: '#86909C' }}>取号记录不存在</View>
      </View>
    );
  }

  const statusColor = getTicketStatusColor(ticket.status);
  const voidWarn = 3 - ticket.passCount;

  const handlePassAction = () => {
    const willVoid = ticket.passCount + 1 >= 3;
    Taro.showModal({
      title: willVoid ? '确认作废该号码' : '确认过号重排',
      content: willVoid
        ? `车主连续过号${ticket.passCount}次，本次将自动作废，无法恢复。确认操作？`
        : `过号后号码自动重排队尾。剩余${voidWarn}次机会后将自动作废。`,
      confirmColor: willVoid ? '#F53F3F' : '#FF7D00',
      confirmText: willVoid ? '确认作废' : '确认过号',
      success: (res) => {
        if (res.confirm) {
          handlePassTicket(ticket.id);
          Taro.showToast({
            title: willVoid ? '已作废' : '已重排',
            icon: 'success',
          });
        }
      },
    });
  };

  const handleRequeueAction = () => {
    Taro.showModal({
      title: '重新排号',
      content: `确认将 ${ticket.ticketNo} 重新排入队尾？`,
      confirmColor: '#0FC6C2',
      success: (res) => {
        if (res.confirm) {
          handleRequeue(ticket.id);
          Taro.showToast({ title: '已重排入队', icon: 'success' });
        }
      },
    });
  };

  const handleComplete = () => {
    Taro.showToast({ title: '服务已完成', icon: 'success' });
    setTimeout(() => Taro.navigateBack(), 800);
  };

  const handleCancel = () => {
    Taro.showModal({
      title: '取消号码',
      content: `确认取消 ${ticket.ticketNo}？取消后不可恢复。`,
      confirmColor: '#F53F3F',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '已取消', icon: 'none' });
        }
      },
    });
  };

  const showRequeue = ticket.status === 'passed' && ticket.passCount < 3;
  const showPass = ticket.status === 'calling' || ticket.status === 'waiting';
  const showComplete = ticket.status === 'serving' || ticket.status === 'calling';

  const timeline = [
    {
      title: '取号成功',
      time: ticket.createdAt,
      desc: `${ticket.stationName} · 服务类型: ${ticket.serviceTypeLabel}`,
      status: 'done',
    },
    ...(ticket.calledAt ? [{
      title: `叫号${ticket.passCount > 0 ? ` (第${ticket.passCount}次)` : ''}`,
      time: ticket.calledAt,
      desc: ticket.passCount > 0 ? '车主未到，过号重排队尾' : '正在叫号中，请车主及时前往',
      status: ticket.status === 'calling' ? 'active' : (ticket.status === 'passed' || ticket.status === 'void' ? 'done' : 'pending'),
    }] : []),
    ...(ticket.status === 'serving' ? [{
      title: '开始服务',
      time: new Date().toISOString(),
      desc: '正在进行换电操作',
      status: 'active',
    }] : []),
    ...(ticket.status === 'completed' ? [{
      title: '服务完成',
      time: ticket.completedAt || ticket.createdAt,
      desc: `${ticket.serviceTypeLabel}服务已完成`,
      status: 'done',
    }] : []),
    ...(ticket.status === 'void' ? [{
      title: '号码作废',
      time: ticket.createdAt,
      desc: `连续过号${ticket.passCount}次，号码自动作废`,
      status: 'done',
    }] : []),
  ];

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.ticketCard}>
        <View className={styles.ticketHeader}>
          <View className={styles.ticketBadge}>
            <StatusTag
              text={getTicketStatusLabel(ticket.status)}
              color="#FFFFFF"
              bgColor="rgba(255,255,255,0.25)"
              showDot={false}
              size="sm"
            />
          </View>
          <Text className={styles.ticketNo}>{ticket.ticketNo}</Text>
          <Text className={styles.ticketSeq}>
            第 {ticket.sequence} 号 · {ticket.serviceTypeLabel}
          </Text>
        </View>
        <View className={styles.ticketBody}>
          <View className={styles.infoSection}>
            <Text className={styles.infoLabel}>车主姓名</Text>
            <Text className={styles.infoValue}>{ticket.ownerName}</Text>
          </View>
          <View className={styles.infoSection}>
            <Text className={styles.infoLabel}>联系电话</Text>
            <Text className={styles.infoValue}>{maskPhone(ticket.ownerPhone)}</Text>
          </View>
          <View className={styles.infoSection}>
            <Text className={styles.infoLabel}>车辆牌照</Text>
            <View className={styles.infoValue}>
              <Text className={styles.plateTag}>{ticket.vehiclePlate}</Text>
            </View>
          </View>
          <View className={styles.infoSection}>
            <Text className={styles.infoLabel}>所属站点</Text>
            <Text className={styles.infoValue}>{ticket.stationName}</Text>
          </View>
          <View className={styles.infoSection}>
            <Text className={styles.infoLabel}>取号时间</Text>
            <Text className={styles.infoValue}>{formatDateTime(ticket.createdAt)}</Text>
          </View>
          <View className={styles.infoSection}>
            <Text className={styles.infoLabel}>预计等待</Text>
            <Text className={styles.infoValue}>
              {ticket.estimatedWaitTime ? `${ticket.estimatedWaitTime}分钟` : '-'}
            </Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        {ticket.passCount > 0 && (
          <View className={styles.infoCard}>
            <View className={styles.passCount}>
              <View className={styles.passLeft}>
                <Text className={styles.passWarn}>⚠️</Text>
                <View>
                  <Text className={styles.passLabel}>
                    已过号 <Text style={{ color: '#FF7D00', fontWeight: 'bold' }}>{ticket.passCount}</Text> 次
                  </Text>
                </View>
              </View>
              <Text className={styles.passHint}>
                {3 - ticket.passCount > 0
                  ? `剩余${3 - ticket.passCount}次机会`
                  : '已达上限，号码作废'}
              </Text>
            </View>
          </View>
        )}

        <View className={styles.infoCard}>
          <Text className={styles.cardTitle}>
            <View className={styles.titleBar} />
            处理流程
          </Text>
          {timeline.map((t, idx) => (
            <View key={idx} className={styles.timelineItem}>
              <View
                className={classnames(
                  styles.timelineDot,
                  t.status === 'active' && styles.timelineActive,
                  t.status === 'done' && styles.timelineDone
                )}
              />
              <View className={styles.timelineContent}>
                <View className={styles.timelineHeader}>
                  <Text
                    className={classnames(
                      styles.timelineTitle,
                      t.status === 'active' && styles.timelineActive,
                      t.status === 'done' && styles.timelineDone
                    )}
                  >
                    {t.title}
                  </Text>
                  <Text className={styles.timelineTime}>
                    {t.time ? formatDateTime(t.time) : '-'}
                  </Text>
                </View>
                <Text className={styles.timelineDesc}>{t.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View className={styles.infoCard}>
          <Text className={styles.cardTitle}>
            <View className={styles.titleBar} />
            过号规则说明
          </Text>
          <View style={{ paddingLeft: 0, fontSize: 24, lineHeight: 1.8, color: '#86909C' }}>
            <View>1. 叫号后请在5分钟内前往办理，未到将自动过号</View>
            <View>2. 过号后号码自动排至队尾，需重新等待叫号</View>
            <View>3. 连续过号3次，号码自动作废，需重新取号</View>
            <View>4. 如无法按时到达，可主动点击「延后重排」</View>
          </View>
        </View>
      </View>

      <View className={styles.bottomBar}>
        {(ticket.status === 'void' || ticket.status === 'completed') && (
          <View className={`${styles.btn} ${styles.btnOutline}`} onClick={() => Taro.switchTab({ url: '/pages/queue/index' })}>
            返回队列
          </View>
        )}
        {showRequeue && (
          <View className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleRequeueAction}>
            重新排号
          </View>
        )}
        {showPass && (
          <View className={`${styles.btn} ${styles.btnWarning}`} onClick={handlePassAction}>
            过号重排
          </View>
        )}
        {showComplete && (
          <View className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleComplete}>
            完成服务
          </View>
        )}
        {ticket.status === 'waiting' && (
          <View className={`${styles.btn} ${styles.btnError}`} onClick={handleCancel}>
            取消号码
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default TicketDetailPage;
