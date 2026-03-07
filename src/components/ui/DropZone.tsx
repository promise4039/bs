// 엑셀 파일 드래그앤드롭 영역

import { useState, useRef, useCallback } from 'react';
import type { DragEvent } from 'react';

export interface DropZoneProps {
  onFileDrop: (file: File) => void;
  accept?: string;
  children?: React.ReactNode;
}

export function DropZone({
  onFileDrop,
  accept = '.xlsx,.xls',
  children,
}: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        onFileDrop(file);
      }
    },
    [onFileDrop],
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileDrop(file);
      }
      // input 값 초기화 (같은 파일 재선택 허용)
      e.target.value = '';
    },
    [onFileDrop],
  );

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-[16px] p-8 text-center cursor-pointer transition-colors ${
        isDragOver
          ? 'border-accent bg-accent/5'
          : 'border-border-secondary hover:border-text-tertiary'
      }`}
    >
      {/* 숨겨진 파일 input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />

      {children ?? (
        <div className="flex flex-col items-center gap-3">
          {/* 파일 아이콘 */}
          <div className="text-4xl text-text-tertiary">
            📄
          </div>
          <p className="text-text-secondary text-sm">
            엑셀 파일을 드래그하거나 클릭하세요
          </p>
          <p className="text-text-tertiary text-xs">
            .xlsx, .xls 파일 지원
          </p>
        </div>
      )}
    </div>
  );
}
