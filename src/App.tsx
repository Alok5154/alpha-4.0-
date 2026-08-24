import React from 'react';
import { KageLandingPage } from './components/KageLandingPage';

export function App() {
  return (
    <main className="kage-app-root">
      <KageLandingPage
        layoutHero="b"
        layoutStory="b"
        layoutGallery="b"
        layoutCurriculum="b"
        layoutClosing="b"
        layoutFooter="b"
      />
    </main>
  );
}

export default App;
