import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Package,
  Calendar,
  Clock,
  Shield,
  Truck,
  CheckCircle2,
  ExternalLink,
  Send,
  MessageSquarePlus,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatDate, formatCurrency, timeAgo } from '../../utils/formatters.js';

export function PanelACustomer({ ticket, onAddCustomerMessage }) {
  const customer = ticket.customer;
  const currentOrder = ticket.order;
  const product = currentOrder?.product || ticket.product;

  const [followUpText, setFollowUpText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);

  const handleSendReply = async (textToSend) => {
    const text = textToSend || followUpText;
    if (!text.trim() || !onAddCustomerMessage) return;
    setIsSubmitting(true);
    try {
      await onAddCustomerMessage(text.trim());
      setFollowUpText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200/80 overflow-y-auto">
      {/* 1. Customer Profile Card */}
      <div className="p-4 bg-white border-b border-slate-200/80">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Customer Profile
          </span>
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
              customer?.tier === 'VIP'
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            {customer?.tier || 'Standard'} Tier
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-sm border border-slate-200">
            {customer?.name
              ? customer.name.split(' ').map((n) => n[0]).join('').substring(0, 2)
              : 'CU'}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-slate-900 truncate">{customer?.name}</h4>
            <p className="text-xs text-slate-500 font-mono truncate">{customer?.externalId}</p>
          </div>
        </div>

        <div className="mt-3.5 space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center space-x-2 truncate">
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{customer?.email}</span>
          </div>
          {customer?.phone && (
            <div className="flex items-center space-x-2">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{customer.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Associated Order & Hardware Context */}
      {currentOrder ? (
        <div className="p-4 bg-white border-b border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Associated Order
            </span>
            <span className="text-xs font-mono font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
              {currentOrder.orderNumber}
            </span>
          </div>

          <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-200/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900">{product?.name || 'Wearable'}</span>
              <span className="text-xs font-bold text-rose-600">
                {formatCurrency(currentOrder.orderAmount)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
              <div>
                <span className="text-slate-400 block">Purchase Date</span>
                <span className="font-medium text-slate-800">{formatDate(currentOrder.purchaseDate)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Delivery Status</span>
                <span className="font-medium text-slate-800">{currentOrder.orderStatus}</span>
              </div>
              {currentOrder.carrier && (
                <div className="col-span-2">
                  <span className="text-slate-400 block">Courier & Tracking</span>
                  <span className="font-mono font-medium text-slate-800">
                    {currentOrder.carrier} • {currentOrder.trackingNumber || 'Pending'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-amber-50/50 border-b border-amber-200/70 text-xs">
          <div className="flex items-center space-x-2 text-amber-800 font-semibold mb-1">
            <Shield className="w-4 h-4 text-amber-600" />
            <span>Unlinked Order Inquiry</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            No specific order was automatically matched from customer details. Order verification is required.
          </p>
        </div>
      )}

      {/* 3. Ticket Message Thread */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Conversation Thread
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            {ticket.messages?.length || 1} message(s)
          </span>
        </div>

        <div className="space-y-3.5">
          {(ticket.messages || []).map((msg, idx) => {
            const isCustomer = msg.senderType === 'CUSTOMER';
            const isAgent = msg.senderType === 'AGENT';

            return (
              <div
                key={msg.id || idx}
                className={`p-3.5 rounded-xl text-xs border ${
                  isCustomer
                    ? 'bg-white border-slate-200 text-slate-800 shadow-sm'
                    : isAgent
                    ? 'bg-rose-50/60 border-rose-200 text-slate-900 shadow-sm'
                    : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`font-semibold ${
                        isCustomer ? 'text-slate-900' : 'text-rose-700'
                      }`}
                    >
                      {msg.senderName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      ({isCustomer ? 'Customer' : 'Support Specialist'})
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {timeAgo(msg.sentAt)}
                  </span>
                </div>
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {msg.messageText}
                </p>
              </div>
            );
          })}
        </div>

        {/* Multi-turn Follow-up Simulator */}
        <div className="mt-4 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setShowSimulator(!showSimulator)}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 bg-slate-100/90 hover:bg-slate-200/80 px-3 py-2 rounded-lg border border-slate-200 transition-colors"
          >
            <span className="flex items-center space-x-1.5">
              <MessageSquarePlus className="w-3.5 h-3.5 text-rose-600" />
              <span>Simulate Customer Reply (Multi-Turn Test)</span>
            </span>
            {showSimulator ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>

          {showSimulator && (
            <div className="mt-2.5 p-3 bg-white rounded-lg border border-slate-200 shadow-sm space-y-2">
              <label className="block text-[11px] font-medium text-slate-600">
                Send customer message as <span className="font-semibold text-slate-900">{customer?.name}</span>:
              </label>
              <textarea
                rows={3}
                value={followUpText}
                onChange={(e) => setFollowUpText(e.target.value)}
                placeholder="E.g., I tried charging with a 5V/1A adapter for 3 hours as suggested, but the screen is still black."
                className="w-full text-xs p-2 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
              />

              {/* Quick sample pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    handleSendReply(
                      'I completed the 5V/1A charging test for 3 hours and cleaned the pins with isopropyl alcohol, but the device still does not turn on. Here is a video proof of the unlit display.'
                    )
                  }
                  disabled={isSubmitting}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                >
                  ⚡ Charging Test Done (Still Broken)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSendReply(
                      'I would like to exchange my ColorFit Pro 5 for the Jet Black variant as the Rose Gold color does not fit my preference. The box is unopened with seal intact.'
                    )
                  }
                  disabled={isSubmitting}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                >
                  🔄 Size / Color Exchange Request
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSendReply(
                      'I have verified Bluetooth permissions and uninstalled/reinstalled the NoiseFit app, but sleep tracking still shows 0 hours.'
                    )
                  }
                  disabled={isSubmitting}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                >
                  📊 Sleep Sync Test Done
                </button>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => handleSendReply()}
                  disabled={!followUpText.trim() || isSubmitting}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded transition-colors"
                >
                  <Send className="w-3 h-3" />
                  <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
