export type StatusBucket = '流程中' | '面试中' | '已拿Offer' | '已结束';

export const STATUS_BUCKETS: StatusBucket[] = ['流程中', '面试中', '已拿Offer', '已结束'];

export const BUCKET_COLORS: Record<StatusBucket, string> = {
  '流程中': '#1890ff',
  '面试中': '#faad14',
  '已拿Offer': '#52c41a',
  '已结束': '#ff4d4f',
};

export interface Application {
  id: string;
  company: string;
  position: string;
  city: string;
  applyDate: string;
  channel: string;
  jdLink?: string;
  referrer?: string;
  salary?: string;
  notes?: string;
  category: string;
  stageId: string;
  statusBucket: StatusBucket;
  createdAt: number;
  updatedAt: number;
}

export interface Stage {
  id: string;
  name: string;
  order: number;
  bucket: StatusBucket;
  isDefault: boolean;
}

export type TimelineEntryType = 'created' | 'stage_changed' | 'schedule_changed' | 'note_added';

export interface TimelineEntry {
  id: string;
  appId: string;
  type: TimelineEntryType;
  fromStage?: string;
  toStage?: string;
  content: string;
  createdAt: number;
}

export interface SavedView {
  id: string;
  name: string;
  filters: FilterState;
  createdAt: number;
}

export interface FilterState {
  keyword: string;
  buckets: StatusBucket[];
  categories: string[];
  channels: string[];
  dateRange: [string | null, string | null] | null;
}

export const DEFAULT_STAGES: Omit<Stage, 'id'>[] = [
  { name: '简历筛选', order: 0, bucket: '流程中', isDefault: true },
  { name: '笔试', order: 1, bucket: '流程中', isDefault: true },
  { name: '技术一面', order: 2, bucket: '面试中', isDefault: true },
  { name: '技术二面', order: 3, bucket: '面试中', isDefault: true },
  { name: 'HR面', order: 4, bucket: '面试中', isDefault: true },
  { name: 'Offer沟通', order: 5, bucket: '已拿Offer', isDefault: true },
  { name: '已拒绝/已放弃', order: 6, bucket: '已结束', isDefault: true },
];

export const CATEGORY_OPTIONS = ['校招', '社招', '实习'];

export const CHANNEL_OPTIONS = ['BOSS直聘', '猎聘', '内推', '官网', '拉勾', '牛客', 'LinkedIn', '其他'];
