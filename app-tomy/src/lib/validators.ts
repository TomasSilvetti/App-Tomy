import { z } from "zod";

export const repeatUnitSchema = z.enum(["days", "weeks", "months"]);

export const preguntaSchema = z
  .object({
    title: z.string().trim().min(1, "El título es obligatorio").max(200, "Máximo 200 caracteres"),
    reminderEnabled: z.boolean(),
    reminderStartAt: z.string().datetime().nullable().optional(),
    repeatEveryN: z.number().int().positive().nullable().optional(),
    repeatUnit: repeatUnitSchema.nullable().optional(),
    repeatCount: z.number().int().positive().max(365).nullable().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.reminderEnabled) {
      if (!val.reminderStartAt) {
        ctx.addIssue({
          code: "custom",
          path: ["reminderStartAt"],
          message: "La fecha y hora de inicio es obligatoria",
        });
      }
      if (!val.repeatEveryN || val.repeatEveryN < 1) {
        ctx.addIssue({
          code: "custom",
          path: ["repeatEveryN"],
          message: "El período de repetición es obligatorio",
        });
      }
      if (!val.repeatUnit) {
        ctx.addIssue({
          code: "custom",
          path: ["repeatUnit"],
          message: "La unidad de repetición es obligatoria",
        });
      }
      if (!val.repeatCount || val.repeatCount < 1) {
        ctx.addIssue({
          code: "custom",
          path: ["repeatCount"],
          message: "La cantidad de repeticiones es obligatoria",
        });
      }
    }
  });

export type PreguntaInput = z.infer<typeof preguntaSchema>;

export const respuestaSchema = z.object({
  text: z.string().trim().min(1, "La respuesta no puede estar vacía").max(5000),
});

export type RespuestaInput = z.infer<typeof respuestaSchema>;

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});
