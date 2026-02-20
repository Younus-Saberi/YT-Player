import React, { useState } from 'react';
import { FiPlay, FiAlertCircle } from 'react-icons/fi';
import apiService from '../services/api';
import '../styles/Downloader.css';

/**
 * Downloader Component
 * Main component for downloading YouTube videos to MP3
 */
const Downloader = ({ onDownloadAdded, isLoading }) => {
  const [url, setUrl] = useState('');
  const [quality, setQuality] = useState('192');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validateYouTubeUrl = (url) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//;
    return youtubeRegex.test(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (!validateYouTubeUrl(url)) {
      setError('Invalid YouTube URL. Please enter a valid URL from youtube.com or youtu.be');
      return;
    }

    setSubmitting(true);

    try {
      const response = await apiService.createDownload(url, quality);

      if (response.success) {
        setSuccess(`Download queued! Download ID: ${response.download_id}`);
        setUrl('');
        setQuality('192');

        // Notify parent component
        onDownloadAdded({
          id: response.download_id,
          status: 'pending',
          quality: quality,
        });

        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(response.message || 'Failed to create download');
      }
    } catch (err) {
      const errorMessage = err.message || 'Error creating download. Please try again.';
      setError(errorMessage);
      console.error('Download error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
    } catch (err) {
      setError('Failed to paste from clipboard');
    }
  };

  return (
    <div className="downloader-container">
      <h2 className="downloader-title">YouTube to MP3 Converter</h2>
      <p className="downloader-subtitle">Convert YouTube videos to MP3 format</p>

      <form onSubmit={handleSubmit} className="downloader-form">
        {error && (
          <div className="alert alert-error">
            <FiAlertCircle className="alert-icon" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <span>{success}</span>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="youtube-url" className="form-label">
            YouTube URL
          </label>
          <div className="input-wrapper">
            <input
              id="youtube-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
              className="form-input"
              disabled={submitting || isLoading}
            />
            <button
              type="button"
              onClick={handlePaste}
              className="btn-paste"
              disabled={submitting || isLoading}
              title="Paste from clipboard"
            >
              Paste
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Audio Quality</label>
          <div className="quality-grid">
            {['128', '192', '256', '320'].map((q) => (
              <label key={q} className="quality-radio">
                <input
                  type="radio"
                  name="quality"
                  value={q}
                  checked={quality === q}
                  onChange={(e) => setQuality(e.target.value)}
                  disabled={submitting || isLoading}
                />
                <span className={quality === q ? 'selected' : ''}>
                  {q} kbps
                  {q === '192' && ' (Recommended)'}
                </span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-large"
          disabled={submitting || isLoading}
        >
          {submitting ? 'Adding to Queue...' : (
            <>
              <FiPlay className="btn-icon" />
              Add to Queue
            </>
          )}
        </button>
      </form>

      <div className="info-box">
        <h4>How it works:</h4>
        <ol>
          <li>Paste or enter a YouTube URL</li>
          <li>Select your preferred audio quality</li>
          <li>Click "Add to Queue" to start the download</li>
          <li>Downloads process one by one in the background</li>
          <li>Download your MP3 when it's ready!</li>
        </ol>
      </div>
    </div>
  );
};

export default Downloader;
