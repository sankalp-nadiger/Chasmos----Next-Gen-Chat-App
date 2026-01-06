import Group from "../models/group.model.js";
import Chat from "../models/chat.model.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import crypto from "crypto";
import { uploadBase64ImageToSupabase } from "../utils/uploadToSupabase.js";

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

    // Normalize incoming participants (accept array of ids or objects)
    const incomingParticipants = Array.isArray(req.body.participants) ? req.body.participants : [];
    const normalizedExtraParticipants = incomingParticipants
      .map(p => (p && (p._id || p.id || p.userId)) ? (p._id || p.id || p.userId) : p)
      .filter(Boolean)
      .map(String);

    // Ensure admin is included and dedupe
    const initialParticipantsSet = new Set([String(adminId), ...normalizedExtraParticipants]);

    // ✅ Create group with all settings - EXPLICIT VALUES
    const groupData = {
      name: name.trim(),
      description: description || "",
      avatar: avatarUrl,
      icon: avatarUrl,
      participants: Array.from(initialParticipantsSet),
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

    const group = await Group.create(groupData);

    // Record initial joinedBy/joinedAt entries for all initial participants
    try {
      group.joinedBy = Array.isArray(group.participants) ? group.participants.map(p => p) : [];
      const now = new Date();
      group.joinedAt = group.joinedBy.map(() => now);
      await group.save();
    } catch (e) {
      console.warn('createGroup: failed to record joinedBy/joinedAt', e && e.message);
    }

    // Ensure the related Chat document has matching groupSettings (invite link, allowInvites, avatar, description)
    try {
      const maxMembers = 100;
      const setObj = {
        'groupSettings.allowInvites': inviteEnabledBool === true,
        'groupSettings.avatar': avatarUrl || null,
        'groupSettings.description': description || '',
        'groupSettings.isPublic': Boolean(isPublic),
        'groupSettings.maxMembers': maxMembers,
      };
      const unsetObj = {};
      if (finalInviteLink) setObj['groupSettings.inviteLink'] = finalInviteLink;
      else unsetObj['groupSettings.inviteLink'] = "";

      const updateObj = {};
      if (Object.keys(setObj).length) updateObj.$set = setObj;
      if (Object.keys(unsetObj).length) updateObj.$unset = unsetObj;

      if (Object.keys(updateObj).length) {
        await Chat.findByIdAndUpdate(chat._id, updateObj, { new: true });
      }
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

    // If caller provided an initial participants list in the request body,
    // add them to the group and notify each via their personal 1:1 chat.
    try {
      const actorId = adminId;
      const participantIds = (Array.isArray(group.participants) ? group.participants : []).map(p => String(p));
      for (const pidStr of participantIds) {
        if (!pidStr) continue;
        if (String(actorId) === pidStr) continue;

        // ensure chat participants updated
        try {
          await Chat.findByIdAndUpdate(group.chat, { $addToSet: { participants: pidStr } });
        } catch (e) {}

        // create personal system message for this participant
        try {
          const actor = await User.findById(actorId).select('name avatar');
          const addedUser = await User.findById(pidStr).select('name avatar');
          let personalChat = await Chat.findOne({ isGroupChat: false, participants: { $all: [actorId, pidStr] } });
          if (!personalChat) {
            personalChat = await Chat.create({ chatName: 'private', isGroupChat: false, users: [actorId, pidStr], participants: [actorId, pidStr] });
          }
          const msgContent = `${actor?.name || 'A user'} added ${addedUser?.name || 'a user'} to the group ${group.name}`;
          const created = await Message.create({ sender: actorId, content: msgContent, type: 'system', chat: personalChat._id });
          const populated = await Message.findById(created._id).populate('sender', 'name avatar email').populate('attachments').populate('chat');
          try {
            const { getSocketIOInstance } = await import('../services/scheduledMessageCron.js');
            const io = getSocketIOInstance();
            if (io) {
              io.to(String(personalChat._id)).emit('message recieved', populated);
              try { io.to(String(pidStr)).emit('message recieved', populated); } catch (e) {}
            }
          } catch (e) {
            console.warn('createGroup: failed to emit personal system message', e && e.message);
          }
        } catch (e) {
          console.warn('createGroup: failed to create personal system message for participant', pidStr, e && e.message);
        }
      }
      // persist any participant additions (group already created with participants)
      await group.save();
    } catch (e) {
      console.warn('createGroup: processing participants failed', e && e.message);
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
    // Record joinedBy/joinedAt for this member
    try {
      group.joinedBy = Array.isArray(group.joinedBy) ? group.joinedBy : [];
      group.joinedAt = Array.isArray(group.joinedAt) ? group.joinedAt : [];
      group.joinedBy.push(userId);
      group.joinedAt.push(new Date());
    } catch (e) {
      console.warn('addMember: failed to record joinedBy/joinedAt', e && e.message);
    }
    await group.save();

    // Notify the user who exited themselves (exitGroup caller) so their UI updates immediately
    try {
      const { getSocketIOInstance } = await import('../services/scheduledMessageCron.js');
      const io = getSocketIOInstance();
      if (io) {
        const safeId = (item) => {
          if (!item) return null;
          try {
            if (typeof item === 'string') return item;
            if (item._id) return String(item._id);
            if (item.id) return String(item.id);
            return String(item);
          } catch (e) {
            return null;
          }
        };
        const payload = {
          chatId: safeId(group.chat) || null,
          groupId: safeId(group._id) || null,
          removedUserId: String(userId),
          message: 'You left the group',
          group: {
            _id: group._id,
            name: group.name,
            participants: group.participants || [],
          }
        };
        try {
          io.to(String(userId)).emit('removed from group', payload);
          console.log('[SOCKET] emitted "removed from group" to (self-exit)', String(userId), 'chatId=', payload.chatId);
        } catch (e) { console.warn('exitGroup: emit removed from group failed', e && e.message); }
      }
    } catch (e) { console.warn('exitGroup: failed to emit removed event', e && e.message); }

    // Ensure both participants and users arrays on Chat are updated (keep in sync)
    try {
      await Chat.findByIdAndUpdate(group.chat, {
        $addToSet: { participants: userId, users: userId },
      });
    } catch (e) {
      // fallback to push if addToSet fails for any reason
      try { await Chat.findByIdAndUpdate(group.chat, { $push: { participants: userId } }); } catch (ee) {}
    }

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
      // mark system message so clients skip using it as recent-chat preview
      populated.skipPreview = true;
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

    // snapshot of participants before applying changes (used for notifications)
    const priorParticipants = Array.isArray(group.participants) ? group.participants.map(p => String(p)) : [];

    if (!group.admin || String(group.admin) !== String(userId))
      return err(res, "Only admin can regenerate link", 403);

    // Build a full invite URL similar to group creation flow
    const token = crypto.randomBytes(16).toString("hex");
    const newLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite/group-${token}`;
    group.inviteLink = newLink;
    // Ensure invite is enabled when regenerating a link
    group.inviteEnabled = true;
    await group.save();

    // Return both inviteLink and updated group for frontend convenience
    return ok(res, { inviteLink: newLink, group });
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
    console.log("addMember called with groupId:", groupId, "userId:", userId);

    const group = await Group.findById(groupId);
    if (!group) return err(res, "Group not found");

    if (group.participants.includes(userId))
      return err(res, "User already in group");

    group.participants.push(userId);
    // Record joinedBy/joinedAt for this member (invite join)
    try {
      group.joinedBy = Array.isArray(group.joinedBy) ? group.joinedBy : [];
      group.joinedAt = Array.isArray(group.joinedAt) ? group.joinedAt : [];
      group.joinedBy.push(userId);
      group.joinedAt.push(new Date());
    } catch (e) {
      console.warn('joinGroupByInviteLink: failed to record joinedBy/joinedAt', e && e.message);
    }
    await group.save();

    // Create a system message in the GROUP chat announcing the addition
    // and emit it to the group room and each participant so the messages
    // area updates immediately for all users.
    try {
      const actorId = req.user._id;
      const actor = await User.findById(actorId).select('name avatar');
      const addedUser = await User.findById(userId).select('name avatar');

      const msgContent = `${actor?.name || 'A user'} added ${addedUser?.name || 'a user'}`;

      // Compute excludeUsers: participants other than the target user and admins
      const adminSetLocal = new Set();
      if (group.admin) adminSetLocal.add(String(group.admin));
      if (Array.isArray(group.admins)) group.admins.forEach(a => { if (a) adminSetLocal.add(String(a)); });
      const excludeUsersList = (group.participants || []).map(p => String(p)).filter(pid => pid && pid !== String(userId) && !adminSetLocal.has(pid));

      const created = await Message.create({
        sender: actorId,
        content: msgContent,
        type: 'system',
        chat: group.chat,
        excludeUsers: excludeUsersList,
      });

      const populated = await Message.findById(created._id)
        .populate('sender', 'name avatar email')
        .populate('attachments')
        .populate('chat');

      try {
        const { getSocketIOInstance } = await import('../services/scheduledMessageCron.js');
        const io = getSocketIOInstance();
        if (io && group && group.chat) {
          // mark this system message so clients can skip updating previews
          populated.skipPreview = true;

          // Emit only to admins and the newly added user so personal views update.
          // Do NOT broadcast to the whole room here to avoid exposing the system message to excluded users in real-time.
          const adminIdsLocal = [];
          if (group.admin) adminIdsLocal.push(String(group.admin));
          if (Array.isArray(group.admins)) group.admins.forEach(a => { if (a) adminIdsLocal.push(String(a)); });
          const emitTargets = new Set([...adminIdsLocal, String(userId)]);
          emitTargets.forEach(id => {
            try { io.to(String(id)).emit('message recieved', populated); } catch (e) {}
          });
        }
      } catch (e) {
        console.warn('addMember: failed to emit group system message', e && e.message);
      }
    } catch (e) {
      console.warn('addMember: failed to create group system message', e && e.message);
    }

    // Emit an "added to group" event specifically to the newly added user
    try {
      const { getSocketIOInstance } = await import('../services/scheduledMessageCron.js');
      const io = getSocketIOInstance();
      if (io) {
        const chat = await Chat.findById(group.chat).lean().catch(() => null);
        const safeId = (item) => {
          if (!item) return null;
          try {
            if (typeof item === 'string') return item;
            if (item._id) return String(item._id);
            if (item.id) return String(item.id);
            return String(item);
          } catch (e) {
            return null;
          }
        };

        // If the chat document already contains the user in its `users`/`participants`,
        // do not emit the `added to group` event to avoid duplicate client-side inserts.
        const chatMembers = (chat && (chat.users || chat.participants) ? (chat.users || chat.participants) : []);
        const isAlreadyMember = chatMembers && chatMembers.length ? chatMembers.map(u => safeId(u)).filter(Boolean).includes(String(userId)) : false;

        const usersArr = (chat && (chat.users || chat.participants) ? (chat.users || chat.participants) : (group.participants || [])).map(u => safeId(u)).filter(Boolean);
        const participantsArr = (group.participants || []).map(p => safeId(p)).filter(Boolean);
        const adminsArr = (group.admins || []).map(a => safeId(a)).filter(Boolean);

        const payload = {
          _id: safeId(group._id) || null,
          id: safeId(group._id) || null,
          chat: safeId(group.chat) || null,
          chatId: safeId(group.chat) || null,
          chatName: group.name || '',
          name: group.name || '',
          isGroupChat: true,
          users: usersArr,
          participants: participantsArr,
          admins: adminsArr,
          groupAdmin: group.admin ? safeId(group.admin) : null,
          groupSettings: (chat && chat.groupSettings) || {},
          avatar: (chat && chat.groupSettings && chat.groupSettings.avatar) || group.avatar || '',
        };

        try {
          if (isAlreadyMember) {
              console.log('[SOCKET] skipping "added to group" emit for user', String(userId), 'because they are already in chat participants');
              try {
                const payload2 = {
                  _id: safeId(group._id) || null,
                  id: safeId(group._id) || null,
                  chat: safeId(group.chat) || null,
                  chatId: safeId(group.chat) || null,
                  chatName: group.name || '',
                  name: group.name || '',
                  isGroupChat: true,
                  users: usersArr,
                  participants: participantsArr,
                  admins: adminsArr,
                  groupAdmin: group.admin ? safeId(group.admin) : null,
                };
                // Emit a lightweight fallback event so clients that missed the
                // main "added to group" flow can update their UI (re-enable
                // inputs, mark membership, join room).
                io.to(String(userId)).emit('addedtogroup2', payload2);
                console.log('[SOCKET] emitted "addedtogroup2" to user', String(userId), 'chatId=', payload2.chatId);
              } catch (emitErr) {
                /* ignore emit errors */
              }
            } else {
              console.log('[SOCKET] emitting "added to group" to user', String(userId), 'payload chatId=', payload.chatId, 'avatar=', payload.avatar);
              io.to(String(userId)).emit('added to group', payload);
            }
        } catch (e) { /* ignore emit errors */ }
      }
    } catch (e) {
      console.warn('addMember: failed to emit added to group event', e && e.message);
    }

        // Ensure Chat document reflects the new member in both `participants` and `users`
    // use $addToSet to avoid duplicates
    try {
      await Chat.findByIdAndUpdate(group.chat, {
        $addToSet: { participants: userId, users: userId },
      });
    } catch (e) {
      // fallback to $push if $addToSet fails for any reason
      try {
        await Chat.findByIdAndUpdate(group.chat, { $push: { participants: userId } });
      } catch (ee) {}
    }
    
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
    console.log("removeMember called with body:", req.body);
    const { groupId, memberId } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return err(res, "Group not found");

    if (!group.admin || String(group.admin) !== String(userId))
      return err(res, "Only admin can remove members", 403);
    // Build a list of admin ids (primary admin + admins array)
    const adminSet = new Set();
    if (group.admin) adminSet.add(String(group.admin));
    if (Array.isArray(group.admins)) group.admins.forEach(a => { if (a) adminSet.add(String(a)); });
    const adminIds = Array.from(adminSet);

    // Precompute excludeUsers for removal: participants other than the removed member and admins
    const adminSetLocal = new Set();
    if (group.admin) adminSetLocal.add(String(group.admin));
    if (Array.isArray(group.admins)) group.admins.forEach(a => { if (a) adminSetLocal.add(String(a)); });
    const excludeUsersForRemove = (group.participants || []).map(p => String(p)).filter(pid => pid && pid !== String(memberId) && !adminSetLocal.has(pid));

    // Emit 'removed from group' BEFORE creating the system message so clients
    // receive the removal event immediately (pre-removal state). Add logs
    // to help debug delivery issues.
    try {
      const { getSocketIOInstance } = await import('../services/scheduledMessageCron.js');
      const io = getSocketIOInstance();
      if (io) {
        const safeId = (item) => {
          if (!item) return null;
          try {
            if (typeof item === 'string') return item;
            if (item._id) return String(item._id);
            if (item.id) return String(item.id);
            return String(item);
          } catch (e) {
            return null;
          }
        };

        const prePayload = {
          chatId: safeId(group.chat) || null,
          groupId: safeId(group._id) || null,
          removedUserId: String(memberId),
          message: 'A member was removed from the group',
          group: {
            _id: group._id,
            name: group.name,
            participants: group.participants || [],
          },
          excludeUsers: excludeUsersForRemove
        };

        console.log('[SOCKET] removeMember: pre-remove emit prepared', { chatId: prePayload.chatId, groupId: prePayload.groupId, removedUserId: prePayload.removedUserId, excludeUsers: prePayload.excludeUsers });

        try {
          io.to(String(memberId)).emit('removed from group', prePayload);
          console.log('[SOCKET] removeMember: pre-remove emitted to removed user', String(memberId));
        } catch (e) {
          console.warn('removeMember: pre-remove emit to removed user failed', e && e.message);
        }

        try {
          const notifyTargets = new Set();
          if (group.admin) notifyTargets.add(String(group.admin));
          if (Array.isArray(group.admins)) group.admins.forEach(a => { if (a) notifyTargets.add(String(a)); });
          (group.participants || []).forEach(p => { if (p) notifyTargets.add(String(p)); });
          notifyTargets.delete(String(memberId));

          notifyTargets.forEach(id => {
            try { io.to(String(id)).emit('removed from group', prePayload); } catch (e) {}
          });

          try { io.to(String(safeId(group.chat))).emit('removed from group', prePayload); } catch (e) {}
        } catch (e) {
          console.warn('removeMember: pre-remove notify failed', e && e.message);
        }
      }
    } catch (e) {
      console.warn('removeMember: failed to perform pre-remove emit', e && e.message);
    }

    // Create a system message in the GROUP chat announcing the removal
    // and EMIT IT BEFORE actually removing the member from the group.
    try {
      const actor = await User.findById(userId).select('name avatar');
      const target = await User.findById(memberId).select('name avatar');
      const content = `${actor?.name || 'Someone'} removed ${target?.name || 'a member'} from the group`;
      console.log('removeMember: excludeUsersForRemove ->', excludeUsersForRemove);
      const created = await Message.create({ sender: userId, content, type: 'system', chat: group.chat, excludeUsers: excludeUsersForRemove });
      // Debug: refetch raw saved document to inspect stored fields
      try {
        const raw = await Message.findById(created._id).lean();
        console.log('removeMember: raw created message in DB:', { id: created._id, excludeUsers: raw && raw.excludeUsers });
      } catch (e) {
        console.warn('removeMember: failed to read created message for debug', e && e.message);
      }
      const populatedMsg = await Message.findById(created._id).populate('sender', 'name avatar email').populate('attachments').populate('chat');
      // instruct clients not to use this system message as recent chat preview
      populatedMsg.skipPreview = true;
      try {
        const { getSocketIOInstance } = await import('../services/scheduledMessageCron.js');
        const io = getSocketIOInstance();
        if (io && group && group.chat) {
          // Emit to the chat room so the group's message area updates
          // Emit the system message to the room; clients may filter by `excludeUsers` on fetch
          io.to(String(group.chat)).emit('message recieved', populatedMsg);

          // Emit only to admins and the removed user so their personal views update
          const emitTargets = new Set([...adminIds, String(memberId)]);
          emitTargets.forEach(id => {
            try { io.to(String(id)).emit('message recieved', populatedMsg); } catch (e) {}
          });
        }
      } catch (e) {
        console.warn('removeMember: failed to emit system message', e && e.message);
      }
    } catch (e) {
      console.warn('removeMember: failed to create system message', e && e.message);
    }

    // Now remove the member from participants and admins, then persist
    group.participants = Array.isArray(group.participants)
      ? group.participants.filter((id) => id.toString() !== memberId.toString())
      : [];
    if (Array.isArray(group.admins)) {
      group.admins = group.admins.filter(a => String(a) !== String(memberId));
    }
    if (group.admin && String(group.admin) === String(memberId)) {
      group.admin = (Array.isArray(group.admins) && group.admins.length) ? group.admins[0] : null;
    }

    // Record that this user was removed (leftBy/leftAt arrays kept in parallel)
    try {
      group.leftBy = Array.isArray(group.leftBy) ? group.leftBy : [];
      group.leftAt = Array.isArray(group.leftAt) ? group.leftAt : [];
      group.leftBy.push(memberId);
      group.leftAt.push(new Date());
    } catch (e) {
      console.warn('removeMember: failed to record leftBy/leftAt', e && e.message);
    }

    await group.save();

    // After removing member, emit a 'removed from group' event to the removed user so their UI updates immediately
    try {
      const { getSocketIOInstance } = await import('../services/scheduledMessageCron.js');
      const io = getSocketIOInstance();
      if (io) {
        const safeId = (item) => {
          if (!item) return null;
          try {
            if (typeof item === 'string') return item;
            if (item._id) return String(item._id);
            if (item.id) return String(item.id);
            return String(item);
          } catch (e) {
            return null;
          }
        };

        const payload = {
          chatId: safeId(group.chat) || null,
          groupId: safeId(group._id) || null,
          removedUserId: String(memberId),
          message: 'You were removed from the group',
          group: {
            _id: group._id,
            name: group.name,
            participants: group.participants || [],
          }
        };

        try {
          // include excludeUsers so client can know which users should not see the system message
          payload.excludeUsers = excludeUsersForRemove;
          console.log('[SOCKET] emitting "removed from group" to', String(memberId), 'payload:', { chatId: payload.chatId, groupId: payload.groupId, excludeUsers: payload.excludeUsers });
          io.to(String(memberId)).emit('removed from group', payload);
          console.log('[SOCKET] emitted "removed from group" to', String(memberId), 'chatId=', payload.chatId);
        } catch (e) {
          console.warn('removeMember: emit removed from group failed', e && e.message);
        }
      }
    } catch (e) {
      console.warn('removeMember: failed to emit removed event', e && e.message);
    }

    // Return a populated group so frontend receives participant objects (name/avatar)
    try {
      const populatedGroup = await Group.findById(group._id)
        .populate("participants", "_id name avatar email username")
        .populate("admin", "_id name avatar email username")
        .populate("admins", "_id name avatar email username");
      return ok(res, { message: "Member removed", group: populatedGroup });
    } catch (e) {
      // fallback: return the raw group if populate fails
      console.warn('removeMember: failed to populate group before return', e && e.message);
      return ok(res, { message: "Member removed", group });
    }
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

    // Also update chat document admins
    try {
      if (group.chat) {
        await Chat.findByIdAndUpdate(group.chat, { $addToSet: { admins: newAdminId } });
      }
    } catch (e) {
      console.error('Failed to sync admin to Chat:', e);
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

    // Create a system message announcing the user will leave and emit to all current participants (including the leaving user)
    try {
      const user = await User.findById(userId).select('name avatar');
      const actorName = user?.name || 'A user';

      const created = await Message.create({
        sender: userId,
        content: `${actorName} left the group`,
        type: 'system',
        chat: group.chat,
      });

      const populated = await Message.findById(created._id)
        .populate('sender', 'name avatar email')
        .populate('attachments')
        .populate('chat');
      // mark system message so clients skip using it as recent-chat preview
      populated.skipPreview = true;
      try {
        const { getSocketIOInstance } = await import('../services/scheduledMessageCron.js');
        const io = getSocketIOInstance();
        if (io && group && group.chat) {
          // Emit to the chat room
          io.to(String(group.chat)).emit('message recieved', populated);

          // Emit to each current participant (this includes the leaving user)
          const users = (group.participants && group.participants.length) ? group.participants : [];
          users.forEach(u => {
            try { io.to(String(u)).emit('message recieved', populated); } catch (e) {}
          });
        }
      } catch (e) {
        console.warn('exitGroup: failed to emit socket event', e && e.message);
      }
    } catch (e) {
      console.warn('exitGroup: failed to create system message', e && e.message);
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

    // Do NOT modify Chat.participants here — keep Chat as-is per request.

    // Emit a 'removed from group' event to the leaving user so their UI updates immediately
    try {
      const { getSocketIOInstance } = await import('../services/scheduledMessageCron.js');
      const io = getSocketIOInstance();
      if (io) {
        const safeId = (item) => {
          if (!item) return null;
          try {
            if (typeof item === 'string') return item;
            if (item._id) return String(item._id);
            if (item.id) return String(item.id);
            return String(item);
          } catch (e) {
            return null;
          }
        };

        const payload = {
          chatId: safeId(group.chat) || null,
          groupId: safeId(group._id) || null,
          removedUserId: String(userId),
          message: 'You left the group',
          group: {
            _id: group._id,
            name: group.name,
            participants: group.participants || [],
          }
        };

        try {
          io.to(String(userId)).emit('removed from group', payload);
          console.log('[SOCKET] emitted "removed from group" to (self-exit)', String(userId), 'chatId=', payload.chatId);
        } catch (e) {
          console.warn('exitGroup: emit removed from group failed', e && e.message);
        }
      }
    } catch (e) { console.warn('exitGroup: failed to emit removed event', e && e.message); }

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


// ----------------------------
// UPDATE GROUP SETTINGS
// ----------------------------
export const updateGroupSettings = async (req, res) => {
  try {
    const { groupId, inviteEnabled, inviteLink, permissions, features, promoteIds, removeIds, avatarBase64, clearAvatar, name } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return err(res, "Group not found");

    // Only admins can update settings
    const isAdmin = (group.admin && group.admin.toString() === userId.toString()) || (Array.isArray(group.admins) && group.admins.map(a=>String(a)).includes(String(userId)));
    if (!isAdmin) return err(res, "Only admins can update group settings", 403);

    if (name !== undefined && typeof name === 'string' && name.trim()) group.name = name.trim();
    if (inviteEnabled !== undefined) group.inviteEnabled = !!inviteEnabled;
    if (inviteLink !== undefined) group.inviteLink = inviteLink;

    if (permissions && typeof permissions === 'object') {
      group.permissions = group.permissions || {};
      if (permissions.allowCreatorAdmin !== undefined) group.permissions.allowCreatorAdmin = !!permissions.allowCreatorAdmin;
      if (permissions.allowOthersAdmin !== undefined) group.permissions.allowOthersAdmin = !!permissions.allowOthersAdmin;
      if (permissions.allowMembersAdd !== undefined) group.permissions.allowMembersAdd = !!permissions.allowMembersAdd;
      group.markModified('permissions'); // Mark nested object as modified for Mongoose
    }

    if (features && typeof features === 'object') {
      group.features = group.features || {};
      if (features.media !== undefined) group.features.media = !!features.media;
      if (features.gallery !== undefined) group.features.gallery = !!features.gallery;
      if (features.docs !== undefined) group.features.docs = !!features.docs;
      if (features.polls !== undefined) group.features.polls = !!features.polls;
      group.markModified('features'); // Mark nested object as modified for Mongoose
    }

    // Handle avatar upload (base64) or clearing avatar
    if (avatarBase64) {
      try {
        const uploadedUrl = await uploadBase64ImageToSupabase(avatarBase64, 'avatars', `groups`);
        if (uploadedUrl) {
          group.avatar = uploadedUrl;
          group.icon = uploadedUrl;
        }
      } catch (e) {
        console.error('updateGroupSettings: avatar upload failed', e && e.message);
      }
    }

    if (clearAvatar) {
      group.avatar = '';
      group.icon = '';
    }

    // If promoteIds provided, add them to admins (only new ones)
    if (promoteIds && Array.isArray(promoteIds) && promoteIds.length) {
      group.admins = group.admins || [];
      for (const pid of promoteIds) {
        const idStr = String(pid);
        if (!group.admins.map(a => String(a)).includes(idStr)) {
          group.admins.push(pid);
        }
      }
    }

    // If removeIds provided, remove them from participants and admins
    if (removeIds && Array.isArray(removeIds) && removeIds.length) {
      const removeSet = new Set(removeIds.map(r => String(r)));
      group.participants = Array.isArray(group.participants) ? group.participants.filter(p => !removeSet.has(String(p))) : [];
      if (Array.isArray(group.admins)) {
        group.admins = group.admins.filter(a => !removeSet.has(String(a)));
      }
      // Optionally record leftBy/leftAt for audit
      try {
        group.leftBy = Array.isArray(group.leftBy) ? group.leftBy : [];
        group.leftAt = Array.isArray(group.leftAt) ? group.leftAt : [];
        for (const rid of removeIds) {
          group.leftBy.push(rid);
          group.leftAt.push(new Date());
        }
      } catch (e) {
        console.warn('updateGroupSettings: failed to record leftBy/leftAt', e && e.message);
      }
    }

    await group.save();

    // Also sync certain settings into the Chat document so UI components
    // that read chat.groupSettings will see the updates immediately.
    try {
      if (group.chat) {
        const setObj = {};
        const unsetObj = {};
        if (group.name !== undefined) {
          setObj['groupSettings.name'] = group.name;
          setObj['chatName'] = group.name;
          setObj['name'] = group.name;
        }
        if (group.inviteLink !== undefined) {
          if (group.inviteLink) setObj['groupSettings.inviteLink'] = group.inviteLink;
          else unsetObj['groupSettings.inviteLink'] = "";
        }
        if (inviteEnabled !== undefined) setObj['groupSettings.allowInvites'] = !!inviteEnabled;
        if (group.features) setObj['groupSettings.features'] = group.features;
        // sync avatar/icon changes to chat.groupSettings
        if (typeof group.avatar !== 'undefined') {
          if (group.avatar) setObj['groupSettings.avatar'] = group.avatar;
          else unsetObj['groupSettings.avatar'] = "";
        }

        const updateObj = {};
        if (Object.keys(setObj).length) updateObj.$set = setObj;
        if (Object.keys(unsetObj).length) updateObj.$unset = unsetObj;
        if (Object.keys(updateObj).length) {
          await Chat.findByIdAndUpdate(group.chat, updateObj);
        }
      }
    } catch (e) {
      console.error('Failed to sync group settings to Chat:', e);
    }

    // If promoteIds were provided, also ensure Chat.admins contains them
    try {
      if (promoteIds && Array.isArray(promoteIds) && promoteIds.length && group.chat) {
        await Chat.findByIdAndUpdate(group.chat, { $addToSet: { admins: { $each: promoteIds } } });
      }
      // If removeIds were provided, remove them from Chat participants and admins
      if (removeIds && Array.isArray(removeIds) && removeIds.length && group.chat) {
        await Chat.findByIdAndUpdate(group.chat, { $pull: { participants: { $in: removeIds }, admins: { $in: removeIds } } });
      }
    } catch (e) {
      console.error('Failed to sync promoted admins to Chat:', e);
    }

    // Emit socket event to notify participants that group settings changed
    try {
      const { getSocketIOInstance } = await import('../services/scheduledMessageCron.js');
      const io = getSocketIOInstance();
      const payload = { groupId: group._id, settings: { inviteEnabled: group.inviteEnabled, inviteLink: group.inviteLink, permissions: group.permissions, features: group.features } };

      // Create and emit system messages for promotions and removals
      try {
        const actor = await User.findById(userId).select('name avatar');
        const actorName = actor?.name || 'Someone';

        // Build admin id set (primary admin + admins array)
        const adminSetLocal = new Set();
        if (group.admin) adminSetLocal.add(String(group.admin));
        if (Array.isArray(group.admins)) group.admins.forEach(a => { if (a) adminSetLocal.add(String(a)); });
        const adminIdsLocal = Array.from(adminSetLocal);

        // Promotions: notify admins and the promoted users personally + group room
        if (promoteIds && Array.isArray(promoteIds) && promoteIds.length) {
          for (const pid of promoteIds) {
            try {
              const target = await User.findById(pid).select('name avatar');
              const targetName = target?.name || 'a member';
              const content = `${actorName} promoted ${targetName} to admin`;
              const created = await Message.create({ sender: userId, content, type: 'system', chat: group.chat });
              const populated = await Message.findById(created._id).populate('sender', 'name avatar email').populate('attachments').populate('chat');
              populated.skipPreview = true;
              if (io) {
                // emit to group room
                try { io.to(String(group.chat)).emit('message recieved', populated); } catch (e) {}
                // emit to admins and the promoted user
                const emitTargets = new Set([...adminIdsLocal, String(pid)]);
                emitTargets.forEach(id => { try { io.to(String(id)).emit('message recieved', populated); } catch (e) {} });
              }
            } catch (e) {
              console.warn('Failed to create promotion message for', pid, e && e.message);
            }
          }
        }

        // Removals: notify admins and the removed users personally + group room
        if (removeIds && Array.isArray(removeIds) && removeIds.length) {
          for (const rid of removeIds) {
            try {
              const target = await User.findById(rid).select('name avatar');
              const targetName = target?.name || 'a member';
              const content = `${actorName} removed ${targetName} from the group`;
              const created = await Message.create({ sender: userId, content, type: 'system', chat: group.chat });
              const populated = await Message.findById(created._id).populate('sender', 'name avatar email').populate('attachments').populate('chat');
              populated.skipPreview = true;
              if (io) {
                // emit to group room
                try { io.to(String(group.chat)).emit('message recieved', populated); } catch (e) {}
                // emit to admins and the removed user
                const emitTargets = new Set([...adminIdsLocal, String(rid)]);
                emitTargets.forEach(id => { try { io.to(String(id)).emit('message recieved', populated); } catch (e) {} });
              }
              // Emit 'removed from group' only to the removed user(s) provided
              // by the frontend. Do NOT broadcast this event to the room or
              // to other participants here.
              try {
                const safeId = (item) => {
                  if (!item) return null;
                  try {
                    if (typeof item === 'string') return item;
                    if (item._id) return String(item._id);
                    if (item.id) return String(item.id);
                    return String(item);
                  } catch (e) { return null; }
                };

                const payload = {
                  chatId: safeId(group.chat) || null,
                  groupId: safeId(group._id) || null,
                  removedUserId: String(rid),
                  message: `${targetName} was removed from the group`,
                  group: {
                    _id: group._id,
                    name: group.name,
                    participants: group.participants || [],
                  }
                };

                try {
                  io.to(String(rid)).emit('removed from group', payload);
                  console.log('[SOCKET] updateGroupSettings: emitted removed from group to', String(rid));
                } catch (e) {
                  console.warn('updateGroupSettings: emit to removed user failed', e && e.message);
                }
              } catch (e) {
                console.warn('updateGroupSettings: failed to construct removed payload', e && e.message);
              }
            } catch (e) {
              console.warn('Failed to create removal message for', rid, e && e.message);
            }
          }
        }
      } catch (e) {
        console.warn('Failed to create system messages for promotions/removals', e && e.message);
      }

      // Finally emit the settings update payload
      if (io && group.participants && Array.isArray(group.participants)) {
        group.participants.forEach(p => {
          try { io.to(String(p)).emit('group settings updated', payload); } catch (e) {}
        });
        try { io.to(String(group.chat)).emit('group settings updated', payload); } catch (e) {}
      }

      // Emit group info updated event with name and avatar for immediate UI sync
      if (io && group.participants && Array.isArray(group.participants)) {
        const updatePayload = {
          groupId: String(group._id),
          chatId: String(group.chat),
          name: group.name,
          avatar: group.avatar || group.icon || '',
          updatedAt: new Date()
        };
        console.log('[SOCKET] Emitting group info updated to all members:', updatePayload);
        console.log('[SOCKET] Participants:', group.participants.map(p => String(p)));
        
        // Emit to each participant's personal room (userId room)
        group.participants.forEach(p => {
          const participantId = String(p._id || p);
          try { 
            io.to(participantId).emit('group info updated', updatePayload);
            console.log(`[SOCKET] Emitted to participant room: ${participantId}`);
          } catch (e) {
            console.error(`[SOCKET] Failed to emit to ${participantId}:`, e);
          }
        });
      }
    } catch (e) {
      console.error('Failed to emit group settings update socket event:', e);
    }

    return ok(res, { message: 'Group settings updated', group });
  } catch (error) {
    console.error('Update group settings error:', error);
    err(res, error.message, 500);
  }
};

// ----------------------------
// GET GROUPS IN COMMON BETWEEN AUTH USER AND ANOTHER USER
// ----------------------------
export const getCommonGroups = async (req, res) => {
  try {
    const otherUserId = req.params.otherUserId || req.query.userId;
    const me = req.user && req.user._id;
    if (!me) return err(res, 'Unauthorized', 401);
    if (!otherUserId) return err(res, 'otherUserId is required', 400);

    // Find groups where both users are participants
    const groups = await Group.find({ participants: { $all: [String(me), String(otherUserId)] } })
      .limit(50)
      .select('name description avatar participants admins admin chat inviteLink inviteEnabled')
      .lean();

    // add participants count and minimal participant info where possible
    const out = groups.map(g => ({
      _id: g._id,
      name: g.name,
      description: g.description || '',
      avatar: g.avatar || g.icon || '',
      participantsCount: Array.isArray(g.participants) ? g.participants.length : 0,
      inviteEnabled: !!g.inviteEnabled,
      chat: g.chat,
    }));

    return ok(res, { groups: out });
  } catch (e) {
    console.error('getCommonGroups failed', e);
    return err(res, e.message, 500);
  }
};