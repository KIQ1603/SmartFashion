import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import App from './App';
import 'antd/dist/reset.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import './index.css';

// Theme đồng bộ với Storefront (design system Minimalism & Swiss Style, chọn qua skill
// ui-ux-pro-max): nền trung tính, 1 accent terracotta duy nhất cho hành động chính,
// font Inter — phù hợp "Enterprise apps, dashboards, professional tools".
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: '#C2410C',
          colorLink: '#C2410C',
          colorText: '#18181B',
          colorTextSecondary: '#52525B',
          colorBorder: '#E4E4E7',
          borderRadius: 8,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
        components: {
          Layout: {
            siderBg: '#18181B',
            headerBg: '#FFFFFF',
          },
          Menu: {
            darkItemBg: '#18181B',
            darkItemSelectedBg: '#27272A',
            darkItemHoverBg: '#27272A',
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
);
