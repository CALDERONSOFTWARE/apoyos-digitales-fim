import {
  Button,
  Card,
  Descriptions,
  Divider,
  Form,
  Image,
  Input,
  Modal,
  Space,
  Tag,
  Typography,
  message
} from 'antd';

import { useEffect, useState } from 'react';
import {
  useNavigate,
  useParams
} from 'react-router-dom';

import { api } from '../../services/api';
import type {
  DynamicForm,
  Submission
} from '../../types';

import { TrafficLight } from '../../utils/status';
import dayjs from 'dayjs';

import {
  downloadReceipt,
  previewReceipt,
  printReceipt
} from '../../utils/pdf';

import { supabase } from '../../services/supabase';
import FormRenderer from '../../components/forms/FormRenderer';

export default function SubmissionDetailPage() {
  const { id } = useParams();

  const [sub, setSub] = useState<Submission>();
  const [notes, setNotes] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<DynamicForm>();
  const [editValues, setEditValues] = useState<Record<string, any>>({});

  const nav = useNavigate();

  const load = () => {
    if (!id) return;

    api.get<Submission>(`/submissions/${id}`).then(async s => {
      for (const a of s.submission_answers ?? []) {
        if (a.value?.path) {
          const { data } = await supabase.storage
            .from('form-uploads')
            .createSignedUrl(a.value.path, 3600);

          a.value = {
            ...a.value,
            preview: data?.signedUrl
          };
        }
      }

      setSub(s);
      setNotes(s.admin_notes ?? '');
    });
  };

  useEffect(() => {
    load();
  }, [id]);

  async function state(
    validation_status: string,
    status?: string
  ) {
    if (!sub) return;

    await api.put(`/submissions/${sub.id}`, {
      validation_status,
      status: status ?? sub.status,
      validation_score:
        validation_status === 'validated'
          ? 100
          : sub.validation_score,
      admin_notes: notes
    });

    message.success('Respuesta actualizada');
    load();
  }

  async function openEdit() {
    if (!sub) return;

    const f = await api.get<DynamicForm>(
      `/forms/${sub.form_id}`
    );

    setEditForm(f);

    setEditValues(
      Object.fromEntries(
        (sub.submission_answers ?? []).map(a => [
          a.field_id,
          a.value
        ])
      )
    );

    setEditOpen(true);
  }

  async function saveAnswers() {
    if (!sub) return;

    await api.put(
      `/submissions/${sub.id}/answers`,
      {
        answers: Object.entries(editValues).map(
          ([field_id, value]) => ({
            field_id,
            value:
              value &&
              typeof value === 'object' &&
              !Array.isArray(value)
                ? Object.fromEntries(
                    Object.entries(value).filter(
                      ([k]) => k !== 'preview'
                    )
                  )
                : value
          })
        )
      }
    );

    message.success('Respuestas editadas');
    setEditOpen(false);
    load();
  }

  if (!sub) return null;

  return (
    <>
      <Space
        style={{
          width: '100%',
          justifyContent: 'space-between'
        }}
      >
        <div>
          <Typography.Title
            level={3}
            style={{ marginBottom: 0 }}
          >
            Respuesta {sub.folio}
          </Typography.Title>

          <Typography.Text type="secondary">
            {sub.forms?.title}
          </Typography.Text>
        </div>

        <Button onClick={() => nav(-1)}>
          Volver
        </Button>
      </Space>

      <Card style={{ marginTop: 14 }}>
        <Descriptions
          column={2}
          items={[
            {
              key: 'user',
              label: 'Usuario',
              children:
                sub.profiles?.full_name ||
                sub.profiles?.email
            },
            {
              key: 'date',
              label: 'Fecha',
              children: dayjs(
                sub.submitted_at
              ).format('DD/MM/YYYY HH:mm')
            },
            {
              key: 'status',
              label: 'Estado',
              children: <Tag>{sub.status}</Tag>
            },
            {
              key: 'validation',
              label: 'Semáforo',
              children: (
                <TrafficLight
                  status={sub.validation_status}
                  score={sub.validation_score}
                />
              )
            }
          ]}
        />

        <Divider>
          Preguntas y respuestas
        </Divider>

        {(sub.submission_answers ?? [])
          .sort(
            (a, b) =>
              (a.form_fields?.position ?? 0) -
              (b.form_fields?.position ?? 0)
          )
          .map(a => (
            <div
              className="answer-row"
              key={a.field_id}
            >
              <Typography.Text strong>
                {a.form_fields?.label}
              </Typography.Text>

              <div>
                {renderValue(
                  a.value,
                  a.form_fields?.type
                )}
              </div>
            </div>
          ))}

        <Divider>
          Observaciones administrativas
        </Divider>

        <Input.TextArea
          rows={4}
          value={notes}
          onChange={e =>
            setNotes(e.target.value)
          }
          placeholder="Observaciones de revisión"
        />

        <Space
          wrap
          style={{ marginTop: 12 }}
        >
          <Button onClick={openEdit}>
            Editar respuestas
          </Button>

          <Button
            type="primary"
            onClick={() =>
              state('validated', 'resolved')
            }
          >
            Validar
          </Button>

          <Button
            onClick={() =>
              state('pending', 'in_review')
            }
          >
            Pendiente
          </Button>

          <Button
            danger
            onClick={() =>
              state('rejected', 'in_review')
            }
          >
            Rechazar
          </Button>

          <Button
            onClick={async () => {
              await api.put(
                `/submissions/${sub.id}`,
                {
                  admin_notes: notes
                }
              );

              message.success(
                'Observaciones guardadas'
              );

              load();
            }}
          >
            Guardar observación
          </Button>

          <Button
            onClick={() =>
              previewReceipt(sub)
            }
          >
            Vista previa PDF
          </Button>

          <Button
            onClick={() =>
              printReceipt(sub)
            }
          >
            Imprimir
          </Button>

          <Button
            onClick={() =>
              downloadReceipt(sub)
            }
          >
            Descargar PDF
          </Button>

          <Button
            danger
            onClick={() =>
              Modal.confirm({
                title: 'Eliminar respuesta',
                content:
                  'Esta acción elimina respuestas asociadas.',
                onOk: async () => {
                  await api.delete(
                    `/submissions/${sub.id}`
                  );

                  nav(
                    `/admin/forms/${sub.form_id}/submissions`
                  );
                }
              })
            }
          >
            Eliminar
          </Button>
        </Space>
      </Card>

      <Modal
        width={900}
        title="Editar respuesta"
        open={editOpen}
        onCancel={() =>
          setEditOpen(false)
        }
        onOk={saveAnswers}
        okText="Guardar cambios"
      >
        {editForm && (
          <Form layout="vertical">
            <FormRenderer
              form={editForm}
              fields={editForm.fields ?? []}
              values={editValues}
              onChange={(k, v) =>
                setEditValues(x => ({
                  ...x,
                  [k]: v
                }))
              }
            />
          </Form>
        )}
      </Modal>
    </>
  );
}

function renderValue(
  v: any,
  type?: string
) {
  if (
    v === null ||
    v === undefined ||
    v === ''
  ) {
    return (
      <Typography.Text type="secondary">
        Sin respuesta
      </Typography.Text>
    );
  }

  if (
    v?.preview &&
    String(v.mime).startsWith('image/')
  ) {
    return (
      <Space direction="vertical">
        <Image
          width={260}
          src={v.preview}
        />

        <a
          href={v.preview}
          target="_blank"
          rel="noreferrer"
        >
          Abrir archivo
        </a>
      </Space>
    );
  }

  if (v?.preview) {
    return (
      <a
        href={v.preview}
        target="_blank"
        rel="noreferrer"
      >
        {v.name || 'Abrir archivo'}
      </a>
    );
  }

  if (Array.isArray(v)) {
    return v.join(', ');
  }

  if (typeof v === 'object') {
    return (
      <pre className="json-value">
        {JSON.stringify(v, null, 2)}
      </pre>
    );
  }

  if (type === 'boolean') {
    return String(v);
  }

  return String(v);
}