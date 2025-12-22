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
    const { 
      name, 
      description, 
      avatarBase64,
      inviteLink,
      inviteEnabled,
      permissions = {},
      features = {}
    } = req.body;
    
    const adminId = req.user._id;

    console.log("📥 Received group creation request:");
    console.log("- Name:", name);
    console.log("- inviteEnabled:", inviteEnabled, typeof inviteEnabled);
    console.log("- Permissions:", permissions);
    console.log("- Features:", features);

    if (!name) return err(res, "Group name is required");

    // Handle avatar upload if provided
    let avatarUrl = "";
    if (avatarBase64) {
      try {
        avatarUrl = avatarBase64;
      } catch (uploadError) {
        console.error("Avatar upload failed:", uploadError);
      }
    }

    // Generate invite link if enabled
    let finalInviteLink = "";
    if (inviteEnabled) {
      if (inviteLink) {
        finalInviteLink = inviteLink;
      } else {
        const token = crypto.randomBytes(16).toString("hex");
        finalInviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite/group-${token}`;
      }
    }

    const chat = await Chat.create({
      isGroupChat: true,
      participants: [adminId]
    });

    // ✅ Create group with all settings - EXPLICIT VALUES
    const groupData = {
      name: name.trim(),
      description: description || "",
      avatar: avatarUrl,
      icon: avatarUrl,
      participants: [adminId],
      admin: adminId,
      admins: [adminId],
      chat: chat._id,
      inviteLink: finalInviteLink,
      inviteEnabled: inviteEnabled === true, // Explicit boolean
      
      // ✅ Save permissions with explicit boolean conversion
      permissions: {
        allowCreatorAdmin: permissions.allowCreatorAdmin === true || permissions.allowCreatorAdmin === undefined,
        allowOthersAdmin: permissions.allowOthersAdmin === true,
        allowMembersAdd: permissions.allowMembersAdd === true || permissions.allowMembersAdd === undefined,
      },
      
      // ✅ Save features with explicit boolean conversion
      features: {
        media: features.media === true || features.media === undefined,
        gallery: features.gallery === true || features.gallery === undefined,
        docs: features.docs === true || features.docs === undefined,
        polls: features.polls === true || features.polls === undefined,
      },
    };

    console.log("💾 Saving group with data:");
    console.log("- inviteEnabled:", groupData.inviteEnabled, typeof groupData.inviteEnabled);
    console.log("- Permissions:", groupData.permissions);
    console.log("- Features:", groupData.features);

    const group = await Group.create(groupData);

    console.log("✅ Group saved to database:");
    console.log("- ID:", group._id);
    console.log("- inviteEnabled:", group.inviteEnabled, typeof group.inviteEnabled);
    console.log("- Permissions:", group.permissions);
    console.log("- Features:", group.features);

    // Emit socket event to participants
    try {
      const { getSocketIOInstance } = await import('../services/scheduledMessageCron.js');
      const io = getSocketIOInstance();
      const payload = {
        _id: group._id,
        id: group._id,
        chat: group.chat,
        chatId: group.chat,
        name: group.name,
        description: group.description,
        participants: group.participants || [],
        admin: group.admin,
        admins: group.admins,
        avatar: group.avatar,
        inviteLink: group.inviteLink,
        inviteEnabled: group.inviteEnabled,
        permissions: group.permissions,
        features: group.features,
      };
      
      if (io && Array.isArray(payload.participants)) {
        payload.participants.forEach(p => {
          try { io.to(String(p)).emit('group created', payload); } catch (e) {}
        });
        try { io.to(String(group.chat)).emit('group created', payload); } catch (e) {}
      }
    } catch (e) {
      console.error('group.controller: failed to emit group created', e);
    }

    return ok(res, { message: "Group created", group });
  } catch (error) {
    console.error("❌ Create group error:", error);
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

    // Add to admins array if not already there
    if (!group.admins.includes(newAdminId)) {
      group.admins.push(newAdminId);
      await group.save();
    }

    return ok(res, { message: "Admin added", group });
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
    console.log("User", userId, "is exiting group", groupId);

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
      .populate("participants", "_id name avatar email username")
      .populate("admin", "_id name avatar email username")
      .populate("admins", "_id name avatar email username");

    if (!group) return err(res, "Group not found", 404);

    console.log("📤 Sending group info:", {
      _id: group._id,
      name: group.name,
      inviteEnabled: group.inviteEnabled,
      inviteLink: group.inviteLink,
      permissions: group.permissions,
      features: group.features
    });

    const responseGroup = {
      _id: group._id,
      name: group.name,
      description: group.description,
      isGroup: true,
      chat: group.chat,
      icon: group.icon || group.avatar || "",
      avatar: group.avatar || group.icon || "",
      participants: group.participants || [],
      admins: group.admins || [group.admin],
      groupAdmin: group.admin || null,
      admin: group.admin || null,
      
      // ✅ Explicitly include settings
      inviteLink: group.inviteLink || "",
      inviteEnabled: Boolean(group.inviteEnabled),
      permissions: {
        allowCreatorAdmin: group.permissions?.allowCreatorAdmin !== false,
        allowOthersAdmin: Boolean(group.permissions?.allowOthersAdmin),
        allowMembersAdd: group.permissions?.allowMembersAdd !== false,
      },
      features: {
        media: group.features?.media !== false,
        gallery: group.features?.gallery !== false,
        docs: group.features?.docs !== false,
        polls: group.features?.polls !== false,
      },
    };

    return ok(res, responseGroup);
  } catch (error) {
    console.error("Get group info error:", error);
    err(res, error.message, 500);
  }
};