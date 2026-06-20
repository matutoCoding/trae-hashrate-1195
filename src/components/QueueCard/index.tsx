import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import StatusTag from '@/components/StatusTag';
import { QueueTicket } from '@/types';
import {
  getTicketStatusLabel,
  getTicketStatusColor,
  maskPhone,
  formatDateTime,
} from '@/utils';

interface QueueCardProps {
  ticket: QueueTicket;
  onClick?: () => void;
}

const QueueCard: React.FC<QueueCardProps> = ({ ticket, onClick }) => {
  const statusMap: Record<string, string> = {
    calling: 'cardCalling',
    serving: 'cardServing',
    passed: 'cardPassed',
    void: 'cardVoid',
  };
  const badgeMap: Record<string, string> = {
    calling: 'badgeCalling',
    serving: 'badgeServing',
  };
  const badgeTextMap: Record<string, string> = {
    calling: '叫号中',
    serving: '服务中',
  };

  return (
    <View
      className={classnames(styles.queueCard, statusMap[ticket.status])}
      onClick={onClick}
    >
      <View className={styles.cardHeader}>
        <View className={styles.ticketNoWrap}>
          <Text className={styles.ticketNo}>{ticket.ticketNo}</Text>
          <Text className={styles.sequence}>第{ticket.sequence}号</Text>
        </View>
        {badgeTextMap[ticket.status] ? (
          <View className={classnames(styles.ticketBadge, badgeMap[ticket.status])}>
            {badgeTextMap[ticket.status]}
          </View>
        ) : (
          <StatusTag
            text={getTicketStatusLabel(ticket.status)}
            color={getTicketStatusColor(ticket.status)}
            size="sm"
          />
        )}
      </View>

      <View className={styles.ownerSection}>
        <View className={styles.avatar}>
          {ticket.ownerName.charAt(0)}
        </View>
        <View className={styles.ownerInfo}>
          <Text className={styles.ownerName}>
            {ticket.ownerName}
            <Text style={{ fontSize: 22, color: '#86909C', marginLeft: 12, fontWeight: 'normal' }}>
              {maskPhone(ticket.ownerPhone)}
            </Text>
          </Text>
          <Text className={styles.plateNo}>{ticket.vehiclePlate}</Text>
        </View>
        {ticket.status === 'waiting' && ticket.estimatedWaitTime !== undefined && (
          <View className={styles.waitTime}>
            <Text className={styles.waitTimeNum}>{ticket.estimatedWaitTime}</Text>
            <Text className={styles.waitTimeLabel}>分钟</Text>
          </View>
        )}
      </View>

      <View className={styles.cardFooter}>
        <View className={styles.serviceInfo}>
          <View className={styles.serviceTag}>{ticket.serviceTypeLabel}</View>
          <Text className={styles.timeText}>
            取号: {formatDateTime(ticket.createdAt)}
          </Text>
        </View>
        {ticket.passCount > 0 && (
          <View className={styles.passBadge}>
            过号{ticket.passCount}次{ticket.passCount >= 3 ? '/已作废' : ''}
          </View>
        )}
      </View>
    </View>
  );
};

export default QueueCard;
