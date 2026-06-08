import React from 'react';

export const Skeleton = ({ variant = 'text', width, height, className = '' }) => {
  const style = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'text' ? '16px' : variant === 'circle' ? '40px' : '150px'),
  };

  return (
    <div 
      className={`skeleton-base skeleton-${variant} ${className}`} 
      style={style}
    />
  );
};

export const CardSkeleton = () => {
  return (
    <div className="skeleton-card">
      <Skeleton variant="rect" height="120px" className="mb-4" />
      <Skeleton variant="text" width="60%" className="mb-2" />
      <Skeleton variant="text" width="40%" />
    </div>
  );
};

export const TableSkeleton = ({ rows = 5 }) => {
  return (
    <div className="skeleton-table">
      <div className="skeleton-table-header">
        <Skeleton variant="text" width="20%" />
        <Skeleton variant="text" width="25%" />
        <Skeleton variant="text" width="15%" />
        <Skeleton variant="text" width="20%" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-table-row">
          <Skeleton variant="text" width="18%" />
          <Skeleton variant="text" width="23%" />
          <Skeleton variant="text" width="12%" />
          <Skeleton variant="text" width="18%" />
        </div>
      ))}
    </div>
  );
};
