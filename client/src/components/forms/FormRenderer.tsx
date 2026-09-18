import {
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Radio,
  Rate,
  Slider,
  TimePicker,
} from 'antd';

import dayjs from 'dayjs';

import type {
  DynamicForm,
  FormField,
} from '../../types';

import SignatureField from './SignatureField';
import UploadField from './UploadField';

type FormValues = Record<string, any>;

function shouldShow(
  field: FormField,
  values: FormValues,
) {
  const condition =
    field.conditional_logic as any;

  if (!condition?.showWhen?.fieldId) {
    return true;
  }

  const current =
    values[condition.showWhen.fieldId];

  const expected =
    condition.showWhen.value;

  switch (condition.showWhen.operator) {
    case 'not_equals':
      return current !== expected;

    case 'equals':
    default:
      return current === expected;
  }
}

function normalizeOptions(field: FormField) {
  if (!Array.isArray(field.options)) {
    return [];
  }

  return field.options.map(
    (option: any) => {
      if (typeof option === 'string') {
        return {
          label: option,
          value: option,
        };
      }

      return {
        label:
          option.label ??
          option.value ??
          '',
        value:
          option.value ??
          option.label ??
          '',
      };
    },
  );
}

function validateEmail(value: string) {
  if (!value) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value,
  );
}

function validatePhone(value: string) {
  if (!value) {
    return true;
  }

  const digits = value.replace(/\D/g, '');

  return digits.length >= 10;
}

function getFieldRules(field: FormField) {
  const validation =
    field.validation ?? {};

  const rules: any[] = [];

  if (field.required) {
    rules.push({
      required: true,
      message:
        'Este campo es obligatorio.',
    });
  }

  if (field.type === 'email') {
    rules.push({
      validator: async (
        _: any,
        value: string,
      ) => {
        if (!value || validateEmail(value)) {
          return;
        }

        throw new Error(
          'Escribe un correo válido, por ejemplo usuario@dominio.com',
        );
      },
    });
  }

  if (field.type === 'phone') {
    rules.push({
      validator: async (
        _: any,
        value: string,
      ) => {
        if (!value || validatePhone(value)) {
          return;
        }

        throw new Error(
          'Escribe un número telefónico válido de al menos 10 dígitos.',
        );
      },
    });
  }

  if (
    ['text', 'textarea'].includes(
      field.type,
    )
  ) {
    if (
      validation.minLength !==
      undefined &&
      validation.minLength !== null
    ) {
      rules.push({
        min: Number(
          validation.minLength,
        ),
        message: `Debe contener al menos ${validation.minLength} caracteres.`,
      });
    }

    if (
      validation.maxLength !==
      undefined &&
      validation.maxLength !== null
    ) {
      rules.push({
        max: Number(
          validation.maxLength,
        ),
        message: `No puede superar ${validation.maxLength} caracteres.`,
      });
    }
  }

  return rules;
}

export default function FormRenderer({
  form,
  fields,
  values,
  onChange,
  disabled = false,
}: {
  form: DynamicForm;
  fields: FormField[];
  values: FormValues;
  onChange: (
    id: string,
    value: any,
  ) => void;
  disabled?: boolean;
}) {
  return (
    <div className="google-form-renderer">
      {fields
        .filter((field) =>
          shouldShow(field, values),
        )
        .map((field) => {
          const id = field.id!;

          if (field.type === 'section') {
            return (
              <div
                className="gf-runtime-section"
                key={id}
              >
                <h3>{field.label}</h3>

                {field.description && (
                  <p>
                    {field.description}
                  </p>
                )}
              </div>
            );
          }

          if (field.type === 'note') {
            return (
              <div
                className="gf-runtime-note"
                key={id}
              >
                <strong>
                  {field.label}
                </strong>

                {field.description && (
                  <p>
                    {field.description}
                  </p>
                )}
              </div>
            );
          }

          const validation =
            field.validation ?? {};

          const options =
            normalizeOptions(field);

          let control: React.ReactNode =
            null;

          switch (field.type) {
            case 'text':
              control = (
                <Input
                  disabled={disabled}
                  value={values[id] ?? ''}
                  placeholder="Tu respuesta"
                  maxLength={
                    validation.maxLength
                  }
                  onChange={(event) =>
                    onChange(
                      id,
                      event.target.value,
                    )
                  }
                />
              );
              break;

            case 'textarea':
              control = (
                <Input.TextArea
                  disabled={disabled}
                  value={values[id] ?? ''}
                  placeholder="Tu respuesta"
                  maxLength={
                    validation.maxLength
                  }
                  autoSize={{
                    minRows: 2,
                    maxRows: 8,
                  }}
                  onChange={(event) =>
                    onChange(
                      id,
                      event.target.value,
                    )
                  }
                />
              );
              break;

            case 'number':
              control = (
                <InputNumber
                  disabled={disabled}
                  value={values[id]}
                  min={validation.min}
                  max={validation.max}
                  precision={0}
                  controls={false}
                  placeholder="Escribe un número"
                  parser={(value) => {
                    const clean =
                      String(value ?? '')
                        .replace(
                          /[^\d-]/g,
                          '',
                        );

                    return clean as any;
                  }}
                  onChange={(value) =>
                    onChange(id, value)
                  }
                />
              );
              break;

            case 'decimal':
              control = (
                <InputNumber
                  disabled={disabled}
                  value={values[id]}
                  min={validation.min}
                  max={validation.max}
                  step={0.01}
                  controls={false}
                  decimalSeparator="."
                  placeholder="Ej. 15.50"
                  parser={(value) => {
                    const clean =
                      String(value ?? '')
                        .replace(',', '.')
                        .replace(
                          /[^\d.-]/g,
                          '',
                        );

                    return clean as any;
                  }}
                  onChange={(value) =>
                    onChange(id, value)
                  }
                />
              );
              break;

            case 'email':
              control = (
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  disabled={disabled}
                  value={values[id] ?? ''}
                  placeholder="usuario@dominio.com"
                  onChange={(event) =>
                    onChange(
                      id,
                      event.target.value,
                    )
                  }
                />
              );
              break;

            case 'phone':
              control = (
                <Input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  disabled={disabled}
                  value={values[id] ?? ''}
                  maxLength={15}
                  placeholder="Ej. 6681234567"
                  onChange={(event) => {
                    const clean =
                      event.target.value.replace(
                        /\D/g,
                        '',
                      );

                    onChange(id, clean);
                  }}
                />
              );
              break;

            case 'date':
              control = (
                <DatePicker
                  disabled={disabled}
                  format="DD/MM/YYYY"
                  placeholder="Seleccionar fecha"
                  value={
                    values[id]
                      ? dayjs(values[id])
                      : null
                  }
                  onChange={(date) =>
                    onChange(
                      id,
                      date
                        ? date.format(
                            'YYYY-MM-DD',
                          )
                        : null,
                    )
                  }
                />
              );
              break;

            case 'time':
              control = (
                <TimePicker
                  disabled={disabled}
                  format="HH:mm"
                  placeholder="Seleccionar hora"
                  value={
                    values[id]
                      ? dayjs(
                          values[id],
                          'HH:mm',
                        )
                      : null
                  }
                  onChange={(time) =>
                    onChange(
                      id,
                      time
                        ? time.format(
                            'HH:mm',
                          )
                        : null,
                    )
                  }
                />
              );
              break;

            case 'datetime':
              control = (
                <DatePicker
                  showTime
                  disabled={disabled}
                  format="DD/MM/YYYY HH:mm"
                  placeholder="Seleccionar fecha y hora"
                  value={
                    values[id]
                      ? dayjs(values[id])
                      : null
                  }
                  onChange={(date) =>
                    onChange(
                      id,
                      date
                        ? date.toISOString()
                        : null,
                    )
                  }
                />
              );
              break;

            case 'select_one':
              control = (
                <Radio.Group
                  disabled={disabled}
                  value={values[id]}
                  className="gf-radio-group"
                  onChange={(event) =>
                    onChange(
                      id,
                      event.target.value,
                    )
                  }
                >
                  {options.map(
                    (option) => (
                      <Radio
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {option.label}
                      </Radio>
                    ),
                  )}
                </Radio.Group>
              );
              break;

            case 'select_multiple':
              control = (
                <Checkbox.Group
                  disabled={disabled}
                  value={
                    Array.isArray(
                      values[id],
                    )
                      ? values[id]
                      : []
                  }
                  className="gf-checkbox-group"
                  onChange={(selected) =>
                    onChange(
                      id,
                      selected,
                    )
                  }
                >
                  {options.map(
                    (option) => (
                      <Checkbox
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {option.label}
                      </Checkbox>
                    ),
                  )}
                </Checkbox.Group>
              );
              break;

            case 'boolean':
              control = (
                <Radio.Group
                  disabled={disabled}
                  value={values[id]}
                  className="gf-radio-group"
                  onChange={(event) =>
                    onChange(
                      id,
                      event.target.value,
                    )
                  }
                >
                  <Radio value={true}>
                    Sí
                  </Radio>

                  <Radio value={false}>
                    No
                  </Radio>
                </Radio.Group>
              );
              break;

            case 'rating':
              control = (
                <Rate
                  disabled={disabled}
                  value={
                    Number(
                      values[id],
                    ) || 0
                  }
                  onChange={(value) =>
                    onChange(id, value)
                  }
                />
              );
              break;

            case 'range':
              control = (
                <div className="gf-real-range">
                  <Slider
                    disabled={disabled}
                    min={
                      Number(
                        validation.min,
                      ) || 0
                    }
                    max={
                      Number(
                        validation.max,
                      ) || 100
                    }
                    value={
                      values[id] ??
                      Number(
                        validation.min,
                      ) ??
                      0
                    }
                    onChange={(value) =>
                      onChange(
                        id,
                        value,
                      )
                    }
                  />

                  <span>
                    {values[id] ??
                      validation.min ??
                      0}
                  </span>
                </div>
              );
              break;

            case 'consent':
              control = (
                <Checkbox
                  disabled={disabled}
                  checked={
                    Boolean(values[id])
                  }
                  onChange={(event) =>
                    onChange(
                      id,
                      event.target.checked,
                    )
                  }
                >
                  {field.settings
                    ?.consentText ??
                    'Acepto'}
                </Checkbox>
              );
              break;

            case 'file':
              control = (
                <UploadField
                  formId={form.id}
                  value={values[id]}
                  onChange={(value) =>
                    onChange(id, value)
                  }
                />
              );
              break;

            case 'image':
              control = (
                <UploadField
                  formId={form.id}
                  imageOnly
                  value={values[id]}
                  onChange={(value) =>
                    onChange(id, value)
                  }
                />
              );
              break;

            case 'signature':
              control = (
                <SignatureField
                  value={values[id]}
                  onChange={(value) =>
                    onChange(id, value)
                  }
                />
              );
              break;

            case 'matrix': {
              const matrixOptions =
                field.options as any;

              const rows =
                matrixOptions?.rows ?? [];

              const columns =
                matrixOptions?.columns ??
                [];

              control = (
                <div className="gf-runtime-matrix">
                  <div
                    className="gf-matrix-header"
                    style={{
                      gridTemplateColumns:
                        `minmax(160px, 1fr) repeat(${columns.length}, 80px)`,
                    }}
                  >
                    <span />

                    {columns.map(
                      (
                        column: string,
                      ) => (
                        <strong
                          key={column}
                        >
                          {column}
                        </strong>
                      ),
                    )}
                  </div>

                  {rows.map(
                    (row: string) => (
                      <div
                        className="gf-matrix-row"
                        key={row}
                        style={{
                          gridTemplateColumns:
                            `minmax(160px, 1fr) repeat(${columns.length}, 80px)`,
                        }}
                      >
                        <span>{row}</span>

                        {columns.map(
                          (
                            column: string,
                          ) => (
                            <Radio
                              key={
                                column
                              }
                              disabled={
                                disabled
                              }
                              checked={
                                values[
                                  id
                                ]?.[
                                  row
                                ] ===
                                column
                              }
                              onChange={() =>
                                onChange(
                                  id,
                                  {
                                    ...(
                                      values[
                                        id
                                      ] ??
                                      {}
                                    ),
                                    [row]:
                                      column,
                                  },
                                )
                              }
                            />
                          ),
                        )}
                      </div>
                    ),
                  )}
                </div>
              );

              break;
            }

            default:
              control = null;
          }

          return (
            <div
              className="gf-runtime-question"
              key={id}
            >
              <div className="gf-runtime-question-title">
                {field.label}

                {field.required && (
                  <span>*</span>
                )}
              </div>

              {field.description && (
                <div className="gf-runtime-question-help">
                  {field.description}
                </div>
              )}

              <Form.Item
                name={id}
                rules={getFieldRules(
                  field,
                )}
                required={false}
                validateTrigger={[
                  'onBlur',
                  'onChange',
                ]}
              >
                {control}
              </Form.Item>
            </div>
          );
        })}
    </div>
  );
}