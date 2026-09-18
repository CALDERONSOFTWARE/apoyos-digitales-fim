import {
  App,
  Button,
  Image,
  Upload,
} from 'antd';

import type {
  UploadProps,
} from 'antd';

import {
  DeleteOutlined,
  FileImageOutlined,
  FileOutlined,
  InboxOutlined,
  ReloadOutlined,
} from '@ant-design/icons';

import { supabase } from '../../services/supabase';

const { Dragger } = Upload;

type UploadValue = {
  name: string;
  path: string;
  mime: string;
  size: number;
  preview?: string;
};

export default function UploadField({
  formId,
  imageOnly = false,
  value,
  onChange,
}: {
  formId: string;
  imageOnly?: boolean;
  value?: UploadValue;
  onChange?: (value: UploadValue | null) => void;
}) {
  const { message } = App.useApp();

  const maxSize =
    10 * 1024 * 1024;

  const allowedMimeTypes = imageOnly
    ? [
        'image/jpeg',
        'image/png',
      ]
    : [
        'image/jpeg',
        'image/png',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];

  const formatBytes = (
    bytes: number,
  ) => {
    if (!bytes) {
      return '0 B';
    }

    const units = [
      'B',
      'KB',
      'MB',
      'GB',
    ];

    const index =
      Math.floor(
        Math.log(bytes) /
          Math.log(1024),
      );

    return `${(
      bytes /
      Math.pow(1024, index)
    ).toFixed(
      index === 0 ? 0 : 1,
    )} ${units[index]}`;
  };

  const uploadFile: UploadProps['beforeUpload'] =
    async (file) => {
      if (
        !allowedMimeTypes.includes(
          file.type,
        )
      ) {
        message.error(
          imageOnly
            ? 'Solo se permiten imágenes JPG o PNG.'
            : 'Tipo de archivo no permitido. Usa JPG, PNG, PDF, DOCX o XLSX.',
        );

        return Upload.LIST_IGNORE;
      }

      if (file.size > maxSize) {
        message.error(
          'El archivo supera el máximo permitido de 10 MB.',
        );

        return Upload.LIST_IGNORE;
      }

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        message.error(
          'No se encontró una sesión activa.',
        );

        return Upload.LIST_IGNORE;
      }

      const safeName =
        file.name.replace(
          /[^a-zA-Z0-9._-]/g,
          '_',
        );

      const path =
        `${user.id}/${formId}/` +
        `${crypto.randomUUID()}-${safeName}`;

      const { error } =
        await supabase.storage
          .from('form-uploads')
          .upload(
            path,
            file,
            {
              contentType:
                file.type,
              upsert: false,
            },
          );

      if (error) {
        message.error(
          error.message,
        );

        return Upload.LIST_IGNORE;
      }

      const {
        data: signed,
      } =
        await supabase.storage
          .from('form-uploads')
          .createSignedUrl(
            path,
            3600,
          );

      onChange?.({
        name: file.name,
        path,
        mime: file.type,
        size: file.size,
        preview:
          signed?.signedUrl,
      });

      message.success(
        imageOnly
          ? 'Imagen cargada correctamente'
          : 'Archivo cargado correctamente',
      );

      return false;
    };

  const accept = imageOnly
    ? '.jpg,.jpeg,.png'
    : '.jpg,.jpeg,.png,.pdf,.docx,.xlsx';

  return (
    <div className="upload-field-shell">
      {!value ? (
        <Dragger
          className={`modern-upload-dragger ${
            imageOnly
              ? 'modern-upload-dragger-image'
              : ''
          }`}
          multiple={false}
          maxCount={1}
          showUploadList={false}
          beforeUpload={
            uploadFile
          }
          accept={accept}
        >
          <div className="modern-upload-content">
            <div className="modern-upload-icon">
              {imageOnly ? (
                <FileImageOutlined />
              ) : (
                <InboxOutlined />
              )}
            </div>

            <div className="modern-upload-title">
              {imageOnly
                ? 'Arrastra una imagen aquí'
                : 'Arrastra un archivo aquí'}
            </div>

            <div className="modern-upload-subtitle">
              o haz clic para seleccionar desde tu equipo
            </div>

            <Button
              type="default"
              className="modern-upload-select-button"
            >
              {imageOnly
                ? 'Seleccionar imagen'
                : 'Seleccionar archivo'}
            </Button>

            <div className="modern-upload-help">
              {imageOnly
                ? 'JPG o PNG · Máximo 10 MB'
                : 'JPG, PNG, PDF, DOCX o XLSX · Máximo 10 MB'}
            </div>
          </div>
        </Dragger>
      ) : (
        <div className="uploaded-file-card">
          {value.preview &&
          value.mime.startsWith(
            'image/',
          ) ? (
            <div className="uploaded-image-preview">
              <Image
                src={
                  value.preview
                }
                alt={value.name}
                preview
              />
            </div>
          ) : (
            <div className="uploaded-file-icon">
              <FileOutlined />
            </div>
          )}

          <div className="uploaded-file-info">
            <strong>
              {value.name}
            </strong>

            <span>
              {formatBytes(
                value.size,
              )}
            </span>

            <small>
              Archivo cargado correctamente
            </small>
          </div>

          <div className="uploaded-file-actions">
            <Upload
              multiple={false}
              maxCount={1}
              showUploadList={false}
              beforeUpload={
                uploadFile
              }
              accept={accept}
            >
              <Button
                type="text"
                icon={
                  <ReloadOutlined />
                }
              >
                Reemplazar
              </Button>
            </Upload>

            <Button
              type="text"
              danger
              icon={
                <DeleteOutlined />
              }
              onClick={() =>
                onChange?.(null)
              }
            >
              Quitar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}