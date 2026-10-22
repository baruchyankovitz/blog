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

const event = { type: "PostCreated", data: { id: "p1", title: "hello" } };

test("POST /events forwards the event to every service", async () => {
  const res = await request(app).post("/events").send(event);

  expect(res.status).toBe(200);
  expect(res.body).toEqual({ status: "OK" });
  expect(axios.post).toHaveBeenCalledTimes(3);
  expect(axios.post).toHaveBeenCalledWith("http://posts-clusterip-srv:4000/events", event);
  expect(axios.post).toHaveBeenCalledWith("http://comments-srv:4001/events", event);
  expect(axios.post).toHaveBeenCalledWith("http://query-srv:4002/events", event);
});

test("GET /events returns every stored event", async () => {
  await request(app).post("/events").send(event);

  const res = await request(app).get("/events");
  expect(res.body).toEqual([event]);
});
