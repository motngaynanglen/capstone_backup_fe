import React from 'react';
import ReactDOM from 'react-dom/client';
import 'antd/dist/reset.css';
import './index.css';
import App from './App'; // Component giao diện gốc của bạn
import reportWebVitals from './reportWebVitals';
import { ConfigProvider, App as AntApp } from 'antd'; // 🔥 Đổi tên App của Antd thành AntApp
import { antdTheme } from './theme/antdTheme';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ConfigProvider theme={antdTheme}>
    {/* Bọc AntApp ngay bên trong ConfigProvider để message nhận được Theme */}
    <AntApp>
      <App />
    </AntApp>
  </ConfigProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();