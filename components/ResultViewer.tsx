import React from 'react';

interface ResultViewerProps {
  generatedImage: string | null;
  isLoading: boolean;
  onDownload: () => void;
}

export const ResultViewer: React.FC<ResultViewerProps> = ({ generatedImage, isLoading, onDownload }) => {
  if (isLoading) {
    return (
        <div className="w-full h-full min-h-[400px] bg-gray-50 rounded-xl border border-gray-200 flex flex-col items-center justify-center p-8 text-center animate-pulse">
            <div className="w-16 h-16 bg-gray-200 rounded-full mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            <p className="mt-8 text-sm text-gray-500">Gemini 正在为您绘制素描...</p>
        </div>
    );
  }

  if (!generatedImage) {
    return (
      <div className="w-full h-full min-h-[400px] bg-gray-50 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        </div>
        <h3 className="text-gray-900 font-medium">暂无素描</h3>
        <p className="text-gray-500 text-sm mt-1">上传图片并点击生成，见证奇迹时刻。</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full rounded-xl overflow-hidden border border-gray-200 shadow-lg bg-white">
        <img
          src={generatedImage}
          alt="Generated Sketch"
          className="w-full h-auto object-contain max-h-[600px] mx-auto"
        />
      </div>
      <div className="flex justify-end">
        <button
          onClick={onDownload}
          className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          下载素描
        </button>
      </div>
    </div>
  );
};