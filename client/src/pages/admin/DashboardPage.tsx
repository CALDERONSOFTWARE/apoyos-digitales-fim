import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FileDoneOutlined,
  FileTextOutlined,
  InboxOutlined,
  RiseOutlined,
} from '@ant-design/icons';

import {
  Button,
  Card,
  Col,
  Empty,
  Row,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd';

import {
  Area,
  Bar,
  Pie,
} from '@ant-design/plots';

import {
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import dayjs from 'dayjs';

import { api } from '../../services/api';

import {
  ValidationTag,
} from '../../utils/status';

type DashboardData = {
  counts: {
    forms: number;
    active: number;
    submissions: number;
    pending: number;
    validated: number;
    observations: number;
  };

  byDay: {
    date: string;
    count: number;
  }[];

  byForm: {
    form: string;
    count: number;
  }[];

  validationDistribution: {
    type: string;
    value: number;
  }[];

  recent: any[];
};

type MetricCardProps = {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  tone:
    | 'blue'
    | 'cyan'
    | 'purple'
    | 'orange'
    | 'green'
    | 'red';
};

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  tone,
}: MetricCardProps) {
  return (
    <Card
      bordered={false}
      className={`dashboard-metric dashboard-metric-${tone}`}
    >
      <div className="dashboard-metric-top">
        <div
          className={`dashboard-metric-icon dashboard-metric-icon-${tone}`}
        >
          {icon}
        </div>

        <span className="dashboard-metric-label">
          {title}
        </span>
      </div>

      <div className="dashboard-metric-value">
        {value}
      </div>

      <div className="dashboard-metric-subtitle">
        {subtitle}
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const [data, setData] =
    useState<DashboardData>();

  const [loading, setLoading] =
    useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    api
      .get<DashboardData>('/dashboard')
      .then(setData)
      .finally(() =>
        setLoading(false)
      );
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Spin size="large" />
      </div>
    );
  }

  const counts = data?.counts ?? {
    forms: 0,
    active: 0,
    submissions: 0,
    pending: 0,
    validated: 0,
    observations: 0,
  };

  const activityData =
    data?.byDay?.map(item => ({
      ...item,

      label: dayjs(
        item.date
      ).format('DD MMM'),
    })) ?? [];

  return (
    <div className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <Typography.Title
            level={2}
            className="dashboard-title"
          >
            Dashboard
          </Typography.Title>

          <Typography.Text
            type="secondary"
            className="dashboard-description"
          >
            Resumen general de formularios,
            solicitudes y actividad académica.
          </Typography.Text>
        </div>

        <div className="dashboard-heading-actions">
          <Button
            onClick={() =>
              navigate('/admin/files')
            }
          >
            Ver archivos
          </Button>

          <Button
            type="primary"
            onClick={() =>
              navigate('/admin/forms')
            }
          >
            Administrar formularios
          </Button>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col
          xs={24}
          sm={12}
          lg={8}
          xl={4}
        >
          <MetricCard
            title="Total formularios"
            value={counts.forms}
            subtitle="Formularios registrados"
            tone="blue"
            icon={<FileTextOutlined />}
          />
        </Col>

        <Col
          xs={24}
          sm={12}
          lg={8}
          xl={4}
        >
          <MetricCard
            title="Formularios activos"
            value={counts.active}
            subtitle="Disponibles actualmente"
            tone="cyan"
            icon={<FileDoneOutlined />}
          />
        </Col>

        <Col
          xs={24}
          sm={12}
          lg={8}
          xl={4}
        >
          <MetricCard
            title="Total respuestas"
            value={counts.submissions}
            subtitle="Registros recibidos"
            tone="purple"
            icon={<InboxOutlined />}
          />
        </Col>

        <Col
          xs={24}
          sm={12}
          lg={8}
          xl={4}
        >
          <MetricCard
            title="Pendientes"
            value={counts.pending}
            subtitle="Esperando revisión"
            tone="orange"
            icon={<ClockCircleOutlined />}
          />
        </Col>

        <Col
          xs={24}
          sm={12}
          lg={8}
          xl={4}
        >
          <MetricCard
            title="Validadas"
            value={counts.validated}
            subtitle="Revisadas correctamente"
            tone="green"
            icon={<CheckCircleOutlined />}
          />
        </Col>

        <Col
          xs={24}
          sm={12}
          lg={8}
          xl={4}
        >
          <MetricCard
            title="Observaciones"
            value={counts.observations}
            subtitle="Requieren atención"
            tone="red"
            icon={
              <ExclamationCircleOutlined />
            }
          />
        </Col>
      </Row>

      <Row
        gutter={[16, 16]}
        className="dashboard-section-row"
      >
        <Col
          xs={24}
          xl={15}
        >
          <Card
            bordered={false}
            className="dashboard-panel"
            title={
              <div className="dashboard-panel-title">
                <div>
                  <strong>
                    Actividad de respuestas
                  </strong>

                  <span>
                    Evolución de registros
                    recibidos por día
                  </span>
                </div>

                <RiseOutlined />
              </div>
            }
          >
{activityData.length ? (
  <Area
    data={activityData}
    xField="label"
    yField="count"
    height={300}
    shapeField="smooth"
    style={{
      fillOpacity: 0.18,
    }}
    axis={{
      y: {
        title: false,
      },

      x: {
        title: false,
      },
    }}
  />
) : (
  <Empty
    description="Todavía no hay actividad registrada"
  />
)}
          </Card>
        </Col>

        <Col
          xs={24}
          xl={9}
        >
          <Card
            bordered={false}
            className="dashboard-panel"
            title={
              <div className="dashboard-panel-title">
                <div>
                  <strong>
                    Estado de validación
                  </strong>

                  <span>
                    Distribución de las
                    respuestas
                  </span>
                </div>
              </div>
            }
          >
            {data?.validationDistribution
              ?.length ? (
              <Pie
                data={
                  data.validationDistribution
                }
                angleField="value"
                colorField="type"
                innerRadius={0.64}
                height={300}
                legend={{
                  position: 'bottom',
                }}
                label={{
                  text: 'value',
                  position: 'outside',
                }}
                annotations={[
                  {
                    type: 'text',
                    style: {
                      text: `${counts.submissions}`,
                      x: '50%',
                      y: '46%',
                      textAlign: 'center',
                      fontSize: 28,
                      fontWeight: 700,
                    },
                  },
                  {
                    type: 'text',
                    style: {
                      text: 'Total',
                      x: '50%',
                      y: '55%',
                      textAlign: 'center',
                      fontSize: 12,
                    },
                  },
                ]}
              />
            ) : (
              <Empty
                description="Sin respuestas para analizar"
              />
            )}
          </Card>
        </Col>
      </Row>

      <Row
        gutter={[16, 16]}
        className="dashboard-section-row"
      >
        <Col span={24}>
          <Card
            bordered={false}
            className="dashboard-panel"
            title={
              <div className="dashboard-panel-title">
                <div>
                  <strong>
                    Formularios más utilizados
                  </strong>

                  <span>
                    Cantidad de respuestas
                    recibidas por formulario
                  </span>
                </div>
              </div>
            }
          >
            {data?.byForm?.length ? (
              <Bar
                data={data.byForm}
                xField="count"
                yField="form"
                height={280}
                label={{
                  text: 'count',
                  position: 'right',
                }}
                axis={{
                  x: {
                    title: false,
                  },

                  y: {
                    title: false,
                  },
                }}
              />
            ) : (
              <Empty
                description="No hay formularios con respuestas"
              />
            )}
          </Card>
        </Col>
      </Row>

      <Card
        bordered={false}
        className="dashboard-panel dashboard-recent-panel"
        title={
          <div className="dashboard-panel-title">
            <div>
              <strong>
                Respuestas recientes
              </strong>

              <span>
                Últimos registros recibidos
                en el sistema
              </span>
            </div>
          </div>
        }
      >
        <Table
          rowKey="id"
          size="middle"
          dataSource={
            data?.recent ?? []
          }
          pagination={false}
          scroll={{
            x: 850,
          }}
          onRow={record => ({
            onClick: () =>
              navigate(
                `/admin/submissions/${record.id}`
              ),

            style: {
              cursor: 'pointer',
            },
          })}
          columns={[
            {
              title: 'Folio',
              dataIndex: 'folio',

              render: value => (
                <Typography.Text strong>
                  {value || '—'}
                </Typography.Text>
              ),
            },

            {
              title: 'Fecha',
              dataIndex: 'submitted_at',

              render: value =>
                dayjs(value).format(
                  'DD/MM/YYYY HH:mm'
                ),
            },

            {
              title: 'Formulario',

              render: (_, record: any) =>
                record.forms?.title ??
                '—',
            },

            {
              title: 'Respondente',

              render: (_, record: any) =>
                record.profiles
                  ?.full_name ??
                record.profiles?.email ??
                '—',
            },

            {
              title: 'Estado',
              dataIndex: 'status',

              render: value => (
                <Tag>
                  {value}
                </Tag>
              ),
            },

            {
              title: 'Validación',
              dataIndex:
                'validation_status',

              render: value => (
                <ValidationTag
                  status={value}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}