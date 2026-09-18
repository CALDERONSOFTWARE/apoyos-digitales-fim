import { Button, Card, Form, Input, Typography, message } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import { supabase } from '../../services/supabase';

import uasLogo from '../../assets/uas-logo.png';
import uasWallpaper from '../../assets/uas-wallpaper.png';

export default function LoginPage() {
  const nav = useNavigate();

  const [form] = Form.useForm();

  async function submit(v: { username: string; password: string }) {
    const username = v.username.trim().toLowerCase();

    const email = `${username}@uas.local`;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: v.password,
    });

    if (error) {
      return message.error('Usuario o contraseña incorrectos');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();

      return message.error(
        'No se pudo cargar el perfil del usuario'
      );
    }

    nav(
      profile.role === 'admin'
        ? '/admin/dashboard'
        : '/forms'
    );
  }

  return (
    <div
      className="login-page"
      style={{
        backgroundImage: `url(${uasWallpaper})`,
      }}
    >
      <div className="login-overlay" />

      <div className="login-content">
        <Card className="login-card" bordered={false}>
          <div className="login-brand">
            <img
              src={uasLogo}
              alt="Universidad Autónoma de Sinaloa"
              className="login-logo"
            />

            <Typography.Title
              level={2}
              className="login-title"
            >
              Apoyos Digitales
            </Typography.Title>

            <Typography.Paragraph className="login-subtitle">
              Facultad de Ingeniería Mochis
            </Typography.Paragraph>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={submit}
            requiredMark={false}
            className="login-form"
          >
            <Form.Item
              name="username"
              label="Usuario"
              rules={[
                {
                  required: true,
                  message: 'Ingresa tu usuario',
                },
              ]}
            >
              <Input
                size="large"
                prefix={<UserOutlined />}
                placeholder="Nombre de usuario"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Contraseña"
              rules={[
                {
                  required: true,
                  message: 'Ingresa tu contraseña',
                },
              ]}
            >
              <Input.Password
                size="large"
                prefix={<LockOutlined />}
                placeholder="Contraseña"
                autoComplete="current-password"
                onPressEnter={() => form.submit()}
              />
            </Form.Item>

            <Button
              htmlType="submit"
              type="primary"
              block
              size="large"
              className="login-button"
            >
              Iniciar sesión
            </Button>
          </Form>

          <div className="login-footer">
            Universidad Autónoma de Sinaloa
          </div>
        </Card>
      </div>
    </div>
  );
}