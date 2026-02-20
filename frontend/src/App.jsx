import React, { useState, useEffect, useCallback } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import Downloader from './components/Downloader';
import ProgressBar from './components/ProgressBar';
import DownloadHistory from './components/DownloadHistory';
import apiService from './services/api';
import './App.css';

/**
 * Main App Component
 * Coordinates all functionality
 */
function App() {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiHealthy, setApiHealthy] = useState(false);
  const [pollIntervals, setPollIntervals] = useState({});

  // Check API health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await apiService.healthCheck();
        setApiHealthy(true);
      } catch (error) {
        console.error('API health check failed:', error);
        setApiHealthy(false);
        // Retry after 5 seconds
        setTimeout(() => {
          checkHealth();
        }, 5000);
      }
    };

    checkHealth();
  }, []);

  // Fetch history on mount and when needed
  const refreshHistory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.getHistory({ limit: 50 });
      if (response.success) {
        setDownloads(response.data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshHistory();
    // Refresh history every 30 seconds
    const interval = setInterval(refreshHistory, 30000);
    return () => clearInterval(interval);
  }, [refreshHistory]);

  // Poll for status updates of pending/processing downloads
  useEffect(() => {
    const pendingDownloads = downloads.filter(
      (d) => d.status === 'pending' || d.status === 'processing'
    );

    pendingDownloads.forEach((download) => {
      // Clear existing interval if any
      if (pollIntervals[download.id]) {
        clearInterval(pollIntervals[download.id]);
      }

      // Poll every 2 seconds
      const interval = setInterval(async () => {
        try {
          const response = await apiService.getDownloadStatus(download.id);
          if (response.success) {
            setDownloads((prev) =>
              prev.map((d) =>
                d.id === download.id ? { ...d, ...response } : d
              )
            );

            // Stop polling if completed or failed
            if (response.status === 'completed' || response.status === 'failed') {
              clearInterval(interval);
              setPollIntervals((prev) => {
                const updated = { ...prev };
                delete updated[download.id];
                return updated;
              });
            }
          }
        } catch (error) {
          console.error('Error fetching download status:', error);
        }
      }, 2000);

      setPollIntervals((prev) => ({ ...prev, [download.id]: interval }));
    });

    return () => {
      Object.values(pollIntervals).forEach((interval) => clearInterval(interval));
    };
  }, [downloads, pollIntervals]);

  const handleDownloadAdded = (newDownload) => {
    setDownloads((prev) => [newDownload, ...prev]);
  };

  const handleDownloadFile = async (downloadId) => {
    try {
      const response = await apiService.downloadFile(downloadId);

      // Get filename from response or use default
      const download = downloads.find((d) => d.id === downloadId);
      const filename = download
        ? `${download.title}.mp3`
        : `download_${downloadId}.mp3`;

      // Create blob and download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentChild.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  const handleDeleteDownload = async (downloadId) => {
    try {
      await apiService.deleteDownload(downloadId);
      setDownloads((prev) => prev.filter((d) => d.id !== downloadId));

      // Clear polling interval if exists
      if (pollIntervals[downloadId]) {
        clearInterval(pollIntervals[downloadId]);
        setPollIntervals((prev) => {
          const updated = { ...prev };
          delete updated[downloadId];
          return updated;
        });
      }
    } catch (error) {
      console.error('Error deleting download:', error);
      alert('Failed to delete download. Please try again.');
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>YouTube to MP3 Converter</h1>
          <p className="header-subtitle">
            {apiHealthy ? (
              <span className="status-online">● Online</span>
            ) : (
              <span className="status-offline">● Offline - Connecting...</span>
            )}
          </p>
        </div>
      </header>

      <main className="app-main">
        <div className="app-container">
          {/* Downloader Section */}
          <section className="section downloader-section">
            <Downloader
              onDownloadAdded={handleDownloadAdded}
              isLoading={loading}
            />
          </section>

          {/* Downloads Queue */}
          {downloads.filter((d) => d.status === 'pending' || d.status === 'processing').length > 0 && (
            <section className="section queue-section">
              <h2 className="section-title">
                Download Queue ({downloads.filter((d) => d.status === 'pending' || d.status === 'processing').length})
              </h2>
              <div className="downloads-list">
                {downloads
                  .filter((d) => d.status === 'pending' || d.status === 'processing')
                  .map((download) => (
                    <ProgressBar
                      key={download.id}
                      download={download}
                      onDownload={handleDownloadFile}
                      onDelete={handleDeleteDownload}
                    />
                  ))}
              </div>
            </section>
          )}

          {/* Recent Completed Downloads */}
          {downloads.filter((d) => d.status === 'completed').length > 0 && (
            <section className="section recent-section">
              <h2 className="section-title">
                Completed Downloads ({downloads.filter((d) => d.status === 'completed').length})
              </h2>
              <div className="downloads-list">
                {downloads
                  .filter((d) => d.status === 'completed')
                  .slice(0, 5)
                  .map((download) => (
                    <ProgressBar
                      key={download.id}
                      download={download}
                      onDownload={handleDownloadFile}
                      onDelete={handleDeleteDownload}
                    />
                  ))}
              </div>
            </section>
          )}

          {/* History Section */}
          <section className="section history-section">
            <DownloadHistory
              downloads={downloads}
              onRefresh={refreshHistory}
              onDelete={handleDeleteDownload}
              onDownload={handleDownloadFile}
            />
          </section>
        </div>
      </main>

      <footer className="app-footer">
        <p>
          YouTube to MP3 Converter © 2024 | All downloads remain private | No data sent to external services
        </p>
      </footer>
    </div>
  );
}

export default App;
