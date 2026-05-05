import React from 'react';
import { HistoryItem } from '../App';

interface HistoryPreviewProps {
  historyItems: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
}

export function HistoryPreview({ historyItems, onSelect }: HistoryPreviewProps) {
  if (!historyItems || historyItems.length === 0) return null;

  return (
    <div className="mt-6 w-full">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-800 pb-2 mb-3">
        Recent Prompts
      </h3>
      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
        {historyItems.slice(0, 5).map((item, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(item)}
            className="text-left w-full p-3 rounded-xl border border-gray-100 dark:border-gray-800/60 bg-white/50 dark:bg-gray-800/30 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-200 group flex flex-col gap-1.5"
          >
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate w-full">
              {item.input}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 uppercase tracking-widest">
                {item.mode}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate w-full">
                {item.output}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
