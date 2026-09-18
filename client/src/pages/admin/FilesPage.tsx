import {
  AppstoreOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';

import {
  Button,
  Card,
  Empty,
  Image,
  Input,
  Segmented,
  Select,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
  message,
} from 'antd';

import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';

import { api } from '../../services/api';
import { supabase } from '../../services/supabase';

type FileItem = {
  id: string;
  submissionId: string;
  folio: string;
  formId?: string;
  formTitle: string;
  respondent: string;
  fieldLabel: string;
  fieldType?: string;

  name: string;
  path: string;
  mime: string;
  size?: number;

  uploadedAt?: string;
  preview?: string;
};

type SubmissionResponse = {
  id: string;
  folio?: string;
  form_id?: string;
  submitted_at?: string;

  forms?: {
    title?: string;
  };

  profiles?: {
    full_name?: string;
    email?: string;
  };

  submission_answers?: Array<{
    id?: string;
    field_id?: string;

    value?: any;

    form_fields?: {
      label?: string;
      type?: string;
    };
  }>;
};

function getFileIcon(mime: string, name: string) {
  const normalizedMime = String(mime ?? '').toLowerCase();
  const normalizedName = String(name ?? '').toLowerCase();

  if (normalizedMime.startsWith('image/')) {
    return <FileImageOutlined />;
  }

  if (
    normalizedMime.includes('pdf') ||
    normalizedName.endsWith('.pdf')
  ) {
    return <FilePdfOutlined />;
  }

  if (
    normalizedMime.includes('spreadsheet') ||
    normalizedMime.includes('excel') ||
    normalizedName.endsWith('.xlsx') ||
    normalizedName.endsWith('.xls') ||
    normalizedName.endsWith('.csv')
  ) {
    return <FileExcelOutlined />;
  }

  if (
    normalizedMime.includes('word') ||
    normalizedName.endsWith('.doc') ||
    normalizedName.endsWith('.docx')
  ) {
    return <FileTextOutlined />;
  }

  return <FileOutlined />;
}

function formatBytes(bytes?: number) {
  if (!bytes || Number.isNaN(bytes)) {
    return 'Tamaño no disponible';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let index = 0;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }

  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function getFileCategory(file: FileItem) {
  const mime = file.mime.toLowerCase();
  const name = file.name.toLowerCase();

  if (mime.startsWith('image/')) {
    if (file.fieldType === 'signature') {
      return 'signature';
    }

    return 'image';
  }

  if (mime.includes('pdf') || name.endsWith('.pdf')) {
    return 'pdf';
  }

  if (
    mime.includes('spreadsheet') ||
    mime.includes('excel') ||
    name.endsWith('.xlsx') ||
    name.endsWith('.xls') ||
    name.endsWith('.csv')
  ) {
    return 'spreadsheet';
  }

  if (
    mime.includes('word') ||
    name.endsWith('.doc') ||
    name.endsWith('.docx')
  ) {
    return 'document';
  }

  return 'other';
}

function categoryLabel(category: string) {
  switch (category) {
    case 'image':
      return 'Imagen';

    case 'signature':
      return 'Firma';

    case 'pdf':
      return 'PDF';

    case 'spreadsheet':
      return 'Hoja de cálculo';

    case 'document':
      return 'Documento';

    default:
      return 'Archivo';
  }
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [formFilter, setFormFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [view, setView] = useState<'gallery' | 'list'>('gallery');

  const loadFiles = async () => {
    setLoading(true);

    try {
      /*
       * Consultamos todos los formularios para después obtener
       * las respuestas de cada uno.
       *
       * Esto aprovecha las rutas que YA existen en tu backend:
       *
       * GET /api/forms
       * GET /api/submissions/form/:formId
       */
      const forms = await api.get<any[]>('/forms');

      const submissionsByForm = await Promise.all(
        (forms ?? []).map(async (form) => {
          try {
            const submissions = await api.get<SubmissionResponse[]>(
              `/submissions/form/${form.id}`,
            );

            return (submissions ?? []).map((submission) => ({
              ...submission,

              forms: submission.forms ?? {
                title: form.title,
              },
            }));
          } catch (error) {
            console.error(
              `No se pudieron cargar respuestas del formulario ${form.id}`,
              error,
            );

            return [];
          }
        }),
      );

      const submissions = submissionsByForm.flat();

      const detectedFiles: FileItem[] = [];

      for (const submission of submissions) {
        for (const answer of submission.submission_answers ?? []) {
          const value = answer.value;

          /*
           * Los UploadField y SignatureField del sistema almacenan
           * un objeto con "path".
           *
           * Si no existe path, esta respuesta no representa un archivo.
           */
          if (!value || typeof value !== 'object' || !value.path) {
            continue;
          }

          const path = String(value.path);

          let preview: string | undefined;

          try {
            const { data, error } = await supabase.storage
              .from('form-uploads')
              .createSignedUrl(path, 3600);

            if (!error) {
              preview = data?.signedUrl;
            }
          } catch (error) {
            console.error(
              `No se pudo generar URL para ${path}`,
              error,
            );
          }

          const name =
            value.name ||
            path.split('/').pop() ||
            'Archivo';

          detectedFiles.push({
            id:
              answer.id ||
              `${submission.id}-${answer.field_id}-${path}`,

            submissionId: submission.id,

            folio:
              submission.folio ||
              submission.id.slice(0, 8),

            formId: submission.form_id,

            formTitle:
              submission.forms?.title ||
              'Formulario',

            respondent:
              submission.profiles?.full_name ||
              submission.profiles?.email ||
              'Usuario',

            fieldLabel:
              answer.form_fields?.label ||
              'Archivo adjunto',

            fieldType:
              answer.form_fields?.type,

            name,
            path,

            mime:
              value.mime ||
              value.type ||
              '',

            size:
              typeof value.size === 'number'
                ? value.size
                : undefined,

            uploadedAt:
              submission.submitted_at,

            preview,
          });
        }
      }

      detectedFiles.sort((a, b) => {
        const dateA = a.uploadedAt
          ? new Date(a.uploadedAt).getTime()
          : 0;

        const dateB = b.uploadedAt
          ? new Date(b.uploadedAt).getTime()
          : 0;

        return dateB - dateA;
      });

      setFiles(detectedFiles);
    } catch (error) {
      console.error(error);

      message.error(
        error instanceof Error
          ? error.message
          : 'No se pudieron cargar los archivos',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const formOptions = useMemo(() => {
    const map = new Map<string, string>();

    files.forEach((file) => {
      if (file.formId) {
        map.set(file.formId, file.formTitle);
      }
    });

    return Array.from(map.entries()).map(
      ([value, label]) => ({
        value,
        label,
      }),
    );
  }, [files]);

  const filteredFiles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return files.filter((file) => {
      const matchesSearch =
        !query ||
        file.name.toLowerCase().includes(query) ||
        file.formTitle.toLowerCase().includes(query) ||
        file.respondent.toLowerCase().includes(query) ||
        file.fieldLabel.toLowerCase().includes(query) ||
        file.folio.toLowerCase().includes(query);

      const matchesForm =
        formFilter === 'all' ||
        file.formId === formFilter;

      const matchesType =
        typeFilter === 'all' ||
        getFileCategory(file) === typeFilter;

      return (
        matchesSearch &&
        matchesForm &&
        matchesType
      );
    });
  }, [
    files,
    search,
    formFilter,
    typeFilter,
  ]);

  const stats = useMemo(() => {
    return {
      total: files.length,

      images: files.filter(
        (file) =>
          getFileCategory(file) === 'image',
      ).length,

      signatures: files.filter(
        (file) =>
          getFileCategory(file) === 'signature',
      ).length,

      documents: files.filter((file) =>
        [
          'pdf',
          'spreadsheet',
          'document',
          'other',
        ].includes(getFileCategory(file)),
      ).length,
    };
  }, [files]);

  const openFile = (file: FileItem) => {
    if (!file.preview) {
      message.warning(
        'No se pudo generar un enlace temporal para este archivo.',
      );

      return;
    }

    window.open(
      file.preview,
      '_blank',
      'noopener,noreferrer',
    );
  };

  const downloadFile = async (file: FileItem) => {
    if (!file.preview) {
      message.warning(
        'No se pudo generar un enlace temporal para este archivo.',
      );

      return;
    }

    try {
      const response = await fetch(file.preview);
      const blob = await response.blob();

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');

      anchor.href = url;
      anchor.download = file.name;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(url);
    } catch {
      /*
       * Si el navegador no permite descargar el archivo mediante fetch,
       * abrimos el enlace firmado.
       */
      window.open(
        file.preview,
        '_blank',
        'noopener,noreferrer',
      );
    }
  };

  return (
    <div className="files-page">
      <div className="files-page-header">
        <div>
          <Typography.Title
            level={2}
            style={{
              margin: 0,
            }}
          >
            Archivos
          </Typography.Title>

          <Typography.Text type="secondary">
            Documentos, imágenes y evidencias recibidas
            mediante los formularios.
          </Typography.Text>
        </div>

        <Button
          icon={<ReloadOutlined />}
          onClick={loadFiles}
          loading={loading}
        >
          Actualizar
        </Button>
      </div>

      <div className="files-stats-grid">
        <Card className="files-stat-card files-stat-total">
          <Statistic
            title="Archivos recibidos"
            value={stats.total}
            prefix={<FolderOpenOutlined />}
          />
        </Card>

        <Card className="files-stat-card files-stat-images">
          <Statistic
            title="Imágenes"
            value={stats.images}
            prefix={<FileImageOutlined />}
          />
        </Card>

        <Card className="files-stat-card files-stat-documents">
          <Statistic
            title="Documentos"
            value={stats.documents}
            prefix={<FileTextOutlined />}
          />
        </Card>

        <Card className="files-stat-card files-stat-signatures">
          <Statistic
            title="Firmas"
            value={stats.signatures}
            prefix={<FileImageOutlined />}
          />
        </Card>
      </div>

      <Card
        className="files-toolbar-card"
        styles={{
          body: {
            padding: 16,
          },
        }}
      >
        <div className="files-toolbar">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Buscar archivo, formulario, folio o usuario..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            className="files-search"
          />

          <Select
            value={formFilter}
            onChange={setFormFilter}
            className="files-filter"
            options={[
              {
                value: 'all',
                label: 'Todos los formularios',
              },

              ...formOptions,
            ]}
          />

          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            className="files-filter"
            options={[
              {
                value: 'all',
                label: 'Todos los archivos',
              },
              {
                value: 'image',
                label: 'Imágenes',
              },
              {
                value: 'signature',
                label: 'Firmas',
              },
              {
                value: 'pdf',
                label: 'PDF',
              },
              {
                value: 'document',
                label: 'Documentos',
              },
              {
                value: 'spreadsheet',
                label: 'Hojas de cálculo',
              },
              {
                value: 'other',
                label: 'Otros',
              },
            ]}
          />

          <Segmented
            value={view}
            onChange={(value) =>
              setView(
                value as 'gallery' | 'list',
              )
            }
            options={[
              {
                value: 'gallery',
                icon: <AppstoreOutlined />,
                label: 'Galería',
              },
              {
                value: 'list',
                icon: <FileTextOutlined />,
                label: 'Lista',
              },
            ]}
          />
        </div>
      </Card>

      <div className="files-results-header">
        <Typography.Text strong>
          {filteredFiles.length}{' '}
          {filteredFiles.length === 1
            ? 'archivo'
            : 'archivos'}
        </Typography.Text>

        {(search ||
          formFilter !== 'all' ||
          typeFilter !== 'all') && (
          <Button
            type="link"
            onClick={() => {
              setSearch('');
              setFormFilter('all');
              setTypeFilter('all');
            }}
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {loading ? (
        <div className="files-loading">
          <Spin size="large" />

          <Typography.Text type="secondary">
            Cargando archivos...
          </Typography.Text>
        </div>
      ) : filteredFiles.length === 0 ? (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              files.length === 0
                ? 'Todavía no se han recibido archivos.'
                : 'No hay archivos que coincidan con los filtros.'
            }
          />
        </Card>
      ) : view === 'gallery' ? (
        <div className="files-gallery">
          {filteredFiles.map((file) => {
            const category =
              getFileCategory(file);

            const isImage =
              file.mime
                .toLowerCase()
                .startsWith('image/') &&
              Boolean(file.preview);

            return (
              <Card
                key={file.id}
                className="file-gallery-card"
                styles={{
                  body: {
                    padding: 0,
                  },
                }}
              >
                <div className="file-preview">
                  {isImage ? (
                    <Image
                      src={file.preview}
                      alt={file.name}
                      className="file-preview-image"
                      preview={{
                        mask: 'Ver imagen',
                      }}
                    />
                  ) : (
                    <div className="file-document-preview">
                      <div className="file-document-icon">
                        {getFileIcon(
                          file.mime,
                          file.name,
                        )}
                      </div>

                      <span>
                        {categoryLabel(category)}
                      </span>
                    </div>
                  )}

                  <Tag className="file-type-tag">
                    {categoryLabel(category)}
                  </Tag>
                </div>

                <div className="file-gallery-content">
                  <Typography.Text
                    strong
                    ellipsis={{
                      tooltip: file.name,
                    }}
                    className="file-name"
                  >
                    {file.name}
                  </Typography.Text>

                  <Typography.Text
                    type="secondary"
                    className="file-form-name"
                    ellipsis={{
                      tooltip: file.formTitle,
                    }}
                  >
                    {file.formTitle}
                  </Typography.Text>

                  <div className="file-meta">
                    <span>{file.folio}</span>

                    <span>
                      {file.uploadedAt
                        ? dayjs(
                            file.uploadedAt,
                          ).format(
                            'DD/MM/YYYY HH:mm',
                          )
                        : 'Sin fecha'}
                    </span>
                  </div>

                  <div className="file-meta">
                    <span>
                      {file.respondent}
                    </span>

                    <span>
                      {formatBytes(file.size)}
                    </span>
                  </div>

                  <Typography.Text
                    type="secondary"
                    className="file-field-label"
                  >
                    {file.fieldLabel}
                  </Typography.Text>

                  <Space
                    style={{
                      width: '100%',
                      marginTop: 14,
                    }}
                  >
                    <Button
                      block
                      onClick={() =>
                        openFile(file)
                      }
                      disabled={!file.preview}
                    >
                      Abrir
                    </Button>

                    <Button
                      type="primary"
                      icon={
                        <DownloadOutlined />
                      }
                      onClick={() =>
                        downloadFile(file)
                      }
                      disabled={!file.preview}
                    />
                  </Space>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card
          className="files-list-card"
          styles={{
            body: {
              padding: 0,
            },
          }}
        >
          <div className="files-list">
            {filteredFiles.map((file) => {
              const category =
                getFileCategory(file);

              return (
                <div
                  key={file.id}
                  className="file-list-row"
                >
                  <div className="file-list-icon">
                    {getFileIcon(
                      file.mime,
                      file.name,
                    )}
                  </div>

                  <div className="file-list-main">
                    <Typography.Text
                      strong
                      ellipsis={{
                        tooltip: file.name,
                      }}
                    >
                      {file.name}
                    </Typography.Text>

                    <Typography.Text type="secondary">
                      {file.formTitle} ·{' '}
                      {file.fieldLabel}
                    </Typography.Text>
                  </div>

                  <div className="file-list-user">
                    <Typography.Text>
                      {file.respondent}
                    </Typography.Text>

                    <Typography.Text type="secondary">
                      {file.folio}
                    </Typography.Text>
                  </div>

                  <div className="file-list-date">
                    <Typography.Text>
                      {file.uploadedAt
                        ? dayjs(
                            file.uploadedAt,
                          ).format(
                            'DD/MM/YYYY',
                          )
                        : '—'}
                    </Typography.Text>

                    <Typography.Text type="secondary">
                      {file.uploadedAt
                        ? dayjs(
                            file.uploadedAt,
                          ).format('HH:mm')
                        : ''}
                    </Typography.Text>
                  </div>

                  <Tag>
                    {categoryLabel(category)}
                  </Tag>

                  <Space>
                    <Button
                      onClick={() =>
                        openFile(file)
                      }
                      disabled={!file.preview}
                    >
                      Abrir
                    </Button>

                    <Button
                      icon={
                        <DownloadOutlined />
                      }
                      onClick={() =>
                        downloadFile(file)
                      }
                      disabled={!file.preview}
                    />
                  </Space>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}