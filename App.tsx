import React, { useState } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ControlPanel } from './components/ControlPanel';
import { ResultViewer } from './components/ResultViewer';
import { generateSketchFromImage } from './services/geminiService';
import { SketchSettings, SketchStyle, LineWeight, GenerationState } from './types';

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<SketchSettings>({
    style: SketchStyle.PENCIL,
    lineWeight: LineWeight.MEDIUM,
    darkness: 50,
  });

  const [generationState, setGenerationState] = useState<GenerationState>({
    isLoading: false,
    error: null,
    generatedImage: null,
  });

  const handleImageSelected = (base64: string) => {
    setOriginalImage(base64);
    setGenerationState((prev) => ({ ...prev, generatedImage: null, error: null }));
  };

  const handleGenerate = async () => {
    if (!originalImage) return;

    setGenerationState({
      isLoading: true,
      error: null,
      generatedImage: null,
    });

    try {
      const resultImage = await generateSketchFromImage(originalImage, settings);
      setGenerationState({
        isLoading: false,
        error: null,
        generatedImage: resultImage,
      });
    } catch (error: any) {
      setGenerationState({
        isLoading: false,
        error: error.message || "生成素描时出错了。",
        generatedImage: null,
      });
    }
  };

  const handleDownload = () => {
    if (generationState.generatedImage) {
      const link = document.createElement('a');
      link.href = generationState.generatedImage;
      link.download = `sketch-ai-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input and Controls */}
          <div className="lg:col-span-5 space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">1. 上传照片</h2>
              <ImageUploader 
                onImageSelected={handleImageSelected} 
                selectedImage={originalImage} 
              />
            </section>

            <section>
               <h2 className="text-lg font-semibold text-gray-900 mb-3">2. 自定义风格</h2>
              <ControlPanel
                settings={settings}
                onSettingsChange={setSettings}
                onGenerate={handleGenerate}
                isLoading={generationState.isLoading}
                disabled={!originalImage}
              />
            </section>

             {generationState.error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <strong>错误：</strong> {generationState.error}
              </div>
            )}
          </div>

          {/* Right Column: Result */}
          <div className="lg:col-span-7">
             <h2 className="text-lg font-semibold text-gray-900 mb-3">3. 生成结果</h2>
            <ResultViewer
              generatedImage={generationState.generatedImage}
              isLoading={generationState.isLoading}
              onDownload={handleDownload}
            />
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} SketchAI. 基于 Gemini 2.5 Flash Image 构建。
        </div>
      </footer>
    </div>
  );
};

export default App;