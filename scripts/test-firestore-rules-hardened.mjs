import fs from "node:fs";
import path from "node:path";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";

firebase.firestore.setLogLevel("silent");

const projectId = "demo-site-convidados-rules";
const rules = fs.readFileSync(path.resolve("firestore.rules"), "utf8");
const now = () => firebase.firestore.FieldValue.serverTimestamp();
const timestamp = () => firebase.firestore.Timestamp.fromDate(new Date("2026-06-15T12:00:00.000Z"));

const testEnv = await initializeTestEnvironment({
  projectId,
  firestore: {
    rules,
  },
});

const guest = () =>
  testEnv.authenticatedContext("guest-user", {
    provider_id: "anonymous",
    firebase: { sign_in_provider: "anonymous" },
  });

const admin = () =>
  testEnv.authenticatedContext("admin-user", {
    email: "matheusrs180@gmail.com",
    email_verified: true,
  });

const contribution = (overrides = {}) => ({
  amount: 150,
  giftTitle: "Jogo de jantar",
  donorName: "Visitante",
  donorEmail: "visitante@example.com",
  paymentMethod: "pix",
  status: "pending",
  createdAt: now(),
  ...overrides,
});

// Contrato real do writer (app/rsvp/[code]/page.tsx): adults e o numero de
// confirmantes (int), attendees a lista de guestIds, confirmedBy o guestId.
const rsvp = (overrides = {}) => ({
  familyId: "family-1",
  confirmedBy: "guest-1",
  attendees: ["guest-1", "guest-2"],
  adults: 2,
  childrenCount: 0,
  createdAt: now(),
  ...overrides,
});

const tests = [];
const addTest = (name, run) => tests.push({ name, run });

addTest("hardened: client cannot create contribution records directly", async () => {
  const db = guest().firestore();

  await assertFails(
    db.collection("contributions").doc("valid-pending").set(contribution()),
  );
});

for (const status of ["completed", "processing", "failed"]) {
  addTest(`hardened: client cannot create contribution status ${status}`, async () => {
    const db = guest().firestore();

    await assertFails(
      db.collection("contributions").doc(`bad-status-${status}`).set(
        contribution({ status }),
      ),
    );
  });
}

addTest("hardened: anonymous completed contribution is rejected", async () => {
  const db = testEnv.unauthenticatedContext().firestore();

  await assertFails(
    db.collection("contributions").doc("anonymous-completed").set(
      contribution({ status: "completed" }),
    ),
  );
});

addTest("hardened: contribution amount must be within range", async () => {
  const db = guest().firestore();

  await assertFails(
    db.collection("contributions").doc("amount-too-large").set(
      contribution({ amount: 100001 }),
    ),
  );

  await assertFails(
    db.collection("contributions").doc("amount-zero").set(
      contribution({ amount: 0 }),
    ),
  );
});

addTest("hardened: contribution requires donorEmail", async () => {
  const db = guest().firestore();
  const payload = contribution();
  delete payload.donorEmail;

  await assertFails(
    db.collection("contributions").doc("missing-email").set(payload),
  );
});

addTest("hardened: contribution rejects extra fields", async () => {
  const db = guest().firestore();

  await assertFails(
    db.collection("contributions").doc("extra-field").set(
      contribution({ injectedField: "must-fail" }),
    ),
  );
});

addTest("hardened: client cannot create tieBid records directly", async () => {
  const db = guest().firestore();

  await assertFails(
    db.collection("tieBids").doc("bid-pending").set({
      amount: 150,
      message: "Que venca a familia mais animada!",
      status: "pending",
      createdAt: now(),
    }),
  );
});

addTest("hardened: public leaderboard is readable but internal totals are private", async () => {
  const publicDb = testEnv.unauthenticatedContext().firestore();

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await db.collection("leaderboards").doc("individual").set({
      entries: [],
      updatedAt: timestamp(),
    });
    await db
      .collection("leaderboardTotals")
      .doc("individual")
      .collection("items")
      .doc("guest-1")
      .set({
        id: "guest-1",
        name: "Visitante",
        total: 150,
        bidCount: 1,
      });
  });

  await assertSucceeds(publicDb.collection("leaderboards").doc("individual").get());
  await assertFails(
    publicDb
      .collection("leaderboardTotals")
      .doc("individual")
      .collection("items")
      .doc("guest-1")
      .get(),
  );
});

addTest("hardened: only admin can perform valid contribution status update", async () => {
  const guestDb = guest().firestore();
  const adminDb = admin().firestore();

  await testEnv.withSecurityRulesDisabled(async (context) => {
    await context.firestore().collection("contributions").doc("update-target").set({
      amount: 150,
      giftTitle: "Jogo de jantar",
      donorName: "Visitante",
      donorEmail: "visitante@example.com",
      paymentMethod: "pix",
      status: "pending",
      createdAt: timestamp(),
    });
  });

  await assertFails(
    guestDb.collection("contributions").doc("update-target").update({
      status: "completed",
      updatedAt: now(),
    }),
  );

  await assertSucceeds(
    adminDb.collection("contributions").doc("update-target").update({
      status: "processing",
      updatedAt: now(),
    }),
  );
});

addTest("hardened: terminal contribution status cannot transition backward", async () => {
  const adminDb = admin().firestore();

  await testEnv.withSecurityRulesDisabled(async (context) => {
    await context.firestore().collection("contributions").doc("terminal-status").set({
      amount: 150,
      giftTitle: "Jogo de jantar",
      donorName: "Visitante",
      donorEmail: "visitante@example.com",
      paymentMethod: "pix",
      status: "completed",
      createdAt: timestamp(),
      updatedAt: timestamp(),
    });
  });

  await assertFails(
    adminDb.collection("contributions").doc("terminal-status").update({
      status: "pending",
      updatedAt: now(),
    }),
  );
});

addTest("hardened: valid RSVP (real contract) succeeds for signed-in guest", async () => {
  const db = guest().firestore();

  await assertSucceeds(
    db.collection("rsvps").doc("family-1").set(rsvp()),
  );
});

addTest("hardened: anonymous RSVP create is rejected", async () => {
  const db = testEnv.unauthenticatedContext().firestore();

  await assertFails(
    db.collection("rsvps").doc("family-1").set(rsvp()),
  );
});

addTest("hardened: RSVP requires familyId and confirmedBy", async () => {
  const db = guest().firestore();

  const noFamily = rsvp();
  delete noFamily.familyId;
  await assertFails(
    db.collection("rsvps").doc("no-family").set(noFamily),
  );

  const noConfirmedBy = rsvp();
  delete noConfirmedBy.confirmedBy;
  await assertFails(
    db.collection("rsvps").doc("no-confirmed-by").set(noConfirmedBy),
  );
});

addTest("hardened: RSVP rejects extra fields", async () => {
  const db = guest().firestore();

  await assertFails(
    db.collection("rsvps").doc("extra-rsvp").set(
      rsvp({ injectedField: "must-fail" }),
    ),
  );
});

addTest("hardened: RSVP caps adults/attendees and text fields", async () => {
  const db = guest().firestore();

  await assertFails(
    db.collection("rsvps").doc("too-many-adults").set(
      rsvp({ adults: 21 }),
    ),
  );

  await assertFails(
    db.collection("rsvps").doc("too-many-attendees").set(
      rsvp({ attendees: Array.from({ length: 21 }, (_, index) => `guest-${index}`) }),
    ),
  );

  await assertFails(
    db.collection("rsvps").doc("long-dietary").set(
      rsvp({ dietary: "x".repeat(1001) }),
    ),
  );

  await assertFails(
    db.collection("rsvps").doc("long-message").set(
      rsvp({ message: "x".repeat(1001) }),
    ),
  );
});

try {
  for (const { name, run } of tests) {
    await testEnv.clearFirestore();
    await run();
    console.log(`PASS ${name}`);
  }

  console.log("HARDENED RULES CONFIRMED: target Firestore security assertions pass.");
} finally {
  await testEnv.cleanup();
}
