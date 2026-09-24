import { Router } from "express";
import { randomUUID, timingSafeEqual } from "node:crypto";
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
  GetTeacherStudentParams,
  SearchTeacherStudentsQueryParams,
  SyncStudentDataBody,
  UpdateAccountProfileBody,
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
  className: profile.className ?? classRow?.name ?? null,
});
const normalized = (value: string) => value.trim().toLocaleLowerCase("it-IT");
const currentUser = (req: AuthenticatedRequest) =>
  db.select().from(accountProfiles).where(eq(accountProfiles.clerkUserId, req.clerkUserId)).limit(1);

function hasValidTeacherInvite(candidate: string): boolean {
  const configured = process.env.TEACHER_INVITE_CODE?.trim() ?? "";
  if (!configured) return false;
  const expectedBytes = Buffer.from(configured);
  const candidateBytes = Buffer.from(candidate);
  return candidateBytes.length === expectedBytes.length && timingSafeEqual(candidateBytes, expectedBytes);
}

async function findOrCreateInstitution(name: string, createdBy: string) {
  const trimmedName = name.trim();
  const normalizedName = normalized(trimmedName);
  const existing = (await db
    .select()
    .from(institutions)
    .where(eq(institutions.normalizedName, normalizedName))
    .limit(1))[0];
  if (existing) return existing;

  const institution = {
    id: randomUUID(),
    name: trimmedName,
    normalizedName,
    teacherCode: null,
    createdBy,
  };
  await db.insert(institutions).values(institution).onConflictDoNothing({
    target: institutions.normalizedName,
  });
  const createdOrExisting = (await db
    .select()
    .from(institutions)
    .where(eq(institutions.normalizedName, normalizedName))
    .limit(1))[0];
  if (!createdOrExisting) throw new Error("Unable to create institution profile.");
  return createdOrExisting;
}

router.post("/account/profile", requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const input = CreateAccountProfileBody.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: input.error.message });
    return;
  }
  const existing = await currentUser(authReq);
  if (existing[0]) {
    const institution = (await db.select().from(institutions).where(eq(institutions.id, existing[0].instituteId)).limit(1))[0];
    const classRow = existing[0].classId
      ? (await db.select().from(classes).where(eq(classes.id, existing[0].classId)).limit(1))[0]
      : null;
    res.status(200).json(profileResponse(existing[0], institution, classRow));
    return;
  }

  const body = input.data;
  if (!body.institutionName.trim()) {
    res.status(400).json({ error: "Indica il nome dell’istituto." });
    return;
  }
  if (body.role === "student" && !body.className?.trim()) {
    res.status(400).json({ error: "Indica la classe frequentata." });
    return;
  }
  if (body.role === "teacher") {
    const configuredInvite = process.env.TEACHER_INVITE_CODE?.trim() ?? "";
    if (!configuredInvite) {
      res.status(503).json({ error: "La registrazione docente non è configurata." });
      return;
    }
    if (!hasValidTeacherInvite(body.teacherInviteCode?.trim() ?? "")) {
      res.status(403).json({ error: "Invito docente non valido." });
      return;
    }
  }

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

  const institution = await findOrCreateInstitution(body.institutionName, authReq.clerkUserId);
  const profile = {
    id: randomUUID(),
    clerkUserId: authReq.clerkUserId,
    role: body.role,
    name: body.name.trim(),
    email: email.trim().toLowerCase(),
    instituteId: institution.id,
    className: body.role === "student" ? body.className?.trim() ?? null : null,
    classId: null,
  };
  await db.insert(accountProfiles).values(profile);
  res.status(201).json(
    profileResponse({ ...profile, createdAt: new Date(), updatedAt: new Date() }, institution),
  );
});

router.put("/account/profile", requireAuth, async (req, res) => {
  const input = UpdateAccountProfileBody.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: input.error.message });
    return;
  }
  const profile = (await currentUser(req as AuthenticatedRequest))[0];
  if (!profile || profile.role !== "student") {
    res.status(403).json({ error: "Solo gli studenti possono modificare questo profilo." });
    return;
  }
  const institution = await findOrCreateInstitution(input.data.institutionName, profile.clerkUserId);
  await db
    .update(accountProfiles)
    .set({
      name: input.data.name.trim(),
      className: input.data.className.trim(),
      classId: null,
      instituteId: institution.id,
      updatedAt: new Date(),
    })
    .where(eq(accountProfiles.id, profile.id));
  const updatedProfile = (await currentUser(req as AuthenticatedRequest))[0];
  res.json(profileResponse(updatedProfile, institution));
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

router.get("/teacher/stats", requireAuth, async (req, res) => {
  const profile = (await currentUser(req as AuthenticatedRequest))[0];
  if (!profile || profile.role !== "teacher") {
    res.status(403).json({ error: "Teacher access required." });
    return;
  }
  const [totals] = await db
    .select({
      totalStudents: sql<number>`count(distinct ${accountProfiles.id})`,
      totalActivities: count(activities.id),
      totalHours: sql<number>`coalesce(sum(${activities.hours}), 0)`,
    })
    .from(accountProfiles)
    .leftJoin(
      activities,
      and(eq(activities.studentId, accountProfiles.id), eq(activities.deleted, false)),
    )
    .where(eq(accountProfiles.role, "student"));
  res.json({
    totalStudents: Number(totals?.totalStudents ?? 0),
    totalActivities: Number(totals?.totalActivities ?? 0),
    totalHours: Number(totals?.totalHours ?? 0),
  });
});

router.get("/teacher/students", requireAuth, async (req, res) => {
  const profile = (await currentUser(req as AuthenticatedRequest))[0];
  if (!profile || profile.role !== "teacher") { res.status(403).json({ error: "Teacher access required." }); return; }
  const query = SearchTeacherStudentsQueryParams.parse(req.query);
  const rows = await db.select({
    id: accountProfiles.id, name: accountProfiles.name, email: accountProfiles.email,
    className: sql<string | null>`coalesce(${accountProfiles.className}, ${classes.name})`,
    institutionName: institutions.name,
    activitiesCount: count(activities.id),
    totalHours: sql<number>`coalesce(sum(${activities.hours}), 0)`,
  }).from(accountProfiles)
    .innerJoin(institutions, eq(accountProfiles.instituteId, institutions.id))
    .leftJoin(classes, eq(accountProfiles.classId, classes.id))
    .leftJoin(activities, and(eq(activities.studentId, accountProfiles.id), eq(activities.deleted, false)))
    .where(and(eq(accountProfiles.role, "student"), ilike(accountProfiles.name, `%${query.search}%`)))
    .groupBy(accountProfiles.id, classes.name, institutions.name)
    .orderBy(asc(accountProfiles.name));
  res.json(rows.map((row) => ({
    ...row,
    activitiesCount: Number(row.activitiesCount),
    totalHours: Number(row.totalHours),
  })));
});

router.get("/teacher/students/:studentId", requireAuth, async (req, res) => {
  const profile = (await currentUser(req as AuthenticatedRequest))[0];
  if (!profile || profile.role !== "teacher") { res.status(403).json({ error: "Teacher access required." }); return; }
  const params = GetTeacherStudentParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const student = (await db.select({
    id: accountProfiles.id, name: accountProfiles.name, email: accountProfiles.email,
    className: sql<string | null>`coalesce(${accountProfiles.className}, ${classes.name})`,
    institutionName: institutions.name,
  }).from(accountProfiles)
    .innerJoin(institutions, eq(accountProfiles.instituteId, institutions.id))
    .leftJoin(classes, eq(accountProfiles.classId, classes.id))
    .where(and(eq(accountProfiles.id, params.data.studentId), eq(accountProfiles.role, "student"))).limit(1))[0];
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