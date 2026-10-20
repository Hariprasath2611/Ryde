import React from 'react';
import { ArrowLeft, Bell, User } from 'lucide-react';
import { RydeLogo } from './RydeLogo';

interface HeaderProps {
  showBack?: boolean;
  onBack?: () => void;
  showActions?: boolean;
  unreadCount?: number;
  avatarUrl?: string;
  onNotificationsClick?: () => void;
  onProfileClick?: () => void;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  showBack = false,
  onBack,
  showActions = false,
  unreadCount = 0,
  avatarUrl,
  onNotificationsClick,
  onProfileClick,
  className = '',
}) => {
  return (
    <header className={`relative z-10 flex items-center justify-between px-5 pt-3 pb-2 w-full ${className}`}>
      {/* Left Back Arrow or Spacer */}
      <div className="w-20 flex items-center justify-start">
        {showBack ? (
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white/70 hover:bg-white flex items-center justify-center text-[#075B64] transition-all duration-200 active:scale-95 shadow-sm border border-[#6FA5A5]/30"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
        ) : null}
      </div>

      {/* Center Brand Logo */}
      <div className="flex-1 flex justify-center">
        <RydeLogo size="md" />
      </div>

      {/* Right Actions: Notification & Profile Avatar */}
      <div className="w-20 flex items-center justify-end space-x-2">
        {showActions ? (
          <>
            <button
              onClick={onNotificationsClick}
              className="relative w-8 h-8 rounded-full flex items-center justify-center text-[#075B64] hover:bg-white/60 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 stroke-[2.2]" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#F5B83D] ring-2 ring-[#DDF0F0]" />
              )}
            </button>

            <button
              onClick={onProfileClick}
              className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#075B64] flex items-center justify-center bg-white shadow-xs hover:ring-2 hover:ring-[#F5B83D] transition-all"
              aria-label="Driver Profile"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Driver Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-[#075B64]" />
              )}
            </button>
          </>
        ) : (
          <div className="w-10" />
        )}
      </div>
    </header>
  );
};
