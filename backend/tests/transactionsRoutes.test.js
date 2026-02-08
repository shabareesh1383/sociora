const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const transactionsRouter = require("../routes/transactions");
const Transaction = require("../models/Transaction");
const Video = require("../models/Video");
const User = require("../models/User");
const createLedger = require("../../blockchain/ledgerFactory");

// Mock env
process.env.JWT_SECRET = "test-secret";

describe("Transactions Routes - Comprehensive Bug Verification", () => {
  let app;
  let testUser;
  let testVideo;
  let testCreator;
  let authToken;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use("/api/transactions", transactionsRouter);

    // Create test users
    testCreator = {
      name: "Test Creator",
      email: "creator@test.com",
      password: "pass123",
      role: "creator"
    };

    testUser = {
      name: "Test User",
      email: "user@test.com",
      password: "pass123",
      role: "user"
    };

    // Create mock JWT token
    authToken = jwt.sign(
      { id: "user-id-123", email: "user@test.com" },
      process.env.JWT_SECRET
    );

    // Create test video
    testVideo = {
      _id: "video-id-123",
      title: "Test Video",
      description: "A test video",
      creatorId: "creator-id-456"
    };
  });

  describe("POST /invest - Bug Analysis", () => {
    test("BUG #1: investAmount type conversion from string to number", async () => {
      // Frontend sends investAmount as string but should be number
      const res = await request(app)
        .post("/api/transactions/invest")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          videoId: "video-id-123",
          toCreator: "creator-id-456",
          amount: "10" // SENT AS STRING - FRONTEND BUG
        });

      // Check if validation fails
      expect(res.status).toBe(400);
      expect(res.body.message).toContain("amount must be a valid number");
    });

    test("BUG #2: Missing Authorization header returns 401", async () => {
      const res = await request(app)
        .post("/api/transactions/invest")
        .send({
          videoId: "video-id-123",
          toCreator: "creator-id-456",
          amount: 10
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("No token provided");
    });

    test("BUG #3: Invalid JWT token returns 401", async () => {
      const res = await request(app)
        .post("/api/transactions/invest")
        .set("Authorization", `Bearer invalid-token`)
        .send({
          videoId: "video-id-123",
          toCreator: "creator-id-456",
          amount: 10
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("Invalid token");
    });

    test("BUG #4: Bearer token malformed (missing space)", async () => {
      const res = await request(app)
        .post("/api/transactions/invest")
        .set("Authorization", `Bearer${authToken}`) // Missing space after Bearer
        .send({
          videoId: "video-id-123",
          toCreator: "creator-id-456",
          amount: 10
        });

      expect(res.status).toBe(401);
    });

    test("BUG #5: Negative amount should be rejected", async () => {
      const res = await request(app)
        .post("/api/transactions/invest")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          videoId: "video-id-123",
          toCreator: "creator-id-456",
          amount: -10
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("amount must be greater than 0");
    });

    test("BUG #6: Zero amount should be rejected", async () => {
      const res = await request(app)
        .post("/api/transactions/invest")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          videoId: "video-id-123",
          toCreator: "creator-id-456",
          amount: 0
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("amount must be greater than 0");
    });

    test("BUG #7: Missing required fields", async () => {
      const res = await request(app)
        .post("/api/transactions/invest")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          videoId: "video-id-123"
          // Missing toCreator and amount
        });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /me - Bug Analysis", () => {
    test("BUG #8: Missing Authorization header returns 401", async () => {
      const res = await request(app)
        .get("/api/transactions/me");

      expect(res.status).toBe(401);
    });

    test("BUG #9: Invalid token returns 401", async () => {
      const res = await request(app)
        .get("/api/transactions/me")
        .set("Authorization", `Bearer invalid-token`);

      expect(res.status).toBe(401);
    });

    test("BUG #10: Malformed Bearer token", async () => {
      const res = await request(app)
        .get("/api/transactions/me")
        .set("Authorization", `Bearer${authToken}`);

      expect(res.status).toBe(401);
    });
  });

  describe("Authorization Header Parsing", () => {
    test("BUG #11: Case sensitivity - 'bearer' vs 'Bearer'", async () => {
      // auth middleware uses startsWith("Bearer ") - lowercase 'bearer' should fail
      const res = await request(app)
        .post("/api/transactions/invest")
        .set("Authorization", `bearer ${authToken}`) // lowercase
        .send({
          videoId: "video-id-123",
          toCreator: "creator-id-456",
          amount: 10
        });

      expect(res.status).toBe(401);
      console.log("⚠️ BUG #11 FOUND: auth middleware is case-sensitive to 'Bearer'");
    });
  });
});
