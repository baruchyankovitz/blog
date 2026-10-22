const request = require("supertest");
let axios;

jest.mock("axios");

let app;

beforeEach(() => {
  jest.resetModules();
  axios = require("axios");
  jest.clearAllMocks();
  axios.post.mockResolvedValue({});
  app = require("./index");
});

test("GET /posts returns an empty object at start", async () => {
  const res = await request(app).get("/posts");

  expect(res.status).toBe(200);
  expect(res.body).toEqual({});
});

test("POST /posts creates a post and emits PostCreated", async () => {
  const res = await request(app).post("/posts").send({ title: "hello" });

  expect(res.status).toBe(201);
  expect(res.body).toEqual({ id: expect.any(String), title: "hello" });
  expect(axios.post).toHaveBeenCalledWith("http://event-bus-srv:4005/events", {
    type: "PostCreated",
    data: { id: res.body.id, title: "hello" },
  });

  const list = await request(app).get("/posts");
  expect(list.body[res.body.id]).toEqual(res.body);
});

test("POST /events returns an empty object", async () => {
  const res = await request(app).post("/events").send({ type: "Anything" });

  expect(res.status).toBe(200);
  expect(res.body).toEqual({});
});
