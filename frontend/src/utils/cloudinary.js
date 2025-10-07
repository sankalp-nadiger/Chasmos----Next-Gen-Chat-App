import axios from "axios";

export const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "chasmos_artsy");
  formData.append("cloud_name", "dootmkvvq");

  const response = await axios.post(
    "https://api.cloudinary.com/v1_1/dootmkvvq/image/upload",
    formData
  );
  return response.data.secure_url;
};
