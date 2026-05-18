/**
 * Model Selector Dropdown
 * 
 * 显示可用模型列表，允许切换当前使用的模型。
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Bot, Check, Sparkles, ChevronRight, Settings } from "lucide-react";

interface Model {
  id: string;
  name: string;
  provider: string;
  description?: string;
  isAvailable?: boolean;
  isFavorite?: boolean;
}

interface ModelSelectorDropdownProps {
  anchorBounds: { x: number; y: number; width: number; height: number };
  onClose: () => void;
  onSelectModel: (modelId: string) => void;
  onManageModels: () => void;
  currentModel?: string;
  models?: Model[];
}

export const ModelSelectorDropdown: React.FC<ModelSelectorDropdownProps> = ({
  anchorBounds,
  onClose,
  onSelectModel,
  onManageModels,
  currentModel = "default",
  models: initialModels,
}) => {
  const [models, setModels] = useState<Model[]>(initialModels || []);
  const [loading, setLoading] = useState(!initialModels);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load models if not provided
  useEffect(() => {
    if (!initialModels) {
      loadModels();
    }
  }, [initialModels]);

  const loadModels = async () => {
    try {
      setLoading(true);
      // Fetch models via IPC
      const result = await window.hermesAPI.listModels?.();
      if (result) {
        const formatted = result.map((m: { id: string; name: string; provider: string }) => ({
          id: m.id,
          name: m.name,
          provider: m.provider,
          isAvailable: true,
        }));
        setModels(formatted);
      }
    } catch (err) {
      console.error("[ModelSelector] Failed to load models:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter models by search query
  const filteredModels = models.filter((model) =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.provider.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group models by provider
  const groupedModels = filteredModels.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, Model[]>);

  // Handle model selection
  const handleSelect = useCallback((modelId: string) => {
    if (modelId !== currentModel) {
      onSelectModel(modelId);
    }
    onClose();
  }, [currentModel, onSelectModel, onClose]);

  // Calculate position
  const getPosition = () => {
    const dropdownWidth = 320;
    const dropdownHeight = Math.min(models.length * 50 + 140, 480);
    
    let x = anchorBounds.x;
    let y = anchorBounds.y + anchorBounds.height + 8;
    
    // Ensure dropdown stays within window bounds
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    if (x + dropdownWidth > windowWidth) {
      x = windowWidth - dropdownWidth - 16;
    }
    
    if (y + dropdownHeight > windowHeight) {
      y = anchorBounds.y - dropdownHeight - 8;
    }
    
    return { x, y, width: dropdownWidth };
  };

  const position = getPosition();

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div
      ref={dropdownRef}
      className="fixed z-50 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        width: position.width,
        maxHeight: 480,
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Select Model
        </span>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <input
          type="text"
          placeholder="Search models..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Model List */}
      <div className="max-h-72 overflow-y-auto py-1">
        {loading ? (
          <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
            <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
            Loading models...
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
            {searchQuery ? "No models match your search" : "No models found"}
          </div>
        ) : (
          Object.entries(groupedModels).map(([provider, providerModels]) => (
            <div key={provider}>
              <div className="px-4 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {provider}
              </div>
              {providerModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleSelect(model.id)}
                  className={`
                    w-full px-4 py-2.5 flex items-center gap-3 text-left
                    transition-colors duration-150
                    ${model.id === currentModel 
                      ? "bg-blue-50 dark:bg-blue-900/20" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }
                  `}
                >
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center
                    ${model.id === currentModel 
                      ? "bg-blue-500 text-white" 
                      : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    }
                  `}>
                    {model.isFavorite ? (
                      <Sparkles size={14} />
                    ) : (
                      <Bot size={16} />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className={`
                      text-sm font-medium truncate
                      ${model.id === currentModel 
                        ? "text-blue-600 dark:text-blue-400" 
                        : "text-gray-900 dark:text-gray-100"
                      }
                    `}>
                      {model.name}
                    </div>
                    {model.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {model.description}
                      </div>
                    )}
                  </div>
                  
                  {model.id === currentModel && (
                    <Check size={16} className="text-blue-500" />
                  )}
                </button>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-2">
        <button
          onClick={() => { onManageModels(); onClose(); }}
          className="w-full px-3 py-2 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Settings size={16} />
          Manage Models
        </button>
      </div>
    </div>
  );
};

export default ModelSelectorDropdown;
