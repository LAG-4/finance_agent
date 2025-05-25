// Make sure you've installed the Markdown parser:
// npm install marked

import React, { useState } from 'react';
import './App.css';
import { marked } from 'marked';

export default function App() {
  const [symbol, setSymbol] = useState('GOOGL');
  const [analysisType, setAnalysisType] = useState('Complete Analysis');
  const [resultHtml, setResultHtml] = useState(
    `<p style="text-align:center; color: #777;">Enter a stock symbol and click "Analyze" to see results.</p>`
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyze = async () => {
    const trimmed = symbol.trim().toUpperCase();
    if (!trimmed) {
      setError('Please enter a stock symbol.');
      setResultHtml('');
      return;
    }
    setError(null);
    setLoading(true);
    setResultHtml(`\<p class="loading"\>Fetching analysis for ${trimmed}...\<\/p\>`);
    try {
      const response = await fetch('http://127.0.0.1:5001/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_symbol: trimmed, analysis_type: analysisType })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `${response.status} ${response.statusText}`);
      }
      const json = await response.json();
      if (json.status === 'success' && json.data) {
        setResultHtml(marked.parse(json.data));
      } else {
        throw new Error(json.message || 'Unexpected API response');
      }
    } catch (err) {
      setError(err.message);
      setResultHtml('');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      analyze();
    }
  };

  return (
    <div className="App">
      <div className="container">
        <header>
          <h1>Interactive Stock Analyzer</h1>
        </header>
        <div className="input-section">
          <label htmlFor="stockSymbol">Symbol:</label>
          <input
            id="stockSymbol"
            type="text"
            placeholder="e.g., AAPL, GOOGL"
            value={symbol}
            onChange={e => setSymbol(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <label htmlFor="analysisType">Analysis Type:</label>
          <select
            id="analysisType"
            value={analysisType}
            onChange={e => setAnalysisType(e.target.value)}
          >
            <option value="Complete Analysis">Complete Analysis</option>
            <option value="News Impact">News Impact</option>
          </select>
          <button id="analyzeButton" onClick={analyze} disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
        <div id="resultsContainer" className="results-container">
          {error && <p className="error-message">{error}</p>}
          <div dangerouslySetInnerHTML={{ __html: resultHtml }} />
        </div>
      </div>
    </div>
  );
}
