import { useState } from 'react';
import { Input, Select, DatePicker, Button, Space, Tag, Popover, Badge } from 'antd';
import { SearchOutlined, FilterOutlined, SaveOutlined, StarOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAppStore } from '../stores/appStore';
import { STATUS_BUCKETS } from '../types';
import type { FilterState, StatusBucket } from '../types';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export function FilterBar() {
  const {
    filters,
    setFilters,
    stages,
    savedViews,
    saveView,
    deleteView,
    applications,
  } = useAppStore();

  const [viewName, setViewName] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);

  const categories = [...new Set(applications.map((a) => a.category))];
  const channels = [...new Set(applications.map((a) => a.channel))];

  const activeFilterCount =
    (filters.keyword ? 1 : 0) +
    filters.buckets.length +
    filters.categories.length +
    filters.channels.length +
    (filters.dateRange ? 1 : 0);

  const handleKeywordChange = (value: string) => {
    setFilters({ ...filters, keyword: value });
  };

  const handleBucketChange = (values: StatusBucket[]) => {
    setFilters({ ...filters, buckets: values });
  };

  const handleCategoryChange = (values: string[]) => {
    setFilters({ ...filters, categories: values });
  };

  const handleChannelChange = (values: string[]) => {
    setFilters({ ...filters, channels: values });
  };

  const handleDateChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      setFilters({
        ...filters,
        dateRange: [dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')],
      });
    } else {
      setFilters({ ...filters, dateRange: null });
    }
  };

  const handleClearFilters = () => {
    setFilters({
      keyword: '',
      buckets: [],
      categories: [],
      channels: [],
      dateRange: null,
    });
  };

  const handleSaveView = () => {
    if (!viewName.trim()) return;
    saveView(viewName.trim(), filters);
    setViewName('');
    setPopoverOpen(false);
  };

  const handleLoadView = (vf: FilterState) => {
    setFilters(vf);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <Space className="filter-bar" wrap style={{ width: '100%' }}>
        <Input
          placeholder="搜索公司/岗位/城市/渠道..."
          prefix={<SearchOutlined />}
          value={filters.keyword}
          onChange={(e) => handleKeywordChange(e.target.value)}
          allowClear
          className="filter-search"
        />

        <Select
          mode="multiple"
          placeholder="状态"
          value={filters.buckets}
          onChange={handleBucketChange}
          className="filter-select"
          maxTagCount={1}
          allowClear
        >
          {STATUS_BUCKETS.map((b) => (
            <Select.Option key={b} value={b}>
              {b}
            </Select.Option>
          ))}
        </Select>

        <Select
          mode="multiple"
          placeholder="类别"
          value={filters.categories}
          onChange={handleCategoryChange}
          className="filter-select"
          maxTagCount={1}
          allowClear
        >
          {categories.map((c) => (
            <Select.Option key={c} value={c}>{c}</Select.Option>
          ))}
        </Select>

        <Select
          mode="multiple"
          placeholder="渠道"
          value={filters.channels}
          onChange={handleChannelChange}
          className="filter-select"
          maxTagCount={1}
          allowClear
        >
          {channels.map((c) => (
            <Select.Option key={c} value={c}>{c}</Select.Option>
          ))}
        </Select>

        <RangePicker
          value={
            filters.dateRange
              ? [dayjs(filters.dateRange[0]), dayjs(filters.dateRange[1])]
              : null
          }
          onChange={handleDateChange}
          placeholder={['开始日期', '结束日期']}
        />

        {activeFilterCount > 0 && (
          <Button onClick={handleClearFilters}>
            清除筛选
          </Button>
        )}

        <Popover
          content={
            <div style={{ width: 260 }}>
              <div style={{ marginBottom: 8 }}>
                <Input
                  placeholder="视图名称"
                  value={viewName}
                  onChange={(e) => setViewName(e.target.value)}
                  onPressEnter={handleSaveView}
                  style={{ marginBottom: 8 }}
                />
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSaveView}
                  block
                  disabled={!viewName.trim()}
                >
                  保存当前筛选
                </Button>
              </div>
              {savedViews.length > 0 && (
                <>
                  <div style={{ fontWeight: 'bold', marginBottom: 4, fontSize: 12, color: '#999' }}>
                    已保存的视图
                  </div>
                  {savedViews.map((v) => (
                    <div
                      key={v.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '4px 0',
                        cursor: 'pointer',
                      }}
                    >
                      <Tag
                        icon={<StarOutlined />}
                        onClick={() => handleLoadView(v.filters)}
                        style={{ cursor: 'pointer', flex: 1 }}
                      >
                        {v.name}
                      </Tag>
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => deleteView(v.id)}
                      />
                    </div>
                  ))}
                </>
              )}
            </div>
          }
          trigger="click"
          open={popoverOpen}
          onOpenChange={setPopoverOpen}
        >
          <Badge count={savedViews.length} size="small" offset={[-2, 2]}>
            <Button icon={<StarOutlined />}>
              视图
            </Button>
          </Badge>
        </Popover>
      </Space>
    </div>
  );
}
