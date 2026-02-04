import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppRegistry } from 'react-native';
import App from './App';

// Register the app for web
AppRegistry.registerComponent('main', () => App);

const container = document.getElementById('root');
const root = createRoot(container);

// Run the application
AppRegistry.runApplication('main', {
  rootTag: container,
});
