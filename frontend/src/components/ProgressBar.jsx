import React, { useEffect } from 'react';
import { FiDownload, FiCheck, FiAlertCircle, FiClock } from 'react-icons/fi';
import '../styles/ProgressBar.css';

/**
 * ProgressBar Component
 * Display download progress and status
 */
const ProgressBar = ({ download, onDownload, onDelete }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FiCheck className="status-icon success" />;
      case 'failed':
        return <FiAlertCircle className="status-icon error" />;
      case 'processing':
        return <FiClock className="status-icon processing" />;
      default:
        return <FiClock className="status-icon pending" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return 'Completed!';
      case 'failed':
        return 'Failed';
      case 'processing':
        return 'Processing...';
      case 'pending':
        return 'Pending...';
      default:
        return 'Unknown';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownload = () => {
    onDownload(download.id);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this download?')) {
      onDelete(download.id);
    }
  };

  return (
    <div className={`progress-item status-${download.status}`}>
      <div className="progress-header">
        <div className="progress-info">
          {getStatusIcon(download.status)}
          <div className="progress-details">
            <h4 className="progress-title">{download.title || 'Loading...'}</h4>
            <p className="progress-quality">Quality: {download.quality} kbps</p>
            {download.file_size && (
              <p className="progress-size">Size: {formatFileSize(download.file_size)}</p>
            )}
          </div>
        </div>
        <span className="progress-status">{getStatusLabel(download.status)}</span>
      </div>

      <div className="progress-bar-container">
        <div
          className="progress-bar-fill"
          style={{ width: `${download.progress_percentage || 0}%` }}
        ></div>
      </div>

      {download.error_message && (
        <div className="error-message">
          <p>{download.error_message}</p>
        </div>
      )}

      <div className="progress-actions">
        {download.status === 'completed' && (
          <button className="btn btn-primary" onClick={handleDownload}>
            <FiDownload /> Download MP3
          </button>
        )}
        <button className="btn btn-danger" onClick={handleDelete}>
          Delete
        </button>
      </div>
    </div>
  );
};

export default ProgressBar;
