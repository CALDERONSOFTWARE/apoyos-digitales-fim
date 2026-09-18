import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/', async (_req, res, next) => {
  try {
    const [
      { data: forms, error: formsError },
      { data: submissions, error: submissionsError },
    ] = await Promise.all([
      supabaseAdmin
        .from('forms')
        .select('id,title,status'),

      supabaseAdmin
        .from('submissions')
        .select(`
          id,
          folio,
          form_id,
          status,
          validation_status,
          validation_score,
          submitted_at,
          forms(title),
          profiles!submissions_respondent_id_fkey(
            full_name,
            email
          )
        `)
        .order('submitted_at', { ascending: false }),
    ]);

    if (formsError) throw formsError;
    if (submissionsError) throw submissionsError;

    const safeForms = forms ?? [];
    const safeSubmissions = submissions ?? [];

    const byDay = new Map<string, number>();
    const byForm = new Map<string, number>();

    for (const submission of safeSubmissions as any[]) {
      if (submission.submitted_at) {
        const date = submission.submitted_at.slice(0, 10);

        byDay.set(
          date,
          (byDay.get(date) ?? 0) + 1
        );
      }

      const formTitle =
        submission.forms?.title ?? 'Sin formulario';

      byForm.set(
        formTitle,
        (byForm.get(formTitle) ?? 0) + 1
      );
    }

    const validated = safeSubmissions.filter(
      (submission: any) =>
        submission.validation_status === 'validated'
    ).length;

    const pending = safeSubmissions.filter(
      (submission: any) =>
        submission.validation_status === 'pending'
    ).length;

    const rejected = safeSubmissions.filter(
      (submission: any) =>
        submission.validation_status === 'rejected'
    ).length;

    const incomplete = safeSubmissions.filter(
      (submission: any) =>
        submission.validation_status === 'incomplete'
    ).length;

    const observations = rejected + incomplete;

    const validationDistribution = [
      {
        type: 'Validadas',
        value: validated,
      },
      {
        type: 'Pendientes',
        value: pending,
      },
      {
        type: 'Rechazadas',
        value: rejected,
      },
      {
        type: 'Incompletas',
        value: incomplete,
      },
    ].filter(item => item.value > 0);

    const byDayData = [...byDay]
      .map(([date, count]) => ({
        date,
        count,
      }))
      .sort((a, b) =>
        a.date.localeCompare(b.date)
      );

    const byFormData = [...byForm]
      .map(([form, count]) => ({
        form,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    res.json({
      counts: {
        forms: safeForms.length,

        active: safeForms.filter(
          (form: any) =>
            form.status === 'published'
        ).length,

        submissions: safeSubmissions.length,

        pending,

        validated,

        observations,
      },

      validationDistribution,

      recent: safeSubmissions.slice(0, 10),

      byDay: byDayData,

      byForm: byFormData,
    });
  } catch (error) {
    next(error);
  }
});

export default router;