import { useState } from 'react';
import Landing from './Landing.jsx';
import BtcApp from './BtcApp.jsx';

export default function App() {
  const [view, setView] = useState('home');

  if (view === 'btc') return <BtcApp onHome={() => setView('home')} />;
  return <Landing onOpenBtc={() => setView('btc')} />;
}
