import { boolean, doublePrecision, index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const institutions = pgTable(
  "institutions",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    teacherCode: text("teacher_code"),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("institutions_normalized_name_key").on(table.normalizedName),
    uniqueIndex("institutions_teacher_code_key").on(table.teacherCode),
  ],
);

export const classes = pgTable(
  "classes",
  {
    id: text("id").primaryKey(),
    institutionId: text("institution_id")
      .notNull()
      .references(() => institutions.id),
    name: text("name").notNull(),
    joinCode: text("join_code").notNull(),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("classes_join_code_key").on(table.joinCode),
    index("classes_institution_idx").on(table.institutionId),
  ],
);

export const accountProfiles = pgTable(
  "account_profiles",
  {
    id: text("id").primaryKey(),
    clerkUserId: text("clerk_user_id").notNull(),
    role: text("role").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    instituteId: text("institution_id")
      .notNull()
      .references(() => institutions.id),
    className: text("class_name"),
    classId: text("class_id").references(() => classes.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("account_profiles_clerk_user_key").on(table.clerkUserId),
    index("account_profiles_institution_name_idx").on(table.instituteId, table.name),
    index("account_profiles_role_name_idx").on(table.role, table.name),
  ],
);

export const activities = pgTable(
  "activities",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id")
      .notNull()
      .references(() => accountProfiles.id),
    title: text("title").notNull(),
    date: text("date").notNull(),
    location: text("location").notNull(),
    hours: doublePrecision("hours").notNull(),
    deleted: boolean("deleted").default(false).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("activities_student_idx").on(table.studentId),
    index("activities_active_student_idx").on(table.studentId, table.deleted),
  ],
);
