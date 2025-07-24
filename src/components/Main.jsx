import { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import Preview from './Preview';

// --- Custom Markdown Processing ---

// 1. Create a renderer but ONLY for things that are easy to customize.
const renderer = new marked.Renderer();

// 2. Set the options to use our minimal custom renderer
marked.setOptions({ renderer, breaks: true });

// 3. Post-processing function to wrap standard HTML tags
const postProcessHtml = (html) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const newBody = doc.createElement('body');

  let currentSectionContent = null;

  doc.body.childNodes.forEach(node => {
    if (node.nodeName === 'H1') {
      const div = doc.createElement('div');
      div.className = 'main-title-container';
      div.innerHTML = node.innerHTML;
      newBody.appendChild(div);
      currentSectionContent = null;
    } else if (node.nodeName === 'H2') {
      const div = doc.createElement('div');
      div.className = 'section-header';
      div.innerHTML = node.innerHTML;
      newBody.appendChild(div);
      currentSectionContent = null;
    } else if (node.nodeName === 'H3') {
      const momentDiv = doc.createElement('div');
      momentDiv.className = 'session-moment';
      
      const headerDiv = doc.createElement('div');
      headerDiv.className = 'moment-header';
      
      const h3 = doc.createElement('h3');
      h3.innerHTML = node.innerHTML;
      headerDiv.appendChild(h3);

      // Extract time from italic text
      const nextNode = node.nextElementSibling;
      if (nextNode && nextNode.nodeName === 'P' && nextNode.querySelector('em')) {
        const span = doc.createElement('span');
        span.innerHTML = nextNode.querySelector('em').innerHTML;
        headerDiv.appendChild(span);
        nextNode.remove(); // Remove the paragraph with the time
      }

      momentDiv.appendChild(headerDiv);
      
      const contentDiv = doc.createElement('div');
      contentDiv.className = 'moment-content';
      momentDiv.appendChild(contentDiv);
      
      newBody.appendChild(momentDiv);
      currentSectionContent = contentDiv;

    } else if (node.nodeName === 'BLOCKQUOTE') {
        const taskHome = doc.createElement('div');
        taskHome.className = 'task-home';
        taskHome.innerHTML = node.innerHTML;
        newBody.appendChild(taskHome);
        currentSectionContent = null;
    } else if (node.nodeName === 'P' && node.innerHTML.includes('<strong>')) {
        if (!currentSectionContent || currentSectionContent.parentElement.className !== 'info-section') {
            const infoSection = doc.createElement('div');
            infoSection.className = 'section-content info-section';
            newBody.appendChild(infoSection);
            currentSectionContent = infoSection;
        }
        const p = doc.createElement('p');
        p.innerHTML = node.innerHTML.replace(/<strong>(.*?)<\/strong>:(.*)/, '<strong>$1:</strong><span>$2</span>');
        currentSectionContent.appendChild(p);
    } else {
      if (currentSectionContent) {
        currentSectionContent.appendChild(node.cloneNode(true));
      } else {
        newBody.appendChild(node.cloneNode(true));
      }
    }
  });

  return newBody.innerHTML;
};

// --- Initial Content ---

const initialMarkdown = `# Título de la Sesión

## DATOS INFORMATIVOS

- **Institución Educativa:** 
- **Grado y sección:** 
- **Área / Curso:** 
- **Duración:** 
- **Nivel:** 
- **Docente:** 
- **Fecha:** 

## 1. PROPÓSITOS Y EVIDENCIAS DE APRENDIZAJE

| COMPETENCIAS / CAPACIDADES | DESEMPEÑOS | ¿QUÉ NOS DARÁ EVIDENCIAS DE APRENDIZAJE? |
| :--- | :--- | :--- |
| | | |

## 2. PREPARACIÓN DE LA SESIÓN

| ¿Qué necesitamos? | ¿Qué recursos o materiales se utilizarán? |
| :--- | :--- |
| | |

## 3. MOMENTOS DE LA SESIÓN

### INICIO
*Tiempo aproximado: 5 minutos*

- Saludo y bienvenida a los estudiantes.
- Presentación del tema de la sesión.
- Activación de conocimientos previos: Pregunta a los estudiantes sobre lo que saben del tema.

### DESARROLLO
*Tiempo aproximado: 35 minutos*

- **Actividad 1:** [Descripción de la actividad]
  - Objetivo: [Objetivo de la actividad]
  - Materiales: [Materiales necesarios]
  - Procedimiento: [Pasos a seguir]

### CIERRE
*Tiempo aproximado: 5 minutos*

- Conclusiones de la sesión.

> **TAREA PARA LA CASA:**
> - [Descripción de la tarea para los estudiantes]

## 4. REFLEXIONES SOBRE EL APRENDIZAJE

- ¿Qué avances tuvieron mis estudiantes?
- ¿Qué dificultades tuvieron mis estudiantes?
- ¿Qué aprendizajes debo reforzar en la siguiente sesión?
- ¿Qué actividades, estrategias y materiales funcionaron y cuáles no?


<FIRMAS />
`;

// --- React Component ---

export default function Main() {
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [html, setHtml] = useState('');
  const [lastChangedBy, setLastChangedBy] = useState('editor'); // 'editor' or 'preview'
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Replace <FIRMAS /> tag first
    let processedText = markdown.replace(
      /<FIRMAS \/>/g,
      `<footer class="signatures">
        <div class="signature-box">
          <div class="line"></div>
          <p>PROFESOR/A</p>
        </div>
        <div class="signature-box">
          <div class="line"></div>
          <p>V°B° DIRECCIÓN</p>
        </div>
      </footer>`
    );

    // Replace <FIRMAS> tag first
    processedText = processedText.replace(
      /<FIRMAS>/g,
      `<footer class="signatures">
        <div class="signature-box">
          <div class="line"></div>
          <p>PROFESOR/A</p>
        </div>
        <div class="signature-box">
          <div class="line"></div>
          <p>V°B° DIRECCIÓN</p>
        </div>
      </footer>`
    );

    // Generate standard HTML
    let rawHtml = marked(processedText);

    // Apply custom wrappers for headings
    let finalHtml = postProcessHtml(rawHtml);

    setHtml(finalHtml);
  }, [markdown]);

  const handleMarkdownChange = (event) => {
    setMarkdown(event.target.value);
    setLastChangedBy('editor');
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMarkdown(e.target.result);
        setLastChangedBy('editor');
      };
      reader.readAsText(file);
    }
  };

  const handleSaveMarkdown = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sesion.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    window.print();
  };

  const [view, setView] = useState('split'); // 'editor', 'preview', 'split'

  const handleHtmlChange = (newMarkdown) => {
    setMarkdown(newMarkdown);
    setLastChangedBy('preview');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Mobile Toggle Button */}
      <div className="p-4 bg-gray-100 border-b border-gray-200 no-print">
       <div className="flex items-center space-x-2">
                <button onClick={() => setView('split')} className={`px-3 py-2 rounded ${view === 'split' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Ambos</button>
                <button onClick={() => setView('editor')} className={`px-3 py-2 rounded ${view === 'editor' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Editor</button>
                <button onClick={() => setView('preview')} className={`px-3 py-2 rounded ${view === 'preview' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Vista Previa</button>
            </div>
      </div>

      <div className="flex flex-1 overflow-hidden p-4 gap-4 print-parent">
        {/* Editor Column */}
        <div className={`flex-col h-full w-full ${view === 'editor' || view === 'split' ? 'flex' : 'hidden'} ${view === 'split' ? 'md:w-1/2' : 'md:w-full'} no-print`}>
          <div className="flex items-center mb-4 space-x-2">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => fileInputRef.current.click()}
            >
              Subir .md
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".md"
              onChange={handleFileUpload}
            />
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              onClick={handleSaveMarkdown}
            >
              Guardar .md
            </button>
            <button
              className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded"
              onClick={handlePrint}
            >
              Imprimir / PDF
            </button>
          </div>
          <textarea
            className="w-full flex-grow p-3 border rounded-lg shadow-sm resize-none font-mono text-sm"
            value={markdown}
            onChange={handleMarkdownChange}
            placeholder="Escribe tu markdown aquí..."
          />
        </div>

        {/* Preview Column */}
        <div id="preview-section" className={`flex-col h-full w-full ${view === 'preview' || view === 'split' ? 'flex' : 'hidden'} ${view === 'split' ? 'md:w-1/2' : 'md:w-full'} bg-white rounded-lg shadow-sm printable-area`}>
            <Preview html={html} onHtmlChange={handleHtmlChange} lastChangedBy={lastChangedBy} />
        </div>
      </div>
    </div>
  );
}