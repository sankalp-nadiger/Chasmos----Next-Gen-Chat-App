import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice"; // example

const store = configureStore({
  reducer: {
    user: userReducer,
    // other slices
  },
});

export default store;
