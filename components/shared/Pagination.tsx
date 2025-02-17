"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const getPageNumbers = () => {
    const pages = [];
    const showEllipsis = totalPages > 7;
    
    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    pages.push(1);
    
    if (currentPage > 3) {
      pages.push('ellipsis1');
    }
    
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (currentPage < totalPages - 2) {
      pages.push('ellipsis2');
    }
    
    pages.push(totalPages);
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-center space-x-2">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`p-2 rounded-full ${
          currentPage === 1
            ? 'text-theme-secondary-alpha/50 cursor-not-allowed'
            : 'text-theme-primary hover:bg-black/50'
        }`}
      >
        <ChevronLeft className="w-5 h-5" />
      </motion.button>

      {pageNumbers.map((page, index) => {
        if (page === 'ellipsis1' || page === 'ellipsis2') {
          return (
            <div key={`ellipsis${index}`} className="px-2">
              <MoreHorizontal className="w-5 h-5 text-theme-secondary" />
            </div>
          );
        }

        const isCurrentPage = page === currentPage;

        return (
          <motion.button
            key={page}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onPageChange(page as number)}
            className="relative"
          >
            {isCurrentPage && (
              <motion.div
                layoutId="pageBackground"
                className="absolute inset-0 bg-background rounded-full"
                initial={false}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className={`relative z-10 w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium
              ${isCurrentPage 
                ? 'text-white bg-green-500/50' 
                : 'text-theme-primary hover:bg-black/90'
              }`}
            >
              {page}
            </span>
          </motion.button>
        );
      })}

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`p-2 rounded-full ${
          currentPage === totalPages
            ? 'text-theme-secondary-alpha/50 cursor-not-allowed'
            : 'text-theme-primary hover:bg-theme-highlight-alpha/20'
        }`}
      >
        <ChevronRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}