import express from "express";
import {
  createSprint,
  getSprints,
  getSprint,
  updateSprint,
  deleteSprint,
  startSprint,
  completeSprint,
  getSprintTasks
} from "../controllers/sprint.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/")
  .post(protect, createSprint)
  .get(protect, getSprints);

router.route("/:sprintId")
  .get(protect, getSprint)
  .put(protect, updateSprint)
  .delete(protect, deleteSprint);

router.route("/:sprintId/start")
  .put(protect, startSprint);

router.route("/:sprintId/complete")
  .put(protect, completeSprint);

router.route("/:sprintId/tasks")
  .get(protect, getSprintTasks);

export default router;