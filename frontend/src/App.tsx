import { Suspense, lazy, useEffect } from 'react';
import './styles/annotation.css';
import './styles/upload.css';
import './styles/document-list.css';
import { useDocumentListStore } from './store/useDocumentListStore';

const ListScreen = lazy(() => import('./screens/ListScreen'));
const AnnotateScreen = lazy(() => import('./screens/AnnotateScreen'));

function App() {
  const loadFromLocalStorage = useDocumentListStore((s) => s.loadFromLocalStorage);

  useEffect(() => {
    loadFromLocalStorage();
  }, [loadFromLocalStorage]);

  const appView = useDocumentListStore((s) => s.appView);

  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#666' }}>加载中...</div>}>
      {appView === 'list' ? <ListScreen /> : <AnnotateScreen />}
    </Suspense>
  );
}

export default App;
