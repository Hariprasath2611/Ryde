import React from 'react';
import { X, Bell, CheckCircle2, Sparkles } from 'lucide-react';
import { NotificationItem } from '../../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#DDF0F0] border-2 border-[#6FA5A5] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-white/80 border-b border-[#6FA5A5]/30">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-[#075B64]" />
            <h3 className="font-extrabold text-[#075B64] text-base">Notifications</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                item.read
                  ? 'bg-white/60 border-[#6FA5A5]/30'
                  : 'bg-white border-[#F5B83D] shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#075B64] flex items-center">
                  {!item.read && (
                    <span className="w-2 h-2 rounded-full bg-[#F5B83D] mr-1.5 shrink-0" />
                  )}
                  {item.title}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">{item.time}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{item.message}</p>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white/80 border-t border-[#6FA5A5]/30 flex justify-between items-center">
          <button
            onClick={onMarkAllRead}
            className="text-xs font-bold text-[#075B64] hover:underline"
          >
            Mark all as read
          </button>
          <button
            onClick={onClose}
            className="text-xs font-bold bg-[#075B64] text-white px-4 py-2 rounded-full hover:bg-[#05434a] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
