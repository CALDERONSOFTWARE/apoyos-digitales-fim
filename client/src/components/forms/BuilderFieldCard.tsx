import {
  CalendarOutlined,
  CheckSquareOutlined,
  CopyOutlined,
  DeleteOutlined,
  FileImageOutlined,
  FileOutlined,
  FontSizeOutlined,
  HolderOutlined,
  NumberOutlined,
  StarOutlined,
} from '@ant-design/icons';

import { Button } from 'antd';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type {
  FieldType,
  FormField,
} from '../../types';

const typeNames: Record<FieldType, string> = {
  text: 'Texto corto',
  textarea: 'Texto largo',
  number: 'Número',
  decimal: 'Decimal',
  email: 'Correo',
  phone: 'Teléfono',
  date: 'Fecha',
  time: 'Hora',
  datetime: 'Fecha y hora',
  select_one: 'Opción única',
  select_multiple: 'Selección múltiple',
  boolean: 'Sí / No',
  rating: 'Calificación',
  range: 'Rango',
  file: 'Archivo',
  image: 'Imagen',
  signature: 'Firma',
  consent: 'Consentimiento',
  note: 'Nota',
  section: 'Sección',
  matrix: 'Matriz',
};

function FieldTypeIcon({
  type,
}: {
  type: FieldType;
}) {
  if (
    ['number', 'decimal', 'range'].includes(type)
  ) {
    return <NumberOutlined />;
  }

  if (
    ['date', 'time', 'datetime'].includes(type)
  ) {
    return <CalendarOutlined />;
  }

  if (
    ['select_one', 'select_multiple', 'boolean'].includes(
      type,
    )
  ) {
    return <CheckSquareOutlined />;
  }

  if (type === 'rating') {
    return <StarOutlined />;
  }

  if (type === 'image') {
    return <FileImageOutlined />;
  }

  if (type === 'file' || type === 'signature') {
    return <FileOutlined />;
  }

  return <FontSizeOutlined />;
}

function FieldPreview({
  field,
}: {
  field: FormField;
}) {
  const options = Array.isArray(field.options)
    ? field.options
    : [];

  if (field.type === 'section') {
    return (
      <div className="gf-section-preview">
        <span />
      </div>
    );
  }

  if (field.type === 'note') {
    return (
      <div className="gf-note-preview">
        {field.description ||
          'Texto informativo para el respondente.'}
      </div>
    );
  }

  if (
    [
      'text',
      'email',
      'phone',
      'number',
      'decimal',
    ].includes(field.type)
  ) {
    return (
      <div className="gf-answer-line">
        Respuesta corta
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div className="gf-answer-line gf-answer-line-long">
        Respuesta larga
      </div>
    );
  }

  if (
    ['date', 'time', 'datetime'].includes(field.type)
  ) {
    return (
      <div className="gf-answer-line gf-answer-date">
        <CalendarOutlined />
        Seleccionar {typeNames[field.type].toLowerCase()}
      </div>
    );
  }

  if (field.type === 'select_one') {
    return (
      <div className="gf-options-preview">
        {(options.length
          ? options
          : ['Opción 1', 'Opción 2']
        ).slice(0, 4).map((option, index) => (
          <div
            className="gf-option-preview"
            key={`${option}-${index}`}
          >
            <span className="gf-radio-dot" />

            {String(option)}
          </div>
        ))}
      </div>
    );
  }

  if (
    field.type === 'select_multiple'
  ) {
    return (
      <div className="gf-options-preview">
        {(options.length
          ? options
          : ['Opción 1', 'Opción 2']
        ).slice(0, 4).map((option, index) => (
          <div
            className="gf-option-preview"
            key={`${option}-${index}`}
          >
            <span className="gf-checkbox-box" />

            {String(option)}
          </div>
        ))}
      </div>
    );
  }

  if (field.type === 'boolean') {
    return (
      <div className="gf-options-preview">
        <div className="gf-option-preview">
          <span className="gf-radio-dot" />
          Sí
        </div>

        <div className="gf-option-preview">
          <span className="gf-radio-dot" />
          No
        </div>
      </div>
    );
  }

  if (field.type === 'rating') {
    return (
      <div className="gf-rating-preview">
        ☆ ☆ ☆ ☆ ☆
      </div>
    );
  }

  if (field.type === 'range') {
    return (
      <div className="gf-range-preview">
        <span>0</span>
        <div>
          <i />
        </div>
        <span>100</span>
      </div>
    );
  }

  if (
    field.type === 'file' ||
    field.type === 'image'
  ) {
    return (
      <div className="gf-upload-preview">
        {field.type === 'image' ? (
          <FileImageOutlined />
        ) : (
          <FileOutlined />
        )}

        <span>
          {field.type === 'image'
            ? 'Agregar imagen'
            : 'Agregar archivo'}
        </span>
      </div>
    );
  }

  if (field.type === 'signature') {
    return (
      <div className="gf-signature-preview">
        Área para firma digital
      </div>
    );
  }

  if (field.type === 'consent') {
    return (
      <div className="gf-option-preview">
        <span className="gf-checkbox-box" />

        {field.settings?.consentText ||
          'Acepto los términos'}
      </div>
    );
  }

  if (field.type === 'matrix') {
    return (
      <div className="gf-matrix-preview">
        <div />
        <div>Sí</div>
        <div>No</div>

        <strong>Fila 1</strong>
        <span className="gf-radio-dot" />
        <span className="gf-radio-dot" />
      </div>
    );
  }

  return null;
}

export default function BuilderFieldCard({
  field,
  selected,
  onSelect,
  onDuplicate,
  onDelete,
}: {
  field: FormField;
  selected: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: field.id!,
  });

  return (
    <div
      ref={setNodeRef}
      data-field-id={field.id}
      style={{
        transform:
          CSS.Transform.toString(transform),
        transition,
      }}
      className={`gf-question-card ${
        selected ? 'selected' : ''
      } ${isDragging ? 'dragging' : ''}`}
      onClick={onSelect}
    >
      <button
        type="button"
        className="gf-question-drag"
        {...attributes}
        {...listeners}
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <HolderOutlined />
      </button>

      <div className="gf-question-body">
        <div className="gf-question-heading">
          <div>
            <div className="gf-question-title">
              {field.label || 'Pregunta sin título'}

              {field.required && (
                <span className="gf-required">
                  *
                </span>
              )}
            </div>

            {field.description && (
              <div className="gf-question-description">
                {field.description}
              </div>
            )}
          </div>

          <div className="gf-question-type">
            <FieldTypeIcon type={field.type} />

            <span>
              {typeNames[field.type]}
            </span>
          </div>
        </div>

        <FieldPreview field={field} />
      </div>

      {selected && (
        <div className="gf-question-footer">
          <Button
            type="text"
            icon={<CopyOutlined />}
            onClick={(event) => {
              event.stopPropagation();
              onDuplicate();
            }}
          >
            Duplicar
          </Button>

          <div className="gf-question-footer-divider" />

          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
          >
            Eliminar
          </Button>
        </div>
      )}
    </div>
  );
}