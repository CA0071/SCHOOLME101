import { z } from "zod";
export const emptySchema = {};
export const gradeAndSubjectSchema = {
    grade: z.string().min(1),
    subject: z.string().min(1)
};
