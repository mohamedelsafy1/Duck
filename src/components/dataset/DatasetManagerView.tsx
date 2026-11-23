import React, { useState, useEffect } from 'react';
import {
  MarketingDatasetRecord,
  DatasetStatsResponse,
  DatasetFilterState,
} from '../../types.ts';
import { DatasetOverviewSection } from './DatasetOverviewSection.tsx';
import { DatasetImportSection } from './DatasetImportSection.tsx';
import { DatasetRecordsTable } from './DatasetRecordsTable.tsx';
import { DatasetReviewQueue } from './DatasetReviewQueue.tsx';
import { DatasetExportSection } from './DatasetExportSection.tsx';
import { DatasetBatchesSection } from './DatasetBatchesSection.tsx';
import { DatasetRecordModal } from './DatasetRecordModal.tsx';
import {
  BarChart3,
  UploadCloud,
  Table,
  Clock,
  Download,
  History,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export const DatasetManagerView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'import' | 'records' | 'review' | 'export' | 'batches'
  >('overview');

  // Stats
  const [stats, setStats] = useState<DatasetStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Records Table State
  const [records, setRecords] = useState<MarketingDatasetRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [recordsLoading, setRecordsLoading] = useState(false);

  // Filters State
  const [filters, setFilters] = useState<DatasetFilterState>({
    searchQuery: '',
    recordPurpose: 'all',
    country: 'all',
    dialect: 'all',
    industry: 'all',
    contentType: 'all',
    marketingObjective: 'all',
    marketTier: 'all',
    reviewStatus: 'all',
    sourceStatus: 'all',
    licenseStatus: 'all',
    batchId: 'all',
    sortBy: 'importedAt',
    sortOrder: 'desc',
    page: 1,
    pageSize: 10,
  });

  // Modal Editing State
  const [selectedRecordForModal, setSelectedRecordForModal] =
    useState<MarketingDatasetRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // AI Classification loading state
  const [aiClassifyingId, setAiClassifyingId] = useState<string | null>(null);

  // Fetch Stats
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/dataset/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch Records with current filters
  const fetchRecords = async () => {
    setRecordsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.searchQuery) params.set('searchQuery', filters.searchQuery);
      if (filters.country !== 'all') params.set('country', filters.country);
      if (filters.dialect !== 'all') params.set('dialect', filters.dialect);
      if (filters.industry !== 'all') params.set('industry', filters.industry);
      if (filters.contentType !== 'all') params.set('contentType', filters.contentType);
      if (filters.marketingObjective !== 'all') params.set('marketingObjective', filters.marketingObjective);
      if (filters.marketTier !== 'all') params.set('marketTier', filters.marketTier);
      if (filters.reviewStatus !== 'all') params.set('reviewStatus', filters.reviewStatus);
      if (filters.sourceStatus !== 'all') params.set('sourceStatus', filters.sourceStatus);
      if (filters.licenseStatus !== 'all') params.set('licenseStatus', filters.licenseStatus);
      if (filters.batchId !== 'all') params.set('batchId', filters.batchId);
      params.set('sortBy', filters.sortBy);
      params.set('sortOrder', filters.sortOrder);
      params.set('page', filters.page.toString());
      params.set('pageSize', filters.pageSize.toString());

      const res = await fetch(`/api/dataset/records?${params.toString()}`);
      const data = await res.json();
      setRecords(data.records || []);
      setTotalRecords(data.total || 0);
    } catch (err) {
      console.error('Error fetching records:', err);
    } finally {
      setRecordsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [filters]);

  const handleFilterChange = (newFilters: Partial<DatasetFilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Quick single approve
  const handleQuickApprove = async (id: string, notes?: string) => {
    try {
      const res = await fetch(`/api/dataset/records/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          humanReviewStatus: 'approved',
          reviewerNotes: notes || 'تم الاعتماد عبر المراجعة السريعة',
          rejectionReason: null,
        }),
      });
      if (res.ok) {
        fetchRecords();
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Quick single reject
  const handleQuickReject = async (id: string, reason: string, notes?: string) => {
    try {
      const res = await fetch(`/api/dataset/records/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          humanReviewStatus: 'rejected',
          rejectionReason: reason,
          reviewerNotes: notes || null,
        }),
      });
      if (res.ok) {
        fetchRecords();
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Bulk Review
  const handleBulkReview = async (
    ids: string[],
    status: 'approved' | 'rejected',
    reason?: string
  ) => {
    try {
      const res = await fetch('/api/dataset/records/bulk-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, status, reason }),
      });
      if (res.ok) {
        fetchRecords();
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async (ids: string[]) => {
    try {
      const res = await fetch('/api/dataset/records', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) {
        fetchRecords();
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Record Updates from Modal
  const handleSaveRecord = async (id: string, updates: Partial<MarketingDatasetRecord>) => {
    const res = await fetch(`/api/dataset/records/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'فشل حفظ السجل.');
    }
    fetchRecords();
    fetchStats();
  };

  // Trigger AI Classification
  const handleTriggerAIClassify = async (id: string) => {
    setAiClassifyingId(id);
    try {
      const res = await fetch(`/api/dataset/records/${id}/ai-classify`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'فشل التوليد الآلي للاقتراح.');
        return;
      }
      fetchRecords();
      if (selectedRecordForModal && selectedRecordForModal.id === id) {
        setSelectedRecordForModal(data.record);
      }
    } catch (err: any) {
      console.error(err);
      alert(`خطأ: ${err?.message || 'خطأ'}`);
    } finally {
      setAiClassifyingId(null);
    }
  };

  // Pending records for the focused Review Queue
  const pendingRecords = records.filter((r) => r.humanReviewStatus === 'pending');

  return (
    <div className="space-y-6">
      {/* Top Dataset Manager Header */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold shadow-xs">
            <Database size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base md:text-lg font-bold text-zinc-900 leading-tight">
                مدير مجموعات البيانات (Dataset Manager)
              </h2>
              <span className="text-[11px] font-semibold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                إدارة السجلات والتحقق
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              مساحة عمليات متكاملة لاستيراد، فحص، مراجعة، تصنيف، وتصدير السجلات التسويقية مع تتبع دقيق للمصادر والتراخيص.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              fetchStats();
              fetchRecords();
            }}
            className="p-2 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
            title="تحديث البيانات"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 border-b border-zinc-200 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          <BarChart3 size={15} />
          <span>نظرة عامة وإحصائيات</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('import')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
            activeTab === 'import'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          <UploadCloud size={15} />
          <span>استيراد وفحص ملف جديد</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('records')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
            activeTab === 'records'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          <Table size={15} />
          <span>سجلات البيانات (Records)</span>
          {stats && stats.totalRecords > 0 && (
            <span className="bg-zinc-200 text-zinc-800 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {stats.totalRecords}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('review')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
            activeTab === 'review'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          <Clock size={15} />
          <span>قائمة المراجعة والاعتماد</span>
          {stats && stats.pendingReview > 0 && (
            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
              {stats.pendingReview}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('export')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
            activeTab === 'export'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          <Download size={15} />
          <span>تصدير السجلات المعتمدة</span>
          {stats && stats.approved > 0 && (
            <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
              {stats.approved}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('batches')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
            activeTab === 'batches'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          <History size={15} />
          <span>سجل دفعات الاستيراد</span>
        </button>
      </div>

      {/* Main Tab Panels */}
      {activeTab === 'overview' && (
        <DatasetOverviewSection
          stats={stats}
          onNavigateToImport={() => setActiveTab('import')}
          onNavigateToRecords={(filterKey, filterValue) => {
            if (filterKey && filterValue) {
              handleFilterChange({ [filterKey]: filterValue, page: 1 });
            }
            setActiveTab('records');
          }}
        />
      )}

      {activeTab === 'import' && (
        <DatasetImportSection
          onImportSuccess={() => {
            fetchStats();
            fetchRecords();
          }}
        />
      )}

      {activeTab === 'records' && (
        <DatasetRecordsTable
          records={records}
          total={totalRecords}
          stats={stats}
          filters={filters}
          onFilterChange={handleFilterChange}
          onEditRecord={(rec) => {
            setSelectedRecordForModal(rec);
            setIsModalOpen(true);
          }}
          onQuickApprove={handleQuickApprove}
          onQuickReject={handleQuickReject}
          onBulkReview={handleBulkReview}
          onBulkDelete={handleBulkDelete}
          onTriggerAIClassify={handleTriggerAIClassify}
          loading={recordsLoading}
        />
      )}

      {activeTab === 'review' && (
        <DatasetReviewQueue
          pendingRecords={pendingRecords}
          onApprove={handleQuickApprove}
          onReject={handleQuickReject}
          onTriggerAIClassify={handleTriggerAIClassify}
          onOpenEditModal={(rec) => {
            setSelectedRecordForModal(rec);
            setIsModalOpen(true);
          }}
          isAIClassifying={Boolean(aiClassifyingId)}
        />
      )}

      {activeTab === 'export' && <DatasetExportSection stats={stats} />}

      {activeTab === 'batches' && <DatasetBatchesSection />}

      {/* Detail & Edit Modal */}
      <DatasetRecordModal
        record={selectedRecordForModal}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRecordForModal(null);
        }}
        onSave={handleSaveRecord}
        onTriggerAIClassify={handleTriggerAIClassify}
        isAIClassifying={Boolean(aiClassifyingId)}
      />
    </div>
  );
};
