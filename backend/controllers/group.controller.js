import Group from "../models/group.model.js";
import Chat from "../models/chat.model.js";
import User from "../models/user.model.js";
import crypto from "crypto";

// Helper response functions
const ok = (res, data) => res.status(200).json({ success: true, ...data });
const err = (res, message, code = 400) =>
  res.status(code).json({ success: false, message });


// ----------------------------
// CREATE GROUP
// ----------------------------
export const createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;
    const adminId = req.user._id;

    if (!name) return err(res, "Group name is required");

    const chat = await Chat.create({
      isGroupChat: true,
      participants: [adminId]
    });

    const group = await Group.create({
      name,
      description: description || "",
      participants: [adminId],
      admin: adminId,
      chat: chat._id,
    });

    // Emit socket event to participants so other connected users update immediately
    try {
      const { getSocketIOInstance } = await import('../services/scheduledMessageCron.js');
      const io = getSocketIOInstance();
      const payload = {
        _id: group._id,
        id: group._id,
        chat: group.chat,
        chatId: group.chat,
        name: group.name,
        participants: group.participants || [],
        admin: group.admin,
      };
      console.log('[group.controller] Emitting group created', { ioAvailable: !!io, groupId: String(group._id) });
      if (io && Array.isArray(payload.participants)) {
        // emit to each participant personal room
        payload.participants.forEach(p => {
          try { io.to(String(p)).emit('group created', payload); } catch (e) { console.error('emit group created to participant failed', e); }
        });
        // also emit to chat room id
        try { io.to(String(group.chat)).emit('group created', payload); } catch (e) { console.error('emit group created to chat room failed', e); }
      }
    } catch (e) {
      console.error('group.controller: failed to emit group created', e);
    }

    return ok(res, { message: "Group created", group });
  } catch (error) {
    err(res, error.message, 500);
  }
};


// ----------------------------
// JOIN GROUP BY INVITE LINK
// ----------------------------
export const joinGroupByInviteLink = async (req, res) => {
  try {
    const { inviteLink } = req.body;
    const userId = req.user._id;

    if (!inviteLink) return err(res, "Invite link is required");

    const group = await Group.findOne({ inviteLink });
    if (!group) return err(res, "Invalid invite link");

    if (group.participants.includes(userId))
      return err(res, "User already in group");

    group.participants.push(userId);
    await group.save();

    await Chat.findByIdAndUpdate(group.chat, {
      $push: { participants: userId },
    });

    return ok(res, { message: "Joined group successfully", group });
  } catch (error) {
    err(res, error.message, 500);
  }
};


// ----------------------------
// GENERATE NEW INVITE LINK
// ----------------------------
export const regenerateLink = async (req, res) => {
  try {
    const { groupId } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return err(res, "Group not found");

    if (group.admin.toString() !== userId.toString())
      return err(res, "Only admin can regenerate link", 403);

    const newLink = crypto.randomBytes(16).toString("hex");
    group.inviteLink = newLink;
    await group.save();

    return ok(res, { inviteLink: newLink });
  } catch (error) {
    err(res, error.message, 500);
  }
};


// ----------------------------
// ADD MEMBER
// ----------------------------
export const addMember = async (req, res) => {
  try {
    const { groupId, userId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return err(res, "Group not found");

    if (group.participants.includes(userId))
      return err(res, "User already in group");

    group.participants.push(userId);
    await group.save();

    await Chat.findByIdAndUpdate(group.chat, {
      $push: { participants: userId },
    });

    return ok(res, { message: "Member added", group });
  } catch (error) {
    err(res, error.message, 500);
  }
};


// ----------------------------
// REMOVE MEMBER
// ----------------------------
export const removeMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return err(res, "Group not found");

    if (group.admin.toString() !== userId.toString())
      return err(res, "Only admin can remove members", 403);

    group.participants = group.participants.filter(
      (id) => id.toString() !== memberId.toString()
    );
    await group.save();

    await Chat.findByIdAndUpdate(group.chat, {
      $pull: { participants: memberId },
    });

    return ok(res, { message: "Member removed", group });
  } catch (error) {
    err(res, error.message, 500);
  }
};


// ----------------------------
// PROMOTE NEW ADMIN
// ----------------------------
export const addAdmin = async (req, res) => {
  try {
    const { groupId, newAdminId } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return err(res, "Group not found");

    if (group.admin.toString() !== userId.toString())
      return err(res, "Only group admin can promote", 403);

    group.admin = newAdminId;
    await group.save();

    return ok(res, { message: "Admin updated", group });
  } catch (error) {
    err(res, error.message, 500);
  }
};



// ----------------------------
// EXIT GROUP
// ----------------------------
export const exitGroup = async (req, res) => {
  try {
    const { groupId } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return err(res, "Group not found");

    if (!group.participants.includes(userId))
      return err(res, "User not in group");

    group.participants = group.participants.filter(
      (id) => id.toString() !== userId.toString()
    );

    // auto promote if admin leaves
    if (group.admin.toString() === userId.toString()) {
      group.admin = group.participants[0] || null;
    }

    await group.save();
    return ok(res, { message: "Exited group", group });
  } catch (error) {
    err(res, error.message, 500);
  }
};


// ----------------------------
// DELETE GROUP
// ----------------------------
export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return err(res, "Group not found");

    if (group.admin.toString() !== userId.toString())
      return err(res, "Only admin can delete group");

    await Chat.findByIdAndDelete(group.chat);
    await Group.findByIdAndDelete(groupId);

    return ok(res, { message: "Group deleted" });
  } catch (error) {
    err(res, error.message, 500);
  }
};


// ----------------------------
// GET GROUP INFO BY GROUP ID
// ----------------------------
export const getGroupInfo = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId)
      .populate("participants", "_id name avatar")
      .populate("admin", "_id name avatar");

    if (!group) return err(res, "Group not found", 404);

    const responseGroup = {
      _id: group._id,
      name: group.name,
      description: group.description,
      isGroup: true,
      chat: group.chat,
      icon: group.icon || "",
      participants: group.participants || [],
      admins: [group.admin] || [],
      groupAdmin: group.admin || null,
    };

    return ok(res, responseGroup);
  } catch (error) {
    err(res, error.message, 500);
  }
};