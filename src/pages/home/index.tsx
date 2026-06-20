import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store';
import StatCard from '@/components/StatCard';
import RecallCard from '@/components/RecallCard';
import styles from './index.module.scss';

const HomePage: React.FC = () => {
  const { dashboardStats, recalls, stations, selectedStationId } = useAppStore();
  const activeStation = stations.find(s => s.id === selectedStationId);
  const activeRecalls = recalls.filter(r => r.status === 'in_progress' || r.status === 'pending').slice(0, 2);
  const urgentRecalls = recalls.filter(r => r.priority === 'urgent' && r.status !== 'completed').slice(0, 2);

  const handleAction = (type: string) => {
    switch (type) {
      case 'inbound':
        Taro.showToast({ title: '到货验收入库', icon: 'none' });
        break;
      case 'swap':
        Taro.switchTab({ url: '/pages/queue/index' });
        break;
      case 'recall':
        Taro.switchTab({ url: '/pages/recall/index' });
        break;
      case 'queue':
        Taro.switchTab({ url: '/pages/queue/index' });
        break;
    }
  };

  const goRecallDetail = (id: string) => {
    Taro.navigateTo({ url: `/pages/recall-detail/index?id=${id}` });
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <View className={styles.headerTop}>
          <View className={styles.titleGroup}>
            <Text className={styles.greeting}>欢迎使用换电站调度系统</Text>
            <Text className={styles.pageTitle}>今日运营概览</Text>
          </View>
          <View className={styles.stationTag}>
            <View className={styles.stationDot} />
            <Text>{activeStation?.name?.slice(0, 4) || '总站'}</Text>
          </View>
        </View>

        <View className={styles.statsGrid}>
          <StatCard
            label="今日入库"
            value={dashboardStats.todayInbound}
            suffix="块电池"
            iconText="入"
            iconBg="rgba(0, 180, 42, 0.12)"
            trendValue="12%"
            trendType="up"
          />
          <StatCard
            label="今日换电"
            value={dashboardStats.todaySwap}
            suffix="次服务"
            iconText="换"
            iconBg="rgba(15, 198, 194, 0.12)"
            trendValue="8%"
            trendType="up"
          />
          <StatCard
            label="今日召回"
            value={dashboardStats.todayRecall}
            suffix="块处理"
            iconText="召"
            iconBg="rgba(245, 63, 63, 0.12)"
            trendValue="3%"
            trendType="down"
          />
          <StatCard
            label="健康率"
            value={`${dashboardStats.healthyRate}%`}
            suffix={`共${dashboardStats.totalBatteries}块`}
            iconText="健"
            iconBg="rgba(255, 125, 0, 0.12)"
          />
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>
            <View className={styles.titleBar} />
            快捷操作
          </Text>
        </View>
        <View className={styles.quickActions}>
          <View className={styles.actionItem} onClick={() => handleAction('inbound')}>
            <View className={`${styles.actionIcon} ${styles.iconInbound}`}>入</View>
            <Text className={styles.actionLabel}>验收入库</Text>
          </View>
          <View className={styles.actionItem} onClick={() => handleAction('swap')}>
            <View className={`${styles.actionIcon} ${styles.iconSwap}`}>换</View>
            <Text className={styles.actionLabel}>换电登记</Text>
          </View>
          <View className={styles.actionItem} onClick={() => handleAction('recall')}>
            <View className={`${styles.actionIcon} ${styles.iconRecall}`}>召</View>
            <Text className={styles.actionLabel}>发起召回</Text>
          </View>
          <View className={styles.actionItem} onClick={() => handleAction('queue')}>
            <View className={`${styles.actionIcon} ${styles.iconQueue}`}>号</View>
            <Text className={styles.actionLabel}>取号排队</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>
            <View className={styles.titleBar} />
            紧急待办 ({urgentRecalls.length})
          </Text>
          <Text className={styles.sectionMore}>查看全部 ›</Text>
        </View>
        {urgentRecalls.map(recall => (
          <View key={recall.id} className={styles.alertCard} onClick={() => goRecallDetail(recall.id)}>
            <View className={styles.alertIcon}>!</View>
            <View className={styles.alertContent}>
              <Text className={styles.alertTitle}>{recall.recallNo}</Text>
              <Text className={styles.alertDesc}>{recall.reason}</Text>
              <View className={styles.alertMeta}>
                <Text className={styles.alertTag}>涉及{recall.affectedOwners}位车主</Text>
                <Text className={styles.alertTag}>完成{recall.completedCount}/{recall.totalBatteries}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>
            <View className={styles.titleBar} />
            进行中的召回 ({activeRecalls.length})
          </Text>
          <Text className={styles.sectionMore} onClick={() => Taro.switchTab({ url: '/pages/recall/index' })}>
            全部召回 ›
          </Text>
        </View>
        {activeRecalls.map(recall => (
          <RecallCard
            key={recall.id}
            recall={recall}
            onClick={() => goRecallDetail(recall.id)}
          />
        ))}
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>
            <View className={styles.titleBar} />
            站点概览
          </Text>
        </View>
        <View className={styles.statsGrid}>
          <StatCard
            label="运营站点"
            value={dashboardStats.stationCount}
            suffix="座"
            iconText="站"
            iconBg="rgba(22, 93, 255, 0.12)"
          />
          <StatCard
            label="排队等待"
            value={dashboardStats.waitingQueue}
            suffix="位车主"
            iconText="等"
            iconBg="rgba(255, 125, 0, 0.12)"
          />
          <StatCard
            label="激活召回"
            value={dashboardStats.activeRecalls}
            suffix="批次"
            iconText="激"
            iconBg="rgba(245, 63, 63, 0.12)"
          />
          <StatCard
            label="运营日期"
            value="2026-06-20"
            suffix="周六"
            iconText="日"
            iconBg="rgba(114, 46, 209, 0.12)"
          />
        </View>
      </View>
    </ScrollView>
  );
};

export default HomePage;
