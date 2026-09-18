import {
  App,
  Button,
  Form,
  Spin,
} from 'antd';

import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  EyeOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
} from '@ant-design/icons';

import {
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';

import { api } from '../../services/api';

import type {
  DynamicForm,
} from '../../types';

import FormRenderer from '../../components/forms/FormRenderer';

import { useAuth } from '../../context/AuthContext';

import uasLogo from '../../assets/uas-logo.png';

export default function FormFillPage() {
  const { id } = useParams();

  const [searchParams] =
    useSearchParams();

  const preview =
    searchParams.get('preview') === '1';

  const navigate = useNavigate();

  const { profile } = useAuth();

  const { message } = App.useApp();

  const [form, setForm] =
    useState<DynamicForm>();

  const [values, setValues] =
    useState<Record<string, any>>({});

  const [sent, setSent] =
    useState<any>();

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }

    api
      .get<DynamicForm>(`/forms/${id}`)
      .then(setForm)
      .catch((error) => {
        message.error(
          error instanceof Error
            ? error.message
            : 'No se pudo cargar el formulario',
        );
      });
  }, [id, message]);

  if (!form) {
    return (
      <div className="public-form-loading">
        <Spin size="large" />

        <span>
          Cargando formulario...
        </span>
      </div>
    );
  }

 
  const currentForm = form;

  const fields =
    currentForm.fields ?? [];

  function missing() {
    return fields
      .filter(
        (field) =>
          field.required &&
          ![
            'note',
            'section',
          ].includes(field.type),
      )
      .filter((field) => {
        const value =
          values[field.id!];

        return (
          value === null ||
          value === undefined ||
          value === '' ||
          (
            Array.isArray(value) &&
            !value.length
          ) ||
          (
            field.type ===
              'consent' &&
            !value
          )
        );
      });
  }

  async function submit() {
    if (preview) {
      return;
    }

    const requiredMissing =
      missing();

    if (
      requiredMissing.length
    ) {
      message.error(
        requiredMissing.length === 1
          ? 'Falta completar un campo obligatorio.'
          : `Faltan ${requiredMissing.length} campos obligatorios.`,
      );

      return;
    }

    setLoading(true);

    try {
      const signatureFields =
        fields.filter(
          (field) =>
            field.type ===
              'signature' &&
            typeof values[
              field.id!
            ] === 'string' &&
            values[
              field.id!
            ].startsWith(
              'data:image',
            ),
        );

      const cooked = {
        ...values,
      };

      for (
        const field of
        signatureFields
      ) {
        const dataUrl =
          cooked[field.id!];

        const blob =
          await (
            await fetch(dataUrl)
          ).blob();

        const {
          supabase,
        } = await import(
          '../../services/supabase'
        );

        const path =
          `${profile!.id}/${currentForm.id}/` +
          `${crypto.randomUUID()}-firma.png`;

        const {
          error,
        } =
          await supabase.storage
            .from('form-uploads')
            .upload(
              path,
              blob,
              {
                contentType:
                  'image/png',
              },
            );

        if (error) {
          throw error;
        }

        cooked[field.id!] = {
          name: 'firma.png',
          path,
          mime: 'image/png',
          size: blob.size,
        };
      }

      const submission =
        await api.post<any>(
          '/submissions',
          {
            form_id: currentForm.id,

            answers:
              Object.entries(
                cooked,
              ).map(
                ([
                  field_id,
                  value,
                ]) => ({
                  field_id,
                  value,
                }),
              ),
          },
        );

      setSent(submission);

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : 'No se pudo enviar el formulario',
      );
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="public-form-page">
        <div className="public-form-shell">
          <div className="form-success-card">
            <div className="form-success-icon">
              <CheckCircleFilled />
            </div>

            <h1>
              Formulario enviado
            </h1>

            <p>
              Tu respuesta fue
              registrada correctamente.
            </p>

            <div className="form-success-folio">
              <span>
                Folio de seguimiento
              </span>

              <strong>
                {sent.folio}
              </strong>
            </div>

            <Button
              type="primary"
              size="large"
              onClick={() =>
                navigate('/forms')
              }
            >
              Volver a formularios
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="public-form-page">
      <div className="public-form-shell">

        <div className="public-form-topbar">
          <button
            type="button"
            className="public-form-back"
            onClick={() =>
              navigate(-1)
            }
          >
            <ArrowLeftOutlined />

            <span>Volver</span>
          </button>

          <div className="public-form-brand">
            <img
              src={uasLogo}
              alt="Universidad Autónoma de Sinaloa"
            />

            <div>
              <strong>
                Facultad de Ingeniería Mochis
              </strong>

              <span>
                Universidad Autónoma de Sinaloa
              </span>
            </div>
          </div>
        </div>

        {preview && (
          <div className="form-preview-banner">
            <div className="form-preview-banner-icon">
              <EyeOutlined />
            </div>

            <div>
              <strong>
                Vista previa administrativa
              </strong>

              <span>
                Puedes interactuar con los campos,
                pero las respuestas no serán guardadas.
              </span>
            </div>
          </div>
        )}

        <header className="public-form-header">
          <div className="public-form-header-accent" />

          <div className="public-form-header-body">
            <div className="public-form-header-meta">
              <SafetyCertificateOutlined />

              <span>
                Formulario institucional
              </span>
            </div>

            <h1>
              {currentForm.title}
            </h1>

            {currentForm.description && (
              <p>
                {currentForm.description}
              </p>
            )}
            <div className="public-form-header-footer">
              <span>
                Los campos marcados con
                <strong> *</strong> son obligatorios.
              </span>
            </div>
          </div>
        </header>

        <Form
          layout="vertical"
          requiredMark={false}
          className="public-form-content"
          onFinish={() =>
            void submit()
          }
        >
          <FormRenderer
            form={currentForm}
            fields={fields}
            values={values}
            onChange={(
              fieldId,
              value,
            ) =>
              setValues(
                (current) => ({
                  ...current,
                  [fieldId]: value,
                }),
              )
            }
          />

          <div className="public-form-actions">
            <Button
              size="large"
              onClick={() =>
                navigate(-1)
              }
            >
              Cancelar
            </Button>

            {!preview && (
              <Button
                htmlType="submit"
                type="primary"
                size="large"
                loading={loading}
                icon={<SendOutlined />}
                className="public-form-submit"
              >
                Enviar formulario
              </Button>
            )}

            {preview && (
              <div className="public-form-preview-note">
                <EyeOutlined />

                Modo vista previa
              </div>
            )}
          </div>
        </Form>

        <footer className="public-form-footer">
          <img
            src={uasLogo}
            alt=""
          />

          <span>
            Apoyos Digitales · Facultad de Ingeniería Mochis
          </span>
        </footer>
      </div>
    </div>
  );
}