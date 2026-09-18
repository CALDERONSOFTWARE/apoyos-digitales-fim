import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Typography,
  message
} from 'antd';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../services/api';
import type { DynamicForm } from '../../types';
import FormTabs from '../../components/forms/FormTabs';

export default function FormSettingsPage() {
  const { id } = useParams();
  const [form, setForm] = useState<DynamicForm>();

  useEffect(() => {
    if (id) {
      api.get<DynamicForm>(`/forms/${id}`).then(setForm);
    }
  }, [id]);

  async function save(v: any) {
    if (!form) return;

    const updated = await api.put<DynamicForm>(
      `/forms/${form.id}`,
      {
        ...form,
        ...v
      }
    );

    setForm(updated);
    message.success('Configuración guardada');
  }

  if (!form) return null;

  return (
    <>
      <Typography.Title
        level={3}
        style={{ marginBottom: 0 }}
      >
        {form.title}
      </Typography.Title>

      <FormTabs formId={form.id} />

      <Card title="Configuración del formulario">
        <Form
          layout="vertical"
          initialValues={{
            title: form.title,
            description: form.description,
            status: form.status
          }}
          onFinish={save}
        >
          <Form.Item
            label="Título"
            name="title"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Descripción"
            name="description"
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item
            label="Estado"
            name="status"
          >
            <Select
              options={[
                'draft',
                'published',
                'closed',
                'archived'
              ].map(v => ({
                value: v,
                label: v
              }))}
            />
          </Form.Item>

          <Button
            htmlType="submit"
            type="primary"
          >
            Guardar configuración
          </Button>
        </Form>
      </Card>
    </>
  );
}