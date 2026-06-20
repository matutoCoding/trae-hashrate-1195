import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import StatusTag from '@/components/StatusTag';
import { RecallRecord } from '@/types';
import {
  getRecallStatusLabel,
  getRecallStatusColor,
  getPriorityLabel,
  getPriorityColor,
  formatDateTime,
} from '@/utils';

interface RecallCardProps {
  recall: RecallRecord;
  onClick?: () => void;
}

const RecallCard: React.FC<RecallCardProps> = ({ recall, onClick }) => {
  const progress = recall.totalBatteries > 0
    ? Math.round((recall.completedCount / recall.totalBatteries) * 100)
    : 0;

  return (
    <View className={styles.recallCard} onClick={onClick}>
      <View className={styles.cardHeader}>
        <View className={styles.headerLeft}>
          <Text className={styles.recallNo}>{recall.recallNo}</Text>
          <Text className={styles.batchRef}>批次: {recall.batchNo}</Text>
        </View>
        <View className={styles.priorityWrap}>
          <StatusTag
            text={getPriorityLabel(recall.priority)}
            color={getPriorityColor(recall.priority)}
            size="sm"
          />
          <StatusTag
            text={getRecallStatusLabel(recall.status)}
            color={getRecallStatusColor(recall.status)}
            size="sm"
          />
        </View>
      </View>

      <Text className={styles.reason}>{recall.reason}</Text>

      <View className={styles.progressSection}>
        <View className={styles.progressHeader}>
          <Text className={styles.progressLabel}>召回进度</Text>
          <Text className={styles.progressText}>
            {recall.completedCount} / {recall.totalBatteries} ({progress}%)
          </Text>
        </View>
        <View className={styles.progressTrack}>
          <View
            className={styles.progressFill}
            style={{
              width: `${progress}%`,
              background: progress === 100
                ? 'linear-gradient(90deg, #00B42A, #0FC6C2)'
                : 'linear-gradient(90deg, #F53F3F, #FF7D00)',
            }}
          />
        </View>
      </View>

      <View className={styles.metaRow}>
        <View className={styles.metaItem}>
          <Text className={styles.metaNum}>{recall.affectedOwners}</Text>
          <Text className={styles.metaLabel}>涉及车主</Text>
        </View>
        <View className={styles.metaItem}>
          <Text className={styles.metaNum}>{recall.createdBy}</Text>
          <Text className={styles.metaLabel}>发起部门</Text>
        </View>
        <View className={styles.metaItem}>
          <Text className={styles.metaNum} style={{ fontSize: 22 }}>
            {formatDateTime(recall.createdAt)}
          </Text>
          <Text className={styles.metaLabel}>创建时间</Text>
        </View>
      </View>
    </View>
  );
};

export default RecallCard;
