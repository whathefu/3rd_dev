import client from "./client";

export const signup = (payload) => client.post("/users/register", payload);
export const login = (payload)  => client.post("/users/login", payload);
export const me    = ()         => client.get("/users/me");
export const logout = ()       => client.post("/users/logout");





