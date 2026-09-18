import {
  AuditOutlined,
  DashboardOutlined,
  FileTextOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from '@ant-design/icons';

import {
  Avatar,
  Button,
  Layout,
  Menu,
  Typography,
} from 'antd';

import {
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { useState } from 'react';

import { useAuth } from '../../context/AuthContext';

import uasLogo from '../../assets/uas-logo.png';

const {
  Sider,
  Header,
  Content,
} = Layout;

export default function AdminLayout() {
  const nav = useNavigate();
  const location = useLocation();

  const {
    profile,
    signOut,
  } = useAuth();

  const [collapsed, setCollapsed] = useState(false);

  const getSelectedKey = () => {
    if (location.pathname.startsWith('/admin/forms')) {
      return '/admin/forms';
    }

    if (location.pathname.startsWith('/admin/audit')) {
      return '/admin/audit';
    }

    return '/admin/dashboard';
  };

  const handleLogout = async () => {
    await signOut();
    nav('/login');
  };

  return (
    <Layout className="admin-shell">
      <Sider
        width={252}
        collapsedWidth={78}
        collapsed={collapsed}
        trigger={null}
        className="admin-sidebar"
      >
        <div
          className={
            collapsed
              ? 'admin-brand admin-brand-collapsed'
              : 'admin-brand'
          }
        >
          <img
            src={uasLogo}
            alt="Universidad Autónoma de Sinaloa"
            className="admin-brand-logo"
          />

          {!collapsed && (
            <div className="admin-brand-text">
              <strong>Apoyos Digitales</strong>
              <span>Facultad de Ingeniería Mochis</span>
            </div>
          )}
        </div>

        {!collapsed && (
          <div className="admin-sidebar-section-title">
            ADMINISTRACIÓN
          </div>
        )}

        <Menu
          mode="inline"
          theme="dark"
          selectedKeys={[getSelectedKey()]}
          className="admin-menu"
          onClick={({ key }) => nav(key)}
          items={[
            {
              key: '/admin/dashboard',
              icon: <DashboardOutlined />,
              label: 'Dashboard',
            },
            {
              key: '/admin/forms',
              icon: <FileTextOutlined />,
              label: 'Formularios',
            },
            {
              key: '/admin/audit',
              icon: <AuditOutlined />,
              label: 'Auditoría',
            },
          ]}
        />

        <div className="admin-sidebar-bottom">
          {!collapsed && (
            <div className="admin-sidebar-user">
              <Avatar
                size={34}
                icon={<UserOutlined />}
              />

              <div className="admin-sidebar-user-info">
                <strong>
                  {profile?.full_name || 'Administrador'}
                </strong>

                <span>Administrador</span>
              </div>
            </div>
          )}

          <Button
            type="text"
            danger
            icon={<LogoutOutlined />}
            className="admin-sidebar-logout"
            onClick={handleLogout}
          >
            {!collapsed && 'Cerrar sesión'}
          </Button>
        </div>
      </Sider>

      <Layout className="admin-main">
        <Header className="admin-topbar">
          <div className="admin-topbar-left">
            <Button
              type="text"
              className="sidebar-toggle"
              icon={
                collapsed
                  ? <MenuUnfoldOutlined />
                  : <MenuFoldOutlined />
              }
              onClick={() => setCollapsed(!collapsed)}
            />

            <div className="admin-topbar-heading">
              <Typography.Text className="admin-topbar-title">
                Panel administrativo
              </Typography.Text>

              <Typography.Text className="admin-topbar-subtitle">
                Facultad de Ingeniería Mochis
              </Typography.Text>
            </div>
          </div>

          <div className="admin-topbar-profile">
            <div className="admin-topbar-user-text">
              <strong>
                {profile?.full_name || 'Facultad UAS Admin'}
              </strong>

              <span>Administrador</span>
            </div>

            <Avatar
              size={36}
              icon={<UserOutlined />}
            />
          </div>
        </Header>

        <Content className="admin-content">
          <div className="admin-content-inner">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}