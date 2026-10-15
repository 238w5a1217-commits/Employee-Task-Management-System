import React from 'react';

export default function WorkloadBar({ activeCount = 0, max = 3, showLabel = true }) {
  const count = Math.min(max, Math.max(0, activeCount));
  const level = Math.min(3, count);
  const isFull = count >= max;

  return (
    <div className="workload-meter" title={`${count} of ${max} active tasks assigned`}>
      {showLabel && (
        <div className="workload-header">
          <span style={{ color: 'var(--neutral-600)' }}>Capacity ({count}/{max})</span>
          {isFull ? (
            <span className="capacity-chip full">Max Capacity</span>
          ) : (
            <span className="capacity-chip available">{max - count} available</span>
          )}
        </div>
      )}
      <div className="workload-track">
        <div className={`workload-fill level-${level}`} />
      </div>
    </div>
  );
}
