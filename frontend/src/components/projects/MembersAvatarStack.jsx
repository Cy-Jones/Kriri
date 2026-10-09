import React from "react";
import { getAvatarColor, getInitial } from "../../lib/avatarUtils";

export default function MembersAvatarStack({ members = [], max = 3 }) {
  if (!members || members.length === 0) return null;
  const visible = members.slice(0, max);
  const overflow = members.length > max ? members.length - max : 0;

  return (
    <div className="flex items-center -space-x-1.5">
      {visible.map((m, i) => (
        <div
          key={i}
          className={`relative flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold text-white overflow-hidden border border-[#1e1f21] ${getAvatarColor(m.name, m.email)}`}
          style={{ zIndex: visible.length - i }}
          title={m.name || m.email}
        >
          {m.avatar_url ? (
            <img
              src={m.avatar_url}
              alt={m.name}
              className="w-full h-full object-cover"
            />
          ) : (
            getInitial(m.name, m.email)
          )}
        </div>
      ))}
      {overflow > 0 && (
        <div
          className="relative flex items-center justify-center w-7 h-7 rounded-full bg-[#f26d78] text-[10px] font-bold text-white overflow-hidden border border-[#1e1f21]"
          style={{ zIndex: 0 }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
