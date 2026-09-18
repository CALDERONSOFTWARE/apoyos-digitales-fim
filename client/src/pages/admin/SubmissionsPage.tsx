import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileTextOutlined,
  FilterOutlined,
  SearchOutlined,
  SettingOutlined,
  UserOutlined
} from '@ant-design/icons';

import {
  Avatar,
  Button,
  Checkbox,
  Dropdown,
  Empty,
  Input,
  Progress,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography
} from 'antd';

import {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  useNavigate,
  useParams
} from 'react-router-dom';

import dayjs from 'dayjs';

import { api } from '../../services/api';

import type {
  DynamicForm,
  Submission
} from '../../types';

import FormTabs from '../../components/forms/FormTabs';

import {
  validationLabel
} from '../../utils/status';

type ColumnKey =
  | 'folio'
  | 'respondent'
  | 'date'
  | 'status'
  | 'validation'
  | 'completion';

export default function SubmissionsPage() {
  const { formId } = useParams();

  const [data, setData] = useState<Submission[]>([]);
  const [form, setForm] = useState<DynamicForm>();

  const [q, setQ] = useState('');

  const [statusFilter, setStatusFilter] =
    useState<string>('all');

  const [validationFilter, setValidationFilter] =
    useState<string>('all');

  const [visible, setVisible] = useState<ColumnKey[]>([
    'folio',
    'respondent',
    'date',
    'status',
    'validation',
    'completion'
  ]);

  const nav = useNavigate();

  useEffect(() => {
    if (!formId) return;

    api
      .get<Submission[]>(
        `/submissions/form/${formId}`
      )
      .then(setData);

    api
      .get<DynamicForm>(
        `/forms/${formId}`
      )
      .then(setForm);
  }, [formId]);

  /* =========================================================
     FILTERS
     ========================================================= */

  const filtered = useMemo(() => {
    const search =
      q.trim().toLowerCase();

    return data.filter(submission => {
      const searchable = [
        submission.folio,
        submission.profiles?.full_name,
        submission.profiles?.email
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !search ||
        searchable.includes(search);

      const matchesStatus =
        statusFilter === 'all' ||
        submission.status === statusFilter;

      const matchesValidation =
        validationFilter === 'all' ||
        submission.validation_status ===
          validationFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesValidation
      );
    });
  }, [
    data,
    q,
    statusFilter,
    validationFilter
  ]);

  /* =========================================================
     METRICS
     ========================================================= */

  const metrics = useMemo(() => {
    const total = data.length;

    const pending = data.filter(
      item =>
        item.validation_status ===
        'pending'
    ).length;

    const validated = data.filter(
      item =>
        item.validation_status ===
        'validated'
    ).length;

    const observations = data.filter(
      item =>
        item.validation_status ===
          'rejected' ||
        item.validation_status ===
          'incomplete'
    ).length;

    return {
      total,
      pending,
      validated,
      observations
    };
  }, [data]);

  /* =========================================================
     TABLE COLUMNS
     ========================================================= */

  const allCols: any[] = [
    {
      key: 'folio',
      title: 'Folio',
      dataIndex: 'folio',

      width: 190,

      sorter: (
        a: Submission,
        b: Submission
      ) =>
        String(a.folio).localeCompare(
          String(b.folio)
        ),

      render: (
        folio: string,
        record: Submission
      ) => (
        <button
          type="button"
          className="submissions-folio-button"
          onClick={() =>
            nav(
              `/admin/submissions/${record.id}`
            )
          }
        >
          <span className="submissions-folio-icon">
            <FileTextOutlined />
          </span>

          <span>
            {folio}
          </span>
        </button>
      )
    },

    {
      key: 'respondent',
      title: 'Respondente',

      width: 270,

      render: (
        _: unknown,
        record: Submission
      ) => {
        const name =
          record.profiles?.full_name ||
          'Usuario';

        const email =
          record.profiles?.email || '';

        return (
          <div className="submissions-user">
            <Avatar
              className="submissions-user-avatar"
              icon={<UserOutlined />}
            />

            <div className="submissions-user-info">
              <strong>
                {name}
              </strong>

              {email &&
                email !== name && (
                  <span>
                    {email}
                  </span>
                )}
            </div>
          </div>
        );
      }
    },

    {
      key: 'date',
      title: 'Fecha de envío',
      dataIndex: 'submitted_at',

      width: 185,

      sorter: (
        a: Submission,
        b: Submission
      ) =>
        dayjs(
          a.submitted_at
        ).valueOf() -
        dayjs(
          b.submitted_at
        ).valueOf(),

      render: (value: string) => (
        <div className="submissions-date">
          <strong>
            {dayjs(value).format(
              'DD/MM/YYYY'
            )}
          </strong>

          <span>
            {dayjs(value).format(
              'HH:mm'
            )}
          </span>
        </div>
      )
    },

    {
      key: 'status',
      title: 'Estado',
      dataIndex: 'status',

      width: 145,

      render: (value: string) => (
        <StatusTag
          status={value}
        />
      )
    },

    {
      key: 'validation',
      title: 'Validación',
      dataIndex: 'validation_status',

      width: 165,

      render: (value: string) => (
        <ValidationPill
          status={value}
        />
      )
    },

    {
      key: 'completion',
      title: 'Completado',
      dataIndex: 'validation_score',

      width: 190,

      sorter: (
        a: Submission,
        b: Submission
      ) =>
        Number(
          a.validation_score ?? 0
        ) -
        Number(
          b.validation_score ?? 0
        ),

      render: (
        value: number,
        record: Submission
      ) => {
        const percent =
          Number(value ?? 0);

        return (
          <div className="submissions-progress">
            <Progress
              percent={percent}
              showInfo={false}
              size="small"
              strokeColor={progressColor(
                record.validation_status
              )}
              trailColor="#e9eef2"
            />

            <strong>
              {percent}%
            </strong>
          </div>
        );
      }
    },

    {
      key: 'actions',
      title: '',

      width: 80,
      fixed: 'right',

      align: 'right',

      render: (
        _: unknown,
        record: Submission
      ) => (
        <Tooltip title="Ver respuesta">
          <Button
            className="submissions-view-button"
            type="text"
            icon={<EyeOutlined />}
            onClick={() =>
              nav(
                `/admin/submissions/${record.id}`
              )
            }
          />
        </Tooltip>
      )
    }
  ];

  const columns = allCols.filter(
    column =>
      column.key === 'actions' ||
      visible.includes(
        column.key as ColumnKey
      )
  );

  /* =========================================================
     EXPORT CSV
     ========================================================= */

  function exportCsv() {
    const headers = [
      'folio',
      'respondent',
      'email',
      'submitted_at',
      'status',
      'validation_status',
      'completion'
    ];

    const rows = filtered.map(
      submission => [
        submission.folio,
        submission.profiles
          ?.full_name ?? '',
        submission.profiles
          ?.email ?? '',
        submission.submitted_at,
        submission.status,
        submission.validation_status,
        submission.validation_score
      ]
    );

    const csv = [
      headers,
      ...rows
    ]
      .map(row =>
        row
          .map(value =>
            `"${String(
              value ?? ''
            ).replaceAll(
              '"',
              '""'
            )}"`
          )
          .join(',')
      )
      .join('\n');

    const blob = new Blob(
      ['\uFEFF', csv],
      {
        type:
          'text/csv;charset=utf-8'
      }
    );

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement('a');

    anchor.href = url;

    anchor.download =
      `respuestas-${formId}.csv`;

    anchor.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="submissions-page">
      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      {form && (
        <div className="submissions-page-header">
          <div>
            <div className="submissions-page-eyebrow">
              RESPUESTAS DEL FORMULARIO
            </div>

            <Typography.Title
              level={2}
              className="submissions-page-title"
            >
              {form.title}
            </Typography.Title>

            <Typography.Text
              type="secondary"
              className="submissions-page-description"
            >
              Consulta, filtra y revisa las
              respuestas recibidas.
            </Typography.Text>
          </div>

          <div className="submissions-header-counter">
            <span>
              Respuestas
            </span>

            <strong>
              {data.length}
            </strong>
          </div>
        </div>
      )}

      {form && (
        <div className="submissions-tabs-wrapper">
          <FormTabs
            formId={form.id}
          />
        </div>
      )}

      {/* =====================================================
          METRICS
          ===================================================== */}

      <div className="submissions-metrics">
        <MetricCard
          label="Total respuestas"
          value={metrics.total}
          icon={<FileTextOutlined />}
          variant="blue"
        />

        <MetricCard
          label="Pendientes"
          value={metrics.pending}
          icon={<ClockCircleOutlined />}
          variant="orange"
        />

        <MetricCard
          label="Validadas"
          value={metrics.validated}
          icon={<CheckCircleOutlined />}
          variant="green"
        />

        <MetricCard
          label="Con observaciones"
          value={metrics.observations}
          icon={<FilterOutlined />}
          variant="red"
        />
      </div>

      {/* =====================================================
          TABLE PANEL
          ===================================================== */}

      <section className="submissions-table-panel">
        <div className="submissions-table-header">
          <div>
            <h3>
              Respuestas recibidas
            </h3>

            <span>
              {filtered.length}{' '}
              {filtered.length === 1
                ? 'registro encontrado'
                : 'registros encontrados'}
            </span>
          </div>

          <Button
            icon={<DownloadOutlined />}
            onClick={exportCsv}
          >
            Exportar CSV
          </Button>
        </div>

        {/* ===================================================
            TOOLBAR
            =================================================== */}

        <div className="submissions-toolbar">
          <div className="submissions-toolbar-search">
            <Input
              allowClear
              prefix={
                <SearchOutlined />
              }
              placeholder="Buscar por folio, nombre o correo..."
              value={q}
              onChange={event =>
                setQ(
                  event.target.value
                )
              }
            />
          </div>

          <div className="submissions-toolbar-filters">
            <Select
              value={statusFilter}
              onChange={
                setStatusFilter
              }
              style={{
                width: 155
              }}
              options={[
                {
                  value: 'all',
                  label:
                    'Todos los estados'
                },
                {
                  value: 'submitted',
                  label: 'Enviado'
                },
                {
                  value: 'in_review',
                  label: 'En revisión'
                },
                {
                  value: 'resolved',
                  label: 'Resuelto'
                }
              ]}
            />

            <Select
              value={
                validationFilter
              }
              onChange={
                setValidationFilter
              }
              style={{
                width: 175
              }}
              options={[
                {
                  value: 'all',
                  label:
                    'Toda validación'
                },
                {
                  value: 'pending',
                  label: 'Pendiente'
                },
                {
                  value: 'validated',
                  label: 'Validado'
                },
                {
                  value: 'incomplete',
                  label: 'Incompleto'
                },
                {
                  value: 'rejected',
                  label: 'Rechazado'
                }
              ]}
            />

            <Dropdown
              trigger={['click']}
              dropdownRender={() => (
                <div className="submissions-columns-menu">
                  <div className="submissions-columns-title">
                    Columnas visibles
                  </div>

                  {allCols
                    .filter(
                      column =>
                        column.key !==
                        'actions'
                    )
                    .map(column => {
                      const key =
                        column.key as ColumnKey;

                      return (
                        <Checkbox
                          key={key}
                          checked={visible.includes(
                            key
                          )}
                          onChange={event =>
                            setVisible(
                              current =>
                                event
                                  .target
                                  .checked
                                  ? [
                                      ...current,
                                      key
                                    ]
                                  : current.filter(
                                      item =>
                                        item !==
                                        key
                                    )
                            )
                          }
                        >
                          {column.title}
                        </Checkbox>
                      );
                    })}
                </div>
              )}
            >
              <Button
                icon={
                  <SettingOutlined />
                }
              >
                Columnas
              </Button>
            </Dropdown>
          </div>
        </div>

        {/* ===================================================
            ACTIVE FILTER INFO
            =================================================== */}

        {(q ||
          statusFilter !== 'all' ||
          validationFilter !==
            'all') && (
          <div className="submissions-filter-info">
            <FilterOutlined />

            <span>
              Mostrando{' '}
              <strong>
                {filtered.length}
              </strong>{' '}
              de{' '}
              <strong>
                {data.length}
              </strong>{' '}
              respuestas
            </span>

            <Button
              type="link"
              size="small"
              onClick={() => {
                setQ('');
                setStatusFilter(
                  'all'
                );
                setValidationFilter(
                  'all'
                );
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        )}

        {/* ===================================================
            TABLE
            =================================================== */}

        <Table
          className="submissions-table"
          rowKey="id"
          dataSource={filtered}
          columns={columns}
          scroll={{
            x: 1050
          }}
          locale={{
            emptyText: (
              <Empty
                image={
                  Empty.PRESENTED_IMAGE_SIMPLE
                }
                description="No se encontraron respuestas"
              />
            )
          }}
          pagination={{
            pageSize: 10,

            showSizeChanger: true,

            pageSizeOptions: [
              10,
              20,
              50
            ],

            showTotal: (
              total,
              range
            ) =>
              `${range[0]}-${range[1]} de ${total} respuestas`
          }}
        />
      </section>
    </div>
  );
}

/* =========================================================
   COMPONENTS
   ========================================================= */

function MetricCard({
  label,
  value,
  icon,
  variant
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  variant:
    | 'blue'
    | 'orange'
    | 'green'
    | 'red';
}) {
  return (
    <div
      className={`submissions-metric-card ${variant}`}
    >
      <div className="submissions-metric-icon">
        {icon}
      </div>

      <div className="submissions-metric-content">
        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>
      </div>
    </div>
  );
}

function StatusTag({
  status
}: {
  status?: string;
}) {
  const config: Record<
    string,
    {
      label: string;
      className: string;
    }
  > = {
    submitted: {
      label: 'Enviado',
      className: 'submitted'
    },

    in_review: {
      label: 'En revisión',
      className: 'review'
    },

    resolved: {
      label: 'Resuelto',
      className: 'resolved'
    }
  };

  const item =
    config[status ?? ''] ?? {
      label:
        status ??
        'Sin estado',
      className: 'default'
    };

  return (
    <Tag
      className={`submissions-status-tag ${item.className}`}
    >
      <span className="submissions-status-dot" />

      {item.label}
    </Tag>
  );
}

function ValidationPill({
  status
}: {
  status?: string;
}) {
  return (
    <div
      className={`submissions-validation-pill ${status ?? 'pending'}`}
    >
      <span className="submissions-validation-dot" />

      {validationLabel(
        status ?? 'pending'
      )}
    </div>
  );
}

function progressColor(
  status?: string
) {
  switch (status) {
    case 'validated':
      return '#23a26d';

    case 'pending':
      return '#eaa51b';

    case 'incomplete':
      return '#e97817';

    case 'rejected':
      return '#df4d55';

    default:
      return '#2b7ac0';
  }
}