import {
  FileTextOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';

import {
  Avatar,
  Button,
  Layout,
  Space,
  Typography,
} from 'antd';

import {
  Link,
  Outlet,
  useNavigate,
} from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

import uasLogo from '../../assets/uas-logo.png';

export default function RespondentLayout() {
  const {
    signOut,
    profile,
  } = useAuth();

  const nav = useNavigate();

  const handleLogout = async () => {
    await signOut();
    nav('/login');
  };

  return (
    <Layout className="respondent-layout">
      <Layout.Header className="respondent-header">
        <div className="respondent-header-brand">
          <img
            src={uasLogo}
            alt="Universidad Autónoma de Sinaloa"
            className="respondent-logo"
          />

          <div>
            <Link
              to="/forms"
              className="resp-brand"
            >
              Apoyos Digitales
            </Link>

            <span className="resp-sub">
              Facultad de Ingeniería Mochis
            </span>
          </div>
        </div>

        <Space
          size={20}
          className="respondent-header-actions"
        >
          <Link
            to="/forms"
            className="respondent-nav-link"
          >
            <FileTextOutlined />
            Formularios
          </Link>

          <Link
            to="/my-submissions"
            className="respondent-nav-link"
          >
            Mis envíos
          </Link>

          <div className="respondent-user">
            <Avatar
              size={34}
              icon={<UserOutlined />}
            />

            <div className="respondent-user-text">
              <strong>
                {profile?.full_name || 'Usuario'}
              </strong>

              <span>Respondente</span>
            </div>
          </div>

          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            Salir
          </Button>
        </Space>
      </Layout.Header>

      <Layout.Content className="respondent-content-wrapper">
        <div className="respondent-content">
          <Outlet />
        </div>
      </Layout.Content>
    </Layout>
  );
}