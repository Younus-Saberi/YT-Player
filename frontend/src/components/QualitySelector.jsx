import React from 'react';
import '../styles/QualitySelector.css';

/**
 * QualitySelector Component
 * Allows user to select audio quality
 */
const QualitySelector = ({ selectedQuality, onQualityChange, disabled }) => {
  const qualities = [
    { value: '128', label: '128 kbps', description: 'Low (Small file)' },
    { value: '192', label: '192 kbps', description: 'Normal (Recommended)' },
    { value: '256', label: '256 kbps', description: 'High (Good quality)' },
    { value: '320', label: '320 kbps', description: 'Very High (Best quality)' },
  ];

  return (
    <div className="quality-selector">
      <label className="quality-label">Audio Quality</label>
      <div className="quality-options">
        {qualities.map((quality) => (
          <div key={quality.value} className="quality-option">
            <input
              type="radio"
              id={`quality-${quality.value}`}
              name="quality"
              value={quality.value}
              checked={selectedQuality === quality.value}
              onChange={(e) => onQualityChange(e.target.value)}
              disabled={disabled}
              className="quality-input"
            />
            <label htmlFor={`quality-${quality.value}`} className="quality-choice">
              <span className="quality-value">{quality.label}</span>
              <span className="quality-description">{quality.description}</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QualitySelector;
