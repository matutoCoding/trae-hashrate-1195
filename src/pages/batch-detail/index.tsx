import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useAppStore } from '@/store';
import StatusTag from '@/components/StatusTag';
import {
  getBatchStatusLabel,
  getBatchStatusColor,
  getHealthLevelLabel,
  getHealthLevelColor,
  getHealthLevelBgColor,
  formatDate,
  formatDateTime,
  getFlowActionLabel,
  getFlowActionColor,
  getDaysUntilExpire,
} from '@/utils';
import styles from './index.module.scss';

const BatchDetailPage: React.FC = () => {
  const router = useRouter();
  const { batches, batteries, flowRecords } = useAppStore();
  const id = router.params.id;

  const batch = useMemo(() => batches.find(b => b.id === id), [batches, id]);
  const batchBatteries = useMemo(() => batteries.filter(b => b.batchId === id), [batteries, id]);
  const batchFlows = useMemo(
    () => flowRecords.filter(f => f.batchId === id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [flowRecords, id]
  );

  if (!batch) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyTip}>批次不存在</View>
      </View>
    );
  }

  const daysLeft = getDaysUntilExpire(batch.expireDate);

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.headerCard}>
        <Text className={styles.batchNoLabel}>电池批次号</Text>
        <Text className={styles.batchNo}>{batch.batchNo}</Text>
        <View style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
          <StatusTag
            text={getBatchStatusLabel(batch.status)}
            color={getBatchStatusColor(batch.status)}
            size="sm"
            showDot={false}
          />
          <StatusTag
            text={getHealthLevelLabel(batch.healthLevel)}
            color={getHealthLevelColor(batch.healthLevel)}
            size="sm"
            showDot={false}
          />
          {daysLeft < 180 && (
            <StatusTag
              text={`${daysLeft > 0 ? `${daysLeft}天到期` : '已过期'}`}
              color={daysLeft < 90 ? '#F53F3F' : '#FF7D00'}
              size="sm"
              showDot={false}
            />
          )}
        </View>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{batch.totalQuantity}</Text>
            <Text className={styles.statLabel}>总数</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{batch.availableQuantity}</Text>
            <Text className={styles.statLabel}>在库</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{batch.inUseQuantity}</Text>
            <Text className={styles.statLabel}>使用</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum} style={{ color: batch.recalledQuantity > 0 ? '#FFF1F0' : 'inherit' }}>{batch.recalledQuantity}</Text>
            <Text className={styles.statLabel}>召回</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.infoCard}>
          <Text className={styles.cardTitle}>
            <View className={styles.titleBar} />
            基本信息
          </Text>
          <View className={styles.infoGrid}>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>供应商</Text>
              <Text className={styles.infoValue}>{batch.supplier}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>验收人</Text>
              <Text className={styles.infoValue}>{batch.inspector}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>生产日期</Text>
              <Text className={styles.infoValue}>{formatDate(batch.manufactureDate)}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>入库日期</Text>
              <Text className={styles.infoValue}>{formatDate(batch.inboundDate)}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>失效日期</Text>
              <Text className={styles.infoValue} style={{ color: daysLeft < 180 ? '#F53F3F' : undefined }}>
                {formatDate(batch.expireDate)}
              </Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>质保剩余</Text>
              <Text className={styles.infoValue}>{daysLeft > 0 ? `${daysLeft}天` : '已过期'}</Text>
            </View>
          </View>
          {batch.remark && (
            <View style={{ marginTop: 24 }}>
              <Text className={styles.infoLabel} style={{ marginBottom: 12, display: 'block' }}>备注说明</Text>
              <View className={styles.remarkBox}>{batch.remark}</View>
            </View>
          )}
        </View>

        <View className={styles.infoCard}>
          <Text className={styles.cardTitle}>
            <View className={styles.titleBar} />
            批次电池列表 ({batchBatteries.length})
          </Text>
          {batchBatteries.length > 0 ? (
            <View className={styles.batteryList}>
              {batchBatteries.slice(0, 8).map(b => (
                <View key={b.id} className={styles.batteryItem}>
                  <View className={styles.batteryLeft}>
                    <Text className={styles.batteryCode}>{b.code}</Text>
                    <View className={styles.batteryDesc}>
                      <Text>容量{b.capacity}%</Text>
                      <Text>循环{b.cycleCount}次</Text>
                      {b.currentOwnerName && <Text>车主: {b.currentOwnerName}</Text>}
                    </View>
                  </View>
                  <StatusTag
                    text={getHealthLevelLabel(b.healthLevel)}
                    color={getHealthLevelColor(b.healthLevel)}
                    size="sm"
                    showDot={false}
                  />
                </View>
              ))}
              {batchBatteries.length > 8 && (
                <View className={styles.emptyTip} style={{ padding: 16 }}>
                  还有{batchBatteries.length - 8}块电池...
                </View>
              )}
            </View>
          ) : (
            <Text className={styles.emptyTip}>暂无电池数据</Text>
          )}
        </View>

        <View className={styles.infoCard}>
          <Text className={styles.cardTitle}>
            <View className={styles.titleBar} />
            批次流向追踪 ({batchFlows.length})
          </Text>
          {batchFlows.length > 0 ? (
            batchFlows.slice(0, 10).map((f, idx) => (
              <View key={f.id} className={styles.flowItem}>
                <View className={styles.flowTimeline}>
                  <View
                    className={styles.flowDot}
                    style={{ background: getFlowActionColor(f.action) }}
                  />
                  {idx < Math.min(batchFlows.length, 10) - 1 && <View className={styles.flowLine} />}
                </View>
                <View className={styles.flowContent}>
                  <View className={styles.flowHeader}>
                    <Text
                      className={styles.flowAction}
                      style={{ color: getFlowActionColor(f.action) }}
                    >
                      {getFlowActionLabel(f.action)}
                    </Text>
                    <Text className={styles.flowTime}>{formatDateTime(f.timestamp)}</Text>
                  </View>
                  <Text className={styles.flowDetail}>
                    {f.batteryCode}
                    {f.ownerName ? ` → ${f.ownerName}(${f.vehiclePlate || ''})` : ''}
                    {f.stationName ? ` @${f.stationName}` : ''}
                    {' · 操作员: '}{f.operator}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text className={styles.emptyTip}>暂无流向记录</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default BatchDetailPage;
