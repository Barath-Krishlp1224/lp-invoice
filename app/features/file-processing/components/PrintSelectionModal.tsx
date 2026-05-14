// @ts-nocheck
'use client'

import { Building2, Check, Printer, X } from 'lucide-react';

export default function PrintSelectionModal({
    isOpen,
    merchants = [],
    selectionMode,
    selectedMerchants = [],
    onModeChange,
    onMerchantToggle,
    onSelectAllMerchants,
    onClose,
    onConfirm,
    isSubmitting = false,
}) {
    if (!isOpen) {
        return null;
    }

    const requiresMerchantSelection = selectionMode !== 'all';
    const canSubmit = !requiresMerchantSelection || selectedMerchants.length > 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
                <div className="flex items-start justify-between border-b border-slate-200 bg-[linear-gradient(135deg,#f7faf9_0%,#eef7f1_100%)] px-6 py-5">
                    <div>
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-green-700">
                            <Printer className="h-3.5 w-3.5" />
                            Print Setup
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900">Generate merged PDF for printing</h3>
                        <p className="mt-1 text-sm text-slate-600">Choose whether to print every invoice or only selected merchants.</p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:bg-white hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="space-y-5 px-6 py-6">
                    <div className="grid gap-3 md:grid-cols-2">
                        {[
                            { value: 'all', label: 'Print all files', hint: 'One merged PDF with every invoice in sequence.' },
                            { value: 'multiple', label: 'Print selected merchants', hint: 'Combine invoices for multiple chosen merchants.' },
                        ].map((option) => {
                            const isActive = selectionMode === option.value;

                            return (
                                <button
                                    key={option.value}
                                    onClick={() => onModeChange(option.value)}
                                    disabled={isSubmitting}
                                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                                        isActive
                                            ? 'border-green-500 bg-green-50 shadow-[0_10px_25px_rgba(34,197,94,0.12)]'
                                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                    } disabled:cursor-not-allowed disabled:opacity-50`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="text-sm font-semibold text-slate-900">{option.label}</div>
                                            <p className="mt-2 text-xs leading-5 text-slate-600">{option.hint}</p>
                                        </div>
                                        <div className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border ${
                                            isActive ? 'border-green-500 bg-green-500 text-white' : 'border-slate-300 bg-white text-transparent'
                                        }`}>
                                            <Check className="h-3.5 w-3.5" />
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {requiresMerchantSelection && (
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                        <Building2 className="h-4 w-4 text-green-600" />
                                        Select merchants
                                    </div>
                                    <p className="mt-1 text-xs text-slate-600">
                                        Choose one or more merchants to include in the merged print PDF.
                                    </p>
                                </div>
                                {merchants.length > 1 && (
                                    <button
                                        onClick={onSelectAllMerchants}
                                        disabled={isSubmitting}
                                        className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-green-400 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {selectedMerchants.length === merchants.length ? 'Clear selection' : 'Select all'}
                                    </button>
                                )}
                            </div>

                            <div className="grid max-h-72 gap-2 overflow-y-auto pr-1 md:grid-cols-2">
                                {merchants.map((merchant) => {
                                    const isChecked = selectedMerchants.includes(merchant);

                                    return (
                                        <label
                                            key={merchant}
                                            className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-3 transition ${
                                                isChecked ? 'border-green-500 bg-white shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => onMerchantToggle(merchant)}
                                                disabled={isSubmitting}
                                                className="h-4 w-4 text-green-600"
                                            />
                                            <span className="min-w-0 flex-1 text-sm font-medium text-slate-700">{merchant}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 md:flex-row md:items-center md:justify-between">
                    <p className="text-xs text-slate-600">The printable file is generated on demand from the same invoice templates used for download.</p>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={!canSubmit || isSubmitting}
                            className="inline-flex items-center rounded-full bg-green-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Printer className="mr-2 h-4 w-4" />
                            {isSubmitting ? 'Preparing print...' : 'Generate & Print'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
