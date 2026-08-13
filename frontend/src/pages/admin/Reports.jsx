import React, { useState, useEffect } from 'react';
import {
  getPaymentReport,
  getOutstandingReport,
  getTodayCollection,
  getThisMonthCollection,
  getSessionCollections,
  getOutstandingByClass,
  getDefaulters,
  getSessions,
} from '../../api/admin';
import toast from 'react-hot-toast';
import {
  FileText,
  Download,
  Printer,
  TrendingUp,
  Users,
  CreditCard,
  AlertCircle,
  Calendar,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/format';
import Spinner from '../../components/common/Spinner';
import Select from '../../components/common/Select';
import ReportCard from '../../components/reports/ReportCard';

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [reportType, setReportType] = useState('payment');
  const [reportData, setReportData] = useState(null);
  const [generating, setGenerating] = useState(false);

  const reportTypes = [
    { value: 'payment', label: 'Payment Report' },
    { value: 'outstanding', label: 'Outstanding Students' },
    { value: 'today', label: "Today's Collections" },
    { value: 'monthly', label: 'This Month' },
    { value: 'session-collections', label: 'Session Collections' },
    { value: 'outstanding-by-class', label: 'Outstanding by Class' },
    { value: 'defaulters', label: 'Defaulters List' },
  ];

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      generateReport();
    }
  }, [reportType, selectedSession]);

  const fetchSessions = async () => {
    try {
      const response = await getSessions();
      setSessions(response.data || []);
      const current = response.data?.find((s) => s.is_current);
      setSelectedSession(current?.id || response.data?.[0]?.id || '');
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      let response;
      switch (reportType) {
        case 'payment':
          response = await getPaymentReport({ session_id: selectedSession });
          break;
        case 'outstanding':
          response = await getOutstandingReport({ session_id: selectedSession });
          break;
        case 'today':
          response = await getTodayCollection();
          break;
        case 'monthly':
          response = await getThisMonthCollection();
          break;
        case 'session-collections':
          response = await getSessionCollections();
          break;
        case 'outstanding-by-class':
          response = await getOutstandingByClass({ session_id: selectedSession });
          break;
        case 'defaulters':
          response = await getDefaulters({ session_id: selectedSession });
          break;
        default:
          response = await getPaymentReport({ session_id: selectedSession });
      }
      setReportData(response.data);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    toast.info('Export feature coming soon!');
  };

  if (generating) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
        <p className="ml-4 text-text-secondary">Generating report...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Reports</h1>
          <p className="text-sm text-text-secondary mt-1">
            Generate and view reports on payments, students, and collections
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={handlePrint} className="btn-outline inline-flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button onClick={handleExport} className="btn-outline inline-flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button onClick={generateReport} className="btn-primary inline-flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="w-48">
          <Select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            options={reportTypes}
          />
        </div>
        {['payment', 'outstanding', 'outstanding-by-class', 'defaulters'].includes(reportType) && (
          <div className="w-48">
            <Select
              value={selectedSession}
              onChange={(e) => setSelectedSession(Number(e.target.value))}
              options={sessions.map((s) => ({
                value: s.id,
                label: s.name,
              }))}
            />
          </div>
        )}
      </div>

      {/* Report Content */}
      {reportData ? (
        <ReportCard reportType={reportType} data={reportData} />
      ) : (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary">No report data</h3>
          <p className="text-sm text-text-secondary mt-1">
            Select a report type and generate to view results
          </p>
          <button onClick={generateReport} className="btn-primary mt-4 inline-flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Generate Report
          </button>
        </div>
      )}
    </div>
  );
};

export default Reports;