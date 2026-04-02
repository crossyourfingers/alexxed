import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from './DataTable';
import type { DataTableProps } from './types';

// ============================================================================
// Test Data & Fixtures
// ============================================================================

interface Person {
  id: number;
  name: string;
  email: string;
  age: number;
  department: string;
  status: 'active' | 'inactive';
}

const mockPeople: Person[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', age: 28, department: 'Engineering', status: 'active' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', age: 34, department: 'Marketing', status: 'active' },
  { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', age: 45, department: 'Sales', status: 'inactive' },
  { id: 4, name: 'Diana Prince', email: 'diana@example.com', age: 31, department: 'Engineering', status: 'active' },
  { id: 5, name: 'Eve Davis', email: 'eve@example.com', age: 29, department: 'HR', status: 'active' },
];

const createLargeDataset = (count: number): Person[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Person ${i + 1}`,
    email: `person${i + 1}@example.com`,
    age: 20 + (i % 50),
    department: ['Engineering', 'Marketing', 'Sales', 'HR'][i % 4],
    status: i % 3 === 0 ? 'inactive' : 'active',
  }));
};

// ============================================================================
// Column Definitions
// ============================================================================

const basicColumns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'age', header: 'Age' },
];

const columnsWithCustomCell = [
  { accessorKey: 'name', header: 'Name' },
  { 
    accessorKey: 'email', 
    header: 'Email',
    cell: ({ getValue }: { getValue: () => string }) => (
      <a href={`mailto:${getValue()}`}>{getValue()}</a>
    ),
  },
  { accessorKey: 'age', header: 'Age' },
];

const sortableColumns = [
  { accessorKey: 'name', header: 'Name', enableSorting: true },
  { accessorKey: 'email', header: 'Email', enableSorting: true },
  { accessorKey: 'age', header: 'Age', enableSorting: true },
];

// ============================================================================
// Basic Rendering & Structure
// ============================================================================

describe('DataTable - Basic Rendering', () => {
  it('renders a table with proper semantic HTML structure', () => {
    render(<DataTable data={mockPeople} columns={basicColumns} />);
    
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
    
    // Check for thead, tbody
    expect(table.querySelector('thead')).toBeInTheDocument();
    expect(table.querySelector('tbody')).toBeInTheDocument();
  });

  it('renders table with caption when provided', () => {
    render(
      <DataTable 
        data={mockPeople} 
        columns={basicColumns} 
        caption="Employee Directory"
      />
    );
    
    expect(screen.getByText('Employee Directory')).toBeInTheDocument();
    expect(screen.getByRole('table')).toHaveAccessibleName('Employee Directory');
  });

  it('renders all column headers', () => {
    render(<DataTable data={mockPeople} columns={basicColumns} />);
    
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Email' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Age' })).toBeInTheDocument();
  });

  it('renders column headers with scope="col"', () => {
    render(<DataTable data={mockPeople} columns={basicColumns} />);
    
    const headers = screen.getAllByRole('columnheader');
    headers.forEach(header => {
      expect(header).toHaveAttribute('scope', 'col');
    });
  });

  it('renders all data rows', () => {
    render(<DataTable data={mockPeople} columns={basicColumns} />);
    
    const rows = screen.getAllByRole('row');
    // +1 for header row
    expect(rows).toHaveLength(mockPeople.length + 1);
  });

  it('renders cell data correctly', () => {
    render(<DataTable data={mockPeople} columns={basicColumns} />);
    
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('28')).toBeInTheDocument();
  });

  it('renders custom cell components', () => {
    render(<DataTable data={mockPeople} columns={columnsWithCustomCell} />);
    
    const emailLink = screen.getByRole('link', { name: 'alice@example.com' });
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute('href', 'mailto:alice@example.com');
  });
});

// ============================================================================
// Empty State
// ============================================================================

describe('DataTable - Empty State', () => {
  it('renders empty state when data is empty array', () => {
    render(<DataTable data={[]} columns={basicColumns} />);
    
    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
  });

  it('renders custom empty state message', () => {
    render(
      <DataTable 
        data={[]} 
        columns={basicColumns} 
        emptyStateMessage="No employees found"
      />
    );
    
    expect(screen.getByText('No employees found')).toBeInTheDocument();
  });

  it('empty state should be accessible', () => {
    render(<DataTable data={[]} columns={basicColumns} />);
    
    const emptyState = screen.getByText(/no data available/i).closest('div');
    expect(emptyState).toHaveAttribute('role', 'status');
    expect(emptyState).toHaveAttribute('aria-live', 'polite');
  });

  it('does not render table body rows when empty', () => {
    render(<DataTable data={[]} columns={basicColumns} />);
    
    const tbody = screen.getByRole('table').querySelector('tbody');
    expect(tbody?.querySelectorAll('tr')).toHaveLength(0);
  });
});

// ============================================================================
// Loading State
// ============================================================================

describe('DataTable - Loading State', () => {
  it('renders loading state when isLoading is true', () => {
    render(<DataTable data={[]} columns={basicColumns} isLoading={true} />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('loading state has proper ARIA attributes', () => {
    render(<DataTable data={[]} columns={basicColumns} isLoading={true} />);
    
    const loadingState = screen.getByText(/loading/i).closest('div');
    expect(loadingState).toHaveAttribute('role', 'status');
    expect(loadingState).toHaveAttribute('aria-busy', 'true');
    expect(loadingState).toHaveAttribute('aria-live', 'polite');
  });

  it('renders custom loading message', () => {
    render(
      <DataTable 
        data={[]} 
        columns={basicColumns} 
        isLoading={true}
        loadingMessage="Fetching employees..."
      />
    );
    
    expect(screen.getByText('Fetching employees...')).toBeInTheDocument();
  });

  it('shows loading state even with data present (for refresh scenarios)', () => {
    render(<DataTable data={mockPeople} columns={basicColumns} isLoading={true} />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('hides loading state when isLoading is false', () => {
    const { rerender } = render(
      <DataTable data={mockPeople} columns={basicColumns} isLoading={true} />
    );
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    
    rerender(<DataTable data={mockPeople} columns={basicColumns} isLoading={false} />);
    
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
});

// ============================================================================
// Sorting
// ============================================================================

describe('DataTable - Sorting', () => {
  it('enables sorting when enableSorting is true', () => {
    render(
      <DataTable 
        data={mockPeople} 
        columns={sortableColumns} 
        enableSorting={true}
      />
    );
    
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    expect(nameHeader).toHaveAttribute('aria-sort');
  });

  it('column headers have aria-sort="none" initially', () => {
    render(
      <DataTable 
        data={mockPeople} 
        columns={sortableColumns} 
        enableSorting={true}
      />
    );
    
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    expect(nameHeader).toHaveAttribute('aria-sort', 'none');
  });

  it('sorts ascending on first click', async () => {
    const user = userEvent.setup();
    render(
      <DataTable 
        data={mockPeople} 
        columns={sortableColumns} 
        enableSorting={true}
      />
    );
    
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    await user.click(nameHeader);
    
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    
    const rows = screen.getAllByRole('row');
    const firstDataRow = rows[1]; // Skip header row
    expect(within(firstDataRow).getByText('Alice Johnson')).toBeInTheDocument();
  });

  it('sorts descending on second click', async () => {
    const user = userEvent.setup();
    render(
      <DataTable 
        data={mockPeople} 
        columns={sortableColumns} 
        enableSorting={true}
      />
    );
    
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    await user.click(nameHeader);
    await user.click(nameHeader);
    
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    
    const rows = screen.getAllByRole('row');
    const firstDataRow = rows[1];
    expect(within(firstDataRow).getByText('Eve Davis')).toBeInTheDocument();
  });

  it('clears sort on third click', async () => {
    const user = userEvent.setup();
    render(
      <DataTable 
        data={mockPeople} 
        columns={sortableColumns} 
        enableSorting={true}
      />
    );
    
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    await user.click(nameHeader);
    await user.click(nameHeader);
    await user.click(nameHeader);
    
    expect(nameHeader).toHaveAttribute('aria-sort', 'none');
  });

  it('supports keyboard sorting with Enter key', async () => {
    const user = userEvent.setup();
    render(
      <DataTable 
        data={mockPeople} 
        columns={sortableColumns} 
        enableSorting={true}
      />
    );
    
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    nameHeader.focus();
    await user.keyboard('{Enter}');
    
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
  });

  it('supports keyboard sorting with Space key', async () => {
    const user = userEvent.setup();
    render(
      <DataTable 
        data={mockPeople} 
        columns={sortableColumns} 
        enableSorting={true}
      />
    );
    
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    nameHeader.focus();
    await user.keyboard(' ');
    
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
  });

  it('sortable headers have tabindex="0"', () => {
    render(
      <DataTable 
        data={mockPeople} 
        columns={sortableColumns} 
        enableSorting={true}
      />
    );
    
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    expect(nameHeader).toHaveAttribute('tabindex', '0');
  });

  it('sorts numeric columns correctly', async () => {
    const user = userEvent.setup();
    render(
      <DataTable 
        data={mockPeople} 
        columns={sortableColumns} 
        enableSorting={true}
      />
    );
    
    const ageHeader = screen.getByRole('columnheader', { name: /age/i });
    await user.click(ageHeader);
    
    const rows = screen.getAllByRole('row');
    const firstDataRow = rows[1];
    expect(within(firstDataRow).getByText('28')).toBeInTheDocument();
  });

  it('clears previous column sort when sorting new column', async () => {
    const user = userEvent.setup();
    render(
      <DataTable 
        data={mockPeople} 
        columns={sortableColumns} 
        enableSorting={true}
      />
    );
    
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    const ageHeader = screen.getByRole('columnheader', { name: /age/i });
    
    await user.click(nameHeader);
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    
    await user.click(ageHeader);
    expect(nameHeader).toHaveAttribute('aria-sort', 'none');
    expect(ageHeader).toHaveAttribute('aria-sort', 'ascending');
  });
});

// ============================================================================
// Pagination
// ============================================================================

describe('DataTable - Pagination', () => {
  const manyPeople = createLargeDataset(50);

  it('enables pagination when enablePagination is true', () => {
    render(
      <DataTable 
        data={manyPeople} 
        columns={basicColumns} 
        enablePagination={true}
      />
    );
    
    expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument();
  });

  it('shows only first page of data initially', () => {
    render(
      <DataTable 
        data={manyPeople} 
        columns={basicColumns} 
        enablePagination={true}
      />
    );
    
    const rows = screen.getAllByRole('row');
    // Default page size is 10, +1 for header
    expect(rows).toHaveLength(11);
  });

  it('displays page info (e.g., "1-10 of 50")', () => {
    render(
      <DataTable 
        data={manyPeople} 
        columns={basicColumns} 
        enablePagination={true}
      />
    );
    
    expect(screen.getByText(/1.*10.*50/)).toBeInTheDocument();
  });

  it('navigates to next page on next button click', async () => {
    const user = userEvent.setup();
    render(
      <DataTable 
        data={manyPeople} 
        columns={basicColumns} 
        enablePagination={true}
      />
    );
    
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);
    
    expect(screen.getByText(/11.*20.*50/)).toBeInTheDocument();
  });

  it('navigates to previous page on previous button click', async () => {
    const user = userEvent.setup();
    render(
      <DataTable 
        data={manyPeople} 
        columns={basicColumns} 
        enablePagination={true}
      />
    );
    
    const nextButton = screen.getByRole('button', { name: /next/i });
    const prevButton = screen.getByRole('button', { name: /previous/i });
    
    await user.click(nextButton);
    await user.click(prevButton);
    
    expect(screen.getByText(/1.*10.*50/)).toBeInTheDocument();
  });

  it('disables previous button on first page', () => {
    render(
      <DataTable 
        data={manyPeople} 
        columns={basicColumns} 
        enablePagination={true}
      />
    );
    
    const prevButton = screen.getByRole('button', { name: /previous/i });
    expect(prevButton).toBeDisabled();
  });

  it('disables next button on last page', async () => {
    const user = userEvent.setup();
    render(
      <DataTable 
        data={manyPeople} 
        columns={basicColumns} 
        enablePagination={true}
      />
    );
    
    const nextButton = screen.getByRole('button', { name: /next/i });
    
    // Click next until last page (50 items / 10 per page = 5 pages)
    for (let i = 0; i < 4; i++) {
      await user.click(nextButton);
    }
    
    expect(nextButton).toBeDisabled();
  });

  it('changes page size via select dropdown', async () => {
    const user = userEvent.setup();
    render(
      <DataTable 
        data={manyPeople} 
        columns={basicColumns} 
        enablePagination={true}
      />
    );
    
    const pageSizeSelect = screen.getByRole('combobox', { name: /rows per page/i });
    await user.selectOptions(pageSizeSelect, '25');
    
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(26); // 25 + header
    expect(screen.getByText(/1.*25.*50/)).toBeInTheDocument();
  });

  it('provides default page size options [10, 25, 50]', () => {
    render(
      <DataTable 
        data={manyPeople} 
        columns={basicColumns} 
        enablePagination={true}
      />
    );
    
    const pageSizeSelect = screen.getByRole('combobox', { name: /rows per page/i });
    const options = within(pageSizeSelect).getAllByRole('option');
    
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveValue('10');
    expect(options[1]).toHaveValue('25');
    expect(options[2]).toHaveValue('50');
  });

  it('accepts custom page size options', () => {
    render(
      <DataTable 
        data={manyPeople} 
        columns={basicColumns} 
        enablePagination={true}
        pageSizeOptions={[5, 15, 30]}
      />
    );
    
    const pageSizeSelect = screen.getByRole('combobox', { name: /rows per page/i });
    const options = within(pageSizeSelect).getAllByRole('option');
    
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveValue('5');
    expect(options[1]).toHaveValue('15');
    expect(options[2]).toHaveValue('30');
  });

  it('resets to page 1 when page size changes', async () => {
    const user = userEvent.setup();
    render(
      <DataTable 
        data={manyPeople} 
        columns={basicColumns} 
        enablePagination={true}
      />
    );
    
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);
    expect(screen.getByText(/11.*20.*50/)).toBeInTheDocument();
    
    const pageSizeSelect = screen.getByRole('combobox', { name: /rows per page/i });
    await user.selectOptions(pageSizeSelect, '25');
    
    expect(screen.getByText(/1.*25.*50/)).toBeInTheDocument();
  });

  it('pagination controls have proper ARIA labels', () => {
    render(
      <DataTable 
        data={manyPeople} 
        columns={basicColumns} 
        enablePagination={true}
      />
    );
    
    expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /rows per page/i })).toBeInTheDocument();
  });
});

// ============================================================================
// Row Selection
// ============================================================================

describe('DataTable - Row Selection', () => {
  it('enables row selection when enableRowSelection is true', () => {
    render(
      <DataTable 
        data={mockPeople} 
        columns={basicColumns} 
        enableRowSelection={true}
      />
    );
    
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it('renders checkboxes in leftmost column', () => {
    render(
      <DataTable 
        data={mockPeople} 
        columns={basicColumns} 
        enableRowSelection={true}
      />
    );
    
    const rows = screen.getAllByRole('row');
    const firstDataRow = rows[1];
    const cells = within(firstDataRow).getAllByRole('cell');
    
    // First cell should contain checkbox
    const firstCellCheckbox = within(cells[0]).getByRole('checkbox');
    expect(firstCellCheckbox).toBeInTheDocument();
  });

  it('renders select-all checkbox in header', () => {
    render(
      <DataTable 
        data={mockPeople} 
        columns={basicColumns} 
        enableRowSelection={true}
      />
    );
    
    const headerRow = screen.getAllByRole('row')[0];
    const selectAllCheckbox = within(headerRow).getByRole('checkbox');
    expect(selectAllCheckbox).toBeInTheDocument();
  });

  it('selects individual row on checkbox click', async () => {
    const user = userEvent.setup();
    const onRowSelect = vi.fn();
    
    render(
      <DataTable 
        data={mockPeople} 
        columns={basicColumns} 
        enableRowSelection={true}
        onRowSelect={onRowSelect}
      />
    );
    
    const checkboxes = screen.getAllByRole('checkbox');
    const firstRowCheckbox = checkboxes[1]; // Skip header checkbox
    
    await user.click(firstRowCheckbox);
    
    expect(firstRowCheckbox).toBeChecked();
    expect(onRowSelect).toHaveBeenCalledWith([mockPeople[0]]);
  });

  it('deselects row on second checkbox click', async () => {
    const user = userEvent.setup();
    const onRowSelect = vi.fn();
    
    render(
      <DataTable 
        data={mockPeople} 
        columns={basicColumns} 
        enableRowSelection={true}
        onRowSelect={onRowSelect}
      />
    );
    
    const checkboxes = screen.getAllByRole('checkbox');
    const firstRowCheckbox = checkboxes[1];
    
    await user.click(firstRowCheckbox);
    await user.click(firstRowCheckbox);
    
    expect(firstRowCheckbox).not.toBeChecked();
    expect(onRowSelect).toHaveBeenLastCalledWith([]);
  });

  it('selects all rows on select-all checkbox click', async () => {
    const user = userEvent.setup();
    const onRowSelect = vi.fn();
    
    render(
      <DataTable 
        data={mockPeople} 
        columns={basicColumns} 
        enableRowSelection={true}
        onRowSelect={onRowSelect}
      />
    );
    
    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
    await user.click(selectAllCheckbox);
    
    expect(selectAllCheckbox).toBeChecked();
    expect(onRowSelect).toHaveBeenCalledWith(mockPeople);
    
    // All row checkboxes should be checked
    const rowCheckboxes = screen.getAllByRole('checkbox').slice(1);
    rowCheckboxes.forEach(cb => expect(cb).toBeChecked());
  });

  it('deselects all rows on select-all checkbox second click', async () => {
    const user = userEvent.setup();
    const onRowSelect = vi.fn();
    
    render(
      <DataTable 
        data={mockPeople} 
        columns={basicColumns} 
        enableRowSelection={true}
        onRowSelect={onRowSelect}
      />
    );
    
    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
    await user.click(selectAllCheckbox);
    await user.click(selectAllCheckbox);
    
    expect(selectAllCheckbox).not.toBeChecked();
    expect(onRowSelect).toHaveBeenLastCalledWith([]);
  });

  it('shows indeterminate state when some rows selected', async () => {
    const user = userEvent.setup();
    
    render(
      <DataTable 
        data={mockPeople} 
        columns={basicColumns} 
        enableRowSelection={true}
      />
    );
    
    const selectAllCheckbox = screen.getAllByRole('checkbox')[0] as HTMLInputElement;
    const firstRowCheckbox = screen.getAllByRole('checkbox')[1];
    
    await user.click(firstRowCheckbox);
    
    expect(selectAllCheckbox.indeterminate).toBe(true);
  });

  it('row checkboxes have proper ARIA labels', () => {
    render(
      <DataTable 
        data={mockPeople} 
        columns={basicColumns} 
        enableRowSelection={true}
      />
    );
    
    const checkboxes = screen.getAllByRole('checkbox');
    const selectAllCheckbox = checkboxes[0];
    
    expect(selectAllCheckbox).toHaveAccessibleName(/select all/i);
  });

  it('maintains selection across pagination', async () => {
    const user = userEvent.setup();
    const manyPeople = createLargeDataset(30);
    
    render(
      <DataTable 
        data={manyPeople} 
        columns={basicColumns} 
        enableRowSelection={true}
        enablePagination={true}
      />
    );
    
    // Select first row on page 1
    const firstRowCheckbox = screen.getAllByRole('checkbox')[1];
    await user.click(firstRowCheckbox);
    expect(firstRowCheckbox).toBeChecked();
    
    // Navigate to page 2
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);
    
    // Navigate back to page 1
    const prevButton = screen.getByRole('button', { name: /previous/i });
    await user.click(prevButton);
    
    // First row should still be selected
    const firstRowCheckboxAgain = screen.getAllByRole('checkbox')[1];
    expect(firstRowCheckboxAgain).toBeChecked();
  });
});

// ============================================================================
// Row Click Handling
// ============================================================================

describe('DataTable - Row Click', () => {
  it('calls onRowClick when row is clicked', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    
    render(
      <DataTable 
        data={mockPeople} 
        columns={basicColumns} 
        onRowClick={onRowClick}
      />
    );
    
    const rows = screen.getAllByRole('row');
    const firstDataRow = rows[1];
    await user.click(firstDataRow);
    
    expect(onRowClick).toHaveBeenCalledWith(mockPeople[0], expect.anything());
  });

  it('does not call onRowClick when checkbox is clicked', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    
    render(
      <DataTable 
        data={mockPeople} 
        columns={basicColumns} 
        enableRowSelection={true}
        onRowClick={onRowClick}
      />
    );
    
    const checkboxes = screen.getAllByRole('checkbox');
    const firstRowCheckbox = checkboxes[1];
    
    await user.click(firstRowCheckbox);
    
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('does not call onRowClick when cell with custom onClick is clicked', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    const onCellClick = vi.fn();
    
    const columnsWithCellClick = [
      { accessorKey: 'name', header: 'Name' },
      { 
        accessorKey: 'email', 
        header: 'Email',
        cell: ({ getValue }: { getValue: () => string }) => (
          <button onClick={onCellClick}>{getValue()}</button>
        ),
      },
      { accessorKey: 'age', header: 'Age' },
    ];
    
    render(
      <DataTable 
        data={mockPeople} 
        columns={columnsWithCellClick} 
        onRowClick={onRowClick}
      />
    );
    
    const emailButton = screen.getByRole('button', { name: 'alice@example.com' });
    await user.click(emailButton);
    
    expect(onCellClick).toHaveBeenCalled();
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('adds cursor pointer styling when onRowClick is provided', () => {
    render(
      <DataTable 
        data={mockPeople} 
        columns={basicColumns} 
        onRowClick={vi.fn()}
      />
    );
    
    const rows = screen.getAllByRole('row');
    const firstDataRow = rows[1];
    
    expect(firstDataRow).toHaveStyle({ cursor: 'pointer' });
  });

  it('supports keyboard row activation with Enter', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    
    render(
      <DataTable 
        data={mockPeople} 
        columns={basicColumns} 
        onRowClick={onRowClick}
      />
    );
    
    const rows = screen.getAllByRole('row');
    const firstDataRow = rows[1];
    
    firstDataRow.focus();
    await user.keyboard('{Enter}');
    
    expect(onRowClick).toHaveBeenCalledWith(mockPeople[0], expect.anything());
  });

  it('clickable rows have tabindex="0"', () => {
    render(
      <DataTable 
        data={mockPeople} 
        columns={basicColumns} 
        onRowClick={vi.fn()}
      />
    );
    
    const rows = screen.getAllByRole('row');
    const firstDataRow = rows[1];
    
    expect(firstDataRow).toHaveAttribute('tabindex', '0');
  });
});

// ============================================================================
// Virtualization
// ============================================================================

describe('DataTable - Virtualization', () => {
  const largeDataset = createLargeDataset(500);

  it('enables virtualization when enableVirtualization is true', () => {
    render(
      <DataTable 
        data={largeDataset} 
        columns={basicColumns} 
        enableVirtualization={true}
      />
    );
    
    const table = screen.getByRole('table');
    const scrollContainer = table.closest('[data-virtualized="true"]');
    expect(scrollContainer).toBeInTheDocument();
  });

  it('auto-enables virtualization for datasets > 100 rows', () => {
    render(
      <DataTable 
        data={largeDataset} 
        columns={basicColumns} 
      />
    );
    
    const table = screen.getByRole('table');
    const scrollContainer = table.closest('[data-virtualized="true"]');
    expect(scrollContainer).toBeInTheDocument();
  });

  it('renders only visible rows when virtualized', () => {
    render(
      <DataTable 
        data={largeDataset} 
        columns={basicColumns} 
        enableVirtualization={true}
      />
    );
    
    const rows = screen.getAllByRole('row');
    // Should render header + virtual window (not all 500 rows)
    expect(rows.length).toBeLessThan(100);
  });

  it('virtual rows have position absolute styling', () => {
    render(
      <DataTable 
        data={largeDataset} 
        columns={basicColumns} 
        enableVirtualization={true}
      />
    );
    
    const rows = screen.getAllByRole('row');
    const firstDataRow = rows[1];
    
    expect(firstDataRow).toHaveStyle({ position: 'absolute' });
  });

  it('renders correct rows after scrolling', async () => {
    const user = userEvent.setup();
    
    render(
      <DataTable 
        data={largeDataset} 
        columns={basicColumns} 
        enableVirtualization={true}
      />
    );
    
    const table = screen.getByRole('table');
    const scrollContainer = table.closest('[data-virtualized="true"]') as HTMLElement;
    
    // Simulate scroll
    scrollContainer.scrollTop = 1000;
    scrollContainer.dispatchEvent(new Event('scroll'));
    
    await waitFor(() => {
      // Should now show rows around the scrolled position
      expect(screen.queryByText('Person 1')).not.toBeInTheDocument();
      expect(screen.getByText(/Person \d+/)).toBeInTheDocument();
    });
  });

  it('virtualized table maintains proper total height', () => {
    render(
      <DataTable 
        data={largeDataset} 
        columns={basicColumns} 
        enableVirtualization={true}
      />
    );
    
    const table = screen.getByRole('table');
    const scrollContainer = table.closest('[data-virtualized="true"]') as HTMLElement;
    
    // Should have significant height to accommodate virtual scrolling
    const height = parseInt(window.getComputedStyle(scrollContainer).height);
    expect(height).toBeGreaterThan(100);
  });

  it('works with pagination and virtualization together', () => {
    render(
      <DataTable 
        data={largeDataset} 
        columns={basicColumns} 
        enableVirtualization={true}
        enablePagination={true}
      />
    );
    
    // Should show paginated subset, virtualized
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeLessThan(largeDataset.length);
    
    expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument();
  });
});

// ============================================================================
// Accessibility
// ============================================================================

describe('DataTable - Accessibility', () => {
  it('table has role="table"', () => {
    render(<DataTable data={mockPeople} columns={basicColumns} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('column headers have role="columnheader"', () => {
    render(<DataTable data={mockPeople} columns={basicColumns} />);
    expect(screen.getAllByRole('columnheader').length).toBe(basicColumns.length);
  });

  it('data rows have role="row"', () => {
    render(<DataTable data={mockPeople} columns={basicColumns} />);
    // +1 for header row
    expect(screen.getAllByRole('row').length).toBe(mockPeople.length + 1);
  });

  it('data cells have role="cell"', () => {
    render(<DataTable data={mockPeople} columns={basicColumns} />);
    const cells = screen.getAllByRole('cell');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('supports keyboard navigation through rows', async () => {
    const user = userEvent.setup();
    render(
      <DataTable 
        data={mockPeople} 
        columns={basicColumns} 
        onRowClick={vi.fn()}
      />
    );
    
    const rows = screen.getAllByRole('row');
    const firstDataRow = rows[1];
    const secondDataRow = rows[2];
    
    firstDataRow.focus();
    expect(document.activeElement).toBe(firstDataRow);
    
    await user.keyboard('{Tab}');
    // Focus should move within table structure
  });

  it('screen readers can navigate table structure', () => {
    render(<DataTable data={mockPeople} columns={basicColumns} caption="Test Table" />);
    
    const table = screen.getByRole('table');
    expect(table).toHaveAccessibleName('Test Table');
    
    const headers = screen.getAllByRole('columnheader');
    headers.forEach(header => {
      expect(header).toHaveAttribute('scope', 'col');
    });
  });

  it('loading state is announced to screen readers', () => {
    render(<DataTable data={[]} columns={basicColumns} isLoading={true} />);
    
    const loadingState = screen.getByText(/loading/i).closest('div');
    expect(loadingState).toHaveAttribute('aria-live', 'polite');
  });

  it('empty state is announced to screen readers', () => {
    render(<DataTable data={[]} columns={basicColumns} />);
    
    const emptyState = screen.getByText(/no data available/i).closest('div');
    expect(emptyState).toHaveAttribute('aria-live', 'polite');
  });

  it('sort direction is announced via aria-sort', async () => {
    const user = userEvent.setup();
    render(
      <DataTable 
        data={mockPeople} 
        columns={sortableColumns} 
        enableSorting={true}
      />
    );
    
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    
    expect(nameHeader).toHaveAttribute('aria-sort', 'none');
    
    await user.click(nameHeader);
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    
    await user.click(nameHeader);
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
  });
});

// ============================================================================
// Column Resizing
// ============================================================================

describe('DataTable - Column Resizing', () => {
  const resizableColumns = [
    { accessorKey: 'name', header: 'Name', enableResizing: true },
    { accessorKey: 'email', header: 'Email', enableResizing: true },
    { accessorKey: 'age', header: 'Age', enableResizing: true },
  ];

  it('enables column resizing when enableColumnResizing is true', () => {
    render(
      <DataTable 
        data={mockPeople} 
        columns={resizableColumns} 
        enableColumnResizing={true}
      />
    );
    
    const headers = screen.getAllByRole('columnheader');
    headers.forEach(header => {
      const resizeHandle = header.querySelector('[data-resize-handle]');
      expect(resizeHandle).toBeInTheDocument();
    });
  });

  it('resize handles are positioned on the right edge of headers', () => {
    render(
      <DataTable 
        data={mockPeople} 
        columns={resizableColumns} 
        enableColumnResizing={true}
      />
    );
    
    const headers = screen.getAllByRole('columnheader');
    const firstHeader = headers[0];
    const resizeHandle = firstHeader.querySelector('[data-resize-handle]') as HTMLElement;
    
    expect(resizeHandle).toHaveStyle({ position: 'absolute' });
    expect(resizeHandle).toHaveStyle({ right: '0' });
  });

  it('resizes column on mouse drag', async () => {
    const user = userEvent.setup();
    render(
      <DataTable 
        data={mockPeople} 
        columns={resizableColumns} 
        enableColumnResizing={true}
      />
    );
    
    const headers = screen.getAllByRole('columnheader');
    const nameHeader = headers[0];
    const resizeHandle = nameHeader.querySelector('[data-resize-handle]') as HTMLElement;
    
    const initialWidth = nameHeader.getBoundingClientRect().width;
    
    // Simulate drag to the right
    await user.pointer([
      { keys: '[MouseLeft>]', target: resizeHandle },
      { coords: { x: 100, y: 0 } },
      { keys: '[/MouseLeft]' },
    ]);
    
    const newWidth = nameHeader.getBoundingClientRect().width;
    expect(newWidth).toBeGreaterThan(initialWidth);
  });

  it('respects minimum column width', async () => {
    const user = userEvent.setup();
    const columnsWithMinWidth = [
      { accessorKey: 'name', header: 'Name', enableResizing: true, minSize: 100 },
      { accessorKey: 'email', header: 'Email', enableResizing: true },
    ];
    
    render(
      <DataTable 
        data={mockPeople} 
        columns={columnsWithMinWidth} 
        enableColumnResizing={true}
      />
    );
    
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    const resizeHandle = nameHeader.querySelector('[data-resize-handle]') as HTMLElement;
    
    // Try to drag far to the left (make it very small)
    await user.pointer([
      { keys: '[MouseLeft>]', target: resizeHandle },
      { coords: { x: -500, y: 0 } },
      { keys: '[/MouseLeft]' },
    ]);
    
    const width = nameHeader.getBoundingClientRect().width;
    expect(width).toBeGreaterThanOrEqual(100);
  });

  it('respects maximum column width', async () => {
    const user = userEvent.setup();
    const columnsWithMaxWidth = [
      { accessorKey: 'name', header: 'Name', enableResizing: true, maxSize: 300 },
      { accessorKey: 'email', header: 'Email', enableResizing: true },
    ];
    
    render(
      <DataTable 
        data={mockPeople} 
        columns={columnsWithMaxWidth} 
        enableColumnResizing={true}
      />
    );
    
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    const resizeHandle = nameHeader.querySelector('[data-resize-handle]') as HTMLElement;
    
    // Try to drag far to the right (make it very large)
    await user.pointer([
      { keys: '[MouseLeft>]', target: resizeHandle },
      { coords: { x: 1000, y: 0 } },
      { keys: '[/MouseLeft]' },
    ]);
    
    const width = nameHeader.getBoundingClientRect().width;
    expect(width).toBeLessThanOrEqual(300);
  });

  it('shows resize cursor on hover over resize handle', async () => {
    const user = userEvent.setup();
    render(
      <DataTable 
        data={mockPeople} 
        columns={resizableColumns} 
        enableColumnResizing={true}
      />
    );
    
    const headers = screen.getAllByRole('columnheader');
    const resizeHandle = headers[0].querySelector('[data-resize-handle]') as HTMLElement;
    
    await user.hover(resizeHandle);
    
    expect(resizeHandle).toHaveStyle({ cursor: 'col-resize' });
  });

  it('allows keyboard resizing with arrow keys', async () => {
    const user = userEvent.setup();
    render(
      <DataTable 
        data={mockPeople} 
        columns={resizableColumns} 
        enableColumnResizing={true}
      />
    );
    
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    const resizeHandle = nameHeader.querySelector('[data-resize-handle]') as HTMLElement;
    
    resizeHandle.focus();
    const initialWidth = nameHeader.getBoundingClientRect().width;
    
    // Press right arrow to increase width
    await user.keyboard('{ArrowRight}');
    await user.keyboard('{ArrowRight}');
    
    const newWidth = nameHeader.getBoundingClientRect().width;
    expect(newWidth).toBeGreaterThan(initialWidth);
  });

  it('resize handles have proper ARIA attributes', () => {
    render(
      <DataTable 
        data={mockPeople} 
        columns={resizableColumns} 
        enableColumnResizing={true}
      />
    );
    
    const headers = screen.getAllByRole('columnheader');
    const resizeHandle = headers[0].querySelector('[data-resize-handle]') as HTMLElement;
    
    expect(resizeHandle).toHaveAttribute('role', 'separator');
    expect(resizeHandle).toHaveAttribute('aria-orientation', 'vertical');
    expect(resizeHandle).toHaveAttribute('tabindex', '0');
  });

  it('persists column widths when data updates', () => {
    const { rerender } = render(
      <DataTable 
        data={mockPeople} 
        columns={resizableColumns} 
        enableColumnResizing={true}
      />
    );
    
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    // Simulate user resizing (would normally set state)
    nameHeader.style.width = '200px';
    
    const updatedData = [...mockPeople, { 
      id: 6, 
      name: 'New Person', 
      email: 'new@example.com', 
      age: 25,
      department: 'Engineering',
      status: 'active' as const
    }];
    
    rerender(
      <DataTable 
        data={updatedData} 
        columns={resizableColumns} 
        enableColumnResizing={true}
      />
    );
    
    const updatedHeader = screen.getByRole('columnheader', { name: /name/i });
    expect(updatedHeader.style.width).toBe('200px');
  });

  it('double-click on resize handle auto-fits column', async () => {
    const user = userEvent.setup();
    render(
      <DataTable 
        data={mockPeople} 
        columns={resizableColumns} 
        enableColumnResizing={true}
      />
    );
    
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    const resizeHandle = nameHeader.querySelector('[data-resize-handle]') as HTMLElement;
    
    await user.dblClick(resizeHandle);
    
    // Should fit content (implementation-specific, just verify it changes)
    const width = nameHeader.getBoundingClientRect().width;
    expect(width).toBeGreaterThan(0);
  });

  it('disables resizing for specific columns when enableResizing is false', () => {
    const mixedColumns = [
      { accessorKey: 'name', header: 'Name', enableResizing: true },
      { accessorKey: 'email', header: 'Email', enableResizing: false },
      { accessorKey: 'age', header: 'Age', enableResizing: true },
    ];
    
    render(
      <DataTable 
        data={mockPeople} 
        columns={mixedColumns} 
        enableColumnResizing={true}
      />
    );
    
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    const emailHeader = screen.getByRole('columnheader', { name: /email/i });
    
    expect(nameHeader.querySelector('[data-resize-handle]')).toBeInTheDocument();
    expect(emailHeader.querySelector('[data-resize-handle]')).not.toBeInTheDocument();
  });

  it('works with virtualization enabled', () => {
    const largeDataset = createLargeDataset(500);
    
    render(
      <DataTable 
        data={largeDataset} 
        columns={resizableColumns} 
        enableColumnResizing={true}
        enableVirtualization={true}
      />
    );
    
    const headers = screen.getAllByRole('columnheader');
    headers.forEach(header => {
      expect(header.querySelector('[data-resize-handle]')).toBeInTheDocument();
    });
  });
});

// ============================================================================
// Filtering
// ============================================================================

describe('DataTable - Filtering', () => {
  const filterableColumns = [
    { accessorKey: 'name', header: 'Name', enableColumnFilter: true },
    { accessorKey: 'email', header: 'Email', enableColumnFilter: true },
    { accessorKey: 'department', header: 'Department', enableColumnFilter: true },
    { accessorKey: 'age', header: 'Age', enableColumnFilter: false },
  ];

  it('enables filtering when enableFiltering is true', () => {
    render(
      <DataTable 
        data={mockPeople} 
        columns={filterableColumns} 
        enableFiltering={true}
      />
    );
    
    expect(screen.getByRole('searchbox', { name: /filter/i })).toBeInTheDocument();
  });

  it('shows global search input above table', () => {
    render(
      <DataTable 
        data={mockPeople} 
        columns={filterableColumns} 
        enableFiltering={true}
      />
    );
    
    const searchInput = screen.getByRole('searchbox', { name: /filter/i });
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('type', 'search');
    expect(searchInput).toHaveAttribute('placeholder');
  });

  it('filters rows based on global search term', async () => {
    const user = userEvent.setup();
    render(
      <DataTable 
        data={mockPeople} 
        columns={filterableColumns} 
        enableFiltering={true}
      />
    );
    
    const searchInput = screen.getByRole('searchbox', { name: /filter/i });
    await user.type(searchInput, 'Alice');
    
    // Should only show Alice Johnson
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();
    expect(screen.queryByText('Charlie Brown')).not.toBeInTheDocument();
  });

  it('global filter is case-insensitive by default', async () => {
    const user = userEvent.setup();
    render(
      <DataTable 
        data={mockPeople} 
        columns={filterableColumns} 
        enableFiltering={true}
      />
    );
    
    const searchInput = screen.getByRole('searchbox', { name: /filter/i });
    await user.type(searchInput, 'alice');
    
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
  });

  it('global filter searches across all filterable columns', async () => {
    const user = userEvent.setup();
    render(
      <DataTable 
        data={mockPeople} 
        columns={filterableColumns} 
        enableFiltering={true}
      />
    );
    
    const searchInput = screen.getByRole('searchbox', { name: /filter/i });
    
    // Search by email
    await user.clear(searchInput);
    await user.type(searchInput, 'bob@example.com');
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    
    // Search by department
    await user.clear(searchInput);
    await user.type(searchInput, 'Engineering');
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('Diana Prince')).toBeInTheDocument();
  });

  it('shows column-specific filter inputs when enableColumnFilter is true', () => {
    render(
      <DataTable 
        data={mockPeople} 
        columns={filterableColumns} 
        enableFiltering={true}
      />
    );
    
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    const filterInput = within(nameHeader).getByRole('textbox');
    expect(filterInput).toBeInTheDocument();
  });

  it('filters by specific column', async () => {
    const user = userEvent.setup();
    render(
      <DataTable 
        data={mockPeople} 
        columns={filterableColumns} 
        enableFiltering={true}
      />
    );
    
    const departmentHeader = screen.getByRole('columnheader', { name: /department/i });
    const filterInput = within(departmentHeader).getByRole('textbox');
    
    await user.type(filterInput, 'Engineering');
    
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('Diana Prince')).toBeInTheDocument();
    expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();
  });

  it('combines global and column filters (AND logic)', async () => {
    const user = userEvent.setup();
    render(
      <DataTable 
        data={mockPeople} 
        columns={filterableColumns} 
        enableFiltering={true}
      />
    );
    
    const globalSearch = screen.getByRole('searchbox', { name: /filter/i });
    await user.type(globalSearch, 'alice');
    
    const departmentHeader = screen.getByRole('columnheader', { name: /department/i });
    const columnFilter = within(departmentHeader).getByRole('textbox');
    await user.type(columnFilter, 'Engineering');
    
    // Should only show Alice (matches both filters)
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.queryByText('Diana Prince')).not.toBeInTheDocument();
  });

  it('clears filters when search input is cleared', async () => {
    const user = userEvent.setup();
    render(
      <DataTable 
        data={mockPeople} 
        columns={filterableColumns} 
        enableFiltering={true}
      />
    );
    
    const searchInput = screen.getByRole('searchbox', { name: /filter/i });
    await user.type(searchInput, 'Alice');
    expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();
    
    await user.clear(searchInput);
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
  });

  it('shows "no results" message when filters match nothing', async () => {
    const user = userEvent.setup();
    render(
      <DataTable 
        data={mockPeople} 
        columns={filterableColumns} 
        enableFiltering={true}
      />
    );
    
    const searchInput = screen.getByRole('searchbox', { name: /filter/i });
    await user.type(searchInput, 'NonexistentPerson');
    
    expect(screen.getByText(/no results found/i)).toBeInTheDocument();
  });

  it('updates filter count display', async () => {
    const user = userEvent.setup();
    render(
      <DataTable 
        data={mockPeople} 
        columns={filterableColumns} 
        enableFiltering={true}
      />
    );
    
    const searchInput = screen.getByRole('searchbox', { name: /filter/i });
    await user.type(searchInput, 'Engineering');
    
    // Should show filtered count
    expect(screen.getByText(/2.*5/)).toBeInTheDocument(); // 2 of 5
  });

  it('resets pagination to page 1 when filter changes', async () => {
    const user = userEvent.setup();
    const manyPeople = createLargeDataset(50);
    
    render(
      <DataTable 
        data={manyPeople} 
        columns={filterableColumns} 
        enableFiltering={true}
        enablePagination={true}
      />
    );
    
    // Navigate to page 2
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);
    expect(screen.getByText(/11.*20/)).toBeInTheDocument();
    
    // Apply filter
    const searchInput = screen.getByRole('searchbox', { name: /filter/i });
    await user.type(searchInput, 'Person 1');
    
    // Should reset to page 1
    expect(screen.getByText(/1.*10/)).toBeInTheDocument();
  });

  it('maintains selection when filtering', async () => {
    const user = userEvent.setup();
    const onRowSelect = vi.fn();
    
    render(
      <DataTable 
        data={mockPeople} 
        columns={filterableColumns} 
        enableFiltering={true}
        enableRowSelection={true}
        onRowSelect={onRowSelect}
      />
    );
    
    // Select Alice
    const checkboxes = screen.getAllByRole('checkbox');
    const aliceCheckbox = checkboxes[1];
    await user.click(aliceCheckbox);
    
    // Filter to show only Alice
    const searchInput = screen.getByRole('searchbox', { name: /filter/i });
    await user.type(searchInput, 'Alice');
    
    // Alice should still be selected
    const visibleCheckboxes = screen.getAllByRole('checkbox');
    expect(visibleCheckboxes[1]).toBeChecked();
  });

  it('filter inputs have proper ARIA labels', () => {
    render(
      <DataTable 
        data={mockPeople} 
        columns={filterableColumns} 
        enableFiltering={true}
      />
    );
    
    const globalSearch = screen.getByRole('searchbox', { name: /filter/i });
    expect(globalSearch).toHaveAttribute('aria-label');
    
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    const columnFilter = within(nameHeader).getByRole('textbox');
    expect(columnFilter).toHaveAttribute('aria-label');
  });

  it('supports custom filter function for columns', async () => {
    const user = userEvent.setup();
    const columnsWithCustomFilter = [
      { 
        accessorKey: 'name', 
        header: 'Name',
        enableColumnFilter: true,
        filterFn: (row: Person, _columnId: string, filterValue: string) => {
          // Custom: only match if starts with filter value
          return row.name.toLowerCase().startsWith(filterValue.toLowerCase());
        },
      },
      { accessorKey: 'email', header: 'Email' },
    ];
    
    render(
      <DataTable 
        data={mockPeople} 
        columns={columnsWithCustomFilter} 
        enableFiltering={true}
      />
    );
    
    const searchInput = screen.getByRole('searchbox', { name: /filter/i });
    await user.type(searchInput, 'Ali');
    
    // Should match Alice (starts with Ali)
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    // Should NOT match Charlie (doesn't start with Ali)
    expect(screen.queryByText('Charlie Brown')).not.toBeInTheDocument();
  });

  it('debounces filter input to avoid excessive re-renders', async () => {
    const user = userEvent.setup();
    const largeDataset = createLargeDataset(1000);
    
    render(
      <DataTable 
        data={largeDataset} 
        columns={filterableColumns} 
        enableFiltering={true}
      />
    );
    
    const searchInput = screen.getByRole('searchbox', { name: /filter/i });
    
    // Type quickly
    await user.type(searchInput, 'Person');
    
    // Should eventually show filtered results (debounced)
    await waitFor(() => {
      expect(screen.queryByText('Person 1')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('shows clear filter button when filter is active', async () => {
    const user = userEvent.setup();
    render(
      <DataTable 
        data={mockPeople} 
        columns={filterableColumns} 
        enableFiltering={true}
      />
    );
    
    const searchInput = screen.getByRole('searchbox', { name: /filter/i });
    await user.type(searchInput, 'Alice');
    
    const clearButton = screen.getByRole('button', { name: /clear filter/i });
    expect(clearButton).toBeInTheDocument();
    
    await user.click(clearButton);
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
  });

  it('works with sorting and pagination together', async () => {
    const user = userEvent.setup();
    const manyPeople = createLargeDataset(50);
    
    render(
      <DataTable 
        data={manyPeople} 
        columns={[
          { accessorKey: 'name', header: 'Name', enableSorting: true, enableColumnFilter: true },
          { accessorKey: 'age', header: 'Age', enableSorting: true },
        ]} 
        enableFiltering={true}
        enableSorting={true}
        enablePagination={true}
      />
    );
    
    // Filter
    const searchInput = screen.getByRole('searchbox', { name: /filter/i });
    await user.type(searchInput, 'Person 1');
    
    // Sort
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    await user.click(nameHeader);
    
    // Change page size
    const pageSizeSelect = screen.getByRole('combobox', { name: /rows per page/i });
    await user.selectOptions(pageSizeSelect, '25');
    
    // All features should work together
    expect(screen.getByText(/Person 1/)).toBeInTheDocument();
  });
});

// ============================================================================
// Responsive Design
// ============================================================================

describe('DataTable - Responsive Design', () => {
  it('renders table with overflow-x auto for horizontal scrolling', () => {
    render(<DataTable data={mockPeople} columns={basicColumns} />);
    
    const tableWrapper = screen.getByRole('table').parentElement;
    expect(tableWrapper).toHaveStyle({ overflowX: 'auto' });
  });

  it('table adapts to container width', () => {
    render(<DataTable data={mockPeople} columns={basicColumns} />);
    
    const table = screen.getByRole('table');
    expect(table).toHaveStyle({ width: '100%' });
  });

  it('columns have minimum width to prevent crushing', () => {
    render(<DataTable data={mockPeople} columns={basicColumns} />);
    
    const headers = screen.getAllByRole('columnheader');
    headers.forEach(header => {
      const styles = window.getComputedStyle(header);
      const minWidth = parseInt(styles.minWidth);
      expect(minWidth).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// Integration Scenarios
// ============================================================================

describe('DataTable - Integration Scenarios', () => {
  it('handles all features together: sorting + pagination + selection', async () => {
    const user = userEvent.setup();
    const manyPeople = createLargeDataset(30);
    const onRowSelect = vi.fn();
    
    render(
      <DataTable 
        data={manyPeople} 
        columns={sortableColumns} 
        enableSorting={true}
        enablePagination={true}
        enableRowSelection={true}
        onRowSelect={onRowSelect}
      />
    );
    
    // Sort by name
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    await user.click(nameHeader);
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    
    // Select a row
    const firstRowCheckbox = screen.getAllByRole('checkbox')[1];
    await user.click(firstRowCheckbox);
    expect(onRowSelect).toHaveBeenCalled();
    
    // Change page size
    const pageSizeSelect = screen.getByRole('combobox', { name: /rows per page/i });
    await user.selectOptions(pageSizeSelect, '25');
    expect(screen.getByText(/1.*25.*30/)).toBeInTheDocument();
  });

  it('integrates with SpacetimeDB pattern: [rows, isLoading]', () => {
    // Simulate SpacetimeDB hook return
    const [rows, isLoading] = [mockPeople, false];
    
    render(
      <DataTable 
        data={rows} 
        columns={basicColumns} 
        isLoading={isLoading}
      />
    );
    
    expect(screen.getAllByRole('row').length).toBe(rows.length + 1);
  });

  it('handles data updates gracefully', () => {
    const { rerender } = render(
      <DataTable data={mockPeople} columns={basicColumns} />
    );
    
    const updatedPeople = [...mockPeople, { 
      id: 6, 
      name: 'Frank Miller', 
      email: 'frank@example.com', 
      age: 40, 
      department: 'Legal',
      status: 'active' as const
    }];
    
    rerender(<DataTable data={updatedPeople} columns={basicColumns} />);
    
    expect(screen.getByText('Frank Miller')).toBeInTheDocument();
    expect(screen.getAllByRole('row').length).toBe(updatedPeople.length + 1);
  });

  it('maintains performance with frequent updates', () => {
    const { rerender } = render(
      <DataTable data={mockPeople} columns={basicColumns} />
    );
    
    // Simulate 10 rapid updates
    for (let i = 0; i < 10; i++) {
      const updatedData = mockPeople.map(p => ({ ...p, age: p.age + i }));
      rerender(<DataTable data={updatedData} columns={basicColumns} />);
    }
    
    // Should still render correctly
    expect(screen.getAllByRole('row').length).toBe(mockPeople.length + 1);
  });
});

// ============================================================================
// Edge Cases & Error Handling
// ============================================================================

describe('DataTable - Edge Cases', () => {
  it('handles single row dataset', () => {
    const singlePerson = [mockPeople[0]];
    render(<DataTable data={singlePerson} columns={basicColumns} />);
    
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(2); // header + 1 data row
  });

  it('handles single column dataset', () => {
    const singleColumn = [{ accessorKey: 'name', header: 'Name' }];
    render(<DataTable data={mockPeople} columns={singleColumn} />);
    
    expect(screen.getAllByRole('columnheader')).toHaveLength(1);
  });

  it('handles missing data properties gracefully', () => {
    const incompleteData = [
      { id: 1, name: 'Alice' }, // missing email, age
    ];
    
    render(<DataTable data={incompleteData as any} columns={basicColumns} />);
    
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('handles null values in cells', () => {
    const dataWithNulls = [
      { id: 1, name: 'Alice', email: null, age: 28 },
    ];
    
    render(<DataTable data={dataWithNulls as any} columns={basicColumns} />);
    
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('handles undefined values in cells', () => {
    const dataWithUndefined = [
      { id: 1, name: 'Alice', email: undefined, age: 28 },
    ];
    
    render(<DataTable data={dataWithUndefined as any} columns={basicColumns} />);
    
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('handles very long cell content', () => {
    const longContent = [
      { 
        id: 1, 
        name: 'A'.repeat(200), 
        email: 'test@example.com', 
        age: 28 
      },
    ];
    
    render(<DataTable data={longContent} columns={basicColumns} />);
    
    expect(screen.getByText('A'.repeat(200))).toBeInTheDocument();
  });

  it('handles special characters in cell content', () => {
    const specialChars = [
      { 
        id: 1, 
        name: '<script>alert("xss")</script>', 
        email: 'test@example.com', 
        age: 28 
      },
    ];
    
    render(<DataTable data={specialChars} columns={basicColumns} />);
    
    // Should escape HTML
    expect(screen.getByText('<script>alert("xss")</script>')).toBeInTheDocument();
  });

  it('handles extremely large datasets (stress test)', () => {
    const massiveDataset = createLargeDataset(10000);
    
    render(
      <DataTable 
        data={massiveDataset} 
        columns={basicColumns} 
        enableVirtualization={true}
        enablePagination={true}
      />
    );
    
    // Should still render without crashing
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('handles rapid prop changes', () => {
    const { rerender } = render(
      <DataTable data={mockPeople} columns={basicColumns} />
    );
    
    // Rapid prop changes
    rerender(<DataTable data={mockPeople} columns={basicColumns} isLoading={true} />);
    rerender(<DataTable data={mockPeople} columns={basicColumns} isLoading={false} />);
    rerender(<DataTable data={[]} columns={basicColumns} />);
    rerender(<DataTable data={mockPeople} columns={basicColumns} />);
    
    expect(screen.getAllByRole('row').length).toBe(mockPeople.length + 1);
  });
});

// ============================================================================
// TypeScript Type Safety (Compile-time tests)
// ============================================================================

describe('DataTable - Type Safety', () => {
  it('enforces generic type for data and columns', () => {
    // This test primarily validates at compile-time
    const typedColumns: DataTableProps<Person>['columns'] = [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'email', header: 'Email' },
      // @ts-expect-error - invalid accessor key
      { accessorKey: 'invalid', header: 'Invalid' },
    ];
    
    // Runtime check just to have a valid test
    expect(typedColumns).toBeDefined();
  });

  it('provides correct types in cell render function', () => {
    const columnWithTypedCell: DataTableProps<Person>['columns'][0] = {
      accessorKey: 'age',
      header: 'Age',
      cell: ({ getValue, row }) => {
        const age: number = getValue() as number;
        const person: Person = row.original;
        return <span>{age} - {person.name}</span>;
      },
    };
    
    expect(columnWithTypedCell).toBeDefined();
  });
});
