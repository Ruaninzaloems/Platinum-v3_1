import { useListNotifications, useMarkNotificationRead } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Bell, Info, AlertTriangle, CheckCircle, Clock, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { getListNotificationsQueryKey } from "@workspace/api-client-react";

export default function NotificationCentre() {
  const { data: notifications, isLoading } = useListNotifications({});
  const markReadMut = useMarkNotificationRead();
  const queryClient = useQueryClient();

  const handleMarkRead = (id: number) => {
    markReadMut.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey({}) })
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'reminder': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'escalation': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <Info className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Bell className="w-6 h-6" /></div>
            Notification Centre
          </h1>
        </div>
      </div>

      <Card className="platinum-card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-platinum-primary" /></div>
        ) : notifications?.length === 0 ? (
          <div className="text-center p-16 text-slate-500">
            <Bell className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-700">All caught up!</p>
            <p>You have no notifications.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications?.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-5 flex gap-4 transition-colors ${notif.isRead ? 'bg-white opacity-70' : 'bg-blue-50/30'}`}
              >
                <div className={`mt-1 p-2 rounded-full ${notif.isRead ? 'bg-slate-100' : 'bg-white shadow-sm border border-border'}`}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className={`text-sm font-bold ${notif.isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                      {notif.title}
                    </h4>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                  
                  {!notif.isRead && (
                    <button 
                      onClick={() => handleMarkRead(notif.id)}
                      className="mt-3 text-xs font-semibold text-platinum-primary hover:text-blue-700"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
