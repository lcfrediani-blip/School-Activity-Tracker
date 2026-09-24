import { Router } from "express";
import { randomBytes, randomUUID } from "node:crypto";
import { and, asc, count, eq, ilike, inArray, sql } from "drizzle-orm";
import { clerkClient } from "@clerk/express";
import {
  accountProfiles,
  activities,
  classes,
  db,
  institutions,
} from "@workspace/db";
import {
  CreateAccountProfileBody,
  CreateTeacherClassBody,
  GetTeacherStudentParams,
  SearchTeacherStudentsQueryParams,
  SyncStudentDataBody,
} from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";

const router = Router();
const profileResponse = (profile: typeof accountProfiles.$inferSelect, institution: typeof institutions.$inferSelect, classRow?: typeof classes.$inferSelect | null) => ({
  id: profile.id,
  clerkUserId: profile.clerkUserId,
  role: profile.role,
  name: profile.name,
  email: profile.email,
  institutionId: institution.id,
  institutionName: institution.name,
  classId: classRow?.id ?? null,
  className: classRow?.name ?? null,
  teacherCode: profile.role === "teacher" ? institution.teacherCode : null,
});
const code = (prefix: string) => `${prefix}-${randomBytes(5).toString("hex").toUpperCase()}`;
const normalized = (value: string) => value.trim().toLocaleLowerCase("it-IT");
const currentUser = (req: AuthenticatedRequest) =>
  db.select().from(accountProfiles).where(eq(accountProfiles.clerkUserId, req.clerkUserId)).limit(1);

router.post("/account/profile", requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const input = CreateAccountProfileBody.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: input.error.message });
    return;
  }
  const existing = await currentUser(authReq);
  if (existing[0]) {
    const institution = await db.select().from(institutions).where(eq(institutions.id, existing[0].instituteId)).limit(1);
    const classRow = existing[0].classId ? await db.select().from(classes).where(eq(classes.id, existing[0].classId)).limit(1) : [];
    res.status(200).json(profileResponse(existing[0], institution[0], classRow[0]));
    return;
  }
  const body = input.data;
  const clerkUser = await clerkClient.users.getUser(authReq.clerkUserId);
  const primaryEmail = clerkUser.primaryEmailAddress;
  const verifiedEmail =
    (primaryEmail?.verification?.status === "verified" ? primaryEmail : null) ??
    clerkUser.emailAddresses.find((address) => address.verification?.status === "verified");
  const email = verifiedEmail?.emailAddress;
  if (!email) {
    res.status(400).json({ error: "Verify an email address on your Clerk account before continuing." });
    return;
  }
  let institution: typeof institutions.$inferSelect | undefined;
  let classRow: typeof classes.$inferSelect | undefined;
  if (body.role === "student") {
    if (!body.classCode?.trim()) {
      res.status(400).json({ error: "Students must join using a class code." });
      return;
    }
    const found = await db.select({ institution: institutions, classRow: classes })
      .from(classes).innerJoin(institutions, eq(classes.institutionId, institutions.id))
      .where(eq(classes.joinCode, body.classCode.trim().toUpperCase())).limit(1);
    institution = found[0]?.institution;
    classRow = found[0]?.classRow;
    if (!institution || !classRow) {
      res.status(404).json({ error: "Class code not found." });
      return;
    }
  } else if (body.teacherCode?.trim()) {
    institution = (await db.select().from(institutions).where(eq(institutions.teacherCode, body.teacherCode.trim().toUpperCase())).limit(1))[0];
    if (!institution) {
      res.status(404).json({ error: "Teacher code not found." });
      return;
    }
  } else {
    if (!body.institutionName?.trim()) {
      res.status(400).json({ error: "Institution name is required for a new institution." });
      return;
    }
    const existingInstitution = await db.select().from(institutions)
      .where(eq(institutions.normalizedName, normalized(body.institutionName))).limit(1);
    if (existingInstitution[0]) {
      res.status(409).json({ error: "Institution already exists; join it using the teacher code." });
      return;
    }
    institution = {
      id: randomUUID(), name: body.institutionName.trim(), normalizedName: normalized(body.institutionName),
      teacherCode: code("TEACHER"), createdBy: authReq.clerkUserId, createdAt: new Date(),
    };
    await db.insert(institutions).values(institution);
  }
  const profile = {
    id: randomUUID(), clerkUserId: authReq.clerkUserId, role: body.role, name: body.name.trim(),
    email: email.trim().toLowerCase(), instituteId: institution.id, classId: classRow?.id ?? null,
  };
  await db.insert(accountProfiles).values(profile);
  res.status(201).json(profileResponse({ ...profile, createdAt: new Date(), updatedAt: new Date() }, institution, classRow));
});

router.get("/account/profile", requireAuth, async (req, res) => {
  const profile = (await currentUser(req as AuthenticatedRequest))[0];
  if (!profile) { res.status(404).json({ error: "Profile not found." }); return; }
  const institution = (await db.select().from(institutions).where(eq(institutions.id, profile.instituteId)).limit(1))[0];
  const classRow = profile.classId ? (await db.select().from(classes).where(eq(classes.id, profile.classId)).limit(1))[0] : null;
  res.json(profileResponse(profile, institution, classRow));
});

router.put("/student/sync", requireAuth, async (req, res) => {
  const parsed = SyncStudentDataBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const profile = (await currentUser(req as AuthenticatedRequest))[0];
  if (!profile || profile.role !== "student") { res.status(403).json({ error: "Only students can sync activities." }); return; }
  try {
    await db.transaction(async (tx) => {
      for (const activity of parsed.data.activities) {
        const incomingUpdatedAt = new Date(activity.updatedAt);
        const existing = (await tx.select().from(activities).where(eq(activities.id, activity.id)).for("update").limit(1))[0];
        if (existing && existing.studentId !== profile.id) {
          throw new Error("activity-id-collision");
        }
        if (!existing) {
          await tx.insert(activities).values({
            id: activity.id,
            studentId: profile.id,
            title: activity.title,
            date: activity.date,
            location: activity.location,
            hours: activity.hours,
            deleted: false,
            updatedAt: incomingUpdatedAt,
          });
        } else if (incomingUpdatedAt > existing.updatedAt) {
          await tx.update(activities).set({
            title: activity.title,
            date: activity.date,
            location: activity.location,
            hours: activity.hours,
            deleted: false,
            updatedAt: incomingUpdatedAt,
          }).where(eq(activities.id, activity.id));
        }
      }
      if (parsed.data.deletedIds.length) {
        await tx.update(activities).set({ deleted: true, updatedAt: new Date() })
          .where(and(eq(activities.studentId, profile.id), inArray(activities.id, parsed.data.deletedIds)));
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "activity-id-collision") {
      res.status(409).json({ error: "Activity ID belongs to another student." });
      return;
    }
    throw error;
  }
  const rows = await db.select().from(activities).where(eq(activities.studentId, profile.id));
  const merged = rows.filter((activity) => !activity.deleted).map((activity) => ({
    id: activity.id,
    title: activity.title,
    date: activity.date,
    location: activity.location,
    hours: activity.hours,
    updatedAt: activity.updatedAt.toISOString(),
  }));
  const deletedIds = rows.filter((activity) => activity.deleted).map((activity) => activity.id);
  res.json({ activities: merged, deletedIds });
});

router.get("/teacher/classes", requireAuth, async (req, res) => {
  const profile = (await currentUser(req as AuthenticatedRequest))[0];
  if (!profile || profile.role !== "teacher") { res.status(403).json({ error: "Teacher access required." }); return; }
  res.json(await db.select({ id: classes.id, name: classes.name, joinCode: classes.joinCode, institutionId: classes.institutionId })
    .from(classes).where(eq(classes.institutionId, profile.instituteId)).orderBy(asc(classes.name)));
});

router.post("/teacher/classes", requireAuth, async (req, res) => {
  const parsed = CreateTeacherClassBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const profile = (await currentUser(req as AuthenticatedRequest))[0];
  if (!profile || profile.role !== "teacher") { res.status(403).json({ error: "Teacher access required." }); return; }
  const row = { id: randomUUID(), institutionId: profile.instituteId, name: parsed.data.name.trim(), joinCode: code("CLASS"), createdBy: profile.clerkUserId };
  await db.insert(classes).values(row);
  res.status(201).json(row);
});

router.get("/teacher/students", requireAuth, async (req, res) => {
  const profile = (await currentUser(req as AuthenticatedRequest))[0];
  if (!profile || profile.role !== "teacher") { res.status(403).json({ error: "Teacher access required." }); return; }
  const query = SearchTeacherStudentsQueryParams.parse(req.query);
  const rows = await db.select({
    id: accountProfiles.id, name: accountProfiles.name, email: accountProfiles.email,
    className: classes.name, activitiesCount: count(activities.id),
    totalHours: sql<number>`coalesce(sum(${activities.hours}), 0)`,
  }).from(accountProfiles).leftJoin(classes, eq(accountProfiles.classId, classes.id))
    .leftJoin(activities, and(eq(activities.studentId, accountProfiles.id), eq(activities.deleted, false)))
    .where(and(eq(accountProfiles.instituteId, profile.instituteId), eq(accountProfiles.role, "student"), ilike(accountProfiles.name, `%${query.search}%`)))
    .groupBy(accountProfiles.id, classes.name).orderBy(asc(accountProfiles.name));
  res.json(rows.slice(0, 100).map((row) => ({ ...row, activitiesCount: Number(row.activitiesCount), totalHours: Number(row.totalHours) })));
});

router.get("/teacher/students/:studentId", requireAuth, async (req, res) => {
  const profile = (await currentUser(req as AuthenticatedRequest))[0];
  if (!profile || profile.role !== "teacher") { res.status(403).json({ error: "Teacher access required." }); return; }
  const params = GetTeacherStudentParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const student = (await db.select({
    id: accountProfiles.id, name: accountProfiles.name, email: accountProfiles.email,
    className: classes.name,
  }).from(accountProfiles).leftJoin(classes, eq(accountProfiles.classId, classes.id))
    .where(and(eq(accountProfiles.id, params.data.studentId), eq(accountProfiles.instituteId, profile.instituteId), eq(accountProfiles.role, "student"))).limit(1))[0];
  if (!student) { res.status(404).json({ error: "Student not found." }); return; }
  const studentActivities = await db.select().from(activities).where(and(eq(activities.studentId, student.id), eq(activities.deleted, false)));
  res.json({
    ...student,
    activitiesCount: studentActivities.length,
    totalHours: studentActivities.reduce((sum, activity) => sum + activity.hours, 0),
    activities: studentActivities.map((activity) => ({
      id: activity.id,
      title: activity.title,
      date: activity.date,
      location: activity.location,
      hours: activity.hours,
      updatedAt: activity.updatedAt.toISOString(),
    })),
  });
});

export default router;