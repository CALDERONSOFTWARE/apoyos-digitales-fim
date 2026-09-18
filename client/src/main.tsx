import '@ant-design/v5-patch-for-react-19';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import {
  App as AntApp,
  ConfigProvider,
} from 'antd';

import 'antd/dist/reset.css';
import './styles.css';

import RootApp from './App';
import { AuthProvider } from './context/AuthContext';

createRoot(
  document.getElementById('root')!,
).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#185fa7',
          borderRadius: 5,
          fontSize: 14,
          colorBgLayout: '#f4f6f8',
        },

        components: {
          Table: {
            cellPaddingBlockSM: 7,
            cellPaddingInlineSM: 10,
          },

          Card: {
            headerHeightSM: 40,
          },
        },
      }}
    >
      <AntApp>
        <BrowserRouter>
          <AuthProvider>
            <RootApp />
          </AuthProvider>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  </StrictMode>,
);