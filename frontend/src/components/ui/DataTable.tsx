import React from 'react';

interface Column {
  key: string;
  header: string;
  render?: (row: any) => React.ReactNode;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  actions?: (row: any) => React.ReactNode;
}

export const DataTable: React.FC<DataTableProps> = ({ data, columns, actions }) => {
  return (
    <div style={{ 
      width: '100%', 
      overflowX: 'auto',
      backgroundColor: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '12px'
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            {columns.map((col) => (
              <th key={col.key} style={{ 
                padding: '16px 24px', 
                fontSize: '13px', 
                fontWeight: 600, 
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {col.header}
              </th>
            ))}
            {actions && <th style={{ padding: '16px 24px' }}></th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} style={{ 
              borderBottom: rowIndex === data.length - 1 ? 'none' : '1px solid var(--color-border)',
              transition: 'background-color 0.2s ease',
            }}>
              {columns.map((col) => (
                <td key={col.key} style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--color-text)' }}>
                  {col.render ? col.render(row) : (row as any)[col.key]}
                </td>
              ))}
              {actions && (
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  {actions(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
