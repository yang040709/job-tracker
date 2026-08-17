import { useMemo } from 'react';
import { Card, Row, Col, Statistic, Typography, List, Tag, Empty, Space, Progress } from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '../../stores/appStore';
import { BUCKET_COLORS, STATUS_BUCKETS } from '../../types';
import dayjs from 'dayjs';
import type { Application, StatusBucket } from '../../types';

const { Text } = Typography;

/* ── helpers ── */

function getTextColor(dark: boolean) {
  return dark ? '#d9d9d9' : '#333';
}

function getSubTextColor(dark: boolean) {
  return dark ? '#888' : '#999';
}

/* ── Component ── */

export function DashboardView() {
  const { applications, stages, darkMode, getFilteredApplications } = useAppStore();
  const filteredApps = getFilteredApplications();

  /* ── stats ── */
  const totalCount = applications.length;
  const offerCount = applications.filter((a) => a.statusBucket === '已拿Offer').length;
  const rejectCount = applications.filter((a) => a.statusBucket === '已结束').length;
  const interviewCount = applications.filter((a) => a.statusBucket === '面试中').length;
  const offerRate = totalCount > 0 ? ((offerCount / totalCount) * 100).toFixed(1) : '0';
  const interviewRate = totalCount > 0 ? ((interviewCount / totalCount) * 100).toFixed(1) : '0';

  const sevenDaysAgo = dayjs().subtract(7, 'day').format('YYYY-MM-DD');
  const recentCount = applications.filter((a) => a.applyDate >= sevenDaysAgo).length;

  /* ── conversion funnel ── */
  const funnelData = useMemo(() => {
    const bucketOrder: StatusBucket[] = ['流程中', '面试中', '已拿Offer', '已结束'];
    const counts = bucketOrder.map((b) => ({
      name: b,
      value: applications.filter((a) => a.statusBucket === b).length,
    }));
    return counts;
  }, [applications]);

  /* ── stage distribution ── */
  const stageDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const app of applications) {
      const stage = stages.find((s) => s.id === app.stageId);
      const name = stage?.name || '未知';
      counts[name] = (counts[name] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [applications, stages]);

  /* ── 14-day trend ── */
  const trendData = useMemo(() => {
    const data: { date: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      const count = applications.filter((a) => a.applyDate === date).length;
      data.push({ date: date.slice(5), count });
    }
    return data;
  }, [applications]);

  /* ── channel breakdown ── */
  const channelData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const app of applications) {
      counts[app.channel] = (counts[app.channel] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [applications]);

  /* ── active apps ── */
  const activeApps = useMemo(() => {
    return applications
      .filter((a) => a.statusBucket === '流程中' || a.statusBucket === '面试中')
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 8);
  }, [applications]);

  /* ── ECharts options ── */

  const getFunnelOption = () => ({
    tooltip: { trigger: 'item', formatter: '{b}: {c}' },
    series: [
      {
        type: 'funnel',
        left: '10%',
        top: 20,
        bottom: 20,
        width: '80%',
        sort: 'none',
        gap: 4,
        label: {
          show: true,
          position: 'inside',
          formatter: '{b}\n{c}',
          color: '#fff',
          fontSize: 13,
        },
        itemStyle: { borderWidth: 0 },
        data: funnelData.map((d) => ({
          ...d,
          itemStyle: { color: BUCKET_COLORS[d.name as StatusBucket] },
        })),
      },
    ],
  });

  const getStageOption = () => ({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center',
      textStyle: { color: getTextColor(darkMode), fontSize: 12 },
    },
    series: [
      {
        type: 'pie',
        radius: ['35%', '65%'],
        center: ['55%', '50%'],
        padAngle: 2,
        itemStyle: { borderRadius: 6 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' },
        },
        data: stageDistribution,
      },
    ],
  });

  const getTrendOption = () => ({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: trendData.map((d) => d.date),
      axisLabel: { rotate: 45, fontSize: 10, color: getSubTextColor(darkMode) },
      axisLine: { lineStyle: { color: darkMode ? '#444' : '#e8e8e8' } },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: getSubTextColor(darkMode) },
      splitLine: { lineStyle: { color: darkMode ? '#333' : '#f0f0f0' } },
    },
    series: [
      {
        type: 'bar',
        data: trendData.map((d) => d.count),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#1677ff' },
              { offset: 1, color: '#69b1ff' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: '50%',
      },
    ],
    grid: { left: 40, right: 20, bottom: 60, top: 20 },
  });

  const getChannelOption = () => ({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: getSubTextColor(darkMode) },
      splitLine: { lineStyle: { color: darkMode ? '#333' : '#f0f0f0' } },
    },
    yAxis: {
      type: 'category',
      data: channelData.map((d) => d.name).reverse(),
      axisLabel: { color: getTextColor(darkMode), fontSize: 12 },
      axisLine: { lineStyle: { color: darkMode ? '#444' : '#e8e8e8' } },
    },
    series: [
      {
        type: 'bar',
        data: channelData.map((d) => d.value).reverse(),
        itemStyle: {
          color: '#1677ff',
          borderRadius: [0, 4, 4, 0],
        },
        barWidth: '50%',
        label: { show: true, position: 'right', color: getTextColor(darkMode) },
      },
    ],
    grid: { left: 80, right: 40, bottom: 10, top: 10 },
  });

  const getBucketOption = () => {
    const bucketCounts = STATUS_BUCKETS.map((b) => ({
      name: b,
      value: applications.filter((a) => a.statusBucket === b).length,
    }));
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      series: [
        {
          type: 'pie',
          radius: ['40%', '65%'],
          data: bucketCounts.map((d) => ({
            ...d,
            itemStyle: { color: BUCKET_COLORS[d.name as keyof typeof BUCKET_COLORS] },
          })),
          label: {
            formatter: '{b}\n{d}%',
            color: getTextColor(darkMode),
          },
        },
      ],
    };
  };

  return (
    <div>
      {/* ── Top stats ── */}
      <Row gutter={[16, 16]} className="dashboard-grid">
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="总投递"
              value={totalCount}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="近7天新增"
              value={recentCount}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="面试率"
              value={interviewRate}
              suffix="%"
              prefix={<SwapOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Offer 率"
              value={offerRate}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* ── Funnel ── */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }} className="dashboard-grid">
        <Col span={24}>
          <Card title="📊 投递漏斗" size="small">
            {applications.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <div style={{ flex: 1 }}>
                  <ReactECharts option={getFunnelOption()} style={{ height: 200 }} />
                </div>
                <div style={{ minWidth: 180 }}>
                  {funnelData.map((d, i) => {
                    const rate = totalCount > 0 ? ((d.value / totalCount) * 100).toFixed(1) : '0';
                    const prevVal = i > 0 ? funnelData[i - 1].value : totalCount;
                    const stepRate = prevVal > 0 ? ((d.value / prevVal) * 100).toFixed(1) : '0';
                    return (
                      <div key={d.name} style={{ marginBottom: 8 }}>
                        <Space>
                          <div
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 2,
                              background: BUCKET_COLORS[d.name as StatusBucket],
                            }}
                          />
                          <Text style={{ fontSize: 13 }}>{d.name}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {d.value}（{rate}%）
                          </Text>
                        </Space>
                        {i > 0 && (
                          <div style={{ marginLeft: 18 }}>
                            <Progress
                              percent={Number(stepRate)}
                              size="small"
                              showInfo={false}
                              strokeColor={BUCKET_COLORS[d.name as StatusBucket]}
                              style={{ marginBottom: 0 }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <Empty description="暂无数据" />
            )}
          </Card>
        </Col>
      </Row>

      {/* ── Charts row 1: stage donut + trend ── */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }} className="dashboard-grid">
        <Col xs={24} lg={12}>
          <Card title="各阶段分布" size="small">
            {stageDistribution.length > 0 ? (
              <ReactECharts option={getStageOption()} style={{ height: 280 }} />
            ) : (
              <Empty description="暂无数据" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="近14天投递趋势" size="small">
            {trendData.some((d) => d.count > 0) ? (
              <ReactECharts option={getTrendOption()} style={{ height: 280 }} />
            ) : (
              <Empty description="暂无数据" />
            )}
          </Card>
        </Col>
      </Row>

      {/* ── Charts row 2: channel bar + bucket pie ── */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }} className="dashboard-grid">
        <Col xs={24} lg={12}>
          <Card title="渠道分布" size="small">
            {channelData.length > 0 ? (
              <ReactECharts option={getChannelOption()} style={{ height: 280 }} />
            ) : (
              <Empty description="暂无数据" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="状态分布" size="small">
            {applications.length > 0 ? (
              <ReactECharts option={getBucketOption()} style={{ height: 280 }} />
            ) : (
              <Empty description="暂无数据" />
            )}
          </Card>
        </Col>
      </Row>

      {/* ── Active applications ── */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }} className="dashboard-grid">
        <Col span={24}>
          <Card title="🔥 进行中的投递" size="small">
            {activeApps.length > 0 ? (
              <List
                dataSource={activeApps}
                size="small"
                renderItem={(app: Application) => {
                  const stage = stages.find((s) => s.id === app.stageId);
                  return (
                    <List.Item>
                      <List.Item.Meta
                        title={
                          <Space>
                            <Text strong>{app.company}</Text>
                            <Text type="secondary">{app.position}</Text>
                          </Space>
                        }
                        description={
                          <Space size={4} wrap>
                            <Tag color={BUCKET_COLORS[app.statusBucket]} style={{ fontSize: 11 }}>
                              {app.statusBucket}
                            </Tag>
                            {stage && (
                              <Tag style={{ fontSize: 11 }}>{stage.name}</Tag>
                            )}
                            {app.city && (
                              <Tag style={{ fontSize: 11 }}>{app.city}</Tag>
                            )}
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {app.applyDate}
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            ) : (
              <Empty description="暂无进行中的投递" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
