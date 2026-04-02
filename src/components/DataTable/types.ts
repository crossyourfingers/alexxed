import type { ColumnDef, SortingState, RowSelectionState } from '@tanstack/react-table';

export interface DataTableProps<TData> {
  /** Array of data objects to display */
  data: TData[];
  
  /** Column definitions using TanStack Table column API */
  columns: ColumnDef<TData, any>[];
  
  /** Optional table caption for accessibility */
  caption?: string;
  
  /** Loading state (integrates with SpacetimeDB) */
  isLoading?: boolean;
  
  /** Custom loading message */
  loadingMessage?: string;
  
  /** Custom empty state message */
  emptyStateMessage?: string;
  
  /** Enable column sorting */
  enableSorting?: boolean;
  
  /** Enable pagination */
  enablePagination?: boolean;
  
  /** Page size options for pagination */
  pageSizeOptions?: number[];
  
  /** Enable row selection with checkboxes */
  enableRowSelection?: boolean;
  
  /** Callback when row selection changes */
  onRowSelect?: (selectedRows: TData[]) => void;
  
  /** Callback when row is clicked */
  onRowClick?: (row: TData, event: React.MouseEvent<HTMLTableRowElement>) => void;
  
  /** Enable virtualization (auto-enabled for >100 rows) */
  enableVirtualization?: boolean;
  
  /** Enable column resizing */
  enableColumnResizing?: boolean;
  
  /** Enable filtering (global and column-specific) */
  enableFiltering?: boolean;
  
  /** Custom CSS class name */
  className?: string;
}

export interface DataTablePaginationProps {
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  totalRows: number;
  canPreviousPage: boolean;
  canNextPage: boolean;
  previousPage: () => void;
  nextPage: () => void;
  setPageSize: (size: number) => void;
  pageSizeOptions: number[];
}

export interface DataTableCellProps<TData> {
  row: TData;
  columnId: string;
  value: any;
}

export interface DataTableEmptyStateProps {
  message?: string;
}

export interface DataTableLoadingStateProps {
  message?: string;
}
