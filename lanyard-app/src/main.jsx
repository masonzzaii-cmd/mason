import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

const container = document.getElementById('root');
const root = createRoot(container);

const params = new URLSearchParams(window.location.search);
const frontImage = params.get('front') || null;
const backImage = params.get('back') || null;
const lanyardImage = params.get('band') || null;

root.render(
  <React.StrictMode>
    <App
      frontImage={frontImage}
      backImage={backImage}
      lanyardImage={lanyardImage}
    />
  </React.StrictMode>
);
