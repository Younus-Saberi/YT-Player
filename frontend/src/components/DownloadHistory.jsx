import React, { useState, useEffect } from 'react';
import { FiChevronDown, FiChevronUp, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import apiService from '../services/api';
import '../styles/DownloadHistory.css';

/**
 * DownloadHistory Component
 * Display download history and statistics
 */
const DownloadHistory = ({ downloads, onRefresh, onDelete, onDownload }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (isExpanded) {
      loadStats();
    }
  }, [isExpanded]);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const response = await apiService.getHistoryStats();
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const filteredDownloads = filterStatus === 'all'
    ? downloads
    : downloads.filter(d => d.status === filterStatus);

  const handleClearOld = async () => {
    if (window.confirm('Delete completed downloads older than 7 days?')) {
      try {
        const response = await apiService.clearHistory({ older_than_days: 7 });
        if (response.success) {
          onRefresh();
          loadStats();
        }
      } catch (error) {
        console.error('Error clearing history:', error);
      }
    }
  };

  return (
    <div className="history-container">
      <button
        className="history-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="history-title">
          {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
          Download History ({downloads.length})
        </span>
      </button>

      {isExpanded && (
        <div className="history-content">
          {/* Statistics Section */}
          {stats && (
            <div className="history-stats">
              <div className="stat-card">
                <div className="stat-value">{stats.total_downloads}</div>
                <div className="stat-label">Total Downloads</div>
              </div>
              <div className="stat-card success">
                <div className="stat-value">{stats.completed_downloads}</div>
                <div className="stat-label">Completed</div>
              </div>
              <div className="stat-card error">
                <div className="stat-value">{stats.failed_downloads}</div>
                <div className="stat-label">Failed</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{formatFileSize(stats.total_data_processed)}</div>
                <div className="stat-label">Total Data</div>
              </div>
            </div>
          )}

          {/* Filter and Actions */}
          <div className="history-controls">
            <div className="filter-group">
              <label>Filter by status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="processing">Processing</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <button
              className="btn btn-secondary"
              onClick={loadStats}
              disabled={loadingStats}
            >
              <FiRefreshCw /> Refresh Stats
            </button>
            <button
              className="btn btn-danger"
              onClick={handleClearOld}
            >
              <FiTrash2 /> Clear Old Files
            </button>
          </div>

          {/* Downloads List */}
          <div className="history-list">
            {filteredDownloads.length === 0 ? (
              <p className="empty-message">No downloads found</p>
            ) : (
              filteredDownloads.map((download) => (
                <div key={download.id} className={`history-item status-${download.status}`}>
                  <div className="history-item-header">
                    <div className="history-item-info">
                      <h5>{download.title}</h5>
                      <p className="history-meta">
                        <span className="status-badge">{download.status}</span>
                        <span>{download.quality} kbps</span>
                        {download.file_size && (
                          <span>{formatFileSize(download.file_size)}</span>
                        )}
                      </p>
                    </div>
                    <div className="history-item-date">
                      {download.completed_at ? (
                        <>
                          <small>{formatDate(download.completed_at)}</small>
                        </>
                      ) : (
                        <>
                          <small>{formatDate(download.created_at)}</small>
                        </>
                      )}
                    </div>
                  </div>

                  {download.error_message && (
                    <div className="history-error">
                      <p>{download.error_message}</p>
                    </div>
                  )}

                  <div className="history-actions">
                    {download.status === 'completed' && (
                      <button
                        className="btn btn-small btn-primary"
                        onClick={() => onDownload(download.id)}
                      >
                        Download
                      </button>
                    )}
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => {
                        if (window.confirm('Delete this download?')) {
                          onDelete(download.id);
                        }
                      }}
                    >
                      <FiTrash2 /> Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DownloadHistory;
