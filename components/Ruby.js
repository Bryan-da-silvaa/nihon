import React from 'react';

export default function Ruby({ base, reading, className = '' , children }) {
  if (base && reading) {
    return (
      <ruby className={className}>
        {base}
        <rp>(</rp>
        <rt className="text-xs leading-none align-baseline text-gray-600 dark:text-gray-300">{reading}</rt>
        <rp>)</rp>
      </ruby>
    );
  }

  return <ruby className={className}>{children}</ruby>;
}
