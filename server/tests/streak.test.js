const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const {
  app,
  resetDatabase,
  closeDatabase,
  sql,
  createUser,
} = require("./helpers/testApp");

before(async () => {
  await resetDatabase();
});

after(async () => {
  await closeDatabase();
});

const streak = (user, tz = "UTC") =>
  request(app).get(`/streak?tz=${tz}`).set(user.auth);

// Creates a task that was finished "daysAgo" days ago (0 means just now)
async function finishTask(user, title, daysAgo = 0) {
  const res = await request(app).post("/tasks").set(user.auth).send({ title });
  await sql.query(
    `UPDATE tasks
     SET done = TRUE, completed_at = NOW() - make_interval(days => $2::int)
     WHERE id = $1`,
    [res.body.id, daysAgo]
  );
}

// Creates a topic that reached Done "daysAgo" days ago
async function finishTopic(user, title, daysAgo = 0) {
  const res = await request(app).post("/topics").set(user.auth).send({ title });
  await sql.query(
    `UPDATE topics
     SET status = 'Done', completed_at = NOW() - make_interval(days => $2::int)
     WHERE id = $1`,
    [res.body.id, daysAgo]
  );
}

// Creates one finished task for each of the given "days ago" values
async function finishTasksOn(user, daysAgoList) {
  for (const daysAgo of daysAgoList) {
    await finishTask(user, `Task ${daysAgo} days ago`, daysAgo);
  }
}

describe("Streaks", () => {
  it("starts at zero for a new user", async () => {
    const user = await createUser("Newcomer");
    const res = await streak(user);

    assert.equal(res.status, 200);
    assert.deepEqual(res.body, {
      current: 0,
      longest: 0,
      activeToday: false,
      totalDays: 0,
    });
  });

  it("finishing something today starts a 1-day streak", async () => {
    const user = await createUser("Starter");
    await finishTask(user, "First");

    const res = await streak(user);
    assert.deepEqual(res.body, {
      current: 1,
      longest: 1,
      activeToday: true,
      totalDays: 1,
    });
  });

  it("several items on one day still count as one day", async () => {
    const user = await createUser("Busy");
    await finishTask(user, "A");
    await finishTask(user, "B");
    await finishTopic(user, "C");

    const res = await streak(user);
    assert.equal(res.body.totalDays, 1);
    assert.equal(res.body.current, 1);
  });

  it("consecutive days build a streak", async () => {
    const user = await createUser("Steady");
    await finishTasksOn(user, [0, 1, 2]);

    const res = await streak(user);
    assert.equal(res.body.current, 3);
    assert.equal(res.body.longest, 3);
    assert.equal(res.body.activeToday, true);
  });

  it("yesterday keeps the streak alive while today is still empty", async () => {
    const user = await createUser("Patient");
    await finishTasksOn(user, [1, 2]);

    const res = await streak(user);
    assert.equal(res.body.current, 2);
    assert.equal(res.body.activeToday, false);
  });

  it("the streak is lost after a missed day, but the longest is remembered", async () => {
    const user = await createUser("Lapsed");
    await finishTasksOn(user, [2, 3]);

    const res = await streak(user);
    assert.equal(res.body.current, 0);
    assert.equal(res.body.longest, 2);
  });

  it("a gap ends the current streak", async () => {
    const user = await createUser("Gappy");
    await finishTasksOn(user, [0, 3]);

    const res = await streak(user);
    assert.equal(res.body.current, 1);
    assert.equal(res.body.longest, 1);
    assert.equal(res.body.totalDays, 2);
  });

  it("remembers the longest streak even when it is in the past", async () => {
    const user = await createUser("Veteran");
    await finishTasksOn(user, [0, 7, 8, 9, 10]);

    const res = await streak(user);
    assert.equal(res.body.current, 1);
    assert.equal(res.body.longest, 4);
    assert.equal(res.body.totalDays, 5);
  });

  it("finished topics count like finished tasks", async () => {
    const user = await createUser("Learner");
    await finishTopic(user, "Yesterday's topic", 1);
    await finishTask(user, "Today's task", 0);

    const res = await streak(user);
    assert.equal(res.body.current, 2);
  });

  it("un-doing the only item of the day removes the streak", async () => {
    const user = await createUser("Undoer");
    const task = (
      await request(app).post("/tasks").set(user.auth).send({ title: "Flip" })
    ).body;

    await request(app).put(`/tasks/${task.id}`).set(user.auth); // done
    assert.equal((await streak(user)).body.current, 1);

    await request(app).put(`/tasks/${task.id}`).set(user.auth); // not done
    assert.equal((await streak(user)).body.current, 0);
  });

  it("does not count other users' activity", async () => {
    const alice = await createUser("Alice");
    const bob = await createUser("Bob");
    await finishTasksOn(alice, [0, 1, 2]);

    assert.equal((await streak(alice)).body.current, 3);
    assert.equal((await streak(bob)).body.current, 0);
  });

  it("rejects an unknown time zone", async () => {
    const user = await createUser("Zoned");
    const res = await streak(user, "Not/AZone");

    assert.equal(res.status, 400);
    assert.equal(res.body.error, "Invalid time zone");
  });
});