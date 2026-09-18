import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  FileImageOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FormOutlined,
  InboxOutlined,
  LinkOutlined,
  MailOutlined,
  NumberOutlined,
  PhoneOutlined,
  PrinterOutlined,
  SaveOutlined,
  SafetyCertificateOutlined,
  StarFilled,
  StarOutlined,
  UserOutlined,
  CheckSquareOutlined,
  UnorderedListOutlined,
  FontSizeOutlined,
  FieldTimeOutlined,
  EyeOutlined,
  HourglassOutlined
} from '@ant-design/icons';

import {
  Button,
  Form,
  Image,
  Input,
  Modal,
  Progress,
  Tag,
  Typography,
  message
} from 'antd';

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import dayjs from 'dayjs';

import { api } from '../../services/api';

import type {
  DynamicForm,
  Submission
} from '../../types';

import {
  validationLabel
} from '../../utils/status';

import {
  downloadReceipt,
  previewReceipt,
  printReceipt
} from '../../utils/pdf';

import { supabase } from '../../services/supabase';
import FormRenderer from '../../components/forms/FormRenderer';

type Answer = NonNullable<
  Submission['submission_answers']
>[number];

type AnswerRenderResult = {
  content: React.ReactNode;
  wide?: boolean;
};

export default function SubmissionDetailPage() {
  const { id } = useParams();

  const [sub, setSub] = useState<Submission>();
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<DynamicForm>();
  const [editValues, setEditValues] = useState<Record<string, any>>({});

  const nav = useNavigate();

  const load = async () => {
    if (!id) return;

    try {
      setLoading(true);

      const s = await api.get<Submission>(
        `/submissions/${id}`
      );

      await Promise.all(
        (s.submission_answers ?? []).map(
          async a => {
            if (!a.value?.path) return;

            const { data } = await supabase.storage
              .from('form-uploads')
              .createSignedUrl(
                a.value.path,
                3600
              );

            a.value = {
              ...a.value,
              preview: data?.signedUrl
            };
          }
        )
      );

      setSub(s);
      setNotes(s.admin_notes ?? '');
    } catch (error: any) {
      message.error(
        error?.message ??
          'No fue posible cargar la respuesta'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const answers = useMemo(() => {
    return [...(sub?.submission_answers ?? [])].sort(
      (a, b) =>
        (a.form_fields?.position ?? 0) -
        (b.form_fields?.position ?? 0)
    );
  }, [sub]);

  async function state(
    validation_status: string,
    status?: string
  ) {
    if (!sub) return;

    try {
      await api.put(
        `/submissions/${sub.id}`,
        {
          validation_status,
          status: status ?? sub.status,

          validation_score:
            validation_status === 'validated'
              ? 100
              : sub.validation_score,

          admin_notes: notes
        }
      );

      message.success(
        'Respuesta actualizada'
      );

      load();
    } catch (error: any) {
      message.error(
        error?.message ??
          'No fue posible actualizar la respuesta'
      );
    }
  }

  async function saveObservation() {
    if (!sub) return;

    try {
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
    } catch (error: any) {
      message.error(
        error?.message ??
          'No fue posible guardar las observaciones'
      );
    }
  }

  async function openEdit() {
    if (!sub) return;

    try {
      const f = await api.get<DynamicForm>(
        `/forms/${sub.form_id}`
      );

      setEditForm(f);

      setEditValues(
        Object.fromEntries(
          (sub.submission_answers ?? []).map(
            a => [
              a.field_id,
              a.value
            ]
          )
        )
      );

      setEditOpen(true);
    } catch (error: any) {
      message.error(
        error?.message ??
          'No fue posible abrir la edición'
      );
    }
  }

  async function saveAnswers() {
    if (!sub) return;

    try {
      await api.put(
        `/submissions/${sub.id}/answers`,
        {
          answers: Object.entries(
            editValues
          ).map(
            ([field_id, value]) => ({
              field_id,

              value:
                value &&
                typeof value === 'object' &&
                !Array.isArray(value)
                  ? Object.fromEntries(
                      Object.entries(
                        value
                      ).filter(
                        ([k]) =>
                          k !== 'preview'
                      )
                    )
                  : value
            })
          )
        }
      );

      message.success(
        'Respuestas editadas'
      );

      setEditOpen(false);
      load();
    } catch (error: any) {
      message.error(
        error?.message ??
          'No fue posible guardar las respuestas'
      );
    }
  }

  async function removeSubmission() {
    if (!sub) return;

    Modal.confirm({
      title: 'Eliminar respuesta',
      content:
        'Esta acción eliminará la respuesta y sus respuestas asociadas. Esta operación no se puede deshacer.',
      okText: 'Eliminar',
      cancelText: 'Cancelar',
      okButtonProps: {
        danger: true
      },

      onOk: async () => {
        try {
          await api.delete(
            `/submissions/${sub.id}`
          );

          message.success(
            'Respuesta eliminada'
          );

          nav(
            `/admin/forms/${sub.form_id}/submissions`
          );
        } catch (error: any) {
          message.error(
            error?.message ??
              'No fue posible eliminar la respuesta'
          );
        }
      }
    });
  }

  if (loading) {
    return (
      <div className="submission-detail-loading">
        Cargando respuesta...
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="submission-detail-empty">
        No se encontró la respuesta.
      </div>
    );
  }

  const respondent =
    sub.profiles?.full_name ||
    sub.profiles?.email ||
    'Usuario sin identificar';

  const score = Number(
    sub.validation_score ?? 0
  );

  return (
    <div className="submission-detail-page">
      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="submission-detail-header">
        <div className="submission-detail-heading">
          <Button
            className="submission-back-icon"
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => nav(-1)}
            aria-label="Volver"
          />

          <div className="submission-detail-title-area">
            <Typography.Title level={2}>
              Respuesta {sub.folio}
            </Typography.Title>

            <div className="submission-detail-form-name">
              <FormOutlined />

              <span>
                {sub.forms?.title ||
                  'Formulario'}
              </span>
            </div>
          </div>
        </div>

        <Button
          className="submission-top-back"
          icon={<ArrowLeftOutlined />}
          onClick={() => nav(-1)}
        >
          Volver
        </Button>
      </div>

      {/* =====================================================
          RESUMEN
          ===================================================== */}

      <section className="submission-summary-card">
        <div className="submission-summary-item">
          <div className="submission-summary-icon blue">
            <UserOutlined />
          </div>

          <div className="submission-summary-content">
            <span>Usuario</span>

            <strong>
              {respondent}
            </strong>
          </div>
        </div>

        <div className="submission-summary-divider" />

        <div className="submission-summary-item">
          <div className="submission-summary-icon green">
            <CalendarOutlined />
          </div>

          <div className="submission-summary-content">
            <span>Fecha de envío</span>

            <strong>
              {dayjs(
                sub.submitted_at
              ).format(
                'DD/MM/YYYY HH:mm'
              )}
            </strong>
          </div>
        </div>

        <div className="submission-summary-divider" />

        <div className="submission-summary-item">
          <div className="submission-summary-icon purple">
            <FileTextOutlined />
          </div>

          <div className="submission-summary-content">
            <span>Estado</span>

            <div>
              <Tag
                className={`submission-state-tag submission-state-${sub.status}`}
              >
                {statusLabel(
                  sub.status
                )}
              </Tag>
            </div>
          </div>
        </div>

        <div className="submission-summary-divider" />

        <div className="submission-summary-validation">
          <div className="submission-summary-validation-top">
            <div
              className={`submission-summary-icon ${validationColorClass(
                sub.validation_status
              )}`}
            >
              <SafetyCertificateOutlined />
            </div>

            <div className="submission-summary-content">
              <span>Semáforo</span>

              <strong>
                {validationLabel(
                  sub.validation_status
                )}
              </strong>
            </div>
          </div>

          <div className="submission-progress-row">
            <Progress
              percent={score}
              showInfo={false}
              strokeColor={validationColor(
                sub.validation_status
              )}
              trailColor="#e8edf1"
              size="small"
            />

            <strong>
              {score}%
            </strong>
          </div>
        </div>
      </section>

      {/* =====================================================
          RESPUESTAS
          ===================================================== */}

      <section className="submission-section">
        <div className="submission-section-header">
          <div className="submission-section-icon answers">
            <FormOutlined />
          </div>

          <div>
            <h3>
              Preguntas y respuestas
            </h3>

            <span>
              {answers.length}{' '}
              {answers.length === 1
                ? 'respuesta registrada'
                : 'respuestas registradas'}
            </span>
          </div>
        </div>

        <div className="submission-answers-grid">
          {answers.map(answer => {
            const rendered =
              renderValue(
                answer.value,
                answer.form_fields?.type
              );

            const type =
              answer.form_fields?.type ??
              'text';

            return (
              <article
                className={[
                  'submission-answer-card',
                  rendered.wide
                    ? 'submission-answer-card-wide'
                    : ''
                ]
                  .filter(Boolean)
                  .join(' ')}
                key={answer.field_id}
              >
                <div className="submission-answer-heading">
                  <span
                    className={`submission-answer-icon ${answerIconClass(
                      type
                    )}`}
                  >
                    {answerIcon(type)}
                  </span>

                  <div className="submission-answer-label">
                    {answer.form_fields?.label ||
                      'Pregunta'}
                  </div>
                </div>

                <div className="submission-answer-value">
                  {rendered.content}
                </div>
              </article>
            );
          })}

          {!answers.length && (
            <div className="submission-no-answers">
              <InboxOutlined />

              <strong>
                Sin respuestas
              </strong>

              <span>
                Este envío no contiene respuestas registradas.
              </span>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          OBSERVACIONES
          ===================================================== */}

      <section className="submission-section submission-observations-section">
        <div className="submission-section-header">
          <div className="submission-section-icon observations">
            <EditOutlined />
          </div>

          <div>
            <h3>
              Observaciones administrativas
            </h3>

            <span>
              Notas internas de revisión de esta respuesta
            </span>
          </div>
        </div>

        <div className="submission-observations-body">
          <Input.TextArea
            className="submission-notes-input"
            rows={4}
            value={notes}
            onChange={e =>
              setNotes(
                e.target.value
              )
            }
            placeholder="Escribe aquí las observaciones de revisión..."
          />
        </div>

        {/* ===================================================
            ACTION BAR
            =================================================== */}

        <div className="submission-actions">
          <div className="submission-actions-left">
            <Button
              icon={<EditOutlined />}
              onClick={openEdit}
            >
              Editar respuestas
            </Button>

            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={() =>
                state(
                  'validated',
                  'resolved'
                )
              }
            >
              Validar
            </Button>

            <Button
              className="submission-pending-button"
              icon={<HourglassOutlined />}
              onClick={() =>
                state(
                  'pending',
                  'in_review'
                )
              }
            >
              Pendiente
            </Button>

            <Button
              danger
              icon={<CloseOutlined />}
              onClick={() =>
                state(
                  'rejected',
                  'in_review'
                )
              }
            >
              Rechazar
            </Button>
          </div>

          <div className="submission-actions-right">
            <Button
              icon={<SaveOutlined />}
              onClick={saveObservation}
            >
              Guardar observación
            </Button>

            <Button
              icon={<EyeOutlined />}
              onClick={() =>
                previewReceipt(sub)
              }
            >
              Vista previa PDF
            </Button>

            <Button
              icon={<PrinterOutlined />}
              onClick={() =>
                printReceipt(sub)
              }
            >
              Imprimir
            </Button>

            <Button
              icon={<DownloadOutlined />}
              onClick={() =>
                downloadReceipt(sub)
              }
            >
              Descargar PDF
            </Button>

            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={
                removeSubmission
              }
            >
              Eliminar
            </Button>
          </div>
        </div>
      </section>

      {/* =====================================================
          EDIT MODAL
          ===================================================== */}

      <Modal
        width={900}
        title="Editar respuesta"
        open={editOpen}
        onCancel={() =>
          setEditOpen(false)
        }
        onOk={saveAnswers}
        okText="Guardar cambios"
        cancelText="Cancelar"
      >
        {editForm && (
          <Form layout="vertical">
            <FormRenderer
              form={editForm}
              fields={
                editForm.fields ?? []
              }
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
    </div>
  );
}

/* =========================================================
   ANSWER RENDERER
   ========================================================= */

function renderValue(
  v: any,
  type?: string
): AnswerRenderResult {
  if (
    v === null ||
    v === undefined ||
    v === ''
  ) {
    return {
      content: (
        <span className="submission-empty-value">
          Sin respuesta
        </span>
      )
    };
  }

  /*
   * Archivo de imagen
   */
  if (
    v?.preview &&
    String(v.mime ?? '').startsWith(
      'image/'
    )
  ) {
    const isSignature =
      type === 'signature';

    return {
      wide: true,

      content: (
        <div
          className={
            isSignature
              ? 'submission-signature-preview'
              : 'submission-image-preview'
          }
        >
          <div className="submission-image-stage">
            <Image
              src={v.preview}
              alt={
                v.name ||
                (isSignature
                  ? 'Firma'
                  : 'Imagen adjunta')
              }
              preview={{
                mask: (
                  <span>
                    <EyeOutlined />{' '}
                    Ver imagen
                  </span>
                )
              }}
            />
          </div>

          <div className="submission-file-footer">
            <div className="submission-file-info">
              <FileImageOutlined />

              <div>
                <strong>
                  {v.name ||
                    (isSignature
                      ? 'Firma'
                      : 'Imagen adjunta')}
                </strong>

                {v.mime && (
                  <span>
                    {v.mime}
                  </span>
                )}
              </div>
            </div>

            <Button
              size="small"
              icon={<LinkOutlined />}
              href={v.preview}
              target="_blank"
              rel="noreferrer"
            >
              Abrir archivo
            </Button>
          </div>
        </div>
      )
    };
  }

  /*
   * Archivo que no es imagen
   */
  if (v?.preview) {
    return {
      wide: true,

      content: (
        <div className="submission-document-preview">
          <div className="submission-document-icon">
            {String(
              v.mime ?? ''
            ).includes('pdf') ? (
              <FilePdfOutlined />
            ) : (
              <FileOutlined />
            )}
          </div>

          <div className="submission-document-info">
            <strong>
              {v.name ||
                'Archivo adjunto'}
            </strong>

            <span>
              {v.mime ||
                'Archivo'}
            </span>
          </div>

          <Button
            icon={<LinkOutlined />}
            href={v.preview}
            target="_blank"
            rel="noreferrer"
          >
            Abrir archivo
          </Button>
        </div>
      )
    };
  }

  /*
   * Arrays / checkbox
   */
  if (Array.isArray(v)) {
    if (!v.length) {
      return {
        content: (
          <span className="submission-empty-value">
            Sin selección
          </span>
        )
      };
    }

    return {
      content: (
        <div className="submission-chip-list">
          {v.map(
            (item, index) => (
              <span
                className="submission-value-chip"
                key={`${String(
                  item
                )}-${index}`}
              >
                {String(item)}
              </span>
            )
          )}
        </div>
      )
    };
  }

  /*
   * Booleanos
   */
  if (
    type === 'boolean' ||
    type === 'consent' ||
    typeof v === 'boolean'
  ) {
    const active =
      v === true ||
      String(v).toLowerCase() ===
        'true' ||
      String(v).toLowerCase() ===
        'sí' ||
      String(v).toLowerCase() ===
        'si';

    return {
      content: (
        <span
          className={
            active
              ? 'submission-boolean yes'
              : 'submission-boolean no'
          }
        >
          {active ? (
            <CheckOutlined />
          ) : (
            <CloseOutlined />
          )}

          {active ? 'Sí' : 'No'}
        </span>
      )
    };
  }

  /*
   * Rating
   */
  if (
    type === 'rating' ||
    type === 'valoracion' ||
    type === 'valoración'
  ) {
    const rating =
      Number(v) || 0;

    return {
      content: (
        <div className="submission-rating">
          <div className="submission-rating-stars">
            {Array.from({
              length: 5
            }).map((_, index) =>
              index < rating ? (
                <StarFilled
                  key={index}
                />
              ) : (
                <StarOutlined
                  key={index}
                />
              )
            )}
          </div>

          <strong>
            {rating}/5
          </strong>
        </div>
      )
    };
  }

  /*
   * Objeto genérico
   */
  if (typeof v === 'object') {
    return {
      wide: true,

      content: (
        <pre className="submission-json-value">
          {JSON.stringify(
            v,
            null,
            2
          )}
        </pre>
      )
    };
  }

  /*
   * Texto largo
   */
  const stringValue =
    String(v);

  const isLong =
    stringValue.length > 120 ||
    type === 'textarea' ||
    type === 'long_text';

  return {
    wide: isLong,

    content: (
      <span
        className={
          isLong
            ? 'submission-text-long'
            : 'submission-text-value'
        }
      >
        {stringValue}
      </span>
    )
  };
}

/* =========================================================
   HELPERS
   ========================================================= */

function statusLabel(
  status?: string
) {
  const labels: Record<
    string,
    string
  > = {
    submitted: 'Enviado',
    in_review: 'En revisión',
    resolved: 'Resuelto'
  };

  return (
    labels[status ?? ''] ??
    status ??
    'Sin estado'
  );
}

function validationColor(
  status?: string
) {
  switch (status) {
    case 'validated':
      return '#22a06b';

    case 'pending':
      return '#f0a202';

    case 'incomplete':
      return '#e77817';

    case 'rejected':
      return '#e5484d';

    default:
      return '#2f7ed8';
  }
}

function validationColorClass(
  status?: string
) {
  switch (status) {
    case 'validated':
      return 'green';

    case 'pending':
      return 'orange';

    case 'incomplete':
      return 'orange';

    case 'rejected':
      return 'red';

    default:
      return 'blue';
  }
}

function answerIcon(
  type?: string
) {
  switch (type) {
    case 'email':
      return <MailOutlined />;

    case 'phone':
    case 'tel':
    case 'telephone':
      return <PhoneOutlined />;

    case 'number':
      return <NumberOutlined />;

    case 'image':
    case 'file':
    case 'upload':
      return <FileImageOutlined />;

    case 'signature':
      return <EditOutlined />;

    case 'checkbox':
    case 'checkboxes':
    case 'multi_select':
      return <CheckSquareOutlined />;

    case 'radio':
    case 'select':
    case 'options':
      return <UnorderedListOutlined />;

    case 'boolean':
    case 'consent':
      return <SafetyCertificateOutlined />;

    case 'rating':
      return <StarOutlined />;

    case 'date':
    case 'datetime':
      return <CalendarOutlined />;

    case 'time':
      return <FieldTimeOutlined />;

    case 'text':
    case 'textarea':
    case 'long_text':
    default:
      return <FontSizeOutlined />;
  }
}

function answerIconClass(
  type?: string
) {
  switch (type) {
    case 'email':
      return 'cyan';

    case 'phone':
    case 'tel':
    case 'telephone':
      return 'green';

    case 'image':
    case 'file':
    case 'upload':
      return 'purple';

    case 'signature':
      return 'pink';

    case 'rating':
      return 'yellow';

    case 'boolean':
    case 'consent':
      return 'green';

    case 'checkbox':
    case 'checkboxes':
    case 'multi_select':
      return 'indigo';

    case 'number':
      return 'blue';

    default:
      return 'blue';
  }
}