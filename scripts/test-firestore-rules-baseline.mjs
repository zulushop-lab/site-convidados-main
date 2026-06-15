import fs from "node:fs";
import path from "node:path";
import process from "node:process";
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

const testEnv = await initializeTestEnvironment({
  projectId,
  firestore: {
    rules,
  },
});

const tests = [];
const addTest = (name, run) => tests.push({ name, run });

addTest("baseline hole: anonymous client can create completed contribution", async () => {
  const db = testEnv.unauthenticatedContext().firestore();

  await assertSucceeds(
    db.collection("contributions").doc("baseline-completed").set({
      amount: 150,
      donorName: "Visitante",
      status: "completed",
      createdAt: now(),
    }),
  );
});

addTest("baseline hole: anonymous contribution has no amount cap", async () => {
  const db = testEnv.unauthenticatedContext().firestore();

  await assertSucceeds(
    db.collection("contributions").doc("baseline-large-amount").set({
      amount: 999999,
      donorName: "Visitante",
      status: "pending",
      createdAt: now(),
    }),
  );
});

addTest("baseline hole: contribution does not require donorEmail", async () => {
  const db = testEnv.unauthenticatedContext().firestore();

  await assertSucceeds(
    db.collection("contributions").doc("baseline-no-email").set({
      amount: 150,
      donorName: "Visitante",
      status: "pending",
      createdAt: now(),
    }),
  );
});

addTest("baseline valid pending contribution still succeeds", async () => {
  const db = testEnv.unauthenticatedContext().firestore();

  await assertSucceeds(
    db.collection("contributions").doc("baseline-pending").set({
      amount: 150,
      donorName: "Visitante",
      status: "pending",
      createdAt: now(),
    }),
  );
});

addTest("baseline hole: RSVP with extra field succeeds", async () => {
  const db = testEnv.unauthenticatedContext().firestore();

  await assertSucceeds(
    db.collection("rsvps").doc("baseline-extra-field").set({
      adults: ["Matheus", "Isadora"],
      childrenCount: 0,
      createdAt: now(),
      injectedField: "allowed-by-current-rules",
    }),
  );
});

addTest("baseline guard: non-admin contribution update is denied", async () => {
  const db = testEnv.unauthenticatedContext().firestore();
  const ref = db.collection("contributions").doc("baseline-update-denied");

  await assertSucceeds(
    ref.set({
      amount: 150,
      donorName: "Visitante",
      status: "pending",
      createdAt: now(),
    }),
  );

  await assertFails(ref.update({ status: "completed" }));
});

try {
  for (const { name, run } of tests) {
    await testEnv.clearFirestore();
    await run();
    console.log(`PASS ${name}`);
  }

  console.log(
    "BASELINE CONFIRMED: current Firestore rules still allow the documented insecure creates.",
  );
} finally {
  await testEnv.cleanup();
}
