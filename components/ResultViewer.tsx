
import React, { useState } from 'react';
import { LabelData } from '../types';
import { Package, Tag, Barcode, Layers, Type, List, FileSpreadsheet, Copy, Check, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ResultViewerProps {
  data: LabelData[];
}

export const ResultViewer: React.FC<ResultViewerProps> = ({ data }) => {
  const [copied, setCopied] = useState(false);

  const handleExportExcel = () => {
    const exportData = data.map(item => {
      const titleLines = (item.title || "").split('\n');
      return {
        "TITLE": titleLines[0]?.trim() || "",
        "SUB-TITLE": titleLines.slice(1).join(' ').trim() || "",
        "STYLE": item.model || "",
        "COLOR": item.color || "",
        "SIZE": item.size || "",
        "ORDER": item.spn || "",
        "BARCODE": item.barcode_value || ""
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    ws['!cols'] = [
        { wch: 25 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 22 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Labels");
    XLSX.writeFile(wb, "Label_Extraction_Report.xlsx");
  };

  const handleCopyCSV = async () => {
    const headers = ["TITLE", "SUB-TITLE", "STYLE", "COLOR", "SIZE", "ORDER", "BARCODE"];
    
    const csvRows = [
      headers.join(","), 
      ...data.map(item => {
        const titleLines = (item.title || "").split('\n');
        const row = [
          titleLines[0]?.trim() || "",
          titleLines.slice(1).join(' ').trim() || "",
          item.model || "",
          item.color || "",
          item.size || "",
          item.spn || "",
          item.barcode_value || ""
        ];
        
        return row.map(cell => {
          const cellStr = String(cell);
          if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(",");
      })
    ];

    const csvString = csvRows.join("\n");

    try {
      await navigator.clipboard.writeText(csvString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy CSV:", err);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-8">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-2">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3 tracking-tight">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                  <List className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                Detected Labels <span className="text-slate-400 dark:text-slate-500 font-bold ml-1">({data.length})</span>
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium ml-12">Extracted structured data ready for export</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
                onClick={handleCopyCSV}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all shadow-sm active:transform active:scale-95 border ${
                  copied 
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/30' 
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
            >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied All!" : "Copy CSV"}
            </button>

            <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all shadow-md active:transform active:scale-95 shadow-emerald-500/10"
            >
                <FileSpreadsheet className="w-4 h-4" />
                Export XLSX
            </button>
          </div>
      </div>

      <div className="grid gap-8">
        {data.map((labelData, index) => {
            const titleParts = (labelData.title || "").split('\n');
            return (
              <div key={index} className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden hover:border-blue-200 dark:hover:border-blue-900 transition-all duration-300">
                  <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between">
                    <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-full">Label #{index + 1}</span>
                    <div className="flex gap-2">
                      {labelData.barcode_value && (
                          <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full border border-green-100 dark:border-green-900/30 uppercase tracking-wider">
                              <Barcode className="w-3.5 h-3.5" />
                              Barcode Verified
                          </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-6">
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                          <ResultItem 
                            icon={<Type className="w-4 h-4" />}
                            label="TITLE (LINE 1)" 
                            value={titleParts[0] || null} 
                            highlight 
                          />
                          <ResultItem 
                            icon={<FileText className="w-4 h-4" />}
                            label="TITLE (LINE 2)" 
                            value={titleParts.slice(1).join(' ') || null} 
                            highlight 
                          />
                          <ResultItem 
                            icon={<Layers className="w-4 h-4" />}
                            label="STYLE / MODEL" 
                            value={labelData.model} 
                          />
                          <ResultItem 
                            icon={<Package className="w-4 h-4" />}
                            label="COLOR" 
                            value={labelData.color} 
                          />
                          <ResultItem 
                            icon={<Tag className="w-4 h-4" />}
                            label="SIZE" 
                            value={labelData.size} 
                          />
                          <ResultItem 
                            icon={<Tag className="w-4 h-4" />}
                            label="ORDER / SPN" 
                            value={labelData.spn} 
                          />
                          <div className="sm:col-span-2 lg:col-span-3">
                             <ResultItem 
                                icon={<Barcode className="w-4 h-4" />}
                                label="BARCODE DATA" 
                                value={labelData.barcode_value} 
                                subValue={labelData.barcode_type}
                              />
                          </div>
                     </div>

                      <div className="group relative">
                        <div className="absolute inset-0 bg-blue-600/5 rounded-2xl pointer-events-none group-hover:opacity-100 opacity-0 transition-opacity"></div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors">
                            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2.5 flex items-center gap-2">
                              <List className="w-3.5 h-3.5 text-slate-400" />
                              Raw Extraction Context
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-mono leading-relaxed max-h-40 overflow-y-auto custom-scrollbar pr-2">
                                {labelData.raw_text || "No text detected."}
                            </p>
                        </div>
                      </div>
                  </div>
              </div>
            );
        })}
      </div>

      {data.length === 0 && (
          <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 shadow-inner">
              <Package className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">No labels were detected in this document.</p>
              <p className="text-xs text-slate-400 dark:text-slate-600 mt-2">Try a clearer image or a high-quality PDF scan.</p>
          </div>
      )}
    </div>
  );
};

const ResultItem = ({ icon, label, value, subValue, highlight = false }: { icon: React.ReactNode, label: string, value: string | null, subValue?: string | null, highlight?: boolean }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (value) {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className={`flex flex-col p-4 rounded-2xl border relative group transition-all duration-300 ${
      highlight 
        ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30' 
        : 'bg-white dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 shadow-sm hover:shadow'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
          <span className="p-1 bg-white dark:bg-slate-900 rounded-md shadow-sm border border-slate-100 dark:border-slate-800">
            {/* Fix: cast icon to ReactElement<any> to avoid className property error in TypeScript */}
            {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: "w-3.5 h-3.5" }) : icon}
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
        </div>
        {value && (
            <button 
                onClick={handleCopy}
                className={`transition-all duration-300 p-2 rounded-lg border ${
                  copied 
                    ? 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800' 
                    : 'text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 border-transparent hover:border-blue-100 dark:hover:border-blue-800'
                }`}
                title={`Copy ${label}`}
            >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
        )}
      </div>
      <div className={`font-bold text-slate-900 dark:text-slate-100 break-words pr-2 text-base tracking-tight leading-tight ${!value ? 'italic font-normal text-slate-300 dark:text-slate-700' : ''}`}>
        {value || "Not Found"}
      </div>
      {subValue && (
        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 font-bold uppercase tracking-wider">{subValue}</div>
      )}
    </div>
  );
};
