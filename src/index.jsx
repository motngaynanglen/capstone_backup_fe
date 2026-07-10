import React from 'react';
import ReactDOM from 'react-dom/client';
import 'antd/dist/reset.css';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ConfigProvider, App as AntApp } from 'antd';
import { antdTheme } from './theme/antdTheme';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ConfigProvider theme={antdTheme}>
    <AntApp>
      <App />
    </AntApp>
  </ConfigProvider>
);

reportWebVitals();
