'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { Download, Loader2, Sparkles, Link, Upload, CheckCircle2 } from 'lucide-react';

interface SEOData {
  url: string;
  focusKeyword: string;
  metaDescription: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [singleUrl, setSingleUrl] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [results, setResults] = useState<SEOData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const processUrl = async (url: string): Promise<SEOData> => {
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to generate');
      
      return {
        url,
        focusKeyword: data.focusKeyword,
        metaDescription: data.metaDescription,
        status: 'success',
      };
    } catch (err: any) {
      return {
        url,
        focusKeyword: '',
        metaDescription: '',
        status: 'error',
        error: err.message,
      };
    }
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleUrl) return;
    
    setIsProcessing(true);
    const newEntry: SEOData = { url: singleUrl, focusKeyword: '', metaDescription: '', status: 'loading' };
    setResults([newEntry, ...results]);
    
    const result = await processUrl(singleUrl);
    setResults(prev => prev.map(r => r.url === singleUrl ? result : r));
    setIsProcessing(false);
  };

  const handleBulkSubmit = async () => {
    const urls = bulkText.split('\n').map(u => u.trim()).filter(u => u.length > 0);
    if (urls.length === 0) return;
    
    setIsProcessing(true);
    const newEntries = urls.map(url => ({ url, focusKeyword: '', metaDescription: '', status: 'loading' as const }));
    setResults([...newEntries, ...results]);

    // Process sequentially to avoid rate limits or overwhelming playwright
    for (let i = 0; i < urls.length; i++) {
        const result = await processUrl(urls[i]);
        setResults(prev => prev.map(r => r.url === urls[i] ? result : r));
    }
    
    setIsProcessing(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        complete: (results) => {
          const urls = results.data.map((row: any) => row[0]).filter(Boolean).join('\n');
          setBulkText(urls);
        }
      });
    }
  };

  const exportCSV = () => {
    const csv = Papa.unparse(
      results.filter(r => r.status === 'success').map(r => ({
        URL: r.url,
        'Focus Keyword': r.focusKeyword,
        'Meta Description': r.metaDescription
      }))
    );
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'seo-meta-descriptions.csv';
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30 font-sans">
      <div className="max-w-6xl mx-auto px-4 py-12">
        
        {/* Header */}
        <header className="mb-12 text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-4 border border-indigo-500/20">
            <Sparkles className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            AI SEO Meta Generator
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Automatically crawl websites, extract focus keywords, and generate perfectly optimized meta descriptions in seconds.
          </p>
        </header>

        <main className="grid lg:grid-cols-[400px,1fr] gap-8">
          
          {/* Sidebar / Controls */}
          <div className="space-y-6">
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl">
              
              {/* Tabs */}
              <div className="flex bg-slate-950 p-1 rounded-xl mb-6 border border-slate-800/50">
                <button 
                  onClick={() => setActiveTab('single')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'single' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
                >
                  Single URL
                </button>
                <button 
                  onClick={() => setActiveTab('bulk')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'bulk' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
                >
                  Bulk Process
                </button>
              </div>

              {/* Single Mode */}
              {activeTab === 'single' && (
                <form onSubmit={handleSingleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Website URL</label>
                    <div className="relative">
                      <Link className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                      <input 
                        type="url" 
                        value={singleUrl}
                        onChange={(e) => setSingleUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-700"
                        required
                      />
                    </div>
                  </div>
                  <button 
                    disabled={isProcessing}
                    type="submit" 
                    className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white font-semibold py-3 rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    {isProcessing ? 'Generating...' : 'Generate SEO Data'}
                  </button>
                </form>
              )}

              {/* Bulk Mode */}
              {activeTab === 'bulk' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2 flex justify-between items-center">
                      Paste URLs (one per line)
                      <label className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        Upload CSV
                        <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                      </label>
                    </label>
                    <textarea 
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      placeholder="https://example.com/page-1&#10;https://example.com/page-2"
                      className="w-full h-40 bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-700"
                    />
                  </div>
                  <button 
                    onClick={handleBulkSubmit}
                    disabled={isProcessing || !bulkText}
                    className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white font-semibold py-3 rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    {isProcessing ? 'Processing Bulk...' : 'Generate Bulk Data'}
                  </button>
                </div>
              )}
            </div>
            
            {/* Stats/Info */}
            <div className="bg-slate-900/30 rounded-3xl p-6 border border-slate-800/50">
              <h3 className="text-sm font-semibold text-slate-300 mb-2">How it works</h3>
              <ul className="text-sm text-slate-500 space-y-2">
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Crawls javascript-heavy sites using headless browsers</li>
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> AI analyzes main content to extract focus keyword</li>
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Generates 155-char meta description with keyword prioritized</li>
              </ul>
            </div>
          </div>

          {/* Results Area */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl flex flex-col shadow-2xl overflow-hidden min-h-[500px]">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                Generated Results
                <span className="bg-slate-800 text-slate-400 text-xs py-1 px-2 rounded-md font-mono">{results.length}</span>
              </h2>
              {results.filter(r => r.status === 'success').length > 0 && (
                <button 
                  onClick={exportCSV}
                  className="flex items-center gap-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg transition-colors border border-slate-700"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              )}
            </div>
            
            <div className="p-0 overflow-auto flex-1">
              {results.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center space-y-4">
                  <Sparkles className="w-12 h-12 text-slate-700" />
                  <p>Results will appear here. Enter a URL to get started.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/50">
                  {results.map((result, idx) => (
                    <div key={idx} className="p-6 hover:bg-slate-800/20 transition-colors">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <a href={result.url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 font-medium text-sm truncate max-w-md">
                          {result.url}
                        </a>
                        <div className="shrink-0">
                          {result.status === 'loading' && <span className="flex items-center gap-1 text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20"><Loader2 className="w-3 h-3 animate-spin"/> Processing</span>}
                          {result.status === 'success' && <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20"><CheckCircle2 className="w-3 h-3"/> Complete</span>}
                          {result.status === 'error' && <span className="text-xs text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">Error</span>}
                        </div>
                      </div>

                      {result.status === 'success' && (
                        <div className="space-y-4 mt-4">
                          <div>
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Focus Keyword</span>
                            <span className="inline-block bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-md text-sm font-medium">
                              {result.focusKeyword}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Meta Description</span>
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-slate-300 leading-relaxed shadow-inner">
                              {result.metaDescription}
                            </div>
                            <div className={`text-xs mt-2 text-right ${result.metaDescription.length > 155 ? 'text-rose-400' : 'text-slate-500'}`}>
                              {result.metaDescription.length} / 155 characters
                            </div>
                          </div>
                        </div>
                      )}

                      {result.status === 'error' && (
                        <div className="mt-2 text-sm text-rose-400 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
                          {result.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
