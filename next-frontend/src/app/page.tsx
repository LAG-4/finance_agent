'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
    <div className="min-h-screen p-8 sm:p-20 grid grid-rows-[20px_1fr_20px] gap-16 font-sans">
      <main className="row-start-2 w-full max-w-3xl mx-auto flex flex-col gap-8">
        <h1 className="text-3xl font-bold text-center">Interactive Stock Analyzer</h1>

        <div className="flex flex-col sm:flex-row gap-4">
          <input
            aria-label="Stock Symbol"
            placeholder="e.g., AAPL, GOOGL"
            value={symbol}
            onChange={e => setSymbol(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={analysisType}
            onChange={e => setAnalysisType(e.target.value)}
            className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>Complete Analysis</option>
            <option>News Impact</option>
          </select>
          <Button
            onClick={analyze}
            disabled={loading}
            className="px-6"
          >
            {loading ? 'Analyzing…' : 'Analyze'}
          </Button>
        </div>

        {error && <p className="text-red-600">{error}</p>}

        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>Rendered with ShadCN components</CardDescription>
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
          <CardFooter>
            <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleString()}</p>
          </CardFooter>
        </Card>
      </main>

      <footer className="row-start-3 text-center text-gray-600">
        Made by LAG
      </footer>
    </div>
  );
}
