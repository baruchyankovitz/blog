const request = require("supertest");
let axios;

jest.mock("axios");

const EVENT_BUS_URL = "http://event-bus-srv:4005/events";
let app;

beforeEach(() => {
  jest.resetModules();
  axios = require("axios");
  jest.clearAllMocks();
  process.env.EVENT_BUS_URL = EVENT_BUS_URL;
  axios.post.mockResolvedValue({});
  app = require("./index");
});

const commentCreated = (content) => ({
  type: "CommentCreated",
  data: { id: "c1", postId: "p1", content, status: "pending" },
});

test("rejects a comment that contains 'orange'", async () => {
  const res = await request(app)
    .post("/events")
    .send(commentCreated("I like orange"));

  expect(res.status).toBe(200);
  expect(axios.post).toHaveBeenCalledWith(EVENT_BUS_URL, {
    type: "CommentModerated",
    data: { id: "c1", postId: "p1", status: "rejected", content: "I like orange" },
  });
});

test("approves any other comment", async () => {
  await request(app).post("/events").send(commentCreated("great post"));

  expect(axios.post).toHaveBeenCalledWith(EVENT_BUS_URL, {
    type: "CommentModerated",
    data: { id: "c1", postId: "p1", status: "approved", content: "great post" },
  });
});

test("ignores other event types", async () => {
  const res = await request(app)
    .post("/events")
    .send({ type: "PostCreated", data: { id: "p1", title: "x" } });

  expect(res.status).toBe(200);
  expect(axios.post).not.toHaveBeenCalled();
});
