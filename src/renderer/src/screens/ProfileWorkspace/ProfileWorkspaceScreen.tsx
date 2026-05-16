import { useState, useEffect } from "react";
import { useI18n } from "../../components/useI18n";
import type { ProfileSummary, ProfileSkillSummary } from "../../../../shared/profile-runtime/profile-runtime-contract";
import {
  User,
  Puzzle,
  FileText,
} from "../../assets/icons";

interface ProfileWorkspaceScreenProps {
  profileId: string;
}

export function ProfileWorkspaceScreen({ profileId }: ProfileWorkspaceScreenProps) {
  const { t } = useI18n();
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [skills, setSkills] = useState<ProfileSkillSummary[]>([]);

  useEffect(() => {
    window.profileRuntime.getProfile(profileId).then(setProfile).catch(() => {});
    window.profileRuntime.listProfileSkills(profileId).then(setSkills).catch(() => {});
  }, [profileId]);

  if (!profile) {
    return <div className="flex items-center justify-center h-full text-gray-500">Loading profile...</div>;
  }

  return (
    <div className="flex h-full gap-4 p-4 overflow-auto">
      {/* Chat Panel */}
      <div className="flex-1 flex flex-col bg-gray-900 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <User size={18} />
          <h2 className="text-lg font-semibold">{profile.display_name}</h2>
          <span className={`px-2 py-0.5 text-xs rounded ${
            profile.runtime_status === "running" ? "bg-green-900 text-green-300" :
            profile.runtime_status === "failed" ? "bg-red-900 text-red-300" : "bg-gray-700 text-gray-300"
          }`}>
            {profile.runtime_status}
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <p>Independent chat with {profile.name} specialist</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-72 flex flex-col gap-3">
        {/* Profile Info */}
        <div className="bg-gray-900 rounded-lg p-3">
          <h3 className="text-sm font-semibold mb-2">Profile Info</h3>
          <div className="text-xs text-gray-400 space-y-1">
            <div>Name: {profile.name}</div>
            <div>Role: {profile.role}</div>
            <div>Port: {profile.port}</div>
            <div>Runtime: {profile.runtime_type}</div>
            {profile.capabilities.length > 0 && (
              <div>Capabilities: {profile.capabilities.join(", ")}</div>
            )}
          </div>
        </div>

        {/* Skills Panel */}
        <div className="bg-gray-900 rounded-lg p-3 flex-1 overflow-auto">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
            <Puzzle size={14} /> Skills ({skills.length})
          </h3>
          <div className="flex flex-col gap-1">
            {skills.map((skill) => (
              <div key={skill.id} className="text-xs text-gray-300 bg-gray-800 rounded px-2 py-1">
                {skill.skillName}
                {skill.category && <span className="text-gray-500 ml-1">({skill.category})</span>}
              </div>
            ))}
            {skills.length === 0 && (
              <div className="text-xs text-gray-500">No skills installed</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
