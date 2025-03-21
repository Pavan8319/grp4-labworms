// Workspace.js
import React, { useState, useEffect, useRef, useCallback  } from 'react';
import CodeEditor from '@uiw/react-textarea-code-editor';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Split from 'react-split';
import { AiOutlineFullscreen, AiOutlineSetting, AiOutlineLike, AiOutlineDislike } from 'react-icons/ai';
import { BsChevronDown } from 'react-icons/bs';
import { auth } from './firebase';
import useWindowSize from './windowsize';
import './workspace.css';
import ReactMarkdown from 'react-markdown';
const apiUrl = "https://leetcode-46562.uc.r.appspot.com";
// const apiUrl = "http://127.0.0.1:5000";

const Workspace = () => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const textareaRef = useRef(null);
  const defaultEditorOptions = {
    fontSize: 14,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    lineNumbers: 'on',
    wordWrap: 'on',
    formatOnPaste: false,
    formatOnType: false,
    acceptSuggestionOnEnter: "on",
    tabSize: 2,
    padding: { top: 10 },
    suggest: { 
      showKeywords: true,
      preview: true
    },
    renderWhitespace: 'none',
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    overviewRulerBorder: false,
    lineDecorationsWidth: 0,
    contextmenu: false,
    folding: true,
    dragAndDrop: false,
    links: false,
    minimap: { enabled: false },
  };
  const { questionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const [code, setCode] = useState(
    `function add(a, b) {\n  return a + b;\n}`
  );

  // State management
  const [problemData, setProblemData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState('editor');
  // const [code, setCode] = useState('');
  const [activeTestCase, setActiveTestCase] = useState(0);
  const [consoleOutput, setConsoleOutput] = useState('');
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [fontSize, setFontSize] = useState('14');
  const [executionStatus, setExecutionStatus] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('python'); // Default to JavaScript
  const [selectedTestCaseDetails, setSelectedTestCaseDetails] = useState(null);

  const isMobile = width <= 768;

  const languageSettings = {
    python: {
      tabSize: 4,
      insertSpaces: true,
      defaultTemplate: `def solution(nums):\n    # Write your code here\n    pass`,
      defaultImports: `# Python starter code\nfrom typing import List\n\n`
    },
    javascript: {
      tabSize: 2,
      insertSpaces: true,
      defaultTemplate: `function solution(nums) {\n  // Write your code here\n  return;\n}`,
      defaultImports: `// JavaScript starter code\n\n`
    },
    java: {
      tabSize: 4,
      insertSpaces: true,
      defaultTemplate: `class Solution {\n    public static void solution(int[] nums) {\n        // Write your code here\n    }\n}`,
      defaultImports: `// Java starter code\n\n`
    }
  };

  useEffect(() => {
    if (problemData?.testCases && problemData.testCases[activeTestCase]) {
      const testCase = problemData.testCases[activeTestCase];
      setSelectedTestCaseDetails(
        <div style={{ color: 'white', fontFamily: 'monospace', lineHeight: '1.5' }}>
          <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '1.2em' }}>
            Test Case {activeTestCase + 1}:
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Input:</strong>
            <pre style={{ backgroundColor: '#222', padding: '10px', borderRadius: '5px', color: '#0f0' }}>
              {JSON.stringify(testCase.input, null, 2)}
            </pre>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Expected Output:</strong>
            <pre style={{ backgroundColor: '#222', padding: '10px', borderRadius: '5px', color: '#0ff' }}>
              {JSON.stringify(testCase.output, null, 2)}
            </pre>
          </div>
        </div>
      );
    }
  }, [activeTestCase, problemData]);

  const handleEditorWillMount = (monaco) => {
    monacoRef.current = monaco;
    
    // Define custom theme
    monaco.editor.defineTheme('custom-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' }
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#2d2d2d',
        'editorCursor.foreground': '#d4d4d4',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#3a3d41'
      }
    });
  
    // Language-specific completions
    monaco.languages.registerCompletionItemProvider('python', {
      provideCompletionItems: (model, position) => {
        const suggestions = [
          {
            label: 'def',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'def ${1:function_name}(${2:parameters}):\n\t${3:pass}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
          },
          {
            label: 'if',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'if ${1:condition}:\n\t${2:pass}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
          },
          {
            label: 'for',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'for ${1:item} in ${2:items}:\n\t${3:pass}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
          }
        ];
        return { suggestions };
      }
    });
  };


  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    const currentLangSettings = languageSettings[selectedLanguage];
    
    editor.updateOptions({
      ...defaultEditorOptions,
      tabSize: currentLangSettings.tabSize,
      insertSpaces: currentLangSettings.insertSpaces,
    });
  };


  // Language-specific starter code templates
  const starterTemplates = {
    javascript: `// Write your JavaScript solution here
function solution(input) {
  // Your code here
  return null;
}`,
    python: `# Write your Python solution here
def solution(input):
    # Your code here
    return None`,
    java: `// Write your Java solution here
public class Solution {
    public static Object solution(Object input) {
        // Your code here
        return null;
    }
}`
  };
  // Fetch problem data
  useEffect(() => {
    const fetchProblemData = async () => {
      try {
        setIsLoading(true);
  
        // Check if question data and test cases are passed via navigation state
        if (location.state?.question) {
          console.log('Using question data from navigation state:', location.state.question);
  
          // Ensure test cases are included
          if (!location.state.question.testCases) {
            console.log('Test cases not found in navigation state, fetching from API...');
            const user = auth.currentUser;
            if (!user) {
              throw new Error('No authenticated user found');
            }
  
            const token = await user.getIdToken();
            const response = await fetch(`${apiUrl}/api/questions/${questionId}`, {
              
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              credentials: 'include',
            });
  
            if (!response.ok) {
              throw new Error('Failed to fetch question test cases');
            }
  
            const data = await response.json();
            if (data.success && data.question) {
              location.state.question.testCases = data.question.testCases;
            } else {
              throw new Error('Invalid test cases data');
            }
          }
  
          // Set the problem data with updated test cases
          setProblemData(location.state.question);
          setCode(location.state.question.starterCode || '// Write your code here');
        } else {
          console.log('Fetching question data for ID:', questionId);
  
          // Fetch question data from API if not provided in navigation state
          const user = auth.currentUser;
          if (!user) {
            throw new Error('No authenticated user found');
          }
  
          const token = await user.getIdToken();
          const response = await fetch(`${apiUrl}/api/questions/${questionId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });
  
          if (!response.ok) {
            throw new Error('Failed to fetch question data');
          }
  
          const data = await response.json();
          console.log('Fetched question data:', data);
          if (!data.success || !data.question) {
            throw new Error(data.error || 'Invalid question data');
          }
  
          setProblemData(data.question);
          setCode(data.question.starterCode || '// Write your code here');
        }
      } catch (error) {
        console.error('Error loading problem:', error);
        navigate('/questions'); // Redirect back to questions list on error
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchProblemData();
  }, [questionId, location.state, navigate]);
  


  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleCodeChange = (event) => {
    const cursorPosition = event.target.selectionStart;
    const updatedCode = event.target.value;

    setCode(updatedCode);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = cursorPosition;
        textareaRef.current.selectionEnd = cursorPosition;
      }
    }, 0);
  };

  // Update language selection handler
  const handleLanguageChange = (newLang) => {
    setSelectedLanguage(newLang);
    // Always set starter code when changing language
    const template = languageSettings[newLang].defaultImports + 
                    languageSettings[newLang].defaultTemplate;
    setCode(template);
  };

  useEffect(() => {
    const template = languageSettings[selectedLanguage].defaultImports + 
                    languageSettings[selectedLanguage].defaultTemplate;
    setCode(template);
  }, []); // Run only once on mount


  const executeCode = async () => {
    try {
      setExecutionStatus('running');
      setSelectedTestCaseDetails(null); // Clear the test case preview
  
      if (!problemData?.testCases) {
        throw new Error('No test cases available');
      }
  
      const testCase = problemData.testCases[activeTestCase];
  
      const response = await fetch(`${apiUrl}/api/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language: selectedLanguage,
          testCase,
        }),
      });
  
      const result = await response.json();
  
      if (result.success) {
        const { actualOutput, expectedOutput, errorOutput, status } = result.result;
  
        setConsoleOutput(
          <div style={{ color: 'white', fontFamily: 'monospace', lineHeight: '1.5' }}>
            <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '1.2em' }}>
              Test Case {activeTestCase + 1} Results:
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Input:</strong>
              <pre style={{ backgroundColor: '#222', padding: '10px', borderRadius: '5px', color: '#0f0' }}>
                {JSON.stringify(testCase.input, null, 2)}
              </pre>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Expected Output:</strong>
              <pre style={{ backgroundColor: '#222', padding: '10px', borderRadius: '5px', color: '#0ff' }}>
                {JSON.stringify(expectedOutput, null, 2)}
              </pre>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Your Output:</strong>
              <pre style={{ backgroundColor: '#222', padding: '10px', borderRadius: '5px', color: actualOutput === expectedOutput ? '#0f0' : '#f00' }}>
                {JSON.stringify(actualOutput, null, 2)}
              </pre>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Errors:</strong>
              <pre style={{ backgroundColor: '#222', padding: '10px', borderRadius: '5px', color: '#f80' }}>
                {errorOutput || 'None'}
              </pre>
            </div>
            <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
              <strong>Status:</strong>
              <span style={{ color: status === 'PASSED' ? '#0f0' : '#f00' }}> {status}</span>
            </div>
          </div>
        );
  
        setExecutionStatus(status === 'PASSED' ? 'passed' : 'failed');
      } else {
        setConsoleOutput(`Error: ${result.error}`);
        setExecutionStatus('error');
      }
    } catch (error) {
      setConsoleOutput(`Error: ${error.message}`);
      setExecutionStatus('error');
    }
  };
  


  const submitCode = async () => {
    try {
      setExecutionStatus('running');
      setConsoleOutput('');
    
      if (!problemData?.testCases || problemData.testCases.length === 0) {
        throw new Error('No test cases available');
      }
  
      let totalTests = problemData.testCases.length;
      let passedTests = 0;
  
      for (let i = 0; i < problemData.testCases.length; i++) {
        const testCase = problemData.testCases[i];
        const response = await fetch(`${apiUrl}/api/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code, // User's code
            language: selectedLanguage, // Language selected (e.g., 'javascript', 'python')
            testCase, // Single test case: { input, output }
          }),
        });
        
        const result = await response.json();
        if (result.success && result.result.status === 'PASSED') {
          passedTests += 1;
        }
      }
  
      // Display summary statistics
      const formattedOutput = (
        <div style={{ color: 'white', fontFamily: 'monospace', lineHeight: '1.5' }}>
          <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '1.2em' }}>
            Test Execution Summary:
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Total Tests:</strong> {totalTests}
          </div>
          <div style={{ marginBottom: '8px', color: passedTests === totalTests ? '#0f0' : '#f00' }}>
            <strong>Tests Passed:</strong> {passedTests}
          </div>
          <div style={{ marginBottom: '8px', color: passedTests === totalTests ? '#0f0' : '#f00' }}>
            <strong>Tests Failed:</strong> {totalTests - passedTests}
          </div>
          <div style={{ fontWeight: 'bold', color: passedTests === totalTests ? '#0f0' : '#f00' }}>
            <strong>Status:</strong> {passedTests === totalTests ? 'ALL TESTS PASSED 🎉' : 'SOME TESTS FAILED'}
          </div>
        </div>
      );
  
      setConsoleOutput(formattedOutput);
      setExecutionStatus(passedTests === totalTests ? 'passed' : 'failed');
    } catch (error) {
      setConsoleOutput(`Error: ${error.message}`);
      setExecutionStatus('error');
    }
  };



  const handleFontSizeChange = (newSize) => {
    setFontSize(parseInt(newSize));
  };


  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Mobile navigation component
  const MobileNavigation = () => (
    <div className="mobile-tabs">
      <button
        className={`mobile-tab ${activeView === 'description' ? 'active' : ''}`}
        onClick={() => setActiveView('description')}
      >
        Description
      </button>
      <button
        className={`mobile-tab ${activeView === 'editor' ? 'active' : ''}`}
        onClick={() => setActiveView('editor')}
      >
        Code
      </button>
    </div>
  );

  // Problem Description Component
  const ProblemDescription = () => {
    if (!problemData) return null;
    
    return (
      <>
        <div className="description-header">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{problemData.title}</h1>
            <span className={`difficulty-badge difficulty-${problemData.difficulty.toLowerCase()}`}>
              {problemData.difficulty}
            </span>
          </div>
          
          <div className="flex gap-4 mt-4">
            <button className="control-button">
              <AiOutlineLike className="inline mr-1" />
              {problemData.solvedCount || 0}
            </button>
            <button className="control-button">
              <AiOutlineDislike className="inline mr-1" />
              {problemData.acceptance || 0}%
            </button>
          </div>
        </div>

        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">Description</h2>
          <div className="text-gray-300 whitespace-pre-wrap mb-6">
            <ReactMarkdown>{problemData.description}</ReactMarkdown>
          </div>

          {problemData.testCases && (
            <>
              <h3 className="text-lg font-semibold mb-3">Examples:</h3>
              {problemData.testCases.map((testCase, index) => (
                <div key={index} className="example-box">
                  <strong>Example {index + 1}:</strong>
                  <div className="mt-2">
                    <p>Input:</p>
                    <ReactMarkdown>{`\`\`\`json\n${JSON.stringify(testCase.input, null, 2)}\n\`\`\``}</ReactMarkdown>
                    <p>Output:</p>
                    <ReactMarkdown>{`\`\`\`json\n${JSON.stringify(testCase.output, null, 2)}\n\`\`\``}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </>
          )}

          {problemData.constraints && (
            <>
              <h3 className="text-lg font-semibold mt-6 mb-3">Constraints:</h3>
              <div className="text-gray-300">
                <ReactMarkdown>{problemData.constraints.join("\n")}</ReactMarkdown>
              </div>
            </>
          )}
        </div>
      </>
    );
  };

  // Editor Section Component
  const EditorSection = () => (
    <>
      <div className="editor-header">
        <div className="editor-controls">
          <select 
            className="control-button"
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
          >
            {[12, 14, 16, 18, 20].map(size => (
              <option key={size} value={size}>{size}px</option>
            ))}
          </select>
          <select 
            className="control-button"
            value={selectedLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
          </select>
        </div>
        <div className="editor-controls">
          <button className="control-button" onClick={handleFullscreen}>
            <AiOutlineFullscreen />
          </button>
          <button className="control-button">
            <AiOutlineSetting />
          </button>
        </div>
      </div>

      <div className="editor-content">
      <CodeEditor
        ref={textareaRef}
        value={code}
        language={selectedLanguage}
        placeholder={`Please enter ${selectedLanguage} code.`}
        onChange={handleCodeChange}
        padding={15}
        style={{
          fontSize: `${fontSize}px`,
          backgroundColor: '#1e1e1e',
          fontFamily: 'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
          minHeight: '300px',
          height: '100%',
          borderRadius: '4px',
        }}
        data-color-mode="dark"
        autoFocus={true}
        // Add these props for better syntax highlighting
        data-theme="dark"
        data-line-numbers="true"
        className={`language-${selectedLanguage}`}
        // Add custom styles for syntax highlighting
        customStyle={{
          'pre[class*="language-"]': {
            background: '#1e1e1e',
          },
          'code[class*="language-"]': {
            color: '#d4d4d4',
          },
          '.token.comment': { color: '#6A9955' },
          '.token.keyword': { color: '#569CD6' },
          '.token.string': { color: '#CE9178' },
          '.token.function': { color: '#DCDCAA' },
          '.token.number': { color: '#B5CEA8' },
          '.token.operator': { color: '#D4D4D4' },
          '.token.class-name': { color: '#4EC9B0' },
          '.token.variable': { color: '#9CDCFE' },
        }}
      />
    </div>

    <div className="testcase-section">
      <div className="testcase-tabs">
        {problemData?.testCases?.map((_, index) => (
          <button
            key={index}
            className={`testcase-tab ${activeTestCase === index ? 'active' : ''}`}
            onClick={() => setActiveTestCase(index)}
          >
            Case {index + 1}
          </button>
        ))}
      </div>
      <div className="console-output">
        {consoleOutput || selectedTestCaseDetails}
      </div>
    </div>

      <div className="editor-footer">
        <button 
          className="control-button"
          onClick={() => setIsConsoleOpen(!isConsoleOpen)}
        >
          Console
          <BsChevronDown className={`inline ml-1 transform ${isConsoleOpen ? 'rotate-180' : ''}`} />
        </button>
        <div className="editor-controls">
          <button className="run-button" onClick={executeCode}>
            Run
          </button>
          <button className="submit-button" onClick={submitCode}>
            Submit
          </button>
        </div>
        </div>


    </>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (!problemData) {
    return (
      <div className="text-center mt-5">
        <h2>Problem not found</h2>
        <button 
          className="btn btn-primary mt-3"
          onClick={() => navigate('/questions')}
        >
          Return to Problems
        </button>
      </div>
    );
  }

  // Render the main content based on screen size
  const renderContent = () => {
    if (isMobile) {
      return (
        <>
          <MobileNavigation />
          <div className={`problem-description ${activeView === 'description' ? 'active' : ''}`}>
            <ProblemDescription />
          </div>
          <div className={`editor-section ${activeView === 'editor' ? 'active' : ''}`}>
            <EditorSection />
          </div>
        </>
      );
    }

    return (
      <Split 
        className="split" 
        sizes={[40, 60]} 
        minSize={300}
        gutterSize={10}
        snapOffset={30}
      >
        <div className="problem-description">
          <ProblemDescription />
        </div>
        <div className="editor-section">
          <EditorSection />
        </div>
      </Split>
    );
  };

  return (
    <div className="workspace-container">
      {renderContent()}
    </div>
  );
};

export default Workspace;