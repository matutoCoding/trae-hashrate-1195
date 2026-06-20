import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store';
import StatusTag from '@/components/StatusTag';
import {
  getRecallStatusLabel,
  getRecallStatusColor,
  getPriorityLabel,
  getPriorityColor,
  maskPhone,
  formatDate,
  formatDateTime,
} from '@/utils';
import styles from './index.module.scss';

const RecallDetailPage: React.FC = () => {
  const router = useRouter();
  const { recalls, batches } = useAppStore();
  const id = router.params.id;

  const recall = useMemo(() => recalls.find(r => r.id === id), [recalls, id]);
  const batch = useMemo(
    () => (recall ? batches.find(b => b.id === recall.batchId) : undefined),
    [batches, recall]
  );

  if (!recall) {
    return (
      <View className={styles.page}>
        <View style={{ textAlign: 'center', padding: 120, color: '#86909C' }}>召回记录不存在</View>
      </View>
    );
  }

  const progress = recall.totalBatteries > 0
    ? Math.round((recall.completedCount / recall.totalBatteries) * 100)
    : 0;

  const owners = recall.affectedOwnerList || [];
  const notifiedCount = owners.filter(o => o.notified).length;
  const contactedCount = owners.filter(o => o.contacted).length;
  const replacedCount = owners.filter(o => o.replaced).length;

  const goBatchDetail = () => {
    if (batch) {
      Taro.navigateTo({ url: `/pages/batch-detail/index?id=${batch.id}` });
    }
  };

  const handleNotify = () => {
    Taro.showModal({
      title: '一键通知',
      content: `将向${recall.affectedOwners - notifiedCount}位未通知车主发送召回短信，是否继续？`,
      confirmColor: '#F53F3F',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '已发起通知', icon: 'success' });
        }
      },
    });
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.headerCard}>
        <Text className={styles.recallNo}>{recall.recallNo}</Text>
        <Text className={styles.recallTitle}>
          批次电池召回任务
        </Text>
        <View className={styles.tagRow}>
          <Text className={styles.softTag}>
            {getRecallStatusLabel(recall.status)}
          </Text>
          <Text className={styles.softTag}>
            优先级: {getPriorityLabel(recall.priority)}
          </Text>
          <Text className={styles.softTag}>
            涉及{recall.affectedOwners}位车主
          </Text>
        </View>
        <View className={styles.progressWrap}>
          <View className={styles.progressLabel}>
            <Text>召回完成度</Text>
            <Text style={{ fontWeight: 'bold' }}>
              {recall.completedCount} / {recall.totalBatteries} ({progress}%)
            </Text>
          </View>
          <View className={styles.progressTrack}>
            <View
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.infoCard}>
          <Text className={styles.cardTitle}>
            <View className={styles.titleLeft}>
              <View className={styles.titleBar} />
              召回原因
            </View>
          </Text>
          <View className={styles.reasonBox}>{recall.reason}</View>
        </View>

        <View className={styles.infoCard}>
          <Text className={styles.cardTitle}>
            <View className={styles.titleLeft}>
              <View className={styles.titleBar} />
              关联信息
            </View>
          </Text>
          <View className={styles.infoGrid}>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>关联批次</Text>
              <Text
                className={styles.infoValue}
                style={{ color: '#0FC6C2' }}
                onClick={goBatchDetail}
              >
                {recall.batchNo} ›
              </Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>发起部门</Text>
              <Text className={styles.infoValue}>{recall.createdBy}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>创建时间</Text>
              <Text className={styles.infoValue}>{formatDateTime(recall.createdAt)}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>供应商</Text>
              <Text className={styles.infoValue}>
                {batch ? batch.supplier.slice(0, 10) + (batch.supplier.length > 10 ? '...' : '') : '-'}
              </Text>
            </View>
          </View>
        </View>

        <View className={styles.infoCard}>
          <Text className={styles.cardTitle}>
            <View className={styles.titleLeft}>
              <View className={styles.titleBar} />
              处理进度
            </View>
          </Text>
          <View className={styles.stageRow}>
            <View className={classnames(styles.stageItem, notifiedCount > 0 && styles.stageDone)}>
              <Text className={styles.stageNum}>{notifiedCount}</Text>
              <Text className={styles.stageLabel}>已通知/{owners.length}</Text>
            </View>
            <View className={classnames(styles.stageItem, contactedCount > 0 && styles.stageDone)}>
              <Text className={styles.stageNum}>{contactedCount}</Text>
              <Text className={styles.stageLabel}>已联系/{owners.length}</Text>
            </View>
            <View className={classnames(styles.stageItem, styles.stageDone)}>
              <Text className={styles.stageNum}>{replacedCount}</Text>
              <Text className={styles.stageLabel}>已更换/{owners.length}</Text>
            </View>
          </View>
        </View>

        <View className={styles.infoCard}>
          <Text className={styles.cardTitle}>
            <View className={styles.titleLeft}>
              <View className={styles.titleBar} />
              受影响车主 ({owners.length})
            </View>
            <Text className={styles.moreLink}>通知记录 ›</Text>
          </Text>
          {owners.length > 0 ? (
            owners.map(o => (
              <View key={o.id} className={styles.ownerItem}>
                <View className={styles.ownerAvatar}>{o.name.charAt(0)}</View>
                <View className={styles.ownerInfo}>
                  <View className={styles.ownerMain}>
                    <Text className={styles.ownerName}>{o.name}</Text>
                    <Text className={styles.plateTag}>{o.vehiclePlate}</Text>
                  </View>
                  <View className={styles.ownerSub}>
                    <Text>{maskPhone(o.phone)}</Text>
                    <Text>{o.batteryCode.slice(-8)}</Text>
                    {o.replaceDate && <Text>更换于{formatDate(o.replaceDate)}</Text>}
                  </View>
                </View>
                <View className={styles.statusCol}>
                  <StatusTag
                    text={o.replaced ? '已更换' : o.contacted ? '已联系' : o.notified ? '已通知' : '待处理'}
                    color={o.replaced ? '#00B42A' : o.contacted ? '#0FC6C2' : o.notified ? '#FF7D00' : '#86909C'}
                    size="sm"
                    showDot={false}
                  />
                </View>
              </View>
            ))
          ) : (
            <View style={{ textAlign: 'center', padding: 48, color: '#86909C', fontSize: 24 }}>
              暂无受影响车主数据
            </View>
          )}
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={`${styles.btn} ${styles.btnOutline}`} onClick={handleNotify}>
          一键通知
        </View>
        <View className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => Taro.showToast({ title: '功能开发中', icon: 'none' })}>
          导出名单
        </View>
      </View>
    </ScrollView>
  );
};

export default RecallDetailPage;
