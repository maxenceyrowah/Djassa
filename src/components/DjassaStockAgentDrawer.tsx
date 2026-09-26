import React, { useState, useEffect, useRef } from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { Product, WarehouseHub, FilterState, StockMovement, ActiveNavScreen } from '../types/inventory';
import {
  AgentMessage,
  AgentAction,
  RestockItemAction,
  BatchRestockAction,
  InterHubTransferAction,
} from '../agent/types';
import {
  queryStockAgent,
  getStoredApiKey,
  saveApiKey,
  runAutonomousAgent,
} from '../agent/geminiAgent';
import { auditStockAlerts } from '../agent/skills/alertSkill';
import { formatFCFA } from '../utils/format';

interface DjassaStockAgentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onExecuteRestock: (productId: string, quantity: number, hub: WarehouseHub, reason?: string) => void;
  onExecuteBatchRestock: (items: { productId: string; quantity: number; hub: WarehouseHub }[]) => void;
  onExecuteTransfer: (productId: string, fromHub: WarehouseHub, toHub: WarehouseHub, quantity: number) => void;
  onApplyFilter: (filters: Partial<FilterState>) => void;
  onNavigate: (screen: ActiveNavScreen) => void;
}

export const DjassaStockAgentDrawer: React.FC<DjassaStockAgentDrawerProps> = ({
  isOpen,
  onClose,
  products,
  onExecuteRestock,
  onExecuteBatchRestock,
  onExecuteTransfer,
  onApplyFilter,
  onNavigate,
}) => {
  useEscapeKey(onClose, isOpen);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [executedActions, setExecutedActions] = useState<Record<string, boolean>>({});
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [activeApiKey, setActiveApiKey] = useState('');
  const [selectedHubFilter, setSelectedHubFilter] = useState<WarehouseHub | 'ALL'>('ALL');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize API Key and First Greeting
  useEffect(() => {
    const key = getStoredApiKey();
    setActiveApiKey(key);
    setApiKeyInput(key);

    // Initial greeting with real-time audit
    const initialAudit = runAutonomousAgent('alerte', products);
    const greetingMsg: AgentMessage = {
      id: 'msg-welcome',
      role: 'assistant',
      content: `Bonjour ! Je suis votre **Agent Spécialiste Réassort & Alertes de Stock** pour DJASSA.\n\n` +
        `J'analyse en temps réel vos 4 entrepôts (Treichville, Cocody, Yopougon, Plateau). Voici l'état actuel de votre stock :`,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      skillUsed: 'Audit Initial Temps Réel',
      actions: initialAudit.actions,
    };

    setMessages([greetingMsg]);
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  const audit = auditStockAlerts(products);

  const handleSaveApiKey = () => {
    saveApiKey(apiKeyInput);
    setActiveApiKey(apiKeyInput.trim());
    setShowKeyConfig(false);
  };

  const handleSend = async (queryToSend?: string) => {
    const text = (queryToSend || inputQuery).trim();
    if (!text || isTyping) return;

    const userMsg: AgentMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    try {
      const response = await queryStockAgent(text, products);

      const agentMsg: AgentMessage = {
        id: `agt-${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        skillUsed: response.skillUsed,
        actions: response.actions,
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch (err) {
      console.error(err);
      const fallback = runAutonomousAgent(text, products);
      setMessages((prev) => [
        ...prev,
        {
          id: `agt-${Date.now()}`,
          role: 'assistant',
          content: fallback.content,
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          skillUsed: 'Moteur Autonome de Secours',
          actions: fallback.actions,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const executeSingleRestock = (action: RestockItemAction, actionKey: string) => {
    onExecuteRestock(action.productId, action.quantity, action.hub, action.reason);
    setExecutedActions((prev) => ({ ...prev, [actionKey]: true }));
  };

  const executeBatch = (action: BatchRestockAction, actionKey: string) => {
    onExecuteBatchRestock(
      action.items.map((i) => ({ productId: i.productId, quantity: i.quantity, hub: i.hub }))
    );
    setExecutedActions((prev) => ({ ...prev, [actionKey]: true }));
  };

  const executeTransfer = (action: InterHubTransferAction, actionKey: string) => {
    onExecuteTransfer(action.productId, action.fromHub, action.toHub, action.quantity);
    setExecutedActions((prev) => ({ ...prev, [actionKey]: true }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in">
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Drawer Panel */}
      <aside className="relative w-full max-w-xl bg-white shadow-2xl h-full flex flex-col z-10 border-l border-[#e2e8f0] animate-slide-left">
        {/* Drawer Header */}
        <header className="p-4 bg-gradient-to-r from-[#00685d] to-[#005048] text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white ring-1 ring-white/25">
              <span className="material-symbols-outlined text-[24px]">smart_toy</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline font-bold text-base text-white tracking-wide">
                  Agent Réassort & Alertes
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#acedda] text-[#065043]">
                  {activeApiKey ? 'Gemini AI' : 'Moteur Autonome'}
                </span>
              </div>
              <p className="text-xs text-white/80">
                Surveillance continue • Treichville, Cocody, Yopougon, Plateau
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              title="Configurer la clé API Gemini"
            >
              <span className="material-symbols-outlined text-[18px]">key</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              title="Fermer l'Agent"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </header>

        {/* Optional Gemini API Key Drawer Configuration */}
        {showKeyConfig && (
          <div className="p-4 bg-[#eff4ff] border-b border-[#cbd5e1] text-xs space-y-2.5 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#0b1c30]">Configuration Clé API Gemini (Google AI Studio)</span>
              <button
                onClick={() => setShowKeyConfig(false)}
                className="text-[#64748b] hover:text-[#0b1c30]"
              >
                Masquer
              </button>
            </div>
            <p className="text-[#475569] text-[11px] leading-relaxed">
              L'agent fonctionne en mode <strong>Autonome Local</strong> même sans clé. Si vous possédez une clé API Google AI Studio, collez-la ici pour activer le raisonnement naturel complet via <code>gemini-2.5-flash</code>.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 px-3 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-xs focus:outline-none focus:border-[#00685d]"
              />
              <button
                onClick={handleSaveApiKey}
                className="px-3 py-1.5 bg-[#00685d] text-white font-semibold rounded-lg hover:bg-[#005048] transition-colors"
              >
                Enregistrer
              </button>
              {activeApiKey && (
                <button
                  onClick={() => {
                    saveApiKey('');
                    setActiveApiKey('');
                    setApiKeyInput('');
                  }}
                  className="px-2.5 py-1.5 bg-white border border-[#ba1a1a] text-[#ba1a1a] rounded-lg hover:bg-[#ffdad6] transition-colors"
                  title="Supprimer la clé"
                >
                  Retirer
                </button>
              )}
            </div>
          </div>
        )}

        {/* Live HUD (Mini Stock Dashboard) */}
        <div className="p-3 bg-[#f8f9ff] border-b border-[#e2e8f0] grid grid-cols-3 gap-2 text-center text-xs">
          <button
            onClick={() => handleSend('Scanner les alertes et ruptures')}
            className={`p-2 rounded-xl border transition-all text-left flex flex-col justify-between ${
              audit.criticalStockCount + audit.outOfStockCount > 0
                ? 'bg-[#ffdad6]/40 border-[#ffdad6] hover:bg-[#ffdad6]/70'
                : 'bg-white border-[#e2e8f0] hover:border-[#00685d]'
            }`}
          >
            <div className="flex items-center justify-between text-[#ba1a1a] font-bold text-[11px]">
              <span>Alertes</span>
              <span className="material-symbols-outlined text-[16px]">warning</span>
            </div>
            <div className="font-headline font-bold text-lg text-[#0b1c30] mt-1">
              {audit.criticalStockCount + audit.outOfStockCount}
            </div>
            <div className="text-[10px] text-[#64748b]">
              {audit.outOfStockCount} rupture(s)
            </div>
          </button>

          <button
            onClick={() => handleSend('Plan de réassort complet')}
            className="p-2 rounded-xl bg-white border border-[#e2e8f0] hover:border-[#00685d] transition-all text-left flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-[#00685d] font-bold text-[11px]">
              <span>À Commander</span>
              <span className="material-symbols-outlined text-[16px]">shopping_cart_checkout</span>
            </div>
            <div className="font-headline font-bold text-lg text-[#0b1c30] mt-1">
              {audit.alerts.filter((a) => a.severity !== 'warning').length} réf.
            </div>
            <div className="text-[10px] text-[#64748b]">Besoin réassort</div>
          </button>

          <button
            onClick={() => handleSend('Coût estimé du réassort')}
            className="p-2 rounded-xl bg-white border border-[#e2e8f0] hover:border-[#00685d] transition-all text-left flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-[#0284c7] font-bold text-[11px]">
              <span>Budget Réassort</span>
              <span className="material-symbols-outlined text-[16px]">payments</span>
            </div>
            <div className="font-headline font-bold text-xs sm:text-sm text-[#0b1c30] mt-1 truncate">
              {formatFCFA(audit.totalReorderBudgetFCFA)}
            </div>
            <div className="text-[10px] text-[#64748b]">Total estimé</div>
          </button>
        </div>

        {/* Quick Action Suggestion Chips */}
        <div className="px-3 py-2 bg-white border-b border-[#f1f5f9] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => handleSend('Scanner les ruptures de stock')}
            className="shrink-0 px-2.5 py-1 rounded-full bg-[#ffdad6] text-[#93000a] text-[11px] font-semibold flex items-center gap-1 hover:bg-[#ffcdc7] transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">warning</span>
            Alertes Rupture
          </button>
          <button
            onClick={() => handleSend('Plan de réassort Treichville')}
            className="shrink-0 px-2.5 py-1 rounded-full bg-[#eff4ff] text-[#0b1c30] text-[11px] font-medium flex items-center gap-1 hover:bg-[#dce9ff] transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">warehouse</span>
            Dépôt Treichville
          </button>
          <button
            onClick={() => handleSend('Transférer du stock inter-dépôts')}
            className="shrink-0 px-2.5 py-1 rounded-full bg-[#eff4ff] text-[#0b1c30] text-[11px] font-medium flex items-center gap-1 hover:bg-[#dce9ff] transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">sync_alt</span>
            Équilibrer Dépôts
          </button>
          <button
            onClick={() => handleSend('Quel est le produit le plus vendu ?')}
            className="shrink-0 px-2.5 py-1 rounded-full bg-[#eff4ff] text-[#0b1c30] text-[11px] font-medium flex items-center gap-1 hover:bg-[#dce9ff] transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
            Top Ventes
          </button>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8f9ff]">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-[#64748b] px-1">
                  {!isUser && (
                    <span className="w-2 h-2 rounded-full bg-[#00685d]"></span>
                  )}
                  <span>{isUser ? 'Vous' : 'Agent Réassort Djassa'}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                  {msg.skillUsed && (
                    <>
                      <span>•</span>
                      <span className="px-1.5 py-0.2 bg-[#acedda] text-[#065043] rounded font-semibold text-[9px]">
                        {msg.skillUsed}
                      </span>
                    </>
                  )}
                </div>

                <div
                  className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-3.5 text-xs shadow-xs leading-relaxed ${
                    isUser
                      ? 'bg-[#00685d] text-white rounded-br-xs'
                      : 'bg-white text-[#0b1c30] border border-[#e2e8f0] rounded-bl-xs'
                  }`}
                >
                  <div className="whitespace-pre-line font-body space-y-2">
                    {msg.content}
                  </div>

                  {/* Render Embedded Action Cards */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#e2e8f0] space-y-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                        Actions Recommandées :
                      </div>

                      {msg.actions.map((act, idx) => {
                        const actionKey = `${msg.id}-action-${idx}`;
                        const isExecuted = executedActions[actionKey];

                        if (act.type === 'RESTOCK_ITEM') {
                          return (
                            <div
                              key={actionKey}
                              className="p-2.5 rounded-xl bg-[#eff4ff] border border-[#cbd5e1] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                            >
                              <div>
                                <div className="font-semibold text-[#0b1c30] text-[11px] flex items-center gap-1">
                                  <span>📦 {act.productName}</span>
                                  <span className="text-[10px] text-[#64748b] font-mono">
                                    ({act.sku})
                                  </span>
                                </div>
                                <div className="text-[10px] text-[#475569] mt-0.5">
                                  Lieu: <strong>{act.hub}</strong> | Qté: <strong>+{act.quantity}</strong> | Coût: <strong>{formatFCFA(act.totalCostFCFA)}</strong>
                                </div>
                              </div>

                              <button
                                disabled={isExecuted}
                                onClick={() => executeSingleRestock(act, actionKey)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all flex items-center gap-1 ${
                                  isExecuted
                                    ? 'bg-[#d1fae5] text-[#065f46] cursor-default'
                                    : 'bg-[#00685d] text-white hover:bg-[#005048] active:scale-95 shadow-xs'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[15px]">
                                  {isExecuted ? 'check_circle' : 'add_circle'}
                                </span>
                                {isExecuted ? 'Réassort Appliqué' : `Réassort (+${act.quantity})`}
                              </button>
                            </div>
                          );
                        }

                        if (act.type === 'BATCH_RESTOCK') {
                          return (
                            <div
                              key={actionKey}
                              className="p-3 rounded-xl bg-[#acedda]/30 border border-[#acedda] space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[#065043] text-xs">
                                  🚀 {act.title}
                                </span>
                                <span className="font-headline font-bold text-xs text-[#065043]">
                                  {formatFCFA(act.totalBudgetFCFA)}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#475569]">
                                Réapprovisionnement simultané de <strong>{act.items.length} articles</strong> critiques sur l'ensemble des dépôts.
                              </p>
                              <button
                                disabled={isExecuted}
                                onClick={() => executeBatch(act, actionKey)}
                                className={`w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                  isExecuted
                                    ? 'bg-[#d1fae5] text-[#065f46] cursor-default'
                                    : 'bg-[#00685d] text-white hover:bg-[#005048] active:scale-98 shadow-sm'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  {isExecuted ? 'verified' : 'fact_check'}
                                </span>
                                {isExecuted
                                  ? 'Bon de Commande Global Exécuté'
                                  : `Valider le Réassort Global (${formatFCFA(act.totalBudgetFCFA)})`}
                              </button>
                            </div>
                          );
                        }

                        if (act.type === 'INTER_HUB_TRANSFER') {
                          return (
                            <div
                              key={actionKey}
                              className="p-2.5 rounded-xl bg-white border border-[#cbd5e1] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                            >
                              <div>
                                <div className="font-semibold text-[#0b1c30] text-[11px]">
                                  🔄 Transfert {act.quantity}x {act.productName}
                                </div>
                                <div className="text-[10px] text-[#475569] mt-0.5">
                                  De <em>{act.fromHub}</em> vers <strong>{act.toHub}</strong>
                                </div>
                              </div>

                              <button
                                disabled={isExecuted}
                                onClick={() => executeTransfer(act, actionKey)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all flex items-center gap-1 ${
                                  isExecuted
                                    ? 'bg-[#d1fae5] text-[#065f46] cursor-default'
                                    : 'bg-[#0284c7] text-white hover:bg-[#0369a1] active:scale-95 shadow-xs'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[15px]">
                                  {isExecuted ? 'done' : 'sync'}
                                </span>
                                {isExecuted ? 'Transféré' : 'Exécuter Transfert'}
                              </button>
                            </div>
                          );
                        }

                        if (act.type === 'FILTER_CATALOG') {
                          return (
                            <button
                              key={actionKey}
                              onClick={() => {
                                onApplyFilter(act.filters);
                                onNavigate('inventory-catalog');
                                onClose();
                              }}
                              className="w-full py-1.5 px-3 rounded-lg bg-white border border-[#00685d] text-[#00685d] font-semibold text-xs hover:bg-[#eff4ff] transition-colors flex items-center justify-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-[16px]">visibility</span>
                              {act.label}
                            </button>
                          );
                        }

                        return null;
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center gap-2 p-3 bg-white rounded-2xl max-w-[140px] border border-[#e2e8f0] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#00685d] animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-[#00685d] animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 rounded-full bg-[#00685d] animate-bounce [animation-delay:0.4s]"></span>
              <span className="text-[10px] text-[#64748b] ml-1">Analyse...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <footer className="p-3 bg-white border-t border-[#e2e8f0]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Posez une question ou demandez un réassort..."
                className="w-full h-10 pl-3 pr-9 bg-[#f8f9ff] text-xs text-[#0b1c30] placeholder:text-[#64748b] rounded-xl border border-[#cbd5e1] focus:border-[#00685d] focus:bg-white focus:outline-none transition-all"
              />
              {inputQuery && (
                <button
                  type="button"
                  onClick={() => setInputQuery('')}
                  className="absolute right-2.5 top-2.5 text-[#64748b] hover:text-[#0b1c30]"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={!inputQuery.trim() || isTyping}
              className={`h-10 px-3.5 rounded-xl font-semibold flex items-center justify-center transition-all ${
                inputQuery.trim() && !isTyping
                  ? 'bg-[#00685d] text-white hover:bg-[#005048] active:scale-95 shadow-xs'
                  : 'bg-[#e2e8f0] text-[#94a3b8] cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </form>
          <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-[#64748b]">
            <span>💡 Astuce : tapez <em>« réassort treichville »</em> ou <em>« alertes »</em></span>
            <button
              onClick={() => {
                const initialAudit = runAutonomousAgent('alerte', products);
                setMessages([
                  {
                    id: `rst-${Date.now()}`,
                    role: 'assistant',
                    content: `Historique réinitialisé. Comment puis-je vous aider pour vos stocks DJASSA ?`,
                    timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                    actions: initialAudit.actions,
                  },
                ]);
              }}
              className="hover:text-[#ba1a1a] transition-colors"
            >
              Effacer chat
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
};
