import {
  BarChartOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  MoreOutlined,
  PlusOutlined,
  SendOutlined,
  StopOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';

import {
  Button,
  Dropdown,
  Form,
  Input,
  Modal,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';

import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../../services/api';
import type { DynamicForm } from '../../types';

const statusLabel: Record<string, string> = {
  draft: 'Borrador',
  published: 'Publicado',
  closed: 'Cerrado',
  archived: 'Archivado',
};

export default function FormsPage() {
  const navigate = useNavigate();

  const [forms, setForms] = useState<DynamicForm[]>([]);
  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<DynamicForm | null>(null);

  const [deleteLoading, setDeleteLoading] =
    useState(false);

  const load = async () => {
    try {
      setLoading(true);

      const data = await api.get<DynamicForm[]>('/forms');

      setForms(data);
    } catch (error) {
      console.error(error);

      message.error(
        error instanceof Error
          ? error.message
          : 'No se pudieron cargar los formularios',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return forms;
    }

    return forms.filter((form) =>
      `${form.title} ${form.description ?? ''}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [forms, query]);

  const createForm = async (values: {
    title: string;
    description?: string;
  }) => {
    try {
      const created = await api.post<DynamicForm>('/forms', values);

      setCreateOpen(false);

      message.success('Formulario creado');

      navigate(`/admin/forms/${created.id}/builder`);
    } catch (error) {
      console.error(error);

      message.error(
        error instanceof Error
          ? error.message
          : 'No se pudo crear el formulario',
      );
    }
  };

  const goEdit = (form: DynamicForm) => {
    navigate(`/admin/forms/${form.id}/builder`);
  };

  const goPreview = (form: DynamicForm) => {
    window.open(
      `/forms/${form.id}?preview=1`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  const goData = (form: DynamicForm) => {
    navigate(`/admin/forms/${form.id}/submissions`);
  };

  const goAnalytics = (form: DynamicForm) => {
    navigate(`/admin/forms/${form.id}/analytics`);
  };

  const togglePublish = async (form: DynamicForm) => {
    try {
      setActionId(form.id);

      const nextStatus =
        form.status === 'published'
          ? 'draft'
          : 'published';

      await api.put(`/forms/${form.id}`, {
        title: form.title,
        description: form.description ?? '',
        status: nextStatus,
        settings: form.settings ?? {},
      });

      message.success(
        nextStatus === 'published'
          ? 'Formulario publicado'
          : 'Formulario pasado a borrador',
      );

      await load();
    } catch (error) {
      console.error(error);

      message.error(
        error instanceof Error
          ? error.message
          : 'No se pudo cambiar el estado',
      );
    } finally {
      setActionId(null);
    }
  };

  const duplicateForm = async (form: DynamicForm) => {
    try {
      setActionId(form.id);

      await api.post(`/forms/${form.id}/duplicate`);

      message.success('Formulario duplicado');

      await load();
    } catch (error) {
      console.error(error);

      message.error(
        error instanceof Error
          ? error.message
          : 'No se pudo duplicar el formulario',
      );
    } finally {
      setActionId(null);
    }
  };

  const requestDelete = (form: DynamicForm) => {
    setDeleteTarget(form);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      setDeleteLoading(true);
      setActionId(deleteTarget.id);

      console.log(
        'Eliminando formulario:',
        deleteTarget.id,
      );

      await api.delete(
        `/forms/${deleteTarget.id}`,
      );

      message.success(
        'Formulario eliminado correctamente',
      );

      setDeleteTarget(null);

      await load();
    } catch (error) {
      console.error(
        'ERROR AL ELIMINAR FORMULARIO:',
        error,
      );

      message.error(
        error instanceof Error
          ? error.message
          : 'No se pudo eliminar el formulario',
      );
    } finally {
      setDeleteLoading(false);
      setActionId(null);
    }
  };
  return (
    <div className="forms-admin-page">
      <div className="forms-admin-heading">
        <div>
          <Typography.Title level={2}>
            Formularios
          </Typography.Title>

          <Typography.Text>
            Diseña, publica y administra formularios institucionales.
          </Typography.Text>
        </div>

        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => setCreateOpen(true)}
        >
          Nuevo formulario
        </Button>
      </div>

      <div className="forms-admin-surface">
        <div className="forms-admin-toolbar">
          <Input.Search
            allowClear
            placeholder="Buscar formulario..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          <div className="forms-counter">
            {filtered.length}{' '}
            {filtered.length === 1
              ? 'formulario'
              : 'formularios'}
          </div>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          dataSource={filtered}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
          }}
          columns={[
            {
              title: 'Formulario',
              dataIndex: 'title',

              render: (
                title: string,
                record: DynamicForm,
              ) => (
                <button
                  className="form-title-cell"
                  type="button"
                  onClick={() => goEdit(record)}
                >
                  <span className="form-title-icon">
                    <FileTextOutlined />
                  </span>

                  <span>
                    <strong>{title}</strong>

                    <small>
                      {record.description || 'Sin descripción'}
                    </small>
                  </span>
                </button>
              ),
            },

            {
              title: 'Estado',
              dataIndex: 'status',
              width: 150,

              render: (status: string) => (
                <Tag
                  className={`form-status-tag status-${status}`}
                >
                  {statusLabel[status] ?? status}
                </Tag>
              ),
            },

            {
              title: 'Respuestas',
              width: 120,

              render: (_, record) =>
                record.submissions?.[0]?.count ?? 0,
            },

            {
              title: 'Última modificación',
              dataIndex: 'updated_at',
              width: 190,

              render: (value: string) =>
                dayjs(value).format('DD/MM/YYYY · HH:mm'),
            },

            {
              title: '',
              width: 70,
              align: 'center' as const,

              render: (_, record) => (
                <Dropdown
                  trigger={['click']}
                  placement="bottomRight"
                  menu={{
                    items: [
                      {
                        key: 'edit',
                        icon: <EditOutlined />,
                        label: 'Editar formulario',
                      },

                      {
                        key: 'preview',
                        icon: <EyeOutlined />,
                        label: 'Vista previa',
                      },

                      {
                        type: 'divider',
                      },

                      {
                        key: 'publish',
                        icon:
                          record.status === 'published' ? (
                            <StopOutlined />
                          ) : (
                            <SendOutlined />
                          ),
                        label:
                          record.status === 'published'
                            ? 'Despublicar'
                            : 'Publicar',
                      },

                      {
                        key: 'duplicate',
                        icon: <CopyOutlined />,
                        label: 'Duplicar',
                      },

                      {
                        type: 'divider',
                      },

                      {
                        key: 'data',
                        icon: <UnorderedListOutlined />,
                        label: 'Ver respuestas',
                      },

                      {
                        key: 'analytics',
                        icon: <BarChartOutlined />,
                        label: 'Analizar',
                      },

                      {
                        type: 'divider',
                      },

                      {
                        key: 'delete',
                        icon: <DeleteOutlined />,
                        danger: true,
                        label: 'Eliminar',
                      },
                    ],

                    onClick: ({ key }) => {
                      console.log(
                        'Acción seleccionada:',
                        key,
                        record.id,
                      );

                      switch (key) {
                        case 'edit':
                          goEdit(record);
                          break;

                        case 'preview':
                          goPreview(record);
                          break;

                        case 'publish':
                          void togglePublish(record);
                          break;

                        case 'duplicate':
                          void duplicateForm(record);
                          break;

                        case 'data':
                          goData(record);
                          break;

                        case 'analytics':
                          goAnalytics(record);
                          break;

                        case 'delete':
                          requestDelete(record);
                          break;
                      }
                    },
                  }}
                >
                  <Button
                    type="text"
                    loading={actionId === record.id}
                    icon={<MoreOutlined />}
                    className="form-actions-trigger"
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                  />
                </Dropdown>
              ),
            },
          ]}
        />
      </div>

      <Modal
        title="Eliminar formulario"
        open={Boolean(deleteTarget)}
        onCancel={() => {
          if (!deleteLoading) {
            setDeleteTarget(null);
          }
        }}
        onOk={() => {
          void confirmDelete();
        }}
        okText="Eliminar definitivamente"
        cancelText="Cancelar"
        confirmLoading={deleteLoading}
        closable={!deleteLoading}
        maskClosable={!deleteLoading}
        okButtonProps={{
          danger: true,
        }}
        centered
      >
        <div style={{ paddingTop: 8 }}>
          <Typography.Paragraph>
            Estás a punto de eliminar:
          </Typography.Paragraph>

          <Typography.Title
            level={5}
            style={{
              marginTop: 0,
              marginBottom: 12,
            }}
          >
            {deleteTarget?.title}
          </Typography.Title>

          <Typography.Paragraph type="secondary">
            Se eliminará el formulario junto con
            sus preguntas. Esta acción no puede
            deshacerse.
          </Typography.Paragraph>
        </div>
      </Modal>

      <CreateFormModal
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onSubmit={createForm}
      />
    </div>
  );
}

function CreateFormModal({
  open,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: {
    title: string;
    description?: string;
  }) => Promise<void>;
}) {
  const [form] = Form.useForm();

  const submit = async () => {
    const values = await form.validateFields();

    await onSubmit(values);

    form.resetFields();
  };

  return (
    <Modal
      title="Crear formulario"
      open={open}
      onCancel={onCancel}
      okText="Crear formulario"
      cancelText="Cancelar"
      onOk={() => void submit()}
      width={560}
    >
      <Form
        form={form}
        layout="vertical"
        className="create-form-modal"
      >
        <Form.Item
          label="Nombre del formulario"
          name="title"
          rules={[
            {
              required: true,
              message: 'Escribe un nombre',
            },
          ]}
        >
          <Input
            size="large"
            placeholder="Ej. Solicitud de atención académica"
          />
        </Form.Item>

        <Form.Item
          label="Descripción"
          name="description"
        >
          <Input.TextArea
            rows={3}
            placeholder="Describe brevemente el objetivo del formulario"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}