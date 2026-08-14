import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./pagination.module.css";

interface PaginationProps {
  page: number;
  size: number;
  total: number;
  onPageChange: (newPage: number) => void;
  onSizeChange: (newSize: number) => void;
}

export default function Pagination({ page, size, total, onPageChange, onSizeChange }: PaginationProps) {
  const totalPages = Math.ceil(total / size) || 1;
  const startItem = (page - 1) * size + 1;
  const endItem = Math.min(page * size, total);

  return (
    <div className={styles.paginationContainer}>
      <div className={styles.pageInfo}>
        {total > 0 ? `Showing ${startItem}–${endItem} of ${total}` : 'Showing 0 results'}
      </div>
      
      <div className={styles.controls}>
        <button 
          className={styles.button} 
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        <button 
          className={styles.button} 
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className={styles.sizeSelector}>
        <span>Items per page:</span>
        <select 
          className={styles.select}
          value={size} 
          onChange={(e) => {
            onSizeChange(Number(e.target.value));
            onPageChange(1); // Reset to page 1 on size change
          }}
        >
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
    </div>
  );
}
