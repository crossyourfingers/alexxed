import React, { Fragment, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import "./_style.scss";

import {
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable
} from '@tanstack/react-table'
import { tablePageSizes } from "./ReactTablePagination";
import { caretDown, caretUp } from "./ReactTableSorting";
import { PaginationBar, PrimaryLabel, PrimaryTextSemibold } from "NstyleComponents";
import { checkboxColumn } from "./ReactTableCheckboxes";

export default function ReactTable({ className, columns, data, ...props }) {
    const {
        enableRowCheckboxes = false,
        onRowClick,
        onRowSelect,
        pageOptions = tablePageSizes(data.length),
    } = props;

    const [sorting, setSorting] = useState([]);
    const [rowSelection, setRowSelection] = useState([]);

    const memoizedData = useMemo(() =>
        data?.map((row, index) => ({ index, ...row })), [data]);

    const memoizedColumns = useMemo(() => enableRowCheckboxes ? checkboxColumn.concat(columns) : columns, []);

    const table = useReactTable({
        className,
        columns: memoizedColumns,
        data: memoizedData,
        enableRowSelection: enableRowCheckboxes,
        initialState: { pagination: { pageSize: pageOptions[0] } },
        state: {
            rowSelection,
            sorting
        },
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting
    })

    //pass row data back to parent
    useEffect(() => {
        onRowSelect && onRowSelect(
            table.getSelectedRowModel().flatRows.map((row) => row.original)
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rowSelection])

    return (
        <div className={className} data-testid="react-table">
            <table className="n--table">
                <thead>
                {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                            <TableHeader
                                header={header}
                                key={header.id} />
                        ))}
                    </tr>
                ))}
                </thead>
                <tbody>
                {table.getRowModel().rows.map(row => (
                    <TableRow
                        enableRowCheckboxes={enableRowCheckboxes}
                        onClick={onRowClick}
                        key={row.id}
                        row={row} />
                ))}
                </tbody>
            </table>
            <div>
                <PaginationBar
                    page={table.getState().pagination.pageIndex + 1}
                    pageSize={table.getState().pagination.pageSize}
                    pageSizes={pageOptions}
                    totalItems={data.length}
                    onPageSizeChange={(size) => table.setPageSize(size)}
                    onPageChange={newPage => newPage > table.getState().pagination.pageIndex + 1 ? table.nextPage() : table.previousPage()}
                />
            </div>
        </div>
    )
};

function TableHeader({ header }) {
    const headerClassName = `n--table-header ${header.column.getCanSort() ? 'cursor-pointer' : ''}`
    return (
        <th className={headerClassName} onClick={header.column.getToggleSortingHandler()}>
            {header.isPlaceholder
                ? null
                : (
                    <div className="n--table-header-content">
                        <PrimaryLabel>
                            {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                            )}
                        </PrimaryLabel>
                        {{
                            asc: caretUp,
                            desc: caretDown,
                        }[header.column.getIsSorted()] ?? null}
                    </div>
                )}
        </th>
    )
}

function TableRow({ enableRowCheckboxes, onClick, row }) {
    const rowClassName = `n--table-row ${onClick ? "cursor-pointer" : "cursor-default"}`;

    return (
        <tr key={row.id} className={rowClassName} onClick={() => onClick && onClick(row)}>
            {row.getVisibleCells().map((cell, index) => {
                cell.isFirstDataColumn = false;

                index === 0 && !enableRowCheckboxes
                    ? cell.isFirstDataColumn = true
                    : index === 1 && enableRowCheckboxes
                        ? cell.isFirstDataColumn = true
                        : cell.isFirstDataColumn = false

                onClick !== undefined
                    ? cell.parentRowHasClickFn = true
                    : cell.parentRowHasClickFn = false

                return (
                    <Fragment key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </Fragment>
                )
            })}
        </tr>
    )
}

export function TableCell({ cell, className, children, onClick }) {
    const handleCellClick = (e) => {
        if (onClick !== undefined) {
            //Ignore any `onRowClick` and use the Cell's `onClick` function instead.
            e.stopPropagation();
            onClick(cell);
        }
    };

    const cursorStyle = onClick || cell.parentRowHasClickFn ? "cursor-pointer" : "cursor-default"

    return (
        <td key={cell.id} className={`n--table-cell ${cursorStyle} ${className ? className : ""}`} onClick={handleCellClick}>
            {cell.isFirstDataColumn
                ? <PrimaryTextSemibold>{children}</PrimaryTextSemibold>
                : children
            }
        </td>
    )
}

ReactTable.propTypes = {
    className: PropTypes.string,
    columns: PropTypes.arrayOf(PropTypes.object),
    data: PropTypes.arrayOf(PropTypes.object),
    //...props
    enableRowCheckboxes: PropTypes.bool,
    onRowClick: PropTypes.func,
    onRowSelect: PropTypes.func,
    pageOptions: PropTypes.arrayOf(PropTypes.number),
}

TableHeader.propTypes = {
    header: PropTypes.object
}

TableRow.propTypes = {
    enableRowCheckboxes: PropTypes.bool,
    onClick: PropTypes.func,
    row: PropTypes.object
}

TableCell.propTypes = {
    cell: PropTypes.object,
    children: PropTypes.node,
    className: PropTypes.string,
    onClick: PropTypes.func
}

const defaultPageSize = 10;

export function tablePageSizes(countOfRows) {
    //The first entry in the page sizes will always be 10, calculate the other page sizes based on the number of rows.
    // Round the sizes to the nearest 5th row, so the sizes are divisible by 5.
    // Cap the max size to an arbitrary 100 because having the max at a high number defeats the purpose of paging.
    const baseMaxSize = countOfRows > 100 ? 100 : countOfRows;
    const maxSizeToRoundBy5 = baseMaxSize % 5 > 0 ? (baseMaxSize / 5) + 1 : baseMaxSize / 5;
    const maxSize = Math.round(maxSizeToRoundBy5) * 5;

    const baseMidSize = maxSize % 2 > 0 ? (maxSize / 2) + 1 : maxSize / 2;
    const midSizeToRoundBy5 = baseMidSize % 5 > 0 ? (baseMidSize / 5) + 1 : baseMidSize / 5;
    const midSize = Math.round(midSizeToRoundBy5) * 5;

    // there's a bug in here that we're just gonna work around for right now
    // for example if the countOfRows is 11, then the maxSize is 15, and the midSize is also 15
    // also if the countOfRows is 16 or 17 then the midSize is 10, and the defaultPageSize is also 10
    return midSize === maxSize
        ? [defaultPageSize, maxSize]
        : midSize === defaultPageSize
            ? [defaultPageSize, maxSize]
            : [defaultPageSize, midSize, maxSize]
}