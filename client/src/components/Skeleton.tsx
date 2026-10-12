import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ width, height = 16, className = '', style }) => (
  <div
    className={`skeleton ${className}`}
    style={{ width, height, ...style }}
  />
);

export const TicketTableSkeleton: React.FC = () => (
  <div className="ticket-table-container">
    <div className="ticket-table-toolbar">
      <div style={{ display: 'flex', gap: 8 }}>
        <Skeleton width={110} height={30} />
        <Skeleton width={110} height={30} />
      </div>
      <Skeleton width={100} height={30} />
    </div>
    <table className="table">
      <thead>
        <tr>
          {['ID', 'Subject', 'Requester', 'Assignee', 'Priority', 'Status', 'Created'].map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 6 }).map((_, i) => (
          <tr key={i} style={{ cursor: 'default' }}>
            <td><Skeleton width={60} /></td>
            <td><Skeleton width={200} /></td>
            <td><Skeleton width={100} /></td>
            <td><Skeleton width={90} /></td>
            <td><Skeleton width={60} /></td>
            <td><Skeleton width={70} /></td>
            <td><Skeleton width={80} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const MetricsSkeleton: React.FC = () => (
  <div className="metrics-row" style={{ marginBottom: 24 }}>
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="metric-item">
        <Skeleton width={80} height={11} style={{ marginBottom: 10 }} />
        <Skeleton width={60} height={26} />
        <Skeleton width={100} height={11} style={{ marginTop: 6 }} />
      </div>
    ))}
  </div>
);

