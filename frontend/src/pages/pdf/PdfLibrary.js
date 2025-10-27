import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { pdfAPI } from '../../services/api';
import { 
  FiDownload, 
  FiTrash2, 
  FiSearch, 
  FiFilter, 
  FiFileText, 
  FiRefreshCw,
  FiCalendar,
  FiHardDrive,
  FiEye,
  FiMoreVertical,
  FiGrid,
  FiList,
  FiX,
  FiCheck,
  FiClock,
  FiTrendingUp,
  FiArchive,
  FiPlus,
  FiMinus
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import './PdfLibrary.css';

const PdfLibrary = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    search: '',
    format: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'generatedAt',
    sortOrder: 'desc'
  });
  
  const [selectedPdfs, setSelectedPdfs] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  // Fetch PDF library with smooth loading
  const { data, isLoading: queryLoading } = useQuery(
    ['pdfLibrary', filters],
    () => pdfAPI.getPdfLibrary(filters),
    {
      onError: (error) => {
        toast.error('Failed to load PDF library');
      },
      keepPreviousData: true
    }
  );

  // Fetch PDF stats
  const { data: statsData } = useQuery(
    'pdfStats',
    () => pdfAPI.getPdfStats(),
    {
      onError: (error) => {
        console.error('Failed to load PDF stats:', error);
      }
    }
  );

  // Bulk delete mutation with smooth feedback
  const bulkDeleteMutation = useMutation(
    (pdfIds) => pdfAPI.bulkDeletePdfs(pdfIds),
    {
      onSuccess: () => {
        toast.success('PDFs deleted successfully', {
          icon: '🗑️',
          duration: 3000,
        });
        queryClient.invalidateQueries('pdfLibrary');
        queryClient.invalidateQueries('pdfStats');
        setSelectedPdfs([]);
      },
      onError: (error) => {
        toast.error('Failed to delete PDFs', {
          icon: '❌',
        });
      }
    }
  );

  // Cleanup mutation
  const cleanupMutation = useMutation(
    () => pdfAPI.cleanupExpiredPdfs(),
    {
      onSuccess: (data) => {
        toast.success(`Cleaned up ${data.data.deletedCount} expired PDFs`, {
          icon: '✨',
        });
        queryClient.invalidateQueries('pdfLibrary');
        queryClient.invalidateQueries('pdfStats');
      },
      onError: (error) => {
        toast.error('Failed to cleanup expired PDFs');
      }
    }
  );

  const pdfs = data?.data?.pdfs || [];
  const pagination = data?.data?.pagination || {};
  const stats = statsData?.data || {};
  const isDataLoading = queryLoading || isLoading;

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleSelectPdf = (pdfId) => {
    setSelectedPdfs(prev => 
      prev.includes(pdfId) 
        ? prev.filter(id => id !== pdfId)
        : [...prev, pdfId]
    );
  };


  const handleBulkDelete = () => {
    if (selectedPdfs.length === 0) {
      toast.error('Please select PDFs to delete');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedPdfs.length} PDF(s)?`)) {
      bulkDeleteMutation.mutate(selectedPdfs);
    }
  };

  const handleDownload = (pdf) => {
    window.open(pdf.fileUrl, '_blank');
  };

  const handleCleanup = () => {
    if (window.confirm('Are you sure you want to cleanup expired PDFs?')) {
      cleanupMutation.mutate();
    }
  };

  // Smooth loading animation
  useEffect(() => {
    if (isDataLoading) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isDataLoading]);

  if (isDataLoading && pdfs.length === 0) {
    return (
      <div className="pdf-library-loading">
        <div className="pdf-loading-content">
          <div className="pdf-loading-spinner">
            <FiFileText className="pdf-loading-icon" />
          </div>
          <h3 className="pdf-loading-title">Loading your PDF library...</h3>
          <p className="pdf-loading-subtitle">Gathering all your beautiful documents</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pdf-library-modern">
      {/* Modern Header */}
      <div className="pdf-header-modern">
        <div className="pdf-header-content">
          <div className="pdf-header-left">
            <div className="pdf-header-icon">
              <FiFileText className="pdf-icon" />
            </div>
            <div className="pdf-header-text">
              <h1 className="pdf-title-modern">PDF Library</h1>
              <p className="pdf-subtitle-modern">
                {stats.totalPdfs || 0} documents • {formatFileSize(stats.totalSize || 0)} total
              </p>
            </div>
          </div>
          
          <div className="pdf-header-actions">
            <div className="pdf-view-toggle">
              <button
                onClick={() => setViewMode('grid')}
                className={`pdf-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                title="Grid View"
              >
                <FiGrid className="pdf-view-icon" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`pdf-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                title="List View"
              >
                <FiList className="pdf-view-icon" />
              </button>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`pdf-filter-btn ${showFilters ? 'active' : ''}`}
              title="Filters"
            >
              <FiFilter className="pdf-filter-icon" />
              <span className="pdf-filter-text">Filters</span>
            </button>
            
            <button
              onClick={handleCleanup}
              disabled={cleanupMutation.isLoading}
              className="pdf-cleanup-btn"
              title="Cleanup Expired PDFs"
            >
              <FiRefreshCw className={`pdf-cleanup-icon ${cleanupMutation.isLoading ? 'spinning' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Modern Stats Cards */}
      <div className="pdf-stats-modern">
        <div className="pdf-stat-card-modern">
          <div className="pdf-stat-icon-modern">
            <FiFileText className="pdf-stat-icon-svg" />
          </div>
          <div className="pdf-stat-content-modern">
            <div className="pdf-stat-number">{stats.totalPdfs || 0}</div>
            <div className="pdf-stat-label-modern">Documents</div>
          </div>
          <div className="pdf-stat-trend">
            <FiTrendingUp className="pdf-trend-icon" />
          </div>
        </div>
        
        <div className="pdf-stat-card-modern">
          <div className="pdf-stat-icon-modern">
            <FiHardDrive className="pdf-stat-icon-svg" />
          </div>
          <div className="pdf-stat-content-modern">
            <div className="pdf-stat-number">{formatFileSize(stats.totalSize || 0)}</div>
            <div className="pdf-stat-label-modern">Storage Used</div>
          </div>
          <div className="pdf-stat-trend">
            <FiArchive className="pdf-trend-icon" />
          </div>
        </div>
        
        <div className="pdf-stat-card-modern">
          <div className="pdf-stat-icon-modern">
            <FiDownload className="pdf-stat-icon-svg" />
          </div>
          <div className="pdf-stat-content-modern">
            <div className="pdf-stat-number">{stats.totalDownloads || 0}</div>
            <div className="pdf-stat-label-modern">Downloads</div>
          </div>
          <div className="pdf-stat-trend">
            <FiTrendingUp className="pdf-trend-icon" />
          </div>
        </div>
        
        <div className="pdf-stat-card-modern">
          <div className="pdf-stat-icon-modern">
            <FiClock className="pdf-stat-icon-svg" />
          </div>
          <div className="pdf-stat-content-modern">
            <div className="pdf-stat-number">
              {stats.lastGenerated ? formatDate(stats.lastGenerated).split(',')[0] : 'Never'}
            </div>
            <div className="pdf-stat-label-modern">Last Created</div>
          </div>
          <div className="pdf-stat-trend">
            <FiCalendar className="pdf-trend-icon" />
          </div>
        </div>
      </div>

      {/* Modern Search & Filters */}
      <div className="pdf-search-modern">
        <div className="pdf-search-container">
          <div className="pdf-search-input-container">
            <FiSearch className="pdf-search-icon" />
            <input
              type="text"
              className="pdf-search-input"
              placeholder="Search your documents..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
            {filters.search && (
              <button
                onClick={() => handleFilterChange('search', '')}
                className="pdf-search-clear"
              >
                <FiX className="pdf-clear-icon" />
              </button>
            )}
          </div>
          
          <div className="pdf-search-actions">
            <select
              className="pdf-sort-select"
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                handleFilterChange('sortBy', sortBy);
                handleFilterChange('sortOrder', sortOrder);
              }}
            >
              <option value="generatedAt-desc">Newest First</option>
              <option value="generatedAt-asc">Oldest First</option>
              <option value="fileName-asc">Name A-Z</option>
              <option value="fileName-desc">Name Z-A</option>
              <option value="fileSize-desc">Largest First</option>
              <option value="fileSize-asc">Smallest First</option>
            </select>
          </div>
        </div>
        
        {showFilters && (
          <div className="pdf-filters-modern">
            <div className="pdf-filters-content">
              <div className="pdf-filter-group-modern">
                <label className="pdf-filter-label-modern">Format</label>
                <select
                  className="pdf-filter-select-modern"
                  value={filters.format}
                  onChange={(e) => handleFilterChange('format', e.target.value)}
                >
                  <option value="">All Formats</option>
                  <option value="A4">A4</option>
                  <option value="Letter">Letter</option>
                </select>
              </div>
              
              <div className="pdf-filter-group-modern">
                <label className="pdf-filter-label-modern">From Date</label>
                <input
                  type="date"
                  className="pdf-filter-date-modern"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </div>
              
              <div className="pdf-filter-group-modern">
                <label className="pdf-filter-label-modern">To Date</label>
                <input
                  type="date"
                  className="pdf-filter-date-modern"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </div>
              
              <button
                onClick={() => {
                  setFilters({
                    page: 1,
                    limit: 12,
                    search: '',
                    format: '',
                    dateFrom: '',
                    dateTo: '',
                    sortBy: 'generatedAt',
                    sortOrder: 'desc'
                  });
                }}
                className="pdf-clear-filters"
              >
                <FiX className="pdf-clear-icon" />
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modern Bulk Actions */}
      {selectedPdfs.length > 0 && (
        <div className="pdf-bulk-modern">
          <div className="pdf-bulk-content">
            <div className="pdf-bulk-info-modern">
              <div className="pdf-bulk-icon">
                <FiCheck className="pdf-check-icon" />
              </div>
              <div className="pdf-bulk-text">
                <span className="pdf-bulk-count">{selectedPdfs.length}</span>
                <span className="pdf-bulk-label">documents selected</span>
              </div>
            </div>
            
            <div className="pdf-bulk-actions-modern">
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isLoading}
                className="pdf-bulk-delete-modern"
              >
                <FiTrash2 className="pdf-bulk-icon-modern" />
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Content Area */}
      <div className="pdf-content-modern">
        {pdfs.length === 0 ? (
          <div className="pdf-empty-modern">
            <div className="pdf-empty-content">
              <div className="pdf-empty-icon-modern">
                <FiFileText className="pdf-empty-svg" />
              </div>
              <h3 className="pdf-empty-title-modern">No documents found</h3>
              <p className="pdf-empty-subtitle-modern">
                {filters.search || filters.format || filters.dateFrom || filters.dateTo
                  ? "Try adjusting your search or filters"
                  : "Create your first invoice to generate a PDF"
                }
              </p>
              {!filters.search && !filters.format && !filters.dateFrom && !filters.dateTo && (
                <button className="pdf-empty-action">
                  <FiPlus className="pdf-empty-plus" />
                  Create Invoice
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className={`pdf-grid-modern ${viewMode}`}>
            {pdfs.map((pdf, index) => (
              <div 
                key={pdf.id} 
                className={`pdf-card-modern ${selectedPdfs.includes(pdf.id) ? 'selected' : ''}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="pdf-card-header">
                  <div className="pdf-card-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedPdfs.includes(pdf.id)}
                      onChange={() => handleSelectPdf(pdf.id)}
                    />
                  </div>
                  
                  <div className="pdf-card-format">
                    <span className="pdf-format-badge-modern">{pdf.format}</span>
                  </div>
                </div>
                
                <div className="pdf-card-body">
                  <div className="pdf-card-icon">
                    <FiFileText className="pdf-card-svg" />
                  </div>
                  
                  <div className="pdf-card-info">
                    <h4 className="pdf-card-title">{pdf.fileName}</h4>
                    <p className="pdf-card-subtitle">
                      {pdf.invoice ? pdf.invoice.invoiceNumber : 'No Invoice'}
                    </p>
                    <div className="pdf-card-meta">
                      <span className="pdf-card-size">{formatFileSize(pdf.fileSize)}</span>
                      <span className="pdf-card-date">{formatDate(pdf.generatedAt)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="pdf-card-footer">
                  <div className="pdf-card-stats">
                    <div className="pdf-card-stat">
                      <FiDownload className="pdf-stat-icon" />
                      <span>{pdf.downloadCount}</span>
                    </div>
                  </div>
                  
                  <div className="pdf-card-actions">
                    <button
                      onClick={() => handleDownload(pdf)}
                      className="pdf-action-modern primary"
                      title="Download PDF"
                    >
                      <FiDownload className="pdf-action-icon" />
                    </button>
                    
                    <button
                      onClick={() => window.open(pdf.fileUrl, '_blank')}
                      className="pdf-action-modern secondary"
                      title="Preview PDF"
                    >
                      <FiEye className="pdf-action-icon" />
                    </button>
                    
                    <button
                      className="pdf-action-modern tertiary"
                      title="More Options"
                    >
                      <FiMoreVertical className="pdf-action-icon" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modern Pagination */}
      {pagination.pages > 1 && (
        <div className="pdf-pagination-modern">
          <div className="pdf-pagination-content">
            <div className="pdf-pagination-info-modern">
              <span className="pdf-pagination-text">
                Showing {((pagination.current - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.current * pagination.limit, pagination.total)} of{' '}
                {pagination.total} documents
              </span>
            </div>
            
            <div className="pdf-pagination-controls">
              <button
                onClick={() => handlePageChange(pagination.current - 1)}
                disabled={pagination.current === 1}
                className="pdf-pagination-btn-modern"
              >
                <FiMinus className="pdf-pagination-icon" />
              </button>
              
              <div className="pdf-pagination-pages">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const pageNum = pagination.current <= 3 
                    ? i + 1 
                    : pagination.current >= pagination.pages - 2
                    ? pagination.pages - 4 + i
                    : pagination.current - 2 + i;
                  
                  if (pageNum < 1 || pageNum > pagination.pages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`pdf-pagination-page ${pageNum === pagination.current ? 'active' : ''}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(pagination.current + 1)}
                disabled={pagination.current === pagination.pages}
                className="pdf-pagination-btn-modern"
              >
                <FiPlus className="pdf-pagination-icon" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfLibrary;
