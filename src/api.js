import axios from "axios";
import { BASE_URL } from "./constants";

const API = axios.create({
    baseURL: `${BASE_URL}/api`,
    timeout: 10000,
    headers: { "Content-Type": "application/json", },
});
export default API;