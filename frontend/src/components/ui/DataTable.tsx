import React from 'react';
import styles from './DataTable.module.css';

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
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} className={styles.th}>{col.header}</th>
            ))}
            {actions && <th className={styles.th}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.id || i} className={styles.tr}>
              {columns.map(col => (
                <td key={col.key} className={styles.td}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
              {actions && (
                <td className={styles.td}>
                  <div className={styles.actions}>
                    {actions(row)}
                  </div>
                </td>
              )}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} className={styles.td} style={{ textAlign: 'center', padding: '32px' }}>
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
