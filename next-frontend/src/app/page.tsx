'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Squares } from '@/components/ui/squares-background';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function Home() {
  const [symbol, setSymbol] = useState('GOOGL');
  const [analysisType, setAnalysisType] = useState('Complete Analysis');
  const [markdownResult, setMarkdownResult] = useState<string>(
    'Enter a stock symbol and click **Analyze** to see results.'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    const trimmed = symbol.trim().toUpperCase();
    if (!trimmed) {
      setMarkdownResult('');
      return;
    }
    setError(null);
    setLoading(true);
    setMarkdownResult(`Fetching analysis for **${trimmed}**...`);
    try {
      const response = await fetch('http://127.0.0.1:5001/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_symbol: trimmed, analysis_type: analysisType }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `${response.status} ${response.statusText}`);
      }
      const json = await response.json();
      if (json.status === 'success' && json.data) {
        setMarkdownResult(json.data);
      } else {
        throw new Error(json.message || 'Unexpected API response');
      }
    } catch (err: any) {
      setMarkdownResult('');
      setError(err.message || 'An error occurred during analysis.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') analyze();
  };

  return (
    <div className="min-h-screen relative bg-gray-100 p-8 flex items-center justify-center overflow-hidden">
      {/* Background squares animation */}
      <div className="absolute inset-0 z-0">
        <Squares 
          direction="diagonal"
          speed={0.5}
          squareSize={40}
          borderColor="#3b82f6"
          hoverFillColor="rgba(59, 130, 246, 0.2)"
        />
      </div>
      <main className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-8 w-full max-w-3xl z-10">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">Interactive Stock Analyzer</h1>
        </header>

        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
              <div className="flex items-center">
                <label htmlFor="stockSymbol" className="mr-2 font-medium">Symbol:</label>
                <input
                  id="stockSymbol"
                  placeholder="e.g., AAPL, GOOGL"
                  value={symbol}
                  onChange={e => setSymbol(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="h-9 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center">
                <label htmlFor="analysisType" className="mr-2 font-medium">Analysis Type:</label>
                <select
                  id="analysisType"
                  value={analysisType}
                  onChange={e => setAnalysisType(e.target.value)}
                  className="h-9 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                >
                  <option value="Complete Analysis">Complete Analysis</option>
                  <option value="News Impact">News Impact</option>
                </select>
              </div>
              
              <Button 
                onClick={analyze} 
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {loading ? 'Analyzing...' : 'Analyze'}
              </Button>
            </div>
        </div>

        {error && <p className="text-red-600">{error}</p>}

        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>Enter stock symbol and click Analyze to see results.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-auto">
            <ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    table: ({ children }) => (
      <Table className="w-full my-4 border">
        {children}
      </Table>
    ),
    thead: ({ children }) => <TableHeader>{children}</TableHeader>,
    tbody: ({ children }) => <TableBody>{children}</TableBody>,
    tr: ({ children }) => <TableRow>{children}</TableRow>,
    th: ({ children }) => (
      <TableHead className="bg-muted font-semibold px-4 py-2 text-left">
        {children}
      </TableHead>
    ),
    td: ({ children }) => (
      <TableCell className="px-4 py-2 border-t">
        {children}
      </TableCell>
    ),
    h1: ({ children }) => <h1 className="text-2xl font-bold my-4">{children}</h1>,
    h2: ({ children }) => <h2 className="text-xl font-semibold my-3">{children}</h2>,
    h3: ({ children }) => <h3 className="text-lg font-semibold my-2">{children}</h3>,
    p: ({ children }) => <p className="my-2">{children}</p>,
    li: ({ children }) => <li className="ml-4 list-disc">{children}</li>,
    ul: ({ children }) => <ul className="my-2 ml-6">{children}</ul>,
  }}
>
  {markdownResult}
</ReactMarkdown>

          </CardContent>
        </Card>
      </main>
    </div>
  );
}
