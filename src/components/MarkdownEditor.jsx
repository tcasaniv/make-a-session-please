import React, { useState, useEffect } from 'react';
import { marked } from 'marked';

const MarkdownEditor = () => {
  const [markdown, setMarkdown] = useState('## ¡Bienvenido a tu editor de Markdown!\n\nEmpieza a escribir aquí...');
  const [html, setHtml] = useState('');
  const [view, setView] = useState('editor'); // 'editor', 'preview', 'both'

  useEffect(() => {
    const convertMarkdown = async () => {
      const rawHtml = await marked(markdown);
      setHtml(rawHtml);
    };
    convertMarkdown();
  }, [markdown]);

  const handleMarkdownChange = (e) => {
    setMarkdown(e.target.value);
  };

  const toggleView = () => {
    if (view === 'editor') {
      setView('preview');
    } else {
      setView('editor');
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Mobile Toggle Button */}
      <div className="md:hidden p-4 bg-gray-100 border-b border-gray-200">
        <button
          onClick={toggleView}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          {view === 'editor' ? 'Ver Vista Previa' : 'Ver Editor'}
        </button>
      </div>

      {/* Desktop Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor Panel */}
        <div className={`flex-1 p-4 border-r border-gray-200 md:block ${view === 'editor' || view === 'both' ? '' : 'hidden'}`}>
          <textarea
            className="w-full h-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 resize-none"
            value={markdown}
            onChange={handleMarkdownChange}
            placeholder="Escribe tu Markdown aquí..."
          ></textarea>
        </div>

        {/* Preview Panel */}
        <div
          className={`flex-1 p-4 overflow-y-auto md:block ${view === 'preview' || view === 'both' ? '' : 'hidden'}`}
          dangerouslySetInnerHTML={{ __html: html }}
        ></div>
      </div>
    </div>
  );
};

export default MarkdownEditor;
