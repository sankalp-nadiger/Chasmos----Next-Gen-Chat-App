// src/api/group.js
import axios from "axios";
const API_BASE_URL = "http://localhost:5000/api/chat/group"; // adjust your backend

export const createGroup = async ({ name, description, participants }) => {
  const res = await axios.post(
    `${API_BASE_URL}/create`,
    { name, description, participants },
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );

  return res.data;
};



export const regenerateInviteLink = async (groupId) => {
  const res = await axios.post(`${API_BASE_URL}/regenerate-invite-link`, { groupId }, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });
  return res.data;
};

export const addMember = async ({ groupId, userId }) => {
  const res = await axios.post(`${API_BASE_URL}/add-member`, { groupId, userId }, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });
  return res.data;
};

export const removeMember = async ({ groupId, memberId }) => {
  const res = await axios.post(`${API_BASE_URL}/remove-member`, { groupId, memberId }, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });
  return res.data;
};

export const promoteToAdmin = async ({ groupId, newAdminId }) => {
  const res = await axios.post(`${API_BASE_URL}/make-admin`, { groupId, newAdminId }, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });
  return res.data;
};

export const exitGroup = async ({ groupId }) => {
  const res = await axios.post(`${API_BASE_URL}/exit-group`, { groupId }, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });
  return res.data;
};

export const deleteGroup = async ({ groupId }) => {
  const res = await axios.post(`${API_BASE_URL}/delete-group`, { groupId }, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });
  return res.data;
};
