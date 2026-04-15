import CodeMirror from '@uiw/react-codemirror';
import { markdown as mdLang } from '@codemirror/lang-markdown';
import { html as htmlLang } from '@codemirror/lang-html';

interface ContentEditorProps {
  value: string;
  onChange: (value: string) => void;
  elementType: string;
}

export function ContentEditor({ value, onChange, elementType }: ContentEditorProps) {
  const extensions = elementType === 'table' ? [htmlLang()] : [mdLang()];

  return (
    <div className="source-editor">
      <CodeMirror
        value={value}
        height="200px"
        extensions={extensions}
        onChange={onChange}
        basicSetup={{ lineNumbers: true, foldGutter: true }}
      />
    </div>
  );
}
