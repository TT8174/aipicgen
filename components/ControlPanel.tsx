import React from 'react';
import { SketchSettings, SketchStyle, LineWeight } from '../types';

interface ControlPanelProps {
  settings: SketchSettings;
  onSettingsChange: (newSettings: SketchSettings) => void;
  onGenerate: () => void;
  isLoading: boolean;
  disabled: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  settings,
  onSettingsChange,
  onGenerate,
  isLoading,
  disabled
}) => {
  
  const handleChange = <K extends keyof SketchSettings>(key: K, value: SketchSettings[K]) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">绘图设置</h2>
        
        {/* Style Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">艺术风格</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(SketchStyle).map((style) => (
              <button
                key={style}
                onClick={() => handleChange('style', style)}
                disabled={disabled || isLoading}
                className={`px-3 py-2 text-sm rounded-lg border text-left transition-all ${
                  settings.style === style
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-medium ring-1 ring-indigo-600'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Line Weight */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">线条粗细</label>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {Object.values(LineWeight).map((weight) => (
              <button
                key={weight}
                onClick={() => handleChange('lineWeight', weight)}
                disabled={disabled || isLoading}
                className={`flex-1 py-1.5 text-sm rounded-md transition-all ${
                  settings.lineWeight === weight
                    ? 'bg-white text-gray-900 shadow-sm font-medium'
                    : 'text-gray-500 hover:text-gray-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {weight.split(' / ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Darkness/Intensity Slider */}
        <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">对比度 / 深度</label>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{settings.darkness}%</span>
            </div>
            <input
                type="range"
                min="0"
                max="100"
                value={settings.darkness}
                onChange={(e) => handleChange('darkness', parseInt(e.target.value))}
                disabled={disabled || isLoading}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            />
             <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>淡雅</span>
                <span>浓重</span>
            </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onGenerate}
          disabled={disabled || isLoading}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white shadow-sm flex items-center justify-center gap-2 transition-all ${
            disabled || isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md active:transform active:scale-95'
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              正在生成...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              生成素描
            </>
          )}
        </button>
      </div>
    </div>
  );
};