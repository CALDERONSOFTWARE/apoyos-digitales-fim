import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import {
  requireAdmin,
  requireAuth,
} from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/', async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('submission_answers')
      .select(`
        id,
        value,
        created_at,
        submission_id,
        form_fields(
          id,
          label,
          type
        ),
        submissions(
          id,
          folio,
          submitted_at,
          form_id,
          forms(
            id,
            title
          ),
          profiles!submissions_respondent_id_fkey(
            full_name,
            email
          )
        )
      `)
      .order('created_at', {
        ascending: false,
      });

    if (error) throw error;

    const files: any[] = [];

    for (const answer of data ?? []) {
      const item: any = answer;

      const value = item.value;

      if (
        !value ||
        typeof value !== 'object' ||
        Array.isArray(value) ||
        !value.path
      ) {
        continue;
      }

      const fieldType =
        item.form_fields?.type ?? '';

      const mime =
        value.mime ??
        value.type ??
        '';

      const name =
        value.name ??
        value.fileName ??
        (
          fieldType === 'signature'
            ? 'Firma digital.png'
            : 'Archivo'
        );

      let category = 'document';

      if (fieldType === 'signature') {
        category = 'signature';
      } else if (
        String(mime).startsWith('image/')
      ) {
        category = 'image';
      }

      let preview: string | null = null;

      const { data: signedData } =
        await supabaseAdmin.storage
          .from('form-uploads')
          .createSignedUrl(
            value.path,
            60 * 60
          );

      if (signedData?.signedUrl) {
        preview = signedData.signedUrl;
      }

      files.push({
        id: item.id,

        submission_id:
          item.submission_id,

        folio:
          item.submissions?.folio ?? '—',

        submitted_at:
          item.submissions?.submitted_at ??
          item.created_at,

        form_id:
          item.submissions?.form_id ?? null,

        form_title:
          item.submissions?.forms?.title ??
          'Sin formulario',

        respondent:
          item.submissions?.profiles?.full_name ??
          item.submissions?.profiles?.email ??
          'Sin usuario',

        field_label:
          item.form_fields?.label ??
          'Archivo adjunto',

        field_type: fieldType,

        name,

        path: value.path,

        mime,

        size:
          value.size ??
          value.fileSize ??
          null,

        category,

        preview,
      });
    }

    const counts = {
      total: files.length,

      images: files.filter(
        file => file.category === 'image'
      ).length,

      documents: files.filter(
        file => file.category === 'document'
      ).length,

      signatures: files.filter(
        file => file.category === 'signature'
      ).length,

      forms: new Set(
        files
          .map(file => file.form_id)
          .filter(Boolean)
      ).size,
    };

    res.json({
      counts,
      files,
    });
  } catch (error) {
    next(error);
  }
});

export default router;