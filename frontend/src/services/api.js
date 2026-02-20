import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * API Service for YouTube to MP3 Converter
 */
const apiService = {
  /**
   * Create a new download request
   * @param {string} url - YouTube URL
   * @param {string} quality - Audio quality (128, 192, 256, 320)
   * @returns {Promise<Object>} Download response with download_id
   */
  createDownload: async (url, quality = '192') => {
    try {
      const response = await api.post('/download', {
        url,
        quality,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get download status
   * @param {number} downloadId - Download ID
   * @returns {Promise<Object>} Download status
   */
  getDownloadStatus: async (downloadId) => {
    try {
      const response = await api.get(`/download/${downloadId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Download the MP3 file
   * @param {number} downloadId - Download ID
   * @returns {Promise} File download
   */
  downloadFile: async (downloadId) => {
    try {
      const response = await api.get(`/download/${downloadId}/file`, {
        responseType: 'blob',
      });
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Delete a download
   * @param {number} downloadId - Download ID
   * @returns {Promise<Object>} Deletion response
   */
  deleteDownload: async (downloadId) => {
    try {
      const response = await api.delete(`/download/${downloadId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get download history
   * @param {Object} options - Query options
   * @param {string} options.status - Filter by status
   * @param {number} options.limit - Number of records
   * @param {number} options.offset - Offset
   * @returns {Promise<Object>} History data
   */
  getHistory: async (options = {}) => {
    try {
      const response = await api.get('/history', { params: options });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get history statistics
   * @returns {Promise<Object>} Statistics
   */
  getHistoryStats: async () => {
    try {
      const response = await api.get('/history/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get recent downloads
   * @returns {Promise<Object>} Recent downloads
   */
  getRecentDownloads: async () => {
    try {
      const response = await api.get('/history/recent');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Clear history
   * @param {Object} options - Clear options
   * @returns {Promise<Object>} Clear response
   */
  clearHistory: async (options = {}) => {
    try {
      const response = await api.delete('/history/clear', { params: options });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Health check
   * @returns {Promise<Object>} Health status
   */
  healthCheck: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default apiService;
