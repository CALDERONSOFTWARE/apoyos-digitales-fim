import {
  DndContext,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';

import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import {
  App,
  Button,
  Checkbox,
  Input,
  InputNumber,
  Select,
  Switch,
  Typography,
} from 'antd';

import {
  CalendarOutlined,
  CheckSquareOutlined,
  EyeOutlined,
  FileImageOutlined,
  FileOutlined,
  FontSizeOutlined,
  NumberOutlined,
  PlusOutlined,
  SaveOutlined,
  SendOutlined,
  StarOutlined,
} from '@ant-design/icons';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  useParams,
} from 'react-router-dom';

import { api } from '../../services/api';

import type {
  DynamicForm,
  FieldType,
  FormField,
} from '../../types';

import BuilderFieldCard from '../../components/forms/BuilderFieldCard';
import FormTabs from '../../components/forms/FormTabs';

type FieldDefinition = {
  type: FieldType;
  label: string;
  icon: React.ReactNode;
};

const fieldGroups: {
  title: string;
  fields: FieldDefinition[];
}[] = [
  {
    title: 'Texto',
    fields: [
      {
        type: 'text',
        label: 'Texto corto',
        icon: <FontSizeOutlined />,
      },
      {
        type: 'textarea',
        label: 'Texto largo',
        icon: <FontSizeOutlined />,
      },
      {
        type: 'email',
        label: 'Correo',
        icon: <FontSizeOutlined />,
      },
      {
        type: 'phone',
        label: 'Teléfono',
        icon: <FontSizeOutlined />,
      },
    ],
  },

  {
    title: 'Selección',
    fields: [
      {
        type: 'select_one',
        label: 'Opción única',
        icon: <CheckSquareOutlined />,
      },
      {
        type: 'select_multiple',
        label: 'Varias opciones',
        icon: <CheckSquareOutlined />,
      },
      {
        type: 'boolean',
        label: 'Sí / No',
        icon: <CheckSquareOutlined />,
      },
      {
        type: 'rating',
        label: 'Calificación',
        icon: <StarOutlined />,
      },
    ],
  },

  {
    title: 'Datos',
    fields: [
      {
        type: 'number',
        label: 'Número',
        icon: <NumberOutlined />,
      },
      {
        type: 'decimal',
        label: 'Decimal',
        icon: <NumberOutlined />,
      },
      {
        type: 'range',
        label: 'Rango',
        icon: <NumberOutlined />,
      },
      {
        type: 'date',
        label: 'Fecha',
        icon: <CalendarOutlined />,
      },
      {
        type: 'time',
        label: 'Hora',
        icon: <CalendarOutlined />,
      },
      {
        type: 'datetime',
        label: 'Fecha y hora',
        icon: <CalendarOutlined />,
      },
    ],
  },

  {
    title: 'Archivos',
    fields: [
      {
        type: 'file',
        label: 'Archivo',
        icon: <FileOutlined />,
      },
      {
        type: 'image',
        label: 'Imagen',
        icon: <FileImageOutlined />,
      },
      {
        type: 'signature',
        label: 'Firma digital',
        icon: <FileOutlined />,
      },
    ],
  },

  {
    title: 'Estructura',
    fields: [
      {
        type: 'section',
        label: 'Sección',
        icon: <FontSizeOutlined />,
      },
      {
        type: 'note',
        label: 'Nota',
        icon: <FontSizeOutlined />,
      },
      {
        type: 'consent',
        label: 'Consentimiento',
        icon: <CheckSquareOutlined />,
      },
      {
        type: 'matrix',
        label: 'Matriz',
        icon: <CheckSquareOutlined />,
      },
    ],
  },
];

const flatTypes = fieldGroups.flatMap(
  (group) => group.fields,
);

const newField = (
  type: FieldType,
  label: string,
): FormField => ({
  id: `tmp-${crypto.randomUUID()}`,
  type,
  label:
    type === 'section'
      ? 'Nueva sección'
      : type === 'note'
        ? 'Nota informativa'
        : 'Pregunta sin título',

  description: '',

  required: false,

  position: 0,

  options:
    type === 'select_one' ||
    type === 'select_multiple'
      ? ['Opción 1', 'Opción 2']
      : type === 'matrix'
        ? {
            rows: ['Fila 1', 'Fila 2'],
            columns: ['Sí', 'No'],
          }
        : [],

  validation: {},
  conditional_logic: {},

  settings:
    type === 'consent'
      ? {
          consentText:
            'Acepto que la información proporcionada es correcta',
        }
      : {},
});

export default function FormBuilderPage() {
  const { id } = useParams();

  const { message } = App.useApp();

  const [form, setForm] =
    useState<DynamicForm>();

  const [fields, setFields] = useState<
    FormField[]
  >([]);

  const [selected, setSelected] =
    useState<string>();

  const [saving, setSaving] =
    useState(false);

  const [publishing, setPublishing] =
    useState(false);

  const workspaceRef =
    useRef<HTMLDivElement>(null);

  const settingsRef =
    useRef<HTMLElement>(null);

  const selectedField = useMemo(
    () =>
      fields.find(
        (field) => field.id === selected,
      ),
    [fields, selected],
  );

  useEffect(() => {
    if (
      !selected ||
      !workspaceRef.current ||
      !settingsRef.current
    ) {
      return;
    }

    const selectedCard =
      workspaceRef.current.querySelector<HTMLElement>(
        `[data-field-id="${selected}"]`,
      );

    if (!selectedCard) {
      return;
    }

    /*
     * 1. Posicionar el panel de configuración
     *    exactamente a la altura de la pregunta.
     */
    const workspaceRect =
      workspaceRef.current.getBoundingClientRect();

    const cardRect =
      selectedCard.getBoundingClientRect();

    const relativeTop =
      cardRect.top - workspaceRect.top;

    settingsRef.current.style.transform =
      `translateY(${Math.max(0, relativeTop)}px)`;

    /*
     * 2. Después de mover el editor, reposicionar
     *    el scroll para llevar la pregunta seleccionada
     *    a la parte superior visible de la página.
     */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const updatedCardRect =
          selectedCard.getBoundingClientRect();

        /*
         * Ajusta este valor si quieres más o menos
         * espacio debajo del header.
         */
        const HEADER_OFFSET = 92;

        const targetScrollY =
          window.scrollY +
          updatedCardRect.top -
          HEADER_OFFSET;

        window.scrollTo({
          top: Math.max(0, targetScrollY),
          behavior: 'smooth',
        });
      });
    });
  }, [selected]);

  useEffect(() => {
    if (!id) {
      return;
    }

    api
      .get<DynamicForm>(`/forms/${id}`)
      .then((loaded) => {
        setForm(loaded);

        setFields(
          (loaded.fields ?? []).map(
            (field) => ({
              ...field,
              id: field.id!,
            }),
          ),
        );
      })
      .catch((error) => {
        message.error(
          error instanceof Error
            ? error.message
            : 'No se pudo cargar el formulario',
        );
      });
  }, [id]);

  if (!id || !form) {
    return (
      <div className="gf-builder-loading">
        Cargando constructor...
      </div>
    );
  }

  const addField = (
    type: FieldType,
    label: string,
  ) => {
    const field = newField(type, label);

    setFields((current) => [
      ...current,
      {
        ...field,
        position: current.length,
      },
    ]);

    setSelected(field.id);
  };

  const updateSelected = (
    patch: Partial<FormField>,
  ) => {
    setFields((current) =>
      current.map((field) =>
        field.id === selected
          ? {
              ...field,
              ...patch,
            }
          : field,
      ),
    );
  };

  const duplicateField = (
    field: FormField,
  ) => {
    setFields((current) => {
      const sourceIndex =
        current.findIndex(
          (item) => item.id === field.id,
        );

      const copy: FormField = {
        ...field,

        id: `tmp-${crypto.randomUUID()}`,

        label: `${field.label} (copia)`,

        options: structuredClone(
          field.options ?? [],
        ),

        validation: {
          ...(field.validation ?? {}),
        },

        conditional_logic: {
          ...(field.conditional_logic ?? {}),
        },

        settings: {
          ...(field.settings ?? {}),
        },
      };

      const next = [...current];

      next.splice(sourceIndex + 1, 0, copy);

      return next.map(
        (item, position) => ({
          ...item,
          position,
        }),
      );
    });
  };

  const deleteField = (
    field: FormField,
  ) => {
    setFields((current) =>
      current
        .filter(
          (item) =>
            item.id !== field.id,
        )
        .map((item, position) => ({
          ...item,
          position,
        })),
    );

    if (selected === field.id) {
      setSelected(undefined);
    }
  };

  const drag = (
    event: DragEndEvent,
  ) => {
    if (
      !event.over ||
      event.active.id === event.over.id
    ) {
      return;
    }

    setFields((current) => {
      const oldIndex =
        current.findIndex(
          (field) =>
            field.id === event.active.id,
        );

      const newIndex =
        current.findIndex(
          (field) =>
            field.id === event.over!.id,
        );

      return arrayMove(
        current,
        oldIndex,
        newIndex,
      ).map((field, position) => ({
        ...field,
        position,
      }));
    });
  };

  const save = async (
    showMessage = true,
  ) => {
    try {
      setSaving(true);

      await api.put(`/forms/${id}`, {
        title: form.title,
        description: form.description,
        status: form.status,
        settings: form.settings ?? {},
      });

      const saved =
        await api.put<FormField[]>(
          `/forms/${id}/fields`,
          {
            fields: fields.map(
              ({
                form_id,
                ...field
              }) => field,
            ),
          },
        );

      setFields(saved);

      if (
        selected?.startsWith('tmp-')
      ) {
        setSelected(undefined);
      }

      if (showMessage) {
        message.success(
          'Cambios guardados',
        );
      }

      return true;
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar',
      );

      return false;
    } finally {
      setSaving(false);
    }
  };

  const preview = async () => {
    const saved = await save(false);

    if (!saved) {
      return;
    }

    window.open(
      `/forms/${id}?preview=1`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  const publish = async () => {
    try {
      setPublishing(true);

      const saved = await save(false);

      if (!saved) {
        return;
      }

      const nextStatus =
        form.status === 'published'
          ? 'draft'
          : 'published';

      const updated =
        await api.put<DynamicForm>(
          `/forms/${id}`,
          {
            title: form.title,
            description:
              form.description,
            status: nextStatus,
            settings:
              form.settings ?? {},
          },
        );

      setForm(updated);

      message.success(
        nextStatus === 'published'
          ? 'Formulario publicado'
          : 'Formulario pasado a borrador',
      );
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : 'No se pudo cambiar el estado',
      );
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="gf-builder-page">
      <div className="gf-builder-header">
        <div className="gf-builder-heading">
          <div className="gf-builder-status-row">
            <span
              className={`gf-status-dot ${
                form.status === 'published'
                  ? 'published'
                  : ''
              }`}
            />

            {form.status === 'published'
              ? 'Publicado'
              : 'Borrador'}
          </div>

          <Typography.Title level={3}>
            {form.title}
          </Typography.Title>

          <Typography.Text>
            Constructor de formulario
          </Typography.Text>
        </div>

        <div className="gf-builder-actions">
          <Button
            icon={<EyeOutlined />}
            onClick={() =>
              void preview()
            }
          >
            Vista previa
          </Button>

          <Button
            icon={<SaveOutlined />}
            loading={saving}
            onClick={() =>
              void save()
            }
          >
            Guardar
          </Button>

          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={publishing}
            onClick={() =>
              void publish()
            }
          >
            {form.status ===
            'published'
              ? 'Despublicar'
              : 'Publicar'}
          </Button>
        </div>
      </div>

      <FormTabs formId={id} />

      <div
        className="gf-builder-workspace"
        ref={workspaceRef}
      >
        <aside className="gf-builder-palette">
          <div className="gf-panel-heading">
            <div>
              <strong>Agregar campo</strong>
              <span>
                Selecciona un tipo
              </span>
            </div>
          </div>

          <div className="gf-palette-scroll">
            {fieldGroups.map(
              (group) => (
                <div
                  className="gf-palette-group"
                  key={group.title}
                >
                  <div className="gf-palette-group-title">
                    {group.title}
                  </div>

                  {group.fields.map(
                    (item) => (
                      <button
                        type="button"
                        className="gf-palette-item"
                        key={item.type}
                        onClick={() =>
                          addField(
                            item.type,
                            item.label,
                          )
                        }
                      >
                        <span className="gf-palette-icon">
                          {item.icon}
                        </span>

                        <span>
                          {item.label}
                        </span>

                        <PlusOutlined className="gf-palette-plus" />
                      </button>
                    ),
                  )}
                </div>
              ),
            )}
          </div>
        </aside>

        <main className="gf-builder-canvas">
          <div className="gf-form-cover">
            <div className="gf-form-cover-bar" />

            <Input
              className="gf-form-title-input"
              value={form.title}
              placeholder="Título del formulario"
              onChange={(event) =>
                setForm({
                  ...form,
                  title:
                    event.target.value,
                })
              }
            />

            <Input.TextArea
              autoSize={{
                minRows: 1,
                maxRows: 4,
              }}
              className="gf-form-description-input"
              value={form.description}
              placeholder="Descripción del formulario"
              onChange={(event) =>
                setForm({
                  ...form,
                  description:
                    event.target.value,
                })
              }
            />
          </div>

          <DndContext
            collisionDetection={
              closestCenter
            }
            onDragEnd={drag}
          >
            <SortableContext
              items={fields.map(
                (field) => field.id!,
              )}
              strategy={
                verticalListSortingStrategy
              }
            >
              <div className="gf-fields-list">
                {fields.map(
                  (field) => (
                    <BuilderFieldCard
                      key={field.id}
                      field={field}
                      selected={
                        selected === field.id
                      }
                      onSelect={() =>
                        setSelected(
                          field.id,
                        )
                      }
                      onDuplicate={() =>
                        duplicateField(
                          field,
                        )
                      }
                      onDelete={() =>
                        deleteField(
                          field,
                        )
                      }
                    />
                  ),
                )}
              </div>
            </SortableContext>
          </DndContext>

          {!fields.length && (
            <button
              type="button"
              className="gf-empty-form"
              onClick={() =>
                addField(
                  'text',
                  'Texto corto',
                )
              }
            >
              <PlusOutlined />

              <strong>
                Agrega tu primera
                pregunta
              </strong>

              <span>
                Selecciona un tipo de
                campo o haz clic aquí.
              </span>
            </button>
          )}
        </main>

        <aside
          className="gf-builder-settings"
          ref={settingsRef}
        >
          <div className="gf-panel-heading">
            <div>
              <strong>
                Configuración
              </strong>

              <span>
                {selectedField
                  ? 'Pregunta seleccionada'
                  : 'Selecciona una pregunta'}
              </span>
            </div>
          </div>

          <div className="gf-settings-scroll">
            {selectedField ? (
              <FieldSettings
                field={selectedField}
                all={fields}
                update={updateSelected}
              />
            ) : (
              <div className="gf-settings-empty">
                <div className="gf-settings-empty-icon">
                  <FontSizeOutlined />
                </div>

                <strong>
                  Ningún campo seleccionado
                </strong>

                <span>
                  Selecciona una pregunta
                  del formulario para editar
                  sus propiedades.
                </span>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function FieldSettings({
  field,
  all,
  update,
}: {
  field: FormField;
  all: FormField[];
  update: (
    patch: Partial<FormField>,
  ) => void;
}) {
  const validation =
    field.validation ?? {};

  const conditional =
    (
      field.conditional_logic as any
    )?.showWhen ?? {};

  const isOptions =
    field.type === 'select_one' ||
    field.type ===
      'select_multiple';

  const options: string[] =
    Array.isArray(field.options)
      ? field.options
      : [];

  const updateOption = (
    index: number,
    value: string,
  ) => {
    const next = [...options];

    next[index] = value;

    update({
      options: next,
    });
  };

  const addOption = () => {
    update({
      options: [
        ...options,
        `Opción ${
          options.length + 1
        }`,
      ],
    });
  };

  const removeOption = (
    index: number,
  ) => {
    update({
      options: options.filter(
        (_, itemIndex) =>
          itemIndex !== index,
      ),
    });
  };

  return (
    <div className="gf-settings-form">
      <div className="gf-setting-block">
        <label>
          Pregunta
        </label>

        <Input.TextArea
          autoSize={{
            minRows: 1,
            maxRows: 4,
          }}
          value={field.label}
          onChange={(event) =>
            update({
              label:
                event.target.value,
            })
          }
        />
      </div>

      <div className="gf-setting-block">
        <label>
          Descripción o ayuda
        </label>

        <Input.TextArea
          autoSize={{
            minRows: 2,
            maxRows: 5,
          }}
          value={
            field.description ?? ''
          }
          placeholder="Texto opcional para orientar al usuario"
          onChange={(event) =>
            update({
              description:
                event.target.value,
            })
          }
        />
      </div>

      <div className="gf-setting-block">
        <label>
          Tipo de respuesta
        </label>

        <Select
          value={field.type}
          options={flatTypes.map(
            (item) => ({
              value: item.type,
              label: item.label,
            }),
          )}
          onChange={(
            value: FieldType,
          ) =>
            update({
              type: value,

              options:
                value ===
                  'select_one' ||
                value ===
                  'select_multiple'
                  ? options.length
                    ? options
                    : [
                        'Opción 1',
                        'Opción 2',
                      ]
                  : field.options,
            })
          }
        />
      </div>

      {isOptions && (
        <div className="gf-setting-block">
          <label>
            Opciones
          </label>

          <div className="gf-options-editor">
            {options.map(
              (option, index) => (
                <div
                  className="gf-option-editor-row"
                  key={index}
                >
                  <span
                    className={
                      field.type ===
                      'select_one'
                        ? 'gf-radio-dot'
                        : 'gf-checkbox-box'
                    }
                  />

                  <Input
                    value={option}
                    onChange={(
                      event,
                    ) =>
                      updateOption(
                        index,
                        event.target
                          .value,
                      )
                    }
                  />

                  <Button
                    type="text"
                    danger
                    onClick={() =>
                      removeOption(
                        index,
                      )
                    }
                  >
                    ×
                  </Button>
                </div>
              ),
            )}

            <Button
              type="text"
              icon={<PlusOutlined />}
              onClick={addOption}
            >
              Agregar opción
            </Button>
          </div>
        </div>
      )}

      {field.type ===
        'consent' && (
        <div className="gf-setting-block">
          <label>
            Texto de consentimiento
          </label>

          <Input.TextArea
            value={
              field.settings
                ?.consentText ?? ''
            }
            onChange={(event) =>
              update({
                settings: {
                  ...(field.settings ??
                    {}),
                  consentText:
                    event.target
                      .value,
                },
              })
            }
          />
        </div>
      )}

      <div className="gf-settings-separator" />

      <div className="gf-setting-row">
        <div>
          <strong>
            Obligatoria
          </strong>

          <span>
            El usuario deberá
            responder este campo.
          </span>
        </div>

        <Switch
          checked={field.required}
          disabled={[
            'section',
            'note',
          ].includes(field.type)}
          onChange={(checked) =>
            update({
              required: checked,
            })
          }
        />
      </div>

      <div className="gf-settings-separator" />

      <div className="gf-settings-section-title">
        Validaciones
      </div>

      {[
        'text',
        'textarea',
      ].includes(field.type) && (
        <div className="gf-two-columns">
          <div className="gf-setting-block">
            <label>
              Longitud mínima
            </label>

            <InputNumber
              min={0}
              value={
                validation.minLength
              }
              onChange={(value) =>
                update({
                  validation: {
                    ...validation,
                    minLength: value,
                  },
                })
              }
            />
          </div>

          <div className="gf-setting-block">
            <label>
              Longitud máxima
            </label>

            <InputNumber
              min={0}
              value={
                validation.maxLength
              }
              onChange={(value) =>
                update({
                  validation: {
                    ...validation,
                    maxLength: value,
                  },
                })
              }
            />
          </div>
        </div>
      )}

      {[
        'number',
        'decimal',
        'range',
      ].includes(field.type) && (
        <div className="gf-two-columns">
          <div className="gf-setting-block">
            <label>
              Mínimo
            </label>

            <InputNumber
              value={validation.min}
              onChange={(value) =>
                update({
                  validation: {
                    ...validation,
                    min: value,
                  },
                })
              }
            />
          </div>

          <div className="gf-setting-block">
            <label>
              Máximo
            </label>

            <InputNumber
              value={validation.max}
              onChange={(value) =>
                update({
                  validation: {
                    ...validation,
                    max: value,
                  },
                })
              }
            />
          </div>
        </div>
      )}

      <div className="gf-settings-separator" />

      <div className="gf-settings-section-title">
        Lógica condicional
      </div>

      <div className="gf-setting-block">
        <label>
          Mostrar cuando...
        </label>

        <Select
          allowClear
          placeholder="Siempre visible"
          value={
            conditional.fieldId
          }
          options={all
            .filter(
              (item) =>
                item.id !== field.id,
            )
            .map((item) => ({
              value: item.id,
              label: item.label,
            }))}
          onChange={(value) =>
            update({
              conditional_logic:
                value
                  ? {
                      showWhen: {
                        ...conditional,
                        fieldId:
                          value,
                        operator:
                          'equals',
                      },
                    }
                  : {},
            })
          }
        />
      </div>

      {conditional.fieldId && (
        <>
          <div className="gf-setting-block">
            <label>
              Condición
            </label>

            <Select
              value={
                conditional.operator ??
                'equals'
              }
              options={[
                {
                  value: 'equals',
                  label:
                    'Es igual a',
                },
                {
                  value:
                    'not_equals',
                  label:
                    'No es igual a',
                },
              ]}
              onChange={(value) =>
                update({
                  conditional_logic: {
                    showWhen: {
                      ...conditional,
                      operator:
                        value,
                    },
                  },
                })
              }
            />
          </div>

          <div className="gf-setting-block">
            <label>
              Valor
            </label>

            <Input
              value={
                conditional.value ??
                ''
              }
              onChange={(event) =>
                update({
                  conditional_logic: {
                    showWhen: {
                      ...conditional,
                      value:
                        event.target
                          .value,
                    },
                  },
                })
              }
            />
          </div>
        </>
      )}
    </div>
  );
}