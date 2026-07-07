import { http, HttpResponse } from "msw";
import { seedUsers } from "../fixtures/users";

export const usersHandlers = [http.get("*/users/me", () => HttpResponse.json(seedUsers[0]?.user))];
