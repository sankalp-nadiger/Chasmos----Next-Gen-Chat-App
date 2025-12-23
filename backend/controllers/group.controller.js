import Group from "../models/group.model.js";
import Chat from "../models/chat.model.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
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
      features = {},
      isPublic = false,
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

    // Normalize inviteEnabled (accept true, 'true', '1', 1)
    const inviteEnabledBool =
      inviteEnabled === true || inviteEnabled === "true" || inviteEnabled === "1" || inviteEnabled === 1;

    // Generate invite link if enabled
    let finalInviteLink = "";
    if (inviteEnabledBool) {
      if (inviteLink) {
        finalInviteLink = inviteLink;
      } else {
        const token = crypto.randomBytes(16).toString("hex");
        finalInviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite/group-${token}`;
      }
    }

    // Idempotency: if a chat/group with same name and participants exists, reuse it
    let chat = null;
    try {
      const existingChat = await Chat.findOne({
        isGroupChat: true,
        'groupSettings.description': description || '',
        participants: { $all: [adminId] },
      }).lean();
      if (existingChat) {
        chat = await Chat.findById(existingChat._id);
      }
    } catch (e) {
      console.warn('group.controller: idempotency check failed', e && e.message);
    }

    if (!chat) {
      chat = await Chat.create({
        isGroupChat: true,
        participants: [adminId]
      });
    }

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
      inviteEnabled: inviteEnabledBool === true, // Explicit boolean
      
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

    // Ensure the related Chat document has matching groupSettings (invite link, allowInvites, avatar, description)
    try {
      const maxMembers = 100;
      await Chat.findByIdAndUpdate(
        chat._id,
        {
          $set: {
            'groupSettings.inviteLink': finalInviteLink || null,
            'groupSettings.allowInvites': inviteEnabledBool === true,
            'groupSettings.avatar': avatarUrl || null,
            'groupSettings.description': description || '',
            'groupSettings.isPublic': Boolean(isPublic),
            'groupSettings.maxMembers': maxMembers,
          },
        },
        { new: true }
      );
    } catch (e) {
      console.warn('Failed to update Chat.groupSettings after group creation:', e && e.message);
    }

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

    // Create a system message announcing the join and emit to chat participants
    try {
      const user = await User.findById(userId).select('name avatar');
      const actorName = user?.name || 'A user';

      const created = await Message.create({
        sender: userId,
        content: `${actorName} joined the group`,
        type: 'system',
        chat: group.chat,
      });

      const populated = await Message.findById(created._id)
        .populate('sender', 'name avatar email')
        .populate('attachments')
        .populate('chat');

      try {
        const { getSocketIOInstance } = await import('../services/scheduledMessageCron.js');
        const io = getSocketIOInstance();
        if (io && group && group.chat) {
          io.to(String(group.chat)).emit('message recieved', populated);
          const users = (group.participants && group.participants.length) ? group.participants : [];
          users.forEach(u => {
            try { io.to(String(u)).emit('message recieved', populated); } catch (e) {}
          });
        }
      } catch (e) {
        console.warn('joinGroup: failed to emit socket event', e && e.message);
      }
    } catch (e) {
      console.warn('joinGroup: failed to create system message', e && e.message);
    }

    return ok(res, { message: "Joined group successfully", group });
  } catch (error) {
    err(res, error.message, 500);
  }
};

// Get group info by invite link (returns a small summary)
export const getGroupByInviteLink = async (req, res) => {
  try {
    const { inviteLink } = req.query;
    if (!inviteLink) return err(res, 'inviteLink query is required');

    const group = await Group.findOne({ inviteLink })
      .populate('participants', '_id name avatar email')
      .populate('admin', '_id name avatar');

    if (!group) return err(res, 'Invite not found', 404);

    const localUser = req.user ? req.user._id : null;
    const currentUserInGroup = localUser ? (group.participants || []).some(p => String(p._id || p) === String(localUser)) : false;

    const out = {
      _id: group._id,
      name: group.name,
      description: group.description || '',
      participants: (group.participants || []).map(p => ({ _id: p._id, name: p.name, avatar: p.avatar })),
      participantsCount: (group.participants || []).length,
      inviteLink: group.inviteLink,
      currentUserInGroup,
    };

    return ok(res, out);
  } catch (e) {
    err(res, e.message, 500);
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

    if (!group.admin || String(group.admin) !== String(userId))
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

    if (!group.admin || String(group.admin) !== String(userId))
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

    if (!group.admin || String(group.admin) !== String(userId))
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
    // Accept either `groupId` (Group._id) or `chatId` (Chat._id) from frontend for convenience
    const { groupId: incomingId } = req.body;
    let groupId = incomingId;
    const userId = req.user._id;
    console.log("exitGroup called. body:", req.body);
    console.log("User", userId, "is attempting to exit group", groupId);

    // Try to resolve Group by id or by linked chat id
    let group = null;
    if (groupId) {
      group = await Group.findById(groupId);
    }
    // If not found and an id was provided, it might be a chatId — try lookup
    if (!group && incomingId) {
      group = await Group.findOne({ chat: incomingId });
      if (group) groupId = String(group._id);
    }

    if (!group) return err(res, "Group not found");

    console.warn('exitGroup: resolved group', { groupId: String(group._id), receivedId: incomingId });

    const participantStrings = Array.isArray(group.participants) ? group.participants.map(p => String(p)) : [];
    if (!participantStrings.includes(String(userId))) {
      console.warn('exitGroup: user not in group', { groupId: String(group._id), userId: String(userId) });
      return err(res, "User not in group");
    }

    // Prevent sole admin from leaving without promoting someone else
    const userIdStr = userId.toString();
    const adminsArr = Array.isArray(group.admins) ? group.admins : (group.admin ? [group.admin] : []);
    const isAdminMember = adminsArr.some(a => a && a.toString() === userIdStr) || (group.admin && group.admin.toString() === userIdStr);
    if (isAdminMember) {
      const otherAdmins = adminsArr.filter(a => a && a.toString() !== userIdStr);
      if (otherAdmins.length === 0) {
        console.warn('exitGroup: user is sole admin and cannot exit without promoting another member', { groupId: String(group._id), userId: userIdStr });
        return err(res, "You are the only admin in this group. Please promote another member to admin before leaving.", 400);
      }
    }

    // Remove user from participants and admins arrays
    group.participants = Array.isArray(group.participants)
      ? group.participants.filter((id) => String(id) !== userIdStr)
      : [];
    if (Array.isArray(group.admins)) {
      group.admins = group.admins.filter(a => a && a.toString() !== userIdStr);
    }

    // Record that this user left and when (parallel arrays)
    try {
      group.leftBy = Array.isArray(group.leftBy) ? group.leftBy : [];
      group.leftAt = Array.isArray(group.leftAt) ? group.leftAt : [];
      group.leftBy.push(userId);
      group.leftAt.push(new Date());
    } catch (e) {
      console.warn('exitGroup: failed to record leftBy/leftAt', e && e.message);
    }

    // If leaving user was primary admin, set a new primary admin from remaining admins (or participants)
    if (group.admin && group.admin.toString() === userIdStr) {
      const remainingAdmins = Array.isArray(group.admins) ? group.admins : [];
      group.admin = (remainingAdmins[0] && remainingAdmins[0]) || (group.participants[0] || null);
      console.log('exitGroup: primary admin left, new admin set to', String(group.admin));
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

    if (!group.admin || String(group.admin) !== String(userId))
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

    // Try find by Group._id first, then fallback to chat id (some callers pass chatId)
    let group = null;
    if (groupId) {
      try {
        group = await Group.findById(groupId)
          .populate("participants", "_id name avatar email username")
          .populate("admin", "_id name avatar email username")
          .populate("admins", "_id name avatar email username");
      } catch (e) {
        // ignore and try chat lookup
        group = null;
      }
    }

    if (!group && groupId) {
      group = await Group.findOne({ chat: groupId })
        .populate("participants", "_id name avatar email username")
        .populate("admin", "_id name avatar email username")
        .populate("admins", "_id name avatar email username");
    }

    if (!group) return err(res, "Group not found", 404);

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
      // include creation timestamps to help frontend show a created date
      createdAt: group.createdAt || null,
      createdAtIso: group.createdAt ? (new Date(group.createdAt)).toISOString() : null,
      createdAtFormatted: group.createdAt ? (new Date(group.createdAt)).toLocaleString() : null,
    };

    return ok(res, responseGroup);
  } catch (error) {
    console.error("Get group info error:", error);
    err(res, error.message, 500);
  }
};