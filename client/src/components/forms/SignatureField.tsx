import {
  Button,
} from 'antd';

import {
  CheckCircleOutlined,
  ClearOutlined,
  EditOutlined,
  RedoOutlined,
  SaveOutlined,
} from '@ant-design/icons';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import SignatureCanvas from 'react-signature-canvas';

export default function SignatureField({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (
    value: string,
  ) => void;
}) {
  const signatureRef =
    useRef<SignatureCanvas>(
      null,
    );

  const containerRef =
    useRef<HTMLDivElement>(
      null,
    );

  const [canvasWidth, setCanvasWidth] =
    useState(650);

  const [editing, setEditing] =
    useState(!value);

  useEffect(() => {
    const updateWidth = () => {
      const width =
        containerRef.current
          ?.clientWidth;

      if (width) {
        setCanvasWidth(
          Math.max(
            280,
            width,
          ),
        );
      }
    };

    updateWidth();

    window.addEventListener(
      'resize',
      updateWidth,
    );

    return () => {
      window.removeEventListener(
        'resize',
        updateWidth,
      );
    };
  }, []);

  const clearSignature = () => {
    signatureRef.current?.clear();

    onChange?.('');
  };

  const saveSignature = () => {
    const signature =
      signatureRef.current;

    if (
      !signature ||
      signature.isEmpty()
    ) {
      return;
    }

    const dataUrl =
      signature
        .getTrimmedCanvas()
        .toDataURL(
          'image/png',
        );

    onChange?.(dataUrl);

    setEditing(false);
  };

  const editSignature = () => {
    onChange?.('');

    setEditing(true);

    requestAnimationFrame(
      () => {
        signatureRef.current?.clear();
      },
    );
  };

  return (
    <div className="signature-field">
      {!editing && value ? (
        <div className="signature-saved-card">
          <div className="signature-saved-header">
            <div>
              <CheckCircleOutlined />

              <span>
                Firma guardada
              </span>
            </div>

            <Button
              type="text"
              icon={
                <RedoOutlined />
              }
              onClick={
                editSignature
              }
            >
              Volver a firmar
            </Button>
          </div>

          <div className="signature-saved-preview">
            <img
              src={value}
              alt="Firma digital"
            />
          </div>
        </div>
      ) : (
        <>
          <div
            ref={containerRef}
            className="signature-pad-shell"
          >
            <div className="signature-pad-header">
              <div className="signature-pad-icon">
                <EditOutlined />
              </div>

              <div>
                <strong>
                  Firma dentro del área
                </strong>

                <span>
                  Usa el mouse, touchpad o pantalla táctil.
                </span>
              </div>
            </div>

            <div className="signature-pad-area">
              <SignatureCanvas
                ref={
                  signatureRef
                }
                penColor="#17364a"
                minWidth={1}
                maxWidth={2.5}
                velocityFilterWeight={
                  0.7
                }
                canvasProps={{
                  width:
                    canvasWidth,
                  height: 190,
                  className:
                    'signature-canvas',
                }}
              />

              <div className="signature-guide">
                <span>
                  Firma aquí
                </span>
              </div>
            </div>
          </div>

          <div className="signature-actions">
            <Button
              icon={
                <ClearOutlined />
              }
              onClick={
                clearSignature
              }
            >
              Limpiar
            </Button>

            <Button
              type="primary"
              icon={
                <SaveOutlined />
              }
              onClick={
                saveSignature
              }
              className="signature-save-button"
            >
              Guardar firma
            </Button>
          </div>
        </>
      )}
    </div>
  );
}