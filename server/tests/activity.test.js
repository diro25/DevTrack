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

const utcToday = () => new Date().toISOString().slice(0, 10);

const activity = (user, query = "tz=UTC") =>
  request(app).get(`/activity?${query}`).set(user.auth);

// Creates a task that was finished "daysAgo" days ago (0 means just now)
async function finishTask(user, title, daysAgo = 0) {
  const res = await request(app).post("/tasks").set(user.auth).send({ title });
  await sql.query(
    `UPDATE tasks
     SET done = TRUE, completed_at = NOW() - make_interval(days => $2::int)
     WHERE id = $1`,
    [res.body.id, daysAgo]
  );
  return res.body.id;
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
  return res.body.id;
}

describe("Activity chart data", () => {
  it("returns 7 days by default, oldest first, ending today", async () => {
    const user = await createUser("Fresh");
    const res = await activity(user);

    assert.equal(res.status, 200);
    assert.equal(res.body.length, 7);
    assert.equal(res.body[6].day, utcToday());

    const days = res.body.map((row) => row.day);
    for (let i = 1; i < days.length; i++) {
      const gap = (Date.parse(days[i]) - Date.parse(days[i - 1])) / 86400000;
      assert.equal(gap, 1, "days should be consecutive");
    }

    assert.ok(res.body.every((row) => row.tasks === 0 && row.topics === 0));
  });

  it("counts what was finished today", async () => {
    const user = await createUser("TodayDoer");
    await finishTask(user, "One");
    await finishTask(user, "Two");
    await finishTopic(user, "Topic");

    const res = await activity(user);
    const today = res.body[6];

    assert.equal(today.day, utcToday());
    assert.equal(today.tasks, 2);
    assert.equal(today.topics, 1);
  });

  it("puts earlier activity on the right day and ignores older days", async () => {
    const user = await createUser("History");
    await finishTask(user, "Two days ago", 2);
    await finishTopic(user, "Five days ago", 5);
    await finishTask(user, "Too old", 7);

    const res = await activity(user);

    assert.equal(res.body[4].tasks, 1); // 2 days ago
    assert.equal(res.body[1].topics, 1); // 5 days ago

    const totalTasks = res.body.reduce((sum, row) => sum + row.tasks, 0);
    assert.equal(totalTasks, 1, "the 7-day-old task is outside the window");
  });

  it("stops counting a task once it is un-done", async () => {
    const user = await createUser("Changer");
    const task = (
      await request(app).post("/tasks").set(user.auth).send({ title: "Flip" })
    ).body;

    await request(app).put(`/tasks/${task.id}`).set(user.auth); // done
    assert.equal((await activity(user)).body[6].tasks, 1);

    await request(app).put(`/tasks/${task.id}`).set(user.auth); // not done
    assert.equal((await activity(user)).body[6].tasks, 0);
  });

  it("only counts the user's own items", async () => {
    const alice = await createUser("Alice");
    const bob = await createUser("Bob");
    await finishTask(alice, "Alice finished this");

    assert.equal((await activity(alice)).body[6].tasks, 1);
    assert.equal((await activity(bob)).body[6].tasks, 0);
  });

  it("keeps the number of days between 1 and 90", async () => {
    const user = await createUser("Limits");

    assert.equal((await activity(user, "tz=UTC&days=0")).body.length, 1);
    assert.equal((await activity(user, "tz=UTC&days=-5")).body.length, 1);
    assert.equal((await activity(user, "tz=UTC&days=500")).body.length, 90);
    assert.equal((await activity(user, "tz=UTC&days=30")).body.length, 30);
    assert.equal((await activity(user, "tz=UTC&days=abc")).body.length, 7);
  });

  it("rejects an unknown time zone", async () => {
    const user = await createUser("Zoned");
    const res = await activity(user, "tz=Not/AZone");

    assert.equal(res.status, 400);
    assert.equal(res.body.error, "Invalid time zone");
  });

  it("accepts a real time zone name", async () => {
    const user = await createUser("Ethiopian");
    const res = await activity(user, "tz=Africa/Addis_Ababa");

    assert.equal(res.status, 200);
    assert.equal(res.body.length, 7);
  });
});