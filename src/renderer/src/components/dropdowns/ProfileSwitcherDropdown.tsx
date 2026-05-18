/**
 * Profile Switcher Dropdown
 * 
 * 显示可用 Profile 列表，允许切换当前 Profile。
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { User, Check, ChevronRight, Settings, Plus } from "lucide-react";

interface Profile {
  id: string;
  name: string;
  displayName: string;
  icon?: string;
  description?: string;
  isActive?: boolean;
  isRunning?: boolean;
}

interface ProfileSwitcherDropdownProps {
  anchorBounds: { x: number; y: number; width: number; height: number };
  onClose: () => void;
  onSelectProfile: (profileId: string) => void;
  onManageProfiles: () => void;
  onCreateProfile: () => void;
  currentProfile: string;
  profiles?: Profile[];
}

export const ProfileSwitcherDropdown: React.FC<ProfileSwitcherDropdownProps> = ({
  anchorBounds,
  onClose,
  onSelectProfile,
  onManageProfiles,
  onCreateProfile,
  currentProfile,
  profiles: initialProfiles,
}) => {
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles || []);
  const [loading, setLoading] = useState(!initialProfiles);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load profiles if not provided
  useEffect(() => {
    if (!initialProfiles) {
      loadProfiles();
    }
  }, [initialProfiles]);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      // Fetch profiles via IPC
      const result = await window.hermesAPI.listProfiles?.();
      if (result) {
        const formatted = result.map((p: { name: string; displayName?: string }) => ({
          id: p.name,
          name: p.name,
          displayName: p.displayName || p.name,
          isActive: p.name === currentProfile,
        }));
        setProfiles(formatted);
      }
    } catch (err) {
      console.error("[ProfileSwitcher] Failed to load profiles:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle profile selection
  const handleSelect = useCallback((profileId: string) => {
    if (profileId !== currentProfile) {
      onSelectProfile(profileId);
    }
    onClose();
  }, [currentProfile, onSelectProfile, onClose]);

  // Calculate position
  const getPosition = () => {
    const dropdownWidth = 280;
    const dropdownHeight = Math.min(profiles.length * 44 + 120, 400);
    
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
        maxHeight: 400,
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Switch Profile
        </span>
      </div>

      {/* Profile List */}
      <div className="max-h-64 overflow-y-auto py-1">
        {loading ? (
          <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
            <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
            Loading profiles...
          </div>
        ) : profiles.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
            No profiles found
          </div>
        ) : (
          profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => handleSelect(profile.id)}
              className={`
                w-full px-4 py-2.5 flex items-center gap-3 text-left
                transition-colors duration-150
                ${profile.isActive 
                  ? "bg-blue-50 dark:bg-blue-900/20" 
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }
              `}
            >
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center
                ${profile.isActive 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                }
              `}>
                <User size={16} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className={`
                  text-sm font-medium truncate
                  ${profile.isActive 
                    ? "text-blue-600 dark:text-blue-400" 
                    : "text-gray-900 dark:text-gray-100"
                  }
                `}>
                  {profile.displayName}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {profile.isRunning ? "Running" : "Stopped"}
                </div>
              </div>
              
              {profile.isActive && (
                <Check size={16} className="text-blue-500" />
              )}
              
              <ChevronRight size={14} className="text-gray-400" />
            </button>
          ))
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-2 space-y-1">
        <button
          onClick={() => { onCreateProfile(); onClose(); }}
          className="w-full px-3 py-2 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Create New Profile
        </button>
        
        <button
          onClick={() => { onManageProfiles(); onClose(); }}
          className="w-full px-3 py-2 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Settings size={16} />
          Manage Profiles
        </button>
      </div>
    </div>
  );
};

export default ProfileSwitcherDropdown;
